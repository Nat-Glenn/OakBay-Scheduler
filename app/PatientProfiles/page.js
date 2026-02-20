"use client";
import { useState } from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { Search, Plus, MoreVertical, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Patients = [
  { 
    id: "P001", 
    name: "John Doe", 
    age: 42, 
    dob: "June 01, 1983",
    email: "johndoe@gmail.com",
    phone: "587-999-9999",
    status: "Active",
    lastVisit: "02/05/2026",
    nextAppt: "02/15/2026"
  },
  { 
    id: "P002", 
    name: "Jane Smith", 
    age: 29, 
    dob: "March 15, 1996",
    email: "janesmith@gmail.com",
    phone: "587-888-8888",
    status: "Active",
    lastVisit: "01/28/2026",
    nextAppt: "02/12/2026"
  },
  { 
    id: "P003", 
    name: "Robert Wilson", 
    age: 55, 
    dob: "August 10, 1970",
    email: "robertw@gmail.com",
    phone: "587-777-7777",
    status: "Inactive",
    lastVisit: "12/15/2025",
    nextAppt: null
  },
];

export default function PatientProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  // Removed <any> here to fix the ReferenceError
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = Patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex min-h-dvh w-full">
      <NavBarComp />
      <div className="flex-1 p-4">
        <header className="pb-4 px-4">
          <h1 className="text-3xl font-bold text-gray-800">Patient Profiles</h1>
          <p className="text-gray-500">Manage and view all registered patients.</p>
        </header>

        <div className="flex flex-col px-4">
          <div className="flex flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by name or ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/AddPatient">
              <Button className="bg-[#A0CE66] hover:bg-[#A0CE66]/60 hover:text-black/60 text-white font-bold rounded-md ml-auto gap-2">
                <Plus size={18} />
                Add Patient
              </Button>
            </Link>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex-1 rounded-lg border bg-card shadow-sm max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedPatient?.id === patient.id ? "bg-slate-100" : ""
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <TableCell className="font-mono text-sm">{patient.id}</TableCell>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{patient.lastVisit}</TableCell>
                      <TableCell>
                        <Badge className={patient.status === "Active" ? "bg-[#A0CE66] hover:bg-[#A0CE66]" : "bg-slate-400 hover:bg-slate-400"}>
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedPatient && (
              <div className="w-80">
                <Card>
                  <CardHeader>
                    <div className="flex flex-row items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-[#002D58] flex items-center justify-center">
                        <User className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{selectedPatient.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPatient.id}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-extrabold text-lg mb-2">Personal Information</p>
                      <div className="space-y-1 text-sm">
                        <p><b>Date of Birth:</b> {selectedPatient.dob} ({selectedPatient.age})</p>
                        <p><b>Email:</b> {selectedPatient.email}</p>
                        <p><b>Phone:</b> {selectedPatient.phone}</p>
                        <div className="flex gap-2 items-center">
                          <b>Status:</b>
                          <Badge className={selectedPatient.status === "Active" ? "bg-[#A0CE66] hover:bg-[#A0CE66]" : "bg-slate-400 hover:bg-slate-400"}>
                            {selectedPatient.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-extrabold text-lg mb-2">Appointment History</p>
                      <div className="space-y-1 text-sm">
                        <p><b>Last Visit:</b> {selectedPatient.lastVisit}</p>
                        <p><b>Next Appointment:</b> {selectedPatient.nextAppt || "None scheduled"}</p>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Link href={`/patients/${selectedPatient.id}`} className="block">
                        <Button className="w-full bg-[#002D58] hover:bg-[#002D58]/80 text-white font-semibold">
                          View Full Profile
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full font-semibold">
                        Schedule Appointment
                      </Button>
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