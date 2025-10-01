import { IJob } from '../models/job';
import { ICandidate } from '../models/candidate';

interface ScoreBreakdown {
  overall: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordMatch: number;
}

interface ScoringResult {
  score: ScoreBreakdown;
  improvements: string[];
  strengths: string[];
}

class ScoringService {
  calculateScore(candidateData: any, jobData: IJob): ScoringResult {
    const scores = {
      skillMatch: this.calculateSkillMatch(candidateData.skills, jobData.requirements.skills),
      experienceMatch: this.calculateExperienceMatch(candidateData.experience, jobData.requirements.experience),
      educationMatch: this.calculateEducationMatch(candidateData.education, jobData.requirements.education),
      keywordMatch: this.calculateKeywordMatch(candidateData.rawText, jobData.keywords)
    };

    // Log for debugging
    console.log('Scoring breakdown:', {
      candidateName: candidateData.personalInfo?.name || 'Unknown',
      skills: `${candidateData.skills?.length || 0} found, score: ${scores.skillMatch}`,
      experience: `${candidateData.experience?.length || 0} entries, score: ${scores.experienceMatch}`,
      keywords: `score: ${scores.keywordMatch}`,
      textLength: candidateData.rawText?.length || 0
    });

    // Calculate weighted overall score
    const overall = Math.round(
      scores.skillMatch * 0.4 +
      scores.experienceMatch * 0.3 +
      scores.educationMatch * 0.15 +
      scores.keywordMatch * 0.15
    );

    const improvements = this.generateImprovements(scores, candidateData, jobData);
    const strengths = this.identifyStrengths(scores, candidateData, jobData);

    return {
      score: {
        overall,
        ...scores
      },
      improvements,
      strengths
    };
  }

  private calculateSkillMatch(candidateSkills: string[], requiredSkills: string[]): number {
    if (!requiredSkills || !requiredSkills.length) return 50; // Neutral score if no requirements
    if (!candidateSkills || !candidateSkills.length) return 0;
    
    let totalScore = 0;
    let matchedCount = 0;
    
    // Check each required skill
    requiredSkills.forEach(reqSkill => {
      const reqLower = reqSkill.toLowerCase();
      
      // Exact match gets full points
      if (candidateSkills.some(skill => skill.toLowerCase() === reqLower)) {
        totalScore += 100;
        matchedCount++;
      }
      // Partial match gets partial points
      else if (candidateSkills.some(skill => 
        skill.toLowerCase().includes(reqLower) || reqLower.includes(skill.toLowerCase())
      )) {
        totalScore += 70;
        matchedCount++;
      }
    });
    
    // Calculate percentage based on matched skills
    const matchPercentage = (matchedCount / requiredSkills.length) * 100;
    const avgScore = matchedCount > 0 ? totalScore / matchedCount : 0;
    
    // Weighted combination: 70% match percentage, 30% quality of matches
    return Math.round(matchPercentage * 0.7 + avgScore * 0.3);
  }

  private calculateExperienceMatch(candidateExp: any[], requiredExp: number): number {
    // Simple implementation - would need to parse experience duration
    if (!requiredExp) return 100;
    
    // For now, give a score based on number of experiences
    const estimatedYears = candidateExp.length * 2; // Rough estimate
    
    if (estimatedYears >= requiredExp) return 100;
    return Math.round((estimatedYears / requiredExp) * 100);
  }

  private calculateEducationMatch(candidateEdu: any[], requiredEdu: string[]): number {
    if (!requiredEdu.length) return 100;
    
    // Basic matching - would need more sophisticated logic
    return candidateEdu.length > 0 ? 80 : 40;
  }

  private calculateKeywordMatch(resumeText: string, keywords: string[]): number {
    if (!keywords || !keywords.length) return 50; // Neutral if no keywords
    if (!resumeText) return 0;
    
    const lowerText = resumeText.toLowerCase();
    const words = lowerText.split(/\W+/);
    const wordSet = new Set(words);
    
    let matchScore = 0;
    let totalKeywords = Math.min(keywords.length, 30); // Cap at 30 keywords for fairness
    
    keywords.slice(0, 30).forEach(keyword => {
      const keyLower = keyword.toLowerCase();
      
      // Exact word match
      if (wordSet.has(keyLower)) {
        matchScore += 100;
      }
      // Substring match (less weight)
      else if (lowerText.includes(keyLower)) {
        matchScore += 50;
      }
    });
    
    return Math.round(matchScore / totalKeywords);
  }

  private generateImprovements(
    scores: any, 
    candidateData: any, 
    jobData: IJob
  ): string[] {
    const improvements: string[] = [];

    // Skill improvements
    if (scores.skillMatch < 80) {
      const missingSkills = jobData.requirements.skills.filter(skill =>
        !candidateData.skills.some((cs: string) => 
          cs.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      if (missingSkills.length > 0) {
        improvements.push(`Missing key skills: ${missingSkills.slice(0, 3).join(', ')}`);
      }
    }

    // Experience improvements
    if (scores.experienceMatch < 80) {
      improvements.push(`Consider highlighting more relevant experience for this role`);
    }

    // Education improvements
    if (scores.educationMatch < 80 && jobData.requirements.education.length > 0) {
      improvements.push(`Education requirements may not be fully met`);
    }

    // Keyword improvements
    if (scores.keywordMatch < 70) {
      improvements.push(`Resume could benefit from more role-specific keywords`);
    }

    return improvements;
  }

  private identifyStrengths(
    scores: any,
    candidateData: any,
    jobData: IJob
  ): string[] {
    const strengths: string[] = [];

    if (scores.skillMatch >= 80) {
      strengths.push('Strong skill match with job requirements');
    }

    if (scores.experienceMatch >= 80) {
      strengths.push('Relevant experience level for the position');
    }

    if (scores.keywordMatch >= 80) {
      strengths.push('Good keyword optimization');
    }

    return strengths;
  }
}

export default new ScoringService();