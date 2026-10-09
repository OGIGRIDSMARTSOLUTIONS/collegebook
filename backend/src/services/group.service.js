const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const cache = require('./cache.service');

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profilePhotoUrl: true,
  institution: { select: { name: true, shortName: true } },
};

async function createGroup(actorContext, { name, description, kind }) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name,
        description,
        kind,
        institutionId: actorContext.institutionId,
        creatorId: actorContext.studentId,
      },
    });
    await tx.groupMembership.create({
      data: { groupId: group.id, studentId: actorContext.studentId, role: 'ADMIN' },
    });
    await cache.del(`groups:list:${actorContext.institutionId}:${actorContext.studentId}`);
    return group;
  });
}

async function getGroupOrThrow(groupId, viewerContext) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new ApiError('Group not found', 404);
  if (viewerContext?.institutionId && group.institutionId !== viewerContext.institutionId) throw new ApiError('Group not found', 404);

  if (group.kind === 'PRIVATE' && viewerContext?.studentId) {
    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_studentId: { groupId, studentId: viewerContext.studentId } },
    });
    if (!membership) throw new ApiError('Group not found', 404); // don't confirm existence of a private group to non-members
  } else if (group.kind === 'PRIVATE') {
    throw new ApiError('Group not found', 404);
  }

  return group;
}

/**
 * listDiscoverable — PUBLIC groups anyone can browse, plus any PRIVATE
 * groups the viewer already belongs to (so their own private groups don't
 * just disappear from a "my groups" view).
 */
async function listDiscoverable(viewerContext) {
  return cache.remember(`groups:list:${viewerContext.institutionId}:${viewerContext.studentId}`, 30, () => prisma.group.findMany({
    where: {
      institutionId: viewerContext.institutionId,
      OR: [
        { kind: 'PUBLIC' },
        { memberships: { some: { studentId: viewerContext.studentId } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  }));
}

async function getMembershipOrThrow(groupId, studentId) {
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  if (!membership) throw new ApiError('You are not a member of this group', 403);
  return membership;
}

async function assertModerator(groupId, studentId) {
  const membership = await getMembershipOrThrow(groupId, studentId);
  if (membership.role !== 'ADMIN' && membership.role !== 'MODERATOR') {
    throw new ApiError('Only group admins or moderators can do this', 403);
  }
  return membership;
}

/**
 * join — self-service, PUBLIC groups only. Joining a PRIVATE group
 * requires an existing admin/moderator to add you (addMember).
 */
async function join(groupId, studentId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new ApiError('Group not found', 404);
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { institutionId: true } });
  if (!student || student.institutionId !== group.institutionId) throw new ApiError('You can only join groups in your institution', 403);
  if (group.kind === 'PRIVATE') throw new ApiError('This group is private — you must be added by a member', 403);

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  if (existing) throw new ApiError('Already a member', 409);

  const created = await prisma.groupMembership.create({ data: { groupId, studentId, role: 'MEMBER' } });
  await cache.del(`groups:list:${student.institutionId}:${studentId}`);
  return created;
}

async function leave(groupId, studentId) {
  const membership = await getMembershipOrThrow(groupId, studentId);

  if (membership.role === 'ADMIN') {
    const otherAdmins = await prisma.groupMembership.count({
      where: { groupId, role: 'ADMIN', studentId: { not: studentId } },
    });
    if (otherAdmins === 0) {
      throw new ApiError('You are the only admin — promote another member before leaving', 400);
    }
  }

  await prisma.groupMembership.delete({ where: { id: membership.id } });
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { institutionId: true } });
  if (group) await cache.del(`groups:list:${group.institutionId}:${studentId}`);
  return { left: true };
}

async function addMember(actorContext, groupId, targetStudentId) {
  await assertModerator(groupId, actorContext.studentId);

  const student = await prisma.student.findUnique({ where: { id: targetStudentId } });
  if (!student) throw new ApiError('Student not found', 404);
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { institutionId: true } });
  if (!group || group.institutionId !== actorContext.institutionId || student.institutionId !== actorContext.institutionId) throw new ApiError('Student does not belong to this institution', 403);

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId: targetStudentId } },
  });
  if (existing) throw new ApiError('Already a member', 409);

  return prisma.groupMembership.create({ data: { groupId, studentId: targetStudentId, role: 'MEMBER' } });
}

async function removeMember(actorContext, groupId, targetStudentId) {
  await assertModerator(groupId, actorContext.studentId);

  const target = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId: targetStudentId } },
  });
  if (!target) throw new ApiError('That student is not a member', 404);
  if (target.role === 'ADMIN') throw new ApiError('Cannot remove an admin — demote them first', 400);

  await prisma.groupMembership.delete({ where: { id: target.id } });
  return { removed: true };
}

async function updateMemberRole(actorContext, groupId, targetStudentId, role) {
  await assertModerator(groupId, actorContext.studentId);
  if (targetStudentId === actorContext.studentId) throw new ApiError('Cannot change your own role', 400);

  const target = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId: targetStudentId } },
  });
  if (!target) throw new ApiError('That student is not a member', 404);

  return prisma.groupMembership.update({ where: { id: target.id }, data: { role } });
}

async function listMembers(groupId, viewerContext) {
  await getGroupOrThrow(groupId, viewerContext);
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { student: { select: MEMBER_SELECT } },
    orderBy: { joinedAt: 'asc' },
  });
  return memberships.map((m) => ({ ...m.student, role: m.role, joinedAt: m.joinedAt }));
}

module.exports = {
  createGroup,
  getGroupOrThrow,
  listDiscoverable,
  getMembershipOrThrow,
  join,
  leave,
  addMember,
  removeMember,
  updateMemberRole,
  listMembers,
};
