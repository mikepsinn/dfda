"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Meal = {
  type: string
  description: string
  time: string
}

export function MealLogger({ onValueChange }: { onValueChange: (value: Meal[]) => void }) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [mealType, setMealType] = useState("breakfast")
  const [description, setDescription] = useState("")
  const [time, setTime] = useState("")

  const addMeal = () => {
    if (description.trim()) {
      const newMeal = {
        type: mealType,
        description,
        time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      const updatedMeals = [...meals, newMeal]
      setMeals(updatedMeals)
      setDescription("")
      onValueChange(updatedMeals)
    }
  }

  return (
    <div className="space-y-4 my-4">
      <p className="text-sm font-medium">Log your meals:</p>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger id="meal-type">
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="meal-time">Time</Label>
            <Input id="meal-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Photo
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="meal-description">Description</Label>
          <Textarea
            id="meal-description"
            placeholder="Describe what you ate..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button onClick={addMeal} disabled={!description.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {meals.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="font-medium">Today's Meals:</p>
          {meals.map((meal, index) => (
            <div key={index} className="p-3 border rounded-md">
              <div className="flex justify-between">
                <span className="font-medium capitalize">{meal.type}</span>
                <span className="text-sm text-gray-500">{meal.time}</span>
              </div>
              <p className="text-sm mt-1">{meal.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
