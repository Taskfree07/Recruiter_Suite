// Don't import models at top level to avoid circular dependencies
// import UnifiedJob from '../models/unifiedJob';
// import RecruiterResume from '../models/recruiterResume';
import aiMatchingClient from './aiMatchingClient';

interface MatchScore {
  overall: number;
  breakdown: {
    skillMatch: number;
    experienceMatch: number;
    locationMatch: number;
    salaryMatch: number;
    semanticMatch?: number; // AI-powered semantic match score
  };
  matchedSkills: string[];
  missingSkills: string[];
  experienceGap: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  details: {
    skillMatchRate: number;
    experienceStatus: string;
    locationCompatible: boolean;
    salaryAlignment: string;
    aiEnhanced?: boolean; // Indicates if AI matching was used
    semanticSimilarity?: number; // Raw semantic similarity score
  };
}

interface MatchResult {
  candidate: any;
  matchScore: MatchScore;
}

class MatchingService {
  /**
   * Find top matching candidates for a specific job
   */
  async findMatchingCandidates(
    jobId: string,
    options: { limit?: number; minScore?: number } = {}
  ): Promise<MatchResult[]> {
    const { limit = 10, minScore = 40 } = options;

    try {
      // Dynamic imports to avoid circular dependencies
      const UnifiedJob = require('../models/unifiedJob').default;
      const RecruiterResume = require('../models/recruiterResume').default;

      // Fetch job
      const job = await UnifiedJob.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Fetch all active candidates
      const candidates = await RecruiterResume.find({
        status: { $in: ['active', 'pending_review'] },
        processed: true
      }).select('-rawText'); // Exclude large text fields for performance

      // Calculate match score for each candidate using AI
      const matchedCandidates: MatchResult[] = [];

      for (const candidate of candidates) {
        // Use AI-enhanced matching for better accuracy
        const matchScore = await this.calculateAIMatchScore(job, candidate);

        // Only include if meets minimum score
        if (matchScore.overall >= minScore) {
          matchedCandidates.push({
            candidate: candidate.toObject(),
            matchScore
          });
        }
      }

      // Sort by overall score (descending)
      matchedCandidates.sort((a, b) => b.matchScore.overall - a.matchScore.overall);

      // Return top N
      return matchedCandidates.slice(0, limit);
    } catch (error) {
      console.error('Error finding matching candidates:', error);
      throw error;
    }
  }

  /**
   * Calculate match score between a job and candidate
   */
  calculateMatchScore(job: any, candidate: any): MatchScore {
    // Traditional matching (keyword-based)
    // Skill matching (35 points) - reduced from 40 to make room for AI
    const skillScore = this.calculateSkillScore(job, candidate);

    // Experience matching (30 points)
    const experienceScore = this.calculateExperienceScore(job, candidate);

    // Location matching (15 points)
    const locationScore = this.calculateLocationScore(job, candidate);

    // Salary matching (15 points)
    const salaryScore = this.calculateSalaryScore(job, candidate);

    // Semantic AI matching (20 points) - new addition
    // This will be populated asynchronously, so we'll return a basic score for now
    const semanticScore = 0;

    // Calculate overall score
    const overall =
      skillScore.score +
      experienceScore.score +
      locationScore.score +
      salaryScore.score +
      semanticScore;

    return {
      overall: Math.round(overall),
      breakdown: {
        skillMatch: skillScore.score,
        experienceMatch: experienceScore.score,
        locationMatch: locationScore.score,
        salaryMatch: salaryScore.score,
        semanticMatch: semanticScore
      },
      matchedSkills: skillScore.matchedSkills,
      missingSkills: skillScore.missingSkills,
      experienceGap: experienceScore.gap,
      recommendation: this.getRecommendation(overall),
      details: {
        skillMatchRate: skillScore.matchRate,
        experienceStatus: experienceScore.status,
        locationCompatible: locationScore.compatible,
        salaryAlignment: salaryScore.alignment,
        aiEnhanced: false
      }
    };
  }

