"use client";
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

import { useState } from "react";

export default function Practitioners() {
  const practitioners = [
    {
      id: 1,
      name: "Brad Pritchard",
      email: "bradpritchard@gmail.com",
      phone: "5933493018",
    },
    {
      id: 2,
      name: "Kyle James",
      email: "kylejames@gmail.com",
      phone: "5943443618",
    },
    {
      id: 3,
      name: "Daniel Topala",
      email: "danieltopala@gmail.com",
      phone: "5543453678",
    },
    {
      id: 4,
      name: "Francis Morris",
      email: "francismorris@gmail.com",
      phone: "5521690678",
    },
    {
      id: 5,
      name: "Yui Hirasawa",
      email: "yuihirasawa@gmail.com",
      phone: "5523670708",
    },
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPractitioner, setSelectedPractitioner] = useState(null);
  const small = useMediaQuery("(max-width: 768px)");

  const filteredPractitioners = practitioners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id == searchTerm,
  );

  return (
    <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 px-4 pb-4 overflow-hidden">
        {/* PAGE HEADER */}
        <header className="flex flex-row py-4">
          {!small && (
            <h1 className="text-3xl w-full font-bold text-foreground">
              Practitioners
            </h1>
          )}

          {/* SEARCH & ACTIONS BAR */}
          <div className="flex flex-row justify-end gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <InputGroup className="bg-input border-foreground text-foreground placeholder:text-muted-foreground ">
                <InputGroupInput
                  placeholder="Search by name or ID..."
                  className="border-foreground border-y focus-visible:ring-ring"
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

            <Button className="bg-button-primary hover:bg-button-primary-foreground text-white font-bold gap-2 shadow-lg shadow-[#A0CE66]/10">
              <Plus size={18} />
              {small ? "" : "Add Practitioner"}
            </Button>
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
                      <TableHead className="text-foreground">Email</TableHead>
                      <TableHead className="text-foreground">Phone</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPractitioners.map((p) => (
                      <TableRow
                        key={p.id}
                        className={`cursor-pointer border-foreground/30 transition-colors ${
                          selectedPractitioner?.id === p.id
                            ? "bg-ring/10"
                            : "hover:bg-border/30"
                        }`}
                        onClick={() => {
                          if (selectedPractitioner?.id === p.id)
                            setSelectedPractitioner(null);
                          else {
                            setSelectedPractitioner(p);
                          }
                        }}
                      >
                        <TableCell className="font-mono text-sm text-button-primary">
                          {p.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {p.name}
                        </TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell className="text-medium text-foreground">
                          {p.phone}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:bg-border"
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className={`border-foreground text-foreground`}
                            >
                              <DropdownMenuItem className="focus:bg-border">
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-border">
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
            {selectedPractitioner && (
              <div className="flex w-full md:w-1/4 animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-200">
                <Card className="h-full w-full bg-dropdown border-foreground text-foreground relative overflow-hidden flex flex-col">
                  {/* CLOSE BUTTON */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full text-white hover:bg-slate-800 hover:text-white/80 cursor-pointer z-10"
                    onClick={() => setSelectedPractitioner(null)}
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
                          {selectedPractitioner.name}
                        </p>
                        <p className="text-sm text-button-primary font-mono">
                          {selectedPractitioner.id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4 overflow-y-auto flex-1 scrollbar-rounded">
                    {/* PERSONAL INFO */}
                    <div className="space-y-4">
                      <h3 className="text-title text-xs font-black uppercase tracking-widest">
                        Personal Information
                      </h3>
                      <div className="grid gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Email
                          </span>
                          <span className="text-foreground truncate ml-4">
                            {selectedPractitioner.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Phone
                          </span>
                          <span className="text-foreground">
                            {selectedPractitioner.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* HISTORY */}
                    <div className="space-y-4 pt-4 border-t border-foreground/30">
                      <h3 className="text-title text-xs font-black uppercase tracking-widest">
                        Appointment History
                      </h3>
                      <div className="grid gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Last Visit
                          </span>
                          <span className="text-foreground"></span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-bold">
                            Next Appointment
                          </span>
                          <span className="text-button-primary font-medium">
                            {"N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-4 space-y-2 mt-auto">
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
