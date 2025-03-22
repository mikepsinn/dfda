/**
 * @jest-environment node
 */
import { convertToLocalDateTime, convertToUTC, getUtcDateTimeWithTimezone } from "@/lib/dateTimeWithTimezone";

describe('getUtcDateTimeWithTimezone', () => {
  it('should return the current date and time in UTC with timezone offset applied', () => {
    const result = new Date(getUtcDateTimeWithTimezone()).getTime();
    const date = new Date();
    const jsTimezoneOffsetWest = date.getTimezoneOffset();
    const expectedDate = new Date(date.getTime() - jsTimezoneOffsetWest * 60000).getTime();

    expect(result).toBeCloseTo(expectedDate, -3); // Compare timestamps within 1 second
  });

  it('converts local to UTC', () => {
    // When it's 5:00 in UTC-5, it's 10:00 in UTC
    const localDateTime = "2023-10-01T05:00:00";
    const hoursFromUtc = -5; // UTC-5 (negative means behind UTC)
    const expectedUTCDateTime = "2023-10-01T10:00:00.000Z";

    const result = convertToUTC(localDateTime, hoursFromUtc);
    expect(result).toBe(expectedUTCDateTime);
  });

  it('converts UTC to local', () => {
    // When it's 12:00 in UTC, it's 14:00 in UTC+2
    const utcDateTime = '2023-10-01T12:00:00.000Z';
    const hoursFromUtc = 2; // UTC+2 (positive means ahead of UTC)
    const expectedLocalDateTime = '2023-10-01T14:00:00.000Z';

    const result = convertToLocalDateTime(utcDateTime, hoursFromUtc);
    expect(result).toBe(expectedLocalDateTime);
  });
});
