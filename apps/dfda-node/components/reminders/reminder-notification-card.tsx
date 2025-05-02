'use client'

import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { X, Undo2, Loader2 } from 'lucide-react'
import { PendingNotificationTask } from '@/lib/actions/reminder-schedules'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
import { getVariableInputType, getRatingRange } from '@/lib/variable-helpers'
import { Smile, Frown, Meh } from 'lucide-react'

export interface ReminderNotificationCardProps {
  notification: PendingNotificationTask
  isLogged?: boolean
  isPending?: boolean
  loggedValue?: number
  inputValue?: string
  onSkip: (notification: PendingNotificationTask) => void
  onUndo?: (notificationId: string) => void
  onInputChange?: (notificationId: string, value: string) => void
  onLogMeasurement?: (notification: PendingNotificationTask) => void
  showToasts?: boolean
}

const ratingFaces: { [key: number]: React.ReactNode } = {
  1: <Frown className="h-5 w-5" />,
  2: <Meh className="h-5 w-5" />,
  3: <Smile className="h-5 w-5" />,
  4: <Smile className="h-5 w-5 text-yellow-500" />,
  5: <Smile className="h-5 w-5 text-green-500" />,
};

export function ReminderNotificationCard({
  notification,
  isLogged = false,
  isPending = false,
  loggedValue,
  inputValue = '',
  onSkip,
  onUndo,
  onInputChange,
  onLogMeasurement,
  showToasts = true
}: ReminderNotificationCardProps) {
  // Local state
  const [localInputValue, setLocalInputValue] = useState(inputValue)
  const [inputError, setInputError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  // Handle input change locally or delegate to parent
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalInputValue(value)
    
    // Clear any previous error when user changes the input
    if (inputError) {
      setInputError('')
    }
    
    if (onInputChange) {
      onInputChange(notification.notificationId, value)
    }
  }

  // Determine which input value to use (local or parent-controlled)
  const currentInputValue = onInputChange ? inputValue : localInputValue
  
  // Modified handler to accept value directly for button clicks
  const submitMeasurement = (valueToLog: number) => {
    if (!onLogMeasurement) return;
    
    // Show loading state
    setIsSubmitting(true);
    
    // Call the parent handler
    try {
      // We need to slightly adapt the parent call if it relies on internal state
      // For now, assume onLogMeasurement can handle the value passed conceptually
      // Temporarily modify the notification object to pass the value
      // This might need adjustment based on how onLogMeasurement is implemented
      // A cleaner way would be for onLogMeasurement to accept the value directly.
      // We will rely on the parent component's useCallback correctly reading the value
      // from its own state which is updated by onInputChange for the text input,
      // or simulate that update for button clicks.
      
      // If parent manages input, update it before calling the handler
      if (onInputChange) {
          onInputChange(notification.notificationId, String(valueToLog));
      }
      
      // Trigger the logging process in the parent
      // The parent's `handleLogMeasurement` reads from its `measurementValues` state
      // which we just updated (if managed), or uses the internal numericValue.
      // It *should* pick up the correct value. Let's proceed with this assumption.
      
      // Directly pass the modified notification or value if parent handler supports it
      // For now, we assume the existing parent handler will work.
      // We might need to update the parent if this fails.
      
      // const tempNotificationForLog = {
      //   ...notification,
      //   user: undefined, // Avoid logging potentially large user object
      // }
      // logger.info("Processing notification", { notification: tempNotificationForLog });
      
      // Call parent log handler. It might need to be adjusted later.
      onLogMeasurement(notification); // Pass original notification, parent reads its state
      
      // Reset local input if using local state
      if (!onInputChange) {
        setLocalInputValue('');
      }
    } catch (error) {
      logger.error('Error logging measurement', { error, notificationId: notification.notificationId, value: valueToLog });
      if (showToasts) {
        toast({ 
          title: "Error", 
          description: "An error occurred while logging.", 
          variant: "destructive"
        });
      }
    } finally {
      // Delay setting submitting to false slightly to allow parent state update
      setTimeout(() => setIsSubmitting(false), 100);
    }
  };
  
  // Handle measurement submission with validation (for numeric input)
  const handleLogNumericMeasurement = () => {
    const numericValue = parseFloat(currentInputValue)
    if (isNaN(numericValue)) {
      setInputError('Please enter a valid number')
      if (showToasts) {
        toast({ 
          title: "Invalid Input", 
          description: "Please enter a valid number.", 
          variant: "destructive"
        })
      }
      return
    }
    submitMeasurement(numericValue);
  }
  
  // Convenience handler for skip with feedback
  const handleSkip = () => {
    try {
      onSkip(notification)
      if (showToasts) {
        toast({
          title: "Notification Skipped",
          description: `Skipped "${notification.title || notification.variableName}"`,
        })
      }
    } catch (error) {
      logger.warn('Error skipping notification', { error, notificationId: notification.notificationId })
      if (showToasts) {
        toast({
          title: "Error",
          description: "Failed to skip notification",
          variant: "destructive"
        })
      }
    }
  }
  
  // Convenience handler for undo with feedback
  const handleUndo = () => {
    if (!onUndo) return
    
    try {
      onUndo(notification.notificationId)
      if (showToasts) {
        toast({
          title: "Measurement Undone",
          description: "The measurement has been removed."
        })
      }
    } catch (error) {
      logger.warn('Error undoing measurement', { error, notificationId: notification.notificationId })
      if (showToasts) {
        toast({
          title: "Error",
          description: "Failed to undo the measurement",
          variant: "destructive"
        })
      }
    }
  }

  // Determine input type using the centralized helper
  const inputType = getVariableInputType({
    unitId: notification.unitId,
    variableCategory: notification.variableCategory,
  });
  const ratingRange = getRatingRange(inputType);

  return (
    <div className="rounded-md border p-4">
      {/* Task Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="font-medium">{notification.title || notification.variableName}</p>
          {notification.message && (
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Due: {formatDistanceToNow(new Date(notification.dueAt), { addSuffix: true })}
            {' '}({new Date(notification.dueAt).toLocaleTimeString([], { timeStyle: 'short' })})
          </p>
        </div>
        {/* Show Skip only if not already logged */} 
        {!isLogged && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-muted-foreground hover:bg-secondary/80"
            onClick={handleSkip}
            disabled={isPending || isSubmitting}
            aria-label="Skip notification"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Skip</span>
          </Button>
        )}
      </div>

      {/* Logged State */}
      {isLogged && loggedValue !== undefined && onUndo && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-dashed">
          <p className="text-sm text-muted-foreground italic">
            Logged: <span className="font-medium text-foreground not-italic">
              {loggedValue} {notification.unitName || ''}
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

      {/* --- Conditional Input Area --- */}
      {!isLogged && onLogMeasurement && (
        <>
          {/* Use a switch statement based on inputType */}
          {(() => {
            switch (inputType) {
              case 'boolean_yes_no':
                return (
                  <div className="mt-3 pt-3 border-t border-dashed flex justify-around gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => submitMeasurement(1)} // 1 for Present/Yes
                      disabled={isPending || isSubmitting}
                      aria-label="Log as Present or Yes"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"} {/* Changed to Yes/No */}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => submitMeasurement(0)} // 0 for Absent/No
                      disabled={isPending || isSubmitting}
                      aria-label="Log as Absent or No"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "No"} {/* Changed to Yes/No */}
                    </Button>
                  </div>
                );

              case 'rating_1_5':
              case 'rating_1_10':
              case 'rating_0_10':
                if (!ratingRange) return null; // Should not happen based on inputType
                return (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <Label className="text-xs mb-2 block text-center">
                      Rate {notification.variableName} ({ratingRange[0]}-{ratingRange[1]})
                    </Label>
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {Array.from({ length: ratingRange[1] - ratingRange[0] + 1 }, (_, i) => ratingRange[0] + i).map((value) => (
                        <Button
                          key={value}
                          variant="outline"
                          size="icon" // Use "icon" size for compact buttons
                          className="h-9 w-9" // Adjust size as needed
                          onClick={() => submitMeasurement(value)}
                          disabled={isPending || isSubmitting}
                          aria-label={`Rate as ${value}`}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            // Use faces only for 1-5 scale
                            inputType === 'rating_1_5' && ratingFaces[value] ? ratingFaces[value] : value
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              
              case 'numeric':
              default: // Includes 'other' and default numeric
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2 mt-2 items-end">
                      <div className="flex-1 grid gap-1">
                        <Label htmlFor={`measure-${notification.notificationId}`} className="text-xs">
                          Value {notification.unitName ? `(${notification.unitName})` : '(Enter Value)'}
                        </Label>
                        <Input 
                          id={`measure-${notification.notificationId}`}
                          type="number" 
                          step="any"
                          value={currentInputValue}
                          onChange={handleInputChange}
                          className={`h-8 text-sm ${inputError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          placeholder="Enter value..."
                          disabled={isPending || isSubmitting}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogNumericMeasurement()}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleLogNumericMeasurement}
                        disabled={isPending || isSubmitting || !currentInputValue}
                        className="h-8"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Log
                      </Button>
                    </div>
                    {inputError && (
                      <p className="text-xs text-red-500 mt-1">{inputError}</p>
                    )}
                  </div>
                );
            }
          })()}
        </>
      )}
    </div>
  )
} 