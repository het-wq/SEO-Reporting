import express from 'express';
import { getAllIntegrationsStatus, testIntegration } from '../services/integrationsService.js';
import { clearStoredTokens, saveStoredTokens } from '../services/googleAuth.js';

const router = express.Router();

// GET /api/integrations/status
router.get('/status', async (req, res) => {
  try {
    const status = await getAllIntegrationsStatus(req);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/test
router.post('/test', async (req, res) => {
  const { providerId } = req.body;
  if (!providerId) {
    return res.status(400).json({ error: 'providerId is required (e.g. ga4, gsc, localSeo, backlinks, aiVisibility)' });
  }

  try {
    const result = await testIntegration(providerId, req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/disconnect
router.post('/disconnect', (req, res) => {
  try {
    clearStoredTokens();
    res.json({ success: true, message: 'Google authentication disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
