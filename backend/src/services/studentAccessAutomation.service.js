const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');

function disconnect(studentId) {
  try {
    require('../websocket/socket').disconnectStudent(studentId);
  } catch (error) {
    console.warn('Socket disconnect unavailable:', error.message);
  }
}

/**
 * Withdraw or restore institution approval. Accounts NEVER expire because of
 * time, graduation, inactivity, or missing rows in a later spreadsheet.
 * Student and YearBook records are retained on withdrawal.
 */
async function updateApproval(institutionId, studentId, { approved, reason }, actorUserId) {
  if (!approved && !String(reason || '').trim()) {
    throw new ApiError('Reason for withdrawal is required', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: studentId, institutionId },
      select: {
        id: true,
        userId: true,
        registryApproved: true,
        user: { select: { accountStatus: true } },
      },
    });
    if (!student) throw new ApiError('Student not found in your institution', 404);

    await tx.student.update({
      where: { id: student.id },
      data: { registryApproved: approved },
    });

    // Approval withdrawal revokes CollegeBook access, not YearBook enrollment.
    // Never reactivate a suspended/banned account merely by restoring approval.
    let suspended = false;
    if (!approved && student.userId) {
      const changed = await tx.user.updateMany({
        where: { id: student.userId, accountStatus: 'ACTIVE' },
        data: { accountStatus: 'SUSPENDED', refreshTokenHash: null },
      });
      suspended = changed.count > 0;
    }

    await tx.studentAccessEvent.create({
      data: {
        institutionId,
        studentId,
        actorUserId,
        action: suspended ? 'WITHDRAW_AND_SUSPEND' : approved ? 'APPROVAL_GRANTED' : 'APPROVAL_WITHDRAWN',
        reason: String(reason || (approved ? 'Institution restored approval' : 'Institution withdrew approval')).trim(),
      },
    });

    return { id: student.id, registryApproved: approved, automaticallySuspended: suspended };
  });

  if (!approved) disconnect(studentId);
  return result;
}

module.exports = { updateApproval };
