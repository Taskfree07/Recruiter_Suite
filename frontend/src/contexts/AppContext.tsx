import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { Job } from '../services/jobService';
import { Candidate } from '../services/candidateService';
import type { CandidateData, UploadedResume } from '../types';

// Re-export types that are used throughout the app
export type { UploadedResume } from '../types/resume';
export type { CandidateData } from '../types/candidate';



interface AppContextType {
  currentJob: Job | null;
  setCurrentJob: (job: Job | null) => void;
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
  uploadedResumes: UploadedResume[];
  setUploadedResumes: Dispatch<SetStateAction<UploadedResume[]>>;
  addUploadedResumes: (resumes: UploadedResume[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  // New candidate management functions
  managedCandidates: CandidateData[];
  setManagedCandidates: Dispatch<SetStateAction<CandidateData[]>>;
  addResumesToCandidate: (candidateId: string, resumes: UploadedResume[]) => void;
  // Selected candidates for scoring
  selectedCandidateIds: string[];
  setSelectedCandidateIds: Dispatch<SetStateAction<string[]>>;
  toggleCandidateSelection: (candidateId: string) => void;
  selectAllCandidates: () => void;
  clearSelectedCandidates: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Clear scores when a new job is uploaded
  React.useEffect(() => {
    if (currentJob) {
      setManagedCandidates(prev => prev.map(candidate => ({
        ...candidate,
        score: undefined // Clear previous scores
      })));
    }
  }, [currentJob?._id]); // Only trigger when job ID changes
  // Try to load seed data (generated from backend uploads) as a fallback
  let seed: CandidateData[] | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // Use require so the JSON is bundled in dev mode
    // If the file doesn't exist, require will throw and we'll fall back to defaults
    // The generated file path: src/data/seedManagedCandidates.json
    // Use a try/catch to avoid build errors when the file is missing
    seed = require('../data/seedManagedCandidates.json');
  } catch (e) {
    seed = null;
  }

  const [managedCandidates, setManagedCandidates] = useState<CandidateData[]>(() => {
    // Try to load from localStorage
    const saved = typeof window !== 'undefined' ? localStorage.getItem('managedCandidates') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear scores on page load/refresh
        return parsed.map((candidate: CandidateData) => ({
          ...candidate,
          score: undefined
        }));
      } catch (error) {
        console.error('Failed to parse saved candidates:', error);
      }
    }

    // If seed exists, return it
    if (seed && Array.isArray(seed)) {
      return seed as CandidateData[];
    }

    // Default initial candidates
    return [
      { id: '1', name: 'John Doe', resumes: [] },
      { id: '2', name: 'Jane Smith', resumes: [] },
      { id: '3', name: 'Mike Johnson', resumes: [] },
      { id: '4', name: 'Sarah Wilson', resumes: [] },
      { id: '5', name: 'David Brown', resumes: [] }
    ];
  });

  const addUploadedResumes = (newResumes: UploadedResume[]) => {
    setUploadedResumes(prev => [...prev, ...newResumes]);
  };

  // Effect to save candidates to localStorage (excluding File objects)
  React.useEffect(() => {
    // Don't save File objects to localStorage as they can't be serialized
    const candidatesForStorage = managedCandidates.map(candidate => ({
      ...candidate,
      resumes: candidate.resumes.map(resume => ({
        ...resume,
        file: null // Exclude File object from localStorage
      }))
    }));
    localStorage.setItem('managedCandidates', JSON.stringify(candidatesForStorage));
  }, [managedCandidates]);

  const addResumesToCandidate = (candidateId: string, resumes: UploadedResume[]) => {
    setManagedCandidates(prev => {
      const updated = prev.map(candidate => 
        candidate.id === candidateId
          ? { ...candidate, resumes: [...candidate.resumes, ...resumes] }
          : candidate
      );
      return updated;
    });
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const selectAllCandidates = () => {
    const candidatesWithResumes = managedCandidates
      .filter(c => c.resumes.length > 0)
      .map(c => c.id);
    setSelectedCandidateIds(candidatesWithResumes);
  };

  const clearSelectedCandidates = () => {
    setSelectedCandidateIds([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentJob,
        setCurrentJob,
        candidates,
        setCandidates,
        uploadedResumes,
        setUploadedResumes,
        addUploadedResumes,
        loading,
        setLoading,
        managedCandidates,
        setManagedCandidates,
        addResumesToCandidate,
        selectedCandidateIds,
        setSelectedCandidateIds,
        toggleCandidateSelection,
        selectAllCandidates,
        clearSelectedCandidates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};