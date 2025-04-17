'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatTime } from '@/lib/utils'
import type { ReminderSchedule } from '@/app/actions/reminder-schedules'
import { RRule, rrulestr, Weekday } from 'rrule'

interface ReminderCardProps {
  schedule: ReminderSchedule
  unitName: string
}

export function ReminderCard({ schedule, unitName }: ReminderCardProps) {
  const formatDays = (days: Weekday[] | number[]) => {
    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    
    const dayIndices = days.map(day => typeof day === 'number' ? day : day.weekday);

    if (dayIndices.length === 7) return 'Every day'
    
    const sortedIndices = [...dayIndices].sort();
    if (sortedIndices.length === 5 && sortedIndices.join(',') === '1,2,3,4,5') {
      return 'Weekdays'
    }
    
    if (sortedIndices.length === 2 && sortedIndices.join(',') === '0,6') {
      return 'Weekends'
    }
    
    return days.map(day => dayNames[typeof day === 'number' ? day : day.weekday]).join(', ')
  }

  const formatFrequency = () => {
    try {
      const rule = rrulestr(schedule.rrule) as RRule;
      const options = rule.options;

      if (options.freq === RRule.DAILY) {
        if (options.interval === 1) {
          return 'Daily'
        }
        return `Every ${options.interval} days`
      }
      
      if (options.freq === RRule.WEEKLY) {
          const weekdays = options.byweekday as Weekday[] | number[] | null;
          const formattedDays = weekdays ? formatDays(weekdays) : 'specified days';
          if (options.interval === 1) {
            return `Weekly on ${formattedDays}`
          }
          return `Every ${options.interval} weeks on ${formattedDays}`
      }
      
      if (options.freq === RRule.MONTHLY) {
          const dayOfMonth = options.bymonthday;
          const intervalText = options.interval === 1 ? "Monthly" : `Every ${options.interval} months`;
          if (dayOfMonth) {
              return `${intervalText} on day ${dayOfMonth}`;
          }
          return intervalText;
      }
      
      return 'Custom schedule'

    } catch (e) {
      console.error("Error parsing RRULE:", schedule.rrule, e);
      return "Invalid schedule rule";
    }
  }

  return (
    <Card 
      className="overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span className="text-lg font-medium">
              {formatTime(schedule.time_of_day)}
              <span className="mt-2 text-sm text-muted-foreground pl-2">
                {formatFrequency()}
              </span>
            </span>
          </div>
          <div className="text-xs bg-primary/10 rounded-full px-2 py-0.5">
            {schedule.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
        

        
        {schedule.default_value !== undefined && schedule.default_value !== null && (
          <div className="mt-2 text-sm">
            Default value: {schedule.default_value} {unitName}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 