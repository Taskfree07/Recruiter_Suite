import mongoose, { Schema, Document } from 'mongoose';

export interface IOutlookConfig extends Document {
  userId: string;

  // OAuth Tokens
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;

  // Email Settings
  emailAddress: string;
  emailFolders: string[];

  // Sync Settings
  syncEnabled: boolean;
  syncInterval: number;
  lastSyncDate?: Date;

  // Filters
  filterSenders: string[];
  filterSubjectKeywords: string[];

  // Status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastError?: string;

  createdAt: Date;
  updatedAt: Date;
}

const outlookConfigSchema = new Schema<IOutlookConfig>({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: 'default-user'
  },

  // OAuth Tokens (encrypted in production)
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },

  // Email Settings
  emailAddress: {
    type: String,
    required: true
  },
  emailFolders: {
    type: [String],
    default: ['Inbox']
  },

  // Sync Settings
  syncEnabled: {
    type: Boolean,
    default: true
  },
  syncInterval: {
    type: Number,
    default: 30 // minutes
  },
  lastSyncDate: {
    type: Date
  },

  // Filters
  filterSenders: {
    type: [String],
    default: []
  },
  filterSubjectKeywords: {
    type: [String],
    default: ['job', 'position', 'opening', 'resume', 'cv', 'application']
  },

  // Status
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  lastError: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
outlookConfigSchema.index({ userId: 1 });
outlookConfigSchema.index({ emailAddress: 1 });
outlookConfigSchema.index({ connectionStatus: 1 });

export default mongoose.model<IOutlookConfig>('OutlookConfig', outlookConfigSchema);
