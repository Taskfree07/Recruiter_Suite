import { HfInference } from '@huggingface/inference';

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

/**
 * AI Service using Hugging Face Inference API
 * Uses lightweight models perfect for MVP:
 * - mistralai/Mistral-7B-Instruct-v0.2 (best for structured extraction)
 * - microsoft/phi-2 (lightweight, fast)
 */
class AIService {
  private hf: HfInference | null = null;
  private isInitialized: boolean = false;
  private apiToken: string = '';

  // Best models for different tasks
  private readonly MODELS = {
    // Primary model for text generation and extraction (7B params, very capable)
    extraction: 'mistralai/Mistral-7B-Instruct-v0.2',
    // Fallback: Fast and lightweight (2.7B params)
    lightweight: 'microsoft/Phi-3-mini-4k-instruct',
    // For simple text completion
    simple: 'microsoft/phi-2'
  };

  constructor() {
    // Lazy initialization
  }

  private initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Hugging Face API token (free tier available)
      this.apiToken = process.env.HUGGINGFACE_API_TOKEN || '';

      if (!this.apiToken) {
        console.warn('⚠️ HUGGINGFACE_API_TOKEN not found - using public inference (rate limited)');
        // Public inference endpoint (no token needed but rate limited)
        this.hf = new HfInference();
      } else {
        this.hf = new HfInference(this.apiToken);
      }

