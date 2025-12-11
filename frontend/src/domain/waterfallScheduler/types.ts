export interface WorkingHours {
  startMinutes: number;
  endMinutes: number;
}

export interface BreakPeriod {
  startMinutes: number;
  endMinutes: number;
  name: string;
}

export interface DayCapacity {
  dateStr: string;
  isWorkingDay: boolean;
  earlyOtEnabled: boolean;
  earlyOtStartMinutes?: number;
  lateOtEnabled: boolean;
  lateOtEndMinutes?: number;
  blocks: ScheduleBlockInfo[];
  workingHours: WorkingHours;
  breaks: BreakPeriod[];
  availableMinutes: number;
}

export interface ScheduleBlockInfo {
  id: string;
  type: 'PublicHoliday' | 'Breakdown' | 'Maintenance' | 'MaterialShortage' | 'GeneralDelay';
  startMinutes: number;
  endMinutes: number;
  isFullDay: boolean;
}

export interface JobSlice {
  allocationId: string;
  dateStr: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  breakMinutes: number;
  efinks: number;
  isFirstDay: boolean;
  isLastDay: boolean;
}

export interface JobAllocation {
  id: string;
  productionId?: string;
  teamId: string;
  orderNumber?: string;
  customerName?: string;
  productionName?: string;
  siteAddress?: string;
  estimatedEfinks: number;
  estimatedDurationMinutes: number;
  spanStartDate: string;
  spanStartMinutes: number;
  spanEndDate?: string;
  spanEndMinutes?: number;
  queuePosition: number;
  status: string;
  isComplete: boolean;
  slices?: JobSlice[];
}

export interface TeamQueue {
  teamId: string;
  teamName: string;
  allocations: JobAllocation[];
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  startMinutes: 420,
  endMinutes: 1020
};

export const EARLY_OT_DEFAULT_START = 360;
export const LATE_OT_DEFAULT_END = 1140;

export const DEFAULT_BREAKS: BreakPeriod[] = [
  { startMinutes: 540, endMinutes: 555, name: 'Morning Tea' },
  { startMinutes: 720, endMinutes: 750, name: 'Lunch' },
  { startMinutes: 870, endMinutes: 885, name: 'Afternoon Tea' }
];

export const OVERTIME_DINNER_BREAK: BreakPeriod = {
  startMinutes: 1020, endMinutes: 1050, name: 'Dinner'
};

export const EFINKS_PER_DAY = 80;
export const WORKING_MINUTES_PER_DAY = 525;
export const MINUTES_PER_EFINK = WORKING_MINUTES_PER_DAY / EFINKS_PER_DAY;
