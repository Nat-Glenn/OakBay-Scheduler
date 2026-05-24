"use client";
import AppShell from "@/components/AppShell";
import { renderAppointment } from "@/components/RenderAppointment";
import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { addDays, subDays } from "date-fns";
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
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";
import { CLINIC_TIME_SLOTS, ALL_STAFF } from "@/lib/appointments/status";

import { formatPickerDateForApi } from "@/lib/appointments/clinicTime.js";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [date, setDate] = useState(new Date());
  const [practitioner, setPractitioner] = useState("");
  const [active, setActive] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [practitionersError, setPractitionersError] = useState("");
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
          err.message ||
            "Could not load practitioners. Check DATABASE_URL in .env.local and restart npm run dev.",
        );
      }
    }

    loadPractitioners();
  }, []);

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

        const mappedAppointments = data.map((appt) =>
          mapApiAppointmentToSchedulerRow(appt),
        );

        setAppointments(mappedAppointments);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setAppointments([]);
        setAppointmentsError(
          err.message ||
            "Could not load appointments. Check DATABASE_URL in .env.local and restart npm run dev.",
        );
      } finally {
        setLoadingAppointments(false);
      }
    }

    loadAppointments();
  }, [date]);

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <header className="flex flex-row items-center gap-4 py-4">
          <div className="hidden w-full flex-col md:flex">
            <h1 className="text-3xl font-bold text-foreground">Scheduler</h1>
          </div>

          <div
            className={`flex w-full flex-row ${small ? "justify-between" : "justify-end gap-4"}`}
          >
            <ChevronLeftIcon
              className="hidden size-8 shrink-0 cursor-pointer rounded-full hover:bg-muted md:block"
              onClick={() => date && setDate(subDays(date, 1))}
            />
            <ChevronRightIcon
              className="hidden size-8 shrink-0 cursor-pointer rounded-full hover:bg-muted md:block"
              onClick={() => date && setDate(addDays(date, 1))}
            />
            <DatePicker
              date={date}
              setDate={setDate}
              variant={small ? "icon" : ""}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="flex cursor-pointer text-white"
                >
                  {practitioner === ALL_STAFF ? ALL_STAFF : `Dr. ${practitioner}`}
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto" align="center">
                {practitioners.map((p) => (
                  <DropdownMenuItem
                    className="text-foreground"
                    key={p}
                    onClick={() => setPractitioner(p)}
                  >
                    {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <AddAppointment
              appointments={appointments}
              setAppointments={setAppointments}
              date={date}
              setDate={setDate}
              variant={small ? "icon" : "default"}
              patientId={prefillPatientId}
              open={bookingDialogOpen}
              onOpenChange={(nextOpen) => {
                setBookingDialogOpen(nextOpen);
                if (!nextOpen) setPrefillPatientId(null);
              }}
            />
          </div>
        </header>

        {(appointmentsError || practitionersError) && (
          <div className="text-sm text-destructive text-center pb-2 space-y-1">
            {practitionersError && <p>{practitionersError}</p>}
            {appointmentsError && <p>{appointmentsError}</p>}
          </div>
        )}

        {!loadingAppointments && !appointmentsError && (
          <p className="text-sm text-muted-foreground text-center pb-2">
            {activeAppointments.length === 0
              ? "No appointments scheduled for this day."
              : practitioner === ALL_STAFF
                ? `${activeAppointments.length} appointment${activeAppointments.length === 1 ? "" : "s"} for this day (all staff).`
                : `${activeAppointments.length} total · showing ${visibleAppointments.length} for ${practitioner}. Switch to "${ALL_STAFF}" to see everyone.`}
          </p>
        )}

        {!loadingAppointments &&
          !appointmentsError &&
          activeAppointments.length > 0 &&
          visibleAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center pb-2">
              No appointments for {practitioner} on this day. Try &quot;{ALL_STAFF}&quot; or pick a date with data (e.g. Apr 16 or May 24, 2026).
            </p>
          )}

        <div className="flex flex-row flex-1 min-h-0">
          {loadingAppointments ? (
            <SchedulerSkeleton />
          ) : (
            <div className="w-full flex-1 grid grid-cols-10 overflow-y-auto min-h-0 rounded-lg border border-border scrollbar-rounded">
              <div className="col-span-2 font-bold text-center border sticky top-0 bg-input border-foreground/20 z-10">
                Time
              </div>
              <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20 z-10">
                Slot 1
              </div>
              <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20 z-10">
                Slot 2
              </div>
              <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20 z-10">
                Slot 3
              </div>
              <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20 z-10">
                Slot 4
              </div>
              {CLINIC_TIME_SLOTS.map((hours) => (
                <React.Fragment key={hours}>
                  <div className="col-span-2 text-center text-foreground border-foreground/20 border font-mono py-3">
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
    </AppShell>
  );
}
