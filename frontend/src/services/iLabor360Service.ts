import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

export interface ILabor360Config {
  userId: string;
  username: string;
  password: string;
  loginUrl: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionTest?: Date;
  lastError?: string;
  syncEnabled: boolean;
  syncInterval: number;
  autoSync: boolean;
  lastSyncDate?: Date;
  maxRequisitionsPerSync: number;
  maxSubmissionsPerSync: number;
  totalRequisitionsSynced: number;
  totalSubmissionsSynced: number;
  lastSyncRequisitionCount: number;
  lastSyncSubmissionCount: number;
  errorCount: number;
}

export interface SyncStats {
  totalRequisitionsSynced: number;
  totalSubmissionsSynced: number;
  lastSyncDate: Date | null;
  lastSyncRequisitionCount: number;
  lastSyncSubmissionCount: number;
  errorCount: number;
  recentSyncs: Array<{
    date: Date;
    status: string;
    requisitionsAdded: number;
    submissionsAdded: number;
    duration: number;
    errors: number;
  }>;
}

export interface SyncLog {
  _id: string;
  userId: string;
  syncType: 'manual' | 'auto';
  syncStartTime: Date;
  syncEndTime: Date;
  status: 'success' | 'partial' | 'failed';
  requisitionsFound: number;
  requisitionsAdded: number;
  requisitionsUpdated: number;
  requisitionsSkipped: number;
  submissionsFound: number;
  submissionsAdded: number;
  submissionsUpdated: number;
  submissionsSkipped: number;
  errors: Array<any>;
  durationMs: number;
  createdAt: Date;
}

export const iLabor360Service = {
  /**
   * Get configuration
   */
  getConfig: async (userId: string = 'default-user') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ilabor360/config`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Get config error:', error);
      throw error;
    }
  },

  /**
   * Update configuration
   */
  updateConfig: async (config: Partial<ILabor360Config>) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ilabor360/config`, config);
      return response.data;
    } catch (error) {
      console.error('Update config error:', error);
      throw error;
    }
  },

  /**
   * Test connection
   */
  testConnection: async (userId: string = 'default-user') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ilabor360/test-connection`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Test connection error:', error);
      throw error;
    }
  },

  /**
   * Trigger manual sync
   */
  sync: async (userId: string = 'default-user') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ilabor360/sync`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  },

  /**
   * Get sync statistics
   */
  getStats: async (userId: string = 'default-user') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ilabor360/stats`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },

  /**
   * Get sync logs
   */
  getSyncLogs: async (userId: string = 'default-user', limit: number = 20) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ilabor360/sync-logs`, {
        params: { userId, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get sync logs error:', error);
      throw error;
    }
  }
};
