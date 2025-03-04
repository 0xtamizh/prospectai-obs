import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { entityCache } from './lib/entityCache';
import { redisLogsCache } from './lib/redisLogsCache';
import Sidebar from './components/Sidebar';
import InteractionList from './components/InteractionList';
import FilterBar from './components/FilterBar';
import Settings from './components/Settings';
import Research from './components/Research';
import Queue from './components/Queue';
import RedisLogs from './components/RedisLogs';
import LogInsights from './components/LogInsights';
import Login from './components/Login';
import { Menu } from 'lucide-react';
import { Interaction, FilterOptions, PaginationState } from './types/interaction';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [activeSection, setActiveSection] = useState('interactions');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 50,
    totalCount: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize caches
      entityCache.initializeCache();
      redisLogsCache.initialize().catch(console.error);
      
      if (activeSection !== 'settings' && activeSection !== 'research' && 
          activeSection !== 'queues' && activeSection !== 'redis-logs' && 
          activeSection !== 'log-insights') {
        fetchInteractions(1);
      }
    }
  }, [activeSection, filters, isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    entityCache.clearCache();
  };

  const handleClearFilters = () => {
    setFilters({
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      }
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSectionTitle = () => {
    const menuMap: Record<string, string> = {
      'interactions': 'All Interactions',
      'email': 'Email Interactions',
      'linkedin': 'LinkedIn Interactions',
      'call': 'Call Interactions',
      'cold-email': 'Cold Emails',
      'followup-email': 'Follow-up Emails',
      'send-linkedin-connection-req': 'LinkedIn Connection Requests',
      'send-linkedin-message': 'LinkedIn Messages',
      'view-linkedin-profile': 'LinkedIn Profile Views',
      'comment-on-linkedin-post': 'LinkedIn Post Comments',
      'send-linkedin-connection-req-with-note': 'LinkedIn Connection Requests with Note',
      'settings': 'Settings',
      'queues': 'Queues',
      'research': 'Research Analytics',
      'redis-logs': 'Redis Logs',
      'log-insights': 'Log Insights'
    };
    return menuMap[activeSection] || 'Interactions';
  };

  const fetchInteractions = async (page: number = 1) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await entityCache.initializeCache();

      let query = supabase
        .from('interactions')
        .select('*', { count: 'exact' });

      if (activeSection !== 'interactions' && activeSection !== 'settings') {
        if (['email', 'linkedin', 'call'].includes(activeSection)) {
          query = query.eq('type', activeSection);
        } else {
          query = query.eq('action', activeSection);
        }
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      if (filters.orgId) {
        query = query.eq('org_id', filters.orgId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const from = (page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        setInteractions(data);
        setPagination(prev => ({
          ...prev,
          page,
          totalCount: count || 0
        }));
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch interactions';
      setError(errorMessage);
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    fetchInteractions(newPage);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'settings':
        return <Settings />;
      case 'research':
        return <Research />;
      case 'queues':
        return <Queue />;
      case 'redis-logs':
        return <RedisLogs />;
      case 'log-insights':
        return <LogInsights />;
      default:
        return (
          <>
            <FilterBar 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onClearFilters={handleClearFilters}
            />
            <InteractionList
              interactions={interactions}
              onRefresh={() => window.location.reload()}
              onLoadMore={() => {}}
              loading={loading}
              hasMore={false}
              title={`${getSectionTitle()} (${pagination.totalCount})`}
              totalCount={pagination.totalCount}
              currentPage={pagination.page}
              totalPages={Math.ceil(pagination.totalCount / pagination.pageSize)}
              onPageChange={handlePageChange}
            />
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 h-full
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 w-full">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App