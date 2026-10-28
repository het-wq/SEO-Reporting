import express from 'express';
import { getLocalSeoOverview, listGbpLocations } from '../services/localSeoService.js';

const router = express.Router();

const handleOverview = async (req, res) => {
  try {
    const { startDate, endDate, prevStartDate, prevEndDate } = { ...(req.query || {}), ...(req.body || {}) };
    const data = await getLocalSeoOverview({
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      req,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/overview', handleOverview);
router.post('/overview', handleOverview);

router.get('/locations', async (req, res) => {
  try {
    const data = await listGbpLocations(req);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
