const prisma = require('../config/db');

/**
 * Central authorization service — §7 of the architecture doc.
 * Nothing in controllers should hand-roll permission `if` statements;
 * everything routes through here so the rules stay in one place.
 */

const STAFF_ROLES = ['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN'];

async function getConnectionStatus(studentAId, studentBId) {
  if (studentAId === studentBId) return 'SELF';
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: studentAId, addresseeId: studentBId },
        { requesterId: studentBId, addresseeId: studentAId },
      ],
    },
  });
  return connection?.status ?? 'NONE';
}

/**
 * canMessage(sender, receiver) — sender/receiver are Student records
 * (with institution/set already loaded).
 */
async function canMessage(sender, receiver) {
  if (!sender || !receiver) return false;
  if (sender.id === receiver.id) return false;
  if (sender.institutionId !== receiver.institutionId) return false;

  const connectionStatus = await getConnectionStatus(sender.id, receiver.id);
  if (connectionStatus === 'BLOCKED') return false;

  // Same institution: students may message across departments and academic sets.
  return true;
}

/**
 * canViewProfile(viewer, profileOwner) — Student records with
 * institution/set loaded. `viewer` may be null (unauthenticated/public
 * request) — profileOwner's own privacy setting decides that case.
 * Blocking (either direction) wins over every privacy setting, including
 * EVERYONE — blocking is one of the inputs to the final permission (§31
 * of the architecture doc), not just a special case of CONNECTIONS_ONLY.
 */
async function canViewProfile(viewer, profileOwner) {
  if (!profileOwner) return false;
  if (viewer && viewer.id === profileOwner.id) return true;

  if (viewer && viewer.institutionId !== profileOwner.institutionId) return false;

  if (viewer) {
    const status = await getConnectionStatus(viewer.id, profileOwner.id);
    if (status === 'BLOCKED') return false;
  }

  const privacy = await prisma.studentPrivacy.findUnique({
    where: { studentId: profileOwner.id },
  });
  const rule = privacy?.whoCanViewProfile ?? 'EVERYONE';

  if (rule === 'EVERYONE') return true;
  if (!viewer) return false; // every other rule requires a known viewer

  if (rule === 'INSTITUTION_ONLY') return viewer.institutionId === profileOwner.institutionId;
  if (rule === 'SET_ONLY') return viewer.setId === profileOwner.setId;
  if (rule === 'CONNECTIONS_ONLY') {
    const status = await getConnectionStatus(viewer.id, profileOwner.id);
    return status === 'ACCEPTED';
  }
  return false;
}

/**
 * canViewGroupPost — group membership governs visibility entirely,
 * bypassing PostVisibility/institution/set/connections rules. PUBLIC
 * groups are visible to any authenticated viewer without needing to have
 * joined; PRIVATE groups require actual membership.
 */
async function canViewGroupPost(viewer, groupId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return false;
  if (viewer && viewer.institutionId !== group.institutionId) return false;
  if (group.kind === 'PUBLIC') return true;
  if (!viewer) return false;

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId: viewer.id } },
  });
  return !!membership;
}

async function isGroupModerator(studentId, groupId) {
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  return membership?.role === 'ADMIN' || membership?.role === 'MODERATOR';
}

/**
 * canViewPost(viewer, post, author) — post.visibility governs who besides
 * the author can see it. `viewer` may be null for public/unauthenticated
 * reads, which only PostVisibility.PUBLIC satisfies. A group post
 * (post.groupId set) bypasses all of this — see canViewGroupPost. For
 * non-group posts, blocking (either direction) wins over every visibility
 * level, PUBLIC included.
 */
async function canViewPost(viewer, post, author) {
  if (!post || post.deletedAt) return false;
  if (viewer && viewer.id === author.id) return true;
  if (post.groupId) return canViewGroupPost(viewer, post.groupId);

  if (viewer && viewer.institutionId !== author.institutionId) return false;

  if (viewer) {
    const status = await getConnectionStatus(viewer.id, author.id);
    if (status === 'BLOCKED') return false;
  }

  if (post.visibility === 'PUBLIC') return true;
  if (!viewer) return false;

  if (post.visibility === 'INSTITUTION') return viewer.institutionId === author.institutionId;
  if (post.visibility === 'SET') return viewer.setId === author.setId;
  if (post.visibility === 'CONNECTIONS') {
    const status = await getConnectionStatus(viewer.id, author.id);
    return status === 'ACCEPTED';
  }
  return false;
}

/**
 * canViewYearBook(student, yearBook) — §5.4 hard rule: a cross-institution
 * connection never grants YearBook access. Only same-institution membership
 * (plus the institution's own publish/isolation settings) does.
 */
function canViewYearBook(student, yearBook) {
  if (!student || !yearBook) return false;
  return student.institutionId === yearBook.institutionId;
}

function canEditYearBook(actorContext, yearBook) {
  if (actorContext.role === 'SUPER_ADMIN') return true;
  if (!['YEARBOOK_ADMIN', 'INSTITUTION_ADMIN'].includes(actorContext.role)) return false;
  return actorContext.institutionId === yearBook.institutionId;
}

function canBroadcast(actorContext, targetInstitutionId) {
  if (actorContext.role === 'SUPER_ADMIN') return true;
  if (!['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'].includes(actorContext.role)) return false;
  return actorContext.institutionId === targetInstitutionId;
}

function canManageStudents(actorContext, targetInstitutionId) {
  if (actorContext.role === 'SUPER_ADMIN') return true;
  if (actorContext.role !== 'INSTITUTION_ADMIN') return false;
  return actorContext.institutionId === targetInstitutionId;
}

function isInstitutionStaff(role) {
  return STAFF_ROLES.includes(role);
}

/**
 * canModerateContent(actorContext, contentInstitutionId) — used by report
 * review/moderation actions. A moderator can only act on content whose
 * institutionId matches their own — the same tenant-scope pattern as
 * canBroadcast/canManageStudents.
 */
function canModerateContent(actorContext, contentInstitutionId) {
  if (actorContext.role === 'SUPER_ADMIN') return true;
  if (!isInstitutionStaff(actorContext.role)) return false;
  return actorContext.institutionId === contentInstitutionId;
}

module.exports = {
  getConnectionStatus,
  canMessage,
  canViewProfile,
  canViewGroupPost,
  isGroupModerator,
  canViewPost,
  canViewYearBook,
  canEditYearBook,
  canBroadcast,
  canManageStudents,
  canModerateContent,
  isInstitutionStaff,
};
