/**
 * Shared Prisma client for API routes and scripts.
 * Uses the Neon serverless adapter when DATABASE_URL points at Neon so idle
 * compute / closed TCP sockets do not surface as repeated prisma:error logs.
 */

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isNeonDatabaseUrl(url: string): boolean {
  return url.includes("neon.tech");
}

function warnNeonConnectionUrl(url: string) {
  if (process.env.NODE_ENV === "production" || !isNeonDatabaseUrl(url)) {
    return;
  }

  if (!url.includes("-pooler.")) {
    console.warn(
      "[prisma] Use Neon’s pooled connection string (-pooler in the hostname) for DATABASE_URL in .env.local.",
    );
  }

  if (!url.includes("connect_timeout=")) {
    console.warn(
      "[prisma] Add connect_timeout=15 to DATABASE_URL so Neon can wake from idle sleep without timing out.",
    );
  }
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  warnNeonConnectionUrl(databaseUrl);

  const log =
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as const)
      : (["error"] as const);

  if (isNeonDatabaseUrl(databaseUrl)) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
