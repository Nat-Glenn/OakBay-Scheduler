"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import filter from "leo-profanity"; 
import NavBarComp from "@/components/NavBarComp";
import { Search, Plus, User, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import FormField from "@/components/FormField";
import { useMediaQuery } from "@/utils/UseMediaQuery";
import { toast } from "sonner";

const BLOCKED_WORDS = [
  "kill", "knife", "murder", "stab", "shoot", "gun",
  "suicide", "attack", "punch", "bomb", "threat"
];

// Whole-word matching to avoid false positives (e.g. "establishment" containing "stab")
function containsBlockedContent(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  const hasViolence = BLOCKED_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`);
    return regex.test(lower);
  });
  const hasProfanity = filter.check(lower);
  return hasViolence || hasProfanity;
}

// State Managements
export default function PatientProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const small = useMediaQuery("(max-width: 768px)");

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editDob, setEditDob] = useState(""); 
  const [editStat, setEditStat] = useState("Active");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");

  const statusOptions = [
    { id: 1, name: "Active" },
    { id: 2, name: "Inactive" },
  ];

  // Data Formatting

  // Applies MM/DD/YYYY mask as the user types
  function applyDobMask(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let result = digits;
    if (digits.length > 4) result = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    else if (digits.length > 2) result = digits.slice(0, 2) + "/" + digits.slice(2);
    return result;
  }

  // Converts masked string (MM/DD/YYYY) to DB format (YYYY-MM-DD)
  function dobToISO(value) {
    if (!value || value.length < 10) return null;
    const [mm, dd, yyyy] = value.split("/");
    if (!mm || !dd || !yyyy || yyyy.length < 4) return null;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // Converts DB date (YYYY-MM-DD) to input format (MM/DD/YYYY)
  function isoToMasked(isoString) {
    if (!isoString || isoString === "—") return "";
    const [yyyy, mm, dd] = isoString.split("-");
    return `${mm}/${dd}/${yyyy}`;
  }

  // Validates DOB is between 1 and 120 years old
  function validateDobRange(dobString) {
    if (!dobString || dobString.length < 10) return null;
    const [mm, dd, yyyy] = dobString.split("/");
    if (!mm || !dd || !yyyy || yyyy.length < 4) return null;

    const birth = new Date(`${yyyy}-${mm}-${dd}`);
    const today = new Date();

    if (isNaN(birth.getTime())) return "Please Enter a valid date of birth";
    if (birth > today) return "Please Enter a valid date of birth";

    const age = today.getFullYear() - birth.getFullYear();
    const notYetHadBirthday =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    const actualAge = notYetHadBirthday ? age - 1 : age;

    if (actualAge < 1) return "Please Enter a valid date of birth";
    if (actualAge > 120) return "Please Enter a valid date of birth";
    return null;
  }

  // Handles DOB input with masking + live range validation
  function handleEditDobChange(e) {
    const masked = applyDobMask(e.target.value);
    setEditDob(masked);

    if (masked.length === 10) {
      const ageError = validateDobRange(masked);
      setValidationError(ageError || "");
    } else {
      setValidationError("");
    }
  }

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to load patients");
        
        setPatients(data);

        if (selectedPatient) {
          const updatedSelected = data.find((p) => p.id === selectedPatient.id);
          if (updatedSelected) setSelectedPatient(getDisplayedPatient(updatedSelected));
        }
      } catch (err) {
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [searchTerm]);


  function calculateAge(dobString) {
    if (!dobString || dobString === "—") return "—";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  function formatDobDisplay(dobString) {
    if (!dobString || dobString === "—") return "—";
    const [yyyy, mm, dd] = dobString.split("-");
    return `${mm}/${dd}/${yyyy}`;
  }

  function getDisplayedPatient(patient) {
    return {
      ...patient,
      name: `${patient.firstName} ${patient.lastName}`,
      status: patient.reminderOptIn ? "Active" : "Inactive",
      age: calculateAge(patient.dob),
      dob: patient.dob || "—",
      lastVisit: "—",
      nextAppt: null,
    };
  }

  function openEditModal(patient) {
    setValidationError("");
    setEditForm({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      email: patient.email || "",
      phone: patient.phone || "",
      ahcNumber: patient.ahcNumber || "",
      notes: patient.notes || "",
    });
    setEditDob(patient.dob && patient.dob !== "—" ? isoToMasked(patient.dob) : "");
    setEditStat(patient.status || "Active");
    setEditOpen(true);
  }

  // Handles text input changes and triggers instant validation for blocked content
  function handleEditChange(e) {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName" || name === "notes") {
      if (containsBlockedContent(value)) {
        setValidationError(name === "notes" ? "Notes contain inappropriate language." : "Violence and Profanity is prohibited");
      } else {
        setValidationError("");
      }
    }
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  // Form Submission
  async function handleEditSave() {
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.phone.trim()) {
      toast.error("First name, last name, and phone are required.");
      return;
    }

    const isoDate = dobToISO(editDob);
    if (editDob && !isoDate) {
      setValidationError("Please enter a valid date (MM/DD/YYYY).");
      return;
    }

    // Date range validation (1–120 years)
    if (editDob) {
      const ageError = validateDobRange(editDob);
      if (ageError) {
        setValidationError(ageError);
        return;
      }
    }

    if (containsBlockedContent(editForm.firstName) || containsBlockedContent(editForm.lastName) || containsBlockedContent(editForm.notes)) {
      setValidationError("Please remove inappropriate language before saving.");
      toast.error("Validation failed: Inappropriate language detected.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim() || null,
          ahcNumber: editForm.ahcNumber.trim() || null,
          dob: isoDate,
          notes: editForm.notes.trim() || null,
          reminderOptIn: editStat !== "Inactive",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update patient");

      const refreshed = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`);
      const refreshedData = await refreshed.json();
      setPatients(refreshedData);
      const updated = refreshedData.find((p) => p.id === selectedPatient.id);
      if (updated) setSelectedPatient(getDisplayedPatient(updated));

      setEditOpen(false);
      toast.success("Patient updated successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to update patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
      <NavBarComp />
      
      <div className="flex flex-col min-w-0 px-4 pb-4 overflow-hidden">
        {/* HEADER: Search and Add Button */}
        <header className="flex flex-row py-4">
          {!small && <h1 className="text-3xl w-full font-bold text-foreground">Patients</h1>}
          <div className="flex flex-row justify-end gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <InputGroup className="bg-input text-foreground">
                <InputGroupInput
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroupAddon><Search size={18} /></InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton onClick={() => setSearchTerm("")}><X /></InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <Link href="/Patients/AddPatient">
              <Button className="bg-button-primary hover:bg-button-primary-foreground text-white font-bold gap-2">
                <Plus size={18} />{!small && "Add Patient"}
              </Button>
            </Link>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col min-h-0">
          <div className="flex flex-col md:flex-row gap-4 min-h-0">
            
            {/* PATIENTS TABLE */}
            <div className="rounded-xl border border-foreground bg-dropdown flex flex-1 flex-col min-h-0">
              <div className="min-h-0 overflow-y-auto scrollbar-rounded rounded-xl">
                <Table>
                  <TableHeader className="bg-input border-b border-foreground">
                    <TableRow className="hover:bg-transparent border-foreground text-foreground">
                      <TableHead className="w-[120px] text-button-primary font-bold">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">Loading Patients</TableCell></TableRow>
                    ) : patients.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">No Patients Found</TableCell></TableRow>
                    ) : (
                      patients.map((rawPatient) => {
                        const patient = getDisplayedPatient(rawPatient);
                        return (
                          <TableRow
                            key={patient.id}
                            className={`cursor-pointer border-foreground/30 transition-colors ${selectedPatient?.id === patient.id ? "bg-ring/10" : "hover:bg-border/30"}`}
                            onClick={() => setSelectedPatient(selectedPatient?.id === patient.id ? null : patient)}
                          >
                            <TableCell className="font-mono text-sm text-button-primary">{patient.id}</TableCell>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell>{patient.lastVisit}</TableCell>
                            <TableCell>
                              <Badge className={`border-none w-24 justify-center ${patient.status === "Active" ? "bg-green-500 text-black" : "bg-slate-800 text-slate-100"}`}>
                                {patient.status}
                              </Badge>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* SELECTED PATIENT SIDE PANEL */}
            {selectedPatient && (
              <div className={`flex w-full md:w-1/4 animate-in ${small ? "slide-in-from-bottom-4" : "slide-in-from-right-4"} duration-200`}>
                <Card className="h-full w-full bg-dropdown border-foreground text-foreground relative overflow-hidden flex flex-col">
                  <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-8 w-8 rounded-full text-white" onClick={() => setSelectedPatient(null)}><X size={16} /></Button>
                  <CardHeader className="border-b border-foreground/30 pb-6">
                    <div className="flex flex-row items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-ring/20 flex items-center justify-center border border-ring/30"><User className="text-ring" size={28} /></div>
                      <div>
                        <p className="font-bold text-xl leading-tight">{selectedPatient.name}</p>
                        <p className="text-sm text-button-primary font-mono">{selectedPatient.id}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4 overflow-y-auto flex-1 scrollbar-rounded">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase text-muted-foreground">Personal Information</h3>
                      <div className="grid gap-4 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground font-bold">DOB</span><span>{selectedPatient.dob !== "—" ? `${formatDobDisplay(selectedPatient.dob)} (${selectedPatient.age})` : "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-bold">Email</span><span className="truncate ml-4">{selectedPatient.email || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-bold">Phone</span><span>{selectedPatient.phone}</span></div>
                      </div>
                    </div>
                    <div className="pt-4 mt-auto space-y-2">
                      <Button variant="default" className="w-full font-bold" onClick={() => openEditModal(selectedPatient)}><Pencil size={14} className="mr-2" /> Edit Patient</Button>
                      <Link href="/?fromPatient=true" className="block w-full"><Button variant="secondary" className="w-full font-bold">Schedule Appointment</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PATIENT MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-background border-foreground text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-lg font-black uppercase tracking-tight">Edit Patient</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField fieldLabel="First Name" name="firstName" value={editForm.firstName} onChange={handleEditChange} maxLength={30} variant="add" />
              <FormField fieldLabel="Last Name" name="lastName" value={editForm.lastName} onChange={handleEditChange} maxLength={30} variant="add" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField fieldLabel="Email" mode="email" name="email" value={editForm.email} onChange={handleEditChange} variant="add" />
              <FormField fieldLabel="Phone Number" name="phone" value={editForm.phone} onChange={handleEditChange} mask="phone" variant="add" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField fieldLabel="AHC Number" name="ahcNumber" value={editForm.ahcNumber} onChange={handleEditChange} mask="ahc" variant="add" />
              <FormField
                fieldLabel="Date of Birth"
                placeholder="MM/DD/YYYY"
                variant="add"
                name="editDob"
                value={editDob}
                onChange={handleEditDobChange}
                maxLength={10}
                inputMode="numeric"
                className={
                  validationError && (validationError.includes("date") || validationError.includes("year") || validationError.includes("valid"))
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : ""
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField fieldLabel="Status" displayText={editStat} setItemSearch={setEditStat} itemsArray={statusOptions} variant="select" />
            </div>
            <Field className="flex flex-col gap-2">
              <FieldLabel className="font-bold">Notes</FieldLabel>
              <textarea
                className={`w-full min-h-20 rounded-md border px-3 py-2 text-sm bg-background dark:bg-input/30 transition-all ${
                  validationError.includes("Notes") ? "border-red-500 ring-2 ring-red-500/20" : "border-foreground"
                }`}
                name="notes"
                value={editForm.notes}
                onChange={handleEditChange}
                placeholder="Optional notes"
              />
            </Field>

            {validationError && (
              <p className="text-sm text-red-500 font-bold uppercase italic animate-pulse">
                {validationError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 pt-4 border-t border-foreground/20">
            <DialogClose asChild><Button variant="outline" className="font-bold">Cancel</Button></DialogClose>
            <Button onClick={handleEditSave} disabled={saving || !!validationError} className="bg-button-primary hover:bg-button-primary-foreground text-white font-bold">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}