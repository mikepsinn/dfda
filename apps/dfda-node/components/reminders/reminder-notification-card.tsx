'use client'

import { formatDistanceToNow } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Button } from '@/components/ui/button'
import { X, Undo2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
import { getVariableInputType, getRatingRange } from '@/lib/variable-helpers'
import { Smile, Frown, Meh } from 'lucide-react'

export interface ReminderNotificationCardData {
  id: string; // Unique ID for the item, e.g., notificationId
  reminderScheduleId: string;
  triggerAtUtc: string; // Equivalent to dueAt
  status: "pending" | "completed" | "skipped" | "error";
  title?: string; 
  variableName?: string; 
  message?: string; 
  variableCategoryId: string; // Made required
  unitId: string; // Made required
  unitName?: string; 
  details?: string;
  detailsUrl?: string;
  isEditable?: boolean;
  defaultValue?: number | string | null; 
  emoji?: string; 
  currentValue?: number | null; // Current value, if logged or being input

  // These fields were part of PendingNotificationTask and used by the card.
  // Ensure they are covered by the fields above or add if necessary.
  // notificationId: string; // Covered by id
  // dueAt: string; // Covered by triggerAtUtc
}

export interface ReminderNotificationCardProps {
  reminderNotification: ReminderNotificationCardData; // Renamed and type changed
  userTimezone: string; // Changed from optional to required
  isPending?: boolean;
  loggedValue?: number; // This might be redundant if reminderNotification.currentValue and status cover it
  inputValue?: string; // This might be redundant if reminderNotification.currentValue covers it for input
  onSkip: (data: ReminderNotificationCardData) => void; // Changed signature
  onUndo?: (id: string) => void; // Changed signature (uses id from ReminderNotificationCardData)
  onInputChange?: (id: string, value: string) => void; // Changed signature
  onLogMeasurement?: (data: ReminderNotificationCardData, value: number) => void; // Changed signature
  showToasts?: boolean;
}

const ratingFaces: { [key: number]: React.ReactNode } = {
  1: <Frown className="h-5 w-5" />,
  2: <Meh className="h-5 w-5" />,
  3: <Smile className="h-5 w-5" />,
  4: <Smile className="h-5 w-5 text-yellow-500" />,
  5: <Smile className="h-5 w-5 text-green-500" />,
};

export function ReminderNotificationCard({
  reminderNotification, // Destructure renamed prop
  userTimezone, // No longer has a default, will be required from parent
  isPending = false,
  loggedValue, // Evaluate if needed, or use reminderNotification.currentValue/status
  inputValue = '', // Evaluate if needed
  onSkip,
  onUndo,
  onInputChange,
  onLogMeasurement,
  showToasts = true
}: ReminderNotificationCardProps) {
  // Local state
  // If inputValue is managed by parent via reminderNotification.currentValue, localInputValue might adapt
  const [localInputValue, setLocalInputValue] = useState(inputValue || (typeof reminderNotification.currentValue === 'number' ? String(reminderNotification.currentValue) : ''));
  const [inputError, setInputError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast()
  
  // Handle input change locally or delegate to parent
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalInputValue(value);
    
    if (inputError) {
      setInputError('');
    }
    
    if (onInputChange) {
      onInputChange(reminderNotification.id, value); // Use reminderNotification.id
    }
  };

  // Determine which input value to use
  // If onInputChange is provided, parent controls the value. We can assume inputValue prop will be updated.
  // Or, if reminderNotification.currentValue is the source of truth for display when not editing.
  const currentDisplayInputValue = onInputChange ? inputValue : localInputValue;
  
  const submitMeasurement = (valueToLog: number) => {
    if (!onLogMeasurement) return;
    
    setIsSubmitting(true);
    
    try {
      if (onInputChange) {
          // Parent is managing input, ensure its state is updated if it relies on that for logging
          onInputChange(reminderNotification.id, String(valueToLog));
      }
      
      onLogMeasurement(reminderNotification, valueToLog); // Pass ReminderNotificationCardData
      
      if (!onInputChange) {
        setLocalInputValue('');
      }
    } catch (error) {
      logger.error('Error logging measurement', { error, notificationId: reminderNotification.id, value: valueToLog });
      if (showToasts) {
        toast({ 
          title: "Error", 
          description: "An error occurred while logging.", 
          variant: "destructive"
        });
      }
    } finally {
      setTimeout(() => setIsSubmitting(false), 100);
    }
  };
  
  const handleLogNumericMeasurement = () => {
    const numericValue = parseFloat(currentDisplayInputValue); // Use currentDisplayInputValue
    if (isNaN(numericValue)) {
      setInputError('Please enter a valid number');
      if (showToasts) {
        toast({ 
          title: "Invalid Input", 
          description: "Please enter a valid number.", 
          variant: "destructive"
        });
      }
      return;
    }
    submitMeasurement(numericValue);
  };
  
  const handleSkip = () => {
    try {
      onSkip(reminderNotification); // Pass ReminderNotificationCardData
      if (showToasts) {
        toast({
          title: "Notification Skipped",
          description: `Skipped "${reminderNotification.title || reminderNotification.variableName}"`,
        });
      }
    } catch (error) {
      logger.warn('Error skipping notification', { error, notificationId: reminderNotification.id });
      if (showToasts) {
        toast({
          title: "Error",
          description: "Failed to skip notification",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleUndo = () => {
    if (!onUndo) return;
    
    try {
      onUndo(reminderNotification.id); // Pass id from ReminderNotificationCardData
      if (showToasts) {
        toast({
          title: "Measurement Undone",
          description: "The measurement has been removed."
        });
      }
    } catch (error) {
      logger.warn('Error undoing measurement', { error, notificationId: reminderNotification.id });
      if (showToasts) {
        toast({
          title: "Error",
          description: "Failed to undo the measurement",
          variant: "destructive"
        });
      }
    }
  };

  // Determine input type using the centralized helper
  const inputType = getVariableInputType({
    unitId: reminderNotification.unitId ?? null,
    variableCategory: reminderNotification.variableCategoryId ?? null,
  });
  const ratingRange = getRatingRange(inputType);

  // Determine if the item is considered "logged" based on status from ReminderNotificationCardData
  // This replaces the isLogged prop if status is reliable
  const effectivelyLogged = reminderNotification.status === 'completed'; 
  // loggedValue prop might be replaced by reminderNotification.currentValue when status is 'completed'
  const displayLoggedValue = effectivelyLogged ? reminderNotification.currentValue : loggedValue;

  let dueAtTimeDisplay = "--:--";
  try {
    const date = new Date(reminderNotification.triggerAtUtc);
    if (!isNaN(date.getTime())) {
      // Use formatInTimeZone if userTimezone is available, otherwise default toLocaleTimeString
      dueAtTimeDisplay = userTimezone 
        ? formatInTimeZone(date, userTimezone, 'h:mm a') 
        : date.toLocaleTimeString([], { timeStyle: 'short' });
    }
  } catch (error) {
    logger.error("Error formatting time for reminder card:", { notificationId: reminderNotification.id, userTimezone, error });
  }

  return (
    <div className="rounded-md border p-4">
      {/* Task Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="font-medium">{reminderNotification.title || reminderNotification.variableName}</p>
          {reminderNotification.message && (
            <p className="text-sm text-muted-foreground">{reminderNotification.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Due: {formatDistanceToNow(new Date(reminderNotification.triggerAtUtc), { addSuffix: true })}
            {' '}({dueAtTimeDisplay})
          </p>
        </div>
        {/* Show Skip only if not already logged (use effectivelyLogged) */} 
        {!effectivelyLogged && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-muted-foreground hover:bg-secondary/80"
            onClick={handleSkip}
            disabled={isPending || isSubmitting} // isPending prop might still be useful for external loading state
            aria-label="Skip notification"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Skip</span>
          </Button>
        )}
      </div>

      {/* Logged State (use effectivelyLogged and displayLoggedValue) */}
      {effectivelyLogged && displayLoggedValue !== undefined && displayLoggedValue !== null && onUndo && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-dashed">
          <p className="text-sm text-muted-foreground italic">
            Logged: <span className="font-medium text-foreground not-italic">
              {displayLoggedValue} {reminderNotification.unitName || ''}
            </span>
          </p>
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleUndo} 
            disabled={isPending || isSubmitting}
            className="h-7 px-2 text-xs"
          >
            <Undo2 className="mr-1 h-3 w-3" /> Undo
          </Button>
        </div>
      )}

      {/* Action Area: Render only if not effectively logged */}
      {!effectivelyLogged && (
        <div className="mt-3 pt-3 border-t border-dashed">
          {/* Variable Name and Default Value (if applicable) */}
          {/* (Assuming these are now part of reminderNotification) */}
          {/* This section might need adjustment based on how defaultValue etc. is handled */}
          {(reminderNotification.variableName || reminderNotification.defaultValue !== undefined) && (
             <div className="mb-2">
                {reminderNotification.variableName && <Label htmlFor={`input-${reminderNotification.id}`}>{reminderNotification.variableName}</Label>}
                {reminderNotification.defaultValue !== undefined && (
                  <p className="text-xs text-muted-foreground">Default: {reminderNotification.defaultValue}</p>
                )}
             </div>
           )}

          {/* Input Area (Yes/No, Rating, Numeric) */}
          {inputType === "boolean_yes_no" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => submitMeasurement(1)} disabled={isSubmitting || isPending}>Yes</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => submitMeasurement(0)} disabled={isSubmitting || isPending}>No</Button>
            </div>
          )}
          {inputType !== "boolean_yes_no" && ratingRange && (
            <div className="flex flex-col items-center gap-2">
               <div className="flex flex-wrap gap-1.5 justify-center">
                {Array.from({ length: ratingRange[1] - ratingRange[0] + 1 }, (_, i) => ratingRange[0] + i).map(r => (
                  <Button
                    key={r}
                    variant={String(localInputValue) === String(r) ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-sm font-medium"
                    onClick={() => {
                      // For ratings, we can set localInputValue and then submit
                      setLocalInputValue(String(r)); // Keep local state for visual feedback
                                          // If onInputChange is used, parent also gets update for this button click
                                          if (onInputChange) {
                                            onInputChange(reminderNotification.id, String(r));
                                          }
                      submitMeasurement(r);
                    }}
                    disabled={isSubmitting || isPending}
                    aria-label={`Rate ${r}`}
                  >
                    {inputType === "rating_1_5" && ratingFaces[r] ? ratingFaces[r] : r}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {inputType !== "boolean_yes_no" && !ratingRange && ( // Numeric input
            <div className="flex items-center gap-2">
              <Input
                id={`input-${reminderNotification.id}`}
                type="number"
                value={currentDisplayInputValue}
                onChange={handleInputChange}
                placeholder={`Enter ${reminderNotification.unitName || 'value'}`}
                className="flex-grow"
                disabled={isSubmitting || isPending}
              />
              {reminderNotification.unitName && <span className="text-sm text-muted-foreground">{reminderNotification.unitName}</span>}
              <Button 
                onClick={handleLogNumericMeasurement} 
                disabled={isSubmitting || isPending || !currentDisplayInputValue}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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