"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SchemaView() {
  // Helper function to get descriptions for tables
  function getTableDescription(table: string): string {
    const descriptions: Record<string, string> = {
      // User Data
      profiles: "Core user profile information",
      goals: "Health goals library",
      user_goals: "User-specific health goals",
      conditions: "Health conditions library",
      user_conditions: "User-specific health conditions",
      notification_preferences: "User notification settings",

      // Health Tracking
      health_logs: "Daily health check-in records",
      symptoms: "Symptom library",
      symptom_logs: "User symptom tracking entries",
      meal_types: "Types of meals (breakfast, lunch, etc.)",
      meals: "User meal records",
      foods: "Food library with nutritional data",
      meal_foods: "Foods included in each meal",
      medications: "Medication library",
      user_medications: "User-specific medications",
      medication_logs: "Medication tracking entries",

      // Communication
      conversations: "Chat conversation sessions",
      messages: "Individual chat messages",
      notification_types: "Types of notifications",
      notifications: "User notifications",

      // Files & Media
      file_types: "Types of files (images, PDFs, etc.)",
      uploads: "User file uploads",
      upload_metadata: "Metadata for uploaded files",

      // Insights & Analysis
      insight_types: "Types of health insights",
      insights: "AI-generated health insights",
      insight_entities: "Entities related to insights",

      // Calls & Scheduling
      call_purposes: "Purposes for scheduled calls",
      call_statuses: "Statuses for scheduled calls",
      scheduled_calls: "Scheduled phone calls",

      // Integrations
      integration_providers: "Third-party integration providers",
      integration_statuses: "Statuses for integrations",
      integrations: "User third-party integrations",
      integration_data_types: "Types of integration data",
      integration_data: "Data from third-party integrations",
    }

    return descriptions[table] || "Table description not available"
  }

  // Group tables by category for better organization
  const getTablesByCategory = () => {
    const categories = {
      "User Data": ["profiles", "goals", "user_goals", "conditions", "user_conditions", "notification_preferences"],
      "Health Tracking": [
        "health_logs",
        "symptoms",
        "symptom_logs",
        "meal_types",
        "meals",
        "foods",
        "meal_foods",
        "medications",
        "user_medications",
        "medication_logs",
      ],
      Communication: ["conversations", "messages", "notification_types", "notifications"],
      "Files & Media": ["file_types", "uploads", "upload_metadata"],
      "Insights & Analysis": ["insight_types", "insights", "insight_entities"],
      "Calls & Scheduling": ["call_purposes", "call_statuses", "scheduled_calls"],
      Integrations: [
        "integration_providers",
        "integration_statuses",
        "integrations",
        "integration_data_types",
        "integration_data",
      ],
    }

    return categories
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relational Database Schema</CardTitle>
        <CardDescription>Fully normalized database structure</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(getTablesByCategory()).map(([category, tables]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3">{category}</h3>
              <ul className="list-disc pl-5 space-y-2">
                {tables.map((table) => (
                  <li key={table}>
                    <strong>{table}</strong> - {getTableDescription(table)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
