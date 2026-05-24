/**
 * Pulse skeleton for the scheduler grid while appointments load.
 */

import React from "react";
import { CLINIC_TIME_SLOTS } from "@/lib/appointments/status";

export default function SchedulerSkeleton() {
  return (
    <div className="w-full flex-1 grid grid-cols-10 overflow-y-auto min-h-0 rounded-lg border border-border">
      <div className="col-span-2 h-10 bg-muted animate-pulse sticky top-0" />
      <div className="col-span-2 h-10 bg-muted animate-pulse sticky top-0" />
      <div className="col-span-2 h-10 bg-muted animate-pulse sticky top-0" />
      <div className="col-span-2 h-10 bg-muted animate-pulse sticky top-0" />
      <div className="col-span-2 h-10 bg-muted animate-pulse sticky top-0" />
      {CLINIC_TIME_SLOTS.map((slot) => (
        <React.Fragment key={slot}>
          <div className="col-span-2 h-12 bg-muted/40 animate-pulse border border-border/30" />
          <div className="col-span-2 h-12 bg-muted/30 animate-pulse border border-border/20" />
          <div className="col-span-2 h-12 bg-muted/30 animate-pulse border border-border/20" />
          <div className="col-span-2 h-12 bg-muted/30 animate-pulse border border-border/20" />
          <div className="col-span-2 h-12 bg-muted/30 animate-pulse border border-border/20" />
        </React.Fragment>
      ))}
    </div>
  );
}
