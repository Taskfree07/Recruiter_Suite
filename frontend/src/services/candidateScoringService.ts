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
    // Send candidate IDs and let backend fetch files
    const payload = {
      jobId,
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.name,
        resumePaths: c.resumes.map(r => r.filePath).filter(Boolean)
      }))
    };
    
    // Check if any candidates have resumes
    const totalResumes = payload.candidates.reduce((sum, c) => sum + c.resumePaths.length, 0);
    if (totalResumes === 0) {
      throw new Error('No valid resume files found. Please re-upload resumes for the selected candidates.');
    }

    // Send all resumes for scoring
    const response = await axios.post<{
      results: Array<{
        candidateId: string;
        score: CandidateScoreBreakdown;
      }>;
    }>(`${API_URL}/candidate-scoring/check-candidate-fit-by-path`, payload, {
      headers: {
        'Content-Type': 'application/json',
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