"use client"

import { useState, useEffect } from "react"
import { GoalSelector } from "@/components/ui/generated/goal-selector"
import { ConditionSelector } from "@/components/ui/generated/condition-selector"
import { SymptomTracker } from "@/components/ui/generated/symptom-tracker"
import { MealLogger } from "@/components/ui/generated/meal-logger"
import { MedicationLogger } from "@/components/ui/generated/medication-logger"

interface UIComponentRendererProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
    toolCall?: {
      name: string
      args: any
      result: any
    }
  }
  saveUserData: (key: string, data: any) => Promise<void>
  append: (message: { role: "user" | "assistant"; content: string }) => void
  setActiveComponent: (component: string | null) => void
}

export function UIComponentRenderer({ message, saveUserData, append, setActiveComponent }: UIComponentRendererProps) {
  const [isComponentVisible, setIsComponentVisible] = useState(false)

  // Delay component rendering for a better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  // If there's no tool call, just render the content
  if (!message.toolCall || !message.toolCall.result) {
    return <div dangerouslySetInnerHTML={{ __html: message.content }} />
  }

  const { componentType } = message.toolCall.result
  const clientMessage = message.toolCall.result.message || ""

  // Render text content
  const textContent = <div dangerouslySetInnerHTML={{ __html: message.content }} />

  // Only show component if it's visible (after delay)
  if (!isComponentVisible) {
    return textContent
  }

  // Render appropriate UI component based on component type
  switch (componentType) {
    case "goal-selector":
      return (
        <div>
          {textContent}
          <GoalSelector
            onValueChange={async (goals) => {
              try {
                // Add user message
                append({
                  role: "user",
                  content: `I want to focus on: ${goals.join(", ")}`,
                })

                // Reset active component
                setActiveComponent(null)

                // Save goals
                await saveUserData("goals", goals)
              } catch (error) {
                console.error("Error handling goals selection:", error)
              }
            }}
          />
        </div>
      )

    case "condition-selector":
      return (
        <div>
          {textContent}
          <ConditionSelector
            onValueChange={async (conditions) => {
              try {
                // Add user message
                append({
                  role: "user",
                  content: `My health conditions are: ${conditions.join(", ")}`,
                })

                // Reset active component
                setActiveComponent(null)

                // Save conditions
                await saveUserData("conditions", conditions)
              } catch (error) {
                console.error("Error handling conditions selection:", error)
              }
            }}
          />
        </div>
      )

    case "symptom-tracker":
      return (
        <div>
          {textContent}
          <SymptomTracker
            onValueChange={(symptoms) => {
              // Add user message with symptom data
              append({
                role: "user",
                content: `I'm tracking these symptoms: ${JSON.stringify(symptoms)}`,
              })

              // Reset active component
              setActiveComponent(null)
            }}
          />
        </div>
      )

    case "meal-logger":
      return (
        <div>
          {textContent}
          <MealLogger
            onValueChange={(meals) => {
              // Add user message with meal data
              append({
                role: "user",
                content: `I had these meals: ${JSON.stringify(meals)}`,
              })

              // Reset active component
              setActiveComponent(null)
            }}
          />
        </div>
      )

    case "medication-logger":
      return (
        <div>
          {textContent}
          <MedicationLogger
            onValueChange={(medications) => {
              // Add user message with medication data
              append({
                role: "user",
                content: `My medications: ${JSON.stringify(medications)}`,
              })

              // Reset active component
              setActiveComponent(null)
            }}
          />
        </div>
      )

    default:
      // Just render the content if component type is unknown
      return textContent
  }
}
