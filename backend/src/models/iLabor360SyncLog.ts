import mongoose, { Document, Schema } from 'mongoose';

export interface IILabor360SyncLog extends Document {
  userId: string;
  syncType: 'manual' | 'auto';
  syncStartTime: Date;
  syncEndTime: Date;
  status: 'success' | 'partial' | 'failed';

  // Requisitions Results
  requisitionsFound: number;
  requisitionsAdded: number;
  requisitionsUpdated: number;
  requisitionsSkipped: number;

  // Submissions Results
  submissionsFound: number;
  submissionsAdded: number;
  submissionsUpdated: number;
  submissionsSkipped: number;

  // Errors
  syncErrors: Array<{
    itemId?: string;
    itemType: 'requisition' | 'submission';
    error: string;
    timestamp: Date;
  }>;

  // Performance
  durationMs: number;

  // Session Info
  sessionId?: string;

  createdAt: Date;
}

const iLabor360SyncLogSchema = new Schema<IILabor360SyncLog>(
  {
    userId: {
      type: String,
      required: true,
      default: 'default-user'
    },

    syncType: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual'
    },

    syncStartTime: {
      type: Date,
      required: true
    },

    syncEndTime: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      required: true
    },

    // Requisitions Results
    requisitionsFound: {
      type: Number,
      default: 0
    },
    requisitionsAdded: {
      type: Number,
      default: 0
    },
    requisitionsUpdated: {
      type: Number,
      default: 0
    },
    requisitionsSkipped: {
      type: Number,
      default: 0
    },

    // Submissions Results
    submissionsFound: {
      type: Number,
      default: 0
    },
    submissionsAdded: {
      type: Number,
      default: 0
    },
    submissionsUpdated: {
      type: Number,
      default: 0
    },
    submissionsSkipped: {
      type: Number,
      default: 0
    },

    // Errors
    syncErrors: [
      {
        itemId: String,
        itemType: {
          type: String,
          enum: ['requisition', 'submission']
        },
        error: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Performance
    durationMs: {
      type: Number,
      required: true
    },

    // Session Info
    sessionId: String
  },
  {
    timestamps: true
  }
);

// Indexes
iLabor360SyncLogSchema.index({ userId: 1, createdAt: -1 });
iLabor360SyncLogSchema.index({ status: 1 });
iLabor360SyncLogSchema.index({ syncType: 1 });

export default mongoose.model<IILabor360SyncLog>('ILabor360SyncLog', iLabor360SyncLogSchema);
