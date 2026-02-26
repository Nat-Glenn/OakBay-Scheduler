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
import { ChevronDownIcon } from "lucide-react";
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
    <DropdownMenu open={open}>
      <DropdownMenuTrigger className="w-auto p-0" asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal cursor-pointer"
          onClick={() => setOpen(true)}
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
        <Calendar
          mode="single"
          selected={date}
          fromYear={new Date().getFullYear()}
          toYear={new Date().getFullYear() + 1}
          onSelect={(day) => {
            setOpen(false);
            if (day) setDate(day);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
