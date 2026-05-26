/**
 * Admin dialog to set a chiropractor's working hours for one clinic day.
 */

"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_SHIFT_END_CLOCK,
  DEFAULT_SHIFT_START_CLOCK,
} from "@/lib/shifts/constants";
import {
  getDefaultShiftClocksForDate,
  formatOfficeHoursForDate,
} from "@/lib/clinic/officeHours.js";
import { normalizeShiftClock } from "@/lib/shifts/clinicShiftTime";

export default function StaffScheduleShiftDialog({
  open,
  onOpenChange,
  providerName,
  dateLabel,
  dateIso,
  providerId,
  initialShift,
  onSave,
  saving,
}) {
  const [working, setWorking] = useState(true);
  const [startClock, setStartClock] = useState(DEFAULT_SHIFT_START_CLOCK);
  const [endClock, setEndClock] = useState(DEFAULT_SHIFT_END_CLOCK);

  useEffect(() => {
    if (!open) return;
    const defaults = getDefaultShiftClocksForDate(dateIso);
    if (initialShift) {
      setWorking(true);
      setStartClock(normalizeShiftClock(initialShift.startClock));
      setEndClock(normalizeShiftClock(initialShift.endClock));
    } else if (defaults) {
      setWorking(true);
      setStartClock(normalizeShiftClock(defaults.startClock));
      setEndClock(normalizeShiftClock(defaults.endClock));
    } else {
      setWorking(false);
      setStartClock(normalizeShiftClock(DEFAULT_SHIFT_START_CLOCK));
      setEndClock(normalizeShiftClock(DEFAULT_SHIFT_END_CLOCK));
    }
  }, [open, initialShift, dateIso]);

  const handleSave = () => {
    onSave({
      date: dateIso,
      providerId,
      working,
      startClock: working ? normalizeShiftClock(startClock) : undefined,
      endClock: working ? normalizeShiftClock(endClock) : undefined,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {providerName} — {dateLabel}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Office hours: {formatOfficeHoursForDate(dateIso)}. Shift times must
            stay within these hours.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="shift-working">Working this day</Label>
            <Switch
              id="shift-working"
              checked={working}
              onCheckedChange={setWorking}
            />
          </div>

          {working ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="shift-start">Start</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={startClock}
                  onChange={(e) => setStartClock(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shift-end">End</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={endClock}
                  onChange={(e) => setEndClock(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {saving ? "Saving…" : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
