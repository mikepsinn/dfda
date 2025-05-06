"use client"

import type React from "react"
// Correct imports for React hooks, Next router, date-fns, lucide-react, and UI components
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  Pill,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  Heart,
  Search,
  MoreHorizontal,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { formatInTimeZone } from 'date-fns-tz'
// import { FaceIcon } from "./face-icon" // Assume FaceIcon needs to be copied/created
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORIES_DATA, VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"

// Define the status of a measurement (aligns with reminder_notification_status)
export type MeasurementStatus = "pending" | "completed" | "skipped" | "error"

// Define the variable type categories based on imported constants
export type VariableCategoryKey = keyof typeof VARIABLE_CATEGORY_IDS;
export type VariableCategoryId = (typeof VARIABLE_CATEGORY_IDS)[VariableCategoryKey];
export type FilterableVariableCategoryId = VariableCategoryId | "all";

// Define the timeline item interface - aligned closer to DB structure
export interface TimelineItem {
  id: string // Typically reminder_notifications.id
  globalVariableId: string
  userVariableId?: string
  variableCategoryId: VariableCategoryId // Using the ID from DB/constants
  name: string // From global_variables.name
  triggerAtUtc: string; // Store the raw UTC ISO string
  value: number | null // From reminder_schedules.default_value (can be null)
  unit: string // From units.abbreviated_name
  unitName?: string // From units.name
  status: MeasurementStatus // From reminder_notifications.status
  notes?: string // Optional notes (maybe from reminder_notifications.log_details?)
  details?: string // Optional details (maybe from global_variables.description?)
  detailsUrl?: string // Optional URL
  isEditable?: boolean // Logic based on status
  reminderScheduleId?: string // From reminder_notifications.reminder_schedule_id
  // priority?: "low" | "medium" | "high"; // Removed as no direct DB field yet
}

export interface UniversalTimelineProps {
  title?: string
  items?: TimelineItem[]
  date?: Date
  userTimezone: string; // Add userTimezone prop
  // Keep callbacks, but implementation will use server actions based on DB types
  onAddMeasurement?: (variableCategoryId: FilterableVariableCategoryId) => void // Pass the category ID
  onEditMeasurement?: (item: TimelineItem, value: number, unit: string, notes?: string) => void
  onStatusChange?: (item: TimelineItem, status: MeasurementStatus) => void
  className?: string
  compact?: boolean
  showFilters?: boolean
  showDateNavigation?: boolean
  showAddButtons?: boolean
  defaultCategory?: FilterableVariableCategoryId // Default category ID or 'all'
  emptyState?: React.ReactNode
}

