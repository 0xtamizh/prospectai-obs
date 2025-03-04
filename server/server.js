import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';

const app = express();
app.use(cors());
app.use(express.json());

const REDIS_CONFIG = {
  host: 'redis-11976.fcrce180.us-east-1-1.ec2.redns.redis-cloud.com',
  port: 11976,
  password: 'HEtexet6DvQSvOCXV0GiCfyXMa0hCLMe',
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 1000, 15000);
    console.log(`Retrying Redis connection in ${delay}ms... (attempt ${times})`);
    return delay;
  },
};

const redis = new Redis(REDIS_CONFIG);

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

app.get('/api/redis-logs', async (req, res) => {
  try {
    // Fetch error logs
    const errorLogs = await redis.keys('error:*');
    const errorsLogs = await redis.keys('errors:*');
    
    const allLogs = [];
    
    // Process error logs
    for (const key of errorLogs) {
      const value = await redis.get(key);
      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          allLogs.push({
            id: key,
            timestamp: new Date().toISOString(),
            level: 'error',
            message: typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue),
            metadata: typeof parsedValue === 'object' ? parsedValue : undefined,
            category: key.split(':')[1],
            type: 'error'
          });
        } catch (e) {
          console.error('Error parsing Redis log:', e);
        }
      }
    }

    // Process errors logs
    for (const key of errorsLogs) {
      const value = await redis.get(key);
      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          allLogs.push({
            id: key,
            timestamp: new Date().toISOString(),
            level: 'error',
            message: typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue),
            metadata: typeof parsedValue === 'object' ? parsedValue : undefined,
            category: key.split(':')[1],
            type: 'errors'
          });
        } catch (e) {
          console.error('Error parsing Redis log:', e);
        }
      }
    }

    // Sort logs by timestamp in descending order
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ logs: allLogs });
  } catch (error) {
    console.error('Error fetching Redis logs:', error);
    res.status(500).json({ error: 'Failed to fetch Redis logs' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});