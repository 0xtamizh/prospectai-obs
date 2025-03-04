import React, { useState, useEffect } from 'react';
import { entityCache } from '../lib/entityCache';
import { UserInfo, OrgInfo, AgentInfo } from '../types/interaction';

const Settings = () => {
  const [organizations, setOrganizations] = useState<Record<string, OrgInfo>>({});
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'agents'>('organizations');

  useEffect(() => {
    const loadCacheData = async () => {
      await entityCache.initializeCache();
      setOrganizations(entityCache.getAllOrgs());
      setUsers(entityCache.getAllUsers());
      setAgents(entityCache.getAllAgents());
    };

    loadCacheData();
  }, []);

  const renderOrganizations = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Object.values(organizations).map((org) => (
            <tr key={org.id}>
              <td className="px-6 py-4 text-sm text-gray-500">{org.id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{org.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Object.values(users).map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 text-sm text-gray-500">{user.id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAgents = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Object.values(agents).map((agent) => (
            <tr key={agent.id}>
              <td className="px-6 py-4 text-sm text-gray-500">{agent.id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{agent.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{agent.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['organizations', 'users', 'agents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'organizations' && renderOrganizations()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'agents' && renderAgents()}
      </div>
    </div>
  );
};

export default Settings;