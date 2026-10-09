const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { generalLimiter } = require('./middleware/rateLimit.middleware');
const prisma = require('./config/db');

const app = express();

// Performance diagnostics: exposes API duration in DevTools without changing response data.
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  const originalEnd = res.end;
  res.end = function performanceAwareEnd(...args) {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    if (!res.headersSent) res.setHeader('Server-Timing', `app;dur=${durationMs.toFixed(1)}`);
    if (durationMs >= 500 && process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn(`[slow-api] ${req.method} ${req.originalUrl} ${durationMs.toFixed(0)}ms`);
    }
    return originalEnd.apply(this, args);
  };
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // required for httpOnly cookie auth across origins
  })
);
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());
app.use('/api', generalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health/db', async (req, res) => {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'reachable', latencyMs: Date.now() - started });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
