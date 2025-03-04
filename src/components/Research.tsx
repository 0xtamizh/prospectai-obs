import React, { useState, useEffect } from 'react';
import { researchStatsCache } from '../lib/researchStatsCache';
import { ResearchStats } from '../types/research';
import { Loader2, RefreshCw } from 'lucide-react';

const Research: React.FC = () => {
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      const newStats = await researchStatsCache.fetchStats(forceRefresh);
      setStats(newStats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch research statistics');
      console.error('Error fetching research stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const StatCard = ({ 
    title, 
    total, 
    newCount 
  }: { 
    title: string; 
    total: number; 
    newCount: number;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </p>
            {newCount > 0 && (
              <p className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                (+{newCount.toLocaleString()})
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Analytics</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contacts Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contacts</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.contacts.total.toLocaleString()}
                </p>
                {stats.contacts.newSinceLastFetch > 0 && (
                  <p className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    (+{stats.contacts.newSinceLastFetch.toLocaleString()})
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Contacts</p>
            </div>
            <div>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {stats.contacts.researched.toLocaleString()}
                </p>
                {stats.contacts.newResearchedSinceLastFetch > 0 && (
                  <p className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    (+{stats.contacts.newResearchedSinceLastFetch.toLocaleString()})
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Researched</p>
            </div>
          </div>
        </div>

        {/* Other Stats Cards */}
        <StatCard
          title="Websites"
          total={stats.websites.total}
          newCount={stats.websites.newSinceLastFetch}
        />
        <StatCard
          title="LinkedIn Profiles"
          total={stats.linkedinProfiles.total}
          newCount={stats.linkedinProfiles.newSinceLastFetch}
        />
        <StatCard
          title="Company Profiles"
          total={stats.companyProfiles.total}
          newCount={stats.companyProfiles.newSinceLastFetch}
        />
      </div>

      {stats.lastFetchTime && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {stats.lastFetchTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default Research;