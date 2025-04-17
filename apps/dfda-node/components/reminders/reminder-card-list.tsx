'use client'

import type { ReminderSchedule } from "@/app/actions/reminder-schedules";
import { ReminderCard } from "./reminder-card";

interface ReminderCardListProps {
    schedules: ReminderSchedule[];
    unitName: string;
    emoji: string;
    onClick?: (scheduleId: string) => void;
}

/**
 * Renders a grid of ReminderCard components based on a list of schedules.
 */
export function ReminderCardList({ schedules, unitName, emoji, onClick }: ReminderCardListProps) {
    if (!schedules || schedules.length === 0) {
        // Should ideally be handled by the parent component, but added as a fallback.
        return null; 
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <ReminderCard
              key={schedule.id}
              schedule={schedule}
              unitName={unitName}
              emoji={emoji}
              onClick={onClick ? () => onClick(schedule.id) : undefined}
            />
          ))}
        </div>
    );
} 