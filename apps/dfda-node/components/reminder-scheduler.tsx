'use client'

import React, { useState, useEffect } from 'react'
import { RRule, rrulestr, Weekday, type Options as RRuleOptions } from 'rrule'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar" // Assuming Shadcn calendar
import { Switch } from "@/components/ui/switch"
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
// import { TimeField } from "@/components/ui/time-field" // Commented out - Component not found
// import { type RRuleOption, getRRuleOptions } from "@/lib/rrule-options" // Commented out - Module not found

// Define the structure of the schedule object this component works with
export interface ReminderScheduleData {
  rruleString: string; // The generated RRULE string
  timeOfDay: string; // HH:mm format (e.g., "09:00")
  // timezone: string; // Removed
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
}

interface ReminderSchedulerProps {
  initialSchedule?: Partial<ReminderScheduleData>; // Allow passing partial initial state
  onChange: (schedule: ReminderScheduleData) => void;
  userTimezone: string; // <-- Accept user timezone as prop
}

// Simple TimePicker Component (Replace with a proper one if available)
const SimpleTimePicker = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => (
  <Input
    type="time"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-[120px]"
  />
);

export function ReminderScheduler({ initialSchedule, onChange, userTimezone }: ReminderSchedulerProps) {
  const [freq, setFreq] = useState<number>(RRule.DAILY); // Default to Daily
  const [interval, setInterval] = useState<number>(1);
  const [byWeekday, setByWeekday] = useState<Weekday[]>([]); // For weekly
  const [byMonthDay, setByMonthDay] = useState<number | null>(null); // For monthly
  const [timeOfDay, setTimeOfDay] = useState<string>(initialSchedule?.timeOfDay || "09:00");
  // const [timezone, setTimezone] = useState<string>(...); // Removed timezone state
  const [startDate, setStartDate] = useState<Date>(initialSchedule?.startDate || new Date());
  const [endDate, setEndDate] = useState<Date | null | undefined>(initialSchedule?.endDate);
  const [isActive, setIsActive] = useState<boolean>(initialSchedule?.isActive === undefined ? true : initialSchedule.isActive);

  // --- Update internal state from RRULE string on initial load/change ---
  useEffect(() => {
      if (initialSchedule?.rruleString) {
          try {
              // RRULE string itself doesn't usually contain timezone, 
              // it's interpreted based on DTSTART timezone.
              // We now get timezone context from the userTimezone prop.
              const rule = rrulestr(initialSchedule.rruleString) as RRule;
              if (rule.options.freq !== undefined) setFreq(rule.options.freq);
              if (rule.options.interval !== undefined) setInterval(rule.options.interval);
              
              // Safely handle byweekday conversion
              if (rule.options.byweekday !== undefined && rule.options.byweekday !== null) {
                   const rawWeekdaysSource = rule.options.byweekday;
                   const rawWeekdays = Array.isArray(rawWeekdaysSource) ? rawWeekdaysSource : [rawWeekdaysSource];
                   const weekdays: Weekday[] = rawWeekdays
                      .map(d => {
                          // Check if it's already a Weekday object (has .weekday property)
                          if (typeof d === 'object' && d !== null && 'weekday' in d && typeof (d as any).weekday === 'number') {
                              // It looks like a Weekday object, create a new instance to be safe
                              // Or just return d if you are sure about the source integrity 
                              return new Weekday((d as any).weekday, (d as any).n);
                          }
                          // Otherwise, assume it's a number and create a new Weekday
                          if (typeof d === 'number') {
                             return new Weekday(d);
                          }
                          console.warn("Unexpected type in byweekday array:", d);
                          return null; // Explicitly return null for invalid types
                      })
                      .filter((d): d is Weekday => d !== null); // Type guard to filter out nulls

                   setByWeekday(weekdays);
              } else {
                   setByWeekday([]);
              }
              
              if (rule.options.bymonthday !== undefined && typeof rule.options.bymonthday === 'number') {
                   setByMonthDay(rule.options.bymonthday);
              } else {
                   setByMonthDay(null);
              }
          } catch (e) {
              console.error("Error parsing initial RRULE string:", e);
              // Reset to defaults if parse fails
              setFreq(RRule.DAILY);
              setInterval(1);
              setByWeekday([]);
              setByMonthDay(null);
          }
      }
       // Also update other fields from initialSchedule if they change
      setTimeOfDay(initialSchedule?.timeOfDay || "09:00");
      // setTimezone(...) // Removed
      setStartDate(initialSchedule?.startDate || new Date());
      setEndDate(initialSchedule?.endDate);
      setIsActive(initialSchedule?.isActive === undefined ? true : initialSchedule.isActive);

      // Removed dependency on initialSchedule.timezone
  }, [initialSchedule?.rruleString, initialSchedule?.timeOfDay, initialSchedule?.startDate, initialSchedule?.endDate, initialSchedule?.isActive]);

  // --- Generate RRULE string and notify parent on changes ---
  useEffect(() => {
      // Use the imported RRuleOptions type
      const options: Partial<RRuleOptions> = {
          freq: freq,
          interval: interval,
          dtstart: startDate, // Include start date in rule
          tzid: userTimezone, // <-- Use the userTimezone prop here
      };

      if (freq === RRule.WEEKLY && byWeekday.length > 0) {
          options.byweekday = byWeekday;
      } else if (freq === RRule.MONTHLY && byMonthDay !== null) {
          options.bymonthday = byMonthDay;
      }

      if (endDate) {
          // Ensure endDate time is end of day for UNTIL comparison to work as expected
          const endOfDayEndDate = new Date(endDate);
          endOfDayEndDate.setHours(23, 59, 59, 999);
          options.until = endOfDayEndDate;
      }

      const rruleString = new RRule(options).toString();

      onChange({
          rruleString,
          timeOfDay,
          // timezone, // Removed
          startDate,
          endDate,
          isActive,
      });

      // Removed timezone from dependencies, added userTimezone
  }, [freq, interval, byWeekday, byMonthDay, timeOfDay, userTimezone, startDate, endDate, isActive, onChange]);

  const handleWeekdayChange = (day: Weekday, checked: boolean | string) => {
      if (checked === true) {
          // Ensure weekdays are sorted for consistent RRULE string
          setByWeekday([...byWeekday, day].sort((a, b) => a.weekday - b.weekday));
      } else {
          setByWeekday(byWeekday.filter(d => d.weekday !== day.weekday));
      }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
        {/* Frequency */}
        <div className="grid grid-cols-3 gap-4 items-center">
            <Label htmlFor="freq" className="col-span-1">Frequency</Label>
            <Select value={freq.toString()} onValueChange={(v) => setFreq(parseInt(v))}>
                <SelectTrigger id="freq" className="col-span-2">
                    <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={RRule.DAILY.toString()}>Daily</SelectItem>
                    <SelectItem value={RRule.WEEKLY.toString()}>Weekly</SelectItem>
                    <SelectItem value={RRule.MONTHLY.toString()}>Monthly</SelectItem>
                    {/* <SelectItem value={RRule.YEARLY.toString()}>Yearly</SelectItem> */}
                </SelectContent>
            </Select>
        </div>

        {/* Interval */}
        <div className="grid grid-cols-3 gap-4 items-center">
            <Label htmlFor="interval" className="col-span-1">Repeat Every</Label>
            <div className="col-span-2 flex items-center gap-2">
                <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={interval}
                    onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-[70px]"
                />
                <span>
                    {freq === RRule.DAILY && (interval === 1 ? "day" : "days")}
                    {freq === RRule.WEEKLY && (interval === 1 ? "week" : "weeks")}
                    {freq === RRule.MONTHLY && (interval === 1 ? "month" : "months")}
                </span>
            </div>
        </div>

        {/* Repeat On (Weekly) */}
        {freq === RRule.WEEKLY && (
            <div className="grid grid-cols-3 gap-4">
                <Label className="col-span-1 pt-2">Repeat On</Label>
                <div className="col-span-2 grid grid-cols-4 gap-2">
                    {[RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU].map((day) => (
                        <div key={day.weekday} className="flex items-center space-x-2">
                           <Checkbox
                                id={`weekday-${day.weekday}`}
                                checked={byWeekday.some(d => d.weekday === day.weekday)}
                                onCheckedChange={(checked) => handleWeekdayChange(day, checked)}
                            />
                            <Label htmlFor={`weekday-${day.weekday}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                {day.toString()} 
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        )}

         {/* Repeat On Day (Monthly) */} 
         {freq === RRule.MONTHLY && (
            <div className="grid grid-cols-3 gap-4 items-center">
                <Label htmlFor="bymonthday" className="col-span-1">Day of Month</Label>
                 <Select value={byMonthDay?.toString() || ""} onValueChange={(v) => setByMonthDay(v ? parseInt(v) : null)}>
                    <SelectTrigger id="bymonthday" className="col-span-2">
                        <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
         )}

        {/* Time of Day */}
        <div className="grid grid-cols-3 gap-4 items-center">
             <Label htmlFor="timeOfDay" className="col-span-1">Time of Day</Label>
             <SimpleTimePicker value={timeOfDay} onChange={setTimeOfDay} />
        </div>

        {/* Start Date */} 
        <div className="grid grid-cols-3 gap-4 items-center">
            <Label className="col-span-1">Start Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full col-span-2 justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, "PPP")} 
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>

        {/* End Date (Optional) */} 
        <div className="grid grid-cols-3 gap-4 items-center">
            <Label className="col-span-1">End Date</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full col-span-2 justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Never</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                     <Calendar
                        mode="single"
                        selected={endDate || undefined}
                        onSelect={(date) => setEndDate(date)} 
                    />
                    <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setEndDate(null)}>Set to Never</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        {/* Is Active */}
        <div className="flex items-center space-x-2">
            <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="is-active">Reminder Active</Label>
        </div>
    </div>
  );
} 