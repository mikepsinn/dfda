import { tool as createTool } from "ai"
import { z } from "zod"

// Tool for displaying the goal selector component
export const goalSelectorTool = createTool({
  description: "Display a UI component for users to select their health goals",
  parameters: z.object({
    message: z.string().describe("The message to display to the user about selecting health goals"),
  }),
  execute: async ({ message }) => ({ componentType: "goal-selector", message }),
})

// Tool for displaying the condition selector component
export const conditionSelectorTool = createTool({
  description: "Display a UI component for users to select their health conditions",
  parameters: z.object({
    message: z.string().describe("The message to display to the user about selecting health conditions"),
  }),
  execute: async ({ message }) => ({ componentType: "condition-selector", message }),
})

// Tool for displaying the symptom tracker component
export const symptomTrackerTool = createTool({
  description: "Display a UI component for users to track their symptoms",
  parameters: z.object({
    message: z.string().describe("The message to display to the user about tracking symptoms"),
  }),
  execute: async ({ message }) => ({ componentType: "symptom-tracker", message }),
})

// Tool for displaying the meal logger component
export const mealLoggerTool = createTool({
  description: "Display a UI component for users to log their meals",
  parameters: z.object({
    message: z.string().describe("The message to display to the user about logging meals"),
  }),
  execute: async ({ message }) => ({ componentType: "meal-logger", message }),
})

// Tool for displaying the medication logger component
export const medicationLoggerTool = createTool({
  description: "Display a UI component for users to log their medications",
  parameters: z.object({
    message: z.string().describe("The message to display to the user about logging medications"),
  }),
  execute: async ({ message }) => ({ componentType: "medication-logger", message }),
})

// Export all tools together
export const healthTools = {
  displayGoalSelector: goalSelectorTool,
  displayConditionSelector: conditionSelectorTool,
  displaySymptomTracker: symptomTrackerTool,
  displayMealLogger: mealLoggerTool,
  displayMedicationLogger: medicationLoggerTool,
}
