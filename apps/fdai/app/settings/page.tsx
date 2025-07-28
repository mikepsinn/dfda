import { Suspense } from "react"
import { AIProviderSelector } from "@/components/settings/ai-provider-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAIProvider } from "@/lib/env"
import { updateAIProviderSetting } from "@/app/actions/settings-actions"
import { DebugModeToggle } from "@/components/dev/debug-mode-toggle"

export default function SettingsPage() {
  const currentProvider = getAIProvider()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6">
        <Suspense fallback={<SettingsCardSkeleton />}>
          <AIProviderSelector initialProvider={currentProvider} onSave={updateAIProviderSetting} />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>About AI Providers</CardTitle>
            <CardDescription>Information about the different AI providers available</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">OpenAI (GPT-4o)</h3>
              <p className="text-sm text-muted-foreground">
                OpenAI's GPT-4o model provides high-quality responses with strong reasoning capabilities. Requires an
                OpenAI API key.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Google AI (Gemini)</h3>
              <p className="text-sm text-muted-foreground">
                Google's Gemini models offer excellent performance with strong multimodal capabilities. Requires a
                Google AI API key.
              </p>
            </div>

            <div>
              <h3 className="font-medium">DeepSeek</h3>
              <p className="text-sm text-muted-foreground">
                DeepSeek provides powerful open models with good performance and cost-effectiveness. Requires a DeepSeek
                API key.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Developer Settings</h3>
        <DebugModeToggle />
      </div>
    </div>
  )
}

function SettingsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-5 w-full bg-muted rounded animate-pulse" />
          <div className="h-5 w-full bg-muted rounded animate-pulse" />
          <div className="h-5 w-full bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
