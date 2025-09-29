export interface CandidateScore {
  overall: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordMatch: number;
  improvements: string[];
  strengths: string[];
}

export interface CandidateData {
  id: string;
  name: string;
  resumes: {
    id: string;
    fileName: string;
    file: File;
    uploadedAt: string;
  }[];
  score?: CandidateScore;
}