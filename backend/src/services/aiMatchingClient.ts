import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

interface AIMatchResult {
  overall_similarity: number;
  overall_similarity_percentage: number;
  skills_match_score: number;
  skills_match_percentage: number;
  matched_skills: Array<{
    job_skill: string;
    candidate_skill: string;
    similarity: number;
  }>;
  matched_skills_count: number;
  total_required_skills: number;
  weighted_score: number;
  weighted_score_percentage: number;
}

interface BatchMatchResult {
  total_candidates: number;
  results: Array<{
    candidate_id: string;
    overall_similarity: number;
    skills_match_score: number;
    matched_skills_count: number;
    weighted_score: number;
    weighted_score_percentage: number;
  }>;
}

class AIMatchingClient {
  private baseURL: string;
  private isAvailable: boolean = true;

  constructor() {
    this.baseURL = AI_SERVICE_URL;
    this.checkHealth();
  }

  /**
   * Check if AI service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 2000 });
      this.isAvailable = response.status === 200;
      console.log('✅ AI Matching Service is available');
      return true;
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️  AI Matching Service is not available. Falling back to keyword matching.');
      return false;
    }
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Calculate similarity between two texts
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/similarity`,
        { text1, text2 },
        { timeout: 10000 }
      );

      return response.data.similarity;
    } catch (error: any) {
      console.error('Error calculating similarity:', error.message);
      return null;
    }
  }

  /**
   * Match a candidate against a job
   */
  async matchCandidate(
    jobDescription: string,
    candidateResume: string,
    jobSkills: string[],
    candidateSkills: string[]
  ): Promise<AIMatchResult | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/match-candidate`,
        {
          job_description: jobDescription,
          candidate_resume: candidateResume,
          job_skills: jobSkills,
          candidate_skills: candidateSkills
        },
        { timeout: 15000 }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error matching candidate:', error.message);
      return null;
    }
  }

  /**
   * Batch match multiple candidates against a job
   */
  async batchMatch(
    jobDescription: string,
    jobSkills: string[],
    candidates: Array<{ id: string; resume: string; skills: string[] }>
  ): Promise<BatchMatchResult | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/batch-match`,
        {
          job_description: jobDescription,
          job_skills: jobSkills,
          candidates
        },
        { timeout: 30000 }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error in batch match:', error.message);
      return null;
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(text: string | string[]): Promise<number[][] | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/embed`,
        { text },
        { timeout: 10000 }
      );

      return response.data.embeddings;
    } catch (error: any) {
      console.error('Error generating embeddings:', error.message);
      return null;
    }
  }
}

// Export singleton instance
export default new AIMatchingClient();
