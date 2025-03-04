import React, { useState, useEffect } from 'react';
import { RedisFolder, REDIS_FOLDERS } from '../types/redis';
import ErrorLogs from './redis/ErrorLogs';
import { AlertCircle, AlertOctagon, User, ListOrdered, Database, Loader2 } from 'lucide-react';
import { redisLogsCache } from '../lib/redisLogsCache';

const iconMap = {
  'AlertCircle': AlertCircle,
  'AlertOctagon': AlertOctagon,
  'User': User,
  'ListOrdered': ListOrdered,
  'Database': Database
};

const RedisLogs: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState<RedisFolder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInitialization = async () => {
      if (!redisLogsCache.isInitialized()) {
        await redisLogsCache.initialize();
      }
      setLoading(false);
    };

    checkInitialization();
  }, []);

  const renderFolderIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap];
    return Icon ? <Icon className="w-6 h-6" /> : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (selectedFolder) {
    if (selectedFolder.id === 'error') {
      return <ErrorLogs onBack={() => setSelectedFolder(null)} />;
    }
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedFolder(null)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to Folders
        </button>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {selectedFolder.name} viewer is coming soon
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Redis Logs</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select a folder to view its logs and metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REDIS_FOLDERS.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setSelectedFolder(folder)}
            className="flex items-start p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              {renderFolderIcon(folder.icon)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {folder.name}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {folder.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RedisLogs;