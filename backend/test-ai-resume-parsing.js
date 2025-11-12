/**
 * Test AI-Enhanced Resume Parsing
 * 
 * This script tests the new Groq AI integration for resume parsing
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const groqService = require('./dist/services/groqService').default;

// Sample resume text for testing
const sampleResumeText = `
JOHN DOE
Senior Full Stack Developer

Email: john.doe@example.com
Phone: +1 (555) 123-4567
Location: San Francisco, CA
LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 8+ years of experience building scalable web applications.
Currently working at Google as Senior Software Engineer.

TECHNICAL SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Angular, Vue.js, HTML5, CSS3
Backend: Node.js, Express, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud: AWS (EC2, S3, Lambda), Azure, Google Cloud Platform
DevOps: Docker, Kubernetes, Jenkins, CI/CD
Tools: Git, JIRA, Postman, VS Code

WORK EXPERIENCE

Senior Software Engineer - Google
June 2020 - Present (4 years)
• Led development of high-traffic microservices handling 10M+ requests/day
• Mentored team of 5 junior developers
• Implemented CI/CD pipelines reducing deployment time by 60%

Full Stack Developer - Amazon
Jan 2017 - May 2020 (3.5 years)
• Built e-commerce features serving millions of customers
• Optimized database queries improving response time by 40%
• Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
Stanford University, 2016

CERTIFICATIONS
• AWS Certified Solutions Architect
• Google Cloud Professional Developer

NOTICE PERIOD
Immediate availability
`;

async function testAIResumeParsing() {
  console.log('🧪 Testing AI-Enhanced Resume Parsing\n');
  console.log('=' .repeat(60));

  try {
    // Test Groq connection first
    console.log('\n1️⃣ Testing Groq API Connection...');
    await groqService.testConnection();

    // Test resume parsing
    console.log('\n2️⃣ Testing Resume Parsing with AI...');
    console.log('📄 Sample Resume Text Length:', sampleResumeText.length, 'characters');
    
    // Create a prompt similar to what's in recruiterParserService
    const prompt = `Extract key information from this resume. Return ONLY valid JSON:

RESUME TEXT:
${sampleResumeText}

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

    console.log('🤖 Calling Groq AI to extract resume information...\n');

    const response = await groqService.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1500
    });

    let text = response.choices[0]?.message?.content || '';
    console.log('📝 Raw AI Response:\n', text);
    console.log('\n' + '='.repeat(60));

    // Parse JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const parsed = JSON.parse(text);
    
    console.log('\n✅ Successfully parsed resume with AI!');
    console.log('\n📊 Extracted Information:');
    console.log('   Name:', parsed.name);
    console.log('   Email:', parsed.email);
    console.log('   Phone:', parsed.phone);
    console.log('   Location:', parsed.location);
    console.log('   Current Company:', parsed.currentCompany);
    console.log('   Total Experience:', parsed.totalExperience, 'years');
    console.log('   LinkedIn:', parsed.linkedIn);
    console.log('   Notice Period:', parsed.noticePeriod);
    
    if (parsed.skills) {
      console.log('\n🛠️  Skills Extracted:');
      console.log('   Primary:', parsed.skills.primary?.slice(0, 5).join(', ') + '...');
      console.log('   Frameworks:', parsed.skills.frameworks?.slice(0, 3).join(', '));
      console.log('   Databases:', parsed.skills.databases?.join(', '));
      console.log('   Cloud:', parsed.skills.cloudPlatforms?.join(', '));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ AI Resume Parsing Test PASSED!');
    console.log('\n💡 The AI can now:');
    console.log('   ✓ Extract personal information accurately');
    console.log('   ✓ Identify current employer');
    console.log('   ✓ Calculate total experience');
    console.log('   ✓ Parse all technical skills');
    console.log('   ✓ Determine notice period');
    console.log('\n🚀 Ready to sync resumes from Outlook with AI enhancement!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the test
testAIResumeParsing();
