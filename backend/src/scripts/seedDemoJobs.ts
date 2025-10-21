import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import UnifiedJob from '../models/unifiedJob';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const demoJobs = [
  {
    title: 'Senior Full Stack Developer',
    description: 'We are looking for an experienced Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using React, Node.js, and MongoDB.',
    company: 'TechCorp Solutions',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'REST API'],
    niceToHaveSkills: ['Docker', 'AWS', 'GraphQL'],
    experienceYears: { min: 5, max: 8 },
    experienceLevel: 'Senior',
    location: 'San Francisco, CA',
    locationType: 'hybrid',
    salaryRange: { min: 140000, max: 170000, currency: 'USD' },
    status: 'open',
    postedDate: new Date(),
    positions: 2,
    priority: 'high',
    tags: ['full-stack', 'react', 'node'],
    sources: [{
      type: 'manual',
      id: 'demo-1',
      syncDate: new Date(),
      metadata: { demo: true }
    }],
    source: 'manual'
  },
  {
    title: 'Python Data Scientist',
    description: 'Join our AI team to work on machine learning models and data analysis. Experience with Python, TensorFlow, and data visualization required.',
    company: 'DataFlow AI',
    requiredSkills: ['Python', 'TensorFlow', 'Pandas', 'NumPy', 'Machine Learning'],
    niceToHaveSkills: ['PyTorch', 'Scikit-learn', 'SQL'],
    experienceYears: { min: 3, max: 6 },
    experienceLevel: 'Mid',
    location: 'New York, NY',
    locationType: 'remote',
    salaryRange: { min: 120000, max: 150000, currency: 'USD' },
    status: 'open',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    positions: 1,
    priority: 'urgent',
    tags: ['python', 'ai', 'data-science'],
    sources: [{
      type: 'ceipal',
      id: 'demo-2',
      url: 'https://demo.ceipal.com/jobs/12345',
      syncDate: new Date(),
      metadata: { demo: true }
    }],
    source: 'ceipal'
  },
  {
    title: 'DevOps Engineer',
    description: 'Looking for a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. AWS and Kubernetes experience required.',
    company: 'CloudSys Ltd',
    requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Jenkins', 'Terraform'],
    niceToHaveSkills: ['Ansible', 'Python', 'Shell Scripting'],
    experienceYears: { min: 4, max: 7 },
    experienceLevel: 'Senior',
    location: 'Austin, TX',
    locationType: 'hybrid',
    salaryRange: { min: 130000, max: 160000, currency: 'USD' },
    status: 'open',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    positions: 1,
    priority: 'high',
    tags: ['devops', 'aws', 'kubernetes'],
    sources: [{
      type: 'outlook',
      id: 'demo-3',
      emailSubject: 'DevOps Engineer Position - CloudSys',
      senderEmail: 'hr@cloudsys.com',
      syncDate: new Date(),
      metadata: { demo: true }
    }],
    source: 'outlook'
  },
  {
    title: 'Frontend React Developer',
    description: 'We need a talented React developer to build beautiful, responsive user interfaces. Strong CSS and JavaScript skills required.',
    company: 'DesignHub Inc',
    requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML', 'Redux'],
    niceToHaveSkills: ['TypeScript', 'Next.js', 'Tailwind CSS'],
    experienceYears: { min: 2, max: 5 },
    experienceLevel: 'Mid',
    location: 'Seattle, WA',
    locationType: 'remote',
    salaryRange: { min: 100000, max: 130000, currency: 'USD' },
    status: 'interviewing',
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    positions: 1,
    priority: 'medium',
    tags: ['frontend', 'react', 'javascript'],
    sources: [{
      type: 'manual',
      id: 'demo-4',
      syncDate: new Date(),
      metadata: { demo: true }
    }],
    source: 'manual',
    submissions: [
      {
        candidateId: new mongoose.Types.ObjectId(),
        candidateName: 'John Doe',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'screening',
        matchScore: 85
      }
    ]
  },
  {
    title: 'Backend Java Developer',
    description: 'Enterprise Java developer needed for banking application. Spring Boot, Microservices, and SQL experience required.',
    company: 'FinTech Bank',
    requiredSkills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'REST API'],
    niceToHaveSkills: ['Kafka', 'Redis', 'Docker'],
    experienceYears: { min: 5, max: 10 },
    experienceLevel: 'Senior',
    location: 'Chicago, IL',
    locationType: 'onsite',
    salaryRange: { min: 145000, max: 180000, currency: 'USD' },
    status: 'open',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    positions: 3,
    priority: 'high',
    tags: ['backend', 'java', 'spring'],
    sources: [{
      type: 'ceipal',
      id: 'demo-5',
      url: 'https://demo.ceipal.com/jobs/67890',
      syncDate: new Date(),
      metadata: { demo: true }
    }],
    source: 'ceipal'
  },
  {
    title: 'Mobile App Developer (iOS/Android)',
    description: 'Cross-platform mobile developer needed. Experience with React Native or Flutter required.',
    company: 'MobileFirst Apps',
    requiredSkills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Mobile Development'],
    niceToHaveSkills: ['Flutter', 'Swift', 'Kotlin'],
    experienceYears: { min: 3, max: 6 },
    experienceLevel: 'Mid',
    location: 'Los Angeles, CA',
    locationType: 'hybrid',
    salaryRange: { min: 115000, max: 145000, currency: 'USD' },
    status: 'filled',
    postedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    positions: 1,
    priority: 'low',
    tags: ['mobile', 'react-native', 'ios', 'android'],
    sources: [{
      type: 'outlook',
      id: 'demo-6',
      emailSubject: 'Mobile Developer Opening',
      senderEmail: 'recruiter@mobilefirst.com',
      syncDate: new Date(),
      metadata: { demo: true }
    }],
    source: 'outlook',
    submissions: [
      {
        candidateId: new mongoose.Types.ObjectId(),
        candidateName: 'Jane Smith',
        submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        status: 'accepted',
        matchScore: 92
      }
    ]
  }
];

async function seedDemoJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('✅ Connected to MongoDB');

    // Clear existing demo jobs
    await UnifiedJob.deleteMany({ 'sources.metadata.demo': true });
    console.log('🗑️  Cleared existing demo jobs');

    // Insert demo jobs
    const result = await UnifiedJob.insertMany(demoJobs);
    console.log(`✅ Inserted ${result.length} demo jobs`);

    // Show summary
    const stats = await UnifiedJob.aggregate([
      { $match: { 'sources.metadata.demo': true } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Demo Jobs Summary:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} jobs`);
    });

    console.log('\n🎉 Demo jobs seeded successfully!');
    console.log('   You can now view them in the Job Pipeline at http://localhost:3000/job-pipeline');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo jobs:', error);
    process.exit(1);
  }
}

seedDemoJobs();
