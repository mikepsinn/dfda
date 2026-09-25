'use client'

import { formatDistanceToNow } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Button } from '@/components/ui/button'
import { X, Undo2, Loader2, MoreHorizontal, Settings, Edit3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
import { getVariableInputType, getRatingRange } from '@/lib/variable-helpers'
import { Smile, Frown, Meh } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { ReminderNotificationDetails } from "@/lib/database.types.custom"

export interface ReminderNotificationCardProps {
  reminderNotification: ReminderNotificationDetails;
  userTimezone: string;
  isProcessing?: boolean;
  loggedData?: { value: number; unitName: string };
  onLogMeasurement?: (data: ReminderNotificationDetails, value: number) => Promise<void>;
  onSkip?: (data: ReminderNotificationDetails) => Promise<void>;
  onUndoLog?: (data: ReminderNotificationDetails) => Promise<void>;
  onEditReminderSettings?: (scheduleId: string) => void;
  onNavigateToVariableSettings?: (userVariableId: string, globalVariableId: string) => void;
}

const ratingFaces: { [key: number]: React.ReactNode } = {
  1: <Frown className="h-5 w-5" />,
  2: <Meh className="h-5 w-5" />,
  3: <Smile className="h-5 w-5" />,
  4: <Smile className="h-5 w-5 text-yellow-500" />,
  5: <Smile className="h-5 w-5 text-green-500" />,
};

export function ReminderNotificationCard({
  reminderNotification,
  userTimezone,
  isProcessing = false,
  loggedData,
  onLogMeasurement,
  onSkip,
  onUndoLog,
  onEditReminderSettings,
  onNavigateToVariableSettings
}: ReminderNotificationCardProps) {
  const [localInputValue, setLocalInputValue] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inputError, setInputError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (reminderNotification.status === 'completed' && loggedData) {
        setLocalInputValue(loggedData.value.toString());
        setSelectedRating(loggedData.value);
    } else if (reminderNotification.status === 'pending') {
        setLocalInputValue(reminderNotification.defaultValue != null ? reminderNotification.defaultValue.toString() : "");
        setSelectedRating(reminderNotification.defaultValue != null ? reminderNotification.defaultValue : null);
    } else {
        setLocalInputValue("");
        setSelectedRating(null);
    }
  }, [reminderNotification.status, reminderNotification.defaultValue, loggedData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalInputValue(value);
    if (inputError) setInputError('');
  };
  
  const submitMeasurement = async (valueToLog: number) => {
    if (!onLogMeasurement) return;
    try {
      await onLogMeasurement(reminderNotification, valueToLog);
    } catch (error) {
      logger.error('Error logging measurement from card', { error, notificationId: reminderNotification.notificationId });
      toast({ title: "Error", description: "An error occurred while logging.", variant: "destructive"});
    }
  };
  
  const handleLogNumericMeasurement = () => {
    const numericValue = parseFloat(localInputValue);
    if (isNaN(numericValue)) {
      setInputError('Please enter a valid number');
      toast({ title: "Invalid Input", description: "Please enter a valid number.", variant: "destructive"});
      return;
    }
    submitMeasurement(numericValue);
  };
  
  const handleSkip = async () => {
    if (!onSkip) return;
    try {
      await onSkip(reminderNotification);
      toast({ title: "Notification Skipped", description: `Skipped "${reminderNotification.title || reminderNotification.variableName}"`});
    } catch (error) {
      logger.warn('Error skipping notification', { error, notificationId: reminderNotification.notificationId });
      toast({ title: "Error", description: "Failed to skip notification", variant: "destructive"});
    }
  };
  
  const handleUndo = async () => {
    if (!onUndoLog) return;
    try {
      await onUndoLog(reminderNotification);
      toast({ title: "Log Undone", description: "The previous action has been undone."});
    } catch (error) {
      logger.warn('Error undoing log', { error, notificationId: reminderNotification.notificationId });
      toast({ title: "Error", description: "Failed to undo the action", variant: "destructive"});
    }
  };

  const inputType = getVariableInputType({
    unitId: reminderNotification.unitId,
    variableCategory: reminderNotification.variableCategory,
  });
  const ratingRange = getRatingRange(inputType);

  const isCompleted = reminderNotification.status === 'completed';
  const isSkipped = reminderNotification.status === 'skipped';
  const isPending = reminderNotification.status === 'pending';

  const displayLoggedValue = isCompleted && loggedData ? loggedData.value : null;
  const displayLoggedUnit = isCompleted && loggedData ? loggedData.unitName : reminderNotification.unitName;

  let dueAtTimeDisplay = "--:--";
  try {
    const date = new Date(reminderNotification.dueAt);
    if (!isNaN(date.getTime())) {
      dueAtTimeDisplay = userTimezone 
        ? formatInTimeZone(date, userTimezone, 'h:mm a') 
        : date.toLocaleTimeString([], { timeStyle: 'short' });
    }
  } catch (error) {
    logger.error("Error formatting time for reminder card:", { notificationId: reminderNotification.notificationId, userTimezone, error });
  }

  const canEditSchedule = reminderNotification.status === 'pending' && onEditReminderSettings;
  const canViewVariableSettings = onNavigateToVariableSettings && (reminderNotification.userVariableId || reminderNotification.globalVariableId);

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center">
            {reminderNotification.emoji && <span className="mr-2 text-lg">{reminderNotification.emoji}</span>}
            <p className="font-medium">{reminderNotification.title || reminderNotification.variableName}</p>
          </div>
          {reminderNotification.message && (
            <p className="text-sm text-muted-foreground">{reminderNotification.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Due: {formatDistanceToNow(new Date(reminderNotification.dueAt), { addSuffix: true })}
            {' '}({dueAtTimeDisplay})
          </p>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {(canEditSchedule || canViewVariableSettings) && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEditSchedule && (
                    <DropdownMenuItem onClick={() => onEditReminderSettings!(reminderNotification.scheduleId)}>
                      <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Reminder
                    </DropdownMenuItem>
                  )}
                  {canViewVariableSettings && (
                    <DropdownMenuItem onClick={() => onNavigateToVariableSettings!(reminderNotification.userVariableId, reminderNotification.globalVariableId)}>
                      <Settings className="mr-2 h-3.5 w-3.5" /> Variable Settings
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
          )}
          {!isCompleted && isPending && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-muted-foreground hover:bg-secondary/80"
              onClick={handleSkip}
              disabled={isProcessing}
              aria-label="Skip notification"
            >
              <X className="h-4 w-4 mr-1 sm:mr-0" />
              <span className="hidden sm:inline">Skip</span>
            </Button>
          )}
        </div>
      </div>

      {isCompleted && displayLoggedValue !== null && (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed">
          <p className="text-sm text-muted-foreground italic">
            Logged: <span className="font-medium text-foreground not-italic">
              {displayLoggedValue} {displayLoggedUnit || ''}
            </span>
          </p>
          {onUndoLog && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleUndo} 
              disabled={isProcessing}
              className="h-7 px-2 text-xs"
            >
              <Undo2 className="mr-1 h-3 w-3" /> Undo
            </Button>
          )}
        </div>
      )}

      {isSkipped && (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed">
          <p className="text-sm text-muted-foreground italic">
            Skipped
          </p>
          {onUndoLog && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleUndo} 
              disabled={isProcessing}
              className="h-7 px-2 text-xs"
              aria-label="Undo skip"
            >
              <Undo2 className="mr-1 h-3 w-3" /> Undo
            </Button>
          )}
        </div>
      )}

      {isPending && (
        <div className="pt-3 border-t border-dashed">
          {(reminderNotification.variableName || reminderNotification.defaultValue !== undefined) && (
             <div className="mb-2">
                <Label htmlFor={`input-${reminderNotification.notificationId}`}>{reminderNotification.variableName}</Label>
                {reminderNotification.defaultValue !== undefined && (
                  <p className="text-xs text-muted-foreground">Default: {reminderNotification.defaultValue} {reminderNotification.unitName}</p>
                )}
             </div>
           )}

          {inputType === "boolean_yes_no" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => submitMeasurement(1)} disabled={isProcessing}>Yes</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => submitMeasurement(0)} disabled={isProcessing}>No</Button>
            </div>
          )}
          {inputType !== "boolean_yes_no" && ratingRange && (
            <div className="flex flex-col items-center gap-2">
               <div className="flex flex-wrap gap-1.5 justify-center">
                {Array.from({ length: ratingRange[1] - ratingRange[0] + 1 }, (_, i) => ratingRange[0] + i).map(r => (
                  <Button
                    key={r}
                    variant={selectedRating === r ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-sm font-medium"
                    onClick={() => {
                      setSelectedRating(r);
                      submitMeasurement(r);
                    }}
                    disabled={isProcessing}
                    aria-label={`Rate ${r}`}
                  >
                    {inputType === "rating_1_5" && ratingFaces[r] ? ratingFaces[r] : r}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {inputType !== "boolean_yes_no" && !ratingRange && ( 
            <div className="flex items-center gap-2">
              <Input
                id={`input-${reminderNotification.notificationId}`}
                type="number"
                value={localInputValue}
                onChange={handleInputChange}
                placeholder={`Enter ${reminderNotification.unitName || 'value'}`}
                className="flex-grow"
                disabled={isProcessing}
              />
              {reminderNotification.unitName && <span className="text-sm text-muted-foreground">{reminderNotification.unitName}</span>}
              <Button 
                onClick={handleLogNumericMeasurement} 
                disabled={isProcessing || !localInputValue || isNaN(parseFloat(localInputValue))}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log
              </Button>
            </div>
          )}
          {inputError && <p className="text-sm text-destructive mt-1">{inputError}</p>}
        </div>
      )}
    </div>
  );
} 