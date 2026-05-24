/**
 * Parses JSON request bodies with Zod and returns a consistent 400 response on failure.
 */

import type { z } from "zod";
import { badRequest } from "@/lib/api";

export function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
):
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: Response } {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      response: badRequest("Validation failed", parsed.error.flatten()),
    };
  }

  return { ok: true, data: parsed.data };
}
