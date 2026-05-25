"use client";
import { useEffect, useMemo, useState } from "react";
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
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
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
import { apiFetch } from "@/utils/apiFetch";
import { dbStatusToUi, APPOINTMENT_TYPE_OPTIONS } from "@/lib/appointments/status";
import {
  getOfficeTimeSlotsForDate,
  toFormOptions,
} from "@/lib/clinic/officeHours.js";
import { formatPickerDateForApi } from "@/lib/appointments/clinicTime.js";
import {
  buildPractitionerDropdownItems,
  getWorkingProviderNamesForSlot,
} from "@/lib/shifts/clientUtils";

export default function AddAppointment({
  appointments,
  setAppointments,
  date,
  setDate,
  dayShifts = [],
  scheduleEnforced = false,
  variant = "default",
  patientId = null,
  open,
  onOpenChange,
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
  const [isOpen, setIsOpen] = useState(open ?? false);
    const [validationError, setValidationError] = useState("");

  const types = APPOINTMENT_TYPE_OPTIONS;
  const dateIso = useMemo(
    () => (date ? formatPickerDateForApi(date) : ""),
    [date],
  );
  const time = useMemo(
    () => toFormOptions(getOfficeTimeSlotsForDate(dateIso)),
    [dateIso],
  );

  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, [patientId]);

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) {
        setPatient(null);
        setFormName("");
        setSelectedPatientId(null);
        return;
      }

      try {
        const res = await apiFetch(`/api/patients/${patientId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load patient");
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
        const res = await apiFetch("/api/patients");
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
        const res = await apiFetch("/api/practitioners");
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

  useEffect(() => {
    if (!scheduleEnforced || !formTime || !formPractitioner) return;
    const working = getWorkingProviderNamesForSlot(
      dayShifts,
      dateIso,
      formTime,
    );
    if (!working.has(formPractitioner)) {
      setFormPractitioner("");
    }
  }, [
    scheduleEnforced,
    formTime,
    formPractitioner,
    dayShifts,
    dateIso,
  ]);

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
      return buildPractitionerDropdownItems({
        practitioners,
        dayShifts,
        scheduleEnforced,
        dateIso,
        clockTime: formTime || null,
        search,
      });
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
      setValidationError("Please select a patient.")
      return false;
    }

    if (!formType || !formPractitioner || !formTime || !date) {
      setValidationError("Please fill out all of the fields.")
      return false;
    }

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      setValidationError("Cannot book appointments for past dates.");
      return false;
    }

    const formattedDate = formatDateDMY(date);
    const workingAtTime = scheduleEnforced
      ? getWorkingProviderNamesForSlot(dayShifts, dateIso, formTime)
      : null;

    if (
      scheduleEnforced &&
      formPractitioner &&
      workingAtTime &&
      !workingAtTime.has(formPractitioner)
    ) {
      setValidationError(
        "This chiropractor is not scheduled to work at this time. Check the staff schedule.",
      );
      return false;
    }

    const availableSlot = getAvailableSlot(
      appointments,
      formattedDate,
      formTime,
      formPractitioner,
      finalPatientId,
      workingAtTime,
    );

    if (!availableSlot) {
      setValidationError(
        scheduleEnforced && workingAtTime?.size === 0
          ? "No chiropractors are on shift at this time."
          : "No available slot for this time (clinic full, off shift, or already booked).",
      );
      return false;
    }

    try {
      setSubmitting(true);

      const [hours, minutes] = formTime.split(":").map(Number);

const start = new Date(date);
start.setHours(hours, minutes, 0, 0);

const now = new Date();
if (start <= now) {
  setValidationError("Cannot book an appointment for a time that has already passed.");
  setSubmitting(false);
  return false;
}

const end = new Date(start);
end.setMinutes(end.getMinutes() + 15);

      const practitioner = practitioners.find(
        (p) => p.name === formPractitioner,
      );

      const res = await apiFetch("/api/appointments", {
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
        }),
      });

      const data = await res.json();

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
        status: dbStatusToUi(data.status),
      };
      router.refresh();
      setAppointments((prev) => [...prev, newAppointment]);
      toast.success(
        `Appointment created on ${newAppointment.date} at ${newAppointment.time} for ${newAppointment.name}.`,
        {
          position: "top-center",
        },
      );
      setValidationError("");
      return true;
      
    } catch (err) {
  setValidationError(err.message || "Failed to create appointment.");
  return false;
} finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange} className="bg-background">
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
          <AlertDialogDescription>
                    Create a new appointment and add it to the schedule.
          </AlertDialogDescription>

          <div className="w-full max-w-md">
            <form>
              <FieldGroup>
                <FieldSet>

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
                        {validationError && (
              <p className="text-sm text-center text-red-500 font-bold uppercase italic animate-pulse pt-4">
                {validationError}
              </p>
            )}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction
            disabled={submitting}
            className="bg-button-primary hover:bg-button-primary-foreground text-white"
            onClick={async (e) => {
              e.preventDefault(); // always prevent auto-close

              const success = await handleCreateAppointment();

              if (success) {
                setIsOpen(false); // close ONLY on success
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
