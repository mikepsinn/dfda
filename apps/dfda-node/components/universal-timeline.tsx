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

// Import the shared component and its types
import type { MeasurementNotificationItemData, VariableCategoryId as SharedVariableCategoryId, MeasurementStatus as SharedMeasurementStatus } from "@/components/shared/measurement-notification-item";

import { MeasurementCard, type MeasurementCardData } from "@/components/measurement-card";
import { ReminderNotificationCard, type ReminderNotificationCardData } from "@/components/reminders/reminder-notification-card";
import { logger } from "@/lib/logger"; // Import logger

export type MeasurementStatus = SharedMeasurementStatus;
export type FilterableVariableCategoryId = SharedVariableCategoryId | "all";

// Keep the TimelineItem interface for data fetching structure, ensure it aligns
// with MeasurementNotificationItemData
export type TimelineItem = MeasurementNotificationItemData;

export interface UniversalTimelineProps {
  title?: string;
  measurements?: MeasurementNotificationItemData[];
  notifications?: MeasurementNotificationItemData[];
  date?: Date;
  userTimezone?: string;
  onAddMeasurement?: (variableCategoryId: FilterableVariableCategoryId) => void
  onEditMeasurement?: (item: TimelineItem, value: number, unit: string, notes?: string) => void
  className?: string
  showFilters?: boolean
  showDateNavigation?: boolean
  showAddButtons?: boolean
  defaultCategory?: FilterableVariableCategoryId
  emptyState?: React.ReactNode
}

