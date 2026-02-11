"use client";
import NavBarComp from "@/components/NavBarComp";
import React from "react";
import Image from "next/image";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertCircleIcon,
  Check,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Settings,
} from "lucide-react";
import {
  formatDay,
  formatMonthDropdown,
  formatYearDropdown,
} from "react-day-picker";
import { addDays, subDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export default function Appointments() {
  const [active, setActive] = useState(null);
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
      date: "11/02/2026",
    },
    {
      id: 2,
      name: "Bob",
      dob: "August 29, 2000 (25)",
      email: "bob@gmail.com",
      phone: "517-949-929",
      type: "Massage",
      practitioner: "Brad Pritchard",
      time: "9:15",
      slot: 2,
      date: "12/02/2026",
    },
  ]);
  const customers = [
    {
      id: "1",
      name: "John Doe",
      dob: "June 01, 2000 (25)",
      email: "johndoe@gmail.com",
      phone: "587-999-999",
    },
    {
      id: "2",
      name: "Bob",
      dob: "August 29, 2000 (25)",
      email: "bob@gmail.com",
      phone: "517-949-929",
    },
    {
      id: "3",
      name: "Jane Smith",
      dob: "March 12, 1995 (30)",
      email: "jane@gmail.com",
      phone: "403-222-1111",
    },
  ];
  const types = ["Chiropractic Adjustment", "Massage", "Intense Massage"];
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
  ];
  const practitioners = ["Brad Pritchard", "Kyle James", "Daniel Topala"];
  const [date, setDate] = useState(new Date());
  const [practitioner, setPractitioner] = useState(practitioners[0]);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formPractitioner, setFormPractitioner] = useState("");
  const [formTime, setFormTime] = useState("");

  const manageActive = (appt) => {
    if (active?.id === appt.id) {
      setActive(null);
    } else {
      setActive(appt);
    }
  };

  const renderAppt = (hours, slotNumber) => {
    const appt = appointments.find(
      (a) =>
        a.time === hours &&
        a.slot === slotNumber &&
        a.practitioner === practitioner &&
        a.date === date.toLocaleDateString("en-ES"), //makes the date follow dd/mm/yyyy format.
    );
    return (
      <div className="col-span-2 border p-1 text-center snap-end">
        {appt ? (
          <div
            onClick={() => manageActive(appt)}
            className="bg-[#00D0FF] hover:bg-[#00D0FF]/60 cursor-pointer flex flex-col rounded-md"
          >
            <p className="font-extrabold text-white">{appt.name}</p>
            <p className="font-extralight text-sm text-white/80">{appt.type}</p>
          </div>
        ) : (
          <div className="h-full">&nbsp;</div>
        )}
      </div>
    );
  };

  const handleNameChange = (value) => {
    if (!value) {
      return;
    }
    setFormName(value);
  };

  const handleCreateAppointment = () => {
    if (!formName || !formType || !formPractitioner || !formTime || !date) {
      toast.warning("Please fill out all of the fields.", {
        position: "top-center",
      });
      return false;
    }

    const customer = customers.find((c) => c.name === formName);
    if (!customer) {
      toast.warning("Customer needs to be selected from the list.", {
        position: "top-center",
      });
      return false;
    }

    const formattedDate = date.toLocaleDateString("en-ES");

    // Find first available slot (1–4)
    let availableSlot = null;
    for (let slot = 1; slot <= 4; slot++) {
      const isTaken = appointments.some(
        (a) =>
          a.date === formattedDate &&
          a.time === formTime &&
          a.slot === slot &&
          a.practitioner === formPractitioner,
      );

      if (!isTaken) {
        availableSlot = slot;
        break;
      }
    }

    if (!availableSlot) {
      toast.warning("All slots for this hour have been booked.", {
        position: "top-center",
      });
      return false;
    }

    const newAppointment = {
      id: appointments.length + 1,
      name: customer.name,
      dob: customer.dob,
      email: customer.email,
      phone: customer.phone,
      type: formType,
      practitioner: formPractitioner,
      time: formTime,
      slot: availableSlot,
      date: formattedDate,
    };

    setAppointments((prev) => [...prev, newAppointment]);

    // Reset form
    setFormName("");
    setFormType("");
    setFormPractitioner("");
    setFormTime("");

    return true;
  };

  return (
    <main className="flex min-h-dvh w-full">
      <NavBarComp />
      <div className="flex-2 p-4">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!date}
                  className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal"
                >
                  {date ? (
                    [
                      formatMonthDropdown(date) +
                        " " +
                        formatDay(date) +
                        ", " +
                        " " +
                        formatYearDropdown(date),
                    ]
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[175px] bg-[#A0CE66] hover:bg-[#A0CE66]/60 hover:text-black/60 text-white text-center font-bold rounded-md ml-auto"
                >
                  New Appointment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add a new appointment</AlertDialogTitle>
                  <div className="w-full max-w-md">
                    <form>
                      <FieldGroup>
                        <FieldSet>
                          <FieldDescription>
                            Create a new appointment and add it to the schedule.
                          </FieldDescription>
                          <Field>
                            <FieldLabel>Customer Name</FieldLabel>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {formName || "Select customer"}
                                  <ChevronDownIcon />
                                </Button>
                              </PopoverTrigger>

                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search customer..." />

                                  <CommandEmpty>
                                    No customer found.
                                  </CommandEmpty>

                                  <CommandGroup>
                                    {customers.map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={customer.name}
                                        onSelect={(value) => {
                                          setFormName(value);
                                        }}
                                      >
                                        <Check
                                          className={
                                            formName === customer.name
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }
                                        />
                                        {customer.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </Field>
                          <div className="grid grid-cols-3 gap-4">
                            <Field className="col-span-2">
                              <FieldLabel htmlFor="type">Type</FieldLabel>
                              <Select onValueChange={setFormType}>
                                <SelectTrigger id="type">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {types.map((e) => (
                                    <SelectItem value={e} key={e}>
                                      {e}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="pract">
                                Practitioner
                              </FieldLabel>
                              <Select onValueChange={setFormPractitioner}>
                                <SelectTrigger id="pract">
                                  <SelectValue placeholder="Dr. Seuss" />
                                </SelectTrigger>
                                <SelectContent>
                                  {practitioners.map((e) => (
                                    <SelectItem value={e} key={e}>
                                      {e}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <Field className="col-span-2">
                              <FieldLabel htmlFor="date">Date</FieldLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="date"
                                    variant="outline"
                                    data-empty={!date}
                                    className="data-[empty=true]:text-muted-foreground justify-between text-left font-normal"
                                  >
                                    {date ? (
                                      [
                                        formatMonthDropdown(date) +
                                          " " +
                                          formatDay(date) +
                                          ", " +
                                          " " +
                                          formatYearDropdown(date),
                                      ]
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <ChevronDownIcon />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                  />
                                </PopoverContent>
                              </Popover>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="hour">Time</FieldLabel>
                              <Select onValueChange={setFormTime}>
                                <SelectTrigger id="hour">
                                  <SelectValue placeholder="9:00 AM" />
                                </SelectTrigger>
                                <SelectContent>
                                  {time.map((e) => (
                                    <SelectItem value={e} key={e}>
                                      {`${e} AM`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                        </FieldSet>
                      </FieldGroup>
                    </form>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      const success = handleCreateAppointment();
                      if (!success) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Create
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex flex-row">
            <div className="w-full h-99 grid grid-cols-9 m-4 border overflow-y-scroll">
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
                    className="col-span-1 text-center border p-2 font-medium"
                    key={hours.key}
                  >
                    {hours}
                  </div>

                  {renderAppt(hours, 1)}
                  {renderAppt(hours, 2)}
                  {renderAppt(hours, 3)}
                  {renderAppt(hours, 4)}
                </React.Fragment>
              ))}
            </div>
            {active && (
              <div className="flex-1 px-2 pt-2">
                <Card className="flex flex-col p-4 gap-2">
                  <CardHeader>
                    <div className="flex flex-row items-center gap-4 rounded-2xl px-4">
                      <Image
                        className="rounded-full"
                        src="/favicon.png"
                        alt="logo"
                        height={50}
                        width={50}
                      ></Image>
                      <p>{active.name}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="flex gap-2">
                        <b>DoB:</b>
                        {active.dob}
                      </p>
                      <p className="flex gap-2">
                        <b>Email:</b>
                        {active.email}
                      </p>
                      <p className="text-ellipsis">
                        <b>Phone Number:&nbsp;</b>
                        {active.phone}
                      </p>
                    </div>
                    <CardAction>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost">
                            <Settings />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-auto"
                          align="center"
                        ></DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col w-75 gap-2">
                    <div>
                      <p className="font-extrabold text-lg">Appointment</p>
                      <p className="flex gap-2 text-ellipsis">
                        <b>Type:</b>
                        {active.type}
                      </p>
                      <p className="flex gap-2 text-ellipsis">
                        <b>Practitioner:</b>
                        {`Dr. ${active.practitioner}`}
                      </p>
                    </div>
                    <div>
                      <p className="font-extrabold text-lg">Notes</p>
                      <p className="text-ellipsis">
                        Neck pain, Involved in car accident.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full bg-[#A0CE66] hover:bg-[#A0CE66]/60 hover:text-black/60 text-center font-semibold text-white">
                      Check In
                    </Button>
                    <Button className="w-full bg-[#C04343] hover:bg-[#C04343]/60 hover:text-black/60 text-center font-semibold text-white">
                      Check Out
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