  /**
   * Calculate AI-enhanced match score between a job and candidate
   * This method uses Sentence Transformers for semantic similarity
   */
  async calculateAIMatchScore(job: any, candidate: any): Promise<MatchScore> {
    // Get traditional score first
    const baseScore = this.calculateMatchScore(job, candidate);

    // Try to enhance with AI matching
    try {
      if (!aiMatchingClient.isServiceAvailable()) {
        console.log('AI service not available, using traditional matching only');
        return baseScore;
      }

      // Prepare job description text
      const jobDescription = `
        ${job.title} at ${job.company}
        ${job.description}
        Required Skills: ${job.requiredSkills?.join(', ') || 'N/A'}
        Experience: ${job.experienceYears?.min || 0}-${job.experienceYears?.max || 10} years
        Location: ${job.location} (${job.locationType})
      `.trim();

      // Prepare candidate resume text
      const resumeText = candidate.rawText || this.extractCandidateText(candidate);

      // Get all candidate skills
      const candidateSkills = [
        ...(candidate.skills?.primary || []),
        ...(candidate.skills?.secondary || []),
        ...(candidate.skills?.frameworks || []),
        ...(candidate.skills?.databases || []),
        ...(candidate.skills?.cloudPlatforms || []),
        ...(candidate.skills?.tools || [])
      ];

      // Call AI matching service
      const aiResult = await aiMatchingClient.matchCandidate(
        jobDescription,
        resumeText,
        job.requiredSkills || [],
        candidateSkills
      );

      if (aiResult) {
        // Add semantic score (max 20 points)
        const semanticScore = Math.round((aiResult.weighted_score_percentage / 100) * 20);

        // Recalculate overall with AI boost
        const overall =
          baseScore.breakdown.skillMatch +
          baseScore.breakdown.experienceMatch +
          baseScore.breakdown.locationMatch +
          baseScore.breakdown.salaryMatch +
          semanticScore;

        return {
          ...baseScore,
          overall: Math.round(overall),
          breakdown: {
            ...baseScore.breakdown,
            semanticMatch: semanticScore
          },
          details: {
            ...baseScore.details,
            aiEnhanced: true,
            semanticSimilarity: aiResult.overall_similarity_percentage
          },
          recommendation: this.getRecommendation(overall)
        };
      }
    } catch (error) {
      console.error('Error in AI matching, falling back to traditional:', error);
    }

    // Return base score if AI fails
    return baseScore;
  }

  /**
   * Extract readable text from candidate object
   */
  private extractCandidateText(candidate: any): string {
    const parts = [
      candidate.personalInfo?.name || '',
      candidate.personalInfo?.email || '',
      candidate.professionalDetails?.headline || '',
      candidate.professionalDetails?.summary || '',
      ...(candidate.experience || []).map((exp: any) =>
        `${exp.title} at ${exp.company}: ${exp.description || ''}`
      ),
      ...(candidate.education || []).map((edu: any) =>
        `${edu.degree} from ${edu.institution}`
      ),
      // Add skills to text
      `Skills: ${[
        ...(candidate.skills?.primary || []),
        ...(candidate.skills?.secondary || []),
        ...(candidate.skills?.frameworks || [])
      ].join(', ')}`
    ];

    return parts.filter(p => p).join('\n');
  }

