import { getSupabaseAdmin } from './supabaseAdmin.js';
import { getLiveDashboardReport } from './dashboardService.js';
import { getAuth } from './googleAuth.js';

// Default static fallback clients with client-specific identifiers
let MEMORY_CLIENTS = [
  { id: 'fire-master-id', name: 'Fire-Master', website_url: 'https://firemastersafety.com/', domain: 'firemastersafety.com', status: true },
  { id: 'clg-laundry-id', name: 'clg laundry', website_url: 'https://clglaundry.com/', domain: 'clglaundry.com', status: true },
  { id: 'iynix-id', name: 'Iynix', website_url: 'https://iynixdigital.com/', domain: 'iynixdigital.com', status: true },
  { id: 'copper-fox-id', name: 'Copper Fox', website_url: 'https://copperfox.com/', domain: 'copperfox.com', status: true },
  { id: 'appliance-care-id', name: 'Appliance Care', website_url: 'https://appliancecareservice.com/', domain: 'appliancecareservice.com', status: true },
  { id: 'phd-id', name: 'PHD', website_url: 'https://phdservices.com/', domain: 'phdservices.com', status: true },
  { id: 'tri-state-id', name: 'Tri State', website_url: 'https://tristateservices.com/', domain: 'tristateservices.com', status: true },
  { id: 'plumb-hero-id', name: 'The plumb hero', website_url: 'https://theplumbhero.com/', domain: 'theplumbhero.com', status: true },
  { id: 'boulder-client-id', name: 'Boulder Decisions', website_url: 'https://boulderdecisions.com/', domain: 'boulderdecisions.com', status: true },
  { id: 'cmed-id', name: 'cmed', website_url: 'https://consciousmed.com/', domain: 'consciousmed.com', status: true },
  { id: 'cmed-regen-id', name: 'cmed regen', website_url: 'https://cmedregen.com/', domain: 'cmedregen.com', status: true },
  { id: 'besowell-id', name: 'Besowell', website_url: 'https://besowell.com/', domain: 'besowell.com', status: true },
  { id: 'kc-construction-id', name: 'KC Construction', website_url: 'https://kcconstruction.com/', domain: 'kcconstruction.com', status: true },
];

let MEMORY_PROPERTIES = [
  {
    id: 'prop-boulder-ga4',
    client_id: 'boulder-client-id',
    property_type: 'GA4',
    property_id: process.env.GA4_PROPERTY_ID || '516707960',
    property_name: 'Boulder Decisions GA4 (516707960)',
    is_active: true,
  },
  {
    id: 'prop-boulder-gsc',
    client_id: 'boulder-client-id',
    property_type: 'GSC',
    property_id: process.env.GSC_SITE_URL || 'https://boulderdecisions.com/',
    property_name: 'Boulder Decisions GSC (https://boulderdecisions.com/)',
    is_active: true,
  },
];

let MEMORY_BRAND_TERMS = {
  'fire-master-id': ['fire master', 'fire-master', 'firemaster', 'fire master safety'],
  'clg-laundry-id': ['clg laundry', 'clg', 'clglaundry'],
  'iynix-id': ['iynix', 'iynix digital', 'iynixdigital'],
  'copper-fox-id': ['copper fox', 'copperfox'],
  'appliance-care-id': ['appliance care', 'appliancecare', 'appliance care service'],
  'phd-id': ['phd', 'phd services', 'phd commercial'],
  'tri-state-id': ['tri state', 'tristate', 'tri-state services'],
  'plumb-hero-id': ['the plumb hero', 'plumb hero', 'plumbhero'],
  'boulder-client-id': ['boulder decisions', 'boulder decision', 'boulderdecision', 'boulderdecisions'],
  'cmed-id': ['cmed', 'conscious medicine', 'consciousmed'],
  'cmed-regen-id': ['cmed regen', 'cmed regenerative', 'cmedregen'],
  'besowell-id': ['besowell', 'be so well', 'besowell wellness'],
  'kc-construction-id': ['kc construction', 'kcconstruction', 'kc general contractor'],
};

