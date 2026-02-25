"use client";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Check, ChevronDownIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  formatDateDMY,
  getAvailableSlot,
} from "@/components/RenderAppointment";
import {
  formatDay,
  formatMonthDropdown,
  formatYearDropdown,
} from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function AddAppointment({
  appointments,
  setAppointments,
  date,
  setDate,
}) {
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formPractitioner, setFormPractitioner] = useState("");
  const [formTime, setFormTime] = useState("");
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
  const practitioners = ["Brad Pritchard", "Kyle James", "Daniel Topala"];
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

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      toast.warning("Cannot book appointments for past dates.", {
        position: "top-center",
      });
      return false;
    }

    const formattedDate = formatDateDMY(date);

    const availableSlot = getAvailableSlot(
      appointments,
      formattedDate,
      formTime,
      formPractitioner,
    );

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

    toast.success("Appointment created successfully.", {
      position: "top-center",
    });

    return true;
  };
  return (
    <AlertDialog className="bg-background">
      <AlertDialogTrigger asChild>
        <Button className="w-[175px] bg-button-primary hover:bg-button-primary-foreground text-white text-center font-bold rounded-md ml-auto pointer-cursor">
          New Appointment
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-background text-foreground border border-border">
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
                          role="combobox"
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {formName || "Select customer"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="center"
                        className="ml-3.5 w-lg h-50"
                      >
                        <Command>
                          <CommandInput placeholder="Search customer..." />
                          <CommandEmpty>No customer found.</CommandEmpty>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            role="combobox"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {formType || "Select Type"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          align="center"
                          className="w-55 h-50 truncate"
                        >
                          <Command>
                            <CommandInput placeholder="Search type..." />
                            <CommandEmpty>No type found.</CommandEmpty>
                            <CommandGroup>
                              {types.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={(value) => {
                                    setFormType(value);
                                  }}
                                >
                                  <Check
                                    className={
                                      formType === type
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }
                                  />
                                  {type}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="date">Date</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant="outline"
                            data-empty={!date}
                            className="justify-between text-left font-normal"
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
                        <PopoverContent className="w-auto p-0" align="center">
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
                      <FieldLabel htmlFor="pract">Practitioner</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            role="combobox"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {formPractitioner || "Select practitioner"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent align="center" className="w-55 h-50">
                          <Command>
                            <CommandInput placeholder="Search practitioner..." />
                            <CommandEmpty>No practitioner found.</CommandEmpty>
                            <CommandGroup>
                              {practitioners.map((practitioner) => (
                                <CommandItem
                                  key={practitioner}
                                  value={practitioner}
                                  onSelect={(value) => {
                                    setFormPractitioner(value);
                                  }}
                                >
                                  <Check
                                    className={
                                      formPractitioner === practitioner
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }
                                  />
                                  {practitioner}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                        <PopoverContent align="center" className="w-55 h-50">
                          <Command>
                            <CommandInput placeholder="Search time..." />

                            <CommandEmpty>No time found.</CommandEmpty>

                            <CommandGroup id="hour">
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
  );
}
