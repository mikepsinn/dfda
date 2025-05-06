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
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'

// Types from universal-timeline - TODO: Maybe consolidate later
export type MeasurementStatus = "pending" | "completed" | "skipped" | "error"
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
  unitName?: string
  status: MeasurementStatus
  notes?: string
  details?: string
  detailsUrl?: string
  isEditable?: boolean
  // Fields potentially needed from TrackingInbox (PendingReminderNotification)
  instruction?: string; // e.g., "Take 1 capsule"
  defaultValue?: number; // Default measurement value
}

export interface MeasurementNotificationItemProps {
  item: MeasurementNotificationItemData;
  userTimezone: string;
  compact?: boolean;
  isEditing?: boolean; // Is this specific item being edited?
  isLogged?: boolean; // Specific to TrackingInbox state?
  isPending?: boolean; // Specific to TrackingInbox transitions?
  editValue?: number | null;
  editUnit?: string | null;
  editNotes?: string;
  sliderValue?: number; // Current value from slider
  inputValue?: string; // Current value from input (TrackingInbox)

  // Callbacks
  onStatusChange?: (item: MeasurementNotificationItemData, status: MeasurementStatus, value?: number) => void;
  onEdit?: (item: MeasurementNotificationItemData) => void;
  onSaveEdit?: (item: MeasurementNotificationItemData) => void;
  onCancelEdit?: () => void;
  onNavigateToVariableSettings?: (item: MeasurementNotificationItemData) => void;
  onNavigateToDetails?: (url: string) => void; // Added based on universal-timeline
  // TrackingInbox specific callbacks
  onSkip?: (item: MeasurementNotificationItemData) => void; // Potentially merge with onStatusChange?
  onUndo?: (item: MeasurementNotificationItemData) => void; // Needs more details (logId?)
  onInputChange?: (itemId: string, value: string) => void; // Input specific to TrackingInbox?
  onLogMeasurement?: (item: MeasurementNotificationItemData, value: number) => void; // Specific to TrackingInbox?
  // Slider specific callbacks
  onSliderChange?: (itemId: string, value: number) => void;
}

// TODO: Refactor renderValueDisplay if needed based on TrackingInbox data
const renderValueDisplay = (item: MeasurementNotificationItemData) => {
  return (
    <span className="font-medium">
      {item.value ?? "-"} {item.unitName || item.unit} {/* Handle null value */}
    </span>
  )
}

const getTypeIcon = (categoryId: VariableCategoryId, compact?: boolean) => {
  const iconSizeClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";
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

const getStatusBadge = (status: MeasurementStatus, compact?: boolean) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let text = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case "completed":
      variant = "default";
      text = compact ? "✓" : "Completed";
      break;
    case "skipped":
      variant = "secondary";
      text = compact ? "⨯" : "Skipped";
      break;
    case "pending":
      variant = "outline";
      text = compact ? "⏱" : "Pending";
      break;
    case "error":
      variant = "destructive";
      text = compact ? "!" : "Error";
      break;
  }
  return <Badge variant={variant}>{text}</Badge>;
}


