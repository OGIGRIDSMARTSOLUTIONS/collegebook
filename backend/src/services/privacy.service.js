const prisma = require('../config/db');

async function getOwnPrivacy(studentId) {
  return prisma.studentPrivacy.upsert({
    where: { studentId },
    update: {},
    create: { studentId }, // defaults from schema if somehow missing
  });
}

async function updateOwnPrivacy(studentId, data) {
  return prisma.studentPrivacy.upsert({
    where: { studentId },
    update: data,
    create: { studentId, ...data },
  });
}

module.exports = { getOwnPrivacy, updateOwnPrivacy };
