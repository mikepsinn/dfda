"use client"

import type React from "react"
// Correct imports for React hooks, Next router, date-fns, lucide-react, and UI components
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Pill,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Heart,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORIES_DATA, VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"

// REMOVE: import type { MeasurementNotificationItemData, VariableCategoryId as SharedVariableCategoryId, MeasurementStatus as SharedMeasurementStatus } from "@/components/shared/measurement-notification-item";
import type { Database } from "@/lib/database.types"; // ADD this for direct db type imports
import type { PendingNotificationTask } from "@/lib/actions/reminder-schedules"; // Import PendingNotificationTask

import { MeasurementCard, type MeasurementCardData } from "@/components/measurement-card";
import { ReminderNotificationCard, type ReminderNotificationCardData, type ReminderNotificationStatus } from "@/components/reminder-notification-card";
import { logger } from "@/lib/logger"; // Import logger

export type VariableCategoryId = Database["public"]["Tables"]["variable_categories"]["Row"]["id"]; // ADDED for clarity
export type FilterableVariableCategoryId = VariableCategoryId | "all"; // UPDATED to use new VariableCategoryId

// Keep the TimelineItem interface for data fetching structure, ensure it aligns
// with MeasurementNotificationItemData
// TODO: This needs to be addressed. For now, we might comment it out or define a minimal version
// if components/shared/measurement-notification-item.tsx is deleted.
export type TimelineItem = any; // TEMPORARY: To allow compilation. Will be fixed.

export interface UniversalTimelineProps {
  title?: string;
  rawMeasurements?: MeasurementCardData[]; // Changed to expect MeasurementCardData[] directly
  rawNotifications?: PendingNotificationTask[]; // Changed from notifications: MeasurementNotificationItemData[]
  date?: Date;
  userTimezone?: string;
  onAddMeasurement?: (variableCategoryId: FilterableVariableCategoryId) => void
  // Callback for when a measurement is updated via MeasurementCard
  onUpdateMeasurement?: (measurement: MeasurementCardData, newValue: number) => Promise<void>; 
  // Callbacks for reminder notifications, to be passed down to ReminderNotificationCard
  onLogNotificationMeasurement?: (reminderNotificationId: string, value: number, reminderScheduleId: string, variableName: string, unitName: string) => Promise<void>;
  onSkipNotification?: (reminderNotificationId: string, reminderScheduleId: string) => Promise<void>;
  onUndoNotificationLog?: (reminderNotificationId: string, reminderScheduleId: string) => Promise<void>;
  // For editing the reminder settings itself, not logging a value
  onEditReminderSettings?: (reminderScheduleId: string) => void; 
  onNavigateToVariableSettings?: (userVariableId: string | undefined, globalVariableId: string | undefined) => void;
  className?: string
  showFilters?: boolean
  showDateNavigation?: boolean
  showAddButtons?: boolean
  defaultCategory?: FilterableVariableCategoryId
  emptyState?: React.ReactNode
}

