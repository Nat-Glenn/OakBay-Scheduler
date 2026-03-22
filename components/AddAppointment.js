"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { DatePicker } from "./DatePicker";
import FormField from "@/components/FormField";
import { Plus } from "lucide-react";

export default function AddAppointment({
  appointments,
  setAppointments,
  date,
  setDate,
  variant = "default",
  patientId = null,
  open,
}) {
  const router = useRouter();

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formPractitioner, setFormPractitioner] = useState("");
  const [formTime, setFormTime] = useState("");
  const [search, setSearch] = useState("");
  const [patient, setPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || null);

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

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) {
        setPatient(null);
        setFormName("");
        setSelectedPatientId(null);
        return;
      }

      try {
        const res = await fetch(`/api/patients/${patientId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.Error || "Failed to load patient");
        }

        setPatient(data);
        setSelectedPatientId(data.id);
        setFormName(`${data.firstName} ${data.lastName}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load selected patient.", {
          position: "top-right",
        });
      }
    }

    loadPatient();
  }, [patientId]);

  useEffect(() => {
    async function loadPatients() {
      if (patientId) return;

      try {
        const res = await fetch("/api/patients");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load patients");
        }

        setPatients(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load patients.", {
          position: "top-right",
        });
      }
    }

    loadPatients();
  }, [patientId]);

  useEffect(() => {
    async function loadPractitioners() {
      try {
        const res = await fetch("/api/practitioners");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load practitioners");
        }

        setPractitioners(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load practitioners.", {
          position: "top-right",
        });
      }
    }

    loadPractitioners();
  }, []);

  const filteredArray = (type) => {
    if (type === "customers") {
      return patients
        .map((p) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          email: p.email,
        }))
        .filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            String(p.id).includes(search),
        );
    }

    if (type === "types") {
      return types.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (type === "practitioners") {
      return practitioners.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (type === "time") {
      return time.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return [];
  };

  const handleCreateAppointment = async () => {
    const finalPatientId = patientId || selectedPatientId;

    if (!finalPatientId) {
      toast.warning("Please select a patient.", {
        position: "top-right",
      });
      return false;
    }

    if (!formType || !formPractitioner || !formTime || !date) {
      toast.warning("Please fill out all of the fields.", {
        position: "top-right",
      });
      return false;
    }

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      toast.warning("Cannot book appointments for past dates.", {
        position: "top-right",
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
        position: "top-right",
      });
      return false;
    }

    try {
      setSubmitting(true);

      const [hours, minutes] = formTime.split(":").map(Number);

      const start = new Date(date);
      start.setHours(hours, minutes, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 15);

      const practitioner = practitioners.find(
        (p) => p.name === formPractitioner,
      );

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: Number(finalPatientId),
          providerId: practitioner ? Number(practitioner.id) : null,
          type: formType,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: "confirmed",
        }),
      });

      const data = await res.json();
      console.log("Created appointment response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to create appointment");
      }

      const providerName = data.provider?.name || formPractitioner;

      const patientName = data.patient
        ? `${data.patient.firstName ?? ""} ${data.patient.lastName ?? ""}`.trim()
        : formName || "Unknown Patient";

      const newAppointment = {
        id: data.id,
        name: patientName,
        dob: "—",
        email: data.patient?.email || "—",
        phone: data.patient?.phone || "—",
        type: data.type,
        practitioner: providerName,
        time: formTime,
        slot: availableSlot,
        date: formattedDate,
        status: data.status,
      };
      router.refresh();
      setAppointments((prev) => [...prev, newAppointment]);
      toast.success(
        `Appointment created on ${newAppointment.date} at ${newAppointment.time} for ${newAppointment.name}.`,
        {
          position: "top-right",
        },
      );

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to create appointment.", {
        position: "top-right",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog defaultOpen={open} className="bg-background">
      <AlertDialogTrigger asChild>
        <Button
          className={`${variant === "icon" ? "flex items-center" : "flex"}`}
        >
          <Plus size={18} />
          {variant === "icon" ? "" : "New Appointment"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-background text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Add a new appointment</AlertDialogTitle>

          <div className="w-full max-w-md">
            <form>
              <FieldGroup>
                <FieldSet>
                  <FieldDescription>
                    Create a new appointment and add it to the schedule.
                  </FieldDescription>

                  {patientId ? (
                    <Field>
                      <FieldLabel className="font-bold">
                        Customer Name
                      </FieldLabel>
                      <div className="w-full rounded-md border border-foreground px-3 py-2 text-sm">
                        {patient
                          ? `${patient.firstName} ${patient.lastName}`
                          : "No patient selected"}
                      </div>
                    </Field>
                  ) : (
                    <FormField
                      fieldLabel={"Customer Name"}
                      displayText={formName}
                      search={search}
                      setSearch={setSearch}
                      itemsArray={filteredArray("customers")}
                      emptyText={"No patient found"}
                      setItemSearch={(selectedName) => {
                        setFormName(selectedName);
                        const selected = patients.find(
                          (p) =>
                            `${p.firstName} ${p.lastName}` === selectedName,
                        );
                        setSelectedPatientId(selected ? selected.id : null);
                      }}
                    />
                  )}

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
                      <FieldLabel className="font-bold" htmlFor="date">
                        Date
                      </FieldLabel>
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
            disabled={submitting}
            className="bg-button-primary hover:bg-button-primary-foreground text-white"
            onClick={async (e) => {
              const success = await handleCreateAppointment();
              if (!success) {
                e.preventDefault();
              }
            }}
          >
            {submitting ? "Creating..." : "Create"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
