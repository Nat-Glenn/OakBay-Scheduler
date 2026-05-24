/**
 * Shared appointment status colors for scheduler cells and history badges.
 * Pairs with CSS variables in app/globals.css.
 */

import { UiAppointmentStatus } from "@/lib/appointments/constants";

/** Scheduler grid cell (UI status: scheduled, checked-in, checked-out). */
export function getSchedulerCellClasses(status) {
  switch (status) {
    case UiAppointmentStatus.CHECKED_IN:
      return "bg-status-checked-in text-status-checked-in-foreground";
    case UiAppointmentStatus.CHECKED_OUT:
      return "bg-status-completed text-status-completed-foreground";
    case UiAppointmentStatus.CANCELLED:
      return "bg-status-cancelled text-status-cancelled-foreground";
    case UiAppointmentStatus.SCHEDULED:
    default:
      return "bg-status-scheduled text-status-scheduled-foreground";
  }
}

/** Visit history / table status pill label → Tailwind classes. */
export function getHistoryStatusBadgeClasses(label) {
  switch (label) {
    case "Completed":
      return "bg-status-completed text-status-completed-foreground";
    case "In Progress":
      return "bg-status-checked-in text-status-checked-in-foreground";
    case "Confirmed":
      return "bg-status-scheduled text-status-scheduled-foreground";
    case "Cancelled":
      return "bg-status-cancelled text-status-cancelled-foreground";
    case "Requested":
      return "bg-status-requested text-status-requested-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export const SCHEDULER_LEGEND_ITEMS = [
  { label: "Scheduled", className: "bg-status-scheduled" },
  { label: "Checked in", className: "bg-status-checked-in" },
  { label: "Completed", className: "bg-status-completed" },
];
