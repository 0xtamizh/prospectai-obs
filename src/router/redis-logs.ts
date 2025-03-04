import { Router, RequestHandler, Request, Response } from 'express';
import { Redis } from 'ioredis';
import { REDIS_CONFIG } from '../config/redis.config';
import rateLimit from 'express-rate-limit';

const router = Router();

const API_KEY = '0fa971b59edcf5d6505b6460e2f918cd4ba31303f4b4ae4add6237e7be17a48a';

// Auth middleware
router.use(((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }
  next();
}) as RequestHandler);

const createRedisClient = () => new Redis(REDIS_CONFIG);

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests - please try again later' }
});

// Changed from POST to GET
router.get('/fetch', apiLimiter, async (req: Request, res: Response) => {
  const keyPattern = req.query.keyPattern as string;
  
  if (!keyPattern) {
    res.status(400).json({ error: 'Key pattern is required' });
    return;
  }

  const client = createRedisClient();
  
  try {
    const keys = await client.keys(keyPattern);
    
    // Process each key to handle both string and hash values
    const values = await Promise.all(
      keys.map(async (key) => {
        // First try to get as string
        let value = await client.get(key);
        
        // If no string value found, try as hash
        if (!value) {
          const hashValue = await client.hgetall(key);
          // Only use hash value if it's not empty
          if (Object.keys(hashValue).length > 0) {
            value = hashValue;
          }
        }

        // Try to parse string values as JSON
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If parsing fails, keep original string value
            console.warn(`Failed to parse JSON for key ${key}:`, e);
          }
        }

        return {
          key,
          value,
          type: typeof value === 'string' ? 'string' : 'hash'
        };
      })
    );

    // Filter out any null/undefined values
    const filteredValues = values.filter(v => v.value !== null && v.value !== undefined);

    res.json({ 
      keys, 
      values: filteredValues,
      metadata: {
        pattern: keyPattern,
        totalKeys: keys.length,
        matchedValues: filteredValues.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching Redis data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.quit().catch(console.error);
  }
});

export default router;