import React from 'react';
import { FilterOptions, DATE_RANGE_OPTIONS } from '../types/interaction';
import { entityCache } from '../lib/entityCache';
import { X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearFilters }) => {
  const organizations = entityCache.getAllOrgs();
  const users = entityCache.getUsersByOrg(filters.orgId);

  const hasActiveFilters = () => {
    const defaultDateRange = 24 * 60 * 60 * 1000;
    const currentDateRange = filters.dateRange ? 
      filters.dateRange.end.getTime() - filters.dateRange.start.getTime() : 
      defaultDateRange;
    
    return filters.orgId || 
           filters.userId || 
           Math.abs(currentDateRange - defaultDateRange) > 1000;
  };

  const getSelectedDateRangeValue = () => {
    if (!filters.dateRange) return 'day';
    
    const diff = filters.dateRange.end.getTime() - filters.dateRange.start.getTime();
    const hours = diff / (1000 * 60 * 60);

    const ranges = {
      hour: 1,
      '8hours': 8,
      day: 24,
      '3days': 72,
      week: 168,
      '2weeks': 336,
      month: 720,
      '3months': 2160,
      '6months': 4320,
      year: 8760
    };

    const closest = Object.entries(ranges).reduce((prev, [key, value]) => {
      return Math.abs(value - hours) < Math.abs(ranges[prev] - hours) ? key : prev;
    }, 'day');

    return closest;
  };

  const handleDateRangeChange = (value: string) => {
    const now = new Date();
    let start = new Date(now);

    switch (value) {
      case 'hour':
        start.setHours(now.getHours() - 1);
        break;
      case '8hours':
        start.setHours(now.getHours() - 8);
        break;
      case 'day':
        start.setHours(now.getHours() - 24);
        break;
      case '3days':
        start.setDate(now.getDate() - 3);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case '2weeks':
        start.setDate(now.getDate() - 14);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        break;
      case '3months':
        start.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    onFilterChange({
      ...filters,
      dateRange: { start, end: now }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-2 lg:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        {hasActiveFilters() && (
          <button
            onClick={onClearFilters}
            className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={16} className="mr-2" />
            Clear Filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
          <select
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            value={filters.orgId || ''}
            onChange={(e) => {
              const orgId = e.target.value || undefined;
              onFilterChange({ 
                ...filters, 
                orgId,
                userId: undefined
              });
            }}
          >
            <option value="">All Organizations</option>
            {Object.values(organizations).map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
          <select
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
            value={filters.userId || ''}
            onChange={(e) => onFilterChange({ ...filters, userId: e.target.value || undefined })}
            disabled={!filters.orgId}
          >
            <option value="">All Users</option>
            {Object.values(users).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
          <select
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            value={getSelectedDateRangeValue()}
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;