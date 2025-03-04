import React, { useState } from 'react';
import { LayoutDashboard, Settings, Database, LineChart, AlertCircle, ChevronLeft, ChevronRight, BarChart2, RefreshCw } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { redisLogsCache } from '../lib/redisLogsCache';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  subItems: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  subItems?: SubMenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, onLogout }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['interactions']);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRefreshRedis = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await redisLogsCache.fetchLogs('error', true);
    } catch (error) {
      console.error('Error refreshing Redis logs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'interactions',
      icon: LayoutDashboard,
      label: 'Interactions',
      subItems: [
        {
          id: 'email',
          label: 'Emails',
          subItems: [
            { id: 'cold-email', label: 'Cold Emails' },
            { id: 'followup-email', label: 'Follow-up Emails' }
          ]
        },
        {
          id: 'linkedin',
          label: 'LinkedIn',
          subItems: [
            { id: 'send-linkedin-connection-req', label: 'Connection Requests' },
            { id: 'send-linkedin-message', label: 'Messages' },
            { id: 'view-linkedin-profile', label: 'Profile Views' },
            { id: 'comment-on-linkedin-post', label: 'Post Comments' },
            { id: 'send-linkedin-connection-req-with-note', label: 'Connection Requests with Note' }
          ]
        },
        {
          id: 'call',
          label: 'Calls',
          subItems: []
        }
      ]
    },
    {
      id: 'queues',
      icon: Database,
      label: 'Queues',
      subItems: []
    },
    {
      id: 'research',
      icon: LineChart,
      label: 'Research',
      subItems: []
    },
    {
      id: 'redis-logs',
      icon: AlertCircle,
      label: 'Redis Logs',
      subItems: []
    },
    {
      id: 'log-insights',
      icon: BarChart2,
      label: 'Log Insights',
      subItems: []
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      subItems: []
    }
  ];

  const renderMenuItem = (item: MenuItem | SubMenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
    const Icon = 'icon' in item ? item.icon : null;
    
    return (
      <div key={item.id} className={`ml-${level * 4}`}>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleExpand(item.id);
            }
            onSectionChange(item.id);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${
            activeSection === item.id ? 'bg-blue-600' : 'hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {Icon && <Icon size={20} />}
            {!isCollapsed && <span className="truncate">{item.label}</span>}
            
          </div>
        </button>
        
        {hasSubItems && isExpanded && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1">
            {item.subItems.map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 ease-in-out relative`}>
      <div className={`p-4 ${isCollapsed ? 'items-center' : ''} flex flex-col h-full`}>
        <div className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <h1 className="text-xl font-bold">ProspectAi's Observation Center</h1>}
        
          
          <ThemeToggle />
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
        
        <div className="space-y-2 pt-4">
          <button
            onClick={handleRefreshRedis}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isCollapsed ? (
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            ) : (
              <div className="flex items-center">
                <RefreshCw size={20} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Redis</span>
              </div>
            )}
          </button>

          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <div className="flex items-center">
                <ChevronLeft size={20} className="mr-2" />
                <span>Collapse Menu</span>
              </div>
            )}
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            {isCollapsed ? 'Exit' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;