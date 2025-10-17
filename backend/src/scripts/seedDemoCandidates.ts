import mongoose from 'mongoose';
import RecruiterResume from '../models/recruiterResume';

// Demo candidates with diverse sources
const demoCandidates = [
  {
    personalInfo: {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedIn: 'linkedin.com/in/sarahchen',
      currentCompany: 'TechCorp Inc'
    },
    professionalDetails: {
      totalExperience: 7,
      currentJobTitle: 'Senior Full Stack Developer',
      currentCTC: '$140,000',
      expectedCTC: '$160,000',
      noticePeriod: '30 days'
    },
    skills: {
      primary: ['JavaScript', 'TypeScript', 'Python', 'Java'],
      secondary: ['SQL', 'NoSQL', 'GraphQL', 'REST API'],
      frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask'],
      databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'],
      cloudPlatforms: ['AWS', 'Docker', 'Kubernetes'],
      tools: ['Git', 'Jest', 'Webpack', 'Jira']
    },
    categories: {
      primaryCategory: 'Full Stack Development',
      specificSkills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'MongoDB', 'PostgreSQL'],
      experienceLevel: 'Senior (5+)'
    },
    experience: [
      {
        company: 'TechCorp Inc',
        title: 'Senior Full Stack Developer',
        duration: '2020 - Present',
        description: 'Led team of 5 developers building microservices-based e-commerce platform'
      },
      {
        company: 'StartupXYZ',
        title: 'Full Stack Developer',
        duration: '2017 - 2019',
        description: 'Developed web applications using MERN stack'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'Stanford University',
        year: '2015',
        cgpa: '3.8'
      }
    ],
    certifications: ['AWS Certified Solutions Architect', 'MongoDB Certified Developer'],
    projects: [
      {
        title: 'Real-Time Chat Application',
        technologies: ['React', 'Node.js', 'Socket.io', 'AWS'],
        description: 'Built WebSocket-based chat application with 10K+ users'
      }
    ],
    source: {
      type: 'email',
      email: 'hr.recruiter@techcorp.com',
      subject: 'Application: Senior Full Stack Developer Position',
      receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    file: {
      fileName: 'Sarah_Chen_Resume.pdf',
      filePath: '/uploads/demo/sarah_chen.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 92,
      skillRelevance: 95,
      experienceQuality: 90,
      educationScore: 85,
      freshnessScore: 96,
      resumeQuality: 100
    },
    status: 'active',
    tags: ['React', 'Node.js', 'Full Stack', 'Senior'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'Michael Johnson',
      email: 'michael.johnson@techmail.com',
      phone: '+1 (555) 987-6543',
      location: 'Austin, TX',
      linkedIn: 'linkedin.com/in/michaeljohnson',
      currentCompany: 'Enterprise Solutions Inc'
    },
    professionalDetails: {
      totalExperience: 8,
      currentJobTitle: 'Senior Backend Engineer',
      currentCTC: '$150,000',
      expectedCTC: '$170,000',
      noticePeriod: '60 days'
    },
    skills: {
      primary: ['Java', 'Kotlin', 'Groovy', 'SQL'],
      secondary: ['REST API', 'GraphQL', 'Microservices'],
      frameworks: ['Spring Boot', 'Spring Cloud', 'Hibernate', 'JPA'],
      databases: ['PostgreSQL', 'MySQL', 'Oracle', 'Cassandra'],
      cloudPlatforms: ['AWS', 'GCP', 'Docker', 'Kubernetes'],
      tools: ['Maven', 'Gradle', 'Jenkins', 'Git']
    },
    categories: {
      primaryCategory: 'Backend Development',
      specificSkills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'AWS', 'Kafka'],
      experienceLevel: 'Senior (5+)'
    },
    experience: [
      {
        company: 'Enterprise Solutions Inc',
        title: 'Senior Backend Engineer',
        duration: '2019 - Present',
        description: 'Designed microservices architecture for financial services platform'
      }
    ],
    education: [
      {
        degree: 'Master of Science in Computer Science',
        institution: 'University of Texas at Austin',
        year: '2015'
      }
    ],
    certifications: ['Oracle Certified Professional Java SE 11', 'AWS Certified Developer'],
    projects: [],
    source: {
      type: 'portal',
      email: 'noreply@indeed.com',
      subject: 'New Applicant from Indeed',
      receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    file: {
      fileName: 'Michael_Johnson_Resume.pdf',
      filePath: '/uploads/demo/michael_johnson.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 89,
      skillRelevance: 92,
      experienceQuality: 88,
      educationScore: 90,
      freshnessScore: 90,
      resumeQuality: 95
    },
    status: 'active',
    tags: ['Java', 'Spring Boot', 'Backend', 'Senior'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'Priya Patel',
      email: 'priya.patel@devmail.com',
      phone: '(555) 234-5678',
      location: 'Seattle, WA',
      linkedIn: 'linkedin.com/in/priyapatel',
      currentCompany: 'CloudTech Solutions'
    },
    professionalDetails: {
      totalExperience: 5,
      currentJobTitle: 'Senior Frontend Developer',
      currentCTC: '$120,000',
      expectedCTC: '$140,000',
      noticePeriod: '30 days'
    },
    skills: {
      primary: ['JavaScript', 'TypeScript', 'HTML5', 'CSS3'],
      secondary: ['Responsive Design', 'UI/UX', 'Accessibility'],
      frameworks: ['React', 'Next.js', 'React Native', 'Redux', 'Material-UI', 'Tailwind CSS'],
      databases: ['Firebase', 'MongoDB'],
      cloudPlatforms: ['Vercel', 'Netlify', 'AWS S3'],
      tools: ['Webpack', 'Vite', 'Jest', 'Cypress', 'Figma']
    },
    categories: {
      primaryCategory: 'Frontend Development',
      specificSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'React Native'],
      experienceLevel: 'Mid-Level (2-5)'
    },
    experience: [
      {
        company: 'CloudTech Solutions',
        title: 'Senior Frontend Developer',
        duration: '2021 - Present',
        description: 'Lead frontend development for SaaS dashboard with 50K+ users'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Engineering',
        institution: 'University of Washington',
        year: '2018',
        cgpa: '3.7'
      }
    ],
    certifications: ['Meta Front-End Developer Certificate', 'Advanced React Patterns'],
    projects: [],
    source: {
      type: 'portal',
      email: 'jobs@linkedin.com',
      subject: 'Application via LinkedIn',
      receivedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    file: {
      fileName: 'Priya_Patel_Resume.pdf',
      filePath: '/uploads/demo/priya_patel.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 85,
      skillRelevance: 88,
      experienceQuality: 82,
      educationScore: 85,
      freshnessScore: 98,
      resumeQuality: 90
    },
    status: 'active',
    tags: ['React', 'Frontend', 'TypeScript', 'Mid-Level'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'David Martinez',
      email: 'david.martinez@mltech.com',
      phone: '(555) 345-6789',
      location: 'Boston, MA',
      linkedIn: 'linkedin.com/in/davidmartinez',
      currentCompany: 'AI Innovations Corp'
    },
    professionalDetails: {
      totalExperience: 6,
      currentJobTitle: 'Senior ML Engineer',
      currentCTC: '$160,000',
      expectedCTC: '$180,000',
      noticePeriod: 'Immediate'
    },
    skills: {
      primary: ['Python', 'R', 'SQL', 'Scala'],
      secondary: ['Statistics', 'Data Analysis', 'Algorithm Design'],
      frameworks: ['TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'XGBoost', 'Transformers'],
      databases: ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'],
      cloudPlatforms: ['AWS SageMaker', 'Google Cloud AI', 'Docker', 'Kubernetes'],
      tools: ['Jupyter', 'MLflow', 'FastAPI', 'Git']
    },
    categories: {
      primaryCategory: 'Machine Learning / AI',
      specificSkills: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'AWS'],
      experienceLevel: 'Senior (5+)'
    },
    experience: [
      {
        company: 'AI Innovations Corp',
        title: 'Senior ML Engineer',
        duration: '2021 - Present',
        description: 'Developed production ML models serving 2M+ users'
      }
    ],
    education: [
      {
        degree: 'Master of Science in Computer Science',
        institution: 'MIT',
        year: '2017',
        cgpa: '3.9'
      }
    ],
    certifications: ['TensorFlow Developer Certificate', 'AWS ML Specialty', 'Deep Learning Specialization'],
    projects: [],
    source: {
      type: 'portal',
      email: 'apply@dice.com',
      subject: 'New Application from Dice',
      receivedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    file: {
      fileName: 'David_Martinez_Resume.pdf',
      filePath: '/uploads/demo/david_martinez.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 94,
      skillRelevance: 96,
      experienceQuality: 93,
      educationScore: 95,
      freshnessScore: 86,
      resumeQuality: 100
    },
    status: 'shortlisted',
    tags: ['Python', 'Machine Learning', 'AI', 'Senior'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'Emily Wong',
      email: 'emily.wong@cloudops.com',
      phone: '(555) 456-7890',
      location: 'Denver, CO',
      linkedIn: 'linkedin.com/in/emilywong',
      currentCompany: 'CloudScale Technologies'
    },
    professionalDetails: {
      totalExperience: 7,
      currentJobTitle: 'Senior DevOps Engineer',
      currentCTC: '$145,000',
      expectedCTC: '$165,000',
      noticePeriod: '45 days'
    },
    skills: {
      primary: ['Bash', 'Python', 'Go', 'YAML'],
      secondary: ['CI/CD', 'Infrastructure as Code', 'Monitoring'],
      frameworks: [],
      databases: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis'],
      cloudPlatforms: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform'],
      tools: ['Jenkins', 'GitLab CI', 'Ansible', 'Prometheus', 'Grafana', 'ELK Stack']
    },
    categories: {
      primaryCategory: 'DevOps / Cloud',
      specificSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Jenkins'],
      experienceLevel: 'Senior (5+)'
    },
    experience: [
      {
        company: 'CloudScale Technologies',
        title: 'Senior DevOps Engineer',
        duration: '2020 - Present',
        description: 'Architected AWS infrastructure serving 500K+ users'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'Colorado State University',
        year: '2016',
        cgpa: '3.6'
      }
    ],
    certifications: ['AWS Solutions Architect Professional', 'CKA', 'CKAD', 'Terraform Associate'],
    projects: [],
    source: {
      type: 'email',
      email: 'talent@company.com',
      subject: 'Interested in DevOps Role',
      receivedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    file: {
      fileName: 'Emily_Wong_Resume.pdf',
      filePath: '/uploads/demo/emily_wong.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 91,
      skillRelevance: 93,
      experienceQuality: 90,
      educationScore: 85,
      freshnessScore: 94,
      resumeQuality: 95
    },
    status: 'active',
    tags: ['DevOps', 'AWS', 'Kubernetes', 'Senior'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'Alex Kumar',
      email: 'alex.kumar@gmail.com',
      phone: '(555) 567-8901',
      location: 'Chicago, IL',
      linkedIn: 'linkedin.com/in/alexkumar',
      currentCompany: 'WebDev Agency'
    },
    professionalDetails: {
      totalExperience: 2,
      currentJobTitle: 'Junior Developer',
      currentCTC: '$70,000',
      expectedCTC: '$85,000',
      noticePeriod: '15 days'
    },
    skills: {
      primary: ['JavaScript', 'HTML5', 'CSS3', 'SQL'],
      secondary: ['Responsive Design', 'REST API'],
      frameworks: ['React', 'Node.js', 'Express', 'Bootstrap'],
      databases: ['MySQL', 'MongoDB'],
      cloudPlatforms: [],
      tools: ['Git', 'VS Code', 'Postman']
    },
    categories: {
      primaryCategory: 'Full Stack Development',
      specificSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'HTML', 'CSS'],
      experienceLevel: 'Junior (0-2)'
    },
    experience: [
      {
        company: 'WebDev Agency',
        title: 'Junior Developer',
        duration: '2022 - Present',
        description: 'Developed websites for small business clients'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Information Technology',
        institution: 'University of Illinois at Chicago',
        year: '2022',
        cgpa: '3.5'
      }
    ],
    certifications: ['freeCodeCamp Responsive Web Design'],
    projects: [],
    source: {
      type: 'portal',
      email: 'notifications@monster.com',
      subject: 'Application via Monster.com',
      receivedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
    },
    file: {
      fileName: 'Alex_Kumar_Resume.pdf',
      filePath: '/uploads/demo/alex_kumar.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 68,
      skillRelevance: 70,
      experienceQuality: 60,
      educationScore: 75,
      freshnessScore: 92,
      resumeQuality: 80
    },
    status: 'pending_review',
    tags: ['JavaScript', 'React', 'Junior', 'Full Stack'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'Jennifer Lee',
      email: 'jennifer.lee@qatest.com',
      phone: '(555) 678-9012',
      location: 'New York, NY',
      linkedIn: 'linkedin.com/in/jenniferlee',
      currentCompany: 'FinTech Solutions'
    },
    professionalDetails: {
      totalExperience: 5,
      currentJobTitle: 'Senior QA Automation Engineer',
      currentCTC: '$110,000',
      expectedCTC: '$130,000',
      noticePeriod: '30 days'
    },
    skills: {
      primary: ['Java', 'JavaScript', 'Python', 'TypeScript'],
      secondary: ['Test Automation', 'API Testing', 'Manual Testing'],
      frameworks: ['Selenium', 'Cypress', 'Playwright', 'TestNG', 'JUnit', 'Rest Assured'],
      databases: ['MySQL', 'PostgreSQL', 'MongoDB'],
      cloudPlatforms: ['AWS', 'Docker'],
      tools: ['Jenkins', 'GitLab CI', 'JIRA', 'Postman', 'Git']
    },
    categories: {
      primaryCategory: 'QA / Testing',
      specificSkills: ['Selenium', 'Cypress', 'Java', 'TestNG', 'API Testing', 'Jenkins'],
      experienceLevel: 'Mid-Level (2-5)'
    },
    experience: [
      {
        company: 'FinTech Solutions',
        title: 'Senior QA Automation Engineer',
        duration: '2021 - Present',
        description: 'Lead automation efforts for web and mobile applications'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'New York University',
        year: '2018',
        cgpa: '3.6'
      }
    ],
    certifications: ['ISTQB CTFL', 'Certified Selenium Professional'],
    projects: [],
    source: {
      type: 'portal',
      email: 'career@glassdoor.com',
      subject: 'New Candidate from Glassdoor',
      receivedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
    },
    file: {
      fileName: 'Jennifer_Lee_Resume.pdf',
      filePath: '/uploads/demo/jennifer_lee.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 83,
      skillRelevance: 85,
      experienceQuality: 82,
      educationScore: 80,
      freshnessScore: 88,
      resumeQuality: 90
    },
    status: 'active',
    tags: ['QA', 'Automation', 'Selenium', 'Mid-Level'],
    rawText: 'Demo resume content',
    processed: true
  },
  {
    personalInfo: {
      name: 'Robert Williams',
      email: 'robert.williams@angular.dev',
      phone: '(555) 789-0123',
      location: 'Portland, OR',
      linkedIn: 'linkedin.com/in/robertwilliams',
      currentCompany: 'Enterprise Apps Inc'
    },
    professionalDetails: {
      totalExperience: 6,
      currentJobTitle: 'Angular Developer',
      currentCTC: '$115,000',
      expectedCTC: '$135,000',
      noticePeriod: '60 days'
    },
    skills: {
      primary: ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
      secondary: ['RxJS', 'NgRx', 'REST API'],
      frameworks: ['Angular', 'Node.js', 'Express', 'Bootstrap', 'Material Design'],
      databases: ['PostgreSQL', 'MongoDB'],
      cloudPlatforms: ['AWS', 'Azure'],
      tools: ['Git', 'npm', 'Webpack', 'Jasmine', 'Karma']
    },
    categories: {
      primaryCategory: 'Frontend Development',
      specificSkills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Node.js'],
      experienceLevel: 'Senior (5+)'
    },
    experience: [
      {
        company: 'Enterprise Apps Inc',
        title: 'Angular Developer',
        duration: '2019 - Present',
        description: 'Built enterprise Angular applications for Fortune 500 clients'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Software Engineering',
        institution: 'Oregon State University',
        year: '2017'
      }
    ],
    certifications: ['Angular Certified Developer'],
    projects: [],
    source: {
      type: 'portal',
      email: 'jobs@careerbuilder.com',
      subject: 'Application from CareerBuilder',
      receivedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    },
    file: {
      fileName: 'Robert_Williams_Resume.pdf',
      filePath: '/uploads/demo/robert_williams.pdf',
      fileType: 'pdf'
    },
    scores: {
      overall: 80,
      skillRelevance: 82,
      experienceQuality: 80,
      educationScore: 75,
      freshnessScore: 80,
      resumeQuality: 85
    },
    status: 'active',
    tags: ['Angular', 'TypeScript', 'Frontend', 'Senior'],
    rawText: 'Demo resume content',
    processed: true
  }
];

async function seedDemoCandidates() {
  try {
    console.log('🌱 Starting demo candidate seeding...');

    // Clear existing data
    const deleteResult = await RecruiterResume.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing candidates`);

    // Insert demo candidates
    const result = await RecruiterResume.insertMany(demoCandidates);
    console.log(`✅ Successfully seeded ${result.length} demo candidates`);

    // Show summary by source
    const sources = await RecruiterResume.aggregate([
      {
        $group: {
          _id: '$source.type',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Candidates by Source:');
    sources.forEach(source => {
      console.log(`   ${source._id}: ${source.count} candidates`);
    });

    console.log('\n🎉 Demo seeding completed successfully!');
    return result;
  } catch (error) {
    console.error('❌ Error seeding demo candidates:', error);
    throw error;
  }
}

export default seedDemoCandidates;
