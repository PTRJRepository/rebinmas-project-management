import { PrismaClient } from '@prisma/client';
import { sqlServerClient as apiClient } from './sql-server-client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Client (SQLite)
const prismaSQLite =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaSQLite;

// Database configuration - use API Gateway (SQL Server) or Prisma (SQLite)
const USE_SQL_SERVER = process.env.USE_SQL_SERVER === 'true';

// Unified database client interface
// When USE_SQL_SERVER=true, uses API Gateway to SQL Server
// When USE_SQL_SERVER=false or not set, uses Prisma with SQLite
export const db = USE_SQL_SERVER ? apiClient : prismaSQLite;

// For backwards compatibility
export const prisma = prismaSQLite;

// Log which database is being used
if (process.env.NODE_ENV === 'development') {
  console.log(`[DB] Using: ${USE_SQL_SERVER ? 'SQL Server (via API Gateway)' : 'SQLite (Prisma)'}`);
}
