export interface ErrorDetail {
  summary: string;
  rootCause: string;
  sourceLocation: string;
  suggestedFix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface LogAnalysis {
  errors: ErrorDetail[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}