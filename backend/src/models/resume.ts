import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  userId: string; // Multi-tenant support
  
  // Personal Information
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  
  // Location
  location?: {
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  
  // Professional Info
  currentTitle?: string;
  experience?: number; // Years of experience
  skills?: string[];
  summary?: string;
  
  // Source Information
  sources: Array<{
    type: string; // 'ceipal', 'manual', 'upload', etc.
    id: string; // ID from source system
    url?: string; // Source URL if available
    syncDate: Date;
    rawData?: any; // Store complete raw data from source
  }>;
  
  // Resume Content
  resumeText?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  
  // Work Authorization
  workAuthorization?: string;
  
  // Availability
  availability?: string;
  noticePeriod?: string;
  
  // Salary
  currentSalary?: string;
  expectedSalary?: string;
  
  // Status
  status: 'active' | 'inactive' | 'on-hold' | 'placed';
  
  // Metadata
  tags?: string[];
  notes?: string;
  rating?: number; // 1-5 rating
  
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: String,
      required: true,
      default: 'default-user'
    },
    
    // Personal Information
    firstName: String,
    lastName: String,
    fullName: String,
    email: String,
    phone: String,
    
    // Location
    location: {
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    
    // Professional Info
    currentTitle: String,
    experience: Number,
    skills: [String],
    summary: String,
    
    // Source Information
    sources: [{
      type: { type: String, required: true },
      id: { type: String, required: true },
      url: String,
      syncDate: { type: Date, default: Date.now },
      rawData: Schema.Types.Mixed
    }],
    
    // Resume Content
    resumeText: String,
    resumeUrl: String,
    resumeFileName: String,
    
    // Work Authorization
    workAuthorization: String,
    
    // Availability
    availability: String,
    noticePeriod: String,
    
    // Salary
    currentSalary: String,
    expectedSalary: String,
    
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-hold', 'placed'],
      default: 'active'
    },
    
    // Metadata
    tags: [String],
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
);

// Indexes
resumeSchema.index({ userId: 1 });
resumeSchema.index({ email: 1 });
resumeSchema.index({ status: 1 });
resumeSchema.index({ skills: 1 });
resumeSchema.index({ 'sources.type': 1 });
resumeSchema.index({ 'sources.id': 1 });

export default mongoose.model<IResume>('Resume', resumeSchema);
