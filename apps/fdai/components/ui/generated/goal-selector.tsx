"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function GoalSelector({ onValueChange }: { onValueChange: (value: string[]) => void }) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const goals = ["Improve Energy", "Reduce Pain", "Enhance Mood", "Better Sleep", "Reduce Anxiety", "Improve Digestion"]

  const toggleGoal = (goal: string) => {
    const newSelectedGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter((g) => g !== goal)
      : [...selectedGoals, goal]

    setSelectedGoals(newSelectedGoals)
    onValueChange(newSelectedGoals)
  }

  const handleSubmit = () => {
    if (selectedGoals.length > 0) {
      onValueChange(selectedGoals)
    }
  }

  return (
    <div className="space-y-4 my-4">
      <p className="text-sm font-medium">Select your health goals:</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {goals.map((goal) => (
          <Button
            key={goal}
            variant={selectedGoals.includes(goal) ? "default" : "outline"}
            className="justify-start"
            onClick={() => toggleGoal(goal)}
          >
            {selectedGoals.includes(goal) && <Check className="mr-2 h-4 w-4" />}
            {goal}
          </Button>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={selectedGoals.length === 0} className="w-full">
        Continue
      </Button>
    </div>
  )
}