let MEMORY_KEYWORDS = {
  'fire-master-id': [
    { id: 'fm-1', client_id: 'fire-master-id', keyword: 'commercial fire sprinkler inspection', keyword_type: 'non_branded', target_url: 'https://firemastersafety.com/sprinklers', target_position: 2 },
    { id: 'fm-2', client_id: 'fire-master-id', keyword: 'fire master safety systems', keyword_type: 'branded', target_url: 'https://firemastersafety.com/', target_position: 1 },
    { id: 'fm-3', client_id: 'fire-master-id', keyword: 'emergency fire extinguisher certification', keyword_type: 'non_branded', target_url: 'https://firemastersafety.com/extinguishers', target_position: 4 },
  ],
  'clg-laundry-id': [
    { id: 'clg-1', client_id: 'clg-laundry-id', keyword: 'commercial laundry services atlanta', keyword_type: 'non_branded', target_url: 'https://clglaundry.com/commercial', target_position: 3 },
    { id: 'clg-2', client_id: 'clg-laundry-id', keyword: 'clg laundry pick up delivery', keyword_type: 'branded', target_url: 'https://clglaundry.com/', target_position: 1 },
    { id: 'clg-3', client_id: 'clg-laundry-id', keyword: 'linen hotel laundry outsourcing', keyword_type: 'non_branded', target_url: 'https://clglaundry.com/services', target_position: 2 },
  ],
  'iynix-id': [
    { id: 'ix-1', client_id: 'iynix-id', keyword: 'b2b saas seo agency', keyword_type: 'non_branded', target_url: 'https://iynixdigital.com/saas-seo', target_position: 3 },
    { id: 'ix-2', client_id: 'iynix-id', keyword: 'iynix digital marketing', keyword_type: 'branded', target_url: 'https://iynixdigital.com/', target_position: 1 },
    { id: 'ix-3', client_id: 'iynix-id', keyword: 'enterprise organic search growth', keyword_type: 'non_branded', target_url: 'https://iynixdigital.com/organic-growth', target_position: 5 },
  ],
  'copper-fox-id': [
    { id: 'cf-1', client_id: 'copper-fox-id', keyword: 'boutique interior design studio', keyword_type: 'non_branded', target_url: 'https://copperfox.com/interiors', target_position: 3 },
    { id: 'cf-2', client_id: 'copper-fox-id', keyword: 'copper fox design', keyword_type: 'branded', target_url: 'https://copperfox.com/', target_position: 1 },
    { id: 'cf-3', client_id: 'copper-fox-id', keyword: 'luxury home architectural styling', keyword_type: 'non_branded', target_url: 'https://copperfox.com/portfolio', target_position: 4 },
  ],
  'appliance-care-id': [
    { id: 'ac-1', client_id: 'appliance-care-id', keyword: 'refrigerator repair service atlanta', keyword_type: 'non_branded', target_url: 'https://appliancecareservice.com/refrigerators', target_position: 2 },
    { id: 'ac-2', client_id: 'appliance-care-id', keyword: 'appliance care same day', keyword_type: 'branded', target_url: 'https://appliancecareservice.com/', target_position: 1 },
    { id: 'ac-3', client_id: 'appliance-care-id', keyword: 'emergency oven stove technician', keyword_type: 'non_branded', target_url: 'https://appliancecareservice.com/ovens', target_position: 3 },
  ],
  'phd-id': [
    { id: 'phd-1', client_id: 'phd-id', keyword: 'commercial building sanitation service', keyword_type: 'non_branded', target_url: 'https://phdservices.com/sanitation', target_position: 2 },
    { id: 'phd-2', client_id: 'phd-id', keyword: 'phd commercial facility care', keyword_type: 'branded', target_url: 'https://phdservices.com/', target_position: 1 },
    { id: 'phd-3', client_id: 'phd-id', keyword: 'industrial warehouse cleaning contractor', keyword_type: 'non_branded', target_url: 'https://phdservices.com/industrial', target_position: 4 },
  ],
  'tri-state-id': [
    { id: 'ts-1', client_id: 'tri-state-id', keyword: 'tri state mechanical services', keyword_type: 'branded', target_url: 'https://tristateservices.com/', target_position: 1 },
    { id: 'ts-2', client_id: 'tri-state-id', keyword: 'commercial hvac rooftop installation', keyword_type: 'non_branded', target_url: 'https://tristateservices.com/hvac', target_position: 3 },
    { id: 'ts-3', client_id: 'tri-state-id', keyword: 'industrial ventilation repair emergency', keyword_type: 'non_branded', target_url: 'https://tristateservices.com/ventilation', target_position: 2 },
  ],
  'plumb-hero-id': [
    { id: 'ph-1', client_id: 'plumb-hero-id', keyword: 'emergency plumber near me', keyword_type: 'non_branded', target_url: 'https://theplumbhero.com/emergency', target_position: 1 },
    { id: 'ph-2', client_id: 'plumb-hero-id', keyword: 'the plumb hero', keyword_type: 'branded', target_url: 'https://theplumbhero.com/', target_position: 1 },
    { id: 'ph-3', client_id: 'plumb-hero-id', keyword: 'clogged drain cleaning service', keyword_type: 'non_branded', target_url: 'https://theplumbhero.com/drain-cleaning', target_position: 2 },
  ],
  'boulder-client-id': [
    { id: 'bk-1', client_id: 'boulder-client-id', keyword: 'ux ui optimization atlanta', keyword_type: 'non_branded', target_url: 'https://boulderdecisions.com/services', target_position: 3 },
    { id: 'bk-2', client_id: 'boulder-client-id', keyword: 'ai consultants atlanta', keyword_type: 'non_branded', target_url: 'https://boulderdecisions.com/ai', target_position: 4 },
    { id: 'bk-3', client_id: 'boulder-client-id', keyword: 'boulder decisions consulting', keyword_type: 'branded', target_url: 'https://boulderdecisions.com/', target_position: 1 },
  ],
  'cmed-id': [
    { id: 'cm-1', client_id: 'cmed-id', keyword: 'functional medicine clinic atlanta', keyword_type: 'non_branded', target_url: 'https://consciousmed.com/functional-medicine', target_position: 2 },
    { id: 'cm-2', client_id: 'cmed-id', keyword: 'cmed integrative doctor', keyword_type: 'branded', target_url: 'https://consciousmed.com/', target_position: 1 },
    { id: 'cm-3', client_id: 'cmed-id', keyword: 'holistic gut health specialist', keyword_type: 'non_branded', target_url: 'https://consciousmed.com/gut-health', target_position: 3 },
  ],
  'cmed-regen-id': [
    { id: 'cr-1', client_id: 'cmed-regen-id', keyword: 'regenerative joint therapy clinic', keyword_type: 'non_branded', target_url: 'https://cmedregen.com/joint-therapy', target_position: 2 },
    { id: 'cr-2', client_id: 'cmed-regen-id', keyword: 'cmed regen therapies', keyword_type: 'branded', target_url: 'https://cmedregen.com/', target_position: 1 },
    { id: 'cr-3', client_id: 'cmed-regen-id', keyword: 'stem cell prp injections knee', keyword_type: 'non_branded', target_url: 'https://cmedregen.com/prp', target_position: 3 },
  ],
  'besowell-id': [
    { id: 'bw-1', client_id: 'besowell-id', keyword: 'wellness retreat georgia', keyword_type: 'non_branded', target_url: 'https://besowell.com/retreats', target_position: 3 },
    { id: 'bw-2', client_id: 'besowell-id', keyword: 'besowell mindfulness', keyword_type: 'branded', target_url: 'https://besowell.com/', target_position: 1 },
    { id: 'bw-3', client_id: 'besowell-id', keyword: 'holistic stress reduction', keyword_type: 'non_branded', target_url: 'https://besowell.com/coaching', target_position: 6 },
  ],
  'kc-construction-id': [
    { id: 'kc-1', client_id: 'kc-construction-id', keyword: 'commercial general contractor atlanta', keyword_type: 'non_branded', target_url: 'https://kcconstruction.com/commercial', target_position: 3 },
    { id: 'kc-2', client_id: 'kc-construction-id', keyword: 'kc construction building', keyword_type: 'branded', target_url: 'https://kcconstruction.com/', target_position: 1 },
    { id: 'kc-3', client_id: 'kc-construction-id', keyword: 'tenant build out interior contractor', keyword_type: 'non_branded', target_url: 'https://kcconstruction.com/tenant-buildout', target_position: 2 },
  ],
};

