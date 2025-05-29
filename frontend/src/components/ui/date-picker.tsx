"use client"

import * as React from "react"
import { format, getMonth, getYear, setMonth, setYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  selectedDate?: Date;
  onChange?: (date: Date) => void;
}

export function DatePicker({
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  selectedDate,
  onChange,
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date>(
    selectedDate ?? new Date()
  )

  React.useEffect(() => {
    if (selectedDate) {
      setInternalDate(selectedDate)
    }
  }, [selectedDate])

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  )

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(internalDate, months.indexOf(month))
    setInternalDate(newDate)
    onChange?.(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = setYear(internalDate, parseInt(year))
    setInternalDate(newDate)
    onChange?.(newDate)
  }

  const handleSelect = (selectedData: Date | undefined) => {
    if (selectedData) {
      setInternalDate(selectedData)
      onChange?.(selectedData)
    }
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !internalDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {internalDate ? format(internalDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-900 z-50">
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(internalDate)]}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={getYear(internalDate).toString()}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={internalDate}
          onSelect={handleSelect}
          initialFocus
          month={internalDate}
          onMonthChange={setInternalDate}
        />
      </PopoverContent>
    </Popover>
  )
}
