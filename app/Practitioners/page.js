"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/utils/apiFetch";
import { Search, Plus, MoreVertical, User, X, UserCog } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import TableListSkeleton from "@/components/TableListSkeleton";
import { parseApiError } from "@/utils/parseApiError";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FormField from "@/components/FormField";
import { DeletePopUp } from "@/components/DeletePopUp";

export default function Practitioners() {
  const [practitioners, setPractitioners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPractitioner, setSelectedPractitioner] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const small = useMediaQuery("(max-width: 768px)");

  function isValidEmail(value) {
    const email = value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  useEffect(() => {
    async function loadPractitioners() {
      try {
        setLoading(true);
        setLoadError("");
        const res = await apiFetch("/api/practitioners");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(parseApiError(data, "Failed to load practitioners"));
        }

        const mappedPractitioners = data.map((p) => ({
          id: p.id,
          name: p.name || "Unnamed Practitioner",
          email: p.email || "—",
          phone: p.phone || "—",
        }));

        setPractitioners(mappedPractitioners);
      } catch (err) {
        console.error("Failed to load practitioners:", err);
        setLoadError(err.message || "Failed to load practitioners.");
        setPractitioners([]);
      } finally {
        setLoading(false);
      }
    }

    loadPractitioners();
  }, [reloadKey]);

  const filteredPractitioners = practitioners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.id).includes(searchTerm),
  );

  const handleAddPractitioner = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.warning("Please enter both name and email.", {
        position: "top-right",
      });
      return false;
    }

    if (!isValidEmail(newEmail)) {
      toast.error("Invalid email format", { position: "top-right" });
      return false;
    }

    try {
      const res = await apiFetch("/api/practitioners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add practitioner");
      }

      const newPractitioner = {
        id: data.id,
        name: data.name || "Unnamed Practitioner",
        email: data.email || "—",
        phone: data.phone || "—",
      };

      setPractitioners((prev) => [...prev, newPractitioner]);

      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");

      toast.success("Practitioner added successfully.", {
        position: "top-right",
      });

      return true;
    } catch (err) {
      console.error("Failed to add practitioner:", err);
      toast.error(err.message || "Failed to add practitioner.", {
        position: "top-right",
      });
      return false;
    }
  };

  const handleEditPractitioner = async () => {
    if (!selectedPractitioner) return false;

    if (!editName.trim() || !editEmail.trim()) {
      toast.warning("Please fill out name and email.", {
        position: "top-right",
      });
      return false;
    }

    if (!isValidEmail(editEmail)) {
      toast.error("Invalid email format", { position: "top-right" });
      return false;
    }

    try {
      const res = await apiFetch(`/api/practitioners/${selectedPractitioner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
        }),
      });

      const data = await res.json();

if (!res.ok) {
  throw new Error(data.error || "Failed to update practitioner");
}

const practitioner = data.data ?? data;

const updated = {
  id: practitioner.id,
  name: practitioner.name || "Unnamed Practitioner",
  email: practitioner.email || "—",
  phone: practitioner.phone || "—",
};

      setPractitioners((prev) =>
        prev.map((p) => (p.id === selectedPractitioner.id ? updated : p)),
      );

      setSelectedPractitioner(updated);
      setEditOpen(false);
      setEditName("");
      setEditEmail("");
      setEditPhone("");

      toast.success("Practitioner updated successfully.", {
        position: "top-right",
      });

      return true;
    } catch (err) {
      toast.error(err.message || "Failed to update practitioner.", {
        position: "top-right",
      });
      return false;
    }
  };

  return (
    <>
    <AppShell title="Practitioners">
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 overflow-hidden">
          <PageHeader
            title="Practitioners"
            description="Chiropractors who appear on the scheduler"
            actions={
              <>
                <div className="relative max-w-md flex-1">
                  <InputGroup className="bg-input text-foreground">
                    <InputGroupInput
                      placeholder="Search by name or ID..."
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
                <Button
                  onClick={() => setAddOpen(true)}
                  className="gap-2 bg-button-primary font-semibold text-white hover:bg-button-primary-foreground"
                >
                  <Plus size={18} />
                  {small ? "" : "Add Practitioner"}
                </Button>
              </>
            }
          />

          <div className="flex flex-col min-h-0">
            <div className="flex flex-col md:flex-row gap-4 min-h-0">
              <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-dropdown">
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
                      {loading ? (
                        <TableListSkeleton rows={6} cols={5} />
                      ) : loadError ? (
                        <TableRow>
                          <TableCell colSpan={5} className="p-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                              <p className="text-sm font-medium text-destructive">
                                {loadError}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReloadKey((k) => k + 1)}
                              >
                                Try again
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPractitioners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="p-6">
                            <EmptyState
                              icon={UserCog}
                              title="No practitioners found"
                              description={
                                searchTerm
                                  ? "Try a different name or ID."
                                  : "Add a practitioner to show them on the scheduler."
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                      filteredPractitioners.map((p) => (
                        <TableRow
                          key={p.id}
                          className={`cursor-pointer border-foreground/30 transition-colors ${
                            selectedPractitioner?.id === p.id
                              ? "bg-ring/10"
                              : "hover:bg-border/30"
                          }`}
                          onClick={() => {
                            if (selectedPractitioner?.id === p.id) {
                              setSelectedPractitioner(null);
                            } else {
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
                                className="border-foreground text-foreground"
                              >
                                <DropdownMenuItem className="focus:bg-border">
                                  View Details
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="focus:bg-border"
                                  onClick={() => {
                                    setEditName(p.name || "");
                                    setEditEmail(p.email === "—" ? "" : (p.email || ""));
                                    setEditPhone(p.phone === "—" ? "" : (p.phone || ""));
                                    setSelectedPractitioner(p);
                                    setEditOpen(true);
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                  <DeletePopUp
                                    variant="dropdown"
                                    object="practitioner"
                                  />
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
                <div className="flex w-full md:w-1/4 animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-200">
                  <Card className="h-full w-full bg-dropdown border-foreground text-foreground relative overflow-hidden flex flex-col">
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
                      <div className="space-y-4">
                        <h3 className="text-title text-xs font-semibold uppercase tracking-wide">
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
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
    </AppShell>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setNewName("");
            setNewEmail("");
            setNewPhone("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Practitioner</DialogTitle>
            <DialogDescription>
              Enter the practitioner’s information below.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <FormField
              fieldLabel="Full Name"
              placeholder="Brad Pritchard"
              variant="add"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={35}
            />
            <FormField
              fieldLabel="Email"
              placeholder="email@example.com"
              variant="add"
              mode="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <FormField
              fieldLabel="Phone"
              placeholder="403-123-4567"
              variant="add"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              mask="phone"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={async (e) => {
                const success = await handleAddPractitioner();
                if (!success) {
                  e.preventDefault();
                }
              }}
              className="bg-button-primary text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditName("");
            setEditEmail("");
            setEditPhone("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Practitioner</DialogTitle>
            <DialogDescription>
              Update practitioner information below.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <FormField
              fieldLabel="Full Name"
              variant="add"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <FormField
              fieldLabel="Email"
              variant="add"
              mode="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />

            <FormField
              fieldLabel="Phone"
              placeholder="403-123-4567"
              variant="add"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              mask="phone"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={async (e) => {
                const success = await handleEditPractitioner();
                if (!success) e.preventDefault();
              }}
              className="bg-button-primary text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}