import Redis from 'ioredis';

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'redis-11976.fcrce180.us-east-1-1.ec2.redns.redis-cloud.com',
  port: parseInt(process.env.REDIS_PORT || '11976'),
  password: process.env.REDIS_PASSWORD || 'HEtexet6DvQSvOCXV0GiCfyXMa0hCLMe',
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false // Required for Railway Redis
  },
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 1000, 15000);
    console.log(`Retrying Redis connection in ${delay}ms... (attempt ${times})`);
    return delay;
  },
};

let redis: Redis | null = null;

// Only create Redis instance on the server side
if (typeof window === 'undefined') {
  redis = new Redis(REDIS_CONFIG);

  redis.on('error', (error: Error) => {
    console.error('Redis connection error:', error);
  });

  redis.on('connect', () => {
    console.log('Successfully connected to Redis');
  });
}

export interface LogEntry {
  timestamp: string | number;
  type: string;
  name: string;
  executionId?: string;
  error?: {
    message: string;
    stack?: string;
  };
  details?: any;
  metrics?: {
    size?: string;
    duration?: string;
    count?: number;
  };
}

export async function getErrorLogs(): Promise<LogEntry[]> {
  if (!redis) {
    throw new Error('Redis client not initialized');
  }

  try {
    const [errorLogs, errorsLogs] = await Promise.all([
      redis.keys('error:*'),
      redis.keys('errors:*')
    ]);
    
    const allLogs: LogEntry[] = [];
    
    // Helper function to process logs
    const processLogs = async (keys: string[], type: string) => {
      const logPromises = keys.map(async (key) => {
        const value = await redis?.get(key);
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            const keyParts = key.split(':');
            return {
              id: key,
              timestamp: keyParts[1] ? parseInt(keyParts[1]) : Date.now(),
              type: keyParts[2] || type,
              name: parsedValue.name || type,
              level: 'error',
              message: typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue),
              metadata: typeof parsedValue === 'object' ? parsedValue : undefined,
              category: keyParts[2] || undefined,
              executionId: keyParts[3] || undefined
            };
          } catch (e) {
            console.error('Error parsing Redis log:', e);
            return null;
          }
        }
        return null;
      });

      const logs = await Promise.all(logPromises);
      return logs.filter(Boolean);
    };

    const [processedErrorLogs, processedErrorsLogs] = await Promise.all([
      processLogs(errorLogs, 'error'),
      processLogs(errorsLogs, 'errors')
    ]);

    allLogs.push(...processedErrorLogs, ...processedErrorsLogs);

    // Sort logs by timestamp in descending order
    allLogs.sort((a, b) => {
      const aTime = typeof a.timestamp === 'string' ? parseInt(a.timestamp) : a.timestamp;
      const bTime = typeof b.timestamp === 'string' ? parseInt(b.timestamp) : b.timestamp;
      return bTime - aTime;
    });

    return allLogs;
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    throw error;
  }
}

export default redis;