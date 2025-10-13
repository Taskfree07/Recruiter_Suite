import { UploadedResume } from '../types/resume';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

export interface ScoreBreakdown {
  overall: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordMatch: number;
}

export interface ScoringResult {
  score: ScoreBreakdown;
  improvements: string[];
  strengths: string[];
}

export const checkResumeFit = async (
  jobId: string,
  resumes: UploadedResume[]
): Promise<UploadedResume[]> => {
  try {
    // Create form data with resumes and job ID
    const formData = new FormData();
    formData.append('jobId', jobId);
    
    resumes.forEach((resume) => {
      if (resume.file instanceof File) {
        formData.append('resumes', resume.file, resume.fileName);
      }
    });

    // Send the resumes for scoring
    const response = await axios.post<{
      results: Array<{
        resumeId: string;
        score: ScoreBreakdown;
        improvements: string[];
        strengths: string[];
      }>;
    }>(`${API_URL}/scoring/check-fit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Map the scores back to the resumes
    return resumes.map((resume) => {
      const result = response.data.results.find(
        (r) => r.resumeId === resume.id
      );
      
      if (result) {
        return {
          ...resume,
          score: result.score.overall,
          scoreBreakdown: result.score,
          improvements: result.improvements,
          strengths: result.strengths,
        };
      }
      
      return resume;
    });
  } catch (error) {
    console.error('Error checking resume fit:', error);
    throw error;
  }
};