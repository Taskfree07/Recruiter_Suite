import parserService from './parserService';

// Comprehensive skill categories for recruiter flow
const SKILL_CATEGORIES = {
  // Programming Languages
  programmingLanguages: {
    'Java': ['java', 'j2ee', 'core java', 'advanced java'],
    'Python': ['python', 'python3', 'python2'],
    '.NET': ['dotnet', '.net', 'c#', 'csharp', 'asp.net', 'vb.net'],
    'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'typescript', 'ts'],
    'C++': ['c++', 'cpp'],
    'C': ['c programming', 'c language'],
    'Go': ['golang', 'go lang', 'go programming'],
    'Ruby': ['ruby', 'ruby on rails', 'rails'],
    'PHP': ['php', 'php7', 'php8'],
    'Swift': ['swift', 'swift ui'],
    'Kotlin': ['kotlin'],
    'Rust': ['rust'],
    'Scala': ['scala'],
    'R': ['r programming', 'r language'],
  },

  // Frontend Frameworks
  frontendFrameworks: {
    'React': ['react', 'reactjs', 'react.js', 'react native', 'redux', 'react hooks'],
    'Angular': ['angular', 'angularjs', 'angular 2', 'angular 12', 'angular 15'],
    'Vue.js': ['vue', 'vuejs', 'vue.js', 'vue 3', 'nuxt'],
    'Next.js': ['nextjs', 'next.js'],
    'Svelte': ['svelte'],
    'jQuery': ['jquery'],
  },

  // Backend Frameworks
  backendFrameworks: {
    'Spring Boot': ['spring boot', 'spring', 'spring mvc', 'spring framework'],
    'Django': ['django', 'django rest framework', 'drf'],
    'Flask': ['flask', 'flask api'],
    'Express.js': ['express', 'expressjs', 'express.js'],
    'Node.js': ['nodejs', 'node.js', 'node js'],
    'FastAPI': ['fastapi', 'fast api'],
    'Laravel': ['laravel', 'laravel 9'],
    'ASP.NET': ['asp.net', 'asp.net core', 'asp.net mvc'],
    'Ruby on Rails': ['ruby on rails', 'rails', 'ror'],
  },

  // Databases
  databases: {
    'MySQL': ['mysql', 'my sql'],
    'PostgreSQL': ['postgresql', 'postgres', 'psql'],
    'MongoDB': ['mongodb', 'mongo', 'mongoose'],
    'Oracle': ['oracle', 'oracle db', 'pl/sql'],
    'SQL Server': ['sql server', 'mssql', 'ms sql'],
    'Redis': ['redis', 'redis cache'],
    'Cassandra': ['cassandra', 'apache cassandra'],
    'DynamoDB': ['dynamodb', 'dynamo db'],
    'Elasticsearch': ['elasticsearch', 'elastic search'],
    'Firebase': ['firebase', 'firestore'],
  },

  // Cloud Platforms
  cloudPlatforms: {
    'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation', 'aws certified'],
    'Azure': ['azure', 'microsoft azure', 'azure devops', 'azure functions'],
    'GCP': ['gcp', 'google cloud', 'google cloud platform'],
    'Heroku': ['heroku'],
    'DigitalOcean': ['digitalocean', 'digital ocean'],
  },

  // DevOps & Tools
  devopsTools: {
    'Docker': ['docker', 'dockerfile', 'docker compose'],
    'Kubernetes': ['kubernetes', 'k8s', 'kubectl'],
    'Jenkins': ['jenkins', 'jenkins pipeline'],
    'Git': ['git', 'github', 'gitlab', 'bitbucket'],
    'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment'],
    'Terraform': ['terraform', 'terraform cloud'],
    'Ansible': ['ansible', 'ansible playbook'],
    'Nginx': ['nginx', 'nginx reverse proxy'],
  },

  // Mobile Development
  mobileDev: {
    'React Native': ['react native', 'react-native'],
    'Flutter': ['flutter', 'dart'],
    'iOS': ['ios', 'swift', 'objective-c', 'xcode'],
    'Android': ['android', 'android studio', 'kotlin'],
  },

  // Data & AI
  dataAI: {
    'Machine Learning': ['machine learning', 'ml', 'scikit-learn', 'sklearn'],
    'Deep Learning': ['deep learning', 'neural networks', 'tensorflow', 'pytorch', 'keras'],
    'Data Science': ['data science', 'data scientist', 'data analysis'],
    'Big Data': ['big data', 'hadoop', 'spark', 'apache spark', 'hive'],
    'NLP': ['nlp', 'natural language processing', 'spacy', 'nltk'],
    'Computer Vision': ['computer vision', 'opencv', 'image processing'],
  },

  // Testing
  testing: {
    'Selenium': ['selenium', 'selenium webdriver'],
    'Jest': ['jest', 'jest testing'],
    'JUnit': ['junit', 'junit5'],
    'PyTest': ['pytest', 'py.test'],
    'Cypress': ['cypress', 'cypress io'],
  },
};

