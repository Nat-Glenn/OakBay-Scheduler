/**
 * Public POST creates a booking request; staff GET lists pending requests.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthSimple } from "@/lib/withAuth";
import { badRequest, serverError } from "@/lib/api";
import { parseBody } from "@/lib/validation/parseBody";
import { createBookingRequestSchema } from "@/lib/booking-requests/schemas";
import {
  isPreferenceInFuture,
  preferenceToTimeRange,
} from "@/lib/booking-requests/times";
import { cleanField, hasUnsafeLanguage } from "@/lib/profanity";
import { sendRequestReceivedEmail } from "@/lib/email";
import { formatPreferenceLabel } from "@/lib/booking-requests/serialize";
import { serializeBookingRequest } from "@/lib/booking-requests/serialize";
import {
  findPatientByEmailForReturning,
  hasPendingBookingRequestForEmail,
  requestInclude,
} from "@/lib/booking-requests/service";
import { isPublicRequestSlotAvailable } from "@/lib/booking-requests/availability";
import {
  BOOKING_PATIENT_KIND,
  BOOKING_REQUEST_ERRORS,
  BOOKING_REQUEST_RATE_LIMIT_PER_HOUR,
} from "@/lib/booking-requests/constants";
import { AppointmentRequestStatus } from "@prisma/client";
import type { BookingPatientKind } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = parseBody(createBookingRequestSchema, body);
    if (!parsed.ok) return parsed.response;

    if (body.website?.trim()) {
      return badRequest("Invalid submission");
    }

    const {
      patientKind,
      email,
      type,
      message,
      preferredProviderName,
      preferences,
    } = parsed.data;

    if (
      hasUnsafeLanguage(message) ||
      hasUnsafeLanguage(preferredProviderName)
    ) {
      return badRequest("Unsafe or threatening language is not allowed");
    }

    const normalizedEmail = email.toLowerCase();

    let firstName: string;
    let lastName: string;
    let phone: string;
    let dbPatientKind: BookingPatientKind;

    if (patientKind === BOOKING_PATIENT_KIND.RETURNING) {
      const existingPatient = await findPatientByEmailForReturning(normalizedEmail);
      if (!existingPatient) {
        return NextResponse.json(
          { error: BOOKING_REQUEST_ERRORS.returningNotFound },
          { status: 404 },
        );
      }
      firstName = existingPatient.firstName;
      lastName = existingPatient.lastName;
      phone = existingPatient.phone;
      dbPatientKind = BOOKING_PATIENT_KIND.RETURNING as BookingPatientKind;
    } else {
      const existingPatient = await findPatientByEmailForReturning(normalizedEmail);
      if (existingPatient) {
        return NextResponse.json(
          { error: BOOKING_REQUEST_ERRORS.newPatientEmailExists },
          { status: 409 },
        );
      }
      firstName = parsed.data.firstName;
      lastName = parsed.data.lastName;
      phone = parsed.data.phone;
      dbPatientKind = BOOKING_PATIENT_KIND.NEW as BookingPatientKind;
    }

    if (await hasPendingBookingRequestForEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: BOOKING_REQUEST_ERRORS.pendingExists },
        { status: 409 },
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.appointmentRequest.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= BOOKING_REQUEST_RATE_LIMIT_PER_HOUR) {
      return NextResponse.json(
        { error: BOOKING_REQUEST_ERRORS.rateLimited },
        { status: 429 },
      );
    }

    const uniqueKeys = new Set<string>();
    const resolvedPrefs: Array<{
      startTime: Date;
      endTime: Date;
      sortOrder: number;
    }> = [];

    for (let i = 0; i < preferences.length; i++) {
      const pref = preferences[i];
      const key = `${pref.date}-${pref.clock}`;
      if (uniqueKeys.has(key)) {
        return badRequest("Duplicate preferred times are not allowed");
      }
      uniqueKeys.add(key);

      let range;
      try {
        range = preferenceToTimeRange(pref.date, pref.clock);
      } catch {
        return badRequest("Invalid preferred time");
      }

      if (!isPreferenceInFuture(range.startTime)) {
        return badRequest("Preferred times must be in the future");
      }

      const slotOpen = await isPublicRequestSlotAvailable(pref.date, pref.clock);
      if (!slotOpen) {
        return badRequest(
          "One or more preferred times are no longer available. Please choose another date or time.",
        );
      }

      resolvedPrefs.push({
        ...range,
        sortOrder: i + 1,
      });
    }

    const request = await prisma.appointmentRequest.create({
      data: {
        patientKind: dbPatientKind,
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        type,
        message: cleanField(message),
        preferredProviderName: cleanField(preferredProviderName),
        preferences: {
          create: resolvedPrefs,
        },
      },
      include: requestInclude,
    });

    const preferenceLabels = request.preferences.map(formatPreferenceLabel);

    sendRequestReceivedEmail({
      to: request.email,
      patientName: `${request.firstName} ${request.lastName}`,
      appointmentType: request.type,
      preferenceLabels,
    }).catch((err) => console.error("Request received email failed:", err));

    return NextResponse.json(serializeBookingRequest(request), { status: 201 });
  } catch (err) {
    console.error("POST /api/booking-requests failed:", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to submit request";
    return serverError(message);
  }
}

export const GET = withAuthSimple(async (req) => {
  try {
    const statusParam = new URL(req.url).searchParams.get("status");
    const status =
      statusParam &&
      Object.values(AppointmentRequestStatus).includes(
        statusParam as AppointmentRequestStatus,
      )
        ? (statusParam as AppointmentRequestStatus)
        : AppointmentRequestStatus.PENDING;

    const requests = await prisma.appointmentRequest.findMany({
      where: { status },
      include: {
        ...requestInclude,
        reviewedBy: { select: { id: true, name: true } },
        appointment: {
          select: { id: true, startTime: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(requests.map(serializeBookingRequest));
  } catch (err) {
    console.error(err);
    return serverError("Failed to load requests");
  }
});
