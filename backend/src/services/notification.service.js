const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');

async function listNotifications(studentId, { page, pageSize }) {
  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { recipientId: studentId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { recipientId: studentId } }),
  ]);
  return { items, total, page, pageSize };
}

// §22 Unread System — a cheap indexed count query, not a full table scan;
// the frontend polls/sockets this into a badge rather than recomputing
// from the full notification list.
async function getUnreadCount(studentId) {
  const count = await prisma.notification.count({
    where: { recipientId: studentId, readAt: null },
  });
  return { unreadCount: count };
}

async function markAsRead(studentId, notificationId) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.recipientId !== studentId) {
    throw new ApiError('Notification not found', 404);
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

async function markAllAsRead(studentId) {
  const result = await prisma.notification.updateMany({
    where: { recipientId: studentId, readAt: null },
    data: { readAt: new Date() },
  });
  return { markedRead: result.count };
}

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead };
