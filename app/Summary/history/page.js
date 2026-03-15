"use client";

import React, { useState, useMemo } from "react";
import NavBarComp from "@/components/NavBarComp";
import {
  ArrowLeft,
  Search,
  X,
  Calendar,
  Clock,
  User,
  MoreVertical,
  ListFilter,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useMediaQuery } from "@/utils/UseMediaQuery";

export default function PatientHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "startTime",
    direction: "desc",
  });
  const small = useMediaQuery("(max-width: 768px)");

  const historyData = [
    { id: 10, patientName: "John Doe", status: "Requested", type: "Adjustment", startTime: "2026-03-05T14:00:00.000Z", adminNotes: "Portal request" },
    { id: 9, patientName: "John Doe", status: "Completed", type: "Checkup", startTime: "2026-03-01T09:30:00.000Z", adminNotes: "All clear" },
    { id: 8, patientName: "John Doe", status: "Confirmed", type: "Adjustment", startTime: "2026-02-28T11:15:00.000Z", adminNotes: "Confirmed by phone" },
    { id: 5, patientName: "John Doe", status: "Requested", type: "Adjustment", startTime: "2026-02-22T17:15:00.000Z", adminNotes: "Patient requested via portal" },
    { id: 4, patientName: "John Doe", status: "Confirmed", type: "Adjustment", startTime: "2026-02-20T17:00:00.000Z", adminNotes: "Confirmed by receptionist" },
    { id: 11, patientName: "John Doe", status: "Requested", type: "Adjustment", startTime: "2026-03-05T14:00:00.000Z", adminNotes: "Portal request" },
    { id: 12, patientName: "John Doe", status: "Completed", type: "Checkup", startTime: "2026-03-01T09:30:00.000Z", adminNotes: "All clear" },
    { id: 13, patientName: "John Doe", status: "Confirmed", type: "Adjustment", startTime: "2026-02-28T11:15:00.000Z", adminNotes: "Confirmed by phone" },
    { id: 14, patientName: "John Doe", status: "Requested", type: "Adjustment", startTime: "2026-02-22T17:15:00.000Z", adminNotes: "Patient requested via portal" },
    { id: 15, patientName: "John Doe", status: "Confirmed", type: "Adjustment", startTime: "2026-02-20T17:00:00.000Z", adminNotes: "Confirmed by receptionist" },
    { id: 16, patientName: "John Doe", status: "Requested", type: "Adjustment", startTime: "2026-03-05T14:00:00.000Z", adminNotes: "Portal request" },
    { id: 17, patientName: "John Doe", status: "Completed", type: "Checkup", startTime: "2026-03-01T09:30:00.000Z", adminNotes: "All clear" },
    { id: 18, patientName: "John Doe", status: "Confirmed", type: "Adjustment", startTime: "2026-02-28T11:15:00.000Z", adminNotes: "Confirmed by phone" },
    { id: 19, patientName: "John Doe", status: "Requested", type: "Adjustment", startTime: "2026-02-22T17:15:00.000Z", adminNotes: "Patient requested via portal" },
    { id: 20, patientName: "John Doe", status: "Confirmed", type: "Adjustment", startTime: "2026-02-20T17:00:00.000Z", adminNotes: "Confirmed by receptionist" },
  ];

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const processedData = useMemo(() => {
    let items = [...historyData];

    if (searchTerm.trim()) {
      const lowSearch = searchTerm.toLowerCase();
      items = items.filter((item) => {
        return (
          item.id.toString().includes(lowSearch) ||
          item.patientName.toLowerCase().includes(lowSearch) ||
          item.type.toLowerCase().includes(lowSearch) ||
          item.status.toLowerCase().includes(lowSearch) ||
          formatDate(item.startTime).toLowerCase().includes(lowSearch)
        );
      });
    }

    items.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [searchTerm, sortConfig, historyData]);

  const sortLabels = {
    id: "ID",
    patientName: "Patient Name",
    startTime: "Date & Time",
    status: "Status",
  };

  return (
    <main className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
      <NavBarComp />

      <div className="flex flex-col min-w-0 px-4 pb-4 overflow-hidden flex-1">
        {/* Page Header */}
        <header className="flex flex-row py-4 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/Summary">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            {!small && <h1 className="text-3xl font-bold">History</h1>}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-2xl justify-end">
            {/* Search Bar */}
            <InputGroup className="bg-input border-border max-w-md">
              <InputGroupInput
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <InputGroupAddon>
                <Search size={18} />
              </InputGroupAddon>
            </InputGroup>

            {/* Sort Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex gap-2 items-center border-border font-semibold h-11"
                >
                  <ListFilter size={18} />
                  {!small && `Sort: ${sortLabels[sortConfig.key]}`}
                  <ChevronDown size={16} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort By Column</DropdownMenuLabel>
                {Object.entries(sortLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSortConfig({ ...sortConfig, key })}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    {label}
                    {sortConfig.key === key && (
                      <Check size={16} className="text-button-primary" />
                    )}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortConfig({ ...sortConfig, direction: "asc" })}
                  className="flex justify-between items-center cursor-pointer"
                >
                  Ascending
                  {sortConfig.direction === "asc" && (
                    <Check size={16} className="text-button-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortConfig({ ...sortConfig, direction: "desc" })}
                  className="flex justify-between items-center cursor-pointer"
                >
                  Descending
                  {sortConfig.direction === "desc" && (
                    <Check size={16} className="text-button-primary" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Data Table */}
        <div className="rounded-xl border border-border bg-dropdown flex flex-1 flex-col min-h-0 overflow-hidden shadow-sm">
          <div className="min-h-0 overflow-y-auto scrollbar-rounded flex-1">
            <Table className="border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] px-6 bg-input border-b border-border font-bold text-foreground">
                    ID
                  </TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">
                    Patient
                  </TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">
                    Date & Time
                  </TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground">
                    Type
                  </TableHead>
                  <TableHead className="bg-input border-b border-border font-bold text-foreground text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-[50px] bg-input border-b border-border"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {processedData.map((visit) => (
                  <TableRow
                    key={visit.id}
                    className="border-border/50 hover:bg-border/30"
                  >
                    <TableCell className="font-mono text-sm text-button-primary px-6">
                      #{visit.id}
                    </TableCell>
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted-foreground" />{" "}
                        {visit.patientName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium flex items-center gap-1 text-foreground">
                          <Calendar size={12} className="text-button-primary" />{" "}
                          {formatDate(visit.startTime)}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> {formatTime(visit.startTime)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{visit.type}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm py-1.5 rounded-full font-semibold inline-flex items-center justify-center w-24 ${
                          visit.status === "Completed"
                            ? "bg-[#a0ce66] text-primary"
                            : visit.status === "Confirmed"
                              ? "bg-blue-500 text-white"
                              : "bg-yellow-100 text-red-600"
                        }`}
                      >
                        {visit.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            View Details
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
      </div>
    </main>
  );
}