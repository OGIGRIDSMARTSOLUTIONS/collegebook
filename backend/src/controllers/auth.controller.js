const authService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');
const { created, ok } = require('../utils/apiResponse');

async function registrationDepartmentsHandler(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store'); // departments change as admins add them
    return ok(res, await authService.registrationDepartments(req.body));
  } catch (err) {
    next(err);
  }
}

async function registerHandler(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return created(res, {
      id: user.id,
      email: user.email,
      accountStatus: user.accountStatus,
      message: 'Registered. Awaiting institution verification.',
    });
  } catch (err) {
    next(err);
  }
}

async function loginHandler(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setAuthCookies(res, { accessToken, refreshToken });
    return ok(res, { id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
}

async function googleLoginHandler(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.loginWithGoogle(req.body.credential);
    setAuthCookies(res, { accessToken, refreshToken });
    return ok(res, { id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
}

async function refreshHandler(req, res, next) {
  try {
    const { accessToken } = await authService.refresh(req.cookies?.refreshToken);
    setAuthCookies(res, { accessToken });
    return ok(res, { refreshed: true });
  } catch (err) {
    next(err);
  }
}

async function logoutHandler(req, res) {
  clearAuthCookies(res);
  return ok(res, { loggedOut: true });
}

async function meHandler(req, res) {
  return ok(res, req.context);
}

module.exports = { registerHandler, registrationDepartmentsHandler, loginHandler, googleLoginHandler, refreshHandler, logoutHandler, meHandler };
