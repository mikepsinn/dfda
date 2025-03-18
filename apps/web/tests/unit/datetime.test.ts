/**
 * @jest-environment node
 */
import { convertToLocalDateTime, convertToUTC, getUtcDateTimeWithTimezone } from "@/lib/dateTimeWithTimezone";

describe('getUtcDateTimeWithTimezone', () => {
  it('should return the current date and time in UTC with timezone offset applied', () => {
    const result = getUtcDateTimeWithTimezone();
    const date = new Date();
    const timezoneOffset = date.getTimezoneOffset();
    const expectedDate = new Date(date.getTime() - timezoneOffset * 60000).toISOString();

    expect(result).toBe(expectedDate);
  });

  it('converts local to UTC', () => {
    const localDateTime = "2023-10-01T05:00:00";
    const timezoneOffsetInMinutes = 300; // UTC-5
    const expectedUTCDateTime = "2023-10-01T10:00:00.000Z";

    const result = convertToUTC(localDateTime, timezoneOffsetInMinutes);
    expect(result).toBe(expectedUTCDateTime);
  });
  it('converts UTC to local', () => {
    const utcDateTime = '2023-10-01T12:00:00.000Z';
    const timeZoneOffsetInMinutes = -120; // UTC+2
    const result = convertToLocalDateTime(utcDateTime, timeZoneOffsetInMinutes);
    expect(result).toBe('2023-10-01T10:00:00.000Z');
  });
});
