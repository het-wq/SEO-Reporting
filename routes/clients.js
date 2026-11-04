import express from 'express';
import {
  getAllClients,
  getClientById,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  getClientGoogleProperties,
  mapGooglePropertyToClient,
  unmapClientGoogleProperty,
  getStoredGoogleConnections,
  getClientKeywords,
  getClientBrandTerms,
  getClientSeoActivities,
  getClientBacklinks,
  getClientOffPageActivities,
  getUnifiedClientDashboard,
} from '../services/clientDataService.js';
import { getSupabaseAdmin } from '../services/supabaseAdmin.js';

const router = express.Router();

/**
 * GET /api/clients - List all clients
 */
router.get('/', async (req, res) => {
  try {
    const clients = await getAllClients();
    res.json({ success: true, clients });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list clients' });
  }
});

/**
 * GET /api/clients/connections/all - List stored Google connections
 */
router.get('/connections/all', async (req, res) => {
  try {
    const connections = await getStoredGoogleConnections();
    res.json({ success: true, connections });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch Google connections' });
  }
});

/**
 * POST /api/clients - Create a new client
 */
router.post('/', async (req, res) => {
  try {
    const { name, website_url, domain } = req.body;
    if (!name) return res.status(400).json({ error: 'Client name is required' });

    const client = await createClientRecord({ name, website_url, domain });
    res.status(201).json({ success: true, client });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create client' });
  }
});

/**
 * PUT /api/clients/:clientId - Update client details
 */
router.put('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, website_url, domain, status } = req.body;
    const updated = await updateClientRecord(clientId, { name, website_url, domain, status });
    if (!updated) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, client: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update client' });
  }
});

/**
 * DELETE /api/clients/:clientId - Deactivate client
 */
router.delete('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const ok = await deleteClientRecord(clientId);
    res.json({ success: ok, message: 'Client deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete client' });
  }
});

/**
 * GET /api/clients/:clientId/dashboard - Unified dashboard data for client
 */
router.get('/:clientId/dashboard', async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      startDate = '2026-10-01',
      endDate = '2026-10-28',
      prevStartDate,
      prevEndDate,
      periodLabel,
      previousPeriodLabel,
      forceRefresh,
    } = req.query;

    const dashboard = await getUnifiedClientDashboard(clientId, {
      req,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      periodLabel,
      previousPeriodLabel,
      forceRefresh: forceRefresh === 'true' || forceRefresh === true,
    });

    res.json(dashboard);
  } catch (err) {
    console.error('Unified client dashboard error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch client dashboard' });
  }
});

/**
 * GET /api/clients/:clientId/properties - Mapped GA4 / GSC properties
 */
router.get('/:clientId/properties', async (req, res) => {
  try {
    const { clientId } = req.params;
    const properties = await getClientGoogleProperties(clientId);
    res.json({ success: true, properties });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch properties' });
  }
});

/**
 * POST /api/clients/:clientId/properties - Map a Google property to client
 */
router.post('/:clientId/properties', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { google_connection_id, property_type, property_id, property_name } = req.body;

    if (!property_type || !property_id) {
      return res.status(400).json({ error: 'property_type and property_id are required' });
    }

    const mapped = await mapGooglePropertyToClient({
      clientId,
      property_type,
      property_id,
      property_name,
      google_connection_id,
    });

    res.json({ success: true, property: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to map property' });
  }
});

/**
 * DELETE /api/clients/:clientId/properties/:propertyId - Unmap property
 */
router.delete('/:clientId/properties/:propertyId', async (req, res) => {
  try {
    const { clientId, propertyId } = req.params;
    const ok = await unmapClientGoogleProperty(clientId, propertyId);
    res.json({ success: ok, message: 'Property unmapped successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to unmap property' });
  }
});

/**
 * GET & POST /api/clients/:clientId/keywords
 */
router.get('/:clientId/keywords', async (req, res) => {
  try {
    const keywords = await getClientKeywords(req.params.clientId);
    res.json({ success: true, keywords });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch keywords' });
  }
});

router.post('/:clientId/keywords', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { keyword, keyword_type = 'non_branded', target_url, target_position, target_location } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('client_keywords')
        .insert([{ client_id: clientId, keyword, keyword_type, target_url, target_position, target_location }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, keyword: data });
    }

    res.status(201).json({ success: true, keyword: { id: `k-${Date.now()}`, client_id: clientId, keyword, keyword_type } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to add keyword' });
  }
});

/**
 * GET & POST /api/clients/:clientId/brand-terms
 */
router.get('/:clientId/brand-terms', async (req, res) => {
  try {
    const brandTerms = await getClientBrandTerms(req.params.clientId);
    res.json({ success: true, brandTerms });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch brand terms' });
  }
});

router.post('/:clientId/brand-terms', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { terms = [] } = req.body;
    const supabase = getSupabaseAdmin();

    if (supabase && Array.isArray(terms)) {
      // Clear existing terms and insert new set
      await supabase.from('client_brand_terms').delete().eq('client_id', clientId);
      if (terms.length > 0) {
        const rows = terms.map((t) => ({ client_id: clientId, term: t.trim().toLowerCase(), match_type: 'contains' }));
        const { data, error } = await supabase.from('client_brand_terms').insert(rows).select();
        if (error) throw error;
        return res.json({ success: true, brandTerms: data });
      }
    }

    res.json({ success: true, terms });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save brand terms' });
  }
});

/**
 * GET & POST /api/clients/:clientId/seo-activities
 */
router.get('/:clientId/seo-activities', async (req, res) => {
  try {
    const activities = await getClientSeoActivities(req.params.clientId);
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch SEO activities' });
  }
});

router.post('/:clientId/seo-activities', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { activity_title, activity_description, activity_type, activity_date, status = 'Planned' } = req.body;
    if (!activity_title) return res.status(400).json({ error: 'activity_title is required' });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('seo_activities')
        .insert([{ client_id: clientId, activity_title, activity_description, activity_type, activity_date, status }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, activity: data });
    }

    res.status(201).json({ success: true, activity: { id: `act-${Date.now()}`, client_id: clientId, activity_title, status } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save activity' });
  }
});

/**
 * GET & POST /api/clients/:clientId/backlinks
 */
router.get('/:clientId/backlinks', async (req, res) => {
  try {
    const backlinks = await getClientBacklinks(req.params.clientId);
    res.json({ success: true, backlinks });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch backlinks' });
  }
});

router.post('/:clientId/backlinks', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { source_url, target_url, domain_name, anchor_text, link_type, status = 'Live / Indexed' } = req.body;
    if (!source_url || !target_url) return res.status(400).json({ error: 'source_url and target_url are required' });

    const cleanDomain = domain_name || source_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('backlinks')
        .insert([{ client_id: clientId, source_url, target_url, domain_name: cleanDomain, anchor_text, link_type, status }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, backlink: data });
    }

    res.status(201).json({ success: true, backlink: { id: `bl-${Date.now()}`, client_id: clientId, source_url, target_url, status } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save backlink' });
  }
});

/**
 * GET /api/clients/:clientId/off-page-activities
 */
router.get('/:clientId/off-page-activities', async (req, res) => {
  try {
    const offPageActivities = await getClientOffPageActivities(req.params.clientId);
    res.json({ success: true, offPageActivities });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch off-page activities' });
  }
});

export default router;
