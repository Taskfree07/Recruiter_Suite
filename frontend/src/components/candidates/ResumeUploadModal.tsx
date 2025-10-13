import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { DocumentIcon, CloudArrowUpIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';
import type { UploadedResume, CandidateData } from '../../types';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumeUploadModalProps {
  candidateId: string;
  onClose: () => void;
  candidate: CandidateData;
}

const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ candidateId, onClose, candidate }) => {
  const { setManagedCandidates } = useApp();
  const [candidateResumes, setCandidateResumes] = useState<UploadedResume[]>(candidate.resumes || []);
  const [selectedResume, setSelectedResume] = useState<UploadedResume | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleResumeClick = (resume: UploadedResume) => {
    console.log('Selected resume:', resume);
    console.log('File path:', resume.filePath);
    setSelectedResume(resume);
    setPageNumber(1);
  };

  const getPDFUrl = (resume: UploadedResume) => {
    if (!resume.filePath) return null;

    // Try the file object first (for newly uploaded files)
    if (resume.file) {
      return URL.createObjectURL(resume.file);
    }

    // For persisted files, use the API endpoint
    // Extract candidateId and filename from the path
    // Path format: uploads/resumes/{candidateId}/{filename}
    const pathParts = resume.filePath.split('/');
    const candidateId = pathParts[pathParts.length - 2];
    const filename = pathParts[pathParts.length - 1];

    const url = `http://localhost:5000/api/files/resumes/${candidateId}/${filename}`;
    console.log('PDF URL:', url);
    return url;
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />

        <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full h-[90vh] flex flex-col">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 flex-shrink-0 border-b">
            <Dialog.Title className="text-xl font-semibold text-gray-900 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">
                    {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <span>{candidate.name}'s Resumes</span>
                  {candidate.score && (
                    <span className="text-sm font-normal text-gray-500 ml-3">
                      Overall Score: <span className="text-indigo-600 font-medium">{candidate.score.overall}%</span>
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-normal text-gray-500">
                {candidateResumes.length} {candidateResumes.length === 1 ? 'resume' : 'resumes'}
              </span>
            </Dialog.Title>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left side - Resume list and upload */}
            <div className="w-1/3 border-r flex flex-col overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto">
                {candidateResumes.length > 0 ? (
                  <div className="space-y-3">
                    {candidateResumes.map((resume: UploadedResume, index: number) => (
                      <div
                        key={resume.id}
                        onClick={() => handleResumeClick(resume)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors group ${
                          selectedResume?.id === resume.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <DocumentIcon className="h-6 w-6 text-indigo-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {resume.fileName}
                              </span>
                              {index === 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex-shrink-0">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 block">
                              Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeResume(resume.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded-full hover:bg-red-50 flex-shrink-0 ml-2"
                          title="Remove resume"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
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

              <div className="p-6 border-t flex-shrink-0">
                <h3 className="font-medium text-gray-900 mb-3">Upload New Resume</h3>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
                >
                  <input {...getInputProps()} />
                  <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
                  {isDragActive ? (
                    <p className="mt-2 text-sm text-indigo-600">Drop the resume here...</p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-gray-600">
                        Drag and drop or click
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Resume preview */}
            <div className="flex-1 bg-gray-100 p-6 flex flex-col overflow-hidden">
              {selectedResume ? (
                <div className="flex flex-col h-full">
                  <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
                    <h3 className="font-medium text-gray-900 mb-2">{selectedResume.fileName}</h3>
                    {selectedResume.fileName.toLowerCase().endsWith('.pdf') ? (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Page {pageNumber} of {numPages}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                            disabled={pageNumber <= 1}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                            disabled={pageNumber >= numPages}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Preview not available for this file type</p>
                    )}
                  </div>

                  <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto min-h-0">
                    <div className="w-full h-full flex items-start justify-center py-6">
                      {(() => {
                        const pdfUrl = selectedResume.fileName.toLowerCase().endsWith('.pdf') ? getPDFUrl(selectedResume) : null;

                        if (pdfUrl) {
                          return (
                            <Document
                              file={pdfUrl}
                              onLoadSuccess={onDocumentLoadSuccess}
                              loading={<div className="text-gray-500 p-6">Loading PDF...</div>}
                              error={<div className="text-red-500 p-6">Failed to load PDF. Please check if the file exists.</div>}
                            >
                              <Page
                                pageNumber={pageNumber}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                width={Math.min(650, window.innerWidth * 0.4)}
                              />
                            </Document>
                          );
                        } else if (selectedResume.fileName.toLowerCase().endsWith('.pdf')) {
                          return (
                            <div className="text-center p-6">
                              <DocumentIcon className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                              <p className="text-red-500">PDF file path not available</p>
                              <p className="text-sm text-gray-400 mt-2">Please re-upload the resume</p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center p-6">
                              <DocumentIcon className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                              <p className="text-gray-500">Preview is only available for PDF files</p>
                              <p className="text-sm text-gray-400 mt-2">This file will still be processed for scoring</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <DocumentIcon className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                    <p className="text-gray-500">Select a resume to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ResumeUploadModal;