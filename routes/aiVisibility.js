import express from 'express';
import { getAiVisibilityOverview } from '../services/aiVisibilityService.js';

const router = express.Router();

const handleOverview = async (req, res) => {
  try {
    const q = req.method === 'POST' ? req.body : req.query;
    const brandName = q.brandName || 'Appliance Care of Atlanta';
    const data = await getAiVisibilityOverview({ brandName });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/overview', handleOverview);
router.post('/overview', handleOverview);

export default router;
