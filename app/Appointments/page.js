"use client";
import NavBarComp from "@/components/NavBarComp";
import React from "react";
import Image from "next/image";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
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
import { addDays, isSameDay, subDays } from "date-fns";
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formPractitioner, setFormPractitioner] = useState("");
  const [formTime, setFormTime] = useState("");

  const formatDateDMY = (date) => {
    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  const parseDMYToDate = (dmy) => {
    const [day, month, year] = dmy.split("/");
    return new Date(year, month - 1, day);
  };

  const isAppointmentToday = (apptDate) => {
    return isSameDay(parseDMYToDate(apptDate), new Date());
  };

  const manageActive = (appt) => {
    if (active?.id === appt.id) {
      setActive(null);
    } else {
      setActive(appt);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "checked-in":
        return "bg-[#A0CE66]";
      case "checked-out":
        return "bg-[#002D58]";
      default:
        return "bg-[#00D0FF]";
    }
  };

  const renderAppt = (hours, slotNumber) => {
    const selectedDate = formatDateDMY(date);
    const appt = appointments.find(
      (a) =>
        a.time === hours &&
        a.slot === slotNumber &&
        a.practitioner === practitioner &&
        a.date === selectedDate,
    );
    return (
      <div className="col-span-2 border p-1 text-center">
        {appt ? (
          <Popover>
            <PopoverTrigger className="w-full">
              <div
                onClick={() => {
                  if (appt == active) {
                    return;
                  }
                  manageActive(appt);
                }}
                className={`${getStatusColor(
                  appt.status,
                )} hover:opacity-80 cursor-pointer flex flex-col`}
              >
                <p className="font-extrabold text-white">{appt.name}</p>
                <p className="font-extralight text-sm text-white/80">
                  {appt.type}
                </p>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-75" align="center">
              <PopoverHeader>
                <Item className="bg-white" variant="muted">
                  <ItemMedia>
                    <Avatar className="size-10">
                      <AvatarImage src="/favicon.png"></AvatarImage>
                      <AvatarFallback>Profile Picture</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <HoverCard openDelay={100} closeDelay={100}>
                      <HoverCardTrigger>
                        <ItemTitle>{active?.name}</ItemTitle>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-1" side="top">
                        <Item className="bg-white" variant="muted">
                          <ItemContent>
                            <ItemTitle>DoB</ItemTitle>
                            <ItemDescription>{active?.dob}</ItemDescription>
                          </ItemContent>
                        </Item>
                        <Item className="bg-white" variant="muted">
                          <ItemContent>
                            <ItemTitle>Email</ItemTitle>
                            <ItemDescription>{active?.email}</ItemDescription>
                          </ItemContent>
                        </Item>
                        <Item className="bg-white" variant="muted">
                          <ItemContent>
                            <ItemTitle>Phone Number</ItemTitle>
                            <ItemDescription>{active?.phone}</ItemDescription>
                          </ItemContent>
                        </Item>
                      </HoverCardContent>
                    </HoverCard>
                  </ItemContent>
                  <ItemActions>
                    <Dialog>
                      <DialogTrigger className="" asChild>
                        <Button variant="ghost">
                          <Settings />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Appointment</DialogTitle>
                          <DialogDescription>
                            Edit an appointment&apos;s information.
                          </DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                          <Field>
                            <Label></Label>
                          </Field>
                        </FieldGroup>
                      </DialogContent>
                    </Dialog>
                  </ItemActions>
                </Item>
                <Item className="bg-white" variant="muted">
                  <ItemContent>
                    <ItemTitle>Type</ItemTitle>
                    <ItemDescription>{active?.type}</ItemDescription>
                  </ItemContent>
                </Item>
                <Item className="bg-white" variant="muted">
                  <ItemContent>
                    <ItemTitle>Practitioner</ItemTitle>
                    <ItemDescription>{`Dr. ${active?.practitioner}`}</ItemDescription>
                  </ItemContent>
                </Item>
              </PopoverHeader>
              {appt.status != "checked-out" && (
                <Item>
                  <ItemContent>
                    {appt.status == "scheduled" && (
                      <Button
                        onClick={handleCheckIn}
                        className="w-full bg-[#A0CE66] hover:bg-[#A0CE66]/60 hover:text-black/60 text-center font-semibold text-white"
                      >
                        Check In
                      </Button>
                    )}
                    {appt.status == "checked-in" && (
                      <Button
                        onClick={handleCheckOut}
                        className="w-full bg-[#C04343] hover:bg-[#C04343]/60 hover:text-black/60 text-center font-semibold text-white"
                      >
                        Check Out
                      </Button>
                    )}
                  </ItemContent>
                </Item>
              )}
            </PopoverContent>
          </Popover>
        ) : (
          <div className="h-full">&nbsp;</div>
        )}
      </div>
    );
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

    if (date < new Date()) {
      toast.warning("Cannot book appointments for past dates.", {
        position: "top-center",
      });
      return false;
    }

    const formattedDate = formatDateDMY(date);

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
      status: "scheduled",
    };

    setAppointments((prev) => [...prev, newAppointment]);

    // Reset form
    setFormName("");
    setFormType("");
    setFormPractitioner("");
    setFormTime("");

    return true;
  };

  const handleCheckIn = () => {
    if (!isAppointmentToday(active.date)) {
      toast.warning("You can only check in appointments scheduled for today.", {
        position: "top-center",
      });
      return;
    }

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === active.id ? { ...appt, status: "checked-in" } : appt,
      ),
    );

    setActive({ ...active, status: "checked-in" });
  };

  const handleCheckOut = () => {
    console.log(active);
    if (active.status != "checked-in") {
      toast.warning(
        "You can only check out appointments that are checked-in.",
        { position: "top-center" },
      );
      return;
    }

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === active.id ? { ...appt, status: "checked-out" } : appt,
      ),
    );

    setActive({ ...active, status: "checked-out" });
  };

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
                          <div className="grid grid-cols-2 gap-4">
                            <Field className="">
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
                            <Field className="">
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
                                    onSelect={(day) => {
                                      if (day) setDate(day);
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                            </Field>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
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
                            <Field>
                              <FieldLabel htmlFor="hour">Time</FieldLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="justify-between w-full"
                                  >
                                    {formTime || "Select time"}
                                    <ChevronDownIcon />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <Command>
                                    <CommandInput placeholder="Search time..." />

                                    <CommandEmpty>No time found.</CommandEmpty>

                                    <CommandGroup
                                      className="w-full h-50"
                                      id="hour"
                                    >
                                      {time.map((hour) => (
                                        <CommandItem
                                          key={hour}
                                          value={hour}
                                          onSelect={(value) => {
                                            setFormTime(value);
                                          }}
                                        >
                                          <Check
                                            className={
                                              formTime === hour
                                                ? "opacity-100"
                                                : "opacity-0"
                                            }
                                          />
                                          {hour}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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

                  {renderAppt(hours, 1)}
                  {renderAppt(hours, 2)}
                  {renderAppt(hours, 3)}
                  {renderAppt(hours, 4)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
