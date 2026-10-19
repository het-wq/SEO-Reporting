import express from 'express';
import { getLocalSeoOverview } from '../services/localSeoService.js';

const router = express.Router();

const handleOverview = async (req, res) => {
  try {
    const data = await getLocalSeoOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/overview', handleOverview);
router.post('/overview', handleOverview);

export default router;
