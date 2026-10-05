const { Resend } = require('resend');

const isConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

const resend = isConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

module.exports = {
  resend,
  isEmailConfigured: () => isConfigured,
  fromAddress: () => process.env.RESEND_FROM_EMAIL,
};
