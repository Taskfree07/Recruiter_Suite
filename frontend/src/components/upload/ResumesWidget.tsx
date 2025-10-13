import React from 'react';
import { UserGroupIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';

const ResumesWidget: React.FC = () => {
  const { managedCandidates, selectedCandidateIds, toggleCandidateSelection } = useApp();

  // Get only selected candidates
  const selectedCandidates = managedCandidates
    .filter(candidate => selectedCandidateIds.includes(candidate.id));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Selected Candidates</h2>
        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {selectedCandidates.length}
        </span>
      </div>
      
      {selectedCandidates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500">No candidates selected yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add All" or select candidates from the panel on the right</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {selectedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-semibold text-sm">
                    {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {candidate.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <DocumentTextIcon className="h-3 w-3" />
                    <span>{candidate.resumes.length} {candidate.resumes.length === 1 ? 'resume' : 'resumes'}</span>
                    {candidate.score && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium">{candidate.score.overall}% match</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleCandidateSelection(candidate.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove from selection"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumesWidget;
