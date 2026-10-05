// Mirrors the backend's own requireRole(...) lists exactly — verified
// directly against backend/src/routes/institution.routes.js,
// broadcast.routes.js, yearbook.routes.js, report.routes.js,
// student.routes.js. Not every list includes SUPER_ADMIN or every staff
// role — this is deliberately copied fact-for-fact from the backend
// rather than assumed, since a mismatch here would just recreate the
// exact "nav shows something the role can't use" bug this exists to fix.
export const ADMIN_SECTION_ROLES = {
  dashboard: ['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'],
  structure: ['INSTITUTION_ADMIN'],
  students: ['INSTITUTION_ADMIN'],
  broadcasts: ['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'],
  events: ['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'],
  yearbook: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'YEARBOOK_ADMIN'],
  moderation: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'],
};

export const ADMIN_SECTION_PATHS = {
  dashboard: '/admin',
  structure: '/admin/structure',
  students: '/admin/students',
  broadcasts: '/admin/broadcasts',
  events: '/admin/events',
  yearbook: '/admin/yearbook',
  moderation: '/admin/moderation',
};
