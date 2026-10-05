const { PrismaClient } = require('@prisma/client');

// Single shared Prisma instance across the app (avoids exhausting
// connections in dev with hot-reload, and is the standard pattern
// for a Node/Express + Prisma backend deployed on Render).
const prisma =
  global.__collegebookPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  global.__collegebookPrisma = prisma;
}

module.exports = prisma;
