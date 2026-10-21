const WEEK = 7 * 86_400_000

/**
 * The largest report file that the care team can add. A valid report (at most
 * 20 panels of 60 markers) is smaller, and the limit stays under the 1 MB body
 * limit of server actions, so that the form can say what is wrong.
 */
export const MAX_REPORT_FILE_BYTES = 900_000

/** Where a person is in a program: "Week 3 of 12", or "Follow-up due" from the follow-up week on. */
export function programWeek(startedAt: Date, followUpWeeks: number, now = new Date()): string {
  const week = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / WEEK) + 1)
  return week > followUpWeeks ? 'Follow-up due' : `Week ${week} of ${followUpWeeks}`
}
