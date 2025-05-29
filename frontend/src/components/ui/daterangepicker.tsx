// components/DateRangePicker.tsx
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

interface Props {
  onDateChange: (range: DateRange | undefined ) => void;
}

export function DateRangePicker({ onDateChange }: Props) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)), // default: ultimi 7 giorni
    to: new Date(),
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
   onDateChange(range);
  };

  return (
    <div className="flex justify-center mt-8">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                `${format(date.from, "dd/MM/yyyy")} → ${format(date.to, "dd/MM/yyyy")}`
              ) : (
                format(date.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Seleziona un intervallo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
