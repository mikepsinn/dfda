const WEEK = 7 * 86_400_000

/** Where a person is in a program: "Week 3 of 12", or "Follow-up due" from the follow-up week on. */
export function programWeek(startedAt: Date, followUpWeeks: number, now = new Date()): string {
  const week = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / WEEK) + 1)
  return week > followUpWeeks ? 'Follow-up due' : `Week ${week} of ${followUpWeeks}`
}
