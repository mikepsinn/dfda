"use client"

import type React from "react"
import {
  Clock,
  Pill,
  Activity,
  Edit,
  X,
  RotateCcw,
  ExternalLink,
  Heart,
  MoreHorizontal,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"
import { formatInTimeZone } from 'date-fns-tz';
import { useState, useEffect } from "react"
import { UNIT_IDS } from "@/lib/constants/units"
import { getVariableInputType, getRatingRange } from "@/lib/variable-helpers"
import { Smile, Frown, Meh } from "lucide-react"
import type { Database } from "@/lib/database.types";

// Faces for 1–5 rating scales
const ratingFaces: Record<number, React.ReactNode> = {
  1: <Frown className="h-5 w-5" />,
  2: <Meh className="h-5 w-5" />,
  3: <Smile className="h-5 w-5" />,
  4: <Smile className="h-5 w-5 text-yellow-500" />,
  5: <Smile className="h-5 w-5 text-green-500" />,
};

// Export MeasurementStatus from here now
export type MeasurementStatus = Database["public"]["Enums"]["reminder_notification_status"] | "recorded";
// Use DB type for variable category ID
export type VariableCategoryId = Database["public"]["Tables"]["variable_categories"]["Row"]["id"];

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

  // For completed items, show value or default value with unit
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

  // Throw if not editable and no value
  if ((item.isEditable === false || !item.isEditable) && (item.value === null || item.value === undefined)) {
    throw new Error(`MeasurementNotificationItem: Non-editable item with no value. Item: ${JSON.stringify(item)}`);
  }

  // Format the time in the user's specified timezone
  let displayTime = "--:--";
  try {
    const tz = userTimezone && userTimezone.length > 0 ? userTimezone : 'UTC';
    const date = new Date(item.triggerAtUtc);
    if (item.triggerAtUtc && !isNaN(date.getTime())) {
      displayTime = formatInTimeZone(date, tz, 'h:mm a');
    } else {
      // Optionally log or handle the invalid date
      // logger.warn("Invalid triggerAtUtc for MeasurementNotificationItem", { triggerAtUtc: item.triggerAtUtc, item });
    }
  } catch (e) {
    console.error("Error formatting time for timeline item:", item, userTimezone, e);
  }

  const handleEditClick = () => onEdit?.(item);
  const handleSaveEditClick = () => onSaveEdit?.(item);
  const handleCancelEditClick = () => onCancelEdit?.();
  const handleSettingsClick = () => onNavigateToVariableSettings?.(item);
  const handleDetailsClick = () => item.detailsUrl && onNavigateToDetails?.(item.detailsUrl);

  // Combine status change logic
  const handleStatusChangeClick = (status: MeasurementStatus, value?: number) => {
      // REMOVED: Prioritization of onSkip logic
      if (onStatusChange) {
        onStatusChange(item, status, value);
      } else {
        console.warn("No handler provided for status change:", { status });
      }
  };

  // State for the numeric input field within this component (pre-populated for logged measurements)
  const [localInputValue, setLocalInputValue] = useState<string>(() => (item.value != null ? item.value.toString() : ""));
  const [selectedRating, setSelectedRating] = useState<number | null>(() => (item.value != null ? item.value : null));

  // Sync state with prop changes
  useEffect(() => {
    setLocalInputValue(item.value != null ? item.value.toString() : "");
    setSelectedRating(item.value != null ? item.value : null);
  }, [item.value]);

  // Determine input behavior
  const inputType = getVariableInputType({ unitId: item.unitId, variableCategory: item.variableCategoryId });
  const ratingRange = getRatingRange(inputType);

  // Unified log handler
  const handleLog = (value: number) => {
    if (onLogMeasurement) onLogMeasurement(item, value);
    else handleStatusChangeClick("completed", value);
    setSelectedRating(value);
  };

  // Render action buttons based on input type & status
  const renderActionButtons = () => {
    // Show input UI both for pending tasks and already-logged items
    if (item.status === "pending" || isLogged) {
      if (inputType === "boolean_yes_no") {
        return (
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleLog(1)} disabled={isPending}>Yes</Button>
            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleLog(0)} disabled={isPending}>No</Button>
          </div>
        );
      }
      if (ratingRange) {
        return (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {Array.from({ length: ratingRange[1] - ratingRange[0] + 1 }, (_, i) => ratingRange[0] + i).map((r) => (
                <Button
                  key={r}
                  variant={r === selectedRating ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs font-medium"
                  onClick={() => handleLog(r)}
                  disabled={isPending}
                  aria-label={`Rate ${r}`}
                >
                  {inputType === "rating_1_5" && ratingFaces[r] ? ratingFaces[r] : r}
                </Button>
              ))}
            </div>
          </div>
        );
      }
      // Numeric input: always show input field, even when a measurement exists
      return (
        <div className="flex gap-2 items-center pt-1">
          <Input
            type="number"
            placeholder={`${item.unitName || item.unit}`}
            value={localInputValue}
            onChange={(e) => setLocalInputValue(e.target.value)}
            disabled={isPending}
            className="h-7 text-xs flex-grow max-w-[150px]"
          />
          <span className="text-xs text-muted-foreground self-center ml-2">{item.unitName || item.unit}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => {
              const v = parseFloat(localInputValue);
              if (!isNaN(v)) {
                handleLog(v);
                setLocalInputValue("");
              }
            }}
            disabled={!localInputValue || isNaN(parseFloat(localInputValue)) || isPending}
          >
            {item.value != null ? 'Update' : 'Log'}
          </Button>
        </div>
      );
    }
    return null;
  };

  const menuProps = { item, isEditing, isLogged, isPending, handleEditClick, handleDetailsClick, handleSettingsClick, handleStatusChangeClick, onUndo };

  return (
    <div className="border-b">
      {/* Main flex container: stack on mobile, row on medium+ */}
      <div className="flex flex-col md:flex-row p-4 gap-4 items-start">

        {/* --- Left Side (Icon, Name/Time, Mobile Menu) --- */}
        <div className="flex items-start gap-3 w-full md:w-auto flex-shrink-0">
          {/* Icon Div */} 
          <div
            className={cn(
              "relative flex items-center justify-center rounded-full mr-0",
              "w-10 h-10",
              "bg-background"
            )}
          >
            {getTypeIcon(item.variableCategoryId, item.emoji)}
          </div>
          {/* Name/Time Block + Mobile Menu container */}
          <div className="flex-1 flex justify-between items-start"> 
            {/* Name/Time */}
            <div> 
              <div className="font-medium text-sm">{item.name}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {displayTime}
              </div>
            </div>
            {/* Mobile Menu (Rendered Here, hidden on md+) */} 
            <div className="md:hidden">
                {renderMenuContent(menuProps)}
            </div>
          </div>
        </div>
        {/* --- End Left Side --- */}

        {/* --- Right Side (Desktop Menu + Actions) --- */}
        <div className="w-full md:flex-1 flex flex-col">
           {/* Desktop Menu (Rendered Here, hidden until md+) */} 
           <div className="hidden md:flex self-end space-x-1 mb-2">
               {renderMenuContent(menuProps)}
           </div>

           {/* Actions Area */} 
           <div className="mt-2 md:mt-0"> {/* Simple margin, adjust as needed */} 
             {/* Value Display (always show, not just mobile) */}
             <div className="mt-1 text-xs">
               {renderValueDisplay(item)}
             </div>

             {/* Notes rendering (Mobile only) */}
             {item.notes && (
               <div className="text-xs mt-1 italic text-muted-foreground md:hidden">{item.notes}</div>
             )}

             {/* Edit Form or Action Buttons Area */} 
             {isEditing ? (
               <div className="mt-3 space-y-3 p-3 rounded-md border border-dashed md:mt-0"> 
                 <div className="flex items-center space-x-2">
                   <Input
                     type="number"
                     value={editValue ?? ""}
                     onChange={() => console.warn("Inline onChange not implemented for edit input")}
                     className="w-20 h-8 text-sm"
                   />
                   <Select
                     value={editUnit || ""}
                     onValueChange={() => console.warn("Inline onValueChange not implemented for edit select")}
                    >
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
                     value={editNotes || ""}
                     onChange={() => console.warn("Inline onChange not implemented for edit notes")}
                     className="w-full h-8 text-sm"
                   />
                 </div>
                 <div className="flex justify-end space-x-2">
                   <Button
                     size="sm"
                     className="h-8"
                     onClick={handleSaveEditClick}
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
               // Action Buttons
               <div className="mt-2 md:mt-0"> {/* Adjusted margin */} 
                 {renderActionButtons()}
               </div>
             )}
           </div>
         </div>
         {/* --- End Right Side --- */}
      </div>
      {/* --- End Main Flex Container --- */}
    </div>
  )
}

// Helper function to render Menu and Undo button
const renderMenuContent = (props: {
    item: MeasurementNotificationItemData;
    isEditing: boolean;
    isLogged: boolean;
    isPending: boolean;
    handleEditClick: () => void;
    handleDetailsClick: () => void;
    handleSettingsClick: () => void;
    handleStatusChangeClick: (status: MeasurementStatus, value?: number) => void;
    onUndo?: (logId: string | undefined, item: MeasurementNotificationItemData) => void;
  }) => {
    const { item, isEditing, isLogged, isPending, handleEditClick, handleDetailsClick, handleSettingsClick, handleStatusChangeClick, onUndo } = props;
    return (
        <div className="flex space-x-1">
          {/* Dropdown Menu */} 
          {(item.isEditable ?? true) && (
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
          )}
          {/* Undo Button */} 
          {isLogged && onUndo && item.status !== 'pending' && ( 
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUndo(undefined, item)} disabled={isPending}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
    );
}; 