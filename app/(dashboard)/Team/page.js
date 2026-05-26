/**
 * Clinic team directory — all staff with role labels.
 * Admins can add/edit; other roles have read-only access.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { ClinicRole } from "@prisma/client";
import {
  Search,
  Plus,
  MoreVertical,
  User,
  X,
  Users,
  Info,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import TableListSkeleton from "@/components/TableListSkeleton";
import { parseApiError } from "@/utils/parseApiError";
import { apiFetch } from "@/utils/apiFetch";
import { useSessionUser } from "@/utils/useSessionUser";
import { canManageTeam } from "@/lib/auth/permissions";
import { clinicRoleLabel, TEAM_ROLE_OPTIONS } from "@/lib/team/display";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/utils/UseMediaQuery";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

const ROLE_FILTERS = [
  { value: "all", label: "All staff" },
  { value: ClinicRole.Chiropractor, label: "Chiropractors" },
  { value: ClinicRole.Receptionist, label: "Receptionists" },
];

function mapMember(row) {
  return {
    id: row.id,
    name: row.name || "Unnamed",
    email: row.email || "—",
    phone: row.phone || "—",
    role: row.role,
    roleLabel: clinicRoleLabel(row.role),
  };
}

function isValidEmail(value) {
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function roleBadgeClass(role) {
  if (role === ClinicRole.Chiropractor) {
    return "border-button-primary/40 bg-button-primary/10 text-button-primary";
  }
  return "border-muted-foreground/30 bg-muted/40 text-foreground";
}

export default function TeamPage() {
  const { session } = useSessionUser();
  const canManage = canManageTeam(session?.role);

  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState(ClinicRole.Chiropractor);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState(ClinicRole.Chiropractor);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const small = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        setLoadError("");
        const res = await apiFetch("/api/team");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(parseApiError(data, "Failed to load team"));
        }

        setMembers((Array.isArray(data) ? data : data.data || []).map(mapMember));
      } catch (err) {
        console.error("Failed to load team:", err);
        setLoadError(err.message || "Failed to load team.");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [reloadKey]);

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.roleLabel.toLowerCase().includes(q) ||
        String(m.id).includes(q)
      );
    });
  }, [members, searchTerm, roleFilter]);

  const handleAddMember = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.warning("Please enter name and email.", { position: "top-right" });
      return false;
    }
    if (!isValidEmail(newEmail)) {
      toast.error("Invalid email format", { position: "top-right" });
      return false;
    }

    try {
      const res = await apiFetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to add team member"));
      }

      const row = mapMember(data.data ?? data);
      setMembers((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewRole(ClinicRole.Chiropractor);
      toast.success("Team member added.", { position: "top-right" });
      return true;
    } catch (err) {
      toast.error(err.message || "Failed to add team member.", {
        position: "top-right",
      });
      return false;
    }
  };

  const handleEditMember = async () => {
    if (!selected) return false;
    if (!editName.trim() || !editEmail.trim()) {
      toast.warning("Please fill out name and email.", { position: "top-right" });
      return false;
    }
    if (!isValidEmail(editEmail)) {
      toast.error("Invalid email format", { position: "top-right" });
      return false;
    }

    try {
      const res = await apiFetch(`/api/team/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to update team member"));
      }

      const updated = mapMember(data.data ?? data);
      setMembers((prev) =>
        prev.map((m) => (m.id === selected.id ? updated : m)),
      );
      setSelected(updated);
      setEditOpen(false);
      toast.success("Team member updated.", { position: "top-right" });
      return true;
    } catch (err) {
      toast.error(err.message || "Failed to update team member.", {
        position: "top-right",
      });
      return false;
    }
  };

  const colCount = canManage ? 6 : 5;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
        <PageHeader
          title="Team"
          description="Clinic staff — chiropractors and receptionists"
          actions={
            <>
              <div className="flex flex-wrap items-center gap-2">
                {ROLE_FILTERS.map((f) => (
                  <Button
                    key={f.value}
                    type="button"
                    size="sm"
                    variant={roleFilter === f.value ? "default" : "outline"}
                    className={
                      roleFilter === f.value
                        ? "bg-button-primary text-white"
                        : ""
                    }
                    onClick={() => setRoleFilter(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="relative max-w-md min-w-[200px] flex-1">
                <InputGroup className="bg-input text-foreground">
                  <InputGroupInput
                    placeholder="Search name, email, or role..."
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
              {canManage ? (
                <Button
                  onClick={() => setAddOpen(true)}
                  className="gap-2 bg-button-primary font-semibold text-white hover:bg-button-primary-foreground"
                >
                  <Plus size={18} />
                  {small ? "" : "Add staff"}
                </Button>
              ) : null}
            </>
          }
        />

        {!canManage ? (
          <p className="mb-3 text-sm text-muted-foreground">
            View-only access. Contact an administrator to add or update staff.
          </p>
        ) : null}

        <div className="flex min-h-0 flex-col">
          <div className="flex min-h-0 flex-col gap-4 md:flex-row">
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-dropdown">
              <div className="scrollbar-rounded min-h-0 overflow-y-auto rounded-xl">
                <Table>
                  <TableHeader className="border-b border-foreground bg-input">
                    <TableRow className="border-foreground hover:bg-transparent">
                      <TableHead className="w-[72px] font-bold text-button-primary">
                        ID
                      </TableHead>
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Role</TableHead>
                      <TableHead className="text-foreground">Email</TableHead>
                      <TableHead className="text-foreground">Phone</TableHead>
                      {canManage ? (
                        <TableHead className="w-[72px]" />
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableListSkeleton rows={6} cols={colCount} />
                    ) : loadError ? (
                      <TableRow>
                        <TableCell colSpan={colCount} className="p-6">
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
                    ) : filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={colCount} className="p-6">
                          <EmptyState
                            icon={Users}
                            title="No team members found"
                            description={
                              searchTerm || roleFilter !== "all"
                                ? "Try a different search or filter."
                                : canManage
                                  ? "Add staff to create clinic and login accounts (demo password 123456)."
                                  : "No staff match the current filters."
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers.map((m) => (
                        <TableRow
                          key={m.id}
                          className={`cursor-pointer border-foreground/30 transition-colors ${
                            selected?.id === m.id
                              ? "bg-ring/10"
                              : "hover:bg-border/30"
                          }`}
                          onClick={() =>
                            setSelected((prev) =>
                              prev?.id === m.id ? null : m,
                            )
                          }
                        >
                          <TableCell className="font-mono text-sm text-button-primary">
                            {m.id}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {m.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={roleBadgeClass(m.role)}
                            >
                              {m.roleLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>{m.email}</TableCell>
                          <TableCell className="text-foreground">
                            {m.phone}
                          </TableCell>
                          {canManage ? (
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
                                  <DropdownMenuItem
                                    className="focus:bg-border"
                                    onClick={() => {
                                      setEditName(m.name === "Unnamed" ? "" : m.name);
                                      setEditEmail(m.email === "—" ? "" : m.email);
                                      setEditPhone(m.phone === "—" ? "" : m.phone);
                                      setEditRole(m.role);
                                      setSelected(m);
                                      setEditOpen(true);
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {selected ? (
              <div className="flex w-full animate-in duration-200 slide-in-from-bottom-4 md:w-1/4 md:slide-in-from-right-4">
                <Card className="relative flex h-full w-full flex-col overflow-hidden border-foreground bg-dropdown text-foreground">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 h-8 w-8 cursor-pointer rounded-full text-white hover:bg-slate-800 hover:text-white/80"
                    onClick={() => setSelected(null)}
                  >
                    <X size={16} />
                  </Button>
                  <CardHeader className="border-b border-foreground/30 pb-6">
                    <div className="flex flex-row items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ring/30 bg-ring/20">
                        <User className="text-ring" size={28} />
                      </div>
                      <div>
                        <p className="text-xl leading-tight font-bold text-foreground">
                          {selected.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${roleBadgeClass(selected.role)}`}
                        >
                          {selected.roleLabel}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="scrollbar-rounded flex-1 space-y-4 overflow-y-auto pt-4">
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-muted-foreground">
                          Email
                        </span>
                        <span className="truncate text-foreground">
                          {selected.email}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-muted-foreground">
                          Phone
                        </span>
                        <span className="text-foreground">{selected.phone}</span>
                      </div>
                      {selected.role === ClinicRole.Chiropractor ? (
                        <p className="text-xs text-muted-foreground">
                          Appears on the appointment scheduler and staff
                          schedule.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Front-desk access to patients, billing, and requests.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setNewName("");
            setNewEmail("");
            setNewPhone("");
            setNewRole(ClinicRole.Chiropractor);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
            <DialogDescription>
              Creates a clinic login automatically (demo password below). No
              invite email is sent.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-amber-500/40 bg-amber-500/10">
            <Info className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <AlertDescription className="text-xs text-foreground">
              Demo sign-in: email you enter here + password{" "}
              <span className="font-mono font-semibold">123456</span>. Change
              fake emails to real ones anytime under Edit — login updates with
              the new email.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-4 py-2">
            <FormField
              fieldLabel="Full name"
              placeholder="Jane Smith"
              variant="add"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={35}
            />
            <FormField
              fieldLabel="Email"
              placeholder="name@example.com"
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
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Role</span>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={async (e) => {
                const ok = await handleAddMember();
                if (!ok) e.preventDefault();
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
            <DialogTitle>Edit staff member</DialogTitle>
            <DialogDescription>
              Updates clinic and login records. Changing email moves sign-in to
              the new address (demo password stays 123456).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <FormField
              fieldLabel="Full name"
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
              variant="add"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              mask="phone"
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Role</span>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={async (e) => {
                const ok = await handleEditMember();
                if (!ok) e.preventDefault();
              }}
              className="bg-button-primary text-white"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
