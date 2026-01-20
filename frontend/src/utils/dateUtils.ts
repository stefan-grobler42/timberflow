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

const sastFormatter = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export const formatIsoDateLocal = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  try {
    let utcDateStr = dateStr;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
      utcDateStr = dateStr + 'T00:00:00Z';
    } else if (!dateStr.endsWith('Z') && dateStr.includes('T')) {
      utcDateStr = dateStr + 'Z';
    }
    
    const date = new Date(utcDateStr);
    if (isNaN(date.getTime())) return null;
    
    const parts = sastFormatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    if (!year || !month || !day) {
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
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  
  // Get day of week for first day (0 = Sunday)
  const firstDayOfWeek = firstDayOfMonth.getUTCDay();
  
  // Calculate the start of the first complete week (go back to Sunday)
  const calendarStart = new Date(firstDayOfMonth);
  calendarStart.setUTCDate(calendarStart.getUTCDate() - firstDayOfWeek);
  
  // Get day of week for last day
  const lastDayOfWeek = lastDayOfMonth.getUTCDay();
  
  // Calculate the end of the last complete week (go forward to Saturday)
  const calendarEnd = new Date(lastDayOfMonth);
  calendarEnd.setUTCDate(calendarEnd.getUTCDate() + (6 - lastDayOfWeek));
  
  const days: string[] = [];
  for (let d = new Date(calendarStart); d <= calendarEnd; d.setUTCDate(d.getUTCDate() + 1)) {
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