let MEMORY_ACTIVITIES = {
  'fire-master-id': [
    { id: 'act-fm1', client_id: 'fire-master-id', activity_title: 'Commercial fire compliance checklist landing page optimization', activity_type: 'On-Page SEO', activity_date: '2026-10-24', status: 'Completed' },
  ],
  'clg-laundry-id': [
    { id: 'act-clg1', client_id: 'clg-laundry-id', activity_title: 'Commercial laundry service schema and local directory expansion', activity_type: 'Local SEO', activity_date: '2026-10-20', status: 'Completed' },
  ],
  'iynix-id': [
    { id: 'act-ix1', client_id: 'iynix-id', activity_title: 'Published SaaS SEO case study and technical migration breakdown', activity_type: 'Content & Blog', activity_date: '2026-10-25', status: 'Completed' },
  ],
  'copper-fox-id': [
    { id: 'act-cf1', client_id: 'copper-fox-id', activity_title: 'Portfolio image alt text and core web vitals optimization', activity_type: 'Technical SEO', activity_date: '2026-10-22', status: 'Completed' },
  ],
  'appliance-care-id': [
    { id: 'act-ac1', client_id: 'appliance-care-id', activity_title: 'Created localized suburban emergency repair service area pages', activity_type: 'Local SEO', activity_date: '2026-10-23', status: 'Completed' },
  ],
  'phd-id': [
    { id: 'act-phd1', client_id: 'phd-id', activity_title: 'Commercial sanitation case study publication and link outreach', activity_type: 'Link Building', activity_date: '2026-10-21', status: 'Completed' },
  ],
  'tri-state-id': [
    { id: 'act-ts1', client_id: 'tri-state-id', activity_title: 'HVAC repair map pack and GMB category audit', activity_type: 'Local SEO', activity_date: '2026-10-23', status: 'Completed' },
  ],
  'plumb-hero-id': [
    { id: 'act-ph1', client_id: 'plumb-hero-id', activity_title: 'Implemented LocalBusiness & EmergencyService structured JSON-LD data', activity_type: 'Technical SEO', activity_date: '2026-10-25', status: 'Completed' },
  ],
  'boulder-client-id': [
    { id: 'act-b1', client_id: 'boulder-client-id', activity_title: 'Search Console property indexation and crawl audit', activity_type: 'Technical SEO', activity_date: '2026-10-21', status: 'Completed' },
  ],
  'cmed-id': [
    { id: 'act-cm1', client_id: 'cmed-id', activity_title: 'Published comprehensive guide on functional medicine vs conventional care', activity_type: 'Content & Blog', activity_date: '2026-10-22', status: 'Completed' },
  ],
  'cmed-regen-id': [
    { id: 'act-cr1', client_id: 'cmed-regen-id', activity_title: 'Stem cell therapy and regenerative treatment landing page rollout', activity_type: 'On-Page SEO', activity_date: '2026-10-24', status: 'Completed' },
  ],
  'besowell-id': [
    { id: 'act-bw1', client_id: 'besowell-id', activity_title: 'Mindfulness retreat schema markup implementation', activity_type: 'Technical SEO', activity_date: '2026-10-20', status: 'Completed' },
  ],
  'kc-construction-id': [
    { id: 'act-kc1', client_id: 'kc-construction-id', activity_title: 'Commercial general contracting project gallery and schema update', activity_type: 'On-Page SEO', activity_date: '2026-10-26', status: 'Completed' },
  ],
};

