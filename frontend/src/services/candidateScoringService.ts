import { CandidateData } from '../types/candidate';
import { UploadedResume } from '../types/resume';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface CandidateScoreBreakdown {
  overall: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordMatch: number;
  improvements: string[];
  strengths: string[];
}

export interface CandidateScoringResult {
  candidateId: string;
  candidateName: string;
  score: CandidateScoreBreakdown;
}

export const checkCandidateFit = async (
  jobId: string,
  candidates: CandidateData[]
): Promise<CandidateScoringResult[]> => {
  try {
    const formData = new FormData();
    formData.append('jobId', jobId);
    
    // Group resumes by candidate
    candidates.forEach((candidate) => {
      candidate.resumes.forEach((resume: UploadedResume) => {
        if (resume.file instanceof File) {
          // Append candidate info to filename
          const candidateFileName = `${candidate.id}_${resume.fileName}`;
          formData.append('resumes', resume.file, candidateFileName);
        }
      });
    });

    // Send all resumes for scoring
    const response = await axios.post<{
      results: Array<{
        candidateId: string;
        score: CandidateScoreBreakdown;
      }>;
    }>(`${API_URL}/scoring/check-candidate-fit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Map the scores back to candidates
    return candidates.map((candidate) => ({
      candidateId: candidate.id,
      candidateName: candidate.name,
      score: response.data.results.find(
        (result) => result.candidateId === candidate.id
      )?.score || {
        overall: 0,
        skillMatch: 0,
        experienceMatch: 0,
        educationMatch: 0,
        keywordMatch: 0,
        improvements: [],
        strengths: []
      }
    }));
  } catch (error) {
    console.error('Error checking candidate fit:', error);
    throw error;
  }
};