"use client"

import type React from "react"
import {
  Clock,
  Pill,
  Activity,
  Edit,
  RotateCcw,
  ExternalLink,
  Heart,
  MoreHorizontal,
  Settings,
  CheckCircle,
  AlertTriangle, // For skipped status
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Select not directly used for logging, but could be for editing reminder settings
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"
import { formatInTimeZone } from 'date-fns-tz';
import { useState, useEffect } from "react"
import { getVariableInputType, getRatingRange } from "@/lib/variable-helpers"
import { Smile, Frown, Meh } from "lucide-react"
import type { Database } from "@/lib/database.types";
import { logger } from '@/lib/logger'; // Import custom logger

// Faces for 1–5 rating scales
const ratingFaces: Record<number, React.ReactNode> = {
  1: <Frown className="h-5 w-5" />,
  2: <Meh className="h-5 w-5" />,
  3: <Smile className="h-5 w-5" />,
  4: <Smile className="h-5 w-5 text-yellow-500" />,
  5: <Smile className="h-5 w-5 text-green-500" />,
};

export type ReminderNotificationStatus = Database["public"]["Enums"]["reminder_notification_status"];
export type VariableCategoryId = Database["public"]["Tables"]["variable_categories"]["Row"]["id"];

export interface ReminderNotificationCardData {
  id: string; // reminder_notifications.id
  reminderScheduleId: string;
  triggerAtUtc: string;
  status: ReminderNotificationStatus;
  variableName: string; // variables.name
  variableCategoryId: VariableCategoryId;
  unitId: string; // units.id
  unitName: string; // units.name
  globalVariableId: string; // Kept for potential future use or consistency if needed for some actions
  userVariableId: string; // Kept for potential future use

  // Optional fields
  details?: string | null;
  detailsUrl?: string | null;
  isEditable?: boolean | null; // Is the underlying reminder schedule editable?
  defaultValue?: number | null; // Default measurement value from reminder_schedules
  emoji?: string | null; // From variables table
  currentValue?: number | null; // Logged value if status is 'completed' or 'skipped' (null if skipped implies no value)
  loggedValueUnit?: string | null; // Unit of the logged value, might differ if unit can be changed during logging (unlikely for now)
  // Notes not typically associated with a pending notification, but could be part of a logged measurement.
  // For now, we assume notes are handled when a measurement is actually created.
}

export interface ReminderNotificationCardProps {
  reminderNotification: ReminderNotificationCardData;
  userTimezone: string;
  isProcessing?: boolean; // General purpose processing state for async actions initiated by this card

  // Callbacks
  onEditReminder?: (reminderScheduleId: string) => void; // To edit the reminder schedule itself
  onNavigateToVariableSettings?: (userVariableId: string | undefined, globalVariableId: string | undefined) => void;
  onNavigateToDetails?: (url: string) => void;

  // Actions for a PENDING notification
  onLogMeasurement?: (
    reminderNotificationId: string,
    value: number,
    reminderScheduleId: string,
    variableName: string,
    unitName: string
  ) => Promise<void>;
  onSkip?: (reminderNotificationId: string, reminderScheduleId: string) => Promise<void>;
  onUndoLog?: (reminderNotificationId: string, reminderScheduleId: string) => Promise<void>; // To undo a 'completed' or 'skipped' status
}


const renderValueDisplay = (reminder: ReminderNotificationCardData) => {
  if (reminder.status === 'pending') {
    if (reminder.defaultValue !== null && reminder.defaultValue !== undefined) {
      return <span className="font-medium">{`${reminder.defaultValue} ${reminder.unitName || ''}`.trim()}</span>;
    }
    return <span className="text-sm text-gray-500 italic">Pending...</span>; // Or an icon, or nothing
  }
  if (reminder.status === 'completed' && reminder.currentValue !== null && reminder.currentValue !== undefined) {
    return <span className="font-medium text-green-600">{`${reminder.currentValue} ${reminder.loggedValueUnit || reminder.unitName || ''}`.trim()}</span>;
  }
  if (reminder.status === 'skipped') {
    return <span className="font-medium text-orange-600 italic">Skipped</span>;
  }
  return <span className="font-medium">- {reminder.unitName || ''}</span>;
};

const getTypeIcon = (categoryId: VariableCategoryId, emoji?: string | null) => {
  if (emoji) {
      return <span className="text-lg">{emoji}</span>;
  }
  const iconSizeClass = "h-4 w-4";
  switch (categoryId) {
    case VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS:
      return <Pill className={iconSizeClass} />;
    case VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY:
      return <Heart className={iconSizeClass} />;
    case VARIABLE_CATEGORY_IDS.ACTIVITY_AND_BEHAVIOR:
      return <Activity className={iconSizeClass} />;
    default:
      return <Clock className={iconSizeClass} />;
  }
}

export function ReminderNotificationCard({
  reminderNotification,
  userTimezone,
  isProcessing = false,
  onEditReminder,
  onNavigateToVariableSettings,
  onNavigateToDetails,
  onLogMeasurement,
  onSkip,
  onUndoLog,
}: ReminderNotificationCardProps) {

  let displayTime = "--:--";
  try {
    const tz = userTimezone && userTimezone.length > 0 ? userTimezone : 'UTC';
    const date = new Date(reminderNotification.triggerAtUtc);
    if (reminderNotification.triggerAtUtc && !isNaN(date.getTime())) {
      displayTime = formatInTimeZone(date, tz, 'h:mm a');
    } else {
      logger.warn("Invalid triggerAtUtc for ReminderNotificationCard", { triggerAtUtc: reminderNotification.triggerAtUtc, reminderNotification });
    }
  } catch (e) {
    logger.error("Error formatting time for timeline item:", { reminderNotification, userTimezone, error: e });
  }

  const [localInputValue, setLocalInputValue] = useState<string>(() => (reminderNotification.defaultValue != null ? reminderNotification.defaultValue.toString() : ""));
  const [selectedRating, setSelectedRating] = useState<number | null>(() => (reminderNotification.defaultValue != null ? reminderNotification.defaultValue : null));

  useEffect(() => {
    // If status is completed, show the logged value. Otherwise, show default for pending.
    if (reminderNotification.status === 'completed' && reminderNotification.currentValue !== null && reminderNotification.currentValue !== undefined) {
        setLocalInputValue(reminderNotification.currentValue.toString());
        setSelectedRating(reminderNotification.currentValue);
    } else if (reminderNotification.status === 'pending') {
        setLocalInputValue(reminderNotification.defaultValue != null ? reminderNotification.defaultValue.toString() : "");
        setSelectedRating(reminderNotification.defaultValue != null ? reminderNotification.defaultValue : null);
    } else {
        setLocalInputValue("");
        setSelectedRating(null);
    }
  }, [reminderNotification.status, reminderNotification.currentValue, reminderNotification.defaultValue]);


  const inputType = getVariableInputType({ unitId: reminderNotification.unitId, variableCategory: reminderNotification.variableCategoryId });
  const ratingRange = getRatingRange(inputType);

  const handleLog = async (value: number) => {
    if (onLogMeasurement) {
      try {
        await onLogMeasurement(
          reminderNotification.id,
          value,
          reminderNotification.reminderScheduleId,
          reminderNotification.variableName,
          reminderNotification.unitName
        );
        // Optimistic update or rely on parent to refresh data
        // setSelectedRating(value); // State will update via useEffect when props change
      } catch (error) {
        logger.error("Failed to log measurement from card", { error, reminderNotificationId: reminderNotification.id });
        // Potentially show a toast to the user
      }
    }
  };

  const handleSkip = async () => {
    if (onSkip) {
      try {
        await onSkip(reminderNotification.id, reminderNotification.reminderScheduleId);
      } catch (error) {
        logger.error("Failed to skip notification from card", { error, reminderNotificationId: reminderNotification.id });
      }
    }
  };

  const handleUndo = async () => {
    if (onUndoLog) {
      try {
        await onUndoLog(reminderNotification.id, reminderNotification.reminderScheduleId);
      } catch (error) {
        logger.error("Failed to undo log/skip from card", { error, reminderNotificationId: reminderNotification.id });
      }
    }
  };


  const renderActionButtons = () => {
    if (reminderNotification.status === 'pending') {
      if (inputType === "boolean_yes_no") {
        return (
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleLog(1)} disabled={isProcessing}>Yes</Button>
            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleLog(0)} disabled={isProcessing}>No</Button>
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
                  disabled={isProcessing}
                  aria-label={`Rate ${r}`}
                >
                  {inputType === "rating_1_5" && ratingFaces[r] ? ratingFaces[r] : r}
                </Button>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="flex gap-2 items-center pt-1">
          <Input
            type="number"
            value={localInputValue}
            onChange={(e) => setLocalInputValue(e.target.value)}
            placeholder={`Enter ${reminderNotification.unitName || 'value'}`}
            className="h-7 text-xs flex-grow"
            disabled={isProcessing}
          />
          <Button
            variant="default"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => {
                const val = parseFloat(localInputValue);
                if(!isNaN(val)) handleLog(val);
                else logger.warn("Invalid number input for logging", { localInputValue });
            }}
            disabled={isProcessing || localInputValue === ""}
          >
            Log
          </Button>
        </div>
      );
    }
    return null; // No action buttons if not pending
  };

  const renderStatusIconAndText = () => {
    switch (reminderNotification.status) {
      case 'completed':
        return <><CheckCircle className="h-4 w-4 text-green-500 mr-1" /> Logged</>;
      case 'skipped':
        return <><AlertTriangle className="h-4 w-4 text-orange-500 mr-1" /> Skipped</>;
      case 'pending':
         // For pending, we don't show an icon here, the action buttons serve as indication
        return null;
      default:
        return null;
    }
  }

  const cardClasses = cn(
    "flex items-start space-x-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm",
    // Add more classes based on status if needed, e.g., for visual distinction
    {
      "border-green-200 bg-green-50": reminderNotification.status === 'completed',
      "border-orange-200 bg-orange-50": reminderNotification.status === 'skipped',
      "border-blue-200 bg-blue-50": reminderNotification.status === 'pending',
    }
  );


  return (
    <TooltipProvider delayDuration={300}>
      <div className={cardClasses}>
        <div className="flex-shrink-0 pt-0.5">
          {getTypeIcon(reminderNotification.variableCategoryId, reminderNotification.emoji)}
        </div>

        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{reminderNotification.variableName}</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">{displayTime}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {reminderNotification.status !== 'pending' && onUndoLog && (
                    <DropdownMenuItem onClick={handleUndo} disabled={isProcessing}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Undo {reminderNotification.status === 'completed' ? 'Log' : 'Skip'}
                    </DropdownMenuItem>
                  )}
                  {onEditReminder && reminderNotification.isEditable && (
                    <DropdownMenuItem onClick={() => onEditReminder(reminderNotification.reminderScheduleId)} disabled={isProcessing}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Reminder
                    </DropdownMenuItem>
                  )}
                  {onNavigateToVariableSettings && (reminderNotification.userVariableId || reminderNotification.globalVariableId) && (
                     <DropdownMenuItem onClick={() => onNavigateToVariableSettings(reminderNotification.userVariableId, reminderNotification.globalVariableId)} disabled={isProcessing}>
                       <Settings className="mr-2 h-4 w-4" />
                       Variable Settings
                     </DropdownMenuItem>
                  )}
                  {reminderNotification.detailsUrl && onNavigateToDetails && (
                    <DropdownMenuItem onClick={() => {
                      if (typeof reminderNotification.detailsUrl === 'string') {
                        onNavigateToDetails(reminderNotification.detailsUrl)
                      }
                    }} disabled={isProcessing}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-1 flex items-center">
            {renderValueDisplay(reminderNotification)}
            <span className="ml-1">{renderStatusIconAndText()}</span>
          </div>


          {/* Action buttons: Log, Skip, Yes/No, Rating */}
          {reminderNotification.status === 'pending' && (
            <div className="mt-2">
              {renderActionButtons()}
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs text-muted-foreground hover:text-foreground px-1"
                onClick={handleSkip}
                disabled={isProcessing}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 