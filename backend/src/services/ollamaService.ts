import axios from 'axios';

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

class OllamaService {
  private baseUrl: string = 'http://localhost:11434';
  private model: string = 'llama3.2:3b';
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if Ollama is running
   */
  private async checkAvailability() {
    try {
      const response = await axios.get(this.baseUrl);
      this.isAvailable = true;
      console.log('✅ Ollama is running locally');
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ Ollama not running. Start it with: ollama serve');
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.checkAvailability();
      
      if (!this.isAvailable) {
        return {
          success: false,
          message: 'Ollama not running. Start it with: ollama serve'
        };
      }

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: 'Say "API is working" if you can read this.',
        stream: false
      });

      return {
        success: true,
        message: `Local AI working! Response: ${response.data.response}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Parse job description from email text
   */
  async parseJobDescriptionFromEmail(emailContent: string): Promise<JobDescription | null> {
    await this.checkAvailability();

    if (!this.isAvailable) {
      console.error('❌ Ollama not running - start with: ollama serve');
      return null;
    }

    try {
      console.log('🤖 Calling Ollama (Llama 3.2 3B) to parse job description...');
      
      const prompt = `You are an expert recruiter assistant. Extract structured job information from the following email.

EMAIL CONTENT:
${emailContent.substring(0, 3000)} 

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
  "jobType": "full-time",
  "educationRequired": "Bachelor's"
}

Important:
- If salary is not mentioned, omit salaryRange
- If education is not mentioned, omit educationRequired
- Extract ALL technical skills mentioned
- Return ONLY the JSON object, nothing else`;

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 1000
        }
      });

      let text = response.data.response.trim();
      console.log('📝 Ollama raw response length:', text.length);

      // Clean up response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find JSON object in response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      // Parse JSON
      const jobData = JSON.parse(text);

      console.log('✅ Successfully parsed job:', jobData.title, 'at', jobData.company);
      return jobData as JobDescription;
    } catch (error: any) {
      console.error('❌ Error parsing job description:');
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.data?.response?.substring(0, 200));
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
    await this.checkAvailability();

    if (!this.isAvailable) {
      console.error('❌ Ollama not running');
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

Provide a JSON response:
{
  "overallAssessment": "Brief assessment",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "excellent",
  "interviewTips": ["tip1", "tip2"]
}`;

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 800
        }
      });

      let text = response.data.response.trim();
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const explanation = JSON.parse(text);
      return explanation as MatchExplanation;
    } catch (error: any) {
      console.error('Error generating match explanation:', error);
      return null;
    }
  }
}

export default new OllamaService();
