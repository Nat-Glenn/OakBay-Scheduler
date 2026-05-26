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

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (isNeonDatabaseUrl(databaseUrl)) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

/** Recreate client in dev after schema migrations (avoids stale global cache). */
function clientHasBookingRequests(client: PrismaClient): boolean {
  return (
    typeof (
      client as PrismaClient & {
        appointmentRequest?: { count?: unknown };
      }
    ).appointmentRequest?.count === "function"
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && clientHasBookingRequests(cached)) {
    return cached;
  }

  if (cached) {
    globalForPrisma.prisma = undefined;
  }

  const client = createPrismaClient();

  if (!clientHasBookingRequests(client)) {
    throw new Error(
      "Prisma client is missing booking request models. Run `npx prisma generate` and restart the dev server.",
    );
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
