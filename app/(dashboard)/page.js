"use client";
import { renderAppointment } from "@/components/RenderAppointment";
import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDays,
} from "lucide-react";
import { addDays, isToday, subDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddAppointment from "@/components/AddAppointment";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import { useSearchParams, useRouter } from "next/navigation";
import { mapApiAppointmentToSchedulerRow } from "@/lib/appointments/mapSchedulerRow";
import SchedulerSkeleton from "@/components/SchedulerSkeleton";
import PageHeader from "@/components/PageHeader";
import SchedulerLegend from "@/components/SchedulerLegend";
import EmptyState from "@/components/EmptyState";
import LoadErrorPanel from "@/components/LoadErrorPanel";
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";
import { CLINIC_TIME_SLOTS, ALL_STAFF, getOfficeTimeSlotsForDate, isClinicOpenOnDate } from "@/lib/appointments/status";

import { formatPickerDateForApi } from "@/lib/appointments/clinicTime.js";
import InOfficeBanner from "@/components/InOfficeBanner";
import { formatShiftRange } from "@/lib/shifts/clientUtils";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [date, setDate] = useState(new Date());
  const [practitioner, setPractitioner] = useState("");
  const [active, setActive] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [practitionersError, setPractitionersError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [dayShifts, setDayShifts] = useState([]);
  const small = useMediaQuery("(max-width: 768px)");
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromPatient = searchParams.get("fromPatient");
  const patientIdParam = searchParams.get("patientId");
  const [prefillPatientId, setPrefillPatientId] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    if (fromPatient !== "true") return;

    const id = patientIdParam ? Number(patientIdParam) : null;
    if (!Number.isInteger(id)) return;

    setPrefillPatientId(id);
    setBookingDialogOpen(true);
    router.replace("/", { scroll: false });
  }, [fromPatient, patientIdParam, router]);

  const activeAppointments = appointments.filter(
    (appt) => appt.status !== "cancelled",
  );

  const visibleAppointments =
    practitioner === ALL_STAFF
      ? activeAppointments
      : activeAppointments.filter((appt) => appt.practitioner === practitioner);

  const dateIso = useMemo(() => formatPickerDateForApi(date), [date]);
  const timeSlots = useMemo(
    () => getOfficeTimeSlotsForDate(dateIso),
    [dateIso],
  );
  const clinicClosedToday = !isClinicOpenOnDate(dateIso);

  useEffect(() => {
    async function loadPractitioners() {
      setPractitionersError("");
      try {
        const res = await apiFetch("/api/practitioners");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            parseApiError(data, "Failed to load practitioners"),
          );
        }

        const names = data.map((p) => p.name);
        setPractitioners([ALL_STAFF, ...names]);

        if (names.length > 0) {
          setPractitioner((prev) => prev || ALL_STAFF);
        }
      } catch (err) {
        console.error("Failed to load practitioners:", err);
        setPractitionersError(
          err.message || "Could not load practitioners.",
        );
      }
    }

    loadPractitioners();
  }, [reloadKey]);

  useEffect(() => {
    async function loadAppointments() {
      setLoadingAppointments(true);
      setAppointmentsError("");

      try {
        const dateStr = formatPickerDateForApi(date);
        const res = await apiFetch(`/api/appointments?date=${dateStr}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(parseApiError(data, "Failed to load appointments"));
        }

        setAppointments(data.map(mapApiAppointmentToSchedulerRow));
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setAppointmentsError(err.message || "Failed to load appointments.");
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    }

    loadAppointments();
  }, [date, reloadKey]);

  useEffect(() => {
    async function loadDayShifts() {
      try {
        const dateStr = formatPickerDateForApi(date);
        const res = await apiFetch(`/api/shifts/day?date=${dateStr}`);
        const data = await res.json();
        if (res.ok) {
          setDayShifts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load day shifts:", err);
        setDayShifts([]);
      }
    }

    loadDayShifts();
  }, [date, reloadKey]);

  const dateStrForShifts = formatPickerDateForApi(date);
  const workingNamesForBooking = useMemo(() => {
    const names = new Set();
    for (const shift of dayShifts) {
      names.add(shift.provider.name);
    }
    return names;
  }, [dayShifts]);

  const scheduleEnforcedForDay = dayShifts.length > 0;

  const headerDescription = isToday(date)
    ? "Today's clinic schedule"
    : undefined;

  const scheduleSummary =
    !loadingAppointments && !appointmentsError
      ? activeAppointments.length === 0
        ? "No appointments scheduled for this day."
        : practitioner === ALL_STAFF
          ? `${activeAppointments.length} appointment${activeAppointments.length === 1 ? "" : "s"} (all staff).`
          : `${visibleAppointments.length} of ${activeAppointments.length} shown for ${practitioner}.`
      : null;

  return (      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <PageHeader
          title="Scheduler"
          description={headerDescription}
          actions={
            <>
              <ChevronLeftIcon
                className="hidden size-8 shrink-0 cursor-pointer rounded-full p-1 hover:bg-muted md:block"
                aria-label="Previous day"
                onClick={() => date && setDate(subDays(date, 1))}
              />
              <ChevronRightIcon
                className="hidden size-8 shrink-0 cursor-pointer rounded-full p-1 hover:bg-muted md:block"
                aria-label="Next day"
                onClick={() => date && setDate(addDays(date, 1))}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden font-semibold md:inline-flex"
                onClick={() => setDate(new Date())}
                disabled={isToday(date)}
              >
                Today
              </Button>
              <DatePicker
                date={date}
                setDate={setDate}
                variant={small ? "icon" : ""}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="flex cursor-pointer font-semibold text-secondary-foreground"
                  >
                    {practitioner === ALL_STAFF
                      ? ALL_STAFF
                      : `Dr. ${practitioner}`}
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[14rem]" align="center">
                  {practitioners.map((p) => {
                    if (p === ALL_STAFF) {
                      return (
                        <DropdownMenuItem
                          key={p}
                          className="font-medium text-foreground"
                          onClick={() => setPractitioner(p)}
                        >
                          {p}
                        </DropdownMenuItem>
                      );
                    }

                    const shift = dayShifts.find((s) => s.provider.name === p);
                    const onShift =
                      !scheduleEnforcedForDay || Boolean(shift);

                    return (
                      <DropdownMenuItem
                        key={p}
                        className="flex flex-col items-start gap-0.5 py-2 text-foreground"
                        onClick={() => setPractitioner(p)}
                      >
                        <span className="flex flex-wrap items-center gap-2 font-medium">
                          Dr. {p}
                          {scheduleEnforcedForDay ? (
                            onShift ? (
                              <span className="rounded-md bg-status-checked-in/35 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-status-checked-in-foreground">
                                On shift
                              </span>
                            ) : (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                                Off
                              </span>
                            )
                          ) : null}
                        </span>
                        {shift ? (
                          <span className="text-xs text-muted-foreground">
                            {formatShiftRange(shift)}
                          </span>
                        ) : scheduleEnforcedForDay ? (
                          <span className="text-xs text-muted-foreground">
                            Not scheduled today
                          </span>
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <AddAppointment
                appointments={appointments}
                setAppointments={setAppointments}
                date={date}
                setDate={setDate}
                dayShifts={dayShifts}
                scheduleEnforced={dayShifts.length > 0}
                variant={small ? "icon" : "default"}
                patientId={prefillPatientId}
                open={bookingDialogOpen}
                onOpenChange={(nextOpen) => {
                  setBookingDialogOpen(nextOpen);
                  if (!nextOpen) setPrefillPatientId(null);
                }}
              />
            </>
          }
        />

        <SchedulerLegend />

        <InOfficeBanner className="mb-3" />

        {dayShifts.length > 0 &&
        workingNamesForBooking.size > 0 &&
        !practitionersError ? (
          <p className="mb-2 text-center text-xs text-muted-foreground">
            On shift this day:{" "}
            {[...workingNamesForBooking].join(", ")}
          </p>
        ) : null}

        {(practitionersError || appointmentsError) && (
          <LoadErrorPanel
            message={[practitionersError, appointmentsError]
              .filter(Boolean)
              .join(" ")}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        )}

        {scheduleSummary && !practitionersError && !appointmentsError ? (
          <p className="pb-2 text-center text-sm text-muted-foreground">
            {scheduleSummary}
          </p>
        ) : null}

        {!loadingAppointments &&
          !appointmentsError &&
          activeAppointments.length > 0 &&
          visibleAppointments.length === 0 && (
            <p className="pb-2 text-center text-sm text-muted-foreground">
              No appointments for {practitioner} on this day. Switch to &quot;
              {ALL_STAFF}&quot; to see all providers.
            </p>
          )}

        <div className="flex min-h-0 flex-1 flex-row">
          {loadingAppointments ? (
            <SchedulerSkeleton slots={CLINIC_TIME_SLOTS} />
          ) : appointmentsError ? null : clinicClosedToday ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-dropdown/50 p-8 text-center">
              <EmptyState
                icon={CalendarDays}
                title="Clinic closed"
                description="There are no office hours scheduled for this day. Choose another date."
              />
            </div>
          ) : activeAppointments.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-dropdown/50">
              <EmptyState
                icon={CalendarDays}
                title="No appointments this day"
                description="Use Add Appointment to book a visit, or choose another date."
              />
            </div>
          ) : (
            <div className="grid min-h-0 w-full flex-1 grid-cols-10 overflow-y-auto rounded-lg border border-border scrollbar-rounded">
              <div className="sticky top-0 z-10 col-span-2 border border-foreground/20 bg-input text-center font-bold">
                Time
              </div>
              <div className="sticky top-0 z-10 col-span-2 border border-foreground/20 bg-input text-center font-medium text-foreground">
                Slot 1
              </div>
              <div className="sticky top-0 z-10 col-span-2 border border-foreground/20 bg-input text-center font-medium text-foreground">
                Slot 2
              </div>
              <div className="sticky top-0 z-10 col-span-2 border border-foreground/20 bg-input text-center font-medium text-foreground">
                Slot 3
              </div>
              <div className="sticky top-0 z-10 col-span-2 border border-foreground/20 bg-input text-center font-medium text-foreground">
                Slot 4
              </div>
              {timeSlots.map((hours) => (
                <React.Fragment key={hours}>
                  <div className="col-span-2 border border-foreground/20 py-3 text-center font-mono text-foreground">
                    {hours}
                  </div>

                  {renderAppointment(
                    hours,
                    1,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                    small,
                  )}
                  {renderAppointment(
                    hours,
                    2,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                    small,
                  )}
                  {renderAppointment(
                    hours,
                    3,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                    small,
                  )}
                  {renderAppointment(
                    hours,
                    4,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                    small,
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
