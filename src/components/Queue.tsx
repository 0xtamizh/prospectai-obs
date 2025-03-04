import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { entityCache } from '../lib/entityCache';
import { QueueItem, QueueStats, QueueUserGroup } from '../types/queue';
import { Loader2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

const Queue: React.FC = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30 * 1000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      await entityCache.initializeCache();

      // Fetch queue items
      const { data: queueData, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .order('created_at', { ascending: false });

      if (queueError) throw queueError;

      const items = queueData || [];
      setItems(items);

      // Calculate stats by user
      const statsByUser: QueueStats['byUser'] = {};
      items.forEach(item => {
        const user = entityCache.getUser(item.user_id);
        if (!statsByUser[item.user_id]) {
          statsByUser[item.user_id] = {
            pending: 0,
            active: 0,
            completed: 0,
            total: 0,
            user: {
              name: user?.name || item.user_id,
              email: user?.email || ''
            }
          };
        }
        
        statsByUser[item.user_id].total++;
        if (item.status === 'active') statsByUser[item.user_id].active++;
        else if (item.status === 'completed') statsByUser[item.user_id].completed++;
        else statsByUser[item.user_id].pending++;
      });

      setStats({
        total: items.length,
        byUser: statsByUser,
        lastFetchTime: new Date()
      });

      setLastFetchTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError('Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const groupItemsByUser = (): QueueUserGroup[] => {
    const groups: Record<string, QueueUserGroup> = {};
    
    items.forEach(item => {
      const user = entityCache.getUser(item.user_id);
      if (!groups[item.user_id]) {
        groups[item.user_id] = {
          userId: item.user_id,
          userName: user?.name || item.user_id,
          userEmail: user?.email || '',
          items: [],
          stats: {
            pending: 0,
            active: 0,
            completed: 0,
            total: 0
          }
        };
      }
      
      groups[item.user_id].items.push(item);
      groups[item.user_id].stats.total++;
      if (item.status === 'active') groups[item.user_id].stats.active++;
      else if (item.status === 'completed') groups[item.user_id].stats.completed++;
      else groups[item.user_id].stats.pending++;
    });

    return Object.values(groups).sort((a, b) => b.stats.total - a.stats.total);
  };

  if (loading && !items.length) {
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

  const userGroups = groupItemsByUser();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Queue Management</h2>
        <button
          onClick={fetchQueue}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {userGroups.map(group => (
          <div key={group.userId} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => toggleUserExpand(group.userId)}
            >
              <div className="flex items-center space-x-4">
                {expandedUsers.has(group.userId) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.userName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{group.userEmail}</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{group.stats.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{group.stats.pending}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{group.stats.active}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">{group.stats.completed}</p>
                </div>
              </div>
            </div>

            {expandedUsers.has(group.userId) && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Interaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.first_name} {item.last_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.job_title}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {item.company_name}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.type}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full
                            ${item.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.last_interaction_on ? new Date(item.last_interaction_on).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {lastFetchTime && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastFetchTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default Queue;