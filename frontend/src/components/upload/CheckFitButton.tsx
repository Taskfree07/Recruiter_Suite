import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';
import { checkCandidateFit } from '../../services/candidateScoringService';
import toast from 'react-hot-toast';

const CheckFitButton: React.FC = () => {
  const { currentJob, managedCandidates, setManagedCandidates, selectedCandidateIds } = useApp();
  const [processing, setProcessing] = useState(false);

  const handleCheckFit = async () => {
    if (!currentJob) {
      toast.error('Please upload a job description first');
      return;
    }

    const selectedCandidates = managedCandidates.filter(c => 
      selectedCandidateIds.includes(c.id) && c.resumes.length > 0
    );
    
    if (selectedCandidates.length === 0) {
      toast.error('Please select candidates with resumes to analyze');
      return;
    }

    // Check if any candidates have valid file paths
    const candidatesWithFiles = selectedCandidates.filter(c => 
      c.resumes.some(r => r.filePath)
    );

    if (candidatesWithFiles.length === 0) {
      toast.error('No resume files found. Please re-upload resumes for the selected candidates.', {
        duration: 6000
      });
      return;
    }

    if (candidatesWithFiles.length < selectedCandidates.length) {
      toast.error(`${selectedCandidates.length - candidatesWithFiles.length} candidate(s) missing resume files. Please re-upload.`, {
        duration: 5000
      });
      return;
    }

    setProcessing(true);

    try {
      const results = await checkCandidateFit(currentJob._id, selectedCandidates);
      
      // Sort results by overall score
      const sortedResults = [...results].sort((a, b) => b.score.overall - a.score.overall);
      
      // Update candidate scores in state
      setManagedCandidates(prev => prev.map(candidate => {
        const result = results.find(r => r.candidateId === candidate.id);
        return result ? {
          ...candidate,
          score: result.score
        } : candidate;
      }));

      // Show the top candidate
      const topCandidate = sortedResults[0];
      toast.success(
        `Analysis complete. Top match: ${topCandidate.candidateName} (${topCandidate.score.overall}% fit)`
      );
    } catch (error: any) {
      console.error('Analysis error:', error);
      const errorMessage = error.message || 'Failed to analyze candidates';
      if (errorMessage.includes('No valid resume files')) {
        toast.error('Resume files were lost. Please re-upload resumes for the selected candidates.', {
          duration: 5000
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  const isDisabled = !currentJob || selectedCandidateIds.length === 0 || processing;

  return (
    <div className="mt-4">
      <button
        onClick={handleCheckFit}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm transition-colors
          ${isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Analyzing Resumes...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Check Fit
          </>
        )}
      </button>
      
      {!currentJob && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Upload a job description to enable analysis
        </p>
      )}
      
      {currentJob && selectedCandidateIds.length === 0 && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Select candidates to analyze their fit
        </p>
      )}
    </div>
  );
};

export default CheckFitButton;
