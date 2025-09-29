import React from 'react';
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';

const ResumesWidget: React.FC = () => {
  const { managedCandidates, setManagedCandidates } = useApp();

  // Get all resumes from all candidates
  const selectedResumes = managedCandidates.flatMap(candidate => 
    candidate.resumes.map(resume => ({
      ...resume,
      candidateName: candidate.name
    }))
  );

  const removeResume = (resumeId: string) => {
    const update = managedCandidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      resumes: candidate.resumes.filter(resume => resume.id !== resumeId)
    }));
    setManagedCandidates(update);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resumes</h2>
        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {selectedResumes.length}
        </span>
      </div>
      
      {selectedResumes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500">No resumes selected yet</p>
          <p className="text-sm text-gray-400 mt-1">Select candidate resumes from the panel on the right</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {selectedResumes.map((resume) => (
            <div
              key={resume.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <DocumentIcon className="h-8 w-8 text-indigo-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {resume.fileName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="text-indigo-600">{resume.candidateName}</span>
                    <span>•</span>
                    <span>{resume.file ? formatFileSize(resume.file.size) : 'Unknown size'}</span>
                    <span>•</span>
                    <span>{formatDate(resume.uploadedAt)}</span>

                  </div>
                </div>
              </div>
              <button
                onClick={() => removeResume(resume.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove resume"
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
