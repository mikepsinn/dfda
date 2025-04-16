'use client'

import type { ReminderSchedule } from "@/app/actions/reminder-schedules";
import { ReminderCard } from "./reminder-card";

interface ReminderCardListProps {
    schedules: ReminderSchedule[];
    unitName?: string;
    // Callback when an edit button is clicked, passing the schedule ID
    onEdit: (scheduleId: string) => void; 
    // Callback when a delete button is clicked, passing the schedule ID
    onDelete: (scheduleId: string) => void; 
}

/**
 * Renders a grid of ReminderCard components based on a list of schedules.
 */
export function ReminderCardList({ schedules, unitName, onEdit, onDelete }: ReminderCardListProps) {
    if (!schedules || schedules.length === 0) {
        // Should ideally be handled by the parent component, but added as a fallback.
        return null; 
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <ReminderCard
              key={schedule.id}
              schedule={schedule} // Pass the full schedule object
              unitName={unitName}
              onEdit={() => onEdit(schedule.id)} // Call onEdit prop with the ID
              onDelete={() => onDelete(schedule.id)} // Call onDelete prop with the ID
            />
          ))}
        </div>
    );
} 