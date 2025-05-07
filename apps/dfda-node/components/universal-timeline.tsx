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
// REMOVE: import type { Database } from "@/lib/database.types"; // REMOVED
// REMOVE: import type { PendingNotificationTask } from "@/lib/actions/reminder-schedules"; // Import PendingNotificationTask

import { MeasurementCard, type MeasurementCardData } from "@/components/measurement-card";
import { ReminderNotificationCard } from "@/components/reminders/reminder-notification-card";
import type { ReminderNotificationDetails, VariableCategoryId as CustomVariableCategoryId } from "@/lib/database.types.custom";
import { logger } from "@/lib/logger";

// Use VariableCategoryId from database.types.custom
export type VariableCategoryId = CustomVariableCategoryId;
export type FilterableVariableCategoryId = VariableCategoryId | "all";

// Keep the TimelineItem interface for data fetching structure, ensure it aligns
// with MeasurementNotificationItemData
// TODO: This needs to be addressed. For now, we might comment it out or define a minimal version
// if components/shared/measurement-notification-item.tsx is deleted.
export type TimelineItem = any; // TEMPORARY: To allow compilation. Will be fixed.

export interface UniversalTimelineProps {
  title?: string;
  rawMeasurements?: MeasurementCardData[]; // Changed to expect MeasurementCardData[] directly
  rawNotifications?: ReminderNotificationDetails[]; // UPDATED to ReminderNotificationDetails[]
  date?: Date;
  userTimezone?: string;
  onAddMeasurement?: (variableCategoryId: FilterableVariableCategoryId) => void
  // Callback for when a measurement is updated via MeasurementCard
  onUpdateMeasurement?: (measurement: MeasurementCardData, newValue: number) => Promise<void>; 
  // Callbacks for reminder notifications, to be passed down to ReminderNotificationCard
  onLogNotificationMeasurement?: (data: ReminderNotificationDetails, value: number) => Promise<void>;
  onSkipNotification?: (data: ReminderNotificationDetails) => Promise<void>;
  onUndoNotificationLog?: (data: ReminderNotificationDetails) => Promise<void>;
  // For editing the reminder settings itself, not logging a value
  onEditReminderSettings?: (scheduleId: string) => void; 
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
  rawNotifications = [], // This is now ReminderNotificationDetails[]
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

  // Filter notifications - no mapping needed anymore
  const filteredNotificationsToDisplay = useMemo(() => {
    logger.info("[UniversalTimeline] Filtering rawNotifications (ReminderNotificationDetails) for display", {
      count: rawNotifications.length,
      sample: rawNotifications.slice(0, 3).map(n => ({
        notificationId: n.notificationId,
        dueAt: n.dueAt,
        status: n.status,
        variableName: n.variableName
      })),
      selectedDate: selectedDate.toISOString()
    });

    return rawNotifications // This is ReminderNotificationDetails[]
      .filter((item: ReminderNotificationDetails) => {
        try {
          if (!item || !item.dueAt) {
            logger.warn("[UniversalTimeline] Filtering out notification due to missing item or dueAt.", { item });
            return false;
          }
          if (isNaN(new Date(item.dueAt).getTime())) {
            logger.error(`[UniversalTimeline] Invalid dueAt for notification: ${item.notificationId || 'ID_UNKNOWN'}`, { dueAt: item.dueAt });
            return false;
          }
          const itemDate = new Date(item.dueAt);
          const isSameDay =
            itemDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            itemDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            itemDate.getUTCDate() === selectedDate.getUTCDate();
          
          if (!isSameDay) return false;

          // Basic check for essential fields (already covered by ReminderNotificationDetails type usually)
          if (!item.notificationId || !item.scheduleId || !item.variableName || !item.variableCategory || !item.unitId || !item.unitName || !item.userVariableId || !item.globalVariableId) {
            logger.error(`[UniversalTimeline] Filtering out notification ${item.notificationId} due to missing essential fields (should be caught by type).`, { item });
            return false;
          }
          
          return true;
        } catch (error) {
          logger.error("[UniversalTimeline] Error during notification pre-filtering phase:", {
            message: error instanceof Error ? error.message : String(error),
            itemId: item?.notificationId,
            itemData: item
          });
          return false;
        }
      });
      // .map() to ReminderNotificationCardData is REMOVED
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
        {filteredNotificationsToDisplay.length > 0 ? (
          filteredNotificationsToDisplay.map((notificationDetail) => { 
            let loggedDataForCard: { value: number; unitName: string } | undefined = undefined;
            if (notificationDetail.status === 'completed' && notificationDetail.value !== null && notificationDetail.value !== undefined) {
              loggedDataForCard = {
                value: notificationDetail.value,
                unitName: notificationDetail.unitName || ''
              };
            }

            return (
              <ReminderNotificationCard
                key={notificationDetail.notificationId} 
                reminderNotification={notificationDetail} 
                userTimezone={userTimezone}
                isProcessing={false} // Placeholder
                loggedData={loggedDataForCard} // Pass constructed loggedData
                onLogMeasurement={async (_dataFromCard, value) => { // _dataFromCard is ReminderNotificationDetails, already have notificationDetail
                  if (onLogNotificationMeasurement) { 
                    await onLogNotificationMeasurement(notificationDetail, value);
                  } else {
                    logger.warn("onLogNotificationMeasurement callback not provided", { notificationId: notificationDetail.notificationId });
                  }
                }}
                onSkip={async (_dataFromCard) => { // _dataFromCard is ReminderNotificationDetails
                  if (onSkipNotification) { 
                    await onSkipNotification(notificationDetail);
                  } else {
                    logger.warn("onSkipNotification callback not provided", { notificationId: notificationDetail.notificationId });
                  }
                }}
                onUndoLog={async (_dataFromCard) => { // _dataFromCard is ReminderNotificationDetails
                  if (onUndoNotificationLog) { 
                    await onUndoNotificationLog(notificationDetail);
                  } else {
                    logger.warn("onUndoNotificationLog callback not provided", { notificationId: notificationDetail.notificationId });
                  }
                }}
                // The card from components/reminders/ expects onEditReminderSettings directly
                onEditReminderSettings={onEditReminderSettings ? (scheduleId) => onEditReminderSettings(scheduleId) : undefined}
                onNavigateToVariableSettings={(userVarId, globalVarId) => {
                    if (onNavigateToVariableSettings) {
                        // Ensure we handle undefined correctly if the card passes it, though its signature expects string for defined values.
                        onNavigateToVariableSettings(userVarId, globalVarId);
                    }
                }} 
              />
            );
          })
        ) : null}
        {filteredMeasurements.length === 0 && filteredNotificationsToDisplay.length === 0 && renderEmptyState()}
      </div>
    </div>
  )
} 