import React from 'react';
import { useApp } from '../../contexts/AppContext';

const ScoringSummary: React.FC = () => {
  const { candidates } = useApp();

  if (candidates.length === 0) return null;

  return (
    <div className="mt-4 bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Scoring Summary</h3>
      <div className="space-y-3">
        {candidates.map((candidate, index) => (
          <div key={candidate._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">
                {candidate.personalInfo?.name || candidate.fileName}
              </span>
              {index === 0 && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Top Match
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Overall: </span>
                <span className="font-medium">{candidate.score?.overall}%</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Skills: </span>
                <span className="font-medium">{candidate.score?.skillMatch}%</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Experience: </span>
                <span className="font-medium">{candidate.score?.experienceMatch}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoringSummary;