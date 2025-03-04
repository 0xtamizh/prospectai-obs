import React, { useState } from 'react';
import { Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { Interaction } from '../types/interaction';
import { entityCache } from '../lib/entityCache';

interface InteractionListProps {
  interactions: Interaction[];
  onRefresh: () => void;
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
  title: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const InteractionList: React.FC<InteractionListProps> = ({
  interactions,
  onRefresh,
  loading,
  title,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getEntityInfo = (interaction: Interaction) => {
    const org = entityCache.getOrg(interaction.org_id);
    const user = entityCache.getUser(interaction.user_id);
    const agent = entityCache.getAgent(interaction.agent_id);

    return {
      orgName: org?.name || 'Unknown',
      orgId: interaction.org_id,
      userName: user?.name || 'Unknown',
      userId: interaction.user_id,
      agentName: agent?.name || 'Unknown',
      agentId: interaction.agent_id,
    };
  };

  const statusCounts = interactions.reduce((acc, interaction) => {
    acc[interaction.status] = (acc[interaction.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total entries: {totalCount}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-green-800 dark:text-green-200 font-semibold">Success</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.success || 0}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.pending || 0}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h3 className="text-red-800 dark:text-red-200 font-semibold">Failed</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.failed || 0}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {interactions.map((interaction) => {
                const entityInfo = getEntityInfo(interaction);
                return (
                  <tr key={interaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(interaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {entityInfo.orgName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {entityInfo.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(interaction.status)}`}>
                        {interaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {interaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => setSelectedInteraction(interaction)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {selectedInteraction && (
        <div 
          className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50"
          onClick={() => setSelectedInteraction(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Interaction Details
              </h3>
              <button
                onClick={() => setSelectedInteraction(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                  <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Basic Information</h4>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</dt>
                      <dd className="mt-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {getEntityInfo(selectedInteraction).orgName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {getEntityInfo(selectedInteraction).orgId}
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User</dt>
                      <dd className="mt-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {getEntityInfo(selectedInteraction).userName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {getEntityInfo(selectedInteraction).userId}
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent</dt>
                      <dd className="mt-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {getEntityInfo(selectedInteraction).agentName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {getEntityInfo(selectedInteraction).agentId}
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                  <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Interaction Details</h4>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                      <dd className="mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInteraction.status)}`}>
                          {selectedInteraction.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(selectedInteraction.created_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(selectedInteraction.updated_at)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                  <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Content</h4>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInteraction.subject}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Body</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {selectedInteraction.body}
                      </dd>
                    </div>
                  </dl>
                </div>

                {(selectedInteraction.llm_metrics || selectedInteraction.interaction_info) && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                    <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Metrics & Info</h4>
                    {selectedInteraction.llm_metrics && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LLM Metrics</h5>
                        <pre className="text-sm bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-x-auto">
                          <code className="text-gray-800 dark:text-gray-200">
                            {JSON.stringify(selectedInteraction.llm_metrics, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                    {selectedInteraction.interaction_info && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interaction Info</h5>
                        <pre className="text-sm bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-x-auto">
                          <code className="text-gray-800 dark:text-gray-200">
                            {JSON.stringify(selectedInteraction.interaction_info, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}

                    {/* Error Information Section */}
                    {selectedInteraction.status === 'failed' && 
                     selectedInteraction.interaction_info?.error_info && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Error Information
                        </h5>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-red-800 dark:text-red-300">Error Message:</span>
                            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                              {selectedInteraction.interaction_info.error_info.message}
                            </p>
                          </div>
                          {selectedInteraction.interaction_info.error_info.context && (
                            <div>
                              <span className="text-sm font-medium text-red-800 dark:text-red-300">Context:</span>
                              <pre className="mt-1 text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
                                {JSON.stringify(selectedInteraction.interaction_info.error_info.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionList;