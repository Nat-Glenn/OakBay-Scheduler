"use client";
import { useState } from "react";
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
    nextAppt: "02/15/2026",
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
    nextAppt: "02/12/2026",
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
    nextAppt: null,
  },
  {
    id: "P004",
    name: "Sarah Jenkins",
    age: 34,
    dob: "Nov 22, 1991",
    email: "s.jenkins@outlook.com",
    phone: "587-444-5555",
    status: "Active",
    lastVisit: "02/01/2026",
    nextAppt: "02/20/2026",
  },
  {
    id: "P005",
    name: "Michael Chen",
    age: 31,
    dob: "Jan 05, 1995",
    email: "mchen88@gmail.com",
    phone: "403-222-3333",
    status: "Active",
    lastVisit: "01/15/2026",
    nextAppt: "03/10/2026",
  },
  {
    id: "P006",
    name: "Emily Brown",
    age: 62,
    dob: "Sept 14, 1963",
    email: "ebrown@shaw.ca",
    phone: "587-111-2222",
    status: "Inactive",
    lastVisit: "10/05/2025",
    nextAppt: null,
  },
  {
    id: "P007",
    name: "David Miller",
    age: 47,
    dob: "May 30, 1978",
    email: "miller.d@gmail.com",
    phone: "403-555-0199",
    status: "Active",
    lastVisit: "02/08/2026",
    nextAppt: "02/22/2026",
  },
  {
    id: "P008",
    name: "Lisa Thompson",
    age: 24,
    dob: "Dec 12, 2001",
    email: "lisa.t@icloud.com",
    phone: "587-666-7788",
    status: "Active",
    lastVisit: "01/20/2026",
    nextAppt: "02/14/2026",
  },
  {
    id: "P009",
    name: "Kevin Vane",
    age: 38,
    dob: "July 04, 1987",
    email: "kvane@protonmail.com",
    phone: "403-999-8877",
    status: "Active",
    lastVisit: "02/10/2026",
    nextAppt: "02/28/2026",
  },
  {
    id: "P010",
    name: "Amanda Lee",
    age: 51,
    dob: "Oct 19, 1974",
    email: "alee.medical@gmail.com",
    phone: "587-333-4411",
    status: "Inactive",
    lastVisit: "08/12/2025",
    nextAppt: null,
  },
  {
    id: "P011",
    name: "Marcus Wright",
    age: 22,
    dob: "Feb 28, 2003",
    email: "m.wright@gmail.com",
    phone: "403-777-6655",
    status: "Active",
    lastVisit: "01/05/2026",
    nextAppt: "02/18/2026",
  },
  {
    id: "P012",
    name: "Sophia Garcia",
    age: 33,
    dob: "April 10, 1992",
    email: "sophia.g@yahoo.com",
    phone: "587-222-1199",
    status: "Active",
    lastVisit: "02/11/2026",
    nextAppt: "02/25/2026",
  },
  {
    id: "P013",
    name: "James Taylor",
    age: 45,
    dob: "Jan 12, 1981",
    email: "jtaylor@gmail.com",
    phone: "587-123-4567",
    status: "Active",
    lastVisit: "02/12/2026",
    nextAppt: "03/01/2026",
  },
  {
    id: "P014",
    name: "Olivia Martinez",
    age: 27,
    dob: "June 25, 1998",
    email: "oliviam@gmail.com",
    phone: "403-234-5678",
    status: "Active",
    lastVisit: "02/09/2026",
    nextAppt: "02/19/2026",
  },
  {
    id: "P015",
    name: "William Anderson",
    age: 60,
    dob: "Sept 05, 1965",
    email: "wanderson@gmail.com",
    phone: "587-345-6789",
    status: "Inactive",
    lastVisit: "11/20/2025",
    nextAppt: null,
  },
  {
    id: "P016",
    name: "Isabella Thomas",
    age: 35,
    dob: "Nov 15, 1990",
    email: "ithomas@gmail.com",
    phone: "403-456-7890",
    status: "Active",
    lastVisit: "02/05/2026",
    nextAppt: "02/20/2026",
  },
  {
    id: "P017",
    name: "Ethan Jackson",
    age: 39,
    dob: "Mar 22, 1986",
    email: "ejackson@gmail.com",
    phone: "587-567-8901",
    status: "Active",
    lastVisit: "01/30/2026",
    nextAppt: "02/14/2026",
  },
  {
    id: "P018",
    name: "Mia White",
    age: 31,
    dob: "July 08, 1994",
    email: "miawhite@gmail.com",
    phone: "403-678-9012",
    status: "Inactive",
    lastVisit: "09/15/2025",
    nextAppt: null,
  },
  {
    id: "P019",
    name: "Alexander Harris",
    age: 48,
    dob: "May 18, 1977",
    email: "aharris@gmail.com",
    phone: "587-789-0123",
    status: "Active",
    lastVisit: "02/02/2026",
    nextAppt: "02/16/2026",
  },
  {
    id: "P020",
    name: "Charlotte Lewis",
    age: 26,
    dob: "Dec 30, 1999",
    email: "clewis@gmail.com",
    phone: "403-890-1234",
    status: "Active",
    lastVisit: "02/10/2026",
    nextAppt: "02/24/2026",
  },
  {
    id: "P021",
    name: "Daniel Walker",
    age: 52,
    dob: "Aug 12, 1973",
    email: "dwalker@gmail.com",
    phone: "587-901-2345",
    status: "Active",
    lastVisit: "01/25/2026",
    nextAppt: "02/08/2026",
  },
  {
    id: "P022",
    name: "Amelia Hall",
    age: 41,
    dob: "Feb 05, 1985",
    email: "ahall@gmail.com",
    phone: "403-012-3456",
    status: "Inactive",
    lastVisit: "10/10/2025",
    nextAppt: null,
  },
  {
    id: "P023",
    name: "Henry Young",
    age: 37,
    dob: "June 14, 1988",
    email: "hyoung@gmail.com",
    phone: "587-123-4561",
    status: "Active",
    lastVisit: "02/04/2026",
    nextAppt: "02/18/2026",
  },
  {
    id: "P024",
    name: "Evelyn King",
    age: 30,
    dob: "Oct 20, 1995",
    email: "eking@gmail.com",
    phone: "403-234-5672",
    status: "Active",
    lastVisit: "02/11/2026",
    nextAppt: "02/25/2026",
  },
  {
    id: "P025",
    name: "Sebastian Wright",
    age: 28,
    dob: "Jan 15, 1998",
    email: "swright@gmail.com",
    phone: "587-345-6783",
    status: "Active",
    lastVisit: "01/15/2026",
    nextAppt: "02/01/2026",
  },
  {
    id: "P026",
    name: "Harper Scott",
    age: 44,
    dob: "April 05, 1981",
    email: "hscott@gmail.com",
    phone: "403-456-7894",
    status: "Inactive",
    lastVisit: "12/05/2025",
    nextAppt: null,
  },
  {
    id: "P027",
    name: "Jack Green",
    age: 50,
    dob: "July 22, 1975",
    email: "jgreen@gmail.com",
    phone: "587-567-8905",
    status: "Active",
    lastVisit: "02/01/2026",
    nextAppt: "02/15/2026",
  },
  {
    id: "P028",
    name: "Aria Adams",
    age: 23,
    dob: "Sept 10, 2002",
    email: "aadams@gmail.com",
    phone: "403-678-9016",
    status: "Active",
    lastVisit: "02/08/2026",
    nextAppt: "02/22/2026",
  },
  {
    id: "P029",
    name: "Owen Baker",
    age: 33,
    dob: "Mar 30, 1992",
    email: "obaker@gmail.com",
    phone: "587-789-0127",
    status: "Active",
    lastVisit: "01/20/2026",
    nextAppt: "02/03/2026",
  },
  {
    id: "P030",
    name: "Scarlett Nelson",
    age: 29,
    dob: "Nov 12, 1996",
    email: "snelson@gmail.com",
    phone: "403-890-1238",
    status: "Inactive",
    lastVisit: "11/12/2025",
    nextAppt: null,
  },
  {
    id: "P031",
    name: "Luke Carter",
    age: 46,
    dob: "May 05, 1979",
    email: "lcarter@gmail.com",
    phone: "587-901-2349",
    status: "Active",
    lastVisit: "02/03/2026",
    nextAppt: "02/17/2026",
  },
  {
    id: "P032",
    name: "Chloe Mitchell",
    age: 36,
    dob: "Aug 18, 1989",
    email: "cmitchell@gmail.com",
    phone: "403-012-3450",
    status: "Active",
    lastVisit: "02/12/2026",
    nextAppt: "02/26/2026",
  },
  {
    id: "P033",
    name: "Gabriel Perez",
    age: 32,
    dob: "Oct 25, 1993",
    email: "gperez@gmail.com",
    phone: "587-123-4562",
    status: "Active",
    lastVisit: "01/10/2026",
    nextAppt: "01/24/2026",
  },
  {
    id: "P034",
    name: "Luna Roberts",
    age: 25,
    dob: "Dec 05, 2000",
    email: "lroberts@gmail.com",
    phone: "403-234-5673",
    status: "Inactive",
    lastVisit: "07/15/2025",
    nextAppt: null,
  },
  {
    id: "P035",
    name: "Julian Turner",
    age: 49,
    dob: "Feb 15, 1977",
    email: "jturner@gmail.com",
    phone: "587-345-6784",
    status: "Active",
    lastVisit: "02/06/2026",
    nextAppt: "02/20/2026",
  },
  {
    id: "P036",
    name: "Hazel Phillips",
    age: 27,
    dob: "June 30, 1998",
    email: "hphillips@gmail.com",
    phone: "403-456-7895",
    status: "Active",
    lastVisit: "02/09/2026",
    nextAppt: "02/23/2026",
  },
  {
    id: "P037",
    name: "Levi Campbell",
    age: 38,
    dob: "Sept 20, 1987",
    email: "lcampbell@gmail.com",
    phone: "587-567-8906",
    status: "Active",
    lastVisit: "01/30/2026",
    nextAppt: "02/13/2026",
  },
  {
    id: "P038",
    name: "Zoey Parker",
    age: 31,
    dob: "Nov 05, 1994",
    email: "zparker@gmail.com",
    phone: "403-678-9017",
    status: "Inactive",
    lastVisit: "10/01/2025",
    nextAppt: null,
  },
  {
    id: "P039",
    name: "Isaac Evans",
    age: 43,
    dob: "Jan 10, 1983",
    email: "ievans@gmail.com",
    phone: "587-789-0128",
    status: "Active",
    lastVisit: "02/02/2026",
    nextAppt: "02/16/2026",
  },
  {
    id: "P040",
    name: "Stella Edwards",
    age: 34,
    dob: "Mar 15, 1991",
    email: "sedwards@gmail.com",
    phone: "403-890-1239",
    status: "Active",
    lastVisit: "02/07/2026",
    nextAppt: "02/21/2026",
  },
  {
    id: "P041",
    name: "Anthony Collins",
    age: 54,
    dob: "May 22, 1971",
    email: "acollins@gmail.com",
    phone: "587-901-2340",
    status: "Active",
    lastVisit: "01/15/2026",
    nextAppt: "01/29/2026",
  },
  {
    id: "P042",
    name: "Violet Stewart",
    age: 22,
    dob: "July 30, 2003",
    email: "vstewart@gmail.com",
    phone: "403-012-3451",
    status: "Inactive",
    lastVisit: "09/05/2025",
    nextAppt: null,
  },
  {
    id: "P043",
    name: "Christopher Morris",
    age: 40,
    dob: "Oct 12, 1985",
    email: "cmorris@gmail.com",
    phone: "587-123-4563",
    status: "Active",
    lastVisit: "02/04/2026",
    nextAppt: "02/18/2026",
  },
  {
    id: "P044",
    name: "Audrey Rogers",
    age: 28,
    dob: "Dec 25, 1997",
    email: "arogers@gmail.com",
    phone: "403-234-5674",
    status: "Active",
    lastVisit: "02/11/2026",
    nextAppt: "02/25/2026",
  },
  {
    id: "P045",
    name: "Thomas Reed",
    age: 37,
    dob: "Feb 20, 1989",
    email: "treed@gmail.com",
    phone: "587-345-6785",
    status: "Active",
    lastVisit: "01/20/2026",
    nextAppt: "02/03/2026",
  },
];
export default function PatientProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = Patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const { boolDark } = useDarkMode();

  return (
    <main className="flex h-dvh w-full bg-background text-foreground overflow-hidden">
      <NavBarComp />

      <div className="flex-1 flex flex-col min-w-0">
        {/* PAGE HEADER */}
        <header className="p-8 pb-4">
          <h1 className="text-3xl font-bold text-foreground">
            Patient Profiles
          </h1>
          <p className="text-muted-foreground">
            Manage and view all registered patients.
          </p>
        </header>

        <div className="flex-1 flex flex-col px-8 pb-8 min-h-0">
          {/* SEARCH & ACTIONS BAR */}
          <div className="flex flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <InputGroup className="bg-input border-border text-foreground placeholder:text-muted-foreground ">
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

            <Link href="/PatientProfiles/AddPatient">
              <Button className="bg-button-primary hover:bg-button-primary-foreground text-white font-bold gap-2 shadow-lg shadow-[#A0CE66]/10">
                <Plus size={18} />
                Add Patient
              </Button>
            </Link>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex flex-row gap-6 flex-1 min-h-0">
            {/* PATIENT LIST TABLE */}
            <div className="flex-1 rounded-xl border border-border bg-input/50 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1 no-scrollbar">
                <Table>
                  <TableHeader className="sticky top-0 bg-input z-20 border-b border-border">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[120px] text-ring font-bold">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Age
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Last Visit
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className={`cursor-pointer border-border/50 transition-colors ${
                          selectedPatient?.id === patient.id
                            ? "bg-ring/10"
                            : "hover:bg-border/30"
                        }`}
                        onClick={() => {
                          if (selectedPatient?.id === patient.id)
                            setSelectedPatient(null);
                          else {
                            setSelectedPatient(patient);
                          }
                        }}
                      >
                        <TableCell className="font-mono text-sm text-ring">
                          {patient.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {patient.name}
                        </TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-white hover:bg-border"
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className={`border-border text-foreground ${boolDark && "bg-[#1a1f29] text-background"}`}
                            >
                              <DropdownMenuItem className="focus:bg-border focus:text-white">
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:border focus:text-white">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* PATIENT DETAIL SIDE-CARD */}
            {selectedPatient && (
              <div className="w-96 animate-in slide-in-from-right-4 duration-200">
                <Card className="h-full bg-dropdown border-border text-foreground relative overflow-hidden flex flex-col">
                  {/* CLOSE BUTTON */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full text-slate-500 hover:bg-slate-800 hover:text-white z-10"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X size={16} />
                  </Button>

                  <CardHeader className="border-b border-border/50 pb-6">
                    <div className="flex flex-row items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-ring/20 flex items-center justify-center border border-ring/30">
                        <User className="text-ring" size={28} />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-foreground leading-tight">
                          {selectedPatient.name}
                        </p>
                        <p className="text-sm text-ring font-mono">
                          {selectedPatient.id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-6 overflow-y-auto flex-1 no-scrollbar">
                    {/* PERSONAL INFO */}
                    <div className="space-y-4">
                      <h3 className="text-title text-xs font-black uppercase tracking-widest">
                        Personal Information
                      </h3>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date of Birth</span>
                          <span className="text-foreground">
                            {selectedPatient.dob} ({selectedPatient.age})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email</span>
                          <span className="text-foreground truncate ml-4">
                            {selectedPatient.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone</span>
                          <span className="text-foreground">
                            {selectedPatient.phone}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Status</span>
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
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h3 className="text-title text-xs font-black uppercase tracking-widest">
                        Appointment History
                      </h3>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Last Visit</span>
                          <span className="text-foreground">
                            {selectedPatient.lastVisit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            Next Appointment
                          </span>
                          <span className="text-ring font-medium">
                            {selectedPatient.nextAppt || "None scheduled"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-6 space-y-3 mt-auto">
                      <Button className="w-full">View Full Profile</Button>
                      <Button variant="secondary" className="w-full">
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
