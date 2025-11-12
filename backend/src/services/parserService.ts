import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  experience: any[];
  education: any[];
  skills: string[];
  certifications: string[];
  rawText: string;
}

interface ParsedJob {
  title: string;
  company: string;
  description: string;
  requirements: {
    skills: string[];
    experience: number;
    education: string[];
    certifications: string[];
  };
  keywords: string[];
  rawText: string;
}

class ParserService {
  // Extract text from PDF
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  // Extract text from DOCX
  async extractTextFromDOCX(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  // Extract text based on file type
  async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return await this.extractTextFromPDF(filePath);
      case '.docx':
      case '.doc':
        return await this.extractTextFromDOCX(filePath);
      case '.txt':
        return fs.readFileSync(filePath, 'utf-8');
      default:
        throw new Error('Unsupported file format');
    }
  }

  // Parse resume from file path (extracts text first)
  async parseResume(filePath: string): Promise<ParsedResume> {
    const text = await this.extractText(filePath);
    return this.parseResumeText(text);
  }

  // Parse resume text with enhanced name extraction
  parseResumeText(text: string): ParsedResume {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';

    // Extract phone
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';

    // Enhanced name extraction with strict filtering
    let name = 'Unknown';
    
    // Common resume section headers to AVOID
    const sectionHeaders = [
      'resume', 'curriculum vitae', 'cv', 'profile', 'contact', 'summary', 'objective',
      'experience', 'employment', 'work history', 'education', 'skills', 'certifications',
      'projects', 'achievements', 'references', 'languages', 'interests', 'hobbies',
      'career', 'professional', 'personal', 'about', 'qualifications', 'highlights',
      'technical skills', 'soft skills', 'core competencies', 'areas of expertise',
      'professional summary', 'career objective', 'career summary', 'work experience',
      'professional experience', 'employment history', 'job history', 'professional affiliations',
      'memberships', 'licenses', 'training', 'awards', 'honors', 'publications',
      'teaching experience', 'research', 'volunteer', 'activities', 'additional information',
      'personal details', 'personal information', 'address', 'email', 'phone', 'mobile',
      'company name', 'organization', 'current position', 'desired position',
      'systems engineering', 'manufacturing', 'commerce', 'engineering director',
      'program management', 'project management', 'people management', 'client engagement'
    ];
    
    // Strategy 1: Look in first 10 lines for a proper name
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      // Skip if line is too short or too long
      if (line.length < 3 || line.length > 50) continue;
      
      // Skip if it contains common section header keywords
      const lowerLine = line.toLowerCase();
      if (sectionHeaders.some(header => lowerLine.includes(header))) continue;
      
      // Skip if it contains email or phone markers
      if (/@|email|phone|mobile|tel:|address|location|linkedin/i.test(line)) continue;
      
      // Skip if it contains years or dates (2019, 2020, Jan 2019, etc.)
      if (/\b(19|20)\d{2}\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(line)) continue;
      
      // Check if line looks like a name (2-4 capitalized words)
      // Must start with capital letter and have proper word pattern
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?){1,3}$/.test(line)) {
        name = line;
        console.log(`✓ Extracted name from line ${i + 1}: "${name}"`);
        break;
      }
      
      // Check for ALL CAPS names (common in resumes)
      if (/^[A-Z][A-Z\s]{2,40}$/.test(line) && !lowerLine.includes('  ')) {
        // Convert to title case
        name = line.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        console.log(`✓ Extracted name from ALL CAPS line ${i + 1}: "${name}"`);
        break;
      }
    }
    
    // Strategy 2: Look for explicit name labels
    if (name === 'Unknown') {
      const namePatterns = [
        /(?:^|\n)Name\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/im,
        /(?:^|\n)Full Name\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/im,
      ];
      
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const potentialName = match[1].trim();
          const lowerName = potentialName.toLowerCase();
          if (!sectionHeaders.some(header => lowerName.includes(header))) {
            name = potentialName;
            console.log(`✓ Extracted name from label: "${name}"`);
            break;
          }
        }
      }
    }
    
    // Strategy 3: Extract from email prefix if still unknown
    if (name === 'Unknown' && email) {
      const emailPrefix = email.split('@')[0];
      // Only use email if it looks like a name (contains . or _)
      if (emailPrefix.includes('.') || emailPrefix.includes('_')) {
        const nameParts = emailPrefix.split(/[._-]/).map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        );
        if (nameParts.length >= 2) {
          name = nameParts.slice(0, 2).join(' '); // Take first 2 parts only
          console.log(`✓ Extracted name from email: "${name}"`);
        }
      }
    }
    
    console.log(`📝 Final extracted name: "${name}"`);


    // Extract skills (common programming languages and technologies)
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Swift',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'Git', 'Linux', 'Agile', 'REST', 'GraphQL', 'CI/CD', 'Machine Learning', 'AI'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    // Extract experience sections (basic implementation)
    const experienceKeywords = ['experience', 'employment', 'work history'];
    const experienceSections: any[] = [];
    
    // Extract education (basic implementation)
    const educationKeywords = ['education', 'academic', 'qualification'];
    const educationSections: any[] = [];

    return {
      personalInfo: {
        name,
        email,
        phone,
        location: '' // Would need more sophisticated parsing
      },
      experience: experienceSections,
      education: educationSections,
      skills: foundSkills,
      certifications: [],
      rawText: text
    };
  }

  // Parse job description
  parseJobDescription(text: string): ParsedJob {
    const lines = text.split('\n').map(line => line.trim());
    
    // Extract title (usually one of the first lines)
    const title = lines.find(line => 
      line.length > 5 && 
      (line.includes('Engineer') || line.includes('Developer') || 
       line.includes('Manager') || line.includes('Analyst'))
    ) || 'Position';

    // Extract required skills
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Docker', 'Kubernetes', 'AWS'
    ];
    
    const requiredSkills = skillKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    // Extract experience requirement (look for years)
    const experienceMatch = text.match(/(\d+)[\+\-]?\s*years?\s*(of)?\s*experience/i);
    const requiredExperience = experienceMatch ? parseInt(experienceMatch[1]) : 0;

    // Extract keywords for matching
    const keywords = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 50); // Top 50 unique keywords

    return {
      title,
      company: 'Company Name', // Would need to be passed separately or extracted
      description: text.substring(0, 500),
      requirements: {
        skills: requiredSkills,
        experience: requiredExperience,
        education: [],
        certifications: []
      },
      keywords,
      rawText: text
    };
  }
}

export default new ParserService();