let MEMORY_BACKLINKS = {
  'fire-master-id': [
    { id: 'bl-fm1', client_id: 'fire-master-id', source_url: 'https://yellowpages.com/business/fire-master', target_url: 'https://firemastersafety.com/', domain_name: 'yellowpages.com', anchor_text: 'Fire Master Safety', link_type: 'Business Listing', status: 'Live / Indexed' },
  ],
  'iynix-id': [
    { id: 'bl-ix1', client_id: 'iynix-id', source_url: 'https://clutch.co/profile/iynix-digital', target_url: 'https://iynixdigital.com/', domain_name: 'clutch.co', anchor_text: 'Iynix Digital SEO', link_type: 'Directory', status: 'Live / Indexed' },
  ],
  'plumb-hero-id': [
    { id: 'bl-ph1', client_id: 'plumb-hero-id', source_url: 'https://yelp.com/biz/the-plumb-hero', target_url: 'https://theplumbhero.com/', domain_name: 'yelp.com', anchor_text: 'The Plumb Hero Plumbers', link_type: 'Business Listing', status: 'Live / Indexed' },
  ],
  'boulder-client-id': [
    { id: 'bl-b1', client_id: 'boulder-client-id', source_url: 'https://clutch.co/profile/boulder-decision', target_url: 'https://boulderdecisions.com/', domain_name: 'clutch.co', anchor_text: 'Boulder Decisions Analytics', link_type: 'Directory', status: 'Live / Indexed' },
  ],
  'kc-construction-id': [
    { id: 'bl-kc1', client_id: 'kc-construction-id', source_url: 'https://thebluebook.com/kc-construction', target_url: 'https://kcconstruction.com/', domain_name: 'thebluebook.com', anchor_text: 'KC Construction Commercial', link_type: 'Directory', status: 'Live / Indexed' },
  ],
};

