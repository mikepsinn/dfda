"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

type GoalSelectorProps = {
  onSelect: (goals: string[]) => void
}

export function GoalSelector({ onSelect }: GoalSelectorProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const goals = ["Improve Energy", "Reduce Pain", "Enhance Mood", "Better Sleep", "Reduce Anxiety", "Improve Digestion"]

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal))
    } else {
      setSelectedGoals([...selectedGoals, goal])
    }
  }

  return (
    <div className="space-y-4">
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
      <Button onClick={() => onSelect(selectedGoals)} disabled={selectedGoals.length === 0} className="w-full">
        Continue
      </Button>
    </div>
  )
}
