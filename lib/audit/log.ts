/**
 * Append-only audit trail for staff access to patient and billing data (HIA s.63).
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSessionUser } from "@/lib/auth/resolveUser";
import type { AuditActionValue } from "@/lib/audit/constants";

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return req.headers.get("x-real-ip");
}

export type AuditLogInput = {
  req: Request;
  user: AppSessionUser;
  action: AuditActionValue;
  patientId?: number | null;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/** Never throws — audit failures must not block clinical workflows. */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const { req, user, action, patientId, resourceId, metadata } = input;

  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: user.dbUserId,
        userEmail: user.email ?? null,
        userRole: user.role,
        patientId: patientId ?? null,
        resourceId: resourceId ?? null,
        metadata: metadata ?? undefined,
        ipAddress: clientIp(req),
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log:", action, err);
  }
}
