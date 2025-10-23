import { spawn } from 'child_process';
import path from 'path';

interface SalaryPredictionInput {
  jobTitle: string;
  location: string;
  experienceYears?: number;
  skills?: string[];
}

interface SalaryPredictionResult {
  jobTitle: string;
  location: string;
  experienceYears: number;
  overallAverage: number;
  overallMin: number;
  overallMax: number;
  median: number;
  percentile75: number;
  percentile90: number;
  sources: Array<{
    source: string;
    min: number;
    max: number;
    average: number;
    url?: string;
  }>;
  costOfLivingIndex: number;
  recommendations: string[];
}

class SalaryService {
  private pythonScriptPath: string;

  constructor() {
    // Path to Python salary predictor (use old working version for now)
    this.pythonScriptPath = path.join(__dirname, '../../../ai-matching-service/salary_predictor_ml.py');
  }

  /**
   * Predict salary using Python service
   */
  async predictSalary(input: SalaryPredictionInput): Promise<SalaryPredictionResult> {
    return new Promise((resolve, reject) => {
      console.log('🔮 Predicting salary for:', input);
      console.log('Python script path:', this.pythonScriptPath);

      const inputData = JSON.stringify({
        jobTitle: input.jobTitle,
        location: input.location,
        experienceYears: input.experienceYears || 3,
        skills: input.skills || [],
      });

      console.log('Input data:', inputData);

      // Spawn Python process
      let pythonProcess;
      try {
        pythonProcess = spawn('python', [this.pythonScriptPath, inputData]);
        console.log('Python process spawned successfully with PID:', pythonProcess.pid);
      } catch (error: any) {
        console.error('Failed to spawn Python process:', error);
        reject(new Error(`Failed to spawn Python: ${error.message}`));
        return;
      }

      let outputData = '';
      let errorData = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        const stderrText = data.toString();
        errorData += stderrText;
        // Log stderr in real-time for debugging
        console.log('[Python stderr]:', stderrText);
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code: ${code}`);
        console.log('Stdout length:', outputData.length);
        console.log('Stderr length:', errorData.length);

        if (code !== 0) {
          console.error('Python script error (code !== 0):', errorData);
          reject(new Error(`Salary prediction failed: ${errorData || 'Unknown error'}`));
          return;
        }

        try {
          // Extract JSON from output (might have logs after JSON)
          // JSON output is on the first line
          const lines = outputData.trim().split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));

          if (!jsonLine) {
            console.error('No JSON found in Python output:', outputData);
            reject(new Error('Failed to parse salary prediction: No JSON output found'));
            return;
          }

          const result = JSON.parse(jsonLine);

          if (result.error) {
            reject(new Error(result.error));
            return;
          }

          console.log('✅ Salary prediction successful');
          resolve(result);
        } catch (error: any) {
          console.error('Failed to parse Python output:', outputData);
          reject(new Error(`Failed to parse salary prediction result: ${error.message}`));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error(`Failed to start salary prediction: ${error.message}`));
      });
    });
  }

  /**
   * Get cost of living index for a location
   */
  getCostOfLiving(location: string): number {
    // Simplified cost of living data
    const colIndex: Record<string, number> = {
      'san francisco': 1.62,
      'new york': 1.68,
      'seattle': 1.41,
      'austin': 1.06,
      'boston': 1.47,
      'los angeles': 1.41,
      'chicago': 1.08,
      'denver': 1.12,
      'atlanta': 0.96,
      'dallas': 0.96,
      'miami': 1.10,
      'phoenix': 0.96,
      'philadelphia': 1.06,
      'san diego': 1.44,
      'portland': 1.26,
    };

    const city = location.toLowerCase().split(',')[0].trim();
    return colIndex[city] || 1.0;
  }

  /**
   * Validate input data
   */
  validateInput(input: SalaryPredictionInput): { valid: boolean; error?: string } {
    if (!input.jobTitle || input.jobTitle.trim().length === 0) {
      return { valid: false, error: 'Job title is required' };
    }

    if (!input.location || input.location.trim().length === 0) {
      return { valid: false, error: 'Location is required' };
    }

    if (input.experienceYears !== undefined && (input.experienceYears < 0 || input.experienceYears > 50)) {
      return { valid: false, error: 'Experience years must be between 0 and 50' };
    }

    return { valid: true };
  }
}

export default new SalaryService();
