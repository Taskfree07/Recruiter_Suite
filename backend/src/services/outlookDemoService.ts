/**
 * Demo/Mock Outlook Service
 * Simulates Outlook email fetching without Azure AD setup
 * Perfect for testing and demonstrations
 */

import aiService from './aiService';
import emailService from './emailService';
import OutlookConfig from '../models/outlookConfig';
import UnifiedJob from '../models/unifiedJob';
import path from 'path';
import fs from 'fs';

interface MockEmail {
  id: string;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  receivedDateTime: Date;
  body: string;
  hasAttachments: boolean;
  attachments?: Array<{
    name: string;
    filePath: string;
  }>;
}

class OutlookDemoService {
  /**
   * Generate random names for bench candidates
   */
  private generateRandomName(): { firstName: string; lastName: string; email: string } {
    const firstNames = [
      'James', 'Maria', 'Robert', 'Jennifer', 'William', 'Linda', 'David', 'Patricia',
      'Richard', 'Elizabeth', 'Joseph', 'Susan', 'Thomas', 'Jessica', 'Charles', 'Sarah',
      'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty',
      'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Kimberly',
      'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Carol'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
      'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;

    return { firstName, lastName, email };
  }
  /**
   * Simulate connecting Outlook account
   */
  async connectDemo(emailAddress: string = 'demo@outlook.com'): Promise<{
    success: boolean;
    emailAddress: string;
    message: string;
  }> {
    const userId = 'default-user';

    // Create or update demo config
    let config = await OutlookConfig.findOne({ userId });

    if (config) {
      config.accessToken = 'demo-access-token';
      config.refreshToken = 'demo-refresh-token';
      config.tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      config.emailAddress = emailAddress;
      config.connectionStatus = 'connected';
      config.lastError = undefined;
    } else {
      config = new OutlookConfig({
        userId,
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        tokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        emailAddress,
        connectionStatus: 'connected',
        syncEnabled: true,
        syncInterval: 30,
        emailFolders: ['Inbox'],
        filterSenders: [],
        filterSubjectKeywords: ['job', 'position', 'opening', 'resume', 'cv']
      });
    }

    await config.save();

    return {
      success: true,
      emailAddress,
      message: 'Demo Outlook account connected successfully'
    };
  }

  /**
   * Generate realistic demo emails with job descriptions
   */
  private generateDemoJobEmails(): MockEmail[] {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return [
      {
        id: 'demo-job-1',
        subject: 'Urgent Hiring: Senior Full Stack Developer - TechCorp',
        from: {
          name: 'Sarah Johnson',
          address: 'sarah.johnson@techcorp.com'
        },
        receivedDateTime: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
        hasAttachments: false,
        body: `
Hi Team,

We have an urgent opening for a Senior Full Stack Developer at TechCorp Inc.

Company: TechCorp Inc
Location: San Francisco, CA (Hybrid - 3 days onsite)
Salary Range: $140,000 - $170,000 per year
Job Type: Full-time

About the Role:
We're looking for an experienced full stack developer to join our growing engineering team and help build cutting-edge web applications.

Required Skills:
- 5+ years of professional software development experience
- Strong proficiency in JavaScript, TypeScript
- Expert knowledge of React and Node.js
- Experience with PostgreSQL or MongoDB
- AWS cloud services (EC2, S3, Lambda)
- RESTful API design and development
- Git version control

Nice to Have:
- Docker and Kubernetes experience
- CI/CD pipeline setup (Jenkins, GitHub Actions)
- Microservices architecture
- GraphQL API development

Responsibilities:
- Design and implement scalable web applications
- Collaborate with product team and designers
- Write clean, maintainable code
- Mentor junior developers
- Participate in code reviews

Benefits:
- Competitive salary and equity
- Health, dental, vision insurance
- 401k matching
- Unlimited PTO
- Remote work flexibility

We have 2 positions available. Please send qualified candidates ASAP!

Best regards,
Sarah Johnson
Senior Technical Recruiter
TechCorp Inc
        `.trim()
      },

      {
        id: 'demo-job-2',
        subject: 'Job Opening - Python Data Scientist (Remote)',
        from: {
          name: 'Michael Chen',
          address: 'michael.chen@dataai.com'
        },
        receivedDateTime: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
        hasAttachments: false,
        body: `
Hello,

DataAI Solutions is looking for a talented Python Data Scientist to join our team.

Position: Senior Data Scientist
Company: DataAI Solutions
Location: Remote (US-based)
Salary: $120,000 - $150,000
Experience: 3-5 years

Job Description:
Join our data science team to build machine learning models and extract insights from large datasets.

Required Qualifications:
- Bachelor's or Master's degree in Computer Science, Statistics, or related field
- 3+ years of experience in data science or machine learning
- Strong Python programming skills
- Experience with machine learning libraries: TensorFlow, PyTorch, scikit-learn
- Statistical analysis and hypothesis testing
- SQL and data manipulation (Pandas, NumPy)
- Data visualization (Matplotlib, Seaborn, Plotly)

Preferred Skills:
- Natural Language Processing (NLP)
- Deep learning and neural networks
- AWS or GCP cloud platforms
- Big data tools (Spark, Hadoop)
- A/B testing and experimentation

What You'll Do:
- Build and deploy machine learning models
- Analyze complex datasets to drive business decisions
- Collaborate with engineering team on model integration
- Present findings to stakeholders
- Stay updated with latest ML/AI trends

Why Join Us:
- 100% remote work
- Flexible hours
- Professional development budget
- Top-tier benefits package
- Innovative AI projects

Interested candidates should apply with resume and portfolio.

Thanks,
Michael Chen
Talent Acquisition
DataAI Solutions
        `.trim()
      },

      {
        id: 'demo-job-3',
        subject: 'URGENT: DevOps Engineer Needed - StartupX',
        from: {
          name: 'Emily Rodriguez',
          address: 'emily@startupx.io'
        },
        receivedDateTime: new Date(now - 1 * oneDayMs), // Yesterday
        hasAttachments: false,
        body: `
Hi there,

StartupX is seeking a skilled DevOps Engineer for immediate hire.

Role: DevOps Engineer (Mid-Level)
Company: StartupX
Location: Austin, TX (Hybrid)
Compensation: $100,000 - $130,000 + equity
Type: Full-time

Overview:
We're a fast-growing startup building the next generation of fintech solutions. Need someone to scale our infrastructure.

Must Have:
- 3+ years of DevOps/SRE experience
- Strong knowledge of AWS services
- Docker and Kubernetes orchestration
- Infrastructure as Code (Terraform, CloudFormation)
- CI/CD pipelines (Jenkins, GitLab CI, CircleCI)
- Linux system administration
- Monitoring and logging (Prometheus, Grafana, ELK)

Good to Have:
- Python or Bash scripting
- Ansible or Chef configuration management
- Security best practices
- Cost optimization experience

Responsibilities:
- Manage AWS infrastructure
- Automate deployment processes
- Monitor system performance
- Implement security measures
- Collaborate with development team
- On-call rotation (compensated)

What We Offer:
- Startup equity package
- Latest tools and technologies
- Learning and growth opportunities
- Casual work environment
- Snacks and beverages

Looking to fill this role quickly. 1 position available.

Best,
Emily Rodriguez
HR Manager
StartupX
        `.trim()
      },

      {
        id: 'demo-job-4',
        subject: 'Frontend Developer Position - React Specialist',
        from: {
          name: 'David Kim',
          address: 'david.kim@webdesignco.com'
        },
        receivedDateTime: new Date(now - 2 * oneDayMs), // 2 days ago
        hasAttachments: false,
        body: `
Good morning,

WebDesign Co is hiring a Frontend Developer specializing in React.

Job Title: Frontend Developer (React)
Company: WebDesign Co
Location: New York, NY / Remote
Salary: $90,000 - $120,000
Experience Level: 2-4 years

About Us:
We're a creative agency building beautiful web experiences for top brands.

Technical Requirements:
- 2+ years of React development
- JavaScript ES6+ expertise
- HTML5, CSS3, responsive design
- State management (Redux, MobX, or Context API)
- RESTful API integration
- Git version control
- Modern build tools (Webpack, Vite)

Bonus Skills:
- TypeScript
- Next.js or Gatsby
- Styled Components or Tailwind CSS
- Jest and React Testing Library
- Figma or Adobe XD

Responsibilities:
- Develop responsive web applications
- Implement pixel-perfect designs
- Optimize performance
- Write clean, maintainable code
- Collaborate with designers and backend developers

Benefits:
- Competitive salary
- Health benefits
- Remote work options
- Creative freedom
- Work-life balance

Please share candidate profiles.

Regards,
David Kim
Technical Recruiter
WebDesign Co
        `.trim()
      }
    ];
  }

  /**
   * Get actual demo resume files and generate emails with random names
   */
  private async getDemoResumeEmails(): Promise<MockEmail[]> {
    const now = Date.now();
    const demoResumesDir = path.join(__dirname, '../../demo-resumes');

    // Check if directory exists
    if (!fs.existsSync(demoResumesDir)) {
      console.warn('⚠️ Demo resumes directory not found:', demoResumesDir);
      return [];
    }

    // Get all .txt resume files
    const files = fs.readdirSync(demoResumesDir).filter(f => f.endsWith('.txt'));

    if (files.length === 0) {
      console.warn('⚠️ No resume files found in demo-resumes folder');
      return [];
    }

    console.log(`📎 Found ${files.length} demo resume files`);

    // Create email for each resume with random name
    const emails: MockEmail[] = files.map((filename, index) => {
      const randomPerson = this.generateRandomName();
      const hoursAgo = 3 + index * 2; // 3, 5, 7, 9 hours ago etc.

      return {
        id: `demo-resume-${index + 1}`,
        subject: `Application for Open Position - ${randomPerson.firstName} ${randomPerson.lastName}`,
        from: {
          name: `${randomPerson.firstName} ${randomPerson.lastName}`,
          address: randomPerson.email
        },
        receivedDateTime: new Date(now - hoursAgo * 60 * 60 * 1000),
        hasAttachments: true,
        body: `
Dear Hiring Manager,

I am writing to express my strong interest in the open positions at your company. Please find my resume attached for your consideration.

I believe my skills and experience make me a strong candidate, and I would be excited to contribute to your team.

Thank you for your time and consideration.

Best regards,
${randomPerson.firstName} ${randomPerson.lastName}
        `.trim(),
        attachments: [{
          name: filename,
          filePath: path.join(demoResumesDir, filename)
        }]
      };
    });

    return emails;
  }

  /**
   * Simulate email sync with realistic demo data
   */
  async syncDemoEmails(userId: string = 'default-user'): Promise<{
    jobsProcessed: number;
    resumesProcessed: number;
    errors: string[];
  }> {
    const result = {
      jobsProcessed: 0,
      resumesProcessed: 0,
      errors: [] as string[]
    };

    try {
      console.log('🎭 Starting DEMO Outlook email sync...');

      // Get config
      const config = await OutlookConfig.findOne({ userId });
      if (!config) {
        throw new Error('Demo Outlook not connected');
      }

      // Generate demo emails
      const jobEmails = this.generateDemoJobEmails();
      const resumeEmails = await this.getDemoResumeEmails();

      console.log(`📬 Processing ${jobEmails.length} job emails and ${resumeEmails.length} resume emails (DEMO MODE)`);

      // Process job emails and SAVE to database
      for (const email of jobEmails) {
        try {
          console.log(`📧 Processing job email: ${email.subject}`);

          const emailContent = `
Subject: ${email.subject}
From: ${email.from.address}
Date: ${email.receivedDateTime.toISOString()}

${email.body}
          `.trim();

          // Parse job description using AI
          const jobDescription = await aiService.parseJobDescriptionFromEmail(emailContent);

          if (jobDescription) {
            // Save to UnifiedJob collection
            const unifiedJob = new UnifiedJob({
              title: jobDescription.title,
              description: jobDescription.description,
              company: jobDescription.company,
              requiredSkills: jobDescription.requiredSkills || [],
              niceToHaveSkills: jobDescription.niceToHaveSkills || [],
              experienceYears: {
                min: jobDescription.experienceYears?.min || 0,
                max: jobDescription.experienceYears?.max || 10
              },
              experienceLevel: this.mapExperienceLevel(jobDescription.experienceYears?.min || 0),
              location: jobDescription.location || 'Not specified',
              locationType: jobDescription.locationType || 'onsite',
              salaryRange: jobDescription.salaryRange ? {
                min: jobDescription.salaryRange.min,
                max: jobDescription.salaryRange.max,
                currency: jobDescription.salaryRange.currency || 'USD'
              } : undefined,
              sources: [{
                type: 'outlook',
                id: email.id,
                emailId: email.id,
                emailSubject: email.subject,
                senderEmail: email.from.address,
                syncDate: new Date(),
                metadata: { demo: true }
              }],
              status: 'open',
              postedDate: email.receivedDateTime,
              positions: 1,
              priority: 'medium',
              applicationsCount: 0,
              viewsCount: 0,
              tags: ['demo', 'outlook-sync']
            });

            await unifiedJob.save();

            console.log(`✅ Saved job to database: ${jobDescription.title} at ${jobDescription.company}`);
            result.jobsProcessed++;
          } else {
            console.log(`⚠️ Could not extract job from: ${email.subject}`);
          }
        } catch (error: any) {
          console.error(`Error processing job email: ${error.message}`);
          result.errors.push(`Job email "${email.subject}": ${error.message}`);
        }
      }

      // Process ACTUAL resume files with random names
      for (const email of resumeEmails) {
        try {
          if (!email.attachments || email.attachments.length === 0) {
            continue;
          }

          const attachment = email.attachments[0];
          console.log(`📎 Processing resume: ${attachment.name} from ${email.from.name}`);

          // Read the actual resume file content
          const resumeContent = fs.readFileSync(attachment.filePath, 'utf-8');

          // Process using emailService with the random name
          const resume = await emailService.processResumeFile(
            attachment.filePath,
            `${email.from.name}_Resume.txt`,
            {
              type: 'outlook',
              receivedDate: email.receivedDateTime
            }
          );

          // Override the name with random name
          resume.personalInfo.name = `${email.from.name}`;
          resume.personalInfo.email = email.from.address;

          // Update source information
          resume.source.email = email.from.address;
          resume.source.emailSubject = email.subject;
          resume.source.emailId = email.id;
          (resume.source as any).demo = true;

          await resume.save();

          console.log(`✅ Processed resume for: ${email.from.name}`);
          result.resumesProcessed++;
        } catch (error: any) {
          console.error(`Error processing resume ${email.subject}:`, error.message);
          result.errors.push(`Resume "${email.subject}": ${error.message}`);
        }
      }

      // Update last sync date
      config.lastSyncDate = new Date();
      await config.save();

      console.log(`✅ DEMO sync complete: ${result.jobsProcessed} jobs, ${result.resumesProcessed} resumes`);

      return result;
    } catch (error: any) {
      console.error('Demo sync error:', error);
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Map experience years to experience level
   */
  private mapExperienceLevel(minYears: number): string {
    if (minYears === 0) return 'Entry';
    if (minYears <= 2) return 'Junior';
    if (minYears <= 4) return 'Mid';
    if (minYears <= 7) return 'Senior';
    return 'Lead';
  }

  /**
   * Get demo connection status
   */
  async getDemoStatus(userId: string = 'default-user'): Promise<any> {
    const config = await OutlookConfig.findOne({ userId });

    if (!config || config.accessToken !== 'demo-access-token') {
      return {
        connected: false,
        isDemo: false
      };
    }

    return {
      connected: true,
      isDemo: true,
      emailAddress: config.emailAddress,
      lastSyncDate: config.lastSyncDate,
      syncEnabled: config.syncEnabled,
      connectionStatus: config.connectionStatus
    };
  }

  /**
   * Check if current connection is demo mode
   */
  async isDemoMode(userId: string = 'default-user'): Promise<boolean> {
    const config = await OutlookConfig.findOne({ userId });
    return config?.accessToken === 'demo-access-token';
  }
}

export default new OutlookDemoService();
