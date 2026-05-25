/**
 * Public appointment request form — up to 4 preferred times, confirmation email on submit.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import FieldError from "@/components/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import {
  fetchBookableDates,
  fetchBookableSlotsForDate,
  isDateBookable,
  parseApiDateToPickerDate,
  startOfToday,
} from "@/lib/booking-requests/clientAvailability";
import { isClinicOpenOnDate } from "@/lib/appointments/status";
import {
  BOOKING_PATIENT_KIND,
  MAX_BOOKING_PREFERENCES,
  PUBLIC_BOOKING_TYPES,
} from "@/lib/booking-requests/constants";
import { createBookingRequestSchema } from "@/lib/booking-requests/schemas";
import { formatPickerDateForApi } from "@/lib/appointments/clinicTime.js";
import {
  formatNorthAmericanPhone,
  NORTH_AMERICAN_PHONE_DISPLAY_MAX,
} from "@/lib/formatting/phone";
import {
  PERSON_NAME_MAX_LENGTH,
  sanitizePersonNameInput,
} from "@/lib/formatting/names";
import { zodFieldErrors } from "@/lib/validation/zodFieldErrors";

const EMAIL_MAX_LENGTH = 254;
const PROVIDER_NAME_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 500;

export default function BookPage() {
  const phoneInputRef = useRef(null);
  const [patientKind, setPatientKind] = useState(BOOKING_PATIENT_KIND.NEW);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [preferredProviderName, setPreferredProviderName] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [bookableDates, setBookableDates] = useState([]);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const bookableDateSet = useMemo(
    () => new Set(bookableDates),
    [bookableDates],
  );
  const today = useMemo(() => startOfToday(), []);

  const calendarDisabled = useCallback(
    (day) => {
      if (day < today) return true;
      const iso = formatPickerDateForApi(day);
      if (!isClinicOpenOnDate(iso)) return true;
      return !bookableDateSet.has(iso);
    },
    [bookableDateSet, today],
  );

  const ensureSlotsForDate = useCallback(
    async (dateIso) => {
      if (slotsByDate[dateIso]) return slotsByDate[dateIso];
      const slots = await fetchBookableSlotsForDate(dateIso);
      setSlotsByDate((prev) => ({ ...prev, [dateIso]: slots }));
      return slots;
    },
    [slotsByDate],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setError("");
      try {
        const dates = await fetchBookableDates();
        if (cancelled) return;

        setBookableDates(dates);

        if (dates.length === 0) {
          setPreferences([]);
          return;
        }

        const firstIso = dates[0];
        const slots = await fetchBookableSlotsForDate(firstIso);
        if (cancelled) return;

        setSlotsByDate({ [firstIso]: slots });
        setPreferences([
          {
            date: parseApiDateToPickerDate(firstIso),
            clock: slots[0] ?? "",
          },
        ]);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Could not load available appointment times. Please try again later.",
          );
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const isReturning = patientKind === BOOKING_PATIENT_KIND.RETURNING;

  const buildPayload = () => {
    const base = {
      patientKind,
      email: email.trim(),
      type,
      message: message.trim() || null,
      preferredProviderName: preferredProviderName.trim() || null,
      website,
      preferences: preferences.map((p) => ({
        date: formatPickerDateForApi(p.date),
        clock: p.clock,
      })),
    };

    if (isReturning) {
      return base;
    }

    return {
      ...base,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    };
  };

  const handlePatientKindChange = (kind) => {
    setPatientKind(kind);
    setError("");
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.firstName;
      delete next.lastName;
      delete next.phone;
      delete next.email;
      return next;
    });
  };

  const handlePhoneChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart;
    const formatted = formatNorthAmericanPhone(rawValue);
    const diff = formatted.length - rawValue.length;

    setPhone(formatted);
    clearFieldError("phone");

    requestAnimationFrame(() => {
      const newPos = Math.max(0, (cursorPos ?? formatted.length) + diff);
      phoneInputRef.current?.setSelectionRange(newPos, newPos);
    });
  };

  const addPreference = async () => {
    if (preferences.length >= MAX_BOOKING_PREFERENCES) return;
    if (bookableDates.length === 0) return;

    const dateIso = bookableDates[0];
    const slots = await ensureSlotsForDate(dateIso);
    setPreferences((prev) => [
      ...prev,
      {
        date: parseApiDateToPickerDate(dateIso),
        clock: slots[0] ?? "",
      },
    ]);
  };

  const handlePreferenceDateChange = async (index, date) => {
    if (!date || !isDateBookable(date, bookableDateSet)) return;

    const dateIso = formatPickerDateForApi(date);
    const slots = await ensureSlotsForDate(dateIso);

    setPreferences((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              date,
              clock: slots.includes(p.clock) ? p.clock : (slots[0] ?? ""),
            }
          : p,
      ),
    );
    clearFieldError("preferences");
  };

  const removePreference = (index) => {
    if (preferences.length <= 1) return;
    setPreferences((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePreference = (index, field, value) => {
    setPreferences((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const payload = buildPayload();
    const validation = createBookingRequestSchema.safeParse(payload);

    if (!validation.success) {
      setFieldErrors(zodFieldErrors(validation.error));
      setError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const detail =
          data.details?.fieldErrors &&
          Object.entries(data.details.fieldErrors)
            .flatMap(([field, msgs]) =>
              (msgs ?? []).map((m) => `${field}: ${m}`),
            )
            .join(" ");
        if (data.details?.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(data.details.fieldErrors).flatMap(([field, msgs]) =>
                msgs?.[0] ? [[field, msgs[0]]] : [],
              ),
            ),
          );
        }
        throw new Error(
          detail || data.error || "Failed to submit request",
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout title="Request received">
        <div className="rounded-lg border border-border bg-card px-6 py-10 text-center text-card-foreground shadow-sm">
          <CheckCircle2 className="mx-auto size-10 text-[#5a8f3a]" />
          <p className="mt-4 text-sm text-foreground">
            Thank you. We will confirm your appointment by email.
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      title="Request an appointment"
      subtitle="Select up to four preferred times."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6"
      >
        <fieldset className="space-y-3">
          <legend className="sr-only">Contact information</legend>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2d5016]/80">
            Contact
          </p>

          <div
            className="inline-flex w-full rounded-md border border-border p-0.5 sm:w-auto"
            role="group"
            aria-label="Patient type"
          >
            <Button
              type="button"
              variant="ghost"
              className={`h-9 flex-1 rounded-[5px] px-4 text-sm font-medium sm:flex-none ${
                patientKind === BOOKING_PATIENT_KIND.NEW
                  ? "bg-[#2d5016] text-white shadow-sm hover:bg-[#243f12] hover:text-white"
                  : "text-foreground hover:bg-muted"
              }`}
              onClick={() =>
                handlePatientKindChange(BOOKING_PATIENT_KIND.NEW)
              }
            >
              New patient
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`h-9 flex-1 rounded-[5px] px-4 text-sm font-medium sm:flex-none ${
                patientKind === BOOKING_PATIENT_KIND.RETURNING
                  ? "bg-[#2d5016] text-white shadow-sm hover:bg-[#243f12] hover:text-white"
                  : "text-foreground hover:bg-muted"
              }`}
              onClick={() =>
                handlePatientKindChange(BOOKING_PATIENT_KIND.RETURNING)
              }
            >
              Returning
            </Button>
          </div>

          {isReturning ? (
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                maxLength={EMAIL_MAX_LENGTH}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                className="border-border bg-background"
              />
              <FieldError message={fieldErrors.email} />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    required
                    value={firstName}
                    maxLength={PERSON_NAME_MAX_LENGTH}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    onChange={(e) => {
                      setFirstName(sanitizePersonNameInput(e.target.value));
                      clearFieldError("firstName");
                    }}
                    className="border-border bg-background"
                  />
                  <FieldError message={fieldErrors.firstName} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    required
                    value={lastName}
                    maxLength={PERSON_NAME_MAX_LENGTH}
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    onChange={(e) => {
                      setLastName(sanitizePersonNameInput(e.target.value));
                      clearFieldError("lastName");
                    }}
                    className="border-border bg-background"
                  />
                  <FieldError message={fieldErrors.lastName} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    maxLength={EMAIL_MAX_LENGTH}
                    aria-invalid={Boolean(fieldErrors.email)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    className="border-border bg-background"
                  />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    value={phone}
                    maxLength={NORTH_AMERICAN_PHONE_DISPLAY_MAX}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    onChange={handlePhoneChange}
                    placeholder="403-555-1234"
                    className="border-border bg-background"
                  />
                  <FieldError message={fieldErrors.phone} />
                </div>
              </div>
            </>
          )}
        </fieldset>

        <fieldset className="space-y-3 border-t border-border pt-5">
          <legend className="sr-only">Appointment details</legend>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2d5016]/80">
            Visit
          </p>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              required
              value={type}
              onValueChange={(value) => {
                setType(value);
                clearFieldError("type");
              }}
            >
              <SelectTrigger className="border-border bg-background">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="public-portal-surface">
                {PUBLIC_BOOKING_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.type} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferredProvider" className="text-muted-foreground">
              Preferred chiropractor
            </Label>
            <Input
              id="preferredProvider"
              value={preferredProviderName}
              maxLength={PROVIDER_NAME_MAX_LENGTH}
              aria-invalid={Boolean(fieldErrors.preferredProviderName)}
              onChange={(e) => {
                setPreferredProviderName(e.target.value);
                clearFieldError("preferredProviderName");
              }}
              className="border-border bg-background"
            />
            <FieldError message={fieldErrors.preferredProviderName} />
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-border pt-5">
          <legend className="sr-only">Preferred times</legend>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2d5016]/80">
            Preferred times
          </p>
          {availabilityLoading ? (
            <p className="text-sm text-muted-foreground">Loading times…</p>
          ) : bookableDates.length === 0 ? (
            <p className="text-sm text-destructive">
              No times available online. Please call the clinic.
            </p>
          ) : null}
          {preferences.map((pref, index) => {
            const dateIso = pref.date
              ? formatPickerDateForApi(pref.date)
              : "";
            const slotsForDate = dateIso ? slotsByDate[dateIso] ?? [] : [];

            return (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-border/80 bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
            >
              <div className="min-w-0 space-y-2">
                <Label>Date {index + 1}</Label>
                <DatePicker
                  date={pref.date}
                  setDate={(d) => handlePreferenceDateChange(index, d)}
                  menuClassName="public-portal-surface"
                  disabled={calendarDisabled}
                  fromDate={today}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Time</Label>
                <Select
                  value={pref.clock}
                  disabled={slotsForDate.length === 0}
                  onValueChange={(v) => updatePreference(index, "clock", v)}
                >
                  <SelectTrigger className="w-full border-border bg-background">
                    <SelectValue
                      placeholder={
                        slotsForDate.length
                          ? "Select time"
                          : "No times available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="public-portal-surface max-h-60">
                    {slotsForDate.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {preferences.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-border"
                  onClick={() => removePreference(index)}
                  aria-label="Remove time"
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          );
          })}
          {preferences.length < MAX_BOOKING_PREFERENCES &&
          bookableDates.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="border-border text-primary"
              onClick={addPreference}
              disabled={availabilityLoading}
            >
              <Plus className="mr-2 size-4" />
              Add time
            </Button>
          ) : null}
          <FieldError message={fieldErrors.preferences} />
        </fieldset>

        <div className="space-y-1.5 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="message" className="text-muted-foreground">
              Notes
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {message.length}/{MESSAGE_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH));
              clearFieldError("message");
            }}
            maxLength={MESSAGE_MAX_LENGTH}
            aria-invalid={Boolean(fieldErrors.message)}
            rows={3}
            className="min-h-0 border-border bg-background"
          />
          <FieldError message={fieldErrors.message} />
        </div>

        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />

        {error ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={
            submitting ||
            !type ||
            availabilityLoading ||
            bookableDates.length === 0 ||
            preferences.length === 0 ||
            preferences.some((p) => !p.date || !p.clock)
          }
          className="h-10 w-full bg-[#2d5016] text-white hover:bg-[#243f12] sm:w-auto sm:min-w-[10rem]"
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </PublicLayout>
  );
}