// Primary categories for folder organization
const PRIMARY_CATEGORIES = {
  'Backend Development': ['Java', 'Python', '.NET', 'Node.js', 'Go', 'Ruby', 'PHP', 'Spring Boot', 'Django', 'Flask', 'Express.js'],
  'Frontend Development': ['React', 'Angular', 'Vue.js', 'JavaScript', 'Next.js', 'HTML', 'CSS'],
  'Full Stack Development': [], // Detected if has both frontend and backend skills
  'Mobile Development': ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin'],
  'DevOps & Cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform'],
  'Data & AI': ['Machine Learning', 'Deep Learning', 'Data Science', 'Big Data', 'Python'],
  'QA & Testing': ['Selenium', 'Manual Testing', 'Automation Testing', 'Jest', 'JUnit'],
  'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'SQL Server'],
};

interface EnhancedParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    currentCompany?: string;
  };
  professionalDetails: {
    totalExperience: number;
    currentJobTitle?: string;
    noticePeriod?: string;
  };
  skills: {
    primary: string[];
    secondary: string[];
    frameworks: string[];
    databases: string[];
    cloudPlatforms: string[];
    tools: string[];
  };
  categories: {
    primaryCategory: string;
    specificSkills: string[];
    experienceLevel: string;
  };
  experience: any[];
  education: any[];
  certifications: string[];
  projects: any[];
  rawText: string;
}

