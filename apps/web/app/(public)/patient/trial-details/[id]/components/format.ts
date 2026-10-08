// Display text for the codes stored in the trials table.

// "pending_approval" → "Pending approval"
export function formatTrialStatus(status: string) {
  const text = status.replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "phase_2" → "Phase 2"
export function formatTrialPhase(phase: string) {
  return phase.replace(/^phase_(\d)$/, "Phase $1")
}

// Start and end dates are calendar dates, stored as midnight UTC. Format them in UTC so that the day does not shift.
export function formatTrialDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}
