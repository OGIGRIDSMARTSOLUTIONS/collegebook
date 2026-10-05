const { resend, isEmailConfigured, fromAddress } = require('../config/resend');

/**
 * One message per real VerificationStatus value (see schema.prisma).
 * PENDING has no entry — an admin moving someone back to Pending is rare
 * enough, and ambiguous enough ("why am I pending again?"), that we
 * deliberately don't email it; every other transition is something a
 * student would actually want to know about the moment it happens.
 */
const STATUS_MESSAGES = {
  VERIFIED: {
    subject: "You're verified on CollegeBook ✅",
    body: (firstName, institutionName) =>
      `Hi ${firstName},\n\nYou're verified! You now have full access to CollegeBook at ${institutionName} — connect with classmates, join the conversation, and check out your institution's YearBook.\n\n— The CollegeBook team`,
  },
  SUSPENDED: {
    subject: 'Your CollegeBook account has been suspended',
    body: (firstName, institutionName) =>
      `Hi ${firstName},\n\nYour CollegeBook account at ${institutionName} has been suspended by an administrator. If you believe this is a mistake, please contact your institution's admin directly.\n\n— The CollegeBook team`,
  },
  GRADUATED: {
    subject: "Congratulations — you're marked as graduated! 🎓",
    body: (firstName, institutionName) =>
      `Hi ${firstName},\n\nCongratulations on graduating from ${institutionName}! Your CollegeBook account has been updated to reflect your graduated status.\n\n— The CollegeBook team`,
  },
  ALUMNI: {
    subject: "You're now part of the CollegeBook alumni network",
    body: (firstName, institutionName) =>
      `Hi ${firstName},\n\nYour account at ${institutionName} has been moved to alumni status — welcome to the network! You can still connect with old classmates and stay in touch.\n\n— The CollegeBook team`,
  },
};

/**
 * sendVerificationStatusEmail — best-effort by design. The caller
 * (student.service.js's adminUpdateStudent) wraps this in its own
 * try/catch so a failed email can never turn an already-successful
 * status change into an error for the admin.
 */
async function sendVerificationStatusEmail({ to, firstName, status, institutionName }) {
  if (!isEmailConfigured()) {
    console.warn('Resend is not configured — skipping status-change email');
    return;
  }

  const message = STATUS_MESSAGES[status];
  if (!message) return; // PENDING, or any future status with no defined message

  await resend.emails.send({
    from: fromAddress(),
    to,
    subject: message.subject,
    text: message.body(firstName, institutionName),
  });
}

module.exports = { sendVerificationStatusEmail };
