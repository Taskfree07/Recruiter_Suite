import mongoose, { Document, Schema } from 'mongoose';

export interface IILabor360Config extends Document {
  userId: string;

  // REST API v2.0 Authentication
  apiUsername: string;
  apiKey: string; // Encrypted
  apiPassword: string; // Encrypted
  sysUserId: string;
  apiBaseUrl: string;

  // Connection Status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionTest?: Date;
  lastError?: string;
  lastApiToken?: string; // Cached token (15 min validity)
  lastTokenTime?: Date;

  // Sync Settings
  syncEnabled: boolean;
  syncInterval: number; // Minutes
  autoSync: boolean;
  lastSyncDate?: Date;
  syncDateRange: number; // Days (1-3 max)
  useModifiedDate: boolean; // Use modifyStartDate/modifyEndDate instead of StartDate/EndDate

  // Filters
  filterByStatus?: string[];
  filterByLocation?: string[];
  filterByDepartment?: string[];

  // Stats
  totalRequisitionsSynced: number;
  lastSyncRequisitionCount: number;
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

    // REST API v2.0 Authentication
    apiUsername: {
      type: String,
      required: false,
      default: ''
    },
    apiKey: {
      type: String,
      required: false, // Will be encrypted
      default: ''
    },
    apiPassword: {
      type: String,
      required: false, // Will be encrypted
      default: ''
    },
    sysUserId: {
      type: String,
      required: false,
      default: ''
    },
    apiBaseUrl: {
      type: String,
      default: 'https://api.ilabor360.com/v2/rest'
    },

    // Connection Status
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected'
    },
    lastConnectionTest: Date,
    lastError: String,
    lastApiToken: String, // Cached token
    lastTokenTime: Date,

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
    syncDateRange: {
      type: Number,
      default: 1, // 1 day (max 3)
      min: 1,
      max: 3
    },
    useModifiedDate: {
      type: Boolean,
      default: false // Use StartDate/EndDate by default
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
    lastSyncRequisitionCount: {
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
