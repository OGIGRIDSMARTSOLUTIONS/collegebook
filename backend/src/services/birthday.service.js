const prisma = require('../config/db');

function nextBirthdayDate(dateOfBirth, now = new Date()) {
  const month = dateOfBirth.getUTCMonth();
  const day = dateOfBirth.getUTCDate();
  const year = now.getUTCFullYear();
  const candidate = new Date(Date.UTC(year, month, day));
  const today = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()));
  if (candidate < today) candidate.setUTCFullYear(year + 1);
  return candidate;
}

async function listUpcomingBirthdays(institutionId, days = 14) {
  const students = await prisma.student.findMany({
    where: {
      institutionId,
      dateOfBirth: { not: null },
      privacy: { is: { showBirthday: true } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
      dateOfBirth: true,
      academicSet: { select: { name: true } },
      institution: { select: { name: true, shortName: true, logoUrl: true } },
    },
  });

  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
  return students
    .map((student) => ({
      ...student,
      birthdayDate: nextBirthdayDate(student.dateOfBirth, now),
      birthMonth: student.dateOfBirth.getUTCMonth() + 1,
      birthDay: student.dateOfBirth.getUTCDate(),
    }))
    .filter((student) => student.birthdayDate <= end)
    .sort((a, b) => a.birthdayDate - b.birthdayDate);
}

module.exports = { listUpcomingBirthdays };
