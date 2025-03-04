import Redis from 'ioredis';

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

export const handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  let redis;
  try {
    redis = new Redis(REDIS_CONFIG);

    // Fetch error logs
    const [errorLogs, errorsLogs] = await Promise.all([
      redis.keys('error:*'),
      redis.keys('errors:*')
    ]);
    
    const allLogs = [];
    
    // Helper function to process logs
    const processLogs = async (keys, type) => {
      const logPromises = keys.map(async (key) => {
        const value = await redis.get(key);
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            return {
              id: key,
              timestamp: new Date().toISOString(),
              level: 'error',
              message: typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue),
              metadata: typeof parsedValue === 'object' ? parsedValue : undefined,
              category: key.split(':')[1],
              type
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

    // Process both types of logs concurrently
    const [processedErrorLogs, processedErrorsLogs] = await Promise.all([
      processLogs(errorLogs, 'error'),
      processLogs(errorsLogs, 'errors')
    ]);

    allLogs.push(...processedErrorLogs, ...processedErrorsLogs);

    // Sort logs by timestamp in descending order
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ logs: allLogs })
    };
  } catch (error) {
    console.error('Error fetching Redis logs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch Redis logs',
        details: error.message
      })
    };
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
  }
};