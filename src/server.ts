import express from 'express';
import cors from 'cors';
import { getErrorLogs } from './lib/redis-client';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/redis-logs', async (req, res) => {
  try {
    const logs = await getErrorLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching Redis logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Redis logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});