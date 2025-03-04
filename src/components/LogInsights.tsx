import React, { useState, useEffect } from 'react';
import { redisLogsCache } from '../lib/redisLogsCache';
import { logAnalyzer } from '../lib/logAnalyzer';
import { RedisLog, RedisLogStats } from '../types/redis';
import { LogAnalysis } from '../types/logAnalysis';
import { Loader2, RefreshCw, AlertCircle, Mail, Lock, Database } from 'lucide-react';

const LogInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, LogAnalysis>>({});
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  const categories = ['general', 'email', 'locking', 'database'];
  const categoryIcons = {
    general: AlertCircle,
    email: Mail,
    locking: Lock,
    database: Database
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  };

  const analyzeLogs = async (logs: RedisLog[]) => {
    if (analyzing) return;
    
    setAnalyzing(true);
    try {
      const analysisResults: Record<string, LogAnalysis> = {};
      
      for (const category of categories) {
        const categoryLogs = logs.filter(log => log.category === category);
        if (categoryLogs.length > 0) {
          const result = await logAnalyzer.analyze(categoryLogs);
          analysisResults[category] = result;
        }
      }

      setAnalysis(analysisResults);
      setLastAnalysisTime(new Date());
    } catch (err) {
      console.error('Error analyzing logs:', err);
      setError('Failed to analyze logs');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Check for cached data periodically
    const checkCache = async () => {
      const { logs } = redisLogsCache.getFilteredLogs();
      if (logs.length > 0 && !analyzing) {
        await analyzeLogs(logs);
      }
      setLoading(false);
    };

    checkCache();
    const interval = setInterval(checkCache, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Log Insights
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing error patterns and generating insights...
          </p>
        </div>
      </div>
    );
  }

  if (!redisLogsCache.hasCachedData()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <RefreshCw className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4 animate-spin" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Log Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Log data is being fetched in the background. Please check back in a few moments.
        </p>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Generating Insights
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Using AI to analyze error patterns...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Insights</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-powered analysis of Redis error logs
          </p>
        </div>
        <button
          onClick={() => {
            const { logs } = redisLogsCache.getFilteredLogs();
            if (logs.length > 0) {
              analyzeLogs(logs);
            }
          }}
          disabled={analyzing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {categories.map(category => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          const categoryAnalysis = analysis[category];
          
          if (!categoryAnalysis) return null;

          return (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {category} Errors
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Overall severity: 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[categoryAnalysis.severity]}`}>
                        {categoryAnalysis.severity}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Error Summary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Root Cause
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Suggested Fix
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Severity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {categoryAnalysis.errors.map((error, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {error.summary}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {error.sourceLocation}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {error.rootCause}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {error.suggestedFix}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[error.severity]}`}>
                              {error.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lastAnalysisTime && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last analyzed: {lastAnalysisTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default LogInsights;