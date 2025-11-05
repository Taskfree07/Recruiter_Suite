import mongoose, { Document, Schema } from 'mongoose';

interface ICeipalFieldMapping {
  fieldName: string;
  fieldRename: string;
  mandatory: boolean;
  includingInApi: boolean;
}

export interface ICeipalConfig extends Document {
  userId: string;

  // User Credentials (for login-based authentication)
  username?: string;
  password?: string; // Encrypted in production

  // API Configuration
  apiKey: string;
  accessToken?: string; // OAuth/Bearer token for Ceipal API
  resumeApiUrl?: string; // User's configured resume API endpoint

  // Field Mappings (which fields to fetch from API)
  fieldMappings?: ICeipalFieldMapping[];

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

    // User Credentials
    username: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: false
      // TODO: Encrypt this in production using crypto
    },

    // API Configuration
    apiKey: {
      type: String,
      required: false,
      default: 'MOCK_API_KEY'
    },
    accessToken: {
      type: String,
      required: false
    },
    resumeApiUrl: {
      type: String,
      required: false
    },

    // Field Mappings
    fieldMappings: [{
      fieldName: { type: String, required: true },
      fieldRename: { type: String, required: true },
      mandatory: { type: Boolean, default: false },
      includingInApi: { type: Boolean, default: true }
    }],

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
