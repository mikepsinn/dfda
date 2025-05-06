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
import {
  MeasurementNotificationItem,
  type MeasurementNotificationItemData,
  type VariableCategoryId as SharedVariableCategoryId,
  type MeasurementStatus as SharedMeasurementStatus
} from "@/components/shared/measurement-notification-item";

export type MeasurementStatus = SharedMeasurementStatus;
export type FilterableVariableCategoryId = SharedVariableCategoryId | "all";

// Keep the TimelineItem interface for data fetching structure, ensure it aligns
// with MeasurementNotificationItemData
export type TimelineItem = MeasurementNotificationItemData;

export interface UniversalTimelineProps {
  title?: string;
  /** Pre-merged list (takes precedence) */
  items?: TimelineItem[];
  /** Measurement items (optional) */
  measurements?: TimelineItem[];
  /** Notification items (optional) */
  notifications?: TimelineItem[];
  /** Date to display (default: today) */
  date?: Date;
  /** User timezone (default: UTC) */
  userTimezone?: string;
  onAddMeasurement?: (variableCategoryId: FilterableVariableCategoryId) => void
  onEditMeasurement?: (item: TimelineItem, value: number, unit: string, notes?: string) => void
  onStatusChange?: (item: TimelineItem, status: MeasurementStatus, value?: number) => void
  className?: string
  showFilters?: boolean
  showDateNavigation?: boolean
  showAddButtons?: boolean
  defaultCategory?: FilterableVariableCategoryId
  emptyState?: React.ReactNode
}

export function UniversalTimeline({
  items = [],
  measurements = [],
  notifications = [],
  date: initialDate = new Date(),
  userTimezone = 'UTC',
  onAddMeasurement,
  onEditMeasurement,
  onStatusChange,
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

  // Merge measurements and notifications into a single sorted list
  const mergedItems = useMemo(() => {
    // Use single items array if provided, else merge measurements + notifications
    const list = items.length ? items : [...measurements, ...notifications];
    return list.sort(
      (a, b) => new Date(a.triggerAtUtc).getTime() - new Date(b.triggerAtUtc).getTime()
    );
  }, [items, measurements, notifications]);

  // Filter items - Logic remains the same
  const filteredItems = useMemo(() => {
    return mergedItems
      .filter((item) => {
        try {
          // Date filter: only include items whose triggerAtUtc is on the selectedDate
          const itemDate = new Date(item.triggerAtUtc);
          const isSameDay =
            itemDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            itemDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            itemDate.getUTCDate() === selectedDate.getUTCDate();

          const matchesCategory = selectedCategory === "all" || item.variableCategoryId === selectedCategory;
          const matchesSearch =
            searchQuery === "" ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
          return isSameDay && matchesCategory && matchesSearch;
        } catch (e) {
          console.error("Error filtering timeline item:", { item, error: e });
          return false;
        }
      })
  }, [mergedItems, selectedCategory, searchQuery, selectedDate]);

  // --- Handlers to pass down to the shared component ---

  // Status change handler (called by shared component)
  const handleItemStatusChange = useCallback((item: TimelineItem, status: MeasurementStatus, value?: number) => {
    onStatusChange?.(item, status, value);
  }, [onStatusChange]);

  // Edit handlers
  const handleEdit = useCallback((item: TimelineItem) => {
    setEditingItem(item.id)
    setEditValue(item.value)
    setEditUnit(item.unit)
    setEditNotes(item.notes || "")
  }, []);

  const handleSaveEdit = useCallback((item: TimelineItem) => {
    // The item passed back might not have latest editValue/Unit/Notes, use state
    onEditMeasurement?.(item, editValue!, editUnit!, editNotes)
    setEditingItem(null)
    // Clear edit state after save
    setEditValue(null);
    setEditUnit(null);
    setEditNotes("");
  }, [onEditMeasurement, editValue, editUnit, editNotes]);

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null)
    // Clear edit state on cancel
    setEditValue(null);
    setEditUnit(null);
    setEditNotes("");
  }, []);

  // Detail navigation
  const handleNavigateToDetails = useCallback((url: string) => {
    // Implement the logic to navigate to the details URL
    // Maybe open in new tab?
    window.open(url, '_blank', 'noopener,noreferrer');
    // console.warn('Navigate to details not implemented', { url })
  }, []);

  // Settings navigation
  const handleNavigateToVariableSettings = useCallback((item: TimelineItem) => {
    if (item.userVariableId) {
      router.push(`/patient/user-variables/${item.userVariableId}`);
    } else {
      console.warn('Cannot navigate to variable settings, userVariableId missing', { itemId: item.id });
    }
  }, [router]);

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
      <div className="space-y-0"> {/* Remove space-y-4 as item has border-b */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <MeasurementNotificationItem
              key={item.id}
              item={item}
              userTimezone={userTimezone}

              isEditing={editingItem === item.id}
              // Show populated inputs for logged measurements
              isLogged={item.value != null}
              // Disable inputs while pending
              isPending={item.status === 'pending'}
              editValue={editingItem === item.id ? editValue : undefined}
              editUnit={editingItem === item.id ? editUnit : undefined}
              editNotes={editingItem === item.id ? editNotes : undefined}
              
              // Callbacks
              onStatusChange={handleItemStatusChange}
              onEdit={handleEdit}
              onSaveEdit={handleSaveEdit} // Pass the stateful save handler
              onCancelEdit={handleCancelEdit}
              onNavigateToVariableSettings={handleNavigateToVariableSettings}
              onNavigateToDetails={handleNavigateToDetails}

              // Props not used by UniversalTimeline context (will use defaults or be ignored)
              // isLogged={undefined}
              // isPending={undefined}
              // inputValue={undefined}
              // onSkip={undefined}
              // onUndo={undefined}
              // onInputChange={undefined}
              // onLogMeasurement={undefined}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  )
} 