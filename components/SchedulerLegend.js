/**
 * Color key for appointment blocks on the scheduler grid.
 */

import { SCHEDULER_LEGEND_ITEMS } from "@/lib/ui/appointmentStatusStyles";

export default function SchedulerLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 pb-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Legend</span>
      {SCHEDULER_LEGEND_ITEMS.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className={`h-3 w-3 rounded-sm border border-border/50 ${item.className}`}
            aria-hidden
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
