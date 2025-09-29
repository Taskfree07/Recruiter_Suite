import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import ResumeUploadModal from './ResumeUploadModal';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CandidateData } from '../../types/candidate';

const CandidatesWidget: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const { managedCandidates, setUploadedResumes } = useApp();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Candidates</h2>
        <button
          onClick={() => {
            // Add all candidates to the main panel
            const allResumes = managedCandidates.flatMap(candidate => 
              candidate.resumes.map(resume => ({
                ...resume,
                candidateId: candidate.id,
                candidateName: candidate.name
              }))
            );
            setUploadedResumes(allResumes);
          }}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
          Add All
        </button>
      </div>
      <div className="space-y-3">
        {managedCandidates.map((candidate: CandidateData) => (
          <div
            key={candidate.id}
            onClick={() => setSelectedCandidate(candidate.id)}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors relative group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">
                    {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                  <div className="flex items-center text-sm space-x-2">
                    <span className={`flex items-center ${candidate.resumes.length > 0 ? 'text-indigo-600' : 'text-gray-500'}`}>
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      {candidate.resumes.length} {candidate.resumes.length === 1 ? 'resume' : 'resumes'}
                    </span>
                    {candidate.score && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        {candidate.score.overall}% fit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCandidate(candidate.id);
                }}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                title="Upload resume"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCandidate && (
        <ResumeUploadModal 
          candidateId={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          candidate={managedCandidates.find(c => c.id === selectedCandidate)!}
        />
      )}
    </div>
  );
};

export default CandidatesWidget;