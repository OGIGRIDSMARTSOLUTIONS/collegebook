const isProd = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax', // cross-subdomain (Vercel <-> Render) needs 'none' in prod
};

/**
 * parseCookieHeader — minimal cookie-header parser used by the Socket.IO
 * handshake, which doesn't go through Express's cookie-parser middleware.
 * Avoids pulling in an extra dependency for something this small.
 */
function parseCookieHeader(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = decodeURIComponent(pair.slice(idx + 1).trim());
    out[key] = value;
  });
  return out;
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...baseCookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', baseCookieOptions);
  res.clearCookie('refreshToken', baseCookieOptions);
}

module.exports = { setAuthCookies, clearAuthCookies, parseCookieHeader };
