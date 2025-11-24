export const startOfMonthUtc = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  return firstDay.toISOString().split('T')[0];
};

export const startOfWeekUtc = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  return monday.toISOString().split('T')[0];
};

export const formatIsoDateLocal = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  try {
    // Ensure we're parsing as UTC by appending 'Z' if not already present
    let utcDateStr = dateStr;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
      // If it's just a date string like "2024-11-24", treat it as UTC midnight
      utcDateStr = dateStr + 'T00:00:00Z';
    } else if (!dateStr.endsWith('Z') && dateStr.includes('T')) {
      // If it has a time but no timezone, assume UTC
      utcDateStr = dateStr + 'Z';
    }
    
    const date = new Date(utcDateStr);
    if (isNaN(date.getTime())) return null;
    
    // Convert UTC to SAST (Africa/Johannesburg, GMT+2) for display
    // Use Intl.DateTimeFormat to properly handle timezone conversion
    const formatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    // Guard against missing parts
    if (!year || !month || !day) {
      console.warn('[dateUtils] formatIsoDateLocal: Missing date parts', { year, month, day });
      return null;
    }
    
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

export const addMonths = (dateStr: string, months: number): string => {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().split('T')[0];
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

export const getDaysInMonth = (dateStr: string): string[] => {
  const date = new Date(dateStr + 'T00:00:00Z');
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  
  const days: string[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

export const getDaysInWeek = (weekStartDateStr: string): string[] => {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStartDateStr, i));
  }
  return days;
};