export function UniversalTimeline({
  rawMeasurements = [], // This is now MeasurementCardData[]
  rawNotifications = [], // Changed from notifications
  date: initialDate = new Date(),
  userTimezone = 'UTC',
  onAddMeasurement,
  onUpdateMeasurement,
  onLogNotificationMeasurement,
  onSkipNotification,
  onUndoNotificationLog,
  onEditReminderSettings,
  onNavigateToVariableSettings,
  className = "",
  showFilters = true,
  showDateNavigation = true,
  showAddButtons = true,
  defaultCategory = "all",
  emptyState,
}: UniversalTimelineProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [showCalendar, setShowCalendar] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<FilterableVariableCategoryId>(defaultCategory)

  // Filter measurements. Input is already MeasurementCardData[]
  const filteredMeasurements = useMemo(() => {
    return rawMeasurements // This is MeasurementCardData[]
      .filter((item: MeasurementCardData) => { // item is MeasurementCardData
        try {
          // Filter by date using item.start_at (which is already a string date)
          const itemDate = new Date(item.start_at); 
          const isSameDay =
            itemDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            itemDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            itemDate.getUTCDate() === selectedDate.getUTCDate();
          const matchesCategory = selectedCategory === "all" || item.variableCategoryId === selectedCategory;
          const matchesSearch =
            searchQuery === "" ||
            (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
          return isSameDay && matchesCategory && matchesSearch;
        } catch (error) {
          // Use item.id if available, item is MeasurementCardData
          logger.error("Error filtering measurement item in UniversalTimeline:", { itemId: item.id, error }); 
          return false;
        }
      })
      // No .map() needed here anymore as rawMeasurements is already MeasurementCardData[]
      // .map((item): MeasurementCardData => ({ ... })) // REMOVED
  }, [rawMeasurements, selectedCategory, searchQuery, selectedDate]);

  // Filter notifications and map to ReminderNotificationCardData
  const filteredNotifications = useMemo(() => {
    logger.info("[UniversalTimeline] Processing rawNotifications for timeline display", {
      count: rawNotifications.length,
      sample: rawNotifications.slice(0, 3).map(t => ({ 
        id: t.notificationId, 
        dueAt: t.dueAt, 
        scheduleId: t.scheduleId, 
        status: (t as any).status, // Keep for logging sample if useful
        variableName: t.variableName 
      })),
      selectedDate: selectedDate.toISOString()
    });

    return rawNotifications 
      .filter((task) => { 
        try {
          // Ensure task and task.dueAt are defined before trying to access properties
          if (!task || !task.dueAt) {
            logger.warn("[UniversalTimeline] Filtering out notification due to missing task or dueAt.", { task });
            return false;
          }
          if (isNaN(new Date(task.dueAt).getTime())) {
            // Log error for invalid date, but allow it to be filtered out
            logger.error(`[UniversalTimeline] Invalid dueAt for notification: ${task.notificationId || 'ID_UNKNOWN'}`, { dueAt: task.dueAt });
            return false; // Filter out items with invalid dates
          }
          const itemDate = new Date(task.dueAt); 
          const isSameDay =
            itemDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            itemDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            itemDate.getUTCDate() === selectedDate.getUTCDate();
          
          if (!isSameDay) {
            return false;
          }

          // Basic check for essential fields needed for the card
          if (!task.notificationId || !task.scheduleId || !task.variableName || !task.variableCategory || !task.unitId || !task.unitName) {
            logger.error(`[UniversalTimeline] Filtering out notification ${task.notificationId || 'ID_UNKNOWN'} due to missing essential fields.`, { task });
            return false;
          }
          
          // Validate status - it should be one of the defined ReminderNotificationStatus types
          const validStatuses: ReminderNotificationStatus[] = ["pending", "completed", "skipped", "error"];
          const notificationStatus = (task as any).status as ReminderNotificationStatus; // Temporary cast

          if (notificationStatus && !validStatuses.includes(notificationStatus)) {
            logger.error(`[UniversalTimeline] Invalid status '${notificationStatus}' for notification: ${task.notificationId}. Filtering out.`, { task });
            return false; // Filter out items with invalid status
          }
          
          return true;
        } catch (error) {
          logger.error("[UniversalTimeline] Error during notification pre-filtering phase:", { 
            message: error instanceof Error ? error.message : String(error),
            taskId: task?.notificationId,
            taskData: task // log the task data for easier debugging
          });
          return false; 
        }
      })
      .map((task): ReminderNotificationCardData | null => { 
        try {
            // Status determination: DB should provide this. Default to 'pending' if missing.
            const statusFromTask = (task as any).status; 
            const mappedStatus: ReminderNotificationStatus = 
              statusFromTask && ['pending', 'completed', 'skipped', 'error'].includes(statusFromTask) 
              ? statusFromTask 
              : 'pending';

            const defaultValueFromTask = (task as any).defaultValue;
            const emojiFromTask = (task as any).emoji;
            const currentValueFromTask = (task as any).currentValue ?? null; 
            const loggedValueUnitFromTask = (task as any).loggedValueUnit ?? task.unitName;

            return {
                id: task.notificationId!,
                reminderScheduleId: task.scheduleId!,
                triggerAtUtc: task.dueAt!,
                status: mappedStatus, 
                variableName: task.variableName!, 
                variableCategoryId: task.variableCategory! as VariableCategoryId, // UPDATED to use VariableCategoryId 
                unitId: task.unitId!, 
                unitName: task.unitName!, 
                globalVariableId: (task as any).globalVariableId,
                userVariableId: (task as any).userVariableId,
                details: task.message || undefined, 
                detailsUrl: undefined,
                isEditable: true,
                defaultValue: typeof defaultValueFromTask === 'number' ? defaultValueFromTask : null, 
                emoji: typeof emojiFromTask === 'string' ? emojiFromTask : null,
                currentValue: typeof currentValueFromTask === 'number' ? currentValueFromTask : null, 
                loggedValueUnit: typeof loggedValueUnitFromTask === 'string' ? loggedValueUnitFromTask : task.unitName!,
            };
        } catch (error) { 
            logger.error("[UniversalTimeline] Error mapping PendingNotificationTask to ReminderNotificationCardData:", { 
              message: error instanceof Error ? error.message : String(error),
              taskId: task?.notificationId,
              taskData: task
            });
            return null; 
        }
      })
      .filter((item): item is ReminderNotificationCardData => item !== null);

  }, [rawNotifications, selectedDate]);

  // Handler for MeasurementCard's onUpdateMeasurement
  const handleDirectMeasurementUpdate = useCallback(async (measurement: MeasurementCardData, newValue: number) => {
    if (onUpdateMeasurement) {
      try {
        await onUpdateMeasurement(measurement, newValue);
      } catch (error) {
        logger.error("Error calling onUpdateMeasurement from UniversalTimeline", { error, measurementId: measurement.id, newValue });
      }
    } else {
      logger.warn("UniversalTimeline: onUpdateMeasurement prop not provided.");
    }
  }, [onUpdateMeasurement]);
  
  const handleNavigateToVariableSettings = useCallback((userVariableId: string | undefined, globalVariableId: string | undefined) => {
    if (onNavigateToVariableSettings) {
      onNavigateToVariableSettings(userVariableId, globalVariableId);
    } else {
      if (userVariableId) {
        router.push(`/user-variables/${userVariableId}/settings`);
      } else if (globalVariableId) {
        router.push(`/variables/${globalVariableId}/settings`);
      } else {
        logger.warn("UniversalTimeline: Cannot navigate to variable settings, no ID provided.");
      }
    }
  }, [router, onNavigateToVariableSettings]);

  // --- Date Navigation and Empty State --- 

  const previousDay = () => {
    setSelectedDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() - 1)))
    // TODO: Trigger data refresh based on date change
  }
  const nextDay = () => {
    setSelectedDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() + 1)))
    // TODO: Trigger data refresh based on date change
  }
  const isToday = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const selectedStart = new Date(selectedDate);
    selectedStart.setHours(0, 0, 0, 0);
    return selectedStart.getTime() === todayStart.getTime();
  }

  const renderEmptyState = () => {
    const categoryName = selectedCategory === 'all' ? 'all categories' : VARIABLE_CATEGORIES_DATA[selectedCategory]?.name || 'this category';
    return (
      <p className="text-sm text-muted-foreground">
        {emptyState || `No items found for ${categoryName} on ${format(selectedDate, "MMMM d, yyyy")}`}
      </p>
    )
  }

  return (
    <div className={cn("p-4 border rounded-lg shadow-sm", className)}>
      {/* Header Section - Remains the same */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b">
        {/* Date Navigation */} 
        {showDateNavigation && (
          <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={previousDay} aria-label="Previous day">
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  aria-label="Select date"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (day) {
                      setSelectedDate(day)
                      // TODO: Optionally call a prop here if date change needs to trigger data fetch
                      // e.g., onDateChange?.(day);
                    }
                    setShowCalendar(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={nextDay} aria-label="Next day" disabled={isToday()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Filters and Search - Remains the same */}
        <div className="flex flex-wrap items-center gap-2 flex-grow justify-end">
          {showFilters && (
            <>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FilterableVariableCategoryId)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(VARIABLE_CATEGORIES_DATA).map(([id, data]) => (
                    <SelectItem key={id} value={id}>{data.emoji} {data.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search timeline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px] md:w-[250px]"
                />
              </div>
            </>
          )}
          {/* Add Measurement Buttons - Remains the same */}
          {showAddButtons && onAddMeasurement && (
             <div className="flex items-center gap-2 border-l pl-4 ml-2">
               {/* Tooltip Buttons ... */} 
              <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button variant="outline" size="icon" onClick={() => onAddMeasurement(VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS)} aria-label="Add Intake/Intervention">
                       <Pill className="h-4 w-4" />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent><p>Add Intake/Intervention</p></TooltipContent>
                 </Tooltip>
               </TooltipProvider>
              <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button variant="outline" size="icon" onClick={() => onAddMeasurement(VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY)} aria-label="Add Health/Physiology">
                       <Heart className="h-4 w-4" />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent><p>Add Health/Physiology</p></TooltipContent>
                 </Tooltip>
               </TooltipProvider>
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button variant="outline" size="icon" onClick={() => onAddMeasurement(VARIABLE_CATEGORY_IDS.ACTIVITY_AND_BEHAVIOR)} aria-label="Add Activity/Behavior">
                       <Activity className="h-4 w-4" />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent><p>Add Activity/Behavior</p></TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </div>
           )}
        </div>
      </div>

      {/* Timeline Content - Use the shared component */}
      <div className="space-y-0">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((item) => (
            <MeasurementCard
              key={item.id}
              measurement={item}
              userTimezone={userTimezone}
              onUpdateMeasurement={handleDirectMeasurementUpdate}
              onNavigateToVariableSettings={(item) => handleNavigateToVariableSettings(item.userVariableId, item.globalVariableId)}
            />
          ))
        ) : null}
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <ReminderNotificationCard
              key={item.id}
              reminderNotification={item}
              userTimezone={userTimezone}
              onLogMeasurement={onLogNotificationMeasurement}
              onSkip={onSkipNotification}
              onUndoLog={onUndoNotificationLog}
              onEditReminder={onEditReminderSettings}
              onNavigateToVariableSettings={(userVarId, globalVarId) => handleNavigateToVariableSettings(userVarId, globalVarId)}
            />
          ))
        ) : null}
        {filteredMeasurements.length === 0 && filteredNotifications.length === 0 && renderEmptyState()}
      </div>
    </div>
  )
} 