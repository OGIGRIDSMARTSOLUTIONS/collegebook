const express = require('express');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter, registerVerificationLimiter } = require('../middleware/rateLimit.middleware');
const { registerSchema, loginSchema, googleLoginSchema, registrationDepartmentsSchema } = require('../validators/auth.validators');
const {
  registerHandler,
  registrationDepartmentsHandler,
  loginHandler,
  googleLoginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} = require('../controllers/auth.controller');

const router = express.Router();

// Tighter limit than the general API limiter — §39: auth endpoints are
// the ones worth protecting most against credential-stuffing/brute force.
// Matric number in, that school's departments out (no school is named).
router.post('/registration-departments', authLimiter, validate(registrationDepartmentsSchema), registrationDepartmentsHandler);
router.post('/register', authLimiter, registerVerificationLimiter, validate(registerSchema), registerHandler);
router.post('/login', authLimiter, validate(loginSchema), loginHandler);
router.post('/google', authLimiter, validate(googleLoginSchema), googleLoginHandler);
router.post('/refresh', authLimiter, refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

module.exports = router;

