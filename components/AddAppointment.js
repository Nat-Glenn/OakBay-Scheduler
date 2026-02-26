"use client";
import { useState } from "react";
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
import { toast } from "sonner";
import {
  formatDateDMY,
  getAvailableSlot,
} from "@/components/RenderAppointment";
import DatePicker from "./DatePicker";
import FormField from "@/components/FormField";

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
  const [search, setSearch] = useState("");
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
    if (type == "customers") {
      return customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase()),
      );
    }
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
        <Button className="w-[175px] bg-button-primary hover:bg-button-primary-foreground text-white text-center font-bold rounded-md pointer-cursor">
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
                  <FormField
                    fieldLabel={"Customer Name"}
                    displayText={formName}
                    search={search}
                    setSearch={setSearch}
                    itemsArray={filteredArray("customers")}
                    emptyText={"No customer found"}
                    setItemSearch={setFormName}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      fieldLabel={"Type"}
                      displayText={formType}
                      search={search}
                      setSearch={setSearch}
                      itemsArray={filteredArray("types")}
                      emptyText={"No types found"}
                      setItemSearch={setFormType}
                    />
                    <Field>
                      <FieldLabel htmlFor="date">Date</FieldLabel>
                      <DatePicker date={date} setDate={setDate} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      fieldLabel={"Practitioner"}
                      displayText={formPractitioner}
                      search={search}
                      setSearch={setSearch}
                      itemsArray={filteredArray("practitioners")}
                      emptyText={"No practitioners found"}
                      setItemSearch={setFormPractitioner}
                    />
                    <FormField
                      fieldLabel={"Time"}
                      displayText={formTime}
                      search={search}
                      setSearch={setSearch}
                      itemsArray={filteredArray("time")}
                      emptyText={"No time found"}
                      setItemSearch={setFormTime}
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
