import { DateTime } from 'luxon';

/**
 * South Africa timezone (constant UTC+2, no DST)
 */
const SAST_TIMEZONE = 'Africa/Johannesburg';

/**
 * Converts a UTC datetime from API to South Africa Standard Time for display
 * @param utcDate UTC date string or Date object from API
 * @returns Date object in SAST timezone
 */
export const convertUtcToSast = (utcDate: string | Date | null | undefined): Date | undefined => {
  if (!utcDate) return undefined;
  
  const dt = typeof utcDate === 'string' 
    ? DateTime.fromISO(utcDate, { zone: 'utc' })
    : DateTime.fromJSDate(utcDate, { zone: 'utc' });
    
  if (!dt.isValid) return undefined;
  
  return dt.setZone(SAST_TIMEZONE).toJSDate();
};

/**
 * Converts a South Africa datetime from user input to UTC for API submission
 * @param sastDate Date object from DatePicker (local time assumed to be SAST)
 * @returns UTC ISO string with 'Z' suffix for API
 */
export const convertSastToUtc = (sastDate: Date | null | undefined): string | undefined => {
  if (!sastDate) return undefined;
  
  // Treat the incoming date as SAST (even if browser is in different timezone)
  const dt = DateTime.fromJSDate(sastDate, { zone: SAST_TIMEZONE });
  
  if (!dt.isValid) return undefined;
  
  // Convert to UTC and return ISO string with 'Z' suffix
  return dt.toUTC().toISO();
};

/**
 * Formats a UTC datetime as a SAST date string for display
 * @param utcDate UTC date string or Date object from API
 * @param format Luxon format string (default: 'yyyy-MM-dd')
 * @returns Formatted date string in SAST timezone
 */
export const formatUtcAsSast = (
  utcDate: string | Date | null | undefined,
  format: string = 'yyyy-MM-dd'
): string => {
  if (!utcDate) return '';
  
  const dt = typeof utcDate === 'string'
    ? DateTime.fromISO(utcDate, { zone: 'utc' })
    : DateTime.fromJSDate(utcDate, { zone: 'utc' });
    
  if (!dt.isValid) return '';
  
  return dt.setZone(SAST_TIMEZONE).toFormat(format);
};

/**
 * Parses a UTC ISO string from API to Date object for DatePicker (in SAST)
 * @param utcIsoString UTC ISO string from API
 * @returns Date object representing the SAST time
 */
export const parseUtcForDatePicker = (utcIsoString: string | null | undefined): Date | undefined => {
  return convertUtcToSast(utcIsoString);
};

/**
 * Formats a Date object from DatePicker to UTC ISO string for API
 * @param date Date object from DatePicker
 * @returns UTC ISO string with 'Z' suffix
 */
export const formatDatePickerForApi = (date: Date | null | undefined): string => {
  return convertSastToUtc(date) || '';
};

/**
 * Gets the current datetime in South Africa timezone
 * @returns Date object representing current SAST time
 */
export const getCurrentSastDate = (): Date => {
  return DateTime.now().setZone(SAST_TIMEZONE).toJSDate();
};

/**
 * Displays a datetime in South Africa timezone with full format
 * @param utcDate UTC date string or Date object from API
 * @returns Formatted string like "2024-11-24 15:30:45"
 */
export const displaySastDateTime = (utcDate: string | Date | null | undefined): string => {
  return formatUtcAsSast(utcDate, 'yyyy-MM-dd HH:mm:ss');
};

/**
 * Displays a date in South Africa timezone with short format
 * @param utcDate UTC date string or Date object from API
 * @returns Formatted string like "24/11/2024"
 */
export const displaySastDate = (utcDate: string | Date | null | undefined): string => {
  return formatUtcAsSast(utcDate, 'dd/MM/yyyy');
};
