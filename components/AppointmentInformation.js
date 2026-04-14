"use client";
import { useState } from "react";
import Image from "next/image";
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
  AlertDialogDescription,
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
import { DatePicker } from "./DatePicker";
import FormField from "@/components/FormField";
import { Pencil, Settings } from "lucide-react";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import { DeletePopUp } from "@/components/DeletePopUp";

export default function AppointmentInformation({
  appointment,
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
  const small = useMediaQuery("(max-width: 768px)");

  const selectedAppointment = appointment || active;

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

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return false;

    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete appointment");
      }

      const filteredArray = appointments.filter(
        (appt) => appt.id != selectedAppointment.id,
      );

      setAppointments(filteredArray);
      setActive(null);

      toast.success("Appointment deleted.", {
        position: "top-right",
      });

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to delete appointment.", {
        position: "top-right",
      });
      return false;
    }
  };

 const handleEditAppointment = async () => {
  if (!selectedAppointment) return false;

  if (!editType || !editPractitioner || !editTime || !editDate) {
    toast.warning("Please fill out all fields.", { position: "top-right" });
    return false;
  }

  const selected = new Date(editDate);
  selected.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selected < today) {
    toast.warning("Cannot book appointments for past dates.", {
      position: "top-right",
    });
    return false;
  }

  const formattedDate = formatDateDMY(editDate);

  let slotToUse = active.slot;

  if (
    editTime !== active.time ||
    editPractitioner !== selectedAppointment.practitioner
  ) {
    const availableSlot = getAvailableSlot(
      appointments.filter((a) => a.id !== selectedAppointment.id),
      formattedDate,
      editTime,
      editPractitioner,
    );

    if (!availableSlot) {
      toast.warning("No available slots for this time.", {
        position: "top-right",
      });
      return false;
    }

    slotToUse = availableSlot;
  }

  let providerIdToUse = selectedAppointment.providerId;

if (editPractitioner !== selectedAppointment.practitioner) {
  const selectedPractitioner = practitioners.find(
    (p) => p.name === editPractitioner,
  );

  if (!selectedPractitioner) {
    toast.warning("Invalid practitioner selected.", {
      position: "top-right",
    });
    return false;
  }

  providerIdToUse = selectedPractitioner.id;
}

  const [hours, minutes] = editTime.split(":").map(Number);

  const startTime = new Date(editDate);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 15);

  try {
    const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      type: editType,
      providerId: providerIdToUse,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
}),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update appointment");
    }

    const updatedAppointment = {
      ...selectedAppointment,
      ...data.data,
      type: editType,
      practitioner: editPractitioner,
      time: editTime,
      date: formattedDate,
      slot: slotToUse,
    };

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === selectedAppointment.id ? updatedAppointment : appt,
      ),
    );

    setActive(updatedAppointment);

    toast.success("Appointment updated successfully.", {
      position: "top-right",
    });

    return true;
  } catch (err) {
    toast.error(err.message || "Failed to update appointment.", {
      position: "top-right",
    });
    return false;
  }
};

  const openEditDialog = (appointment) => {
    if (!appointment) return false;

    if (appointment.status === "checked-out") {
      toast.warning("Checked-out appointments cannot be edited.", {
        position: "top-right",
      });
      return false;
    }

    setEditType(appointment.type);
    setEditPractitioner(appointment.practitioner);
    setEditTime(appointment.time);
    setEditDate(parseDMYToDate(appointment.date));
    setActive(appointment);

    return true;
  };

  return (
    <PopoverHeader>
      <Item size="xs">
        <ItemMedia>
          <Avatar className="size-10">
            <AvatarImage src="/favicon.png"></AvatarImage>
            <AvatarFallback>Profile Picture</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{selectedAppointment?.name || "—"}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <AlertDialog className="bg-background">
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                disabled={
                  selectedAppointment?.status === "checked-out" ||
                  selectedAppointment?.date !== formatDateDMY(new Date())
                }
                onClick={() => openEditDialog(active)}
              >
                <Pencil />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background text-foreground border border-foreground">
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
                            <FieldLabel className="font-bold" htmlFor="date">
                              Date
                            </FieldLabel>
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
                <AlertDialogCancel
                  className={`${small ? "w-full" : "mr-auto"}`}
                >
                  Cancel
                </AlertDialogCancel>
                <DeletePopUp
                  handleDelete={handleDeleteAppointment}
                  object="appointment"
                />
                {/*<AlertDialogAction
                  className={`mr-auto ${small && "w-full"}`}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>*/}
                <AlertDialogAction
                  className="bg-button-primary"
                  variant="secondary"
                  onClick={async (e) => {
                  const success = await handleEditAppointment();
                  if (!success) {
                  e.preventDefault();
                    }
        }}
                >
                  Save Changes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ItemActions>
      </Item>
      <Item size="xs">
        <ItemContent>
          <ItemTitle className="text-muted-foreground">Type</ItemTitle>
          <ItemDescription className="text-foreground">
            {active?.type}
          </ItemDescription>
        </ItemContent>
      </Item>
      <Item size="xs">
        <ItemContent>
          <ItemTitle className="text-muted-foreground">Practitioner</ItemTitle>
          <ItemDescription className="text-foreground">{`Dr. ${active?.practitioner}`}</ItemDescription>
        </ItemContent>
      </Item>
      <Item size="xs">
        <ItemContent>
          <ItemTitle className="text-muted-foreground">Dob</ItemTitle>
          <ItemDescription className="text-foreground">
            {selectedAppointment?.dob}
          </ItemDescription>
        </ItemContent>
      </Item>
      <Item size="xs">
        <ItemContent>
          <ItemTitle className="text-muted-foreground">Email</ItemTitle>
          <ItemDescription className="text-foreground">
            {selectedAppointment?.email}
          </ItemDescription>
        </ItemContent>
      </Item>
      <Item className="w-full" size="xs">
        <ItemContent>
          <ItemTitle className="text-muted-foreground">Phone</ItemTitle>
          <ItemDescription className="text-foreground">
            {selectedAppointment?.phone}
          </ItemDescription>
        </ItemContent>
      </Item>
    </PopoverHeader>
  );
}
