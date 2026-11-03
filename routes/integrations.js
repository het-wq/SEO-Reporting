import express from 'express';
import { getAllIntegrationsStatus, testIntegration, getGoogleAccounts } from '../services/integrationsService.js';
import { clearStoredTokens, saveStoredTokens, clearAuthCookie } from '../services/googleAuth.js';
import { getAccountKeywords, saveAccountKeywords } from '../data/accountKeywordsStore.js';

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

// GET /api/integrations/google-accounts
router.get('/google-accounts', async (req, res) => {
  try {
    const data = await getGoogleAccounts(req);
    res.json(data);
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

// GET /api/integrations/account-keywords
router.get('/account-keywords', async (req, res) => {
  try {
    const { accountId, propertyId, siteUrl, accountName } = req.query;
    const data = await getAccountKeywords({ accountId, propertyId, siteUrl, accountName });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/integrations/account-keywords
router.post('/account-keywords', async (req, res) => {
  try {
    const {
      accountId,
      accountName,
      propertyName,
      ga4PropertyId,
      gscSiteUrl,
      brandKeywords,
      nonBrandKeywords,
    } = req.body;

    const saved = await saveAccountKeywords({
      accountId,
      accountName,
      propertyName,
      ga4PropertyId,
      gscSiteUrl,
      brandKeywords,
      nonBrandKeywords,
    });

    res.json({ success: true, saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/integrations/disconnect
router.post('/disconnect', (req, res) => {
  try {
    clearStoredTokens();
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
    res.setHeader('Set-Cookie', clearAuthCookie(proto === 'https'));
    res.json({ success: true, message: 'Google authentication disconnected and cookies cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