/**
 * 1. Fetch all clients
 */
export const getAllClients = async () => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', true)
        .order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('getAllClients Supabase query failed, falling back to memory:', e.message);
    }
  }
  return MEMORY_CLIENTS.filter((c) => c.status !== false);
};

/**
 * 2. Fetch single client by ID or slug/name
 */
export const getClientById = async (clientId) => {
  if (!clientId) return null;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`id.eq.${clientId},name.ilike.%${clientId}%,domain.ilike.%${clientId}%`)
        .limit(1)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn('getClientById query failed:', e.message);
    }
  }
  return MEMORY_CLIENTS.find((c) => c.id === clientId || c.name.toLowerCase() === clientId.toLowerCase()) || MEMORY_CLIENTS[0];
};

/**
 * Create a new client
 */
export const createClientRecord = async ({ name, website_url, domain }) => {
  const cleanDomain = domain || (website_url ? website_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '');
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ name, website_url, domain: cleanDomain, status: true }])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('createClientRecord Supabase failed:', e.message);
    }
  }
  const newClient = {
    id: `client-${Date.now()}`,
    name,
    website_url,
    domain: cleanDomain,
    status: true,
  };
  MEMORY_CLIENTS.push(newClient);
  return newClient;
};

/**
 * Update an existing client
 */
export const updateClientRecord = async (clientId, updates) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('updateClientRecord Supabase failed:', e.message);
    }
  }
  const idx = MEMORY_CLIENTS.findIndex((c) => c.id === clientId);
  if (idx !== -1) {
    MEMORY_CLIENTS[idx] = { ...MEMORY_CLIENTS[idx], ...updates };
    return MEMORY_CLIENTS[idx];
  }
  return null;
};

/**
 * Delete / deactivate a client
 */
export const deleteClientRecord = async (clientId) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: false, updated_at: new Date().toISOString() })
        .eq('id', clientId);
      if (!error) return true;
    } catch (e) {
      console.warn('deleteClientRecord Supabase failed:', e.message);
    }
  }
  const idx = MEMORY_CLIENTS.findIndex((c) => c.id === clientId);
  if (idx !== -1) {
    MEMORY_CLIENTS[idx].status = false;
    return true;
  }
  return false;
};

/**
 * 3. Fetch mapped Google properties for a client
 */
export const getClientGoogleProperties = async (clientId) => {
  if (!clientId) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('client_google_properties')
        .select(`
          id,
          property_type,
          property_id,
          property_name,
          is_active,
          google_connection_id,
          google_connections (
            id,
            google_email,
            status
          )
        `)
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('getClientGoogleProperties error:', e.message);
    }
  }
  return MEMORY_PROPERTIES.filter((p) => p.client_id === clientId && p.is_active);
};

/**
 * Map a Google property to a client
 */
export const mapGooglePropertyToClient = async ({ clientId, property_type, property_id, property_name, google_connection_id }) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('client_google_properties')
        .upsert(
          [
            {
              client_id: clientId,
              google_connection_id: google_connection_id || null,
              property_type,
              property_id,
              property_name: property_name || property_id,
              is_active: true,
            },
          ],
          { onConflict: 'client_id, property_type, property_id' }
        )
        .select();
      if (!error && data && data[0]) return data[0];
    } catch (e) {
      console.warn('mapGooglePropertyToClient Supabase error:', e.message);
    }
  }
  const existingIdx = MEMORY_PROPERTIES.findIndex(
    (p) => p.client_id === clientId && p.property_type === property_type && p.property_id === property_id
  );
  const record = {
    id: `prop-${Date.now()}`,
    client_id: clientId,
    property_type,
    property_id,
    property_name: property_name || property_id,
    is_active: true,
    google_connection_id,
  };
  if (existingIdx !== -1) {
    MEMORY_PROPERTIES[existingIdx] = record;
  } else {
    MEMORY_PROPERTIES.push(record);
  }
  return record;
};

