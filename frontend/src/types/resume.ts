export interface UploadedResume {
  id: string;
  fileName: string;
  file: File;
  uploadedAt: string;
  candidateId?: string;
  candidateName?: string;
  score?: number;
}