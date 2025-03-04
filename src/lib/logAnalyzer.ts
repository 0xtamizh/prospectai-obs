import { GoogleGenerativeAI } from '@google/generative-ai';
import { RedisLog } from '../types/redis';
import { LogAnalysis, ErrorDetail } from '../types/logAnalysis';

class LogAnalyzer {
  private genAI: any;
  private model: any;
  private analysisCache: Map<string, { analysis: LogAnalysis; timestamp: Date }> = new Map();
  private readonly ANALYSIS_CACHE_DURATION = 1000 * 60 * 60 * 2; // 2 hours
  private analyzing: boolean = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI("AIzaSyD1yzDVph0gZva1yPRKu750ZTx0VgPjLA8");
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

    try {
      const savedCache = localStorage.getItem('logAnalysisCache');
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        this.analysisCache = new Map(
          Object.entries(parsed).map(([key, value]: [string, any]) => [
            key,
            { ...value, timestamp: new Date(value.timestamp) }
          ])
        );
      }
    } catch (error) {
      console.error('Error loading analysis cache:', error);
    }
  }

  private saveCache() {
    try {
      const cacheObj = Object.fromEntries(this.analysisCache.entries());
      localStorage.setItem('logAnalysisCache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error saving analysis cache:', error);
    }
  }

  private isCacheValid(category: string): boolean {
    const cached = this.analysisCache.get(category);
    if (!cached) return false;
    
    const now = new Date();
    return now.getTime() - cached.timestamp.getTime() < this.ANALYSIS_CACHE_DURATION;
  }

  public isAnalyzing(): boolean {
    return this.analyzing;
  }

  public async analyze(logs: RedisLog[]): Promise<LogAnalysis> {
    if (logs.length === 0) {
      throw new Error('No logs provided for analysis');
    }

    const category = logs[0].category;
    
    if (this.isCacheValid(category)) {
      const cached = this.analysisCache.get(category);
      if (cached) return cached.analysis;
    }

    if (this.analyzing) {
      throw new Error('Analysis already in progress');
    }

    this.analyzing = true;

    try {
      const prompt = `You are a log analysis expert. Analyze these Redis error logs and provide a concise JSON response with multiple error analyses. Each error should have up to 30 words per field:

<category_data>${this.formatLogsForAnalysis(logs)}</category_data>

{
  "errors": [
    {
      "summary": "<error description>",
      "rootCause": "<technical explanation>",
      "sourceLocation": "<file/function name>",
      "suggestedFix": "<solution>",
      "severity": "<critical|high|medium|low>"
    }
  ],
  "severity": "<overall severity level: critical|high|medium|low>"
}

Group similar errors together and identify unique error patterns. Focus on actionable insights and technical precision.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }

      const analysis: LogAnalysis = JSON.parse(jsonMatch[0]);
      
      this.analysisCache.set(category, {
        analysis,
        timestamp: new Date()
      });

      this.saveCache();
      return analysis;
    } catch (error) {
      console.error('Error analyzing logs:', error);
      throw new Error('Failed to analyze logs');
    } finally {
      this.analyzing = false;
    }
  }

  private formatLogsForAnalysis(logs: RedisLog[]): string {
    return logs.map(log => {
      return `
Timestamp: ${log.timestamp}
Category: ${log.category}
Message: ${log.message}
${log.metadata ? `Metadata: ${JSON.stringify(log.metadata, null, 2)}` : ''}
-------------------`;
    }).join('\n');
  }

  public clearCache(): void {
    this.analysisCache.clear();
    localStorage.removeItem('logAnalysisCache');
  }
}

export const logAnalyzer = new LogAnalyzer();