export function UniversalTimeline({
  items = [],
  date: initialDate,
  userTimezone, // Destructure userTimezone
  onAddMeasurement,
  onEditMeasurement,
  onStatusChange,
  className = "",
  compact = false,
  showFilters = true,
  showDateNavigation = true,
  showAddButtons = true,
  defaultCategory = "all",
  emptyState,
}: UniversalTimelineProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number | null>(null)
  const [editUnit, setEditUnit] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<FilterableVariableCategoryId>(defaultCategory)

  // Filter items based ONLY on category and search query (date filtering done on server)
  const filteredItems = useMemo(() => {
    // Ensure userTimezone is valid, default to UTC if not provided somehow
    // const tz = userTimezone || 'UTC'; // Keep tz if needed for sorting below
    return items
      .filter((item) => {
        try {
          // Remove date filtering logic
          /*
          const itemDateInUserTz = parseISO(item.triggerAtUtc); // Parse UTC string
          const matchesDate = isSameDay(itemDateInUserTz, selectedDate); // isSameDay handles TZ correctly?
          */

          // Filter by category ID
          const matchesCategory = selectedCategory === "all" || item.variableCategoryId === selectedCategory;

          // Filter by search query
          const matchesSearch =
            searchQuery === "" ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

          // Return based on category and search only
          return matchesCategory && matchesSearch; 
        } catch (e) {
          console.error("Error filtering timeline item:", { item, error: e });
          return false; // Exclude items that cause errors during filtering
        }
      })
      .sort((a, b) => {
        try {
          // Sort by time using the UTC timestamp
          const timeA = parseISO(a.triggerAtUtc).getTime();
          const timeB = parseISO(b.triggerAtUtc).getTime();
          return timeA - timeB;
        } catch (e) {
           console.error("Error sorting timeline items:", { a, b, error: e });
           return 0; // Maintain original order if parsing fails
        }
      });
      // Remove selectedDate from dependencies as it's no longer used for filtering
  }, [items, selectedCategory, searchQuery, userTimezone]);

  // Updated getTypeIcon to use variableCategoryId and constants
  const getTypeIcon = useCallback(
    (categoryId: VariableCategoryId) => {
      const iconSizeClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";
      // Use default icon colors (or theme-based if defined in CSS)
      switch (categoryId) {
        case VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS:
          return <Pill className={iconSizeClass} />;
        case VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY:
          return <Heart className={iconSizeClass} />;
        case VARIABLE_CATEGORY_IDS.ACTIVITY_AND_BEHAVIOR:
          return <Activity className={iconSizeClass} />;
        default:
          return <Clock className={iconSizeClass} />; // Generic fallback
      }
    },
    [compact],
  )

  const getStatusBadge = useCallback(
    (status: MeasurementStatus) => {
      // Use variants for theming
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      let text = status.charAt(0).toUpperCase() + status.slice(1);

      switch (status) {
        case "completed":
          variant = "default"; // Use theme's default success (often green)
          text = compact ? "✓" : "Completed";
          break;
        case "skipped":
          variant = "secondary"; // Use theme's secondary (often gray or yellow)
          text = compact ? "⨯" : "Skipped";
          break;
        case "pending":
          variant = "outline"; // Use outline style
          text = compact ? "⏱" : "Pending";
          break;
        case "error":
          variant = "destructive"; // Use theme's destructive (often red)
          text = compact ? "!" : "Error";
          break;
      }
      return <Badge variant={variant}>{text}</Badge>;
    },
    [compact],
  )

  // Helper function to render value display based on variable type
  const renderValueDisplay = useCallback(
    (item: TimelineItem) => {
      // TODO: Re-implement face icon logic if needed, possibly using specific unit IDs
      // if (["unit-id-for-severity", "unit-id-for-status"].includes(item.unitId) && item.value !== null && item.value >= 1 && item.value <= 5) {
      //   return <FaceIcon rating={item.value} className={`${compact ? "h-4 w-4" : "h-5 w-5"} mr-2`} />
      // }

      // For numeric display, format based on unit
      return (
        <span className="font-medium">
          {item.value ?? "-"} {item.unitName || item.unit} {/* Handle null value */}
        </span>
      )
    },
    [], // Removed compact dependency as it doesn't affect this logic now
  )

  // Previous/Next day functions
  const previousDay = () => {
    setSelectedDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() - 1)))
  }
  const nextDay = () => {
    setSelectedDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() + 1)))
  }
  const isToday = () => {
    // Compare using start of day to avoid time differences
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const selectedStart = new Date(selectedDate);
    selectedStart.setHours(0, 0, 0, 0);
    return selectedStart.getTime() === todayStart.getTime();
  }

  // Status change handlers
  const handleCompleted = (item: TimelineItem) => {
    onStatusChange?.(item, "completed")
  }
  const handleSkipped = (item: TimelineItem) => {
    onStatusChange?.(item, "skipped")
  }
  const handleReset = (item: TimelineItem) => {
    onStatusChange?.(item, "pending")
  }

  // Edit handlers
  const handleEdit = (item: TimelineItem) => {
    setEditingItem(item.id)
    setEditValue(item.value)
    setEditUnit(item.unit)
    setEditNotes(item.notes || "")
  }
  const handleSaveEdit = (item: TimelineItem) => {
    onEditMeasurement?.(item, editValue!, editUnit!, editNotes)
    setEditingItem(null)
  }
  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  // Detail navigation
  const handleNavigateToDetails = (url: string) => {
    // Implement the logic to navigate to the details URL
    console.warn('Navigate to details not implemented', { url })
  }

  // renderEmptyState remains the same
  const renderEmptyState = () => {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyState || `No items found for ${VARIABLE_CATEGORIES_DATA[selectedCategory]?.name || 'this category'} on ${format(selectedDate, "MMMM d, yyyy")}`}
      </p>
    )
  }

  // Render a timeline item
  const renderTimelineItem = (item: TimelineItem) => {
    const isEditing = editingItem === item.id;
    const handleNavigateToVariableSettings = () => {
      if (item.userVariableId) {
        router.push(`/patient/user-variables/${item.userVariableId}`);
      } else {
        // Optionally log or show a message if ID is missing
        console.warn('Cannot navigate to variable settings, userVariableId missing', { itemId: item.id });
      }
    };

    // Format the time in the user's specified timezone
    let displayTime = "--:--";
    try {
      // Ensure userTimezone is valid, fallback to UTC if needed
      const tz = userTimezone && userTimezone.length > 0 ? userTimezone : 'UTC';
      displayTime = formatInTimeZone(item.triggerAtUtc, tz, 'HH:mm');
    } catch (e) {
        console.error("Error formatting time for timeline item:", { item, userTimezone, error: e });
        // displayTime remains "--:--" on error
    }

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-start ml-2 transition-all border-b", // Add bottom border for separation
          compact ? "py-2" : "py-3",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full mr-3 z-10 border", // Use default border
            compact ? "w-8 h-8" : "w-10 h-10",
            "bg-background" // Use theme background
          )}
        >
          {getTypeIcon(item.variableCategoryId)}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            {/* Left side: Name, Time, Status Badge */}
            <div className="flex items-center">
              <div>
                <div
                  className={cn(
                    "font-medium",
                    compact ? "text-xs" : "text-sm",
                  )}
                >
                  {item.name}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {displayTime}
                </div>
              </div>
              <div className="ml-3">{getStatusBadge(item.status)}</div>
            </div>

            {/* Right side: Action Buttons / Menu */}
            {(item.isEditable ?? true) && (
              <div className="flex space-x-1">
                {compact ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)} disabled={!item.isEditable}>
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      {item.detailsUrl && (
                        <DropdownMenuItem onClick={() => handleNavigateToDetails(item.detailsUrl!)}>
                          <ExternalLink className="mr-2 h-3.5 w-3.5" /> View details
                        </DropdownMenuItem>
                      )}
                      {item.userVariableId && (
                        <DropdownMenuItem onClick={handleNavigateToVariableSettings}>
                          <Settings className="mr-2 h-3.5 w-3.5" /> Manage Variable
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)} disabled={!item.isEditable}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {item.userVariableId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={handleNavigateToVariableSettings}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Manage Variable</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Details, Value Display (below name/time) */}
          {!compact && (
            <div className="flex items-center mt-1">
              {item.details && (
                <div className="text-xs text-muted-foreground">{item.details}</div> // Use text-muted-foreground
              )}
              <div
                className={cn(
                  "text-xs",
                  item.details ? "ml-3" : "",
                )}
              >
                {renderValueDisplay(item)}
              </div>
            </div>
          )}

          {/* Notes rendering */}
          {!compact && item.notes && (
            <div className="text-xs mt-1 italic text-muted-foreground">{item.notes}</div> // Use text-muted-foreground
          )}

          {/* Value and unit editor (when isEditing) */}
          {isEditing ? (
            <div className="mt-3 space-y-3 p-3 rounded-md border border-dashed"> {/* Use default border */}
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editValue ?? ""}
                  onChange={(e) => setEditValue(Number.parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 text-sm"
                />
                <Select value={editUnit || ""} onValueChange={setEditUnit}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={item.unit}>{item.unitName || item.unit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  placeholder="Notes (optional)"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full h-8 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => handleSaveEdit(item)}
                  disabled={editValue === null || !editUnit}
                >
                  Save
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={compact ? "mt-1" : "mt-2"}>
              {item.status === "pending" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                    onClick={() => handleCompleted(item)}
                  >
                    <Check className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                    <span className={compact ? "text-xs" : "text-xs"}>Record</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                    onClick={() => handleSkipped(item)}
                  >
                    <X className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                    <span className={compact ? "text-xs" : "text-xs"}>Skip</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                  onClick={() => handleReset(item)}
                >
                  <RotateCcw className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                  <span className={compact ? "text-xs" : "text-xs"}>Reset</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Date Navigation Header */}
      {showDateNavigation && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <Button variant="outline" size="icon" onClick={previousDay} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-8", !isToday() && "text-accent-foreground")}>
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEE, MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(day) => {
                  if (day) setSelectedDate(day);
                  setShowCalendar(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={nextDay} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4"> {/* Use mb-4 */}
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm w-full pl-8" // Use theme input style
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FilterableVariableCategoryId)}>
              <SelectTrigger className="w-[180px] h-8 text-sm"> {/* Use theme select style */}
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.values(VARIABLE_CATEGORY_IDS).map(categoryId => (
                  <SelectItem key={categoryId} value={categoryId}>
                    {VARIABLE_CATEGORIES_DATA[categoryId]?.name || categoryId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {/* Timeline Items List */}
      <div className="flex flex-col gap-0"> {/* Remove gap-4 */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => renderTimelineItem(item))
        ) : (
          <div className="py-6 text-center"> {/* Add padding for empty state */}
            {renderEmptyState()}
          </div>
        )}
      </div>
    </div>
  )
} 