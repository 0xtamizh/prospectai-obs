import { RedisLog, RedisLogStats, RedisLogFilters } from '../types/redis';

class RedisLogsCacheManager {
  private static instance: RedisLogsCacheManager;
  private cache: {
    logs: RedisLog[];
    stats: RedisLogStats | null;
    lastFetchTime: Date | null;
    isFetching: boolean;
    isInitialized: boolean;
  } = {
    logs: [],
    stats: null,
    lastFetchTime: null,
    isFetching: false,
    isInitialized: false
  };

  private readonly CACHE_DURATION = 1000 * 60 * 60 * 2; // 2 hours
  private readonly API_URL = import.meta.env.VITE_REDIS_API_URL;
  private readonly API_KEY = import.meta.env.VITE_REDIS_API_KEY;
  private initializationPromise: Promise<void> | null = null;
  private refreshTimeout: number | null = null;

  private constructor() {
    const savedCache = localStorage.getItem('redisLogsCache');
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        if (parsed.lastFetchTime) {
          parsed.lastFetchTime = new Date(parsed.lastFetchTime);
        }
        this.cache = { ...parsed, isFetching: false, isInitialized: false };
        
        // Schedule refresh if cache is old
        if (this.cache.lastFetchTime) {
          const timeSinceLastFetch = Date.now() - this.cache.lastFetchTime.getTime();
          if (timeSinceLastFetch < this.CACHE_DURATION) {
            this.scheduleRefresh(this.CACHE_DURATION - timeSinceLastFetch);
          } else {
            this.scheduleRefresh(0);
          }
        }
      } catch (error) {
        console.error('Error loading cache from localStorage:', error);
      }
    }
  }

  private scheduleRefresh(delay: number) {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshTimeout = window.setTimeout(() => {
      this.fetchLogs('error', true).catch(console.error);
      this.scheduleRefresh(this.CACHE_DURATION);
    }, delay);
  }

  public static getInstance(): RedisLogsCacheManager {
    if (!RedisLogsCacheManager.instance) {
      RedisLogsCacheManager.instance = new RedisLogsCacheManager();
    }
    return RedisLogsCacheManager.instance;
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('redisLogsCache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache.lastFetchTime) return false;
    const now = new Date();
    return now.getTime() - this.cache.lastFetchTime.getTime() < this.CACHE_DURATION;
  }

  public async initialize(): Promise<void> {
    if (this.cache.isInitialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeInternal();
    }

    return this.initializationPromise;
  }

  private async initializeInternal(): Promise<void> {
    if (!this.isCacheValid() && !this.cache.isFetching) {
      try {
        await this.fetchLogs('error', true);
      } catch (error) {
        console.error('Error initializing cache:', error);
      }
    }
    this.cache.isInitialized = true;
  }

  public isInitialized(): boolean {
    return this.cache.isInitialized;
  }

  public hasCachedData(): boolean {
    return this.cache.logs.length > 0;
  }

  public async fetchLogs(folder: string, forceRefresh: boolean = false): Promise<{ logs: RedisLog[]; stats: RedisLogStats }> {
    if (this.isCacheValid() && !forceRefresh) {
      return {
        logs: this.cache.logs,
        stats: this.cache.stats!
      };
    }

    if (this.cache.isFetching) {
      return {
        logs: this.cache.logs,
        stats: this.cache.stats!
      };
    }

    this.cache.isFetching = true;

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({ folder })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      const allLogs = this.transformData(data.data || {}, folder);
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this.cache = {
        ...this.cache,
        logs: allLogs,
        stats: this.calculateStats(allLogs),
        lastFetchTime: new Date(),
        isFetching: false
      };

      this.saveToLocalStorage();
      this.scheduleRefresh(this.CACHE_DURATION);

      return {
        logs: allLogs,
        stats: this.cache.stats!
      };
    } catch (error) {
      console.error('Error fetching Redis logs:', error);
      this.cache.isFetching = false;
      
      if (this.cache.logs.length > 0) {
        return {
          logs: this.cache.logs,
          stats: this.cache.stats!
        };
      }
      
      throw error;
    }
  }

  public getFilteredLogs(filters: RedisLogFilters = {}): { logs: RedisLog[]; stats: RedisLogStats } {
    let filteredLogs = [...this.cache.logs];

    if (filters.timeRange) {
      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= filters.timeRange!.start && logTime <= filters.timeRange!.end;
      });
    }

    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }

    return {
      logs: filteredLogs,
      stats: this.calculateStats(filteredLogs)
    };
  }

  private calculateStats(logs: RedisLog[]): RedisLogStats {
    const stats: RedisLogStats = {
      total: logs.length,
      byCategory: {},
      byType: {},
      byLevel: {},
      lastFetchTime: this.cache.lastFetchTime
    };

    logs.forEach(log => {
      if (log.category) {
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      }
      if (log.type) {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      }
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    return stats;
  }

  private transformData(data: any, folder: string): RedisLog[] {
    const transformedLogs: RedisLog[] = [];
    const uniqueMessages = new Set();
    
    const processData = (data: any, prefix: string = '') => {
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        const fullKey = prefix ? `${prefix}:${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          if ('message' in value || 'error' in value) {
            const logEntry = value as any;
            const message = logEntry.message || logEntry.error;
            
            if (!uniqueMessages.has(message)) {
              uniqueMessages.add(message);
              transformedLogs.push({
                id: fullKey,
                timestamp: logEntry.timestamp || new Date().toISOString(),
                level: 'error',
                message: message,
                metadata: {
                  ...logEntry,
                  queue: logEntry.queue,
                  category: logEntry.category,
                  type: logEntry.type,
                  stack: logEntry.stack,
                  interactionId: logEntry.interactionId
                },
                category: logEntry.category || folder,
                type: logEntry.type || 'error'
              });
            }
          } else {
            processData(value, fullKey);
          }
        }
      });
    };

    processData(data);
    return transformedLogs;
  }

  public clearCache(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.cache = {
      logs: [],
      stats: null,
      lastFetchTime: null,
      isFetching: false,
      isInitialized: false
    };
    this.initializationPromise = null;
    localStorage.removeItem('redisLogsCache');
  }
}

export const redisLogsCache = RedisLogsCacheManager.getInstance();