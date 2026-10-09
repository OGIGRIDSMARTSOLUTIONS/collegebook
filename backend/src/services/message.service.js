const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const { canMessage } = require('./permission.service');
const cache = require('./cache.service');

const PARTICIPANT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profilePhotoUrl: true,
  institution: { select: { name: true, shortName: true } },
};

/**
 * §15–17 of the architecture doc collapse into one permission check here:
 * canMessage() already encodes "same set always allowed", "same
 * institution always allowed", and "cross-institution gated by the
 * receiving institution's policy + the receiver's own privacy setting".
 * A PRIVATE conversation is only ever created if that check passes.
 *
 * Note (scope): this covers 1:1 private messaging only. The doc's "Set
 * Group Chat" / "Institution" conversation TYPES are modeled in the
 * schema's ConversationType enum but not implemented here — a group
 * conversation needs a way to know WHICH set/institution it belongs to
 * (so membership can be kept in sync as students join), which the current
 * Conversation model has no field for. That's a schema addition for a
 * follow-up phase, not silently faked here.
 */
async function startOrGetPrivateConversation(senderContext, receiverId) {
  if (senderContext.studentId === receiverId) {
    throw new ApiError('Cannot start a conversation with yourself', 400);
  }

  const receiver = await prisma.student.findUnique({
    where: { id: receiverId },
    select: { id: true, institutionId: true, setId: true },
  });
  if (!receiver) throw new ApiError('Student not found', 404);

  const sender = {
    id: senderContext.studentId,
    institutionId: senderContext.institutionId,
    setId: senderContext.setId,
  };

  const allowed = await canMessage(sender, receiver);
  if (!allowed) throw new ApiError('You cannot message this student', 403);

  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'PRIVATE',
      AND: [
        { participants: { some: { studentId: sender.id } } },
        { participants: { some: { studentId: receiver.id } } },
      ],
    },
    include: { participants: { include: { student: { select: PARTICIPANT_SELECT } } } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: 'PRIVATE',
      participants: {
        create: [{ studentId: sender.id }, { studentId: receiver.id }],
      },
    },
    include: { participants: { include: { student: { select: PARTICIPANT_SELECT } } } },
  });
}

async function assertParticipant(conversationId, studentId) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_studentId: { conversationId, studentId } },
  });
  if (!participant) throw new ApiError('You are not part of this conversation', 403);
  return participant;
}

async function sendMessage(senderContext, conversationId, { body, attachmentUrl, mentions = [] }) {
  await assertParticipant(conversationId, senderContext.studentId);

  const cleanBody = body?.trim() || null;
  const normalizedMentions = Array.isArray(mentions) ? mentions : [];

  if (cleanBody && normalizedMentions.length) {
    const participantRows = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { studentId: true },
    });
    const participantIds = new Set(participantRows.map((row) => row.studentId));
    const mentionedIds = [...new Set(normalizedMentions.map((mention) => mention.studentId))];

    if (mentionedIds.some((studentId) => studentId === senderContext.studentId || !participantIds.has(studentId))) {
      throw new ApiError('You can only mention people in this conversation', 400);
    }

    const mentionedStudents = await prisma.student.findMany({
      where: {
        id: { in: mentionedIds },
        institutionId: senderContext.institutionId,
      },
      select: { id: true },
    });
    if (mentionedStudents.length !== mentionedIds.length) {
      throw new ApiError('One or more mentioned students cannot be reached from this institution', 403);
    }

    for (const mention of normalizedMentions) {
      if (mention.startOffset < 0 || mention.endOffset <= mention.startOffset || mention.endOffset > cleanBody.length) {
        throw new ApiError('Invalid mention position', 400);
      }
    }
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: senderContext.studentId,
      body: cleanBody,
      attachmentUrl,
      mentions: normalizedMentions.length
        ? {
            create: normalizedMentions.map((mention) => ({
              studentId: mention.studentId,
              startOffset: mention.startOffset,
              endOffset: mention.endOffset,
            })),
          }
        : undefined,
    },
    include: {
      sender: { select: PARTICIPANT_SELECT },
      mentions: { select: { studentId: true, startOffset: true, endOffset: true } },
    },
  });

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, studentId: { not: senderContext.studentId } },
    select: { studentId: true },
  });
  const mentionedIds = [...new Set(normalizedMentions.map((mention) => mention.studentId))];
  const notificationRows = [
    ...others.map((p) => ({
      recipientId: p.studentId,
      type: 'MESSAGE',
      payload: { conversationId, messageId: message.id, senderId: senderContext.studentId },
    })),
    ...mentionedIds.map((studentId) => ({
      recipientId: studentId,
      type: 'MENTION',
      payload: { conversationId, messageId: message.id, senderId: senderContext.studentId },
    })),
  ];
  if (notificationRows.length) await prisma.notification.createMany({ data: notificationRows });

  // Invalidate only the hot summaries affected by this write.
  await cache.del(
    `conversations:${senderContext.studentId}`,
    ...others.map((p) => `conversations:${p.studentId}`),
    ...notificationRows.map((n) => `notifications:unread:${n.recipientId}`)
  );
  return message;
}

async function listConversations(studentId) {
  return cache.remember(`conversations:${studentId}`, 12, async () => {
  const participations = await prisma.conversationParticipant.findMany({
    where: { studentId },
    include: {
      conversation: {
        include: {
          participants: { include: { student: { select: PARTICIPANT_SELECT } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  const results = await Promise.all(
    participations.map(async (p) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: studentId },
          deletedAt: null,
          createdAt: { gt: p.lastReadAt ?? new Date(0) },
        },
      });

      const otherParticipants = p.conversation.participants
        .filter((cp) => cp.studentId !== studentId)
        .map((cp) => cp.student);

      return {
        conversationId: p.conversationId,
        type: p.conversation.type,
        participants: otherParticipants,
        lastMessage: p.conversation.messages[0] ?? null,
        unreadCount,
      };
    })
  );

  results.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? 0;
    const bTime = b.lastMessage?.createdAt ?? 0;
    return new Date(bTime) - new Date(aTime);
  });

  return results;
  });
}

async function listMessages(conversationId, studentId, { page, pageSize }) {
  await assertParticipant(conversationId, studentId);

  const [items, total] = await prisma.$transaction([
    prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: { select: PARTICIPANT_SELECT },
        mentions: { select: { studentId: true, startOffset: true, endOffset: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.message.count({ where: { conversationId, deletedAt: null } }),
  ]);

  return { items: items.reverse(), total, page, pageSize };
}

async function markRead(conversationId, studentId) {
  await assertParticipant(conversationId, studentId);
  await prisma.conversationParticipant.update({
    where: { conversationId_studentId: { conversationId, studentId } },
    data: { lastReadAt: new Date() },
  });
  await cache.del(`conversations:${studentId}`);
  return { read: true };
}

module.exports = {
  startOrGetPrivateConversation,
  sendMessage,
  listConversations,
  listMessages,
  markRead,
  assertParticipant,
};
