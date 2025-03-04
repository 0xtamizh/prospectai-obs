import { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorLogs } from '../src/lib/redis-client';

export const config = {
  runtime: 'nodejs18',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logs = await getErrorLogs();
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching Redis logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Redis logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}