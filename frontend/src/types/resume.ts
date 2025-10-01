export interface UploadedResume {
  id: string;
  fileName: string;
  file: File | null;
  filePath?: string;
  uploadedAt: string;
  candidateId?: string;
  candidateName?: string;
  score?: number;
}