import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import ResumeUploadModal from './ResumeUploadModal';
import { PlusIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { CandidateData } from '../../types/candidate';

const CandidatesWidget: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const { managedCandidates, selectAllCandidates, selectedCandidateIds, toggleCandidateSelection, clearSelectedCandidates } = useApp();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Candidates</h2>
          <button
            onClick={selectAllCandidates}
            disabled={managedCandidates.every(c => c.resumes.length === 0)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add All
          </button>
        </div>
        {selectedCandidateIds.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-indigo-600 font-medium">
              {selectedCandidateIds.length} candidate{selectedCandidateIds.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearSelectedCandidates}
              className="text-gray-500 hover:text-gray-700 text-xs underline"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1">
        {managedCandidates.map((candidate: CandidateData) => (
          <div
            key={candidate.id}
            onClick={() => {
              if (candidate.resumes.length > 0) {
                toggleCandidateSelection(candidate.id);
              }
            }}
            className={`p-3 border rounded-lg transition-colors relative group ${
              candidate.resumes.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : selectedCandidateIds.includes(candidate.id)
                  ? 'bg-indigo-50 border-indigo-300 cursor-pointer'
                  : 'hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-sm">
                    {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                {selectedCandidateIds.includes(candidate.id) && candidate.resumes.length > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircleIconSolid className="h-5 w-5 text-indigo-600 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <div className="w-full">
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">{candidate.name}</h3>
                <div className="flex flex-col items-center text-xs space-y-1">
                  <span className={`flex items-center ${candidate.resumes.length > 0 ? 'text-indigo-600' : 'text-gray-500'}`}>
                    <DocumentTextIcon className="h-3 w-3 mr-1" />
                    {candidate.resumes.length} {candidate.resumes.length === 1 ? 'resume' : 'resumes'}
                  </span>
                  {candidate.score && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {candidate.score.overall}% fit
                    </span>
                  )}
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
                <PlusIcon className="h-4 w-4" />
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