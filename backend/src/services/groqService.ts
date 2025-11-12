import Groq from 'groq-sdk';

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

class GroqService {
  private client: Groq | null = null;
  private apiKey: string = '';
  private isInitialized: boolean = false;

  constructor() {
    // Initialize on first use
  }

  private initialize() {
    // Skip if already initialized
    if (this.isInitialized) {
      console.log('✅ Groq already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Groq AI Service...');
      
      this.apiKey = process.env.GROQ_API_KEY || '';

      if (!this.apiKey) {
        console.warn('⚠️ GROQ_API_KEY not found in environment variables');
        console.warn('Get your free API key from: https://console.groq.com/keys');
        return;
      }

      console.log('🔑 GROQ_API_KEY found:', this.apiKey.substring(0, 10) + '...');

      this.client = new Groq({
        apiKey: this.apiKey
      });

      this.isInitialized = true;
      console.log('✅ Groq AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Groq AI:', error);
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

    if (!this.isInitialized || !this.client) {
      return {
        success: false,
        message: 'Groq API not initialized. Get free API key from: https://console.groq.com/keys'
      };
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "API is working" if you can read this.' }],
        max_tokens: 50
      });

      const text = completion.choices[0]?.message?.content || '';

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
   * Validate if content is actually a resume
   * Returns confidence score 0-100 and detected elements
   */
  async validateIsResume(text: string): Promise<{ isResume: boolean; confidence: number; reason: string }> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.isInitialized || !this.client) {
      // Fallback to simple keyword check
      const hasName = /name|resume|cv|curriculum/i.test(text);
      const hasExperience = /experience|work|job|position|company/i.test(text);
      const hasSkills = /skill|proficient|technology|programming/i.test(text);
      const hasEducation = /education|degree|bachelor|master|university|college/i.test(text);
      
      const score = (hasName ? 25 : 0) + (hasExperience ? 25 : 0) + (hasSkills ? 25 : 0) + (hasEducation ? 25 : 0);
      return {
        isResume: score >= 50,
        confidence: score,
        reason: score >= 50 ? 'Contains resume elements' : 'Missing key resume elements'
      };
    }

    try {
      const prompt = `Analyze if this is an actual RESUME/CV document. A resume must contain:
- Personal information (name, contact)
- Work experience or professional history
- Skills or competencies
- Education background

TEXT TO ANALYZE (first 2000 chars):
${text.substring(0, 2000)}

Respond with ONLY a JSON object:
{
  "isResume": true/false,
  "confidence": 0-100,
  "reason": "brief explanation",
  "foundElements": ["name", "experience", "skills", "education"]
}

Rules:
- isResume=true ONLY if it has at least 3 of: name, experience, skills, education
- confidence=high (80+) if all 4 elements present
- confidence=medium (50-79) if 3 elements present
- confidence=low (0-49) if less than 3 elements
- Regular emails, letters, receipts are NOT resumes`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200
      });

      let responseText = completion.choices[0]?.message?.content || '';
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      const result = JSON.parse(responseText);
      return {
        isResume: result.isResume,
        confidence: result.confidence,
        reason: result.reason
      };
    } catch (error: any) {
      console.error('Resume validation error:', error.message);
      // Fallback
      return { isResume: true, confidence: 50, reason: 'Validation failed, allowing through' };
    }
  }

  /**
   * Validate if content is actually a job description
   * Returns confidence score 0-100 and detected elements
   */
  async validateIsJobDescription(text: string): Promise<{ isJob: boolean; confidence: number; reason: string }> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.isInitialized || !this.client) {
      // Fallback to simple keyword check
      const hasTitle = /position|role|job title|hiring|opportunity/i.test(text);
      const hasDescription = /responsibilities|duties|description|about the role/i.test(text);
      const hasRequirements = /requirements|qualifications|skills required|must have/i.test(text);
      const hasCompany = /company|employer|organization|we are/i.test(text);
      
      const score = (hasTitle ? 25 : 0) + (hasDescription ? 25 : 0) + (hasRequirements ? 25 : 0) + (hasCompany ? 25 : 0);
      return {
        isJob: score >= 50,
        confidence: score,
        reason: score >= 50 ? 'Contains job posting elements' : 'Missing key job description elements'
      };
    }

    try {
      const prompt = `Analyze if this is an actual JOB DESCRIPTION/JOB POSTING. A job posting must contain:
- Job title or role name
- Job description or responsibilities
- Required skills or qualifications
- Company information (optional but common)

TEXT TO ANALYZE (first 2000 chars):
${text.substring(0, 2000)}

Respond with ONLY a JSON object:
{
  "isJob": true/false,
  "confidence": 0-100,
  "reason": "brief explanation",
  "foundElements": ["title", "description", "requirements", "company"]
}

Rules:
- isJob=true ONLY if it has at least 3 of: job title, description, requirements, company
- confidence=high (80+) if all 4 elements present
- confidence=medium (50-79) if 3 elements present
- confidence=low (0-49) if less than 3 elements
- Regular emails, newsletters, JIRA notifications are NOT job postings`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200
      });

      let responseText = completion.choices[0]?.message?.content || '';
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      const result = JSON.parse(responseText);
      return {
        isJob: result.isJob,
        confidence: result.confidence,
        reason: result.reason
      };
    } catch (error: any) {
      console.error('Job validation error:', error.message);
      // Fallback
      return { isJob: true, confidence: 50, reason: 'Validation failed, allowing through' };
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

    if (!this.isInitialized || !this.client) {
      console.error('❌ Groq AI not initialized - check GROQ_API_KEY in .env file');
      console.error('   Get free API key from: https://console.groq.com/keys');
      return null;
    }

    try {
      console.log('🤖 Calling Groq AI (Llama 3.2) to parse job description...');
      
      const prompt = `You are an expert recruiter assistant. Extract structured job information from the following email.

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
- Return ONLY the JSON object, nothing else`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Latest stable model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      });

      let text = completion.choices[0]?.message?.content || '';
      console.log('📝 Groq raw response length:', text.length);

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
      if (error.response) {
        console.error('   API Response:', error.response.data);
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

    if (!this.isInitialized || !this.client) {
      console.error('❌ Groq AI not initialized - check GROQ_API_KEY in .env file');
      return null;
    }

    try {
      const prompt = `You are an expert technical recruiter. Analyze this candidate-job match and provide insights.

CANDIDATE:
Name: ${candidateData.personalInfo?.name || 'Candidate'}
Experience: ${candidateData.professionalDetails?.totalExperience || 0} years
Skills: ${candidateData.skills?.primary?.join(', ') || 'N/A'}

JOB:
Title: ${jobData.title}
Required Skills: ${jobData.requiredSkills?.join(', ') || 'N/A'}
Experience Required: ${jobData.experienceYears?.min || 0}-${jobData.experienceYears?.max || 0} years

Match Score: ${matchScore}%

Provide a JSON response with this structure:
{
  "overallAssessment": "Brief overall assessment",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "excellent/good/moderate/not-recommended",
  "interviewTips": ["tip1", "tip2"]
}`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1500
      });

      let text = completion.choices[0]?.message?.content || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const explanation = JSON.parse(text);
      return explanation as MatchExplanation;
    } catch (error: any) {
      console.error('Error generating match explanation:', error);
      return null;
    }
  }
}

export default new GroqService();