/**
 * Remove / Unmap a property
 */
export const unmapClientGoogleProperty = async (clientId, propertyId) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('client_google_properties')
        .delete()
        .eq('client_id', clientId)
        .eq('property_id', propertyId);
      if (!error) return true;
    } catch (e) {
      console.warn('unmapClientGoogleProperty Supabase error:', e.message);
    }
  }
  MEMORY_PROPERTIES = MEMORY_PROPERTIES.filter(
    (p) => !(p.client_id === clientId && p.property_id === propertyId)
  );
  return true;
};

/**
 * Fetch Google accounts / connections
 */
export const getStoredGoogleConnections = async () => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('google_connections')
        .select('id, google_user_id, google_email, scopes, status, connected_at, created_at')
        .order('connected_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('getStoredGoogleConnections error:', e.message);
    }
  }
  return [];
};

/**
 * 4. Fetch Client Keywords
 */
export const getClientKeywords = async (clientId) => {
  if (!clientId) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('client_keywords')
        .select('*')
        .eq('client_id', clientId)
        .order('target_position', { ascending: true, nullsFirst: false });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('getClientKeywords error:', e.message);
    }
  }
  return MEMORY_KEYWORDS[clientId] || [];
};

/**
 * 5. Fetch Client Brand Terms
 */
export const getClientBrandTerms = async (clientId) => {
  if (!clientId) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('client_brand_terms')
        .select('*')
        .eq('client_id', clientId);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('getClientBrandTerms error:', e.message);
    }
  }
  const terms = MEMORY_BRAND_TERMS[clientId] || [];
  return terms.map((t, idx) => ({ id: `bt-${idx}`, client_id: clientId, term: t, match_type: 'contains' }));
};

/**
 * 6. Fetch SEO Activities
 */
export const getClientSeoActivities = async (clientId) => {
  if (!clientId) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('seo_activities')
        .select('*')
        .eq('client_id', clientId)
        .order('activity_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('getClientSeoActivities error:', e.message);
    }
  }
  return MEMORY_ACTIVITIES[clientId] || [];
};

/**
 * 7. Fetch Backlinks
 */
export const getClientBacklinks = async (clientId) => {
  if (!clientId) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('backlinks')
        .select('*')
        .eq('client_id', clientId)
        .order('acquired_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('getClientBacklinks error:', e.message);
    }
  }
  return MEMORY_BACKLINKS[clientId] || [];
};

/**
 * 8. Fetch Off-Page Activities
 */
export const getClientOffPageActivities = async (clientId) => {
  if (!clientId) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('off_page_activities')
        .select('*')
        .eq('client_id', clientId)
        .order('activity_date', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('getClientOffPageActivities error:', e.message);
    }
  }
  return [];
};

/**
 * 9. Unified Client Dashboard Aggregator:
 * Retrieves client info, properties, GA4/GSC reporting metrics, keywords, brand terms, activities & backlinks.
 * Endpoint: GET /api/clients/:clientId/dashboard
 */