export function MeasurementNotificationItem({
  item,
  userTimezone,
  compact = false,
  isEditing = false,
  isLogged = false, // Default state from TrackingInbox?
  isPending = false, // Default state from TrackingInbox?
  editValue,
  editUnit,
  editNotes,
  sliderValue,
  // inputValue, // TODO: Integrate input value logic if different from editValue

  // Callbacks
  onStatusChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onNavigateToVariableSettings,
  onNavigateToDetails,
  onSkip, // TODO: Decide how to handle skip (specific callback or via onStatusChange)
  onUndo, // TODO: Implement undo logic
  // onInputChange, // TODO: Integrate if needed
  onLogMeasurement, // TODO: Implement Log Measurement (different from Edit/Save?)
  onSliderChange,
}: MeasurementNotificationItemProps) {

  // Format the time in the user's specified timezone
  let displayTime = "--:--";
  try {
    const tz = userTimezone && userTimezone.length > 0 ? userTimezone : 'UTC';
    displayTime = formatInTimeZone(item.triggerAtUtc, tz, 'HH:mm');
  } catch (e) {
    console.error("Error formatting time for timeline item:", { item, userTimezone, error: e });
  }

  const handleEditClick = () => onEdit?.(item);
  const handleSaveEditClick = () => onSaveEdit?.(item);
  const handleCancelEditClick = () => onCancelEdit?.();
  const handleSettingsClick = () => onNavigateToVariableSettings?.(item);
  const handleDetailsClick = () => item.detailsUrl && onNavigateToDetails?.(item.detailsUrl);

  // Combine status change logic
  const handleStatusChangeClick = (status: MeasurementStatus, value?: number) => {
      if (status === 'skipped' && onSkip) {
        onSkip(item); // Prioritize specific skip handler if provided
      } else if (onStatusChange) {
        onStatusChange(item, status, value);
      } else {
        console.warn("No handler provided for status change:", { status });
      }
  };

  // Use appropriate slider value from props
  const currentSliderValue = sliderValue ?? item.defaultValue ?? 5; // Default to default value or 5

  return (
      <div
        className={cn(
          "flex items-start ml-2 transition-all border-b",
          compact ? "py-2" : "py-3",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full mr-3 z-10 border",
            compact ? "w-8 h-8" : "w-10 h-10",
            "bg-background"
          )}
        >
          {getTypeIcon(item.variableCategoryId, compact)}
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
                 {/* Display instruction if available and not compact */}
                {!compact && item.instruction && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {item.instruction}
                    </div>
                )}
              </div>
              <div className="ml-3">{getStatusBadge(item.status, compact)}</div>
            </div>

            {/* Right side: Action Buttons / Menu */}
             {/* Don't show actions if logged in TrackingInbox context? Needs refinement */}
            {!(isLogged && !isEditing) && (item.isEditable ?? true) && (
              <div className="flex space-x-1">
                {compact ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditClick} disabled={!item.isEditable || isEditing}>
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      {item.detailsUrl && (
                        <DropdownMenuItem onClick={handleDetailsClick}>
                          <ExternalLink className="mr-2 h-3.5 w-3.5" /> View details
                        </DropdownMenuItem>
                      )}
                      {item.userVariableId && (
                        <DropdownMenuItem onClick={handleSettingsClick}>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditClick} disabled={!item.isEditable || isEditing}>
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
                              onClick={handleSettingsClick}
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
             {/* TODO: Add Undo Button for TrackingInbox context when isLogged */}
              {isLogged && onUndo && (
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUndo(item)} disabled={isPending}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Undo</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              )}
          </div>

          {/* Details, Value Display (below name/time) */}
          {!compact && (
            <div className="flex items-center mt-1">
              {item.details && (
                <div className="text-xs text-muted-foreground">{item.details}</div>
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
            <div className={compact ? "mt-1" : "mt-2"}>
              {item.status === "pending" && !isLogged ? ( // Show actions only if pending and not logged (for TrackingInbox)
                <>
                  {/* === Logic for Scale vs Button based on unit === */}
                  {item.unitName === '0-10 Scale' && onSliderChange ? (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-3">
                         <Slider
                            min={0}
                            max={10}
                            step={1}
                            value={[currentSliderValue]}
                            onValueChange={([val]) => onSliderChange(item.id, val)}
                            className="flex-grow"
                            aria-label={`Rating for ${item.name}`}
                            disabled={isPending}
                         />
                         <span className="text-sm font-medium w-8 text-right">{currentSliderValue}</span>
                      </div>
                      <div className="flex gap-2">
                         <Button
                            variant="outline"
                            size="sm"
                            className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                            onClick={() => handleStatusChangeClick('completed', currentSliderValue)}
                            disabled={isPending}
                         >
                            <Check className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                            <span className={compact ? "text-xs" : "text-xs"}>Log Rating</span>
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                           onClick={() => handleStatusChangeClick('skipped')}
                           disabled={isPending}
                         >
                           <X className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                           <span className={compact ? "text-xs" : "text-xs"}>Skip</span>
                         </Button>
                      </div>
                    </div>
                   ) : item.unitName !== 'Boolean' && onLogMeasurement /* TODO: Refine boolean/measurement distinction */? (
                      // Input field for direct measurement logging (TrackingInbox style)
                     <div className="flex gap-2 items-center">
                         {/* TODO: Input for TrackingInbox measurement */}
                         <Input
                              type="number"
                              placeholder={`${item.defaultValue ?? 'Value'} ${item.unitName || item.unit}`}
                              // value={inputValue ?? ''} // Use inputValue from props
                              // onChange={(e) => onInputChange?.(item.id, e.target.value)}
                              className={cn("h-7 text-xs flex-grow", compact ? "max-w-[100px]" : "max-w-[150px]")}
                              disabled={isPending}
                         />
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                            // onClick={() => onLogMeasurement(item, /* Need to get value from input */)}
                            // disabled={!inputValue || isNaN(parseFloat(inputValue)) || isPending}
                            disabled={isPending} // Placeholder disable
                        >
                            Log
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                            onClick={() => handleStatusChangeClick('skipped')}
                            disabled={isPending}
                        >
                            Skip
                        </Button>
                      </div>
                    ) : (
                     // Default Record/Skip buttons (e.g., for booleans or items without direct value logging)
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                        onClick={() => handleStatusChangeClick('completed')}
                         disabled={isPending}
                      >
                        <Check className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                        <span className={compact ? "text-xs" : "text-xs"}>Record</span> {/** Or "Complete"? */}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                        onClick={() => handleStatusChangeClick('skipped')}
                         disabled={isPending}
                      >
                        <X className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                        <span className={compact ? "text-xs" : "text-xs"}>Skip</span>
                      </Button>
                    </div>
                  )}
                </>
              ) : item.status !== 'pending' && !isLogged ? ( // Show Reset button if not pending and not logged
                 <Button
                  variant="outline"
                  size="sm"
                  className={cn(compact ? "h-6 text-xs py-0 px-2" : "h-7")}
                  onClick={() => handleStatusChangeClick('pending')}
                  disabled={isPending}
                >
                  <RotateCcw className={compact ? "h-3 w-3 mr-0.5" : "h-3 w-3 mr-1"} />
                  <span className={compact ? "text-xs" : "text-xs"}>Reset</span>
                </Button>
              ) : null /* Don't show action buttons if logged in TrackingInbox or if no status matches */}
            </div>
          )}
        </div>
      </div>
    )
} 