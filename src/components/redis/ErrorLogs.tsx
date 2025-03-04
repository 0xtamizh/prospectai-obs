import React, { useState, useEffect } from 'react';
import { redisLogsCache } from '../../lib/redisLogsCache';
import { RedisLog, RedisLogStats, RedisLogFilters, TIME_RANGE_OPTIONS } from '../../types/redis';
import { Loader2, X, Clock, Filter, Database, Eye, RefreshCw } from 'lucide-react';

interface ErrorLogsProps {
  onBack: () => void;
}

const ErrorLogs: React.FC<ErrorLogsProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<RedisLog[]>([]);
  const [stats, setStats] = useState<RedisLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RedisLogFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<RedisLog | null>(null);
  const pageSize = 42;

  useEffect(() => {
    // Only load from cache, no backend requests
    const { logs: cachedLogs, stats: cachedStats } = redisLogsCache.getFilteredLogs(filters);
    updateLogsView(cachedLogs, cachedStats);
    setLoading(false);
  }, [filters, page]);

  const updateLogsView = (allLogs: RedisLog[], currentStats: RedisLogStats) => {
    const { logs: filteredLogs, stats: filteredStats } = redisLogsCache.getFilteredLogs(filters);
    
    const totalItems = filteredLogs.length;
    const calculatedTotalPages = Math.ceil(totalItems / pageSize);
    setTotalPages(calculatedTotalPages);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    setLogs(paginatedLogs);
    setStats(filteredStats);
  };

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    if (key === 'timestamp') {
      return new Date(value).toLocaleString();
    }
    
    return String(value);
  };

  const renderLogDetailsContent = (log: RedisLog) => {
    const sections = [
      {
        title: 'Basic Information',
        fields: ['message', 'category', 'type', 'timestamp']
      },
      {
        title: 'Queue Information',
        fields: ['queue', 'interactionId']
      },
      {
        title: 'Error Details',
        fields: ['stack']
      },
      {
        title: 'Additional Metadata',
        fields: ['metadata']
      }
    ];

    return (
      <div className="space-y-6">
        {sections.map((section) => {
          const hasContent = section.fields.some(field => log[field as keyof RedisLog]);
          
          if (!hasContent) return null;
          
          return (
            <div key={section.title} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {section.title}
              </h4>
              <div className="space-y-4">
                {section.fields.map(field => {
                  const value = log[field as keyof RedisLog];
                  if (!value) return null;

                  return (
                    <div key={field} className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      {field === 'metadata' || field === 'stack' ? (
                        <pre className="text-sm bg-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-600">
                          <code className="text-gray-800 dark:text-gray-200">
                            {formatValue(field, value)}
                          </code>
                        </pre>
                      ) : (
                        <p className="text-gray-900 dark:text-white text-sm break-words">
                          {formatValue(field, value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleTimeRangeChange = (value: string) => {
    const option = TIME_RANGE_OPTIONS.find(opt => opt.value === value);
    if (option) {
      const end = new Date();
      const start = new Date(end.getTime() - (option.minutes * 60 * 1000));
      setFilters(prev => ({ ...prev, timeRange: { start, end } }));
      setPage(1);
    } else {
      setFilters(prev => {
        const { timeRange, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category
    }));
    setPage(1);
  };

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type === type ? undefined : type
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Processing Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Organizing and processing log data...
          </p>
        </div>
      </div>
    );
  }

  if (!redisLogsCache.hasCachedData()) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Folders
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Log Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Log data is being fetched in the background. Please check back in a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <button
          onClick={onBack}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to Folders
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error Logs</h2>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          {(filters.timeRange || filters.category || filters.type) && (
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X size={16} className="mr-2" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock size={16} className="mr-2" />
              Time Range
            </label>
            <select
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              value={filters.timeRange ? TIME_RANGE_OPTIONS.find(
                opt => opt.minutes === 
                  Math.round((filters.timeRange!.end.getTime() - filters.timeRange!.start.getTime()) / (60 * 1000))
              )?.value || '' : ''}
            >
              <option value="">All Time</option>
              {TIME_RANGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Filter size={16} className="mr-2" />
              Category
            </label>
            <select
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              onChange={(e) => handleCategoryFilter(e.target.value)}
              value={filters.category || ''}
            >
              <option value="">All Categories</option>
              {Object.keys(stats?.byCategory || {}).map(category => (
                <option key={category} value={category}>
                  {category} ({stats?.byCategory[category]})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Database size={16} className="mr-2" />
              Type
            </label>
            <select
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              onChange={(e) => handleTypeFilter(e.target.value)}
              value={filters.type || ''}
            >
              <option value="">All Types</option>
              {Object.keys(stats?.byType || {}).map(type => (
                <option key={type} value={type}>
                  {type} ({stats?.byType[type]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, stats?.total || 0)} of {stats?.total || 0} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {stats?.lastFetchTime && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {stats.lastFetchTime.toLocaleString()}
            </div>
          )}
        </>
      )}

      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {renderLogDetailsContent(selectedLog)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogs;