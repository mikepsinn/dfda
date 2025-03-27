import { Bot, Phone, MessageSquare, Brain } from "lucide-react"
import { PatientStep } from "../PatientStep"

export function Step7FDAiAgent() {
  return (
    <PatientStep
      stepNumber={7}
      title="Connect with Your FDAi AI Agent"
      icon={<Bot className="h-5 w-5 text-primary" />}
      description="Receive personalized daily check-ins from your FDAi AI agent that monitors your progress, collects data, and provides insights in a conversational way."
      benefits={[
        "Daily check-ins via phone or text to monitor your well-being",
        "Natural conversation interface for easy data collection",
        "Personalized insights based on your treatment response",
        "Immediate alerts for potential side effects or concerns",
        "Medication reminders and adherence support",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">FDAi Agent</h4>
              <p className="text-sm text-muted-foreground">Your personal health assistant</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                <p className="text-sm">
                  Good morning, Sarah! How are you feeling today after your treatment yesterday?
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start justify-end">
              <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none">
                <p className="text-sm">I'm feeling better today. The headache is gone but I still feel a bit tired.</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="h-4 w-4 text-secondary-foreground" />
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                <p className="text-sm">
                  That's good progress! Your fatigue has decreased by 40% since last week. Would you like to see how
                  your symptoms compare to others in your trial?
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start justify-end">
              <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none">
                <p className="text-sm">Yes, please show me.</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="h-4 w-4 text-secondary-foreground" />
              </div>
            </div>

            <div className="mt-2 text-xs text-center text-muted-foreground">
              Daily check-ins help track your progress and provide personalized insights
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  )
}