export const getUnifiedClientDashboard = async (clientId, {
  req,
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  periodLabel,
  previousPeriodLabel,
  forceRefresh = false,
}) => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error(`Client not found for ID: ${clientId}`);
  }

  // Fetch properties mapped to this client from database / memory
  const properties = await getClientGoogleProperties(client.id);
  const ga4Mapping = properties.find((p) => p.property_type === 'GA4');
  const gscMapping = properties.find((p) => p.property_type === 'GSC');

  const isBoulder = client.name.toLowerCase().includes('boulder');
  const ga4PropertyId = ga4Mapping?.property_id || (isBoulder ? (process.env.GA4_PROPERTY_ID || '516707960') : null);
  let gscSiteUrl = gscMapping?.property_id || (isBoulder ? (process.env.GSC_SITE_URL || 'https://boulderdecisions.com/') : null);
  if (isBoulder && gscSiteUrl && (gscSiteUrl.includes('boulderdecision') || gscSiteUrl.startsWith('sc-domain:'))) {
    gscSiteUrl = 'https://boulderdecisions.com/';
  }

  // Fetch brand terms for this client
  const brandRows = await getClientBrandTerms(client.id);
  const brandTerms = brandRows.map((b) => b.term.toLowerCase());

  // Fetch sub-items in parallel
  const [
    keywords,
    seoActivities,
    backlinks,
    offPageActivities,
    liveReport,
  ] = await Promise.all([
    getClientKeywords(client.id),
    getClientSeoActivities(client.id),
    getClientBacklinks(client.id),
    getClientOffPageActivities(client.id),
    getLiveDashboardReport({
      req,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      propertyId: ga4PropertyId,
      siteUrl: gscSiteUrl,
      clientName: client.name,
      brandTerms: brandTerms.length > 0 ? brandTerms : undefined,
      periodLabel,
      previousPeriodLabel,
      forceRefresh,
      isExplicitClientQuery: true,
    }),
  ]);

  // Format activities into structure expected by dashboard
  const formattedSeoActivities = {
    onsiteBlogPosts: seoActivities
      .filter((a) => (a.activity_type || '').toLowerCase().includes('content') || (a.activity_type || '').toLowerCase().includes('onsite') || (a.activity_type || '').toLowerCase().includes('page'))
      .map((a) => a.target_url || a.targetUrl || a.activity_title || a.title || ''),
    offsiteBlogPosts: seoActivities
      .filter((a) => (a.activity_type || '').toLowerCase().includes('guest') || (a.activity_type || '').toLowerCase().includes('offsite'))
      .map((a) => a.target_url || a.targetUrl || a.activity_title || a.title || ''),
    offPageActivities: (offPageActivities.length > 0 ? offPageActivities : seoActivities.filter((a) => (a.activity_type || '').toLowerCase().includes('listing') || (a.activity_type || '').toLowerCase().includes('submission'))).map((a) => ({
      id: a.id,
      title: a.activity_title || a.title || '',
      category: a.activity_type || a.category || 'Off-Page SEO',
      status: a.status || 'Completed',
      priority: a.priority || 'Medium',
      date: a.activity_date || a.date || '',
      targetUrl: a.target_url || a.targetUrl || '',
      notes: a.notes || '',
    })),
    allActivities: seoActivities.map((a) => ({
      id: a.id,
      title: a.activity_title || a.title || '',
      category: a.activity_type || a.category || 'General SEO',
      status: a.status || 'Completed',
      priority: a.priority || 'Medium',
      date: a.activity_date || a.date || '',
      targetUrl: a.target_url || a.targetUrl || '',
      notes: a.notes || '',
    })),
    note: `Tracking active for ${client.name}`,
  };

  const formattedBacklinks = {
    provider: 'Supabase Multi-Client Backlinks',
    configured: true,
    items: backlinks.map((b) => ({
      id: b.id,
      sourceUrl: b.source_url || b.sourceUrl || '',
      targetUrl: b.target_url || b.targetUrl || '',
      anchorText: b.anchor_text || b.anchorText || '',
      category: b.category || b.link_type || 'Guest Post',
      da: b.da !== undefined && b.da !== null ? b.da : (b.domain_authority ?? null),
      status: b.status || 'Live / Indexed',
      date: b.date || b.acquired_date || '',
      notes: b.notes || '',
    })),
    metrics: {
      totalBacklinks: backlinks.length,
      referringDomains: new Set(backlinks.map((b) => b.domain_name || b.source_url || b.sourceUrl)).size,
      liveLinks: backlinks.filter((b) => (b.status || '').toLowerCase().includes('live')).length,
    },
  };

  // Build unified payload containing both standard report structure and multi-client metadata
  return {
    ...liveReport,
    id: `unified-${client.id}-${startDate}-${endDate}`,
    client: client.name,
    clientId: client.id,
    websiteUrl: client.website_url,
    domain: client.domain,
    success: true,
    mappings: {
      ga4: ga4Mapping || { property_id: ga4PropertyId, property_name: `${client.name} GA4`, is_active: Boolean(ga4PropertyId) },
      gsc: gscMapping || { property_id: gscSiteUrl, property_name: `${client.name} GSC`, is_active: Boolean(gscSiteUrl) },
      all: properties,
    },
    clientKeywords: keywords,
    clientBrandTerms: brandTerms,
    seoActivities: formattedSeoActivities,
    backlinks: formattedBacklinks,
    offPageActivities,
  };
};
