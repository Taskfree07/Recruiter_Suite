import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceYears: {
    min: number;
    max: number;
  };
  experienceLevel: string;
  location: string;
  locationType: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  status: string;
  postedDate: Date;
  positions: number;
  sources: Array<{
    type: string;
    emailSubject?: string;
    senderEmail?: string;
    syncDate: Date;
  }>;
  tags: string[];
}

interface Candidate {
  _id: string;
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  categories: {
    specificSkills: string[];
    experienceLevel: string;
  };
  professionalDetails: {
    totalExperience: string;
  };
  scores: {
    overall: number;
  };
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

const OutlookJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchedCandidates, setMatchedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/recruiter/jobs?sortBy=postedDate`);
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findMatchingCandidates = async (job: Job) => {
    try {
      setLoadingMatches(true);

      console.log('🔍 Starting candidate matching for job:', job.title);
      console.log('📋 Job required skills:', job.requiredSkills);
      console.log('✨ Job nice-to-have skills:', job.niceToHaveSkills);

      // Get all candidates
      const response = await axios.get(`${API_URL}/recruiter/resumes?limit=100`);
      const allCandidates = response.data.resumes || [];

      console.log(`👥 Total candidates fetched: ${allCandidates.length}`);

      // Calculate match score for each candidate
      const candidatesWithScores = allCandidates.map((candidate: Candidate, index: number) => {
        const candidateSkills = candidate.categories?.specificSkills || [];
        const requiredSkills = job.requiredSkills || [];
        const niceToHaveSkills = job.niceToHaveSkills || [];

        console.log(`\n📊 Candidate ${index + 1}: ${candidate.personalInfo?.name || 'Unknown'}`);
        console.log('  Skills:', candidateSkills);

        // Find matched and missing skills
        const matchedSkills = requiredSkills.filter(skill =>
          candidateSkills.some(cs =>
            cs.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(cs.toLowerCase())
          )
        );

        const missingSkills = requiredSkills.filter(skill =>
          !candidateSkills.some(cs =>
            cs.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(cs.toLowerCase())
          )
        );

        // Calculate score (0-100)
        const requiredMatch = requiredSkills.length > 0
          ? (matchedSkills.length / requiredSkills.length) * 70
          : 70;

        const niceToHaveMatch = niceToHaveSkills.filter(skill =>
          candidateSkills.some(cs =>
            cs.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(cs.toLowerCase())
          )
        ).length;

        const niceToHaveScore = niceToHaveSkills.length > 0
          ? (niceToHaveMatch / niceToHaveSkills.length) * 30
          : 0;

        const matchScore = Math.round(requiredMatch + niceToHaveScore);

        console.log(`  ✅ Matched: ${matchedSkills.length}/${requiredSkills.length} required skills:`, matchedSkills);
        console.log(`  ❌ Missing: ${missingSkills.length} skills:`, missingSkills);
        console.log(`  🎯 Match Score: ${matchScore}% (required: ${requiredMatch.toFixed(1)}, nice-to-have: ${niceToHaveScore.toFixed(1)})`);

        return {
          ...candidate,
          matchScore,
          matchedSkills,
          missingSkills
        };
      });

      console.log('\n📈 All candidates with scores:', candidatesWithScores.map((c: Candidate) => ({
        name: c.personalInfo?.name,
        score: c.matchScore
      })));

      // Sort by match score - show all candidates with any match
      const sortedCandidates = candidatesWithScores
        .filter((c: Candidate) => c.matchScore! > 0) // Show all candidates with any match
        .sort((a: Candidate, b: Candidate) => (b.matchScore || 0) - (a.matchScore || 0));

      console.log(`\n✨ Final matched candidates (score > 0): ${sortedCandidates.length}`);
      console.log('Top matches:', sortedCandidates.slice(0, 5).map((c: Candidate) => ({
        name: c.personalInfo?.name,
        score: c.matchScore,
        matchedSkills: c.matchedSkills?.length
      })));

      setMatchedCandidates(sortedCandidates);
    } catch (error) {
      console.error('❌ Error finding matches:', error);
      alert('Failed to find matching candidates.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSelectJob = async (job: Job) => {
    setSelectedJob(job);
    await findMatchingCandidates(job);
  };

  const formatSalary = (range?: { min: number; max: number; currency: string }) => {
    if (!range) return 'Not specified';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: range.currency || 'USD',
      minimumFractionDigits: 0
    });
    return `${formatter.format(range.min)} - ${formatter.format(range.max)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-white shadow-sm border-b px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/recruiter-dashboard')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Outlook Jobs</h1>
              <p className="text-sm text-gray-600">Jobs synced from your email</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{jobs.length}</div>
            <div className="text-xs text-gray-600">Total Jobs</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 py-4">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-600 mb-4">
              Sync your Outlook emails to see job descriptions here.
            </p>
            <button
              onClick={() => navigate('/recruiter-dashboard')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Jobs List */}
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex-shrink-0">Job Listings</h2>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleSelectJob(job)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                    selectedJob?._id === job._id
                      ? 'ring-2 ring-indigo-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-indigo-600 font-medium">{job.company}</p>
                    </div>
                    {job.tags?.includes('demo') && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                        🎭 Demo
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-3 w-3" />
                      <span>{job.location} • {job.locationType}</span>
                    </div>

                    {job.salaryRange && (
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="h-3 w-3" />
                        <span>{formatSalary(job.salaryRange)}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-3 w-3" />
                      <span>
                        {job.experienceYears.min}-{job.experienceYears.max} years •{' '}
                        {job.experienceLevel}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{job.requiredSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* Job Details & Matched Candidates */}
            <div className="flex flex-col h-full overflow-hidden">
              {!selectedJob ? (
                <div className="bg-white rounded-lg shadow p-12 text-center h-full flex flex-col items-center justify-center">
                  <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a Job
                  </h3>
                  <p className="text-gray-600">
                    Click on any job to see details and matching candidates
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Job Details Card - Collapsible */}
                  <div className="flex-shrink-0 bg-white rounded-lg shadow p-4 mb-3 overflow-y-auto max-h-[40%]">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      {selectedJob.title}
                    </h2>
                    <p className="text-sm text-indigo-600 font-medium mb-2">
                      {selectedJob.company}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <p className="font-medium">{selectedJob.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <p className="font-medium capitalize">{selectedJob.locationType}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <p className="font-medium">
                          {selectedJob.experienceYears.min}-{selectedJob.experienceYears.max} years
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Salary:</span>
                        <p className="font-medium">{formatSalary(selectedJob.salaryRange)}</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <h4 className="font-semibold text-gray-900 mb-1 text-xs">Required Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedJob.requiredSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedJob.niceToHaveSkills.length > 0 && (
                      <div className="mb-2">
                        <h4 className="font-semibold text-gray-900 mb-1 text-xs">Nice to Have:</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedJob.niceToHaveSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="prose max-w-none text-xs text-gray-700 line-clamp-3 mb-2">
                      {selectedJob.description}
                    </div>
                  </div>

                  {/* Matched Candidates */}
                  <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex-shrink-0">
                      Matched Candidates ({matchedCandidates.length})
                    </h3>

                    {loadingMatches ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600 text-sm">Finding matches...</p>
                      </div>
                    ) : matchedCandidates.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">
                        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm">No matching candidates found</p>
                        <p className="text-xs">Try syncing more resumes</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {matchedCandidates.map((candidate) => (
                          <div
                            key={candidate._id}
                            className="border rounded-lg p-3 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {candidate.personalInfo.name}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">
                                  {candidate.personalInfo.email}
                                </p>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${getMatchColor(candidate.matchScore || 0)}`}>
                                {candidate.matchScore}%
                              </div>
                            </div>

                            <div className="text-xs text-gray-600 mb-2 flex gap-3">
                              <span>Exp: {candidate.professionalDetails.totalExperience}</span>
                              <span>•</span>
                              <span>{candidate.categories.experienceLevel}</span>
                            </div>

                            {/* Matched Skills */}
                            {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-600 mb-1 flex items-center">
                                  <CheckCircleIcon className="h-3 w-3 text-green-600 mr-1" />
                                  Matched:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {candidate.matchedSkills.map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Missing Skills */}
                            {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1 flex items-center">
                                  <XMarkIcon className="h-3 w-3 text-red-600 mr-1" />
                                  Missing:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {candidate.missingSkills.map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlookJobs;
