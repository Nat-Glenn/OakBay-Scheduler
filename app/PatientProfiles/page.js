"use client";
import { useState } from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { Search, Plus, MoreVertical, User, X } from "lucide-react";
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

// MOCK DATA
const Patients = [
  { id: "P001", name: "John Doe", age: 42, dob: "June 01, 1983", email: "johndoe@gmail.com", phone: "587-999-9999", status: "Active", lastVisit: "02/05/2026", nextAppt: "02/15/2026" },
  { id: "P002", name: "Jane Smith", age: 29, dob: "March 15, 1996", email: "janesmith@gmail.com", phone: "587-888-8888", status: "Active", lastVisit: "01/28/2026", nextAppt: "02/12/2026" },
  { id: "P003", name: "Robert Wilson", age: 55, dob: "August 10, 1970", email: "robertw@gmail.com", phone: "587-777-7777", status: "Inactive", lastVisit: "12/15/2025", nextAppt: null },
  { id: "P004", name: "Sarah Jenkins", age: 34, dob: "Nov 22, 1991", email: "s.jenkins@outlook.com", phone: "587-444-5555", status: "Active", lastVisit: "02/01/2026", nextAppt: "02/20/2026" },
  { id: "P005", name: "Michael Chen", age: 31, dob: "Jan 05, 1995", email: "mchen88@gmail.com", phone: "403-222-3333", status: "Active", lastVisit: "01/15/2026", nextAppt: "03/10/2026" },
  { id: "P006", name: "Emily Brown", age: 62, dob: "Sept 14, 1963", email: "ebrown@shaw.ca", phone: "587-111-2222", status: "Inactive", lastVisit: "10/05/2025", nextAppt: null },
  { id: "P007", name: "David Miller", age: 47, dob: "May 30, 1978", email: "miller.d@gmail.com", phone: "403-555-0199", status: "Active", lastVisit: "02/08/2026", nextAppt: "02/22/2026" },
  { id: "P008", name: "Lisa Thompson", age: 24, dob: "Dec 12, 2001", email: "lisa.t@icloud.com", phone: "587-666-7788", status: "Active", lastVisit: "01/20/2026", nextAppt: "02/14/2026" },
  { id: "P009", name: "Kevin Vane", age: 38, dob: "July 04, 1987", email: "kvane@protonmail.com", phone: "403-999-8877", status: "Active", lastVisit: "02/10/2026", nextAppt: "02/28/2026" },
  { id: "P010", name: "Amanda Lee", age: 51, dob: "Oct 19, 1974", email: "alee.medical@gmail.com", phone: "587-333-4411", status: "Inactive", lastVisit: "08/12/2025", nextAppt: null },
  { id: "P011", name: "Marcus Wright", age: 22, dob: "Feb 28, 2003", email: "m.wright@gmail.com", phone: "403-777-6655", status: "Active", lastVisit: "01/05/2026", nextAppt: "02/18/2026" },
  { id: "P012", name: "Sophia Garcia", age: 33, dob: "April 10, 1992", email: "sophia.g@yahoo.com", phone: "587-222-1199", status: "Active", lastVisit: "02/11/2026", nextAppt: "02/25/2026" },
  { id: "P013", name: "James Taylor", age: 45, dob: "Jan 12, 1981", email: "jtaylor@gmail.com", phone: "587-123-4567", status: "Active", lastVisit: "02/12/2026", nextAppt: "03/01/2026" },
  { id: "P014", name: "Olivia Martinez", age: 27, dob: "June 25, 1998", email: "oliviam@gmail.com", phone: "403-234-5678", status: "Active", lastVisit: "02/09/2026", nextAppt: "02/19/2026" },
  { id: "P015", name: "William Anderson", age: 60, dob: "Sept 05, 1965", email: "wanderson@gmail.com", phone: "587-345-6789", status: "Inactive", lastVisit: "11/20/2025", nextAppt: null },
  { id: "P016", name: "Isabella Thomas", age: 35, dob: "Nov 15, 1990", email: "ithomas@gmail.com", phone: "403-456-7890", status: "Active", lastVisit: "02/05/2026", nextAppt: "02/20/2026" },
  { id: "P017", name: "Ethan Jackson", age: 39, dob: "Mar 22, 1986", email: "ejackson@gmail.com", phone: "587-567-8901", status: "Active", lastVisit: "01/30/2026", nextAppt: "02/14/2026" },
  { id: "P018", name: "Mia White", age: 31, dob: "July 08, 1994", email: "miawhite@gmail.com", phone: "403-678-9012", status: "Inactive", lastVisit: "09/15/2025", nextAppt: null },
  { id: "P019", name: "Alexander Harris", age: 48, dob: "May 18, 1977", email: "aharris@gmail.com", phone: "587-789-0123", status: "Active", lastVisit: "02/02/2026", nextAppt: "02/16/2026" },
  { id: "P020", name: "Charlotte Lewis", age: 26, dob: "Dec 30, 1999", email: "clewis@gmail.com", phone: "403-890-1234", status: "Active", lastVisit: "02/10/2026", nextAppt: "02/24/2026" },
  { id: "P021", name: "Daniel Walker", age: 52, dob: "Aug 12, 1973", email: "dwalker@gmail.com", phone: "587-901-2345", status: "Active", lastVisit: "01/25/2026", nextAppt: "02/08/2026" },
  { id: "P022", name: "Amelia Hall", age: 41, dob: "Feb 05, 1985", email: "ahall@gmail.com", phone: "403-012-3456", status: "Inactive", lastVisit: "10/10/2025", nextAppt: null },
  { id: "P023", name: "Henry Young", age: 37, dob: "June 14, 1988", email: "hyoung@gmail.com", phone: "587-123-4561", status: "Active", lastVisit: "02/04/2026", nextAppt: "02/18/2026" },
  { id: "P024", name: "Evelyn King", age: 30, dob: "Oct 20, 1995", email: "eking@gmail.com", phone: "403-234-5672", status: "Active", lastVisit: "02/11/2026", nextAppt: "02/25/2026" },
  { id: "P025", name: "Sebastian Wright", age: 28, dob: "Jan 15, 1998", email: "swright@gmail.com", phone: "587-345-6783", status: "Active", lastVisit: "01/15/2026", nextAppt: "02/01/2026" },
  { id: "P026", name: "Harper Scott", age: 44, dob: "April 05, 1981", email: "hscott@gmail.com", phone: "403-456-7894", status: "Inactive", lastVisit: "12/05/2025", nextAppt: null },
  { id: "P027", name: "Jack Green", age: 50, dob: "July 22, 1975", email: "jgreen@gmail.com", phone: "587-567-8905", status: "Active", lastVisit: "02/01/2026", nextAppt: "02/15/2026" },
  { id: "P028", name: "Aria Adams", age: 23, dob: "Sept 10, 2002", email: "aadams@gmail.com", phone: "403-678-9016", status: "Active", lastVisit: "02/08/2026", nextAppt: "02/22/2026" },
  { id: "P029", name: "Owen Baker", age: 33, dob: "Mar 30, 1992", email: "obaker@gmail.com", phone: "587-789-0127", status: "Active", lastVisit: "01/20/2026", nextAppt: "02/03/2026" },
  { id: "P030", name: "Scarlett Nelson", age: 29, dob: "Nov 12, 1996", email: "snelson@gmail.com", phone: "403-890-1238", status: "Inactive", lastVisit: "11/12/2025", nextAppt: null },
  { id: "P031", name: "Luke Carter", age: 46, dob: "May 05, 1979", email: "lcarter@gmail.com", phone: "587-901-2349", status: "Active", lastVisit: "02/03/2026", nextAppt: "02/17/2026" },
  { id: "P032", name: "Chloe Mitchell", age: 36, dob: "Aug 18, 1989", email: "cmitchell@gmail.com", phone: "403-012-3450", status: "Active", lastVisit: "02/12/2026", nextAppt: "02/26/2026" },
  { id: "P033", name: "Gabriel Perez", age: 32, dob: "Oct 25, 1993", email: "gperez@gmail.com", phone: "587-123-4562", status: "Active", lastVisit: "01/10/2026", nextAppt: "01/24/2026" },
  { id: "P034", name: "Luna Roberts", age: 25, dob: "Dec 05, 2000", email: "lroberts@gmail.com", phone: "403-234-5673", status: "Inactive", lastVisit: "07/15/2025", nextAppt: null },
  { id: "P035", name: "Julian Turner", age: 49, dob: "Feb 15, 1977", email: "jturner@gmail.com", phone: "587-345-6784", status: "Active", lastVisit: "02/06/2026", nextAppt: "02/20/2026" },
  { id: "P036", name: "Hazel Phillips", age: 27, dob: "June 30, 1998", email: "hphillips@gmail.com", phone: "403-456-7895", status: "Active", lastVisit: "02/09/2026", nextAppt: "02/23/2026" },
  { id: "P037", name: "Levi Campbell", age: 38, dob: "Sept 20, 1987", email: "lcampbell@gmail.com", phone: "587-567-8906", status: "Active", lastVisit: "01/30/2026", nextAppt: "02/13/2026" },
  { id: "P038", name: "Zoey Parker", age: 31, dob: "Nov 05, 1994", email: "zparker@gmail.com", phone: "403-678-9017", status: "Inactive", lastVisit: "10/01/2025", nextAppt: null },
  { id: "P039", name: "Isaac Evans", age: 43, dob: "Jan 10, 1983", email: "ievans@gmail.com", phone: "587-789-0128", status: "Active", lastVisit: "02/02/2026", nextAppt: "02/16/2026" },
  { id: "P040", name: "Stella Edwards", age: 34, dob: "Mar 15, 1991", email: "sedwards@gmail.com", phone: "403-890-1239", status: "Active", lastVisit: "02/07/2026", nextAppt: "02/21/2026" },
  { id: "P041", name: "Anthony Collins", age: 54, dob: "May 22, 1971", email: "acollins@gmail.com", phone: "587-901-2340", status: "Active", lastVisit: "01/15/2026", nextAppt: "01/29/2026" },
  { id: "P042", name: "Violet Stewart", age: 22, dob: "July 30, 2003", email: "vstewart@gmail.com", phone: "403-012-3451", status: "Inactive", lastVisit: "09/05/2025", nextAppt: null },
  { id: "P043", name: "Christopher Morris", age: 40, dob: "Oct 12, 1985", email: "cmorris@gmail.com", phone: "587-123-4563", status: "Active", lastVisit: "02/04/2026", nextAppt: "02/18/2026" },
  { id: "P044", name: "Audrey Rogers", age: 28, dob: "Dec 25, 1997", email: "arogers@gmail.com", phone: "403-234-5674", status: "Active", lastVisit: "02/11/2026", nextAppt: "02/25/2026" },
  { id: "P045", name: "Thomas Reed", age: 37, dob: "Feb 20, 1989", email: "treed@gmail.com", phone: "587-345-6785", status: "Active", lastVisit: "01/20/2026", nextAppt: "02/03/2026" },
];