export function UniversalTimeline({
  measurements: rawMeasurements = [],
  notifications: rawNotifications = [],
  date: initialDate = new Date(),
  userTimezone = 'UTC',
  onAddMeasurement,
  onEditMeasurement,
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
  const [editingItem, setEditingItem] = useState<string | null>(null) // ID of item being edited
  const [editValue, setEditValue] = useState<number | null>(null)
  const [editUnit, setEditUnit] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<FilterableVariableCategoryId>(defaultCategory)

  // Filter measurements and map to MeasurementCardData
  const filteredMeasurements = useMemo(() => {
    return rawMeasurements
      .filter((item) => {
        try {
          const itemDate = new Date(item.triggerAtUtc);
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
          logger.error("Error filtering measurement item in UniversalTimeline:", { itemId: item.id, error });
          return false;
        }
      })
      .map(item => ({ // Map to MeasurementCardData
        id: item.id,
        globalVariableId: item.globalVariableId,
        userVariableId: item.userVariableId,
        variableCategoryId: item.variableCategoryId,
        name: item.name,
        start_at: item.triggerAtUtc, // Map triggerAtUtc to start_at
        end_at: undefined, // Or map if available from MeasurementNotificationItemData if it ever gets end_at
        value: item.value,
        unit: item.unit,
        unitId: item.unitId,
        unitName: item.unitName,
        notes: item.notes,
        isEditable: item.isEditable,
        emoji: item.emoji,
        // Retain original status for potential use in handleMeasurementSaveEdit or internal logic
        originalStatus: item.status 
      }));
  }, [rawMeasurements, selectedCategory, searchQuery, selectedDate]);

  // Filter notifications and map to ReminderNotificationCardData
  const filteredNotifications = useMemo(() => {
    return rawNotifications
      .filter((item) => {
        try {
          const itemDate = new Date(item.triggerAtUtc);
          const isSameDay =
            itemDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            itemDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            itemDate.getUTCDate() === selectedDate.getUTCDate();
          const validStatuses = ["pending", "completed", "skipped", "error"];
          return isSameDay && typeof item.reminderScheduleId === 'string' && validStatuses.includes(item.status);
        } catch (error) {
          logger.error("Error filtering notification item in UniversalTimeline:", { itemId: item.id, error });
          return false;
        }
      })
      .map((item): ReminderNotificationCardData => ({
        id: item.id,
        reminderScheduleId: item.reminderScheduleId!, 
        triggerAtUtc: item.triggerAtUtc,
        status: item.status as "pending" | "completed" | "skipped" | "error",
        variableName: item.name ?? undefined, // Handle potential null from item.name
        variableCategoryId: item.variableCategoryId, 
        unitId: item.unitId, 
        unitName: (item.unitName || item.unit) ?? undefined, // Handle potential null
        details: item.details ?? undefined, // Handle potential null
        detailsUrl: item.detailsUrl ?? undefined, // Handle potential null
        isEditable: item.isEditable,
        defaultValue: item.default_value,
        emoji: item.emoji ?? undefined, // Handle potential null
        currentValue: item.value, 
      }));
  }, [rawNotifications, selectedDate]);

  // --- Handlers for ReminderNotificationCard (NOPs for UniversalTimeline context) ---
  const handleReminderSkip = useCallback((data: ReminderNotificationCardData) => {
    logger.warn("UniversalTimeline: Skip action triggered but not handled.", { data });
    // In a real scenario, this might involve calling a prop or a server action.
  }, []);

  const handleReminderLogMeasurement = useCallback((data: ReminderNotificationCardData, value: number) => {
    logger.warn("UniversalTimeline: Log measurement action triggered but not handled.", { data, value });
  }, []);

  const handleReminderUndo = useCallback((id: string) => {
    logger.warn("UniversalTimeline: Undo action triggered but not handled.", { id });
  }, []);

  const handleReminderInputChange = useCallback((id: string, value: string) => {
    logger.warn("UniversalTimeline: Input change action triggered but not handled.", { id, value });
  }, []);

  // --- Handlers to pass down to the shared component ---

  // Edit handlers for MeasurementCardData
  const handleMeasurementEdit = useCallback((item: MeasurementCardData) => {
    setEditingItem(item.id);
    setEditValue(item.value);
    setEditUnit(item.unit);
    setEditNotes(item.notes || "");
  }, []);

  const handleMeasurementSaveEdit = useCallback((item: MeasurementCardData) => {
    const originalItemData = rawMeasurements.find(rm => rm.id === item.id);
    const originalStatus = originalItemData?.status || "recorded"; // Fallback if not found, though it should be

    const timelineItemToSave: TimelineItem = {
        // Map MeasurementCardData fields back to TimelineItem (MeasurementNotificationItemData)
        id: item.id,
        globalVariableId: item.globalVariableId,
        userVariableId: item.userVariableId,
        variableCategoryId: item.variableCategoryId,
        name: item.name,
        triggerAtUtc: item.start_at, // Map start_at back to triggerAtUtc
        value: editValue, // Use the stateful editValue for saving
        unit: editUnit || item.unit, // Use stateful editUnit or fallback
        unitId: item.unitId, // unitId should remain consistent or be part of editUnit logic
        unitName: item.unitName,
        status: originalStatus, // Use the original status or a sensible default
        notes: editNotes || item.notes, // Use stateful editNotes or fallback
        details: undefined, // Populate if applicable and part of edit
        detailsUrl: undefined, // Populate if applicable and part of edit
        isEditable: item.isEditable,
        default_value: undefined, // Populate if applicable (likely not for a direct measurement update)
        reminderScheduleId: undefined, // Populate if applicable (likely not for a direct measurement update)
        emoji: item.emoji,
    };
    onEditMeasurement?.(timelineItemToSave, editValue!, editUnit!, editNotes);
    setEditingItem(null);
    setEditValue(null);
    setEditUnit(null);
    setEditNotes("");
  }, [rawMeasurements, onEditMeasurement, editValue, editUnit, editNotes]);

  const handleMeasurementNavigateToVariableSettings = useCallback((item: MeasurementCardData) => {
    if (item.userVariableId) {
      router.push(`/patient/user-variables/${item.userVariableId}`);
    } else {
      console.warn('Cannot navigate to variable settings, userVariableId missing', { itemId: item.id });
    }
  }, [router]);

  // Edit handlers for ReminderNotificationCardData (if different logic is needed)
  // For now, we can reuse generic handlers if the structure is compatible or adapt them.
  // const handleNotificationEdit = useCallback((item: ReminderNotificationCardData) => { ... });

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null)
    // Clear edit state on cancel
    setEditValue(null);
    setEditUnit(null);
    setEditNotes("");
  }, []);

  // Detail navigation
  // const handleNavigateToDetails = useCallback((url: string) => {
  //   // Implement the logic to navigate to the details URL
  //   // Maybe open in new tab?
  //   window.open(url, '_blank', 'noopener,noreferrer');
  //   // console.warn('Navigate to details not implemented', { url })
  // }, []);

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
              isEditing={editingItem === item.id}
              editValue={editingItem === item.id ? editValue : undefined}
              editUnit={editingItem === item.id ? editUnit : undefined}
              editNotes={editingItem === item.id ? editNotes : undefined}
              onEdit={handleMeasurementEdit}
              onSaveEdit={handleMeasurementSaveEdit}
              onCancelEdit={handleCancelEdit}
              onNavigateToVariableSettings={handleMeasurementNavigateToVariableSettings}
              onUpdateMeasurement={undefined}
            />
          ))
        ) : null}
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <ReminderNotificationCard
              key={item.id}
              reminderNotification={item}
              userTimezone={userTimezone}
              onSkip={handleReminderSkip}
              onLogMeasurement={handleReminderLogMeasurement}
              onUndo={handleReminderUndo}
              onInputChange={handleReminderInputChange}
              showToasts={true}
            />
          ))
        ) : null}
        {filteredMeasurements.length === 0 && filteredNotifications.length === 0 && renderEmptyState()}
      </div>
    </div>
  )
} 