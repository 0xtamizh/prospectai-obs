import Redis from 'ioredis';

const REDIS_CONFIG = {
  host: import.meta.env.VITE_REDIS_HOST,
  port: parseInt(import.meta.env.VITE_REDIS_PORT || '11976'),
  password: import.meta.env.VITE_REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 1000, 15000);
    console.log(`Retrying Redis connection in ${delay}ms... (attempt ${times})`);
    return delay;
  },
};

class RedisClientManager {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisClientManager.instance) {
      RedisClientManager.instance = new Redis(REDIS_CONFIG);
      
      RedisClientManager.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });
    }
    return RedisClientManager.instance;
  }

  public static async cleanup(): Promise<void> {
    if (RedisClientManager.instance) {
      await RedisClientManager.instance.quit();
      RedisClientManager.instance = null;
    }
  }
}

export default RedisClientManager;