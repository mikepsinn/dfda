'use client'

import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { X, Undo2, Loader2 } from 'lucide-react'
import { PendingNotificationTask } from '@/app/actions/reminder-schedules'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

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
  
  // Handle measurement submission with validation
  const handleLogMeasurement = () => {
    if (!onLogMeasurement) return
    
    // Validate input
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
    
    // Show loading state
    setIsSubmitting(true)
    
    // Call the parent handler
    try {
      onLogMeasurement(notification)
      
      // Reset local input if using local state
      if (!onInputChange) {
        setLocalInputValue('')
      }
    } catch (error) {
      if (showToasts) {
        toast({ 
          title: "Error", 
          description: "An error occurred while logging the measurement.", 
          variant: "destructive"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
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
    } catch (_) {
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
    } catch (_) {
      if (showToasts) {
        toast({
          title: "Error",
          description: "Failed to undo the measurement",
          variant: "destructive"
        })
      }
    }
  }

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

      {/* Measurement Input Controls */}
      {!isLogged && onLogMeasurement && (
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
                onKeyDown={(e) => e.key === 'Enter' && handleLogMeasurement()}
              />
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleLogMeasurement}
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
      )}
    </div>
  )
} 