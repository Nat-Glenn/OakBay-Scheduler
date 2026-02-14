"use client";
import NavBarComp from "@/components/NavBarComp";
import { RenderAppointment } from "@/components/RenderAppointment";
import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Calendar from "@/components/Calendar";
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

export default function Appointments() {
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      name: "John Doe",
      dob: "June 01, 2000 (25)",
      email: "johndoe@gmail.com",
      phone: "587-999-999",
      type: "Chiropractic Adjustment",
      practitioner: "Brad Pritchard",
      time: "9:00",
      slot: 1,
      date: "13/02/2026",
      status: "scheduled",
    },
    {
      id: 2,
      name: "Bob",
      dob: "August 29, 2000 (25)",
      email: "bob@gmail.com",
      phone: "517-949-929",
      type: "Massage",
      practitioner: "Brad Pritchard",
      time: "10:15",
      slot: 1,
      date: "13/02/2026",
      status: "scheduled",
    },
    {
      id: 3,
      name: "Bob",
      dob: "August 29, 2000 (25)",
      email: "bob@gmail.com",
      phone: "517-949-929",
      type: "Chiropractic Adjustment",
      practitioner: "Brad Pritchard",
      time: "10:15",
      slot: 1,
      date: "09/02/2026",
      status: "checked-out",
    },
    {
      id: 4,
      name: "Bob",
      dob: "August 29, 2000 (25)",
      email: "bob@gmail.com",
      phone: "517-949-929",
      type: "Intense Massage",
      practitioner: "Brad Pritchard",
      time: "9:15",
      slot: 1,
      date: "19/02/2026",
      status: "scheduled",
    },
  ]);
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
    "12:00",
    "12:15",
    "12:30",
    "12:45",
    "13:00",
    "21:00",
  ];
  const practitioners = ["Brad Pritchard", "Kyle James", "Daniel Topala"];
  const [date, setDate] = useState(new Date());
  const [practitioner, setPractitioner] = useState(practitioners[0]);
  const [active, setActive] = useState(null);

  return (
    <main className="flex min-h-dvh w-full">
      <NavBarComp />
      <div className="flex-2 px-4 pt-4 overflow-y-hidden">
        <header className="pb-4 px-4">
          <h1 className="text-3xl font-bold text-gray-800">Scheduler</h1>
          <p className="text-gray-500">
            Manage and view all current appointments.
          </p>
        </header>
        <div className="flex flex-col">
          <div className="flex flex-row items-center gap-2">
            <ChevronLeftIcon
              onClick={() => date && setDate(subDays(date, 1))}
            />
            <ChevronRightIcon
              onClick={() => date && setDate(addDays(date, 1))}
            />
            <Calendar date={date} setDate={setDate} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[175px] bg-[#002D58] hover:bg-[#002D58]/60 hover:text-black/60 font-bold text-white rounded-md ml-auto"
                >
                  {`Dr. ${practitioner}`}
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto" align="center">
                {practitioners.map((p) => (
                  <DropdownMenuItem key={p} onClick={() => setPractitioner(p)}>
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
            />
          </div>
          <div className="flex flex-row">
            <div className="w-full h-105 grid grid-cols-9 m-4 border overflow-y-scroll">
              <div className="col-span-1 font-bold text-center border sticky top-0 bg-white">
                Time
              </div>
              <div className="col-span-2 font-bold text-center border sticky top-0 bg-white">
                Slot 1
              </div>
              <div className="col-span-2 font-bold text-center border sticky top-0 bg-white">
                Slot 2
              </div>
              <div className="col-span-2 font-bold text-center border sticky top-0 bg-white">
                Slot 3
              </div>
              <div className="col-span-2 font-bold text-center border sticky top-0 bg-white">
                Slot 4
              </div>
              {time.map((hours) => (
                <React.Fragment key={hours}>
                  <div
                    className="col-span-1 text-center border p-3 font-medium"
                    key={hours.key}
                  >
                    {hours}
                  </div>

                  {RenderAppointment(
                    hours,
                    1,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                  )}
                  {RenderAppointment(
                    hours,
                    2,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                  )}
                  {RenderAppointment(
                    hours,
                    3,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                  )}
                  {RenderAppointment(
                    hours,
                    4,
                    practitioner,
                    date,
                    active,
                    setActive,
                    appointments,
                    setAppointments,
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
