"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type Medication = {
  name: string
  dosage: string
  taken: boolean
  time?: string
}

export function MedicationLogger({ onValueChange }: { onValueChange: (value: Medication[]) => void }) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")

  const addMedication = () => {
    if (name.trim()) {
      const newMedication = {
        name,
        dosage,
        taken: false,
      }
      const updatedMedications = [...medications, newMedication]
      setMedications(updatedMedications)
      setName("")
      setDosage("")
      onValueChange(updatedMedications)
    }
  }

  const toggleMedication = (index: number) => {
    const updatedMedications = [...medications]
    updatedMedications[index].taken = !updatedMedications[index].taken
    if (updatedMedications[index].taken) {
      updatedMedications[index].time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      delete updatedMedications[index].time
    }
    setMedications(updatedMedications)
    onValueChange(updatedMedications)
  }

  return (
    <div className="space-y-4 my-4">
      <p className="text-sm font-medium">Log your medications:</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="med-name">Medication Name</Label>
            <Input
              id="med-name"
              placeholder="Enter medication name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="med-dosage">Dosage</Label>
            <Input
              id="med-dosage"
              placeholder="e.g., 10mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={addMedication} disabled={!name.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {medications.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="font-medium">Today's Medications:</p>
          {medications.map((medication, index) => (
            <div key={index} className="p-3 border rounded-md flex items-center justify-between">
              <div>
                <p className="font-medium">{medication.name}</p>
                {medication.dosage && <p className="text-sm text-gray-500">{medication.dosage}</p>}
              </div>
              <div className="flex items-center space-x-2">
                {medication.taken && medication.time && (
                  <span className="text-sm text-green-600 mr-2">
                    <Check className="h-4 w-4 inline mr-1" />
                    {medication.time}
                  </span>
                )}
                <Switch checked={medication.taken} onCheckedChange={() => toggleMedication(index)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
