/**
 * Public health check for uptime monitoring (Azure, load balancers).
 * Verifies the app can reach the database without requiring auth.
 */

import { prisma } from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: "ok",
      database: "connected",
      timestamp,
    });
  } catch (err) {
    console.error("[health] database check failed:", err);

    return Response.json(
      {
        status: "degraded",
        database: "disconnected",
        timestamp,
      },
      { status: 503 },
    );
  }
}
