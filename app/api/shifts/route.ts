/**
 * Provider shifts — list by date range (all staff) or set a provider's day (admin).
 */

import { prisma } from "@/lib/prisma";
import { withAuthSimple, withRoles } from "@/lib/withAuth";
import { AppRole } from "@/lib/auth/roles";
import { badRequest, notFound, serverError } from "@/lib/api";
import { parseBody } from "@/lib/validation/parseBody";
import {
  setProviderDaySchema,
  shiftRangeQuerySchema,
} from "@/lib/shifts/schemas";
import {
  clinicDatePartsFromParam,
  clinicClockToUtc,
  defaultShiftBounds,
  shiftDateOnly,
} from "@/lib/shifts/clinicShiftTime";
import { getShiftsBetween } from "@/lib/shifts/availability";
import { serializeShift } from "@/lib/shifts/serialize";
import { ClinicDbRole, SCHEDULER_STAFF_ROLES } from "@/lib/auth/constants";
import { isClinicOpenOnDate } from "@/lib/clinic/officeHours.js";

export const GET = withAuthSimple(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return badRequest("Query params from and to (YYYY-MM-DD) are required.");
    }

    const parsed = shiftRangeQuerySchema.safeParse({ from, to });
    if (!parsed.success) {
      return badRequest("Invalid date range.", parsed.error.flatten());
    }

    const shifts = await getShiftsBetween(parsed.data.from, parsed.data.to);
    return Response.json(shifts.map(serializeShift));
  } catch (err) {
    console.error(err);
    return serverError("Failed to load shifts");
  }
});

export const PUT = withRoles([AppRole.ADMIN], async (req, user) => {
  try {
    const body = await req.json();
    const parsed = parseBody(setProviderDaySchema, body);
    if (!parsed.ok) return parsed.response;

    const {
      date,
      providerId,
      working,
      startClock,
      endClock,
      notes = null,
    } = parsed.data;

    const parts = clinicDatePartsFromParam(date);
    if (!parts) {
      return badRequest("Invalid date.");
    }

    const provider = await prisma.user.findFirst({
      where: {
        id: providerId,
        role: { in: [...SCHEDULER_STAFF_ROLES] },
      },
      select: { id: true, name: true },
    });

    if (!provider) {
      return notFound("Chiropractor not found");
    }

    const day = shiftDateOnly(parts);

    await prisma.providerShift.deleteMany({
      where: { providerId, shiftDate: day },
    });

    if (!working) {
      return Response.json({ working: false, providerId, date });
    }

    if (!isClinicOpenOnDate(date)) {
      return badRequest("The clinic is closed on this day.");
    }

    const defaults = defaultShiftBounds(parts);
    const startTime = clinicClockToUtc(
      parts,
      startClock ?? defaults.startClock,
    );
    const endTime = clinicClockToUtc(parts, endClock ?? defaults.endClock);

    const shift = await prisma.providerShift.create({
      data: {
        providerId,
        shiftDate: day,
        startTime,
        endTime,
        notes,
        updatedByUserId: user.dbUserId,
      },
      include: {
        provider: { select: { id: true, name: true, email: true } },
      },
    });

    return Response.json(serializeShift(shift));
  } catch (err) {
    console.error(err);
    return serverError("Failed to update shift");
  }
});
