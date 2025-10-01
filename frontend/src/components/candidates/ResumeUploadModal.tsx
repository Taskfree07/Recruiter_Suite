import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { DocumentIcon, CloudArrowUpIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';
import type { UploadedResume, CandidateData } from '../../types';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';


interface ResumeUploadModalProps {
  candidateId: string;
  onClose: () => void;
  candidate: CandidateData;
}

const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ candidateId, onClose, candidate }) => {
  const { setManagedCandidates } = useApp();
  const [candidateResumes, setCandidateResumes] = useState<UploadedResume[]>(candidate.resumes || []);

  const removeResume = (resumeId: string) => {
    setCandidateResumes(prevResumes => {
      const newResumes = prevResumes.filter(r => r.id !== resumeId);
      // Update parent state
      setManagedCandidates(prev => 
        prev.map(c => c.id === candidateId ? { ...c, resumes: newResumes } : c)
      );
      return newResumes;
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast.error(`Some files exceed 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }

      // Upload files to backend
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('resumes', file);
      });

      const loadingToast = toast.loading('Uploading resumes...');

      const response = await fetch(`http://localhost:5000/api/candidate-resumes/upload/${candidateId}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Create resume objects with backend file paths
      const newResumes = data.resumes.map((resume: any) => ({
        id: resume.id,
        fileName: resume.fileName,
        filePath: resume.filePath,
        file: null,
        uploadedAt: resume.uploadedAt,
        candidateId,
        candidateName: candidate.name,
        score: undefined
      }));

      // Update local state
      const updatedResumes = [...candidateResumes, ...newResumes];
      setCandidateResumes(updatedResumes);
      
      // Update parent state
      setManagedCandidates(prev => 
        prev.map(c => c.id === candidateId ? { ...c, resumes: updatedResumes } : c)
      );
      
      toast.dismiss(loadingToast);
      toast.success(
        acceptedFiles.length === 1 
          ? 'Resume uploaded successfully' 
          : `${acceptedFiles.length} resumes uploaded successfully`
      );
    } catch (error) {
      console.error('Error uploading resumes:', error);
      toast.error('Failed to upload resume(s). Please try again.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map(rejection => {
        const error = rejection.errors[0];
        return `${rejection.file.name}: ${error.message}`;
      });
      toast.error(errors.join('\n'));
    }
  });

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full m-4">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>{candidate.name}'s Resumes</span>
              <span className="text-sm font-normal text-gray-500">
                {candidateResumes.length} {candidateResumes.length === 1 ? 'resume' : 'resumes'}
              </span>
            </Dialog.Title>

            <div className="mb-6">
              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                    {candidate.score && (
                      <span className="text-sm text-gray-500">
                        Overall Score: <span className="text-indigo-600 font-medium">{candidate.score.overall}%</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {candidateResumes.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {candidateResumes.map((resume: UploadedResume, index: number) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <DocumentIcon className="h-6 w-6 text-indigo-400" />
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {resume.fileName}
                              </span>
                              {index === 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 block">
                              Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removeResume(resume.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                            title="Remove resume"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No resumes uploaded yet</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Upload New Resume</h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
              >
                <input {...getInputProps()} />
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                {isDragActive ? (
                  <p className="mt-2 text-sm text-indigo-600">Drop the resume here...</p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-gray-600">
                      Drag and drop a resume, or click to select
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PDF, DOC, DOCX up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Dialog>
  );
};

export default ResumeUploadModal;