const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');

async function sendRequest(requesterId, addresseeId) {
  if (requesterId === addresseeId) throw new ApiError('Cannot connect with yourself', 400);

  const addressee = await prisma.student.findUnique({ where: { id: addresseeId } });
  if (!addressee) throw new ApiError('Student not found', 404);

  const requester = await prisma.student.findUnique({ where: { id: requesterId }, select: { institutionId: true } });
  if (!requester || requester.institutionId !== addressee.institutionId) {
    throw new ApiError('You can only connect with students from your institution', 403);
  }

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'BLOCKED') throw new ApiError('Unable to connect with this student', 403);
    if (existing.status === 'ACCEPTED') throw new ApiError('Already connected', 409);
    if (existing.status === 'PENDING') throw new ApiError('Connection request already pending', 409);
    // REJECTED — allow a fresh request by resetting it.
    return prisma.connection.update({
      where: { id: existing.id },
      data: { requesterId, addresseeId, status: 'PENDING' },
    });
  }

  return prisma.connection.create({
    data: { requesterId, addresseeId, status: 'PENDING' },
  });
}

async function respondToRequest(studentId, requesterId, action) {
  const connection = await prisma.connection.findUnique({
    where: { requesterId_addresseeId: { requesterId, addresseeId: studentId } },
  });
  if (!connection || connection.status !== 'PENDING') {
    throw new ApiError('No pending request from this student', 404);
  }

  return prisma.connection.update({
    where: { id: connection.id },
    data: { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' },
  });
}

async function cancelOrRemove(studentId, otherStudentId) {
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: studentId, addresseeId: otherStudentId },
        { requesterId: otherStudentId, addresseeId: studentId },
      ],
    },
  });
  if (!connection) throw new ApiError('No connection found', 404);

  await prisma.connection.delete({ where: { id: connection.id } });
  return { removed: true };
}

async function block(blockerId, blockedId) {
  if (blockerId === blockedId) throw new ApiError('Cannot block yourself', 400);

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: blockerId, addresseeId: blockedId },
        { requesterId: blockedId, addresseeId: blockerId },
      ],
    },
  });

  if (existing) {
    return prisma.connection.update({
      where: { id: existing.id },
      // Normalize so the blocker is always `requesterId` on a BLOCKED row —
      // getConnectionStatus() only checks status, not direction, so this is
      // for readability/auditing, not correctness.
      data: { requesterId: blockerId, addresseeId: blockedId, status: 'BLOCKED' },
    });
  }

  return prisma.connection.create({
    data: { requesterId: blockerId, addresseeId: blockedId, status: 'BLOCKED' },
  });
}

const CONNECTION_STUDENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profilePhotoUrl: true,
  institution: { select: { name: true, shortName: true } },
  academicSet: { select: { name: true } },
};

async function listConnections(studentId, status = 'ACCEPTED') {
  const connections = await prisma.connection.findMany({
    where: {
      status,
      OR: [{ requesterId: studentId }, { addresseeId: studentId }],
    },
    include: {
      requester: { select: CONNECTION_STUDENT_SELECT },
      addressee: { select: CONNECTION_STUDENT_SELECT },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Return the *other* student in each connection, not the raw row.
  return connections.map((c) => (c.requesterId === studentId ? c.addressee : c.requester));
}

async function listPendingReceived(studentId) {
  const connections = await prisma.connection.findMany({
    where: { addresseeId: studentId, status: 'PENDING' },
    include: { requester: { select: CONNECTION_STUDENT_SELECT } },
    orderBy: { createdAt: 'desc' },
  });
  return connections.map((c) => c.requester);
}

module.exports = {
  sendRequest,
  respondToRequest,
  cancelOrRemove,
  block,
  listConnections,
  listPendingReceived,
};
