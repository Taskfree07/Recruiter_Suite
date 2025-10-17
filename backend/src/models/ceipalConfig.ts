import mongoose, { Document, Schema } from 'mongoose';

export interface ICeipalConfig extends Document {
  userId: string;

  // API Configuration
  apiKey: string;
  apiUrl: string;
  apiVersion: string;

  // Connection Status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastError?: string;

  // Sync Settings
  syncEnabled: boolean;
  syncInterval: number; // Minutes
  lastSyncDate?: Date;

  // Sync Scope
  syncJobs: boolean;
  syncCandidates: boolean;
  syncApplications: boolean;

  // Mock Mode (for testing without real API)
  mockMode: boolean;
  mockDataGenerated?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ceipalConfigSchema = new Schema<ICeipalConfig>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: 'default-user'
    },

    // API Configuration
    apiKey: {
      type: String,
      required: false,
      default: 'MOCK_API_KEY'
    },
    apiUrl: {
      type: String,
      default: 'https://api.ceipal.com/v1'
    },
    apiVersion: {
      type: String,
      default: 'v1'
    },

    // Connection Status
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected'
    },
    lastError: String,

    // Sync Settings
    syncEnabled: {
      type: Boolean,
      default: false
    },
    syncInterval: {
      type: Number,
      default: 30 // 30 minutes
    },
    lastSyncDate: Date,

    // Sync Scope
    syncJobs: {
      type: Boolean,
      default: true
    },
    syncCandidates: {
      type: Boolean,
      default: true
    },
    syncApplications: {
      type: Boolean,
      default: true
    },

    // Mock Mode
    mockMode: {
      type: Boolean,
      default: true
    },
    mockDataGenerated: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ICeipalConfig>('CeipalConfig', ceipalConfigSchema);
