const API_BASE = '/api/teamdaysettings';

export interface TeamDaySettingsDto {
  id?: string;
  teamId: string;
  workDate: string;
  earlyOtEnabled: boolean;
  earlyOtStartMinutes?: number;
  lateOtEnabled: boolean;
  lateOtEndMinutes?: number;
  isWorkingDay: boolean;
  createdOn?: string;
  modifiedOn?: string;
}

export interface UpsertTeamDaySettingsDto {
  teamId: string;
  workDate: string;
  earlyOtEnabled?: boolean;
  earlyOtStartMinutes?: number;
  lateOtEnabled?: boolean;
  lateOtEndMinutes?: number;
  isWorkingDay?: boolean;
}

export const teamDaySettingsService = {
  async get(teamId: string, dateStr: string): Promise<TeamDaySettingsDto> {
    const response = await fetch(`${API_BASE}/${teamId}/${dateStr}`);
    if (!response.ok) throw new Error('Failed to fetch team day settings');
    return response.json();
  },

  async getRange(params: {
    dateFrom: string;
    dateTo: string;
    teamId?: string;
  }): Promise<TeamDaySettingsDto[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('dateFrom', params.dateFrom);
    searchParams.append('dateTo', params.dateTo);
    if (params.teamId) searchParams.append('teamId', params.teamId);

    const response = await fetch(`${API_BASE}/range?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch team day settings range');
    return response.json();
  },

  async upsert(dto: UpsertTeamDaySettingsDto): Promise<TeamDaySettingsDto> {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) throw new Error('Failed to update team day settings');
    return response.json();
  }
};
