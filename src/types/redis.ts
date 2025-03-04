import { TypeIcon as IconType } from 'lucide-react';

export interface RedisLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  metadata?: Record<string, any>;
  category: string;
  type?: string;
}

export interface RedisLogStats {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  lastFetchTime: Date | null;
}

export interface RedisLogFilters {
  category?: string;
  timeRange?: TimeRange;
  type?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface RedisFolder {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const REDIS_FOLDERS: RedisFolder[] = [
  {
    id: 'error',
    name: 'Error Logs',
    description: 'System and application error logs',
    icon: 'AlertCircle'
  },
  {
    id: 'errors',
    name: 'Errors Folder',
    description: 'Legacy error logs',
    icon: 'AlertOctagon'
  },
  {
    id: 'account',
    name: 'Account Logs',
    description: 'Account-related operations and events',
    icon: 'User'
  },
  {
    id: 'queue',
    name: 'Queue Logs',
    description: 'Queue processing and job logs',
    icon: 'ListOrdered'
  },
  {
    id: 'bull',
    name: 'Bull Logs',
    description: 'Bull queue system logs',
    icon: 'Database'
  }
];

export const CATEGORIES = [
  'email',
  'general',
  'locking',
  'contact',
  'job',
  'queue'
] as const;

export const TIME_RANGE_OPTIONS = [
  { label: 'Last 30 minutes', value: '30min', minutes: 30 },
  { label: 'Last 1 hour', value: '1hour', minutes: 60 },
  { label: 'Last 3 hours', value: '3hours', minutes: 180 },
  { label: 'Last 8 hours', value: '8hours', minutes: 480 },
  { label: 'Last 16 hours', value: '16hours', minutes: 960 },
  { label: 'Last 24 hours', value: '1day', minutes: 1440 },
  { label: 'Last 2 days', value: '2days', minutes: 2880 },
  { label: 'Last 3 days', value: '3days', minutes: 4320 },
  { label: 'Last 7 days', value: '7days', minutes: 10080 }
];

export const LOG_TYPES = [
  'error',
  'warning',
  'info',
  'contact',
  'email',
  'queue',
  'job',
  'system'
] as const;