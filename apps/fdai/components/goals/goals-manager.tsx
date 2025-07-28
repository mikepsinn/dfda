"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserGoals, addUserGoal, removeUserGoal } from "@/app/actions/goals-actions"

interface GoalsManagerProps {
  userId: string
}

export function GoalsManager({ userId }: GoalsManagerProps) {
  const [goals, setGoals] = useState<string[]>([])
  const [newGoal, setNewGoal] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)

  // Suggested goals that users can quickly add
  const suggestedGoals = [
    "Improve Energy",
    "Reduce Pain",
    "Enhance Mood",
    "Better Sleep",
    "Reduce Anxiety",
    "Improve Digestion",
    "Lower Blood Pressure",
    "Manage Blood Sugar",
    "Reduce Inflammation",
    "Improve Focus",
  ]

  // Filter out already selected goals
  const availableSuggestedGoals = suggestedGoals.filter((goal) => !goals.includes(goal))

  // Load user's goals
  useEffect(() => {
    async function loadGoals() {
      try {
        setIsLoading(true)
        setError(null)
        const userGoals = await getUserGoals(userId)
        setGoals(userGoals)
      } catch (err) {
        console.error("Error loading goals:", err)
        setError("Failed to load your goals. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadGoals()
  }, [userId])

  // Handle adding a new goal
  const handleAddGoal = async (goalName: string = newGoal) => {
    if (!goalName.trim()) return

    try {
      setIsAdding(true)
      setError(null)
      setSuccess(null)

      // Check if goal already exists
      if (goals.includes(goalName)) {
        setError(`"${goalName}" is already in your goals`)
        return
      }

      const result = await addUserGoal(userId, goalName)

      if (result.success) {
        setGoals([...goals, goalName])
        setNewGoal("")
        setSuccess(`Added "${goalName}" to your goals`)
      } else {
        setError(result.error || "Failed to add goal")
      }
    } catch (err) {
      console.error("Error adding goal:", err)
      setError("Failed to add goal. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  // Handle removing a goal
  const handleRemoveGoal = async (goalName: string) => {
    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(null)

      const result = await removeUserGoal(userId, goalName)

      if (result.success) {
        setGoals(goals.filter((g) => g !== goalName))
        setSuccess(`Removed "${goalName}" from your goals`)
      } else {
        setError(result.error || "Failed to remove goal")
      }
    } catch (err) {
      console.error("Error removing goal:", err)
      setError("Failed to remove goal. Please try again.")
    } finally {
      setIsDeleting(false)
      setGoalToDelete(null)
    }
  }

  // Clear messages after a delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [success, error])

  return (
    <div className="space-y-8">
      {/* Feedback messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current goals */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Current Goals</h2>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              You haven't set any health goals yet. Add goals to get personalized insights.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <div
                key={goal}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <span>{goal}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGoalToDelete(goal)}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete {goal}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new goal */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Add New Goal</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a new health goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                disabled={isAdding}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGoal.trim()) {
                    handleAddGoal()
                  }
                }}
              />
              <Button onClick={() => handleAddGoal()} disabled={!newGoal.trim() || isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {isAdding ? "Adding..." : "Add"}
              </Button>
            </div>

            {availableSuggestedGoals.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Or select from suggested goals:</p>
                <div className="flex flex-wrap gap-2">
                  {availableSuggestedGoals.map((goal) => (
                    <Badge
                      key={goal}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddGoal(goal)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{goalToDelete}" from your health goals. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => goalToDelete && handleRemoveGoal(goalToDelete)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
