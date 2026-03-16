"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { Search, Plus, MoreVertical, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDarkMode } from "@/utils/DarkModeProvider";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/utils/UseMediaQuery";

export default function PatientProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const small = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/patients?search=${encodeURIComponent(searchTerm)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load patients");
        }

        setPatients(data);

        if (selectedPatient) {
          const updatedSelected = data.find((p) => p.id === selectedPatient.id);
          // If the patient still exists, update the selected state with fresh data
          if (updatedSelected) {
            setSelectedPatient(getDisplayedPatient(updatedSelected));
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, [searchTerm]);

  // NEW LOGIC: Calculate age from the "YYYY-MM-DD" string
  function calculateAge(dobString) {
    if (!dobString || dobString === "—") return "—";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function getDisplayedPatient(patient) {
    return {
      ...patient,
      name: `${patient.firstName} ${patient.lastName}`,
      status: patient.reminderOptIn ? "Active" : "Inactive",
      age: calculateAge(patient.dob), // Now dynamically calculated
      dob: patient.dob || "—",
      lastVisit: "—",
      nextAppt: null,
    };
  }

  return (
    <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 px-4 pb-4 overflow-hidden">
        {/* PAGE HEADER */}
        <header className="flex flex-row py-4">
          {!small && (
            <h1 className="text-3xl w-full font-bold text-foreground">
              Patients
            </h1>
          )}

          {/* SEARCH & ACTIONS BAR */}
          <div className="flex flex-row justify-end gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <InputGroup className="bg-input text-foreground placeholder:text-muted-foreground ">
                <InputGroupInput
                  placeholder="Search by name or ID..."
                  className="focus-visible:ring-ring"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroupAddon>
                  <Search size={18} />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton onClick={() => setSearchTerm("")}>
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Link href="/Patients/AddPatient">
              <Button className="bg-button-primary hover:bg-button-primary-foreground text-white font-bold gap-2 shadow-lg shadow-[#A0CE66]/10">
                <Plus size={18} />
                {small ? "" : "Add Patient"}
              </Button>
            </Link>
          </div>
        </header>

        <div className="flex flex-col min-h-0">
          {/* MAIN CONTENT AREA */}
          <div className="flex flex-col md:flex-row gap-4 min-h-0">
            {/* PATIENT LIST TABLE */}
            <div className="rounded-xl border border-foreground bg-dropdown flex flex-1 flex-col min-h-0">
              <div className="min-h-0 overflow-y-auto scrollbar-rounded rounded-xl">
                <Table>
                  <TableHeader className="bg-input border-b border-foreground">
                    <TableRow className="hover:bg-transparent border-foreground">
                      <TableHead className="w-[120px] text-button-primary font-bold">
                        ID
                      </TableHead>
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Age</TableHead>
                      <TableHead className="text-foreground">
                        Last Visit
                      </TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading Patients
                        </TableCell>
                      </TableRow>
                    ) : patients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No Patients Found
                        </TableCell>
                      </TableRow>
                    ) : (
                      patients.map((rawPatient) => {
                        const patient = getDisplayedPatient(rawPatient);

                        return (
                          <TableRow
                            key={patient.id}
                            className={`cursor-pointer border-foreground/30 transition-colors ${
                              selectedPatient?.id === patient.id
                                ? "bg-ring/10"
                                : "hover:bg-border/30"
                            }`}
                            onClick={() => {
                              if (selectedPatient?.id === patient.id) {
                                setSelectedPatient(null);
                              } else {
                                setSelectedPatient(patient);
                              }
                            }}
                          >
                            <TableCell className="font-mono text-sm text-button-primary">
                              {patient.id}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {patient.name}
                            </TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell className="text-sm text-foreground">
                              {patient.lastVisit}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`border-none ${
                                  patient.status === "Active"
                                    ? "bg-[#a0ce66] text-black"
                                    : "bg-slate-800 text-slate-100"
                                }`}
                              >
                                {patient.status}
                              </Badge>
                            </TableCell>
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                            ></TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* PATIENT DETAIL SIDE-CARD */}
            {selectedPatient && (
              <div
                className={`flex w-full md:w-1/4 animate-in ${small ? "slide-in-from-bottom-4" : "slide-in-from-right-4"} duration-200`}
              >
                <Card className="h-full w-full bg-dropdown border-foreground text-foreground relative overflow-hidden flex flex-col">
                  {/* CLOSE BUTTON */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full text-white hover:bg-slate-800 hover:text-white/80 cursor-pointer z-10"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X size={16} />
                  </Button>

                  <CardHeader className="border-b border-foreground/30 pb-6">
                    <div className="flex flex-row items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-ring/20 flex items-center justify-center border border-ring/30">
                        <User className="text-ring" size={28} />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-foreground leading-tight">
                          {selectedPatient.name}
                        </p>
                        <p className="text-sm text-button-primary font-mono">
                          {selectedPatient.id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4 overflow-y-auto flex-1 scrollbar-rounded">
                    {/* PERSONAL INFO */}
                    <div className="space-y-4">
                      <h3 className="text-title text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Personal Information
                      </h3>
                      <div className="grid gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Date of Birth
                          </span>
                          <span className="text-foreground">
                            {selectedPatient.dob} ({selectedPatient.age})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Email
                          </span>
                          <span className="text-foreground truncate ml-4">
                            {selectedPatient.email || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Phone
                          </span>
                          <span className="text-foreground">
                            {selectedPatient.phone}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-bold">
                            Status
                          </span>
                          <Badge
                            className={
                              selectedPatient.status === "Active"
                                ? "bg-[#A0CE66] text-black border-none"
                                : "bg-slate-700 text-slate-300 border-none"
                            }
                          >
                            {selectedPatient.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* HISTORY */}
                    <div className="space-y-4 pt-4 border-t border-foreground/30">
                      <h3 className="text-foreground text-xs font-black uppercase tracking-widest">
                        Appointment History
                      </h3>
                      <div className="grid gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Last Visit
                          </span>
                          <span className="text-foreground">
                            {selectedPatient.lastVisit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Next Appointment
                          </span>
                          <span className="text-button-primary font-medium">
                            {selectedPatient.nextAppt || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-4 space-y-2 mt-auto">
                      <Link href={"/Appointments?fromPatient=true"}>
                        <Button
                          variant="secondary"
                          className="w-full font-bold"
                        >
                          Schedule Appointment
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
