const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');

const EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  eventDate: true,
  endDate: true,
  location: true,
  category: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
};

async function listPublished(institutionId, { upcoming = true } = {}) {
  const where = { institutionId, isPublished: true };
  if (upcoming) where.eventDate = { gte: new Date() };
  return prisma.institutionEvent.findMany({ where, select: EVENT_SELECT, orderBy: { eventDate: 'asc' }, take: 50 });
}

async function listAdmin(institutionId) {
  return prisma.institutionEvent.findMany({ where: { institutionId }, select: EVENT_SELECT, orderBy: { eventDate: 'asc' } });
}

async function create(institutionId, userId, data) {
  return prisma.institutionEvent.create({
    data: { institutionId, createdByUserId: userId, ...data, eventDate: new Date(data.eventDate), endDate: data.endDate ? new Date(data.endDate) : null },
    select: EVENT_SELECT,
  });
}

async function update(institutionId, id, data) {
  const existing = await prisma.institutionEvent.findFirst({ where: { id, institutionId }, select: { id: true } });
  if (!existing) throw new ApiError('Event not found', 404);
  return prisma.institutionEvent.update({
    where: { id },
    data: { ...data, ...(data.eventDate ? { eventDate: new Date(data.eventDate) } : {}), ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}) },
    select: EVENT_SELECT,
  });
}

async function remove(institutionId, id) {
  const existing = await prisma.institutionEvent.findFirst({ where: { id, institutionId }, select: { id: true } });
  if (!existing) throw new ApiError('Event not found', 404);
  await prisma.institutionEvent.delete({ where: { id } });
  return { deleted: true };
}

module.exports = { listPublished, listAdmin, create, update, remove };
