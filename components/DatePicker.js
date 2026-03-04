import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, X } from "lucide-react";
import {
  formatDay,
  formatMonthDropdown,
  formatYearDropdown,
} from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function DatePicker({ date, setDate }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground sm:shrink md:w-[175px] justify-between text-left cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
        >
          {date ? (
            [
              formatMonthDropdown(date) +
                " " +
                formatDay(date) +
                ", " +
                " " +
                formatYearDropdown(date),
            ]
          ) : (
            <span>Pick a date</span>
          )}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-auto h-63 p-0" align="start">
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
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