class RecruiterParserService {
  // Extract skills from text with fuzzy matching
  extractSkillsFromText(text: string): {
    primary: string[];
    secondary: string[];
    frameworks: string[];
    databases: string[];
    cloudPlatforms: string[];
    tools: string[];
  } {
    const lowerText = text.toLowerCase();
    const foundSkills = {
      primary: [] as string[],
      secondary: [] as string[],
      frameworks: [] as string[],
      databases: [] as string[],
      cloudPlatforms: [] as string[],
      tools: [] as string[]
    };

    // Programming Languages
    Object.entries(SKILL_CATEGORIES.programmingLanguages).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.primary.push(skill);
      }
    });

    // Frontend Frameworks
    Object.entries(SKILL_CATEGORIES.frontendFrameworks).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.frameworks.push(skill);
        foundSkills.secondary.push(skill);
      }
    });

    // Backend Frameworks
    Object.entries(SKILL_CATEGORIES.backendFrameworks).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.frameworks.push(skill);
        foundSkills.secondary.push(skill);
      }
    });

    // Databases
    Object.entries(SKILL_CATEGORIES.databases).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.databases.push(skill);
      }
    });

    // Cloud Platforms
    Object.entries(SKILL_CATEGORIES.cloudPlatforms).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.cloudPlatforms.push(skill);
      }
    });

    // DevOps Tools
    Object.entries(SKILL_CATEGORIES.devopsTools).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.tools.push(skill);
      }
    });

    // Mobile Development
    Object.entries(SKILL_CATEGORIES.mobileDev).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.primary.push(skill);
      }
    });

    // Data & AI
    Object.entries(SKILL_CATEGORIES.dataAI).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundSkills.primary.push(skill);
      }
    });

    // Remove duplicates
    Object.keys(foundSkills).forEach(key => {
      foundSkills[key as keyof typeof foundSkills] = [...new Set(foundSkills[key as keyof typeof foundSkills])];
    });

    return foundSkills;
  }

  // Enhanced skill-based separation with priority levels
  // Returns array of categories sorted by relevance (primary first)
  determineAllCategories(skills: {
    primary: string[];
    frameworks: string[];
    cloudPlatforms: string[];
    tools: string[];
    databases: string[];
  }): { category: string; priority: number; matchedSkills: string[] }[] {
    // Ensure all skill arrays are valid before using them
    const primarySkills = Array.isArray(skills.primary) ? skills.primary : [];
    const frameworks = Array.isArray(skills.frameworks) ? skills.frameworks : [];
    const cloudPlatforms = Array.isArray(skills.cloudPlatforms) ? skills.cloudPlatforms : [];
    const tools = Array.isArray(skills.tools) ? skills.tools : [];
    const databases = Array.isArray(skills.databases) ? skills.databases : [];
    
    const allSkills = [...primarySkills, ...frameworks];
    const categories: { category: string; priority: number; matchedSkills: string[] }[] = [];

    // Frontend skills
    const frontendSkills = ['React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'jQuery'];
    const frontendMatches = allSkills.filter(skill => frontendSkills.includes(skill));

    // Backend skills
    const backendSkills = ['Java', 'Python', '.NET', 'Node.js', 'Spring Boot', 'Django', 'Flask', 'Express.js', 'FastAPI', 'Laravel', 'Ruby on Rails', 'Go', 'PHP'];
    const backendMatches = allSkills.filter(skill => backendSkills.includes(skill));

    // Mobile skills
    const mobileSkills = ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin'];
    const mobileMatches = allSkills.filter(skill => mobileSkills.includes(skill));

    // DevOps/Cloud skills
    const devopsSkills = ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible', ...cloudPlatforms];
    const devopsMatches = [...cloudPlatforms, ...tools];

    // Data & AI skills
    const dataAISkills = ['Machine Learning', 'Deep Learning', 'Data Science', 'Big Data', 'NLP', 'Computer Vision'];
    const dataAIMatches = allSkills.filter(skill => dataAISkills.includes(skill));

    // Database skills
    const databaseMatches = databases;

    // Calculate priorities based on number of matched skills
    if (frontendMatches.length > 0 && backendMatches.length > 0) {
      // Full Stack - highest priority if has both
      categories.push({
        category: 'Full Stack Development',
        priority: 100 + frontendMatches.length + backendMatches.length,
        matchedSkills: [...frontendMatches, ...backendMatches]
      });
    }

    if (backendMatches.length > 0) {
      categories.push({
        category: 'Backend Development',
        priority: 90 + (backendMatches.length * 5),
        matchedSkills: backendMatches
      });
    }

    if (frontendMatches.length > 0) {
      categories.push({
        category: 'Frontend Development',
        priority: 85 + (frontendMatches.length * 5),
        matchedSkills: frontendMatches
      });
    }

    if (mobileMatches.length > 0) {
      categories.push({
        category: 'Mobile Development',
        priority: 80 + (mobileMatches.length * 5),
        matchedSkills: mobileMatches
      });
    }

    if (devopsMatches.length > 0) {
      categories.push({
        category: 'DevOps & Cloud',
        priority: 75 + (devopsMatches.length * 3),
        matchedSkills: devopsMatches
      });
    }

    if (dataAIMatches.length > 0) {
      categories.push({
        category: 'Data & AI',
        priority: 70 + (dataAIMatches.length * 5),
        matchedSkills: dataAIMatches
      });
    }

    if (databaseMatches.length > 0) {
      categories.push({
        category: 'Database',
        priority: 60 + (databaseMatches.length * 3),
        matchedSkills: databaseMatches
      });
    }

    // Sort by priority (highest first)
    categories.sort((a, b) => b.priority - a.priority);

    return categories.length > 0 ? categories : [{ category: 'Other', priority: 0, matchedSkills: [] }];
  }

  // Determine primary category based on skills (backwards compatible)
  determinePrimaryCategory(skills: {
    primary: string[];
    frameworks: string[];
    cloudPlatforms: string[];
    tools: string[];
    databases?: string[];
  }): string {
    const categories = this.determineAllCategories({
      ...skills,
      databases: skills.databases || []
    });
    return categories[0].category;
  }

  // Extract experience in years from text
  extractTotalExperience(text: string): number {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(of)?\s*experience/i,
      /experience\s*:?\s*(\d+)\+?\s*years?/i,
      /(\d+)\+?\s*yrs?\s*(of)?\s*experience/i,
      /total\s*experience\s*:?\s*(\d+)\+?\s*years?/i
    ];

    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return 0;
  }

  // Determine experience level
  determineExperienceLevel(years: number): string {
    if (years >= 0 && years <= 2) return 'Junior (0-2 years)';
    if (years > 2 && years <= 5) return 'Mid-Level (2-5 years)';
    if (years > 5 && years <= 10) return 'Senior (5-10 years)';
    if (years > 10) return 'Lead/Architect (10+ years)';
    return 'Not Specified';
  }

  // Extract LinkedIn URL
  extractLinkedIn(text: string): string | undefined {
    const linkedInPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i;
    const match = text.match(linkedInPattern);
    return match ? match[0] : undefined;
  }

  // Extract notice period
  extractNoticePeriod(text: string): string | undefined {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('immediate') || lowerText.includes('immediately available')) {
      return 'Immediate';
    }

    const noticePeriodPattern = /notice\s*period\s*:?\s*(\d+)\s*(days?|months?)/i;
    const match = text.match(noticePeriodPattern);

    if (match) {
      return `${match[1]} ${match[2]}`;
    }

    return undefined;
  }

  // Main parsing function for recruiter flow - KEYWORD-BASED ONLY
  async parseResumeForRecruiter(filePath: string, sourceInfo?: any): Promise<EnhancedParsedResume> {
    // Use existing parser service to extract text
    const basicParsed = await parserService.parseResume(filePath);
    const text = basicParsed.rawText;

    console.log('📄 Parsing resume with keyword extraction...');

    // Extract skills using enhanced keyword matching
    const skills = this.extractSkillsFromText(text);

    // Extract experience using pattern matching
    const totalExperience = this.extractTotalExperience(text);

    // Determine category
    const primaryCategory = this.determinePrimaryCategory(skills);
    const experienceLevel = this.determineExperienceLevel(totalExperience);

    // Get specific skills for folder organization
    const specificSkills = [...new Set([...skills.primary, ...skills.frameworks.slice(0, 3)])];

    // Extract additional info using keyword patterns
    const linkedIn = this.extractLinkedIn(text);
    const noticePeriod = this.extractNoticePeriod(text);
    const currentCompany = this.extractCurrentCompany(text);

    // Use filename as fallback for name if extraction failed
    let candidateName = basicParsed.personalInfo.name;
    if (!candidateName || candidateName === 'Unknown') {
      // Extract name from filename (remove path, extension, and timestamp)
      const path = require('path');
      const filename = path.basename(filePath);
      
      // Pattern: "1234567890_ADIKA_MAUL_State_of_FL_Formatted.doc"
      // Remove extension, timestamp prefix, and everything after "State" or "Resume"
      candidateName = filename
        .replace(/\.\w+$/, '') // Remove extension
        .replace(/^\d+_/, '') // Remove timestamp prefix
        .replace(/_State.*$/i, '') // Remove "_State of FL_Formatted" etc.
        .replace(/_Resume.*$/i, '') // Remove "_Resume" etc.
        .replace(/_Original$/i, '') // Remove "_Original"
        .replace(/_Formatted$/i, '') // Remove "_Formatted"
        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
        .trim()
        .split(' ') // Convert to title case
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      console.log(`📝 Using filename as name: "${candidateName}"`);
    }

    // Use keyword-extracted personal info
    const personalInfo = {
      name: candidateName,
      email: basicParsed.personalInfo.email,
      phone: basicParsed.personalInfo.phone,
      location: basicParsed.personalInfo.location,
      linkedIn,
      currentCompany
    };

    return {
      personalInfo,
      professionalDetails: {
        totalExperience,
        noticePeriod
      },
      skills,
      categories: {
        primaryCategory,
        specificSkills,
        experienceLevel
      },
      experience: basicParsed.experience,
      education: basicParsed.education,
      certifications: basicParsed.certifications,
      projects: [],
      rawText: text
    };
  }

  // AI-powered resume enhancement
  private async enhanceWithAI(text: string, groqService: any): Promise<any> {
    const prompt = `Extract key information from this resume. Return ONLY valid JSON:

RESUME TEXT:
${text.substring(0, 4000)}

Return this JSON structure:
{
  "name": "full name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "city, country",
  "currentCompany": "current employer",
  "totalExperience": 5,
  "linkedIn": "linkedin url",
  "noticePeriod": "immediate/30 days/etc",
  "skills": {
    "primary": ["skill1", "skill2"],
    "frameworks": ["framework1", "framework2"],
    "databases": ["db1", "db2"],
    "cloudPlatforms": ["aws", "azure"],
    "tools": ["tool1", "tool2"]
  }
}

Extract ALL skills mentioned. If not found, use null.`;

    try {
      const response = await groqService.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      });

      let text = response.choices[0]?.message?.content || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const parsed = JSON.parse(text);
      console.log('✅ AI-enhanced resume parsing successful');
      return parsed;
    } catch (error) {
      console.error('❌ AI enhancement error:', error);
      return null;
    }
  }

  // Extract current company from text
  private extractCurrentCompany(text: string): string | undefined {
    const currentCompanyPattern = /(?:currently|presently)\s*(?:working)?\s*(?:at|with|for)\s*([A-Z][A-Za-z\s&]+)/i;
    const companyMatch = text.match(currentCompanyPattern);
    return companyMatch ? companyMatch[1].trim() : undefined;
  }
}

export default new RecruiterParserService();
