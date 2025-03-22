export function getUtcDateTimeWithTimezone() {
  const date = new Date()
  const jsTimezoneOffsetWest = date.getTimezoneOffset() // JS returns minutes WEST of UTC
  return new Date(date.getTime() - jsTimezoneOffsetWest * 60000).toISOString()
}

export function convertToUTC(localDateTime: string, hoursFromUtc: number) {
  // hoursFromUtc: positive means ahead of UTC (e.g. +2 for UTC+2)
  //               negative means behind UTC (e.g. -5 for UTC-5)
  
  // Parse the local time components
  const [year, month, day, hours, minutes, seconds] = localDateTime
    .split(/[-T:]/)
    .map(Number)
  
  // Create Date in UTC by specifying components in UTC
  const localDate = Date.UTC(year, month - 1, day, hours, minutes, seconds)
  const offsetMs = hoursFromUtc * 60 * 60 * 1000 // Convert hours to milliseconds
  
  // To get UTC from local: subtract hours ahead, add hours behind
  return new Date(localDate - offsetMs).toISOString()
}

export function throwErrorIfDateInFuture(utcDateTime: string) {
  const localDate = new Date(utcDateTime)
  const now = new Date()
  if (localDate > now) {
    throw new Error("Date cannot be in the future")
  }
}

export function getUtcDateTime() {
  return new Date().toISOString()
}

export function getTimeZoneOffset() {
  return new Date().getTimezoneOffset()
}

export function convertToLocalDateTime(
  utcDateTime: string | number | Date,
  hoursFromUtc: number
) {
  // hoursFromUtc: positive means ahead of UTC (e.g. +2 for UTC+2)
  //               negative means behind UTC (e.g. -5 for UTC-5)
  const utcDate = new Date(utcDateTime)
  const offsetMs = hoursFromUtc * 60 * 60 * 1000 // Convert hours to milliseconds
  // To get local from UTC: add hours ahead, subtract hours behind
  const localDate = new Date(
    utcDate.getTime() + offsetMs
  )
  return localDate.toISOString()
}
