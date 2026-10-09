const { PrismaClient } = require('@prisma/client');
const { generateCode } = require('../src/utils/publicCode');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function seedInstitution({ institutionCode, name, shortName, location, facultyCode, facultyName, deptCode, deptName, setCode, setName }) {
  const institution = await prisma.institution.upsert({
    where: { institutionCode },
    update: {},
    create: {
      code: generateCode('INST'),
      institutionCode,
      name,
      shortName,
      location,
      status: 'ACTIVE',
      crossInstitutionPolicy: 'CONNECTION_ONLY',
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: facultyCode } },
    update: {},
    create: { institutionId: institution.id, code: facultyCode, name: facultyName },
  });

  const department = await prisma.department.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: deptCode } },
    update: {},
    create: { institutionId: institution.id, facultyId: faculty.id, code: deptCode, name: deptName },
  });

  let academicSet = await prisma.academicSet.findFirst({
    where: { institutionId: institution.id, code: setCode },
  });
  if (!academicSet) {
    academicSet = await prisma.academicSet.create({
      data: {
        code: setCode,
        institutionId: institution.id,
        departmentId: department.id,
        name: setName,
        kind: 'ADMISSION_COHORT',
        startYear: 2022,
        graduationYear: 2026,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`\n${name} (${institutionCode})`);
  console.log('  institutionId:', institution.id);
  console.log('  facultyCode:', facultyCode, '| deptCode:', deptCode, '| setCode:', academicSet.code);

  return { institution, faculty, department, academicSet };
}

async function seedAdmin({ email, password, role = 'INSTITUTION_ADMIN', institution, academicSet, firstName, lastName }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`  ${role} already exists: ${email}`);
    return existingUser;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      accountStatus: 'ACTIVE',
    },
  });

  await prisma.institutionStaff.create({
    data: {
      userId: user.id,
      institutionId: institution.id,
      firstName,
      lastName,
    },
  });

  console.log(`  ${role} created: ${email} / ${password}`);
  return user;
}

async function seedStudent({ email, password, institution, academicSet, department, firstName, lastName }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingStudent = await prisma.student.findUnique({ where: { userId: existingUser.id } });
    console.log(`  Student already exists: ${email} (studentId: ${existingStudent?.id})`);
    return { user: existingUser, student: existingStudent };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' },
  });

  const student = await prisma.student.create({
    data: {
      code: generateCode('STU'),
      userId: user.id,
      institutionId: institution.id,
      setId: academicSet.id,
      departmentId: department.id,
      facultyId: department.facultyId,
      firstName,
      lastName,
      verificationStatus: 'VERIFIED',
      privacy: { create: {} },
    },
  });

  console.log(`  Student created: ${email} / ${password} (studentId: ${student.id})`);
  return { user, student };
}

/**
 * seedSuperAdmin — deliberately has NO linked Student row, unlike
 * seedAdmin. A SUPER_ADMIN operates above any single institution, so it
 * has no institutionId to carry — auth.middleware.js already handles a
 * user with no student (studentId/institutionId simply come out null),
 * so no workaround is needed here the way seedAdmin needs one.
 */
async function seedSuperAdmin({ email, password }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`  Super admin already exists: ${email}`);
    return existingUser;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' },
  });

  console.log(`  Super admin created: ${email} / ${password}`);
  return user;
}