  /**
   * Calculate skill matching score (35 points max - reduced to make room for AI)
   */
  private calculateSkillScore(job: any, candidate: any): any {
    const requiredSkills = job.requiredSkills || [];
    const niceToHaveSkills = job.niceToHaveSkills || [];

    // Collect all candidate skills
    const candidateSkills = [
      ...(candidate.skills.primary || []),
      ...(candidate.skills.secondary || []),
      ...(candidate.skills.frameworks || []),
      ...(candidate.skills.databases || []),
      ...(candidate.skills.cloudPlatforms || []),
      ...(candidate.skills.tools || [])
    ];

    // Normalize skills for matching
    const normalizedCandidateSkills = candidateSkills.map(s => this.normalizeSkill(s));

    // Calculate matches
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of requiredSkills) {
      const normalizedSkill = this.normalizeSkill(skill);
      if (normalizedCandidateSkills.includes(normalizedSkill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    // Base score: percentage of matched required skills
    const matchRate = requiredSkills.length > 0
      ? matchedSkills.length / requiredSkills.length
      : 0;
    let score = matchRate * 30; // Max 30 points for required skills

    // Bonus: Nice-to-have skills (+5 points max)
    const niceToHaveMatched = niceToHaveSkills.filter((skill: string) =>
      normalizedCandidateSkills.includes(this.normalizeSkill(skill))
    ).length;
    const bonusScore = Math.min(5, niceToHaveMatched);

    return {
      score: Math.round(score + bonusScore),
      matchedSkills,
      missingSkills,
      matchRate: Math.round(matchRate * 100)
    };
  }

  /**
   * Calculate experience matching score (30 points max)
   */
  private calculateExperienceScore(job: any, candidate: any): any {
    const jobMinExp = job.experienceYears?.min || 0;
    const jobMaxExp = job.experienceYears?.max || 100;
    const candidateExp = candidate.professionalDetails?.totalExperience || 0;

    // Perfect match: within range
    if (candidateExp >= jobMinExp && candidateExp <= jobMaxExp) {
      return {
        score: 30,
        gap: 0,
        status: 'perfect'
      };
    }

    // Underqualified
    if (candidateExp < jobMinExp) {
      const gap = jobMinExp - candidateExp;
      const penalty = Math.min(gap * 5, 30); // 5 points penalty per year
      return {
        score: Math.max(0, 30 - penalty),
        gap: -gap,
        status: 'underqualified'
      };
    }

    // Overqualified (small penalty - might be bored or too expensive)
    if (candidateExp > jobMaxExp) {
      const gap = candidateExp - jobMaxExp;
      const penalty = Math.min(gap * 2, 10); // 2 points penalty per year
      return {
        score: Math.max(20, 30 - penalty),
        gap: gap,
        status: 'overqualified'
      };
    }

    return { score: 30, gap: 0, status: 'perfect' };
  }

  /**
   * Calculate location matching score (15 points max)
   */
  private calculateLocationScore(job: any, candidate: any): any {
    const jobLocationType = job.locationType || 'onsite';
    const jobLocation = job.location || '';
    const candidateLocation = candidate.personalInfo?.location || '';

    // Remote jobs: full points
    if (jobLocationType === 'remote') {
      return { score: 15, compatible: true };
    }

    // Check if same city
    const sameCity = this.compareCities(jobLocation, candidateLocation);

    // Onsite: must be same city
    if (jobLocationType === 'onsite') {
      return sameCity
        ? { score: 15, compatible: true }
        : { score: 5, compatible: false }; // Partial credit for relocation
    }

    // Hybrid: prefer same city but flexible
    if (jobLocationType === 'hybrid') {
      return sameCity
        ? { score: 15, compatible: true }
        : { score: 10, compatible: true }; // Still possible
    }

    return { score: 10, compatible: true };
  }

  /**
   * Calculate salary matching score (15 points max)
   */
  private calculateSalaryScore(job: any, candidate: any): any {
    // If either salary data is missing, give neutral score
    if (!job.salaryRange || !candidate.professionalDetails?.expectedCTC) {
      return { score: 8, alignment: 'unknown' };
    }

    const jobMax = job.salaryRange.max || 0;
    const candidateExpected = this.parseSalary(candidate.professionalDetails.expectedCTC);

    // If can't parse, give neutral score
    if (!candidateExpected) {
      return { score: 8, alignment: 'unknown' };
    }

    // Candidate expectations within job's max
    if (candidateExpected <= jobMax) {
      return { score: 15, alignment: 'perfect' };
    }

    // Candidate expects more
    const difference = candidateExpected - jobMax;
    const percentageOver = (difference / jobMax) * 100;

    if (percentageOver < 10) {
      return { score: 12, alignment: 'negotiable' }; // Within 10%
    } else if (percentageOver < 20) {
      return { score: 8, alignment: 'challenging' }; // 10-20%
    } else {
      return { score: 3, alignment: 'misaligned' }; // >20%
    }
  }

  /**
   * Get recommendation based on overall score
   */
  private getRecommendation(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Normalize skill name for matching (lowercase, trim, remove special chars)
   */
  private normalizeSkill(skill: string): string {
    return skill
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9+#.]/g, ''); // Keep +, #, . for C++, C#, .NET
  }

  /**
   * Compare cities for location matching
   */
  private compareCities(location1: string, location2: string): boolean {
    const city1 = location1.split(',')[0].toLowerCase().trim();
    const city2 = location2.split(',')[0].toLowerCase().trim();
    return city1 === city2;
  }

  /**
   * Parse salary string to number (handles formats like "12 LPA", "$120,000", "120000")
   */
  private parseSalary(salaryStr: string): number {
    if (!salaryStr) return 0;

    const str = salaryStr.toLowerCase().replace(/,/g, '');

    // Check for LPA (Lakhs Per Annum) - Indian format
    if (str.includes('lpa') || str.includes('lakh')) {
      const match = str.match(/(\d+\.?\d*)/);
      if (match) {
        return parseFloat(match[1]) * 100000; // Convert lakhs to actual value
      }
    }

    // Check for K (thousands)
    if (str.includes('k')) {
      const match = str.match(/(\d+\.?\d*)/);
      if (match) {
        return parseFloat(match[1]) * 1000;
      }
    }

    // Try to extract just the number
    const match = str.match(/(\d+\.?\d*)/);
    if (match) {
      return parseFloat(match[1]);
    }

    return 0;
  }
}

export default new MatchingService();
