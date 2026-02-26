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

  const filteredPractitioner = practitioners.filter(
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
            Practitioner Profiles
          </h1>
          <p className="text-muted-foreground">
            Manage and view all current practitioners.
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

            <Link href="/Practitioners">
              <Button>
                <Plus size={18} />
                Add Practitioner
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
                        Email
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Phone
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPractitioner.map((practitioner) => (
                      <TableRow
                        key={practitioner.id}
                        className={`cursor-pointer border-border/50 transition-colors ${
                          selectedPractitioner?.id === practitioner.id
                            ? "bg-ring/10"
                            : "hover:bg-border/30"
                        }`}
                        onClick={() => {
                          if (selectedPractitioner?.id === practitioner.id)
                            setSelectedPractitioner(null);
                          else {
                            setSelectedPractitioner(practitioner);
                          }
                        }}
                      >
                        <TableCell className="font-mono text-sm text-ring">
                          {practitioner.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {practitioner.name}
                        </TableCell>
                        <TableCell>{practitioner.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {practitioner.phone}
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

            {selectedPractitioner && (
              <div className="w-96 animate-in slide-in-from-right-4 duration-200">
                <Card className="h-full bg-dropdown border-border text-foreground relative overflow-hidden flex flex-col">
                  {/* CLOSE BUTTON */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full text-slate-500 hover:bg-slate-800 hover:text-white z-10"
                    onClick={() => setSelectedPractitioner(null)}
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
                          {selectedPractitioner.name}
                        </p>
                        <p className="text-sm text-ring font-mono">
                          {selectedPractitioner.id}
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
                          <span className="text-slate-500">Email</span>
                          <span className="text-foreground">
                            {selectedPractitioner.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone</span>
                          <span className="text-foreground truncate ml-4">
                            {selectedPractitioner.phone}
                          </span>
                        </div>
                      </div>
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
