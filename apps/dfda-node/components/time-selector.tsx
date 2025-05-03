'use client'

import React, { useState } from 'react'
import { Clock, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/formatters"

interface TimePreset {
  label: string
  value: string
  icon?: React.ReactNode
  color?: string
}

interface TimeSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  presets?: TimePreset[]
}

// Default time presets that are common for medication
const DEFAULT_PRESETS: TimePreset[] = [
  { label: 'Morning', value: '08:00', icon: '🌅', color: 'bg-amber-100 border-amber-200' },
  { label: 'Noon', value: '12:00', icon: '☀️', color: 'bg-yellow-100 border-yellow-200' },
  { label: 'Afternoon', value: '16:00', icon: '🌤️', color: 'bg-blue-100 border-blue-200' },
  { label: 'Evening', value: '19:00', icon: '🌙', color: 'bg-indigo-100 border-indigo-200' },
  { label: 'Night', value: '22:00', icon: '✨', color: 'bg-purple-100 border-purple-200' },
  { label: 'Bedtime', value: '23:00', icon: '🛌', color: 'bg-slate-100 border-slate-200' },
]

export function TimeSelector({ 
  value, 
  onChange, 
  label = "Select Time",
  presets = DEFAULT_PRESETS 
}: TimeSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>("presets")
  const [hours, minutes] = value.split(':').map(Number);
  
  // Generate hour and minute options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];
  
  // Update time when selecting from the clock interface
  const handleTimeChange = (newHours?: number, newMinutes?: number) => {
    const updatedHours = newHours !== undefined ? newHours : hours;
    const updatedMinutes = newMinutes !== undefined ? newMinutes : minutes;
    
    const formattedTime = `${updatedHours.toString().padStart(2, '0')}:${updatedMinutes.toString().padStart(2, '0')}`;
    onChange(formattedTime);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="clock">Clock</TabsTrigger>
        </TabsList>
        
        {/* Preset time buttons */}
        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant="outline"
                onClick={() => onChange(preset.value)}
                className={cn(
                  "h-auto flex-col py-3 justify-start items-center",
                  value === preset.value ? "border-primary" : preset.color || "",
                  preset.color || ""
                )}
              >
                <div className="text-lg mb-1 hidden sm:block">{preset.icon}</div>
                <div className="font-medium hidden sm:block">{preset.label}</div>
                <div className="text-xs text-muted-foreground">{formatTime(preset.value)}</div>
              </Button>
            ))}
          </div>
        </TabsContent>
        
        {/* Visual clock interface */}
        <TabsContent value="clock" className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Hours */}
            <div className="space-y-2 w-full">
              <Label className="text-center block">Hour</Label>
              <div className="grid grid-cols-6 gap-1">
                {hourOptions.map((h) => (
                  <Button
                    key={`hour-${h}`}
                    type="button"
                    variant={h === hours ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeChange(h)}
                    className="h-9 w-10"
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Minutes */}
            <div className="space-y-2 w-full">
              <Label className="text-center block">Minute</Label>
              <div className="flex justify-center gap-2">
                {minuteOptions.map((m) => (
                  <Button
                    key={`min-${m}`}
                    type="button"
                    variant={m === minutes ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeChange(undefined, m)}
                    className="h-10 w-12"
                  >
                    {m.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Current selection */}
            <div className="mt-4 text-center">
              <div className="text-2xl font-semibold flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {formatTime(value)}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 