import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';
import { UploadedResume } from '../../types/resume';
import toast from 'react-hot-toast';

const ResumeUpload: React.FC = () => {
  const { currentJob, addUploadedResumes } = useApp();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    // Allow queuing resumes even if no job is uploaded yet. Analysis happens when checking fit.
    setUploading(true);

    try {
      if (!acceptedFiles || acceptedFiles.length === 0) {
        if (fileRejections && fileRejections.length > 0) {
          const names = fileRejections.map((r: any) => r.file?.name).filter(Boolean).join(', ');
          toast.error(`Some files were rejected: ${names || ''}. Please upload PDF, DOCX, or TXT.`);
        } else {
          toast.error('No files selected');
        }
        return;
      }
      // Create uploaded resume objects
      const newResumes: UploadedResume[] = acceptedFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        file: file,
        uploadedAt: new Date().toISOString()
      }));

      // Add to uploaded resumes list
      addUploadedResumes(newResumes);
      
      toast.success(`${acceptedFiles.length} resume(s) added. Click "Check Fit" to analyze.`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload resumes');
    } finally {
      setUploading(false);
    }
  }, [currentJob, addUploadedResumes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: true,
    disabled: uploading
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Resumes</h2>
      
      { !currentJob && (
        <p className="mb-3 text-sm text-gray-500">
          You can upload resumes now; analysis requires a job description.
        </p>
      )}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        {isDragActive ? (
          <p className="text-indigo-600">Drop the resumes here...</p>
        ) : (
          <>
            <p className="text-gray-600">
              Drag & drop resumes here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports multiple PDF, DOC, DOCX, TXT files
            </p>
          </>
        )}
        
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Uploading resumes...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;