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
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    // Convert UTC to SAST (GMT+2) for display
    // Add 2 hours (7200000 ms) to convert from UTC to SAST
    const sastDate = new Date(date.getTime() + (2 * 60 * 60 * 1000));
    return sastDate.toISOString().split('T')[0];
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
