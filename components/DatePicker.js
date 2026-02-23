import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import {
  formatDay,
  formatMonthDropdown,
  formatYearDropdown,
} from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

export default function DatePicker({ date, setDate }) {
  return (
    <Popover>
      <PopoverTrigger className="w-auto p-0" asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal"
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
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  );
}
