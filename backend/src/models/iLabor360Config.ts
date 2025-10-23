import mongoose, { Document, Schema } from 'mongoose';

export interface IILabor360Config extends Document {
  userId: string;

  // Authentication
  username: string;
  password: string; // Encrypted
  loginUrl: string;

  // Connection Status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionTest?: Date;
  lastError?: string;

  // Sync Settings
  syncEnabled: boolean;
  syncInterval: number; // Minutes
  autoSync: boolean;
  lastSyncDate?: Date;

  // Scraping Config
  requisitionsUrl?: string;
  submissionsUrl?: string;
  maxRequisitionsPerSync: number;
  maxSubmissionsPerSync: number;
  scrapingTimeout: number; // Seconds

  // Filters
  filterByStatus?: string[];
  filterByLocation?: string[];
  filterByDepartment?: string[];

  // Stats
  totalRequisitionsSynced: number;
  totalSubmissionsSynced: number;
  lastSyncRequisitionCount: number;
  lastSyncSubmissionCount: number;
  errorCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const iLabor360ConfigSchema = new Schema<IILabor360Config>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: 'default-user'
    },

    // Authentication
    username: {
      type: String,
      required: false,
      default: ''
    },
    password: {
      type: String,
      required: false, // Will be encrypted
      default: ''
    },
    loginUrl: {
      type: String,
      default: 'https://vendor.ilabor360.com/login'
    },

    // Connection Status
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected'
    },
    lastConnectionTest: Date,
    lastError: String,

    // Sync Settings
    syncEnabled: {
      type: Boolean,
      default: true
    },
    syncInterval: {
      type: Number,
      default: 30 // 30 minutes
    },
    autoSync: {
      type: Boolean,
      default: false
    },
    lastSyncDate: Date,

    // Scraping Config
    requisitionsUrl: String,
    submissionsUrl: String,
    maxRequisitionsPerSync: {
      type: Number,
      default: 100
    },
    maxSubmissionsPerSync: {
      type: Number,
      default: 100
    },
    scrapingTimeout: {
      type: Number,
      default: 60 // seconds
    },

    // Filters
    filterByStatus: [String],
    filterByLocation: [String],
    filterByDepartment: [String],

    // Stats
    totalRequisitionsSynced: {
      type: Number,
      default: 0
    },
    totalSubmissionsSynced: {
      type: Number,
      default: 0
    },
    lastSyncRequisitionCount: {
      type: Number,
      default: 0
    },
    lastSyncSubmissionCount: {
      type: Number,
      default: 0
    },
    errorCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
iLabor360ConfigSchema.index({ userId: 1 });
iLabor360ConfigSchema.index({ connectionStatus: 1 });

export default mongoose.model<IILabor360Config>('ILabor360Config', iLabor360ConfigSchema);
