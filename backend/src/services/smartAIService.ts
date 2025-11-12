/**
 * Smart AI Service - Automatically switches between:
 * - LOCAL: Ollama (free, dev environment)
 * - PRODUCTION: Groq API (free tier, fast, reliable)
 */

import ollamaService from './ollamaService';
import groqService from './groqService';

interface JobDescription {
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceYears: {
    min: number;
    max: number;
  };
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance';
  educationRequired?: string;
}

interface MatchExplanation {
  overallAssessment: string;
  strengths: string[];
  concerns: string[];
  recommendation: 'excellent' | 'good' | 'moderate' | 'not-recommended';
  interviewTips: string[];
}

class SmartAIService {
  private useLocal: boolean = false;
  private checkedLocal: boolean = false;

  constructor() {
    // Check environment
    const environment = process.env.NODE_ENV || 'development';
    const forceCloud = process.env.FORCE_CLOUD_AI === 'true';
    
    console.log(`🤖 AI Service Environment: ${environment}`);
    console.log(`🌐 Force Cloud AI: ${forceCloud}`);

    // In production or if forced, always use cloud
    if (environment === 'production' || forceCloud) {
      this.useLocal = false;
      console.log('☁️ Using Cloud AI (Groq) for production');
    }
  }

  /**
   * Check if Ollama is available locally
   */
  private async checkLocalAvailability(): Promise<boolean> {
    if (this.checkedLocal) {
      return this.useLocal;
    }

    try {
      const result = await ollamaService.testConnection();
      this.useLocal = result.success;
      this.checkedLocal = true;

      if (this.useLocal) {
        console.log('✅ Local Ollama detected - using local AI');
      } else {
        console.log('⚠️ Ollama not available - switching to Cloud AI (Groq)');
      }

      return this.useLocal;
    } catch (error) {
      this.useLocal = false;
      this.checkedLocal = true;
      console.log('⚠️ Ollama check failed - using Cloud AI (Groq)');
      return false;
    }
  }

  /**
   * Get the appropriate AI service
   */
  private async getService() {
    const environment = process.env.NODE_ENV || 'development';
    const forceCloud = process.env.FORCE_CLOUD_AI === 'true';

    // Always use cloud in production
    if (environment === 'production' || forceCloud) {
      console.log('☁️ Using Groq (Cloud)');
      return groqService;
    }

    // In development, try local first, fallback to cloud
    const hasLocal = await this.checkLocalAvailability();
    
    if (hasLocal) {
      console.log('💻 Using Ollama (Local)');
      return ollamaService;
    } else {
      console.log('☁️ Fallback to Groq (Cloud)');
      return groqService;
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const service = await this.getService();
      return await service.testConnection();
    } catch (error: any) {
      return {
        success: false,
        message: `AI Service failed: ${error.message}`
      };
    }
  }

  /**
   * Parse job description from email
   */
  async parseJobDescriptionFromEmail(emailContent: string): Promise<JobDescription | null> {
    try {
      const service = await this.getService();
      return await service.parseJobDescriptionFromEmail(emailContent);
    } catch (error: any) {
      console.error('❌ Smart AI Service failed:', error.message);
      
      // Try fallback if local failed
      if (this.useLocal) {
        console.log('🔄 Local AI failed, trying Cloud AI...');
        try {
          return await groqService.parseJobDescriptionFromEmail(emailContent);
        } catch (fallbackError) {
          console.error('❌ Cloud AI also failed:', fallbackError);
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Generate match explanation
   */
  async generateMatchExplanation(
    candidateData: any,
    jobData: any,
    matchScore: number
  ): Promise<MatchExplanation | null> {
    try {
      const service = await this.getService();
      return await service.generateMatchExplanation(candidateData, jobData, matchScore);
    } catch (error: any) {
      console.error('❌ Smart AI Service failed:', error.message);
      
      // Try fallback if local failed
      if (this.useLocal) {
        console.log('🔄 Local AI failed, trying Cloud AI...');
        try {
          return await groqService.generateMatchExplanation(candidateData, jobData, matchScore);
        } catch (fallbackError) {
          console.error('❌ Cloud AI also failed:', fallbackError);
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Get current service info
   */
  getServiceInfo(): { type: string; model: string } {
    const environment = process.env.NODE_ENV || 'development';
    const forceCloud = process.env.FORCE_CLOUD_AI === 'true';

    if (environment === 'production' || forceCloud) {
      return { type: 'cloud', model: 'Groq Llama 3.2 90B' };
    }

    if (this.useLocal && this.checkedLocal) {
      return { type: 'local', model: 'Ollama Llama 3.2 3B' };
    }

    return { type: 'cloud', model: 'Groq Llama 3.2 90B (fallback)' };
  }
}

export default new SmartAIService();
