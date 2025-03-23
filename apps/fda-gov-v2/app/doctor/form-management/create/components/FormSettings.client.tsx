"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FormSettings as FormSettingsType } from "../types"

interface FormSettingsProps {
  settings: FormSettingsType
  onUpdate: (settings: Partial<FormSettingsType>) => void
}

export function FormSettings({ settings, onUpdate }: FormSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Settings</CardTitle>
        <CardDescription>Configure form behavior and data collection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="collect-patient-identifiers"
              checked={settings.collectPatientIdentifiers}
              onCheckedChange={(checked) => onUpdate({ collectPatientIdentifiers: checked })}
            />
            <Label htmlFor="collect-patient-identifiers">Collect patient identifiers</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="timestamp-responses"
              checked={settings.timestampResponses}
              onCheckedChange={(checked) => onUpdate({ timestampResponses: checked })}
            />
            <Label htmlFor="timestamp-responses">Timestamp responses</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="allow-partial-completion"
              checked={settings.allowPartialCompletion}
              onCheckedChange={(checked) => onUpdate({ allowPartialCompletion: checked })}
            />
            <Label htmlFor="allow-partial-completion">Allow partial completion</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-progress-bar"
              checked={settings.showProgressBar}
              onCheckedChange={(checked) => onUpdate({ showProgressBar: checked })}
            />
            <Label htmlFor="show-progress-bar">Show progress bar</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 