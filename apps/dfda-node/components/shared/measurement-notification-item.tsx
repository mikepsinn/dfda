"use client"

import type React from "react"
import {
  Clock,
  Pill,
  Activity,
  Edit,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  Heart,
  MoreHorizontal,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import { useState } from "react"
import { UNIT_IDS } from "@/lib/constants/units"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

// Export MeasurementStatus from here now
export type MeasurementStatus = "pending" | "completed" | "skipped" | "error" | "recorded";
export type VariableCategoryId = string; // Simplified for now

export interface MeasurementNotificationItemData {
  id: string // Unique ID (e.g., reminder_notifications.id)
  globalVariableId: string
  userVariableId?: string
  variableCategoryId: VariableCategoryId
  name: string
  triggerAtUtc: string;
  value: number | null
  unit: string
  unitId: string;
  unitName?: string
  status: MeasurementStatus
  notes?: string
  details?: string
  detailsUrl?: string
  isEditable?: boolean
  // Fields potentially needed from TrackingInbox (PendingReminderNotification)
  default_value?: number | null; // Default measurement value (snake_case from DB)
  reminderScheduleId?: string; // Added field
  emoji?: string | null; // Add emoji field
}

export interface MeasurementNotificationItemProps {
  item: MeasurementNotificationItemData;
  userTimezone: string;
  isEditing?: boolean; // Is this specific item being edited?
  isLogged?: boolean; // Specific to TrackingInbox state?
  isPending?: boolean; // Specific to TrackingInbox transitions?
  editValue?: number | null;
  editUnit?: string | null;
  editNotes?: string;
  // REMOVED: sliderValue?: number;
  // REMOVED: inputValue?: string;

  // Callbacks
  onStatusChange?: (item: MeasurementNotificationItemData, status: MeasurementStatus, value?: number) => void;
  onEdit?: (item: MeasurementNotificationItemData) => void;
  onSaveEdit?: (item: MeasurementNotificationItemData) => void;
  onCancelEdit?: () => void;
  onNavigateToVariableSettings?: (item: MeasurementNotificationItemData) => void;
  onNavigateToDetails?: (url: string) => void; // Added based on universal-timeline
  // TrackingInbox specific callbacks
  // REMOVED: onSkip?: (item: MeasurementNotificationItemData) => void;
  onUndo?: (logId: string | undefined, item: MeasurementNotificationItemData) => void; // Pass logId back
  // REMOVED: onInputChange?: (itemId: string, value: string) => void;
  onLogMeasurement?: (item: MeasurementNotificationItemData, value: number) => void; // Specific to TrackingInbox?
  // REMOVED: onSliderChange?: (itemId: string, value: number) => void;
}

// TODO: Refactor renderValueDisplay if needed based on TrackingInbox data
const renderValueDisplay = (item: MeasurementNotificationItemData) => {
  // Don't show "- Unit Name" for pending scales, as the buttons make it obvious
  if (item.status === 'pending' && item.unitId === UNIT_IDS.ZERO_TO_TEN_SCALE) {
    return null; // Render nothing for pending scales
  }

  // For other pending items, show default value or dash, but not "- Unit Name"
  if (item.status === 'pending') {
    return (
      <span className="font-medium">
        {/* Return null instead of dash if no default value */}
        {(item.default_value !== null && item.default_value !== undefined) ? item.default_value : null}
        {/* Don't append unit for pending non-scale items */}
        {(item.default_value !== null && item.default_value !== undefined) ? ` ${item.unitName || item.unit}` : ''}
      </span>
    );
  }

  // For completed/skipped items, show value or default value with unit
  return (
    <span className="font-medium">
      {/* Show actual value if available (esp. for completed), else default, else '-' */}
      {(item.value !== null && item.value !== undefined) ? item.value :
       (item.default_value !== null && item.default_value !== undefined) ? item.default_value : '-'}
      {/* Append unit */}
      {` ${item.unitName || item.unit}`}
    </span>
  )
}

const getTypeIcon = (categoryId: VariableCategoryId, emoji?: string | null) => {
  // If emoji exists, render it directly
  if (emoji) {
      return <span className="text-lg">{emoji}</span>;
  }

  // Fallback to category-based icons
  const iconSizeClass = "h-4 w-4";
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
}

export function MeasurementNotificationItem({
  item,
  userTimezone,
  isEditing = false,
  isLogged = false, // Default state from TrackingInbox?
  isPending = false, // Default state from TrackingInbox?
  editValue,
  editUnit,
  editNotes,
  // REMOVED: sliderValue?: number;
  // REMOVED: inputValue?: string;

  // Callbacks
  onStatusChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onNavigateToVariableSettings,
  onNavigateToDetails,
  // REMOVED: onSkip?: (item: MeasurementNotificationItemData) => void;
  onUndo, // TODO: Implement undo logic
  // REMOVED: onInputChange?: (itemId: string, value: string) => void;
  onLogMeasurement, // TODO: Implement Log Measurement (different from Edit/Save?)
  // REMOVED: onSliderChange?: (itemId: string, value: number) => void;
}: MeasurementNotificationItemProps) {

  // Format the time in the user's specified timezone
  let displayTime = "--:--";
  try {
    const tz = userTimezone && userTimezone.length > 0 ? userTimezone : 'UTC';
    displayTime = formatInTimeZone(item.triggerAtUtc, tz, 'h:mm a');
  } catch (e) {
    console.error("Error formatting time for timeline item:", { item, userTimezone, error: e });
  }

  const handleEditClick = () => onEdit?.(item);
  const handleSaveEditClick = () => onSaveEdit?.(item);
  const handleCancelEditClick = () => onCancelEdit?.();
  const handleSettingsClick = () => onNavigateToVariableSettings?.(item);
  const handleDetailsClick = () => item.detailsUrl && onNavigateToDetails?.(item.detailsUrl);
  const handleUndoClick = () => {
    // Parent (TrackingInbox) needs to provide the correct logId
    console.warn("Undo click needs parent to provide logId mapping");
    // Example of how parent might call it: onUndo(logId, item);
  }

  // Combine status change logic
  const handleStatusChangeClick = (status: MeasurementStatus, value?: number) => {
      // REMOVED: Prioritization of onSkip logic
      if (onStatusChange) {
        onStatusChange(item, status, value);
      } else {
        console.warn("No handler provided for status change:", { status });
      }
  };

  // State for the numeric input field within this component
  const [localInputValue, setLocalInputValue] = useState<string>("");

  return (
      // Root container is now Card
      <Card>
        {/* --- Top Row wrapped in CardHeader --- */}
        <CardHeader className="flex flex-row items-start p-4">
          <div
            className={cn(
              // Removed border class
              "relative flex items-center justify-center rounded-full mr-3 z-10", 
              "w-10 h-10",
              "bg-background"
            )}
          >
            {getTypeIcon(item.variableCategoryId, item.emoji)}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              {/* Left side: Name, Time */}
              <div className="flex items-center">
                <div>
                  <div
                    className={
                      "font-medium text-sm"
                    }
                  >
                    {item.name}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {displayTime}
                  </div>
                </div>
              </div>

              {/* Right side: Action Buttons / Menu */}
               {/* Show dropdown menu if editable */}
              {(item.isEditable ?? true) && (
                <div className="flex space-x-1">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Edit Item - Conditionally shown/disabled */}                       
                        <DropdownMenuItem 
                          onClick={handleEditClick} 
                          disabled={!item.isEditable || isEditing}
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        {/* Details Item - Conditionally shown */}  
                        {item.detailsUrl && (
                          <DropdownMenuItem onClick={handleDetailsClick}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> View details
                          </DropdownMenuItem>
                        )}
                        {/* Manage Variable Item - Conditionally shown */}  
                        {item.userVariableId && (
                          <DropdownMenuItem onClick={handleSettingsClick}>
                            <Settings className="mr-2 h-3.5 w-3.5" /> Manage Variable
                          </DropdownMenuItem>
                        )}
                        {/* Skip Item - Conditionally shown for pending */}  
                        {item.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleStatusChangeClick('skipped')} disabled={isPending}>
                             <X className="mr-2 h-3.5 w-3.5" /> Skip
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              )}
               {/* Add Undo Button for TrackingInbox context when isLogged */}
                {isLogged && onUndo && item.status !== 'pending' && (
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           {/* Parent (TrackingInbox) needs to pass a callback that includes the logId */}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUndo(undefined, item)} disabled={isPending}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
            </div>
          </div>
        </CardHeader>

        {/* --- Bottom Content Section wrapped in CardContent --- */}
        <CardContent className="p-4 pt-0">
          {/* Details, Value Display (below name/time) */}
          <div className="mt-1 text-xs">
              {renderValueDisplay(item)}
          </div>

          {/* Notes rendering */}
          {item.notes && (
            <div className="text-xs mt-1 italic text-muted-foreground">{item.notes}</div>
          )}

          {/* Value and unit editor (when isEditing) */}
          {isEditing ? (
            <div className="mt-3 space-y-3 p-3 rounded-md border border-dashed">
              <div className="flex items-center space-x-2">
                {/* TODO: Need to decide if edit uses Input or Slider based on unit */}
                <Input
                  type="number"
                  // Use editValue from props, handle undefined/null
                  value={editValue ?? ""}
                  // onChange should likely be handled by parent via a prop
                  onChange={(e) => console.warn("Inline onChange not implemented for edit input")}
                  className="w-20 h-8 text-sm"
                />
                <Select
                  // Use editUnit from props
                  value={editUnit || ""}
                  // onChange should likely be handled by parent via a prop
                  onValueChange={(val) => console.warn("Inline onValueChange not implemented for edit select", val)}
                 >
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Populate units correctly */}
                    <SelectItem value={item.unit}>{item.unitName || item.unit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  placeholder="Notes (optional)"
                  // Use editNotes from props
                  value={editNotes || ""}
                  // onChange should likely be handled by parent via a prop
                  onChange={(e) => console.warn("Inline onChange not implemented for edit notes", e.target.value)}
                  className="w-full h-8 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleSaveEditClick}
                  // Disable based on props?
                  disabled={editValue === null || !editUnit || isPending}
                >
                  Save
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={handleCancelEditClick} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Action Buttons (Record/Skip/Log Rating/Reset) when NOT editing
            <div className="mt-2">
              {item.status === "pending" && !isLogged ? ( // Show actions only if pending and not logged (for TrackingInbox)
                <>
                  {/* === CORRECTED Logic for Scale vs Input vs Button === */}
                  {
                    /* Priority 1: Number Buttons for 0-10 Scale */
                    (item.unitId === UNIT_IDS.ZERO_TO_TEN_SCALE) && onStatusChange ? (
                      <div className="flex flex-col gap-2 pt-1">
                        {/* Container for number buttons 0-10 */}
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: 11 }, (_, i) => i).map((rating) => (
                            <Button
                              key={rating}
                              variant="outline"
                              size="sm"
                              className={cn(
                                  "h-7 w-7 p-0 text-xs font-medium"
                              )}
                              onClick={() => handleStatusChangeClick('completed', rating)}
                              disabled={isPending}
                              aria-label={`Rate ${rating}`}
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                    /* Priority 2: Input field for numeric/text input (if default_value is null and not Boolean/Scale) */
                    : (item.default_value === null && item.unitId !== UNIT_IDS.BOOLEAN_1_YES_TRUE_0_NO_FALSE_ && item.unitId !== UNIT_IDS.ZERO_TO_TEN_SCALE) ? (
                      <div className="flex gap-2 items-center pt-1">
                          <Input
                               type="number" // Assuming number for now, might need text later
                               placeholder={`${item.unitName || item.unit}`} // Placeholder uses unit
                               value={localInputValue} // Use local state
                               onChange={(e) => setLocalInputValue(e.target.value)} // Update local state
                               className={cn("h-7 text-xs flex-grow max-w-[150px]")}
                               disabled={isPending}
                          />
                         {/* Display Unit next to input */}
                         <span className={
                           "text-xs text-muted-foreground self-center ml-2" // Use non-compact spacing
                           }>
                           {item.unitName || item.unit}
                         </span>
                         <Button
                             variant="outline"
                             size="sm"
                             className="h-7" // Use non-compact size
                             onClick={() => {
                                 const numericValue = parseFloat(localInputValue || '');
                                 if (!isNaN(numericValue)) {
                                     // Use onStatusChange for UniversalTimeline context,
                                     // or onLogMeasurement if provided (for TrackingInbox)
                                     if (onLogMeasurement) {
                                         onLogMeasurement(item, numericValue);
                                     } else if (onStatusChange) {
                                         onStatusChange(item, 'completed', numericValue);
                                     } else {
                                          console.warn("No log/status handler for numeric input", item.id);
                                     }
                                     setLocalInputValue(""); // Clear input after log
                                 }
                             }}
                             disabled={!localInputValue || isNaN(parseFloat(localInputValue || '')) || isPending}
                         >
                             Log
                         </Button>
                       </div>
                    )
                    /* Priority 3: Default Confirm/Complete/Skip buttons (if default_value exists or is Boolean) */
                    : (item.default_value !== null || item.unitId === UNIT_IDS.BOOLEAN_1_YES_TRUE_0_NO_FALSE_) && onStatusChange ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7" // Use non-compact size
                          onClick={() => handleStatusChangeClick('completed')} // Value not needed or handled by slider
                          disabled={isPending}
                        >
                          <Check className="h-3 w-3 mr-0.5" />
                          <span className="text-xs">Confirm</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7" // Use non-compact size
                          onClick={() => handleStatusChangeClick('skipped')} // Skip is common
                          disabled={isPending}
                        >
                          <X className="h-3 w-3 mr-0.5" />
                          <span className="text-xs">Skip</span>
                        </Button>
                      </div>
                    )
                    /* Final fallback */
                    : null
                  }
                  {/* === END CORRECTED Logic === */}
                </>
              ) : item.status !== 'pending' && !isLogged ? ( // Show Reset button if not pending and not logged
                 <Button
                  variant="outline"
                  size="sm"
                  className="h-7" // Use non-compact size
                  onClick={() => handleStatusChangeClick('pending')}
                  disabled={isPending}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  <span className="text-xs">Reset</span>
                </Button>
              ) : null /* Don't show action buttons if logged in TrackingInbox or if no status matches */}
            </div>
          )}
        </CardContent>
      </Card>
    )
} 