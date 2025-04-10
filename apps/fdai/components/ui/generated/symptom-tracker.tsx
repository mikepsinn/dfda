"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

type Symptom = {
  name: string
  severity: number
}

export function SymptomTracker({ onValueChange }: { onValueChange: (value: Symptom[]) => void }) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [newSymptom, setNewSymptom] = useState("")

  const addSymptom = () => {
    if (newSymptom.trim()) {
      const updatedSymptoms = [...symptoms, { name: newSymptom, severity: 3 }]
      setSymptoms(updatedSymptoms)
      setNewSymptom("")
      onValueChange(updatedSymptoms)
    }
  }

  const updateSeverity = (index: number, severity: number) => {
    const updatedSymptoms = [...symptoms]
    updatedSymptoms[index].severity = severity
    setSymptoms(updatedSymptoms)
    onValueChange(updatedSymptoms)
  }

  return (
    <div className="space-y-4 my-4">
      <p className="text-sm font-medium">Track your symptoms:</p>

      <div className="flex space-x-2">
        <Input
          placeholder="Enter symptom"
          value={newSymptom}
          onChange={(e) => setNewSymptom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addSymptom()
            }
          }}
        />
        <Button onClick={addSymptom} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {symptoms.length > 0 && (
        <div className="space-y-4">
          {symptoms.map((symptom, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <Label>{symptom.name}</Label>
                <span className="text-sm font-medium">{symptom.severity}/5</span>
              </div>
              <Slider
                value={[symptom.severity]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => updateSeverity(index, value[0])}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