async function main() {
  await seedSuperAdmin({
    email: 'superadmin@collegebook.dev',
    password: 'superpass123',
  });

  // ── Institution 1: Grandplus College of Education ──
  const grandplus = await seedInstitution({
    institutionCode: 'GPLUSCOE',
    name: 'Grandplus College of Education',
    shortName: 'GPLUSCOE',
    location: 'Nigeria',
    facultyCode: 'SCI',
    facultyName: 'Faculty of Science',
    deptCode: 'CSC',
    deptName: 'Computer Science',
    setCode: 'SET_000001',
    setName: 'Computer Science Set 2026',
  });

  await seedAdmin({
    email: 'admin@grandplus.edu.ng',
    password: 'adminpass123',
    role: 'INSTITUTION_ADMIN',
    institution: grandplus.institution,
    academicSet: grandplus.academicSet,
    firstName: 'Grandplus',
    lastName: 'Admin',
  });

  await seedAdmin({
    email: 'moderator@grandplus.edu.ng',
    password: 'modpass123',
    role: 'INSTITUTION_MODERATOR',
    institution: grandplus.institution,
    academicSet: grandplus.academicSet,
    firstName: 'Grandplus',
    lastName: 'Moderator',
  });

  await seedAdmin({
    email: 'yearbook@grandplus.edu.ng',
    password: 'yearbookpass123',
    role: 'YEARBOOK_ADMIN',
    institution: grandplus.institution,
    academicSet: grandplus.academicSet,
    firstName: 'Grandplus',
    lastName: 'YearbookAdmin',
  });

  await seedStudent({
    email: 'grace@grandplus.edu.ng',
    password: 'password123',
    institution: grandplus.institution,
    academicSet: grandplus.academicSet,
    department: grandplus.department,
    firstName: 'Grace',
    lastName: 'Hopper',
  });

  await seedStudent({
    email: 'alan@grandplus.edu.ng',
    password: 'password123',
    institution: grandplus.institution,
    academicSet: grandplus.academicSet,
    department: grandplus.department,
    firstName: 'Alan',
    lastName: 'Turing',
  });

  // ── Institution 2: a second, unrelated institution ──
  const secondSchool = await seedInstitution({
    institutionCode: 'FUTA',
    name: 'Federal University of Technology, Akure',
    shortName: 'FUTA',
    location: 'Akure, Nigeria',
    facultyCode: 'ENG',
    facultyName: 'Faculty of Engineering',
    deptCode: 'MEE',
    deptName: 'Mechanical Engineering',
    setCode: 'SET_100001',
    setName: 'Mechanical Engineering Set 2026',
  });

  await seedAdmin({
    email: 'admin@futa.edu.ng',
    password: 'adminpass123',
    institution: secondSchool.institution,
    academicSet: secondSchool.academicSet,
    firstName: 'FUTA',
    lastName: 'Admin',
  });

  const { student: futaStudent } = await seedStudent({
    email: 'bola@futa.edu.ng',
    password: 'password123',
    institution: secondSchool.institution,
    academicSet: secondSchool.academicSet,
    department: secondSchool.department,
    firstName: 'Bola',
    lastName: 'Adeyemi',
  });

  await seedStudent({
    email: 'tesla@futa.edu.ng',
    password: 'password123',
    institution: secondSchool.institution,
    academicSet: secondSchool.academicSet,
    department: secondSchool.department,
    firstName: 'Nikola',
    lastName: 'Tesla',
  });

  await seedStudent({
    email: 'watt@futa.edu.ng',
    password: 'password123',
    institution: secondSchool.institution,
    academicSet: secondSchool.academicSet,
    department: secondSchool.department,
    firstName: 'James',
    lastName: 'Watt',
  });

  console.log('\n──────────────────────────────────────────');
  console.log('Tenant isolation test material ready:');
  console.log('  Super admin login: superadmin@collegebook.dev / superpass123 (creates institutions)');
  console.log('  Grandplus admin login: admin@grandplus.edu.ng / adminpass123');
  console.log('  Grandplus moderator login: moderator@grandplus.edu.ng / modpass123');
  console.log('  Grandplus yearbook admin login: yearbook@grandplus.edu.ng / yearbookpass123');
  console.log('  Grandplus student (Jane) — register/login as before, institutionCode GPLUSCOE');
  console.log('  Grandplus students: grace@grandplus.edu.ng / password123, alan@grandplus.edu.ng / password123');
  console.log('  FUTA admin login: admin@futa.edu.ng / adminpass123');
  console.log('  FUTA students: bola@futa.edu.ng, tesla@futa.edu.ng, watt@futa.edu.ng (all / password123)');
  console.log(`  FUTA student (outside the Grandplus admin's institution) — studentId: ${futaStudent?.id}`);
  console.log('──────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
