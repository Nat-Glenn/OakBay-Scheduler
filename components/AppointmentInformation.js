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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import DatePicker from "./DatePicker";
import FormField from "@/components/FormField";
import { Settings } from "lucide-react";

export default function AppointmentInformation({
  active,
  setActive,
  appointments,
  setAppointments,
}) {
  const [editType, setEditType] = useState("");
  const [editPractitioner, setEditPractitioner] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDate, setEditDate] = useState(null);
  const [search, setSearch] = useState("");
  const practitioners = [
    { id: 1, name: "Brad Pritchard" },
    { id: 2, name: "Kyle James" },
    { id: 3, name: "Daniel Topala" },
  ];
  const types = [
    { id: 1, name: "Chiropractic Adjustment" },
    { id: 2, name: "Massage" },
    { id: 3, name: "Intense Massage" },
  ];
  const time = [
    { id: 1, name: "9:00" },
    { id: 2, name: "9:15" },
    { id: 3, name: "9:30" },
    { id: 4, name: "9:45" },
    { id: 5, name: "10:00" },
    { id: 6, name: "10:15" },
    { id: 7, name: "10:30" },
    { id: 8, name: "10:45" },
    { id: 9, name: "11:00" },
    { id: 10, name: "11:15" },
  ];
  const filteredArray = (type) => {
    if (type == "types") {
      return types.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (type == "practitioners") {
      return practitioners.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (type == "time") {
      return time.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
  };
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
          <AlertDialog className="bg-background">
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                disabled={
                  active?.status === "checked-out" ||
                  active?.date !== formatDateDMY(new Date())
                }
                onClick={() => openEditDialog(active)}
              >
                <Settings />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background text-foreground border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Appointment</AlertDialogTitle>
                <div className="w-full max-w-md">
                  <form>
                    <FieldGroup>
                      <FieldSet>
                        <FieldDescription>
                          Edit an appointment&apos;s information.
                        </FieldDescription>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            fieldLabel={"Type"}
                            displayText={editType}
                            search={search}
                            setSearch={setSearch}
                            itemsArray={filteredArray("types")}
                            emptyText={"No types found"}
                            setItemSearch={setEditType}
                          />
                          <Field>
                            <FieldLabel htmlFor="date">Date</FieldLabel>
                            <DatePicker date={editDate} setDate={setEditDate} />
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            fieldLabel={"Practitioner"}
                            displayText={editPractitioner}
                            search={search}
                            setSearch={setSearch}
                            itemsArray={filteredArray("practitioners")}
                            emptyText={"No practitioners found"}
                            setItemSearch={setEditPractitioner}
                          />
                          <FormField
                            fieldLabel={"Time"}
                            displayText={editTime}
                            search={search}
                            setSearch={setSearch}
                            itemsArray={filteredArray("time")}
                            emptyText={"No time found"}
                            setItemSearch={setEditTime}
                          />
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
                    const success = handleEditAppointment();
                    if (!success) {
                      e.preventDefault();
                    }
                  }}
                >
                  Edit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ItemActions>
      </Item>
      <Item size="sm">
        <ItemContent>
          <ItemTitle>Type</ItemTitle>
          <ItemDescription>{active?.type}</ItemDescription>
        </ItemContent>
      </Item>
      <Item size="sm">
        <ItemContent>
          <ItemTitle>Practitioner</ItemTitle>
          <ItemDescription>{`Dr. ${active?.practitioner}`}</ItemDescription>
        </ItemContent>
      </Item>
    </PopoverHeader>
  );
}
