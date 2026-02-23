"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatDateDMY,
  getAvailableSlot,
  parseDMYToDate,
} from "@/components/RenderAppointment";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDownIcon, Settings } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  formatDay,
  formatMonthDropdown,
  formatYearDropdown,
} from "react-day-picker";

export default function AppointmentInformation({
  active,
  setActive,
  appointments,
  setAppointments,
}) {
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
  const [editType, setEditType] = useState("");
  const [editPractitioner, setEditPractitioner] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDate, setEditDate] = useState(null);
  const handleEditAppointment = () => {
    if (!editType || !editPractitioner || !editTime || !editDate) {
      toast.warning("Please fill out all fields.", { position: "top-center" });
      return false;
    }
    const selected = new Date(editDate);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      toast.warning("Cannot book appointments for past dates.", {
        position: "top-center",
      });
      return false;
    }

    const formattedDate = formatDateDMY(editDate);

    let slotToUse = active.slot;

    // If time OR practitioner changed → re-check slot
    if (editTime !== active.time || editPractitioner !== active.practitioner) {
      const availableSlot = getAvailableSlot(
        appointments.filter((a) => a.id !== active.id),
        formattedDate,
        editTime,
        editPractitioner,
      );

      if (!availableSlot) {
        toast.warning("No available slots for this time.", {
          position: "top-center",
        });
        return false;
      }

      slotToUse = availableSlot;
    }

    const updatedAppointment = {
      ...active,
      type: editType,
      practitioner: editPractitioner,
      time: editTime,
      date: formattedDate,
      slot: slotToUse,
    };

    setAppointments((prev) =>
      prev.map((appt) => (appt.id === active.id ? updatedAppointment : appt)),
    );

    setActive(updatedAppointment);

    toast.success("Appointment updated successfully.", {
      position: "top-center",
    });

    return true;
  };
  const openEditDialog = (appointment) => {
    if (appointment.status === "checked-out") {
      toast.warning("Checked-out appointments cannot be edited.", {
        position: "top-center",
      });
      return false;
    }
    setEditType(appointment.type);
    setEditPractitioner(appointment.practitioner);
    setEditTime(appointment.time);
    setEditDate(parseDMYToDate(appointment.date));
    setActive(appointment);
  };
  return (
    <PopoverHeader>
      <Item>
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
              <Item>
                <ItemContent>
                  <ItemTitle>DoB</ItemTitle>
                  <ItemDescription>{active?.dob}</ItemDescription>
                </ItemContent>
              </Item>
              <Item>
                <ItemContent>
                  <ItemTitle>Email</ItemTitle>
                  <ItemDescription>{active?.email}</ItemDescription>
                </ItemContent>
              </Item>
              <Item>
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
            <form>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={active?.status === "checked-out"}
                  onClick={() => openEditDialog(active)}
                >
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
                <div className="grid grid-cols-2 gap-4">
                  <Field className="">
                    <FieldLabel htmlFor="typeEdit">Type</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          role="combobox"
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {editType || "Select Type"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-50 h-50">
                        <Command>
                          <CommandInput placeholder="Search type..." />
                          <CommandEmpty>No type found.</CommandEmpty>
                          <CommandGroup>
                            {types.map((type) => (
                              <CommandItem
                                key={type}
                                value={type}
                                onSelect={(value) => {
                                  setEditType(value);
                                }}
                              >
                                <Check
                                  className={
                                    editType === type
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
                    <FieldLabel htmlFor="dateEdit">Date</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          data-empty={editDate}
                          className="data-[empty=true]:text-muted-foreground justify-between text-left font-normal"
                        >
                          {editDate ? (
                            [
                              formatMonthDropdown(editDate) +
                                " " +
                                formatDay(editDate) +
                                ", " +
                                " " +
                                formatYearDropdown(editDate),
                            ]
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editDate}
                          onSelect={(day) => {
                            if (day) setEditDate(day);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="practEdit">Practitioner</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          role="combobox"
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {editPractitioner || "Select practitioner"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-50 h-50">
                        <Command>
                          <CommandInput placeholder="Search practitioner..." />
                          <CommandEmpty>No practitioner found.</CommandEmpty>
                          <CommandGroup>
                            {practitioners.map((practitioner) => (
                              <CommandItem
                                key={practitioner}
                                value={practitioner}
                                onSelect={(value) => {
                                  setEditPractitioner(value);
                                }}
                              >
                                <Check
                                  className={
                                    editPractitioner === practitioner
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
                    <FieldLabel htmlFor="hourEdit">Time</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between w-full"
                        >
                          {editTime || "Select time"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-50 h-50">
                        <Command>
                          <CommandInput placeholder="Search time..." />

                          <CommandEmpty>No time found.</CommandEmpty>

                          <CommandGroup id="hour">
                            {time.map((hour) => (
                              <CommandItem
                                key={hour}
                                value={hour}
                                onSelect={(value) => {
                                  setEditTime(value);
                                }}
                              >
                                <Check
                                  className={
                                    editTime === hour
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
                <DialogFooter>
                  <DialogClose asChild variant="outline">
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    onClick={(e) => {
                      const success = handleEditAppointment();
                      if (!success) e.preventDefault();
                    }}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
        </ItemActions>
      </Item>
      <Item>
        <ItemContent>
          <ItemTitle>Type</ItemTitle>
          <ItemDescription>{active?.type}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemContent>
          <ItemTitle>Practitioner</ItemTitle>
          <ItemDescription>{`Dr. ${active?.practitioner}`}</ItemDescription>
        </ItemContent>
      </Item>
    </PopoverHeader>
  );
}
