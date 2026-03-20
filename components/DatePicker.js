import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarPlus, ChevronDownIcon, X } from "lucide-react";
import {
  formatDay,
  formatMonthDropdown,
  formatYearDropdown,
} from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const datePickerVariants = cva("", {
  variants: {
    variant: {
      default: "",
      icon: "",
    },
  },
});

function DatePicker({ date, setDate, variant = "default" }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant == "default" ? "outline" : "third"}
          data-empty={!date}
          className="flex justify-between text-left cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
        >
          {variant === "icon" ? (
            <CalendarPlus />
          ) : (
            [
              formatMonthDropdown(date) +
                " " +
                formatDay(date) +
                ", " +
                " " +
                formatYearDropdown(date),
            ]
          )}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-auto h-63 p-0 scrollbar-rounded"
        align="start"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-1 left-1 z-10 rounded-md p-1 hover:bg-muted"
          aria-label="Close calendar"
        >
          <X className="h-3 w-3" />
        </button>

        <Calendar
          mode="single"
          selected={date}
          fromYear={new Date().getFullYear()}
          toYear={new Date().getFullYear() + 1}
          onSelect={(day) => {
            if (day) setDate(day);
            setOpen(false);
          }}
          defaultMonth={date}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DatePicker, datePickerVariants };
