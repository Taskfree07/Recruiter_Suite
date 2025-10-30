import mongoose, { Schema, Document } from 'mongoose';

export interface IRecruiterResume extends Document {
  // Personal Information
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    currentCompany?: string;
  };

  // Professional Details
  professionalDetails: {
    totalExperience: number; // in years
    currentJobTitle?: string;
    currentCTC?: string;
    expectedCTC?: string;
    noticePeriod?: string; // "Immediate", "15 days", "30 days", etc.
  };

  // Skills Categorization (Primary feature)
  skills: {
    primary: string[]; // Main skills (Java, Python, React, etc.)
    secondary: string[]; // Supporting skills
    frameworks: string[];
    databases: string[];
    cloudPlatforms: string[];
    tools: string[];
  };

  // Categorization
  categories: {
    primaryCategory: string; // "Backend Development", "Frontend Development", etc.
    specificSkills: string[]; // ["Java", "Python"] - for folder organization
    experienceLevel: string; // "Junior (0-2)", "Mid-Level (2-5)", "Senior (5+)"
  };

  // Experience
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    description?: string;
  }>;

  // Education
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    cgpa?: string;
  }>;

  // Certifications
  certifications: string[];

  // Projects
  projects: Array<{
    title: string;
    technologies: string[];
    description?: string;
  }>;

  // Source Information (Email metadata)
  source: {
    type: string; // "email", "manual_upload", "portal", "outlook"
    email?: string; // Sender email
    subject?: string; // Email subject
    receivedDate?: Date;
    emailBody?: string; // Excerpt from email
    outlookMessageId?: string; // Outlook message ID
    syncedBy?: string; // User who synced (for Outlook/Ceipal)
  };

  // File Information
  file: {
    fileName: string;
    filePath: string;
    fileUrl?: string;
    fileType: string; // "pdf", "docx", "doc"
  };

  // Scoring
  scores: {
    overall: number; // 0-100
    skillRelevance: number;
    experienceQuality: number;
    educationScore: number;
    freshnessScore: number;
    resumeQuality: number;
  };

  // Status & Tags
  status: 'active' | 'shortlisted' | 'rejected' | 'archived' | 'pending_review';
  tags: string[];

  // Metadata
  rawText: string;
  processed: boolean;
  processingErrors?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const RecruiterResumeSchema: Schema = new Schema({
  personalInfo: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    location: String,
    linkedIn: String,
    currentCompany: String
  },

  professionalDetails: {
    totalExperience: { type: Number, default: 0 },
    currentJobTitle: String,
    currentCTC: String,
    expectedCTC: String,
    noticePeriod: String
  },

  skills: {
    primary: [String],
    secondary: [String],
    frameworks: [String],
    databases: [String],
    cloudPlatforms: [String],
    tools: [String]
  },

  categories: {
    primaryCategory: String,
    specificSkills: [String],
    experienceLevel: String
  },

  experience: [{
    company: String,
    title: String,
    duration: String,
    description: String
  }],

  education: [{
    degree: String,
    institution: String,
    year: String,
    cgpa: String
  }],

  certifications: [String],

  projects: [{
    title: String,
    technologies: [String],
    description: String
  }],

  source: {
    type: { type: String, required: true },
    email: String,
    subject: String,
    receivedDate: Date,
    emailBody: String,
    outlookMessageId: String,
    syncedBy: String
  },

  file: {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileUrl: String,
    fileType: String
  },

  scores: {
    overall: { type: Number, default: 0 },
    skillRelevance: { type: Number, default: 0 },
    experienceQuality: { type: Number, default: 0 },
    educationScore: { type: Number, default: 0 },
    freshnessScore: { type: Number, default: 0 },
    resumeQuality: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ['active', 'shortlisted', 'rejected', 'archived', 'pending_review'],
    default: 'pending_review'
  },

  tags: [String],

  rawText: String,
  processed: { type: Boolean, default: false },
  processingErrors: [String]
}, {
  timestamps: true
});

// Indexes for faster queries
RecruiterResumeSchema.index({ 'categories.specificSkills': 1 });
RecruiterResumeSchema.index({ 'categories.experienceLevel': 1 });
RecruiterResumeSchema.index({ 'personalInfo.email': 1 });
RecruiterResumeSchema.index({ status: 1 });
RecruiterResumeSchema.index({ createdAt: -1 });

export default mongoose.model<IRecruiterResume>('RecruiterResume', RecruiterResumeSchema);
