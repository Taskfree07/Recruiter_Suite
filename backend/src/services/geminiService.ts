import { GoogleGenerativeAI } from '@google/generative-ai';

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

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKey: string = '';
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize in constructor - wait for first use
  }

  private initialize() {
    // Skip if already initialized
    if (this.isInitialized) {
      console.log('ℹ️ Gemini already initialized, skipping...');
      return;
    }

    console.log('🔄 Initializing Gemini AI Service...');

    try {
      this.apiKey = process.env.GEMINI_API_KEY || '';

      if (!this.apiKey) {
        console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
        console.warn('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
        return;
      }

      console.log('🔑 GEMINI_API_KEY found:', this.apiKey.substring(0, 10) + '...');

      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });

      this.isInitialized = true;
      console.log('✅ Gemini AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Try to reinitialize if not initialized
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.isInitialized || !this.model) {
      return {
        success: false,
        message: 'Gemini API not initialized. Check your API key in .env file: GEMINI_API_KEY'
      };
    }

    try {
      const result = await this.model.generateContent('Say "API is working" if you can read this.');
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: `API connection successful! Response: ${text}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `API connection failed: ${error.message}`
      };
    }
  }

  /**
   * Parse job description from email text
   */
  async parseJobDescriptionFromEmail(emailContent: string): Promise<JobDescription | null> {
    // Try to initialize if not already initialized
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.isInitialized || !this.model) {
      console.error('Gemini AI not initialized - check GEMINI_API_KEY in .env file');
      return null;
    }

    try {
      console.log('🤖 Calling Gemini AI to parse job description...');
      
      const prompt = `
You are an expert recruiter assistant. Extract structured job information from the following email.

EMAIL CONTENT:
${emailContent}

Extract and return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "title": "job title",
  "company": "company name",
  "description": "full job description (200-300 words)",
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill3", "skill4"],
  "experienceYears": {
    "min": 3,
    "max": 5
  },
  "location": "city/remote",
  "locationType": "remote/onsite/hybrid",
  "salaryRange": {
    "min": 100000,
    "max": 150000,
    "currency": "USD"
  },
  "jobType": "full-time/part-time/contract/freelance",
  "educationRequired": "Bachelor's/Master's/etc"
}

Important:
- If salary is not mentioned, omit the salaryRange field entirely
- If education is not mentioned, omit educationRequired
- Extract ALL technical skills mentioned
- Infer experience level from context if not explicitly stated
- Make reasonable assumptions based on job title
- Return ONLY the JSON object, nothing else
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      console.log('📝 Gemini raw response length:', text.length);

      // Clean up response (remove markdown code blocks if present)
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse JSON
      const jobData = JSON.parse(text);

      console.log('✅ Successfully parsed job:', jobData.title, 'at', jobData.company);
      return jobData as JobDescription;
    } catch (error: any) {
      console.error('❌ Error parsing job description:');
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Stack trace:', error.stack.split('\n')[1]);
      }
      return null;
    }
  }

  /**
   * Generate match explanation between candidate and job
   */
  async generateMatchExplanation(
    candidateData: any,
    jobData: any,
    matchScore: number
  ): Promise<MatchExplanation | null> {
    // Try to initialize if not already initialized
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.isInitialized || !this.model) {
      console.error('Gemini AI not initialized - check GEMINI_API_KEY in .env file');
      return null;
    }

    try {
      const prompt = `
You are an expert technical recruiter. Analyze this candidate-job match and provide insights.

CANDIDATE:
Name: ${candidateData.personalInfo?.name || 'Candidate'}
Experience: ${candidateData.professionalDetails?.totalExperience || 0} years
Skills: ${candidateData.skills?.primary?.join(', ') || 'N/A'}
Frameworks: ${candidateData.skills?.frameworks?.join(', ') || 'N/A'}
Current Company: ${candidateData.personalInfo?.currentCompany || 'N/A'}

JOB:
Title: ${jobData.title}
Required Skills: ${jobData.requiredSkills?.join(', ') || 'N/A'}
Experience Required: ${jobData.experienceYears?.min || 0}-${jobData.experienceYears?.max || 0} years
Location: ${jobData.location}

MATCH SCORE: ${matchScore}/100

Provide a detailed analysis in JSON format (no markdown):
{
  "overallAssessment": "2-3 sentence summary of the match",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "recommendation": "excellent/good/moderate/not-recommended",
  "interviewTips": ["tip 1", "tip 2", "tip 3"]
}

Be specific, mention actual skills and experience. Return ONLY the JSON object.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const explanation = JSON.parse(text);
      return explanation as MatchExplanation;
    } catch (error: any) {
      console.error('Error generating match explanation:', error);
      return null;
    }
  }

  /**
   * Classify email type
   */
  async classifyEmail(emailContent: string): Promise<{
    type: 'job_description' | 'resume' | 'inquiry' | 'other';
    confidence: number;
    reasoning: string;
  } | null> {
    if (!this.isInitialized || !this.model) {
      console.error('Gemini AI not initialized');
      return null;
    }

    try {
      const prompt = `
Classify this email as one of: job_description, resume, inquiry, or other.

EMAIL:
${emailContent.substring(0, 1000)}

Return ONLY a JSON object (no markdown):
{
  "type": "job_description/resume/inquiry/other",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error classifying email:', error);
      return null;
    }
  }

  /**
   * Extract candidate name from resume text (for unnamed resumes)
   */
  async extractCandidateName(resumeText: string): Promise<string> {
    if (!this.isInitialized || !this.model) {
      return 'Candidate ' + Math.floor(Math.random() * 1000);
    }

    try {
      const prompt = `
Extract ONLY the candidate's full name from this resume text.
Return just the name, nothing else.

RESUME:
${resumeText.substring(0, 500)}

Return format: "First Last" or "First Middle Last"
If no name found, return "Unknown Candidate"
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const name = response.text().trim().replace(/['"]/g, '');

      return name || 'Unknown Candidate';
    } catch (error: any) {
      console.error('Error extracting name:', error);
      return 'Candidate ' + Math.floor(Math.random() * 1000);
    }
  }

  /**
   * Enhance resume parsing with soft skills
   */
  async extractSoftSkills(resumeText: string): Promise<string[]> {
    if (!this.isInitialized || !this.model) {
      return [];
    }

    try {
      const prompt = `
Extract soft skills from this resume. Return ONLY a JSON array of strings.

RESUME:
${resumeText.substring(0, 1000)}

Examples: ["Leadership", "Team Collaboration", "Problem Solving", "Communication"]

Return format: ["skill1", "skill2", "skill3"]
Return only the JSON array, no markdown, no explanations.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const skills = JSON.parse(text);

      return Array.isArray(skills) ? skills : [];
    } catch (error: any) {
      console.error('Error extracting soft skills:', error);
      return [];
    }
  }
}

export default new GeminiService();
