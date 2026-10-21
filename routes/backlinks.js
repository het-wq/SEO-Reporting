import express from 'express';
import { getBacklinksOverview } from '../services/backlinksService.js';

const router = express.Router();

const handleOverview = async (req, res) => {
  try {
    const q = req.method === 'POST' ? req.body : req.query;
    const targetDomain = q.targetDomain || process.env.TARGET_DOMAIN || 'boulderdecisions.com';
    const data = await getBacklinksOverview({ targetDomain });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/overview', handleOverview);
router.post('/overview', handleOverview);

export default router;
