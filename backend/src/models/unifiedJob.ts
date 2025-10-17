import mongoose, { Document, Schema } from 'mongoose';

export interface IUnifiedJob extends Document {
  // Basic Info
  title: string;
  description: string;
  company: string;

  // Requirements
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceYears: {
    min: number;
    max: number;
  };
  experienceLevel: string;
  educationRequired?: string;

  // Location & Compensation
  location: string;
  locationType: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };

  // Source Tracking
  sources: Array<{
    type: string;
    id: string;
    url?: string;
    emailId?: string;
    emailSubject?: string;
    senderEmail?: string;
    syncDate: Date;
    metadata?: any;
  }>;

  // Status
  status: string;
  postedDate: Date;
  closingDate?: Date;
  positions: number;

  // Organizational
  department?: string;
  hiringManager?: string;
  recruiterAssigned?: string;
  priority: string;

  // Stats
  applicationsCount: number;
  viewsCount: number;

  // Additional
  tags: string[];
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const unifiedJobSchema = new Schema<IUnifiedJob>(
  {
    // Basic Info
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },

    // Requirements
    requiredSkills: [String],
    niceToHaveSkills: [String],
    experienceYears: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10 }
    },
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal'],
      default: 'Mid'
    },
    educationRequired: String,

    // Location & Compensation
    location: {
      type: String,
      required: true
    },
    locationType: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'onsite'
    },
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },

    // Source Tracking
    sources: [
      {
        type: {
          type: String,
          enum: ['ceipal', 'outlook', 'manual'],
          required: true
        },
        id: String,
        url: String,
        emailId: String,
        emailSubject: String,
        senderEmail: String,
        syncDate: {
          type: Date,
          default: Date.now
        },
        metadata: Schema.Types.Mixed
      }
    ],

    // Status
    status: {
      type: String,
      enum: ['open', 'closed', 'on_hold', 'filled'],
      default: 'open'
    },
    postedDate: {
      type: Date,
      default: Date.now
    },
    closingDate: Date,
    positions: {
      type: Number,
      default: 1
    },

    // Organizational
    department: String,
    hiringManager: String,
    recruiterAssigned: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    // Stats
    applicationsCount: {
      type: Number,
      default: 0
    },
    viewsCount: {
      type: Number,
      default: 0
    },

    // Additional
    tags: [String],
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes
unifiedJobSchema.index({ status: 1 });
unifiedJobSchema.index({ postedDate: -1 });
unifiedJobSchema.index({ 'sources.type': 1 });
unifiedJobSchema.index({ 'sources.id': 1 });
unifiedJobSchema.index({ requiredSkills: 1 });

export default mongoose.model<IUnifiedJob>('UnifiedJob', unifiedJobSchema);
