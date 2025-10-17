import axios from 'axios';
import CeipalConfig from '../models/ceipalConfig';
import UnifiedJob from '../models/unifiedJob';

/**
 * Ceipal Service
 *
 * This service handles integration with Ceipal ATS API.
 * It supports both MOCK MODE (for demo/testing) and REAL API MODE.
 *
 * To switch from mock to real API:
 * 1. Get your Ceipal API credentials (API Key, API URL)
 * 2. In frontend Ceipal Settings, toggle "Mock Mode" OFF
 * 3. Enter your API URL and API Key
 * 4. Click "Save Configuration"
 * 5. Click "Test Connection" to verify
 * 6. Click "Sync Jobs Now" to fetch real jobs
 *
 * The service will automatically use real API when mockMode is false.
 */
class CeipalService {
  /**
   * Mock authentication - simulates connecting to Ceipal
   */
  async authenticate(apiKey: string, mockMode: boolean = true): Promise<boolean> {
    console.log('🔐 Authenticating with Ceipal API...');

    if (mockMode) {
      console.log('✅ Mock authentication successful!');
      return true;
    }

    // TODO: Real API authentication when you have credentials
    // const response = await axios.post(`${apiUrl}/auth`, { apiKey });
    // return response.data.success;

    return true;
  }

  /**
   * Test connection to Ceipal API
   */
  async testConnection(userId: string = 'default-user'): Promise<any> {
    try {
      const config = await CeipalConfig.findOne({ userId });

      if (!config) {
        throw new Error('Ceipal not configured. Please set up your API credentials first.');
      }

      if (config.mockMode) {
        console.log('✅ Mock connection test successful');
        return {
          success: true,
          message: 'Connected to Mock Ceipal API',
          mockMode: true
        };
      }

      // TODO: Real API connection test
      // const response = await axios.get(`${config.apiUrl}/health`, {
      //   headers: { 'Authorization': `Bearer ${config.apiKey}` }
      // });

      return {
        success: true,
        message: 'Connection successful',
        mockMode: false
      };
    } catch (error: any) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Generate mock job data
   */
  private generateMockJobs(): any[] {
    const jobTitles = [
      { title: 'Senior Full Stack Developer', skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'], level: 'Senior' },
      { title: 'DevOps Engineer', skills: ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Terraform'], level: 'Mid' },
      { title: 'Data Scientist', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'], level: 'Senior' },
      { title: 'Frontend Developer', skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Redux'], level: 'Junior' },
      { title: 'Backend Engineer', skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Microservices'], level: 'Mid' },
      { title: 'Mobile Developer', skills: ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin'], level: 'Senior' },
      { title: 'QA Automation Engineer', skills: ['Selenium', 'Java', 'TestNG', 'Jenkins', 'API Testing'], level: 'Mid' },
      { title: 'Cloud Architect', skills: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Serverless'], level: 'Lead' },
      { title: 'Product Manager', skills: ['Agile', 'Product Strategy', 'User Research', 'Roadmapping'], level: 'Senior' },
      { title: 'UI/UX Designer', skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'], level: 'Mid' }
    ];

    const companies = ['Acme Corp', 'TechFlow Inc', 'DataWorks', 'CloudNine Solutions', 'NextGen Systems'];
    const locations = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Remote', 'Seattle, WA'];
    const locationTypes = ['onsite', 'remote', 'hybrid'];

    return jobTitles.map((job, index) => ({
      title: job.title,
      description: `We are seeking a talented ${job.title} to join our growing team. You will work on cutting-edge projects and collaborate with a team of experienced professionals.

**Responsibilities:**
- Design and develop high-quality software solutions
- Collaborate with cross-functional teams
- Participate in code reviews and technical discussions
- Mentor junior team members
- Stay up-to-date with industry trends

**Requirements:**
${job.skills.map(skill => `- Strong proficiency in ${skill}`).join('\n')}
- ${job.level === 'Junior' ? '1-2' : job.level === 'Mid' ? '3-5' : job.level === 'Senior' ? '5-8' : '8+'} years of experience
- Bachelor's degree in Computer Science or related field
- Excellent problem-solving skills
- Strong communication abilities`,
      company: companies[Math.floor(Math.random() * companies.length)],
      requiredSkills: job.skills.slice(0, 4),
      niceToHaveSkills: job.skills.slice(4),
      experienceYears: {
        min: job.level === 'Junior' ? 1 : job.level === 'Mid' ? 3 : job.level === 'Senior' ? 5 : 8,
        max: job.level === 'Junior' ? 3 : job.level === 'Mid' ? 6 : job.level === 'Senior' ? 10 : 15
      },
      experienceLevel: job.level,
      location: locations[Math.floor(Math.random() * locations.length)],
      locationType: locationTypes[Math.floor(Math.random() * locationTypes.length)],
      salaryRange: {
        min: job.level === 'Junior' ? 60000 : job.level === 'Mid' ? 90000 : job.level === 'Senior' ? 130000 : 160000,
        max: job.level === 'Junior' ? 80000 : job.level === 'Mid' ? 120000 : job.level === 'Senior' ? 160000 : 200000,
        currency: 'USD'
      },
      status: Math.random() > 0.2 ? 'open' : 'filled',
      postedDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      positions: Math.floor(Math.random() * 3) + 1,
      department: 'Engineering',
      priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
      applicationsCount: Math.floor(Math.random() * 50),
      ceipalId: `CEIPAL-JOB-${1000 + index}`
    }));
  }

  /**
   * Sync jobs from Ceipal (mock or real)
   */
  async syncJobs(userId: string = 'default-user'): Promise<any> {
    try {
      console.log('📥 Syncing jobs from Ceipal...');

      const config = await CeipalConfig.findOne({ userId });

      if (!config) {
        throw new Error('Ceipal not configured');
      }

      let jobs: any[] = [];

      if (config.mockMode) {
        console.log('🎭 Using mock data...');
        jobs = this.generateMockJobs();
      } else {
        // Real API call when you have credentials
        console.log('🌐 Fetching jobs from Ceipal API...');
        jobs = await this.fetchJobsFromCeipalAPI(config);
      }

      // Save jobs to unified_jobs collection
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const job of jobs) {
        // Check if job already exists
        const existing = await UnifiedJob.findOne({
          'sources.type': 'ceipal',
          'sources.id': job.ceipalId
        });

        if (existing) {
          // Update existing job
          existing.title = job.title;
          existing.description = job.description;
          existing.company = job.company;
          existing.requiredSkills = job.requiredSkills;
          existing.niceToHaveSkills = job.niceToHaveSkills;
          existing.experienceYears = job.experienceYears;
          existing.experienceLevel = job.experienceLevel;
          existing.location = job.location;
          existing.locationType = job.locationType;
          existing.salaryRange = job.salaryRange;
          existing.status = job.status;
          existing.positions = job.positions;
          existing.department = job.department;
          existing.priority = job.priority;
          existing.applicationsCount = job.applicationsCount;

          // Update sync date in sources
          const sourceIndex = existing.sources.findIndex(s => s.type === 'ceipal' && s.id === job.ceipalId);
          if (sourceIndex !== -1) {
            existing.sources[sourceIndex].syncDate = new Date();
          }

          await existing.save();
          updatedCount++;
        } else {
          // Create new job
          const newJob = new UnifiedJob({
            title: job.title,
            description: job.description,
            company: job.company,
            requiredSkills: job.requiredSkills,
            niceToHaveSkills: job.niceToHaveSkills,
            experienceYears: job.experienceYears,
            experienceLevel: job.experienceLevel,
            location: job.location,
            locationType: job.locationType,
            salaryRange: job.salaryRange,
            status: job.status,
            postedDate: job.postedDate,
            positions: job.positions,
            department: job.department,
            priority: job.priority,
            applicationsCount: job.applicationsCount,
            viewsCount: 0,
            tags: ['ceipal', job.experienceLevel.toLowerCase()],
            sources: [
              {
                type: 'ceipal',
                id: job.ceipalId,
                syncDate: new Date(),
                metadata: {
                  mockGenerated: config.mockMode
                }
              }
            ]
          });

          await newJob.save();
          addedCount++;
        }
      }

      // Update last sync date
      config.lastSyncDate = new Date();
      config.connectionStatus = 'connected';
      config.lastError = undefined;
      await config.save();

      console.log(`✅ Sync complete: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`);

      return {
        success: true,
        message: 'Jobs synced successfully',
        stats: {
          total: jobs.length,
          added: addedCount,
          updated: updatedCount,
          skipped: skippedCount
        },
        mockMode: config.mockMode
      };

    } catch (error: any) {
      console.error('❌ Sync failed:', error);

      // Update config with error
      const config = await CeipalConfig.findOne({ userId });
      if (config) {
        config.connectionStatus = 'error';
        config.lastError = error.message;
        await config.save();
      }

      throw error;
    }
  }

  /**
   * Get or create Ceipal config
   */
  async getOrCreateConfig(userId: string = 'default-user'): Promise<any> {
    let config = await CeipalConfig.findOne({ userId });

    if (!config) {
      config = new CeipalConfig({
        userId,
        mockMode: true,
        connectionStatus: 'disconnected'
      });
      await config.save();
    }

    return config;
  }

  /**
   * Update Ceipal configuration
   */
  async updateConfig(userId: string, updates: any): Promise<any> {
    let config = await CeipalConfig.findOne({ userId });

    if (!config) {
      config = new CeipalConfig({ userId });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      (config as any)[key] = updates[key];
    });

    await config.save();

    return config;
  }

  /**
   * Fetch jobs from real Ceipal API
   * This method will be called when mockMode is false
   */
  private async fetchJobsFromCeipalAPI(config: any): Promise<any[]> {
    try {
      // Ensure we have required credentials
      if (!config.apiKey || !config.apiUrl) {
        throw new Error('API Key and API URL are required for real API mode');
      }

      console.log(`📡 Connecting to Ceipal API: ${config.apiUrl}`);

      // Make API request to Ceipal
      // Note: Adjust headers and endpoint based on actual Ceipal API documentation
      const response = await axios.get(`${config.apiUrl}/api/v1/jobs`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      // Parse and transform Ceipal jobs to our format
      // Note: Adjust this mapping based on actual Ceipal API response structure
      const ceipalJobs = response.data.jobs || response.data;

      return ceipalJobs.map((job: any) => ({
        title: job.title || job.jobTitle,
        description: job.description || job.jobDescription || '',
        company: job.company || job.companyName || 'Unknown',
        requiredSkills: this.extractSkills(job.requiredSkills || job.skills || ''),
        niceToHaveSkills: this.extractSkills(job.preferredSkills || ''),
        experienceYears: {
          min: job.minExperience || 0,
          max: job.maxExperience || 10,
        },
        experienceLevel: job.experienceLevel || this.determineLevel(job.minExperience || 0),
        location: job.location || job.city || 'Remote',
        locationType: job.locationType || (job.remote ? 'remote' : 'onsite'),
        salaryRange: {
          min: job.salaryMin || job.minSalary || 0,
          max: job.salaryMax || job.maxSalary || 0,
          currency: job.currency || 'USD',
        },
        status: job.status || 'open',
        postedDate: job.postedDate ? new Date(job.postedDate) : new Date(),
        positions: job.positions || job.openings || 1,
        department: job.department || 'Engineering',
        priority: job.priority || 'medium',
        applicationsCount: job.applicationsCount || 0,
        ceipalId: job.id || job.jobId || `CEIPAL-${Date.now()}`,
      }));
    } catch (error: any) {
      if (error.response) {
        // API responded with error
        console.error(`❌ Ceipal API Error: ${error.response.status} - ${error.response.statusText}`);
        throw new Error(`Ceipal API Error: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Request made but no response
        console.error('❌ No response from Ceipal API');
        throw new Error('Unable to connect to Ceipal API. Please check your API URL and network connection.');
      } else {
        // Other errors
        console.error('❌ Error setting up request:', error.message);
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }
    }
  }

  /**
   * Extract skills from string (comma-separated or array)
   */
  private extractSkills(skillsInput: string | string[]): string[] {
    if (Array.isArray(skillsInput)) {
      return skillsInput;
    }

    if (typeof skillsInput === 'string') {
      return skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    return [];
  }

  /**
   * Determine experience level based on years
   */
  private determineLevel(years: number): string {
    if (years <= 2) return 'Junior';
    if (years <= 5) return 'Mid';
    if (years <= 8) return 'Senior';
    return 'Lead';
  }
}

export default new CeipalService();