      this.isInitialized = true;
      console.log('✅ AI Service initialized successfully (Hugging Face)');
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.hf) {
      return {
        success: false,
        message: 'AI Service not initialized'
      };
    }

    try {
      const response = await this.hf.textGeneration({
        model: this.MODELS.lightweight,
        inputs: 'Say "API is working" if you can read this.',
        parameters: {
          max_new_tokens: 20,
          temperature: 0.7
        }
      });

      return {
        success: true,
        message: `API working! Response: ${response.generated_text.substring(0, 100)}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Parse job description from email text using AI
   */
  async parseJobDescriptionFromEmail(emailContent: string): Promise<JobDescription | null> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.hf) {
      console.error('AI Service not initialized');
      return null;
    }

    try {
      const prompt = `<s>[INST] You are an expert recruiter assistant. Extract structured job information from this email.

EMAIL CONTENT:
${emailContent.substring(0, 2000)}

Extract and return ONLY a valid JSON object (no explanations, no markdown):
{
  "title": "job title",
  "company": "company name",
  "description": "brief 2-3 sentence summary",
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill3"],
  "experienceYears": {"min": 3, "max": 5},
  "location": "city or remote",
  "locationType": "remote/onsite/hybrid",
  "jobType": "full-time"
}

JSON: [/INST]`;

      const response = await this.hf.textGeneration({
        model: this.MODELS.extraction,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
          return_full_text: false
        }
      });

      let text = response.generated_text.trim();

      // Clean up response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const jobData = JSON.parse(text);
      return jobData as JobDescription;
    } catch (error: any) {
      console.error('Error parsing job description:', error.message);

      // Fallback: Basic extraction
      return this.fallbackJobExtraction(emailContent);
    }
  }

  /**
   * Fallback method: Rule-based extraction if AI fails
   */
  private fallbackJobExtraction(emailContent: string): JobDescription {
    const lines = emailContent.split('\n');

    // Extract title (look for common patterns)
    let title = 'Software Developer';
    const titlePatterns = /(?:position|role|job|opening):\s*(.+)/i;
    const titleMatch = emailContent.match(titlePatterns);
    if (titleMatch) {
      title = titleMatch[1].trim().split('\n')[0];
    }

    // Extract company
    let company = 'Company';
    const companyPattern = /(?:company|organization):\s*(.+)/i;
    const companyMatch = emailContent.match(companyPattern);
    if (companyMatch) {
      company = companyMatch[1].trim().split('\n')[0];
    }

    // Extract skills (common tech keywords)
    const skillKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'];
    const requiredSkills = skillKeywords.filter(skill =>
      emailContent.toLowerCase().includes(skill.toLowerCase())
    );

    // Extract experience
    const expMatch = emailContent.match(/(\d+)[\+\-\s]*(?:to|\-)?\s*(\d+)?\s*years?/i);
    const experienceYears = expMatch ? {
      min: parseInt(expMatch[1]),
      max: expMatch[2] ? parseInt(expMatch[2]) : parseInt(expMatch[1]) + 2
    } : { min: 3, max: 5 };

    // Detect remote/location
    const isRemote = /remote|work from home|wfh/i.test(emailContent);
    const locationType = isRemote ? 'remote' : 'onsite';

    return {
      title,
      company,
      description: emailContent.substring(0, 300).replace(/\s+/g, ' ').trim(),
      requiredSkills,
      niceToHaveSkills: [],
      experienceYears,
      location: isRemote ? 'Remote' : 'Location TBD',
      locationType: locationType as 'remote' | 'onsite' | 'hybrid',
      jobType: 'full-time'
    };
  }

  /**
   * Generate match explanation between candidate and job
   */
  async generateMatchExplanation(
    candidateData: any,
    jobData: any,
    matchScore: number
  ): Promise<MatchExplanation | null> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.hf) {
      return null;
    }

    try {
      const prompt = `<s>[INST] Analyze this candidate-job match:

CANDIDATE: ${candidateData.personalInfo?.name || 'Candidate'}
Experience: ${candidateData.professionalDetails?.totalExperience || 0} years
Skills: ${candidateData.skills?.primary?.join(', ') || 'N/A'}

JOB: ${jobData.title}
Required: ${jobData.requiredSkills?.join(', ') || 'N/A'}
Experience: ${jobData.experienceYears?.min}-${jobData.experienceYears?.max} years

MATCH SCORE: ${matchScore}/100

Return JSON (no markdown):
{
  "overallAssessment": "brief 2-sentence summary",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1"],
  "recommendation": "excellent/good/moderate/not-recommended",
  "interviewTips": ["tip1", "tip2"]
}
[/INST]`;

      const response = await this.hf.textGeneration({
        model: this.MODELS.lightweight,
        inputs: prompt,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.5,
          return_full_text: false
        }
      });

      let text = response.generated_text.trim();
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      return JSON.parse(text) as MatchExplanation;
    } catch (error: any) {
      console.error('Error generating explanation:', error.message);

      // Fallback explanation
      return {
        overallAssessment: `This candidate has ${matchScore >= 80 ? 'excellent' : matchScore >= 60 ? 'good' : 'moderate'} compatibility with the role based on skills and experience match.`,
        strengths: candidateData.skills?.primary?.slice(0, 3) || [],
        concerns: matchScore < 70 ? ['May need additional training in some required skills'] : [],
        recommendation: matchScore >= 80 ? 'excellent' : matchScore >= 65 ? 'good' : 'moderate',
        interviewTips: ['Assess technical skills', 'Discuss past projects', 'Evaluate culture fit']
      };
    }
  }

  /**
   * Extract candidate name from resume text
   */
  async extractCandidateName(resumeText: string): Promise<string> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const prompt = `<s>[INST] Extract ONLY the person's full name from this resume. Return just the name, nothing else.

RESUME:
${resumeText.substring(0, 500)}

Name: [/INST]`;

      const response = await this.hf.textGeneration({
        model: this.MODELS.simple,
        inputs: prompt,
        parameters: {
          max_new_tokens: 10,
          temperature: 0.3,
          return_full_text: false
        }
      });

      const name = response.generated_text.trim().replace(/['"]/g, '').split('\n')[0];
      return name || 'Candidate ' + Math.floor(Math.random() * 1000);
    } catch (error) {
      // Fallback: extract from first line
      const lines = resumeText.split('\n').filter(l => l.trim().length > 0);
      const firstLine = lines[0]?.trim() || '';

      // Basic name pattern
      const nameMatch = firstLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      return nameMatch ? nameMatch[1] : 'Candidate ' + Math.floor(Math.random() * 1000);
    }
  }

  /**
   * Classify email type
   */
  async classifyEmail(emailContent: string): Promise<{
    type: 'job_description' | 'resume' | 'inquiry' | 'other';
    confidence: number;
    reasoning: string;
  }> {
    // Simple rule-based classification (fast and reliable for MVP)
    const content = emailContent.toLowerCase();

    const jobKeywords = ['job opening', 'position', 'hiring', 'vacancy', 'job description', 'requirement'];
    const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'attached', 'application'];

    const jobCount = jobKeywords.filter(k => content.includes(k)).length;
    const resumeCount = resumeKeywords.filter(k => content.includes(k)).length;

    if (jobCount > resumeCount && jobCount > 0) {
      return {
        type: 'job_description',
        confidence: Math.min(0.95, 0.6 + (jobCount * 0.1)),
        reasoning: `Found ${jobCount} job-related keywords`
      };
    } else if (resumeCount > 0) {
      return {
        type: 'resume',
        confidence: Math.min(0.95, 0.6 + (resumeCount * 0.1)),
        reasoning: `Found ${resumeCount} resume-related keywords`
      };
    } else if (content.includes('?')) {
      return {
        type: 'inquiry',
        confidence: 0.7,
        reasoning: 'Contains questions'
      };
    }

    return {
      type: 'other',
      confidence: 0.5,
      reasoning: 'No clear indicators found'
    };
  }

  /**
   * Extract soft skills from resume
   */
  async extractSoftSkills(resumeText: string): Promise<string[]> {
    // Rule-based extraction (fast and reliable)
    const commonSoftSkills = [
      'Leadership', 'Team Collaboration', 'Communication', 'Problem Solving',
      'Critical Thinking', 'Time Management', 'Adaptability', 'Creativity',
      'Project Management', 'Mentoring', 'Agile', 'Scrum'
    ];

    const text = resumeText.toLowerCase();
    return commonSoftSkills.filter(skill =>
      text.includes(skill.toLowerCase())
    );
  }
}

export default new AIService();
