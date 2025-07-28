"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface AIProviderSelectorProps {
  initialProvider?: string
  onSave?: (provider: string) => Promise<void>
}

export function AIProviderSelector({ initialProvider = "openai", onSave }: AIProviderSelectorProps) {
  const [provider, setProvider] = useState(initialProvider)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Update local state when prop changes
  useEffect(() => {
    setProvider(initialProvider)
  }, [initialProvider])

  const handleSave = async () => {
    if (!onSave) return

    setIsLoading(true)
    try {
      await onSave(provider)
      toast({
        title: "Settings saved",
        description: `AI provider updated to ${provider}`,
      })
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider</CardTitle>
        <CardDescription>Select which AI provider to use for generating responses</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={provider} onValueChange={setProvider} className="space-y-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="openai" id="openai" />
            <Label htmlFor="openai" className="flex items-center">
              <span className="ml-2">OpenAI (GPT-4o)</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="google" id="google" />
            <Label htmlFor="google" className="flex items-center">
              <span className="ml-2">Google AI (Gemini)</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deepseek" id="deepseek" />
            <Label htmlFor="deepseek" className="flex items-center">
              <span className="ml-2">DeepSeek</span>
            </Label>
          </div>
        </RadioGroup>

        {onSave && (
          <Button onClick={handleSave} className="mt-4" disabled={isLoading || provider === initialProvider}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
