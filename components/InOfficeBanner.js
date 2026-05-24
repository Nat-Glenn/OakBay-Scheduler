/**
 * Shows chiropractors currently on shift (from /api/shifts/in-office).
 * Used on the scheduler so reception can see who is in the clinic now.
 */

"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { formatInOfficeLabel } from "@/lib/shifts/clientUtils";

export default function InOfficeBanner({ className = "" }) {
  const [inOffice, setInOffice] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await apiFetch("/api/shifts/in-office");
        const data = await res.json();
        if (!ignore && res.ok) {
          setInOffice(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div
        className={`rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground ${className}`}
      >
        Checking who is in the office…
      </div>
    );
  }

  if (inOffice.length === 0) {
    return (
      <div
        className={`rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground ${className}`}
      >
        <span className="font-medium text-foreground">In office now:</span> No
        chiropractors are on shift at this time. Check the staff schedule before
        booking.
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-status-checked-in/40 bg-status-checked-in/15 px-4 py-2 text-sm ${className}`}
    >
      <Users className="size-4 shrink-0 text-status-checked-in-foreground" />
      <span className="font-semibold text-foreground">In office now:</span>
      <span className="text-foreground">
        {inOffice.map(formatInOfficeLabel).join(" · ")}
      </span>
    </div>
  );
}
