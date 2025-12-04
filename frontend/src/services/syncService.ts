const API_BASE = '/api/sync';

export interface SyncResult {
  entity: string;
  recordsFound: number;
  recordsImported: number;
  recordsSkipped: number;
  errors: number;
  errorDetails: string[];
  durationSeconds: number;
  success: boolean;
}

export interface SyncStatus {
  inProgress: boolean;
  lastSync: {
    salesorder?: { lastSyncUtc: string; recordsImported: number };
    cr694_production?: { lastSyncUtc: string; recordsImported: number };
  };
}

export interface SyncHistory {
  id: number;
  entityName: string;
  lastSuccessfulSyncUtc: string | null;
  lastAttemptUtc: string;
  lastAttemptStatus: string;
  recordsImported: number;
  durationSeconds: number;
  errorMessage: string | null;
}

export const syncService = {
  async triggerManualSync(): Promise<{ results: SyncResult[] }> {
    const response = await fetch(`${API_BASE}/d365/trigger`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sync failed');
    }
    return response.json();
  },

  async getStatus(): Promise<SyncStatus> {
    const response = await fetch(`${API_BASE}/d365/status`);
    if (!response.ok) throw new Error('Failed to get sync status');
    return response.json();
  },

  async getHistory(): Promise<SyncHistory[]> {
    const response = await fetch(`${API_BASE}/d365/history`);
    if (!response.ok) throw new Error('Failed to get sync history');
    return response.json();
  }
};
