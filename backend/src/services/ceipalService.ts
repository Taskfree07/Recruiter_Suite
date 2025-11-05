import axios from 'axios';
import CeipalConfig from '../models/ceipalConfig';
import UnifiedJob from '../models/unifiedJob';
import Resume from '../models/resume';

/**
 * Ceipal Service
 *
 * This service handles integration with Ceipal ATS API.
 * It supports both MOCK MODE (for demo/testing) and REAL API MODE.
 *
 * Authentication Methods Supported:
 * 1. API Key Authentication (recommended)
 * 2. Username/Password Authentication
 * 3. Custom Endpoint URL (user provides full URL with tenant/company IDs)
 *
 * To switch from mock to real API:
 * 1. Get your Ceipal API credentials
 * 2. In frontend Ceipal Settings, toggle "Mock Mode" OFF
 * 3. Choose authentication method:
 *    - Option A: Paste custom endpoint URL (easiest)
 *    - Option B: Enter API Key, Tenant ID, Company ID
 *    - Option C: Enter Username + Password
 * 4. Click "Save Configuration"
 * 5. Click "Test Connection" to verify
 * 6. Click "Sync Jobs Now" to fetch real jobs
 */
class CeipalService {
  /**
   * Generate access token using Ceipal's auth endpoint
   * Fixed endpoint: https://api.ceipal.com/v1/createAuthtoken/
   */
  private async generateCeipalToken(config: any): Promise<string | null> {
    if (!config.apiKey || config.apiKey === 'MOCK_API_KEY') {
      console.log(`⚠️ No valid API key found for token generation`);
      return null;
    }

    if (!config.username || !config.password) {
      console.log(`⚠️ Ceipal auth requires username and password`);
      console.log(`   Username: ${config.username ? 'Present' : 'Missing'}`);
      console.log(`   Password: ${config.password ? 'Present' : 'Missing'}`);
      return null;
    }

    // Fixed authorization endpoint for all users
    const authEndpoint = 'https://api.ceipal.com/v1/createAuthtoken/';

    console.log(`🔐 Generating access token from: ${authEndpoint}`);
    console.log(`📧 Using email: ${config.username}`);
    console.log(`🔑 Using API key: ${config.apiKey.substring(0, 20)}...`);

    try {
      // Ceipal auth payload
      const authPayload = {
        email: config.username,
        password: config.password,
        api_key: config.apiKey,
        json: 1
      };

      console.log(`📤 Sending auth request...`);
      const response = await axios.post(authEndpoint, authPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log(`📊 Auth response status: ${response.status}`);

      const token = response.data.access_token || response.data.token || response.data.authToken;

      if (token) {
        console.log(`✅ Access token generated successfully: ${token.substring(0, 30)}...`);
        return token;
      } else {
        console.log(`⚠️ No token in response. Available fields:`, Object.keys(response.data));
        console.log(`⚠️ Response data:`, response.data);
        return null;
      }
    } catch (error: any) {
      console.log(`❌ Failed to generate token`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Build the full API endpoint URL from config
   */
  private buildEndpointUrl(config: any, endpoint: string): string {
    let url = '';

    // If user provided custom endpoint, use it as-is for username/password auth
    if (config.customEndpoint) {
      url = config.customEndpoint;

      console.log(`🔧 Building URL - customEndpoint: ${url}`);
      console.log(`🔧 Authentication method: ${config.username ? 'username/password' : 'API key'}`);

      // For username/password authentication, don't append API key to URL
      if (config.username && config.password) {
        console.log(`✅ Using username/password auth - URL as-is: ${url}`);
        return url;
      }

      // Only append API key if no username/password and API key exists
      if (config.apiKey && config.apiKey !== 'MOCK_API_KEY' && !url.includes(config.apiKey)) {
        // Remove trailing slash if exists
        url = url.replace(/\/$/, '');
        // Append API key as path segment
        url = `${url}/${config.apiKey}`;
        console.log(`✅ Appended API key, new URL: ${url}`);
      } else {
        console.log(`⚠️ Did not append API key. Reason: ${!config.apiKey ? 'No API key' : config.apiKey === 'MOCK_API_KEY' ? 'Mock mode' : 'URL already contains key'}`);
      }

      return url;
    }

    // Otherwise, construct from parts
    const baseUrl = config.apiUrl || 'https://api.ceipal.com';
    const tenantId = config.tenantId || '';
    const companyId = config.companyId || '';

    // Different endpoint patterns based on Ceipal API structure
    if (endpoint === 'jobs') {
      // Remove trailing slash for clean URL
      url = `${baseUrl}/getCustomJobPostingDetails/${tenantId}/${companyId}`;
    } else if (endpoint === 'candidates') {
      url = `${baseUrl}/applicants`;
    } else if (endpoint === 'job-postings') {
      url = `${baseUrl}/job-postings`;
    } else {
      url = `${baseUrl}/${endpoint}`;
    }

    // Note: API key is NOT appended to URL
    // It's used to generate bearer token which goes in Authorization header
    console.log(`📍 Final endpoint URL: ${url}`);

    return url;
  }

  /**
   * Build authorization headers based on config
   */
  private async buildAuthHeaders(config: any): Promise<any> {
    const headers: any = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    // Priority 1: Access Token / API Key (Bearer token for Ceipal API)
    if (config.accessToken) {
      console.log(`🔑 Using Access Token/API Key authentication`);
      headers['Authorization'] = `Bearer ${config.accessToken}`;
      headers['Content-Type'] = 'application/json';
      return headers;
    }
    
    // Priority 1b: Ceipal authentication - Generate token using fixed auth endpoint
    // Uses https://api.ceipal.com/v1/createAuthtoken/ with credentials
    if (config.apiKey && config.apiKey !== 'MOCK_API_KEY' && config.username && config.password) {
      console.log(`🔑 Using Ceipal authentication (credentials -> auth endpoint -> access token)`);
      const authToken = await this.generateCeipalToken(config);
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        headers['Content-Type'] = 'application/json';
        return headers;
      }
      console.log(`⚠️ Ceipal authentication failed, falling back to direct API key`);
    }
    
    // Priority 1c: API Key as alternative field (direct use)
    if (config.apiKey && config.apiKey !== 'MOCK_API_KEY') {
      console.log(`🔑 Using API Key authentication`);
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['Content-Type'] = 'application/json';
      return headers;
    }

    // Priority 2: Username/password authentication
    if (config.username && config.password) {
      console.log(`🔑 Using username/password authentication for: ${config.username}`);
      
      // Method 1: Basic Auth
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      
      // Method 2: Also try form data style (some APIs prefer this)
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      
      return headers;
    }

    // For API key authentication (if no username/password)
    headers['Content-Type'] = 'application/json';

    // Method 1: API Key as header (try both common formats)
    if (config.apiKey && config.apiKey !== 'MOCK_API_KEY') {
      headers['X-API-Key'] = config.apiKey;
      headers['apiKey'] = config.apiKey;
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // Method 2: Tenant and Company IDs as headers (if available)
    if (config.tenantId) {
      headers['X-Tenant-ID'] = config.tenantId;
      headers['tenantId'] = config.tenantId;
    }
    if (config.companyId) {
      headers['X-Company-ID'] = config.companyId;
      headers['companyId'] = config.companyId;
    }

    return headers;
  }
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

      // Validate required fields
      if (!config.apiKey || config.apiKey === 'MOCK_API_KEY') {
        throw new Error('API Key is required. Please add your Ceipal API Key in settings.');
      }

      if (!config.username || !config.password) {
        throw new Error('Email and Password are required. Please add them in settings.');
      }

      if (!config.resumeApiUrl) {
        throw new Error('Resume API URL is required. Please add your configured resume endpoint URL in settings.');
      }

      console.log('🔌 Testing Ceipal API connection...');

      // Generate access token first
      console.log('🔐 Generating access token for connection test...');
      const headers = await this.buildAuthHeaders(config);

      if (!headers.Authorization) {
        throw new Error('Failed to generate access token. Please verify your API Key, Email, and Password are correct.');
      }

      console.log(`✅ Access token generated successfully`);

      // Test using the Resume API URL
      const endpointUrl = config.resumeApiUrl;
      console.log(`📍 Testing endpoint: ${endpointUrl}`);

      // Build query params for testing - just fetch first page
      const params: any = {
        page: 1,
        paging_length: 5  // Just fetch 5 resumes for connection test
      };

      console.log(`🔑 Request params:`, params);
      console.log(`🔑 Authorization header present:`, headers.Authorization ? 'Yes (Bearer token)' : 'No');

      // Make test request
      console.log(`📡 Making GET request to: ${endpointUrl}`);
      const response = await axios.get(endpointUrl, {
        headers,
        params,
        timeout: 15000, // 15 second timeout for test
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors, we want to handle them
      });

      console.log(`📊 Response Status: ${response.status}`);
      console.log(`📊 Response Headers:`, Object.keys(response.headers));

      if (response.status === 200) {
        const results = response.data.results || response.data.data || [];
        const count = response.data.count || results.length || 0;

        console.log(`✅ Connection test successful! Found ${count} resumes in response.`);

        return {
          success: true,
          message: `Connected to Ceipal Resume API successfully! Found ${count} resumes.`,
          mockMode: false,
          responsePreview: typeof response.data === 'object' ?
            JSON.stringify(response.data).substring(0, 200) + '...' :
            String(response.data).substring(0, 200) + '...'
        };
      } else {
        console.log(`⚠️ Non-200 response: ${response.status} - ${response.statusText}`);
        console.log(`Response data preview:`, typeof response.data === 'string' ?
          response.data.substring(0, 300) : JSON.stringify(response.data).substring(0, 300));

        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error.message);
      console.error('❌ Error details:', error.response?.data);

      if (error.response) {
        const errorMsg = error.response.data?.detail ||
                        error.response.data?.message ||
                        error.response.data?.error ||
                        error.response.statusText;

        if (error.response.status === 403 || error.response.status === 401) {
          throw new Error(`Authentication failed (${error.response.status}): ${errorMsg}. Please verify your Email, Password, and API Key are correct.`);
        }

        throw new Error(`API returned ${error.response.status}: ${errorMsg}`);
      } else if (error.request) {
        throw new Error(`Connection failed: No response from server. Check your Resume API URL and network.`);
      } else {
        throw new Error(`Connection failed: ${error.message}`);
      }
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
        // Check if job already exists for this user
        const existing = await UnifiedJob.findOne({
          'sources.type': 'ceipal',
          'sources.id': job.ceipalId,
          userId: userId // Ensure we only update jobs owned by this user
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
            userId: userId, // Track which user owns this job
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
    // Use findOneAndUpdate to avoid version conflicts
    const config = await CeipalConfig.findOneAndUpdate(
      { userId },
      { $set: updates },
      { 
        new: true,  // Return updated document
        upsert: true,  // Create if doesn't exist
        runValidators: true  // Run schema validation
      }
    );

    return config;
  }

  /**
   * Fetch jobs from real Ceipal API with filtering support
   * This method will be called when mockMode is false
   */
  private async fetchJobsFromCeipalAPI(config: any, filters?: any): Promise<any[]> {
    try {
      console.log(`📡 Connecting to Ceipal API...`);

      // Build the endpoint URL
      const endpointUrl = this.buildEndpointUrl(config, 'jobs');
      console.log(`📍 Endpoint: ${endpointUrl}`);

      // Build auth headers
      const headers = await this.buildAuthHeaders(config);

      // Build query parameters for filtering (based on screenshot rules)
      const params: any = {};

      // Try adding credentials as query params for custom endpoints
      if (config.customEndpoint && config.username && config.password) {
        params.username = config.username;
        params.password = config.password;
      }

      if (filters) {
        // Job filters
        if (filters.position_title) params.position_title = filters.position_title;
        if (filters.job_status) params.job_status = filters.job_status;
        if (filters.assigned_recruiter) params.assigned_recruiter = filters.assigned_recruiter;
        if (filters.industry) params.industry = filters.industry;
        if (filters.job_category) params.job_category = filters.job_category;
        if (filters.job_type) params.job_type = filters.job_type;
      }

      console.log(`🔍 Fetching from: ${endpointUrl}`);
      console.log(`📦 With params:`, Object.keys(params).length > 0 ? Object.keys(params) : 'none');

      // Make API request to Ceipal - use GET for this endpoint
      const response = await axios.get(endpointUrl, {
        headers,
        params,
        timeout: 30000, // 30 second timeout
      });

      console.log(`✅ Received response from Ceipal API`);

      // Parse and transform Ceipal jobs to our format
      // Note: Adjust this mapping based on actual Ceipal API response structure
      const ceipalJobs = response.data.jobs || response.data.data || response.data || [];

      if (!Array.isArray(ceipalJobs)) {
        console.warn('⚠️ Unexpected API response format. Expected array of jobs.');
        return [];
      }

      console.log(`📊 Found ${ceipalJobs.length} jobs`);

      return ceipalJobs.map((job: any) => ({
        // Map Ceipal field names to our schema
        title: job['Job Title'] || job.jobTitle || job.title || 'Untitled',
        description: job['Job Description'] || job['Public Job Description'] || job.jobDescription || job.description || '',
        company: job['Client'] || job['End Client'] || job.client || job.company || 'Unknown',
        requiredSkills: this.extractSkills(job['Primary Skills'] || job.primarySkills || job.requiredSkills || ''),
        niceToHaveSkills: this.extractSkills(job['Secondary Skills'] || job.secondarySkills || job.preferredSkills || ''),
        experienceYears: {
          min: this.parseExperience(job['Experience'] || job.experience)?.min || 0,
          max: this.parseExperience(job['Experience'] || job.experience)?.max || 10,
        },
        experienceLevel: job['Employment Level'] || job.employmentLevel || job.experienceLevel || 'Mid',
        location: job['Location'] || job['City'] || job.location || job.city || 'Remote',
        locationType: job['Remote Job'] === 'Yes' || job['Remote Job'] === true ? 'remote' : job['Job Type'] || 'onsite',
        salaryRange: {
          min: this.parseSalary(job['Pay Rate / Salary'] || job.payRate)?.min || 0,
          max: this.parseSalary(job['Client Bill Rate / Salary'] || job.billRate)?.max || 0,
          currency: 'USD',
        },
        status: this.mapJobStatus(job['Job Status'] || job.jobStatus || job.status),
        postedDate: job['Career Portal Published Date'] || job['Job Start Date'] || job.postedDate ? new Date(job['Career Portal Published Date'] || job['Job Start Date'] || job.postedDate) : new Date(),
        positions: parseInt(job['Number of Positions'] || job.numberOfPositions || job.positions || '1'),
        department: job['Department'] || job.department || 'Engineering',
        priority: this.mapPriority(job['Priority'] || job.priority),
        applicationsCount: parseInt(job['Maximum Allowed Submissions'] || job.maxSubmissions || '0'),
        ceipalId: job['CEIPAL Ref #'] || job['Job Code'] || job['Client Job ID'] || job.ceipalRef || job.jobCode || job.id || `CEIPAL-${Date.now()}-${Math.random()}`,
      }));
    } catch (error: any) {
      if (error.response) {
        // API responded with error
        console.error(`❌ Ceipal API Error: ${error.response.status} - ${error.response.statusText}`);
        console.error(`Response headers:`, error.response.headers);
        console.error(`Response data:`, typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : error.response.data);

        // Provide helpful error message
        let errorMsg = error.response.statusText;
        if (error.response.status === 403) {
          errorMsg = 'Access Forbidden. Please verify your API credentials (API key, username, password) are correct and active.';
        } else if (error.response.status === 401) {
          errorMsg = 'Unauthorized. Your API key or credentials may be invalid or expired.';
        }

        throw new Error(`Ceipal API Error: ${errorMsg}`);
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
   * Fetch candidates from Ceipal API with filtering support
   */
  async fetchCandidates(userId: string, filters?: {
    skills?: string[];
    country?: string;
    postal_code?: string;
    work_authorization?: string;
    applicant_status?: string;
    modifiedAfter?: Date;
    modifiedBefore?: Date;
    experience?: number;
  }): Promise<any[]> {
    try {
      const config = await CeipalConfig.findOne({ userId });

      if (!config || config.mockMode) {
        throw new Error('Real API mode required for fetching candidates');
      }

      console.log(`📡 Fetching candidates from Ceipal API...`);

      // Build the endpoint URL
      const endpointUrl = this.buildEndpointUrl(config, 'candidates');

      // Build auth headers
      const headers = await this.buildAuthHeaders(config);

      // Build query parameters (based on screenshot rules)
      const params: any = {};

      if (filters) {
        if (filters.skills && filters.skills.length > 0) params.skills = filters.skills.join(',');
        if (filters.country) params.country = filters.country;
        if (filters.postal_code) params.postal_code = filters.postal_code;
        if (filters.work_authorization) params.work_authorization = filters.work_authorization;
        if (filters.applicant_status) params.applicant_status = filters.applicant_status;
        if (filters.modifiedAfter) params.modifiedAfter = filters.modifiedAfter.toISOString();
        if (filters.modifiedBefore) params.modifiedBefore = filters.modifiedBefore.toISOString();
        if (filters.experience) params.experience = filters.experience;
      }

      // Make API request
      const response = await axios.get(endpointUrl, {
        headers,
        params,
        timeout: 30000,
      });

      const candidates = response.data.candidates || response.data.data || response.data || [];

      console.log(`✅ Found ${candidates.length} candidates`);

      return candidates;
    } catch (error: any) {
      console.error('❌ Error fetching candidates:', error.message);
      throw error;
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

  /**
   * Parse experience string like "5-7 years" or "5+" into min/max
   */
  private parseExperience(exp: any): { min: number; max: number } | null {
    if (!exp) return null;

    const str = String(exp).toLowerCase();

    // Pattern: "5-7 years" or "5-7"
    const rangeMatch = str.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
    }

    // Pattern: "5+ years" or "5+"
    const plusMatch = str.match(/(\d+)\+/);
    if (plusMatch) {
      const min = parseInt(plusMatch[1]);
      return { min, max: min + 5 };
    }

    // Pattern: just a number "5"
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      const years = parseInt(numMatch[1]);
      return { min: years, max: years + 2 };
    }

    return null;
  }

  /**
   * Parse salary string like "$80,000 - $100,000" or "80-100K"
   */
  private parseSalary(sal: any): { min: number; max: number } | null {
    if (!sal) return null;

    const str = String(sal).replace(/[$,K]/gi, '');

    // Pattern: "80000 - 100000" or "80-100"
    const rangeMatch = str.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      let min = parseInt(rangeMatch[1]);
      let max = parseInt(rangeMatch[2]);

      // If numbers are small (like 80-100), they might be in thousands
      if (min < 1000) min *= 1000;
      if (max < 1000) max *= 1000;

      return { min, max };
    }

    // Pattern: just a number
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      let num = parseInt(numMatch[1]);
      if (num < 1000) num *= 1000;
      return { min: num, max: num };
    }

    return null;
  }

  /**
   * Map Ceipal job status to our status
   */
  private mapJobStatus(status: any): string {
    if (!status) return 'open';

    const str = String(status).toLowerCase();

    if (str.includes('open') || str.includes('active')) return 'open';
    if (str.includes('closed') || str.includes('inactive')) return 'closed';
    if (str.includes('filled') || str.includes('completed')) return 'filled';
    if (str.includes('hold') || str.includes('pause')) return 'on-hold';
    if (str.includes('interview')) return 'interviewing';

    return 'open';
  }

  /**
   * Map Ceipal priority to our priority
   */
  private mapPriority(priority: any): string {
    if (!priority) return 'medium';

    const str = String(priority).toLowerCase();

    if (str.includes('urgent') || str.includes('critical') || str.includes('high')) return 'urgent';
    if (str.includes('high')) return 'high';
    if (str.includes('low')) return 'low';

    return 'medium';
  }

  /**
   * Sync resumes/submissions from Ceipal to Resume Dashboard
   * Endpoint: https://api.ceipal.com/getCustomSubmissionDetails/{tenantId}/{companyId}/
   */
  async syncResumes(userId: string): Promise<any> {
    try {
      console.log(`🔄 Starting Ceipal resume sync for user: ${userId}`);

      const config = await CeipalConfig.findOne({ userId });

      if (!config) {
        throw new Error('Ceipal not configured. Please set up your API credentials first.');
      }

      // Check if mock mode is enabled
      if (config.mockMode) {
        throw new Error('Resume sync is not available in mock mode. Please disable mock mode and add your real API credentials.');
      }

      // Validate required fields
      if (!config.apiKey || config.apiKey === 'MOCK_API_KEY') {
        throw new Error('API Key is required. Please add your Ceipal API Key in settings.');
      }

      if (!config.username || !config.password) {
        throw new Error('Email and Password are required for authentication. Please add them in settings.');
      }

      if (!config.resumeApiUrl) {
        throw new Error('Resume API URL is required. Please add your configured resume endpoint URL in settings.');
      }

      // Generate access token using fixed Ceipal auth endpoint
      console.log(`🔐 Generating access token for resume sync...`);
      const headers = await this.buildAuthHeaders(config);

      if (!headers.Authorization) {
        throw new Error('Failed to generate access token. Please verify your API Key, Email, and Password are correct.');
      }

      // Use the user's configured Resume API URL
      const endpointUrl = config.resumeApiUrl;

      console.log(`📍 Fetching resumes from: ${endpointUrl}`);

      // Fetch all resumes with pagination
      let allResumes: any[] = [];
      let page = 1;
      let hasMore = true;
      const pagingLength = 40; // Records per page

      while (hasMore) {
        console.log(`📄 Fetching page ${page}...`);

        const response = await axios.get(endpointUrl, {
          headers,
          params: {
            page,
            paging_length: pagingLength
          },
          timeout: 30000
        });

        const results = response.data.results || response.data.data || [];
        allResumes = allResumes.concat(results);

        console.log(`✅ Page ${page}: Found ${results.length} resumes`);

        // Check if there are more pages
        const totalCount = response.data.count || 0;
        const fetchedCount = allResumes.length;
        hasMore = fetchedCount < totalCount && results.length === pagingLength;
        
        if (hasMore) {
          page++;
        }

        // Safety limit: don't fetch more than 500 resumes in one sync
        if (fetchedCount >= 500) {
          console.log(`⚠️ Reached 500 resume limit, stopping pagination`);
          break;
        }
      }

      console.log(`📊 Total resumes fetched: ${allResumes.length}`);

      // Save resumes to database
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const submission of allResumes) {
        try {
          // Check if resume already exists (by submission ID or email)
          const submissionId = submission.submission_id || submission.id;
          const email = submission.email || submission.candidate_email;

          // Check if this resume already exists by source ID or email
          const existingResume = await Resume.findOne({
            $or: [
              { 'sources.id': submissionId, 'sources.type': 'ceipal' },
              { email: email }
            ]
          });

          if (existingResume) {
            // Update existing resume - add new source if not exists
            const hasSource = existingResume.sources.some(
              s => s.type === 'ceipal' && s.id === submissionId
            );

            if (!hasSource) {
              existingResume.sources.push({
                type: 'ceipal',
                id: submissionId,
                syncDate: new Date(),
                rawData: submission
              });
            } else {
              // Update existing source
              const sourceIndex = existingResume.sources.findIndex(
                s => s.type === 'ceipal' && s.id === submissionId
              );
              existingResume.sources[sourceIndex].syncDate = new Date();
              existingResume.sources[sourceIndex].rawData = submission;
            }

            // Update fields if they have values
            if (submission.candidate_name || submission.name) {
              const fullName = submission.candidate_name || submission.name;
              existingResume.fullName = fullName;
              const nameParts = fullName.split(' ');
              existingResume.firstName = nameParts[0];
              existingResume.lastName = nameParts.slice(1).join(' ');
            }
            if (email) existingResume.email = email;
            if (submission.phone || submission.contact_number) {
              existingResume.phone = submission.phone || submission.contact_number;
            }
            if (submission.location || submission.city) {
              existingResume.location = {
                ...existingResume.location,
                city: submission.city || submission.location
              };
            }

            await existingResume.save();
            updatedCount++;
          } else {
            // Create new resume
            const fullName = submission.candidate_name || submission.name || 'Unknown';
            const nameParts = fullName.split(' ');

            const newResume = new Resume({
              userId: userId,
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' ') || undefined,
              fullName: fullName,
              email: email || undefined,
              phone: submission.phone || submission.contact_number || undefined,
              location: {
                city: submission.city || submission.location || undefined
              },
              currentTitle: submission.title || submission.job_title || undefined,
              skills: submission.skills ? submission.skills.split(',').map((s: string) => s.trim()) : [],
              experience: submission.experience || submission.years_of_experience || undefined,
              resumeText: submission.resume_text || undefined,
              sources: [{
                type: 'ceipal',
                id: submissionId,
                syncDate: new Date(),
                rawData: submission
              }],
              status: 'active'
            });

            await newResume.save();
            addedCount++;
          }
        } catch (error: any) {
          console.error(`⚠️ Error processing resume ${submission.candidate_name || submission.name}:`, error.message);
          skippedCount++;
        }
      }

      // Update config
      config.lastSyncDate = new Date();
      config.connectionStatus = 'connected';
      await config.save();

      console.log(`✅ Resume sync complete: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`);

      return {
        success: true,
        message: `Successfully synced ${allResumes.length} resumes from Ceipal`,
        stats: {
          total: allResumes.length,
          added: addedCount,
          updated: updatedCount,
          skipped: skippedCount
        }
      };

    } catch (error: any) {
      console.error('❌ Resume sync failed:', error);
      throw new Error(`Resume sync failed: ${error.message}`);
    }
  }
}

export default new CeipalService();