export default function PatientProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
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
        {/* PAGE HEADER */}
        <header className="pb-4 px-4">
          <h1 className="text-3xl font-bold text-gray-800">Patient Profiles</h1>
          <p className="text-gray-500">Manage and view all registered patients.</p>
        </header>

        <div className="flex flex-col px-4">
          {/* SEARCH & ACTIONS BAR */}
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
              <Button className="bg-[#002D58] hover:bg-[#002D58]/90 hover:text-black/60 text-white font-bold rounded-md ml-auto gap-2">
                <Plus size={18} />
                Add Patient
              </Button>
            </Link>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex flex-row gap-4">
            
            {/* PATIENT LIST TABLE */}
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
                      className={`cursor-pointer hover:bg-slate-50 ${selectedPatient?.id === patient.id ? "bg-slate-100" : ""}`}
                      // When a row is clicked, the side card opens
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

            {/* PATIENT DETAIL SIDE-CARD */}
            {selectedPatient && (
              <div className="w-80">
                <Card className="relative overflow-hidden">

                  {/* CLOSE BUTTON (X) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full text-muted-foreground hover:bg-slate-100 hover:text-slate-900 z-10"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X size={16} />
                  </Button>

                  <CardHeader>
                    <div className="flex flex-row items-center gap-4 mb-4">
                      {/* Profile Icon Placeholder */}
                      <div className="h-12 w-12 rounded-full bg-[#002D58] flex items-center justify-center">
                        <User className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">{selectedPatient.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPatient.id}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* PERSONAL INFO SECTION */}
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

                    {/* HISTORY SECTION */}
                    <div>
                      <p className="font-extrabold text-lg mb-2">Appointment History</p>
                      <div className="space-y-1 text-sm">
                        <p><b>Last Visit:</b> {selectedPatient.lastVisit}</p>
                        <p><b>Next Appointment:</b> {selectedPatient.nextAppt || "None scheduled"}</p>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
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