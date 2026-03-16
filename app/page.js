"use client";
import NavBarComp from "@/components/NavBarComp";
import { renderAppointment } from "@/components/RenderAppointment";
import React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/DatePicker";
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
import { useSearchParams } from "next/navigation";

export default function Appointments() {
  const time = [
    "9:00",
    "9:15",
    "9:30",
    "9:45",
    "10:00",
    "10:15",
    "10:30",
    "10:45",
    "11:00",
    "11:15",
    "11:30",
    "11:45",
    "14:00",
    "14:15",
    "14:30",
    "14:45",
    "15:00",
    "15:15",
  ];

  const [appointments, setAppointments] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [date, setDate] = useState(new Date());
  const [practitioner, setPractitioner] = useState("");
  const [active, setActive] = useState(null);
  const small = useMediaQuery("(max-width: 768px)");
  const searchParams = useSearchParams();
  const fromPatient = searchParams.get("fromPatient");

  function formatDateForApi(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    async function loadPractitioners() {
      try {
        const res = await fetch("/api/practitioners");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load practitioners");
        }

        const names = data.map((p) => p.name);
        setPractitioners(names);

        if (names.length > 0) {
          setPractitioner((prev) => prev || names[0]);
        }
      } catch (err) {
        console.error("Failed to load practitioners:", err);
      }
    }

    loadPractitioners();
  }, []);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const dateStr = formatDateForApi(date);
        const res = await fetch(`/api/appointments?date=${dateStr}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load appointments");
        }

        const mappedAppointments = data.map((appt, index) => {
          const start = new Date(appt.startTime);

          const hours = start.getHours();
          const minutes = String(start.getMinutes()).padStart(2, "0");
          const displayHour = `${hours}:${minutes}`;

          return {
            id: appt.id,
            name: appt.patient
              ? `${appt.patient.firstName ?? ""} ${appt.patient.lastName ?? ""}`.trim()
              : "Unknown Patient",
            dob: "—",
            email: appt.patient?.email || "—",
            phone: appt.patient?.phone || "—",
            type: appt.type || "—",
            practitioner: appt.provider?.name || "Unassigned",
            time: displayHour,
            slot: 1,
            date: date.toLocaleDateString("en-GB"),
            status: appt.status === "requested" ? "scheduled" : appt.status,
          };
        });

        setAppointments(mappedAppointments);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setAppointments([]);
      }
    }

    loadAppointments();
  }, [date]);

  return (
    <main className="flex flex-col h-dvh w-full bg-background overflow-hidden">
      <NavBarComp />
      <div className="flex flex-col min-h-0 px-4 pb-4">
        <header className="flex flex-row gap-4 items-center py-4">
          {!small && (
            <div className="w-full flex flex-col">
              <h1 className="text-3xl font-bold text-foreground">Scheduler</h1>
            </div>
          )}

          <div
            className={`flex w-full flex-row ${small ? "justify-between" : "justify-end gap-4"}`}
          >
            <ChevronLeftIcon
              className="hidden cursor-pointer hover:bg-muted-foreground/30 rounded-full"
              onClick={() => date && setDate(subDays(date, 1))}
            />
            <ChevronRightIcon
              className="hidden cursor-pointer hover:bg-muted-foreground/30 rounded-full"
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
                  {`Dr. ${practitioner}`}
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
              open={fromPatient}
            />
          </div>
        </header>
        <div className="flex flex-row flex-1 min-h-0">
          <div className="w-full flex-1 grid grid-cols-10 overflow-y-auto min-h-0 rounded-lg border border-border scrollbar-rounded">
            <div className="col-span-2 font-bold text-center border sticky top-0 bg-input border-foreground/20">
              Time
            </div>
            <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20">
              Slot 1
            </div>
            <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20">
              Slot 2
            </div>
            <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20">
              Slot 3
            </div>
            <div className="col-span-2 font-medium text-foreground text-center border sticky top-0 bg-input border-foreground/20">
              Slot 4
            </div>
            {time.map((hours) => (
              <React.Fragment key={hours}>
                <div
                  className="col-span-2 text-center text-foreground border-foreground/20 border font-mono py-3"
                  key={hours.key}
                >
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
        </div>
      </div>
    </main>
  );
}
