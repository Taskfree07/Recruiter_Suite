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
  notes?: Array<{
    text: string;
    createdAt: Date;
  }>;

  // Submissions tracking
  submissions?: Array<{
    candidateId: mongoose.Types.ObjectId;
    candidateName: string;
    submittedAt: Date;
    status: string;
    matchScore: number;
    notes?: string;
  }>;

  // Archive
  archived?: boolean;
  archivedAt?: Date;

  // Computed field for source type (primary source)
  source?: string;

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
          enum: ['ceipal', 'outlook', 'manual', 'ilabor360'],
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
    notes: [
      {
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // Submissions tracking
    submissions: [
      {
        candidateId: { type: Schema.Types.ObjectId, ref: 'RecruiterResume' },
        candidateName: String,
        submittedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['submitted', 'screening', 'interviewing', 'offered', 'rejected', 'accepted'],
          default: 'submitted'
        },
        matchScore: Number,
        notes: String
      }
    ],

    // Archive
    archived: { type: Boolean, default: false },
    archivedAt: Date,

    // Computed field for source type (primary source)
    source: String
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
unifiedJobSchema.index({ archived: 1 });
unifiedJobSchema.index({ source: 1 });

// Virtual to compute primary source
unifiedJobSchema.pre('save', function(next) {
  if (this.sources && this.sources.length > 0) {
    // Set primary source to the first source type
    this.source = this.sources[0].type;
  }
  next();
});

export default mongoose.model<IUnifiedJob>('UnifiedJob', unifiedJobSchema);
