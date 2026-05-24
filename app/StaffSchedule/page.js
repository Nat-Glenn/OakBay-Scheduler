/**
 * Monthly chiropractor schedule — admin edits shifts; all staff can view who is working.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, format, isToday, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import InOfficeBanner from "@/components/InOfficeBanner";
import StaffScheduleShiftDialog from "@/components/StaffScheduleShiftDialog";
import LoadErrorPanel from "@/components/LoadErrorPanel";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";
import { useSessionUser } from "@/utils/useSessionUser";
import { AppRole } from "@/lib/auth/roles";
import {
  buildShiftLookup,
  formatShiftHoverTitle,
  getMonthBounds,
  isProviderWorkingOnDay,
  shiftMapKey,
} from "@/lib/shifts/clientUtils";
import { toast } from "sonner";

export default function StaffSchedulePage() {
  const { session } = useSessionUser();
  const isAdmin = session?.role === AppRole.ADMIN;

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [practitioners, setPractitioners] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);

  const { from, to, year, month, daysInMonth } = useMemo(
    () => getMonthBounds(viewMonth),
    [viewMonth],
  );

  const shiftLookup = useMemo(() => buildShiftLookup(shifts), [shifts]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prRes, shRes] = await Promise.all([
        apiFetch("/api/practitioners"),
        apiFetch(`/api/shifts?from=${from}&to=${to}`),
      ]);
      const prData = await prRes.json();
      const shData = await shRes.json();

      if (!prRes.ok) {
        throw new Error(parseApiError(prData, "Failed to load chiropractors"));
      }
      if (!shRes.ok) {
        throw new Error(parseApiError(shData, "Failed to load shifts"));
      }

      setPractitioners(prData);
      setShifts(Array.isArray(shData) ? shData : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load staff schedule.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadData();
  }, [loadData, reloadKey]);

  const monthLabel = format(viewMonth, "MMMM yyyy");

  const dayNumbers = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const dateIsoForDay = (day) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const openCell = (provider, day) => {
    if (!isAdmin) return;
    const dateIso = dateIsoForDay(day);
    const shift = shiftLookup.get(shiftMapKey(provider.id, dateIso));
    setDialog({
      providerId: provider.id,
      providerName: provider.name,
      dateIso,
      dateLabel: format(new Date(year, month - 1, day), "EEE, MMM d"),
      shift: shift ?? null,
    });
  };

  const handleSaveShift = async (payload) => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/shifts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to save shift"));
      }
      toast.success(payload.working ? "Shift saved." : "Marked off.", {
        position: "top-right",
      });
      setDialog(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message || "Could not save shift.", {
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Staff schedule">
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <PageHeader
          title="Staff schedule"
          description={
            isAdmin
              ? "Set which chiropractors are working each day. Reception uses this when booking."
              : "See who is scheduled to work. Book appointments with chiropractors who are on shift."
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[10rem] text-center text-sm font-semibold">
                {monthLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(1);
                  setViewMonth(d);
                }}
              >
                This month
              </Button>
            </>
          }
        />

        <InOfficeBanner className="mb-4" />

        {error ? (
          <LoadErrorPanel message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-dropdown/50 p-12 text-sm text-muted-foreground">
            Loading schedule…
          </div>
        ) : practitioners.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-border p-12 text-center">
            <CalendarDays className="size-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No chiropractors on file</p>
            <p className="text-sm text-muted-foreground">
              Add practitioners first, then set their monthly schedule here.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border scrollbar-rounded">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-input">
                <tr>
                  <th className="sticky left-0 z-20 min-w-[8rem] border-b border-r border-border bg-input px-3 py-2 text-left font-semibold text-foreground">
                    Chiropractor
                  </th>
                  {dayNumbers.map((day) => {
                    const cellDate = new Date(year, month - 1, day);
                    const today = isToday(cellDate);
                    return (
                      <th
                        key={day}
                        className={`min-w-[2.25rem] border-b border-border px-0.5 py-2 text-center text-xs font-medium ${
                          today
                            ? "bg-ring/15 text-button-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {practitioners.map((provider) => (
                  <tr key={provider.id} className="border-b border-border/60">
                    <td className="sticky left-0 z-10 border-r border-border bg-dropdown px-3 py-2 font-medium text-foreground">
                      {provider.name}
                    </td>
                    {dayNumbers.map((day) => {
                      const dateIso = dateIsoForDay(day);
                      const shift = shiftLookup.get(
                        shiftMapKey(provider.id, dateIso),
                      );
                      const working = isProviderWorkingOnDay(
                        shiftLookup,
                        provider.id,
                        dateIso,
                      );
                      const cellDate = new Date(year, month - 1, day);
                      const today = isToday(cellDate);
                      const dateLabel = format(cellDate, "EEE, MMM d, yyyy");
                      const hoverTitle = formatShiftHoverTitle(
                        shift,
                        provider.name,
                        dateLabel,
                      );

                      return (
                        <td key={day} className="p-0.5">
                          <button
                            type="button"
                            disabled={!isAdmin}
                            title={hoverTitle}
                            aria-label={hoverTitle}
                            onClick={() => openCell(provider, day)}
                            className={`flex h-9 w-full flex-col items-center justify-center rounded-md border text-[10px] leading-tight transition-colors ${
                              working
                                ? "border-status-checked-in/50 bg-status-checked-in/25 text-status-checked-in-foreground hover:bg-status-checked-in/35"
                                : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50"
                            } ${today ? "ring-1 ring-ring/50" : ""} ${
                              isAdmin ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {working ? (
                              <>
                                <span className="font-semibold">In</span>
                                <span className="hidden sm:inline">
                                  {shift.startClock}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {isAdmin
            ? "Click a day to set hours or mark off. Green = scheduled to work."
            : "Green = scheduled to work. Book appointments only with chiropractors on shift."}
        </p>
      </div>

      {dialog ? (
        <StaffScheduleShiftDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          providerName={dialog.providerName}
          dateLabel={dialog.dateLabel}
          dateIso={dialog.dateIso}
          providerId={dialog.providerId}
          initialShift={dialog.shift}
          onSave={handleSaveShift}
          saving={saving}
        />
      ) : null}
    </AppShell>
  );
}
