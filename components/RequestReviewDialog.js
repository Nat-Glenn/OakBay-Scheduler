/**
 * Dialog for reception to approve or decline a patient booking request.
 * Chiropractor options respect the staff schedule for the selected preferred time.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import BookingRequestPatientKindBadge from "@/components/BookingRequestPatientKindBadge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormField from "@/components/FormField";
import {
  formatClinicClockTime,
  formatClinicDateIso,
} from "@/lib/appointments/clinicTime.js";
import { buildPractitionerDropdownItems } from "@/lib/shifts/clientUtils";
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";

export default function RequestReviewDialog({
  request,
  open,
  onOpenChange,
  onComplete,
}) {
  const [practitioners, setPractitioners] = useState([]);
  const [dayShifts, setDayShifts] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({
    clinicFull: false,
    unavailableProviderIds: [],
    appointmentsAtTime: 0,
  });
  const [preferenceId, setPreferenceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [practitionerSearch, setPractitionerSearch] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [saving, setSaving] = useState(false);
  const readOnly = request?.status !== "PENDING";

  const selectedPreference = useMemo(
    () => request?.preferences?.find((p) => String(p.id) === preferenceId),
    [request, preferenceId],
  );

  const dateIso = selectedPreference
    ? formatClinicDateIso(selectedPreference.startTime)
    : "";
  const clockTime = selectedPreference
    ? formatClinicClockTime(selectedPreference.startTime)
    : "";
  const scheduleEnforced = dayShifts.length > 0;

  const practitionerItems = useMemo(
    () =>
      buildPractitionerDropdownItems({
        practitioners,
        dayShifts,
        scheduleEnforced,
        dateIso,
        clockTime: clockTime || null,
        search: practitionerSearch,
        unavailableProviderIds: slotAvailability.unavailableProviderIds,
      }),
    [
      practitioners,
      dayShifts,
      scheduleEnforced,
      dateIso,
      clockTime,
      practitionerSearch,
      slotAvailability.unavailableProviderIds,
    ],
  );

  const selectedProviderName =
    practitioners.find((p) => String(p.id) === providerId)?.name ?? "";

  const availableProviders = practitionerItems.filter((item) => !item.disabled);

  useEffect(() => {
    if (!open) return;
    async function load() {
      try {
        const res = await apiFetch("/api/practitioners");
        const data = await res.json();
        if (res.ok) setPractitioners(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [open]);

  useEffect(() => {
    if (!open || !dateIso) {
      setDayShifts([]);
      return;
    }

    async function loadShifts() {
      try {
        const res = await apiFetch(`/api/shifts/day?date=${dateIso}`);
        const data = await res.json();
        setDayShifts(res.ok && Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setDayShifts([]);
      }
    }

    loadShifts();
  }, [open, dateIso]);

  useEffect(() => {
    if (!open || !selectedPreference?.startTime) {
      setSlotAvailability({
        clinicFull: false,
        unavailableProviderIds: [],
        appointmentsAtTime: 0,
      });
      return;
    }

    async function loadSlotAvailability() {
      try {
        const startTime = encodeURIComponent(selectedPreference.startTime);
        const res = await apiFetch(
          `/api/appointments/slot-availability?startTime=${startTime}`,
        );
        const data = await res.json();
        if (res.ok) {
          setSlotAvailability({
            clinicFull: Boolean(data.clinicFull),
            unavailableProviderIds: Array.isArray(data.unavailableProviderIds)
              ? data.unavailableProviderIds
              : [],
            appointmentsAtTime: Number(data.appointmentsAtTime) || 0,
          });
        }
      } catch (err) {
        console.error(err);
        setSlotAvailability({
          clinicFull: false,
          unavailableProviderIds: [],
          appointmentsAtTime: 0,
        });
      }
    }

    loadSlotAvailability();
  }, [open, selectedPreference?.startTime]);

  useEffect(() => {
    if (!request) return;
    const firstPref = request.preferences?.[0];
    setPreferenceId(firstPref ? String(firstPref.id) : "");
    setProviderId("");
    setPractitionerSearch("");
    setAdminNotes("");
    setDeclineReason("");
  }, [request]);

  useEffect(() => {
    if (!providerId) return;
    const selected = practitionerItems.find((item) => String(item.id) === providerId);
    if (selected?.disabled) {
      setProviderId("");
    }
  }, [providerId, practitionerItems]);

  const handleApprove = async () => {
    if (!preferenceId || !providerId) {
      toast.warning("Select a preferred time and chiropractor.");
      return;
    }

    const selectedProvider = practitionerItems.find(
      (item) => String(item.id) === providerId,
    );
    if (selectedProvider?.disabled) {
      toast.warning(
        selectedProvider.booked
          ? "This chiropractor already has an appointment at this time."
          : "This chiropractor is not scheduled to work at the selected time.",
      );
      return;
    }

    if (slotAvailability.clinicFull) {
      toast.warning("All four time slots are already booked for this time.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(
        `/api/booking-requests/${request.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferenceId: Number(preferenceId),
            providerId: Number(providerId),
            adminNotes: adminNotes || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to schedule appointment"));
      }
      toast.success("Appointment scheduled.");
      onComplete?.();
    } catch (err) {
      toast.error(err.message || "Could not schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(
        `/api/booking-requests/${request.id}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ declineReason: declineReason || null }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to decline request"));
      }
      toast.success("Request declined.");
      onComplete?.();
    } catch (err) {
      toast.error(err.message || "Could not decline.");
    } finally {
      setSaving(false);
    }
  };

  if (!request) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {readOnly ? "Request details" : "Review request"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-foreground/80">
              <p>
                {request.firstName} {request.lastName} · {request.type}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <BookingRequestPatientKindBadge
                  patientKind={request.patientKind}
                />
                {request.patientId ? (
                  <Link
                    href={`/Patients?patientId=${request.patientId}`}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2d5016] hover:underline"
                  >
                    Patient record
                    <ExternalLink className="size-3" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm text-foreground">
          <p>
            <span className="font-medium">Email:</span> {request.email}
          </p>
          <p>
            <span className="font-medium">Phone:</span> {request.phone}
          </p>
          {request.preferredProviderName ? (
            <p>
              <span className="font-medium">Preferred DC:</span>{" "}
              {request.preferredProviderName}
            </p>
          ) : null}
          {request.message ? (
            <p>
              <span className="font-medium">Message:</span> {request.message}
            </p>
          ) : null}
          <div>
            <span className="font-medium">Preferred times:</span>
            <ul className="mt-1 space-y-1 text-foreground/80">
              {request.preferences?.map((p) => (
                <li key={p.id} className="leading-snug">
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
          {request.declineReason ? (
            <p className="text-destructive">
              <span className="font-medium">Decline reason:</span>{" "}
              {request.declineReason}
            </p>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              <Label>Schedule this time</Label>
              <Select
                value={preferenceId}
                onValueChange={(value) => {
                  setPreferenceId(value);
                  setProviderId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose preferred time" />
                </SelectTrigger>
                <SelectContent>
                  {request.preferences?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FormField
                fieldLabel="Chiropractor"
                displayText={selectedProviderName}
                search={practitionerSearch}
                setSearch={setPractitionerSearch}
                itemsArray={practitionerItems}
                emptyText={
                  preferenceId
                    ? "No chiropractors match your search."
                    : "Select a preferred time first."
                }
                setItemSearch={(name) => {
                  const match = practitioners.find((p) => p.name === name);
                  setProviderId(match ? String(match.id) : "");
                }}
              />
              {preferenceId && slotAvailability.clinicFull ? (
                <p className="text-sm text-destructive">
                  All four appointment slots are already booked at {clockTime}.
                  Choose another preferred time.
                </p>
              ) : preferenceId && scheduleEnforced && availableProviders.length === 0 ? (
                <p className="text-sm text-destructive">
                  No available chiropractors at this time (off shift or already
                  booked). Choose another preferred time or update the staff
                  schedule.
                </p>
              ) : preferenceId && scheduleEnforced ? (
                <p className="text-xs text-muted-foreground">
                  Chiropractors who are off shift or already booked at{" "}
                  {clockTime} cannot be selected.
                </p>
              ) : preferenceId ? (
                <p className="text-xs text-muted-foreground">
                  Chiropractors already booked at {clockTime} are shown as
                  unavailable.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Staff notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label>Decline reason (optional)</Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Only used if you click Decline"
              />
            </div>
          </div>
        ) : null}

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel disabled={saving}>Close</AlertDialogCancel>
          {!readOnly ? (
            <>
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={handleDecline}
              >
                Decline
              </Button>
              <Button
                type="button"
                disabled={
                  saving ||
                  !preferenceId ||
                  !providerId ||
                  slotAvailability.clinicFull ||
                  availableProviders.length === 0
                }
                onClick={handleApprove}
              >
                {saving ? "Saving…" : "Schedule appointment"}
              </Button>
            </>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
