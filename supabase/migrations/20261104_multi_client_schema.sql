-- =============================================================================
-- MULTI-CLIENT SEO REPORTING DASHBOARD - COMPLETE SUPABASE SCHEMA & SEED DATA
-- Project: Bclderdecisions (qtmoxaxonpimodwpemiy)
-- 11 Tables: clients, google_connections, client_google_properties,
--            client_keywords, client_brand_terms, gsc_daily_metrics,
--            ga4_daily_metrics, seo_activities, backlinks,
--            off_page_activities, client_members
-- (Run this entire script in Supabase SQL Editor)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 0. CLEAN DROP OF OLD / INCONSISTENT TABLES (Clears legacy column conflicts)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.backlink_activities CASCADE;
DROP TABLE IF EXISTS public.brand_keywords CASCADE;
DROP TABLE IF EXISTS public.non_brand_keywords CASCADE;
DROP TABLE IF EXISTS public.seo_activities CASCADE;
DROP TABLE IF EXISTS public.backlinks CASCADE;
DROP TABLE IF EXISTS public.off_page_activities CASCADE;
DROP TABLE IF EXISTS public.client_brand_terms CASCADE;
DROP TABLE IF EXISTS public.gsc_daily_metrics CASCADE;
DROP TABLE IF EXISTS public.ga4_daily_metrics CASCADE;
DROP TABLE IF EXISTS public.client_google_properties CASCADE;
DROP TABLE IF EXISTS public.client_members CASCADE;
DROP TABLE IF EXISTS public.google_connections CASCADE;
DROP TABLE IF EXISTS public.client_keywords CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;

-- -----------------------------------------------------------------------------
-- 1. CLIENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  domain TEXT,
  status BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. GOOGLE CONNECTIONS TABLE (Encrypted Refresh Tokens, Multi-Account Support)
-- -----------------------------------------------------------------------------
CREATE TABLE public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_user_id TEXT,
  google_email TEXT NOT NULL UNIQUE,
  refresh_token_encrypted TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  status BOOLEAN DEFAULT true NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. CLIENT GOOGLE PROPERTIES (Key Mapping Table)
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_google_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  google_connection_id UUID REFERENCES public.google_connections(id) ON DELETE SET NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('GA4', 'GSC', 'GBP', 'ADS')),
  property_id TEXT NOT NULL,
  property_name TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_client_property UNIQUE (client_id, property_type, property_id)
);

-- -----------------------------------------------------------------------------
-- 4. CLIENT KEYWORDS (Rank Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'non_branded' CHECK (keyword_type IN ('branded', 'non_branded')),
  target_url TEXT,
  target_location TEXT,
  target_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  current_position INTEGER,
  previous_position INTEGER,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. CLIENT BRAND TERMS (Branded Query Filtering Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_brand_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  match_type TEXT DEFAULT 'contains',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_client_brand_term UNIQUE (client_id, term)
);

-- -----------------------------------------------------------------------------
-- 6. GSC DAILY METRICS (Stored Reporting Data)
-- -----------------------------------------------------------------------------
CREATE TABLE public.gsc_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  date DATE NOT NULL,
  query TEXT NOT NULL,
  page TEXT NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  impressions INTEGER DEFAULT 0 NOT NULL,
  ctr NUMERIC DEFAULT 0 NOT NULL,
  position NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_gsc_metric_row UNIQUE (client_id, property_id, date, query, page)
);

-- -----------------------------------------------------------------------------
-- 7. GA4 DAILY METRICS (Stored Reporting Data)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ga4_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0 NOT NULL,
  total_users INTEGER DEFAULT 0 NOT NULL,
  new_users INTEGER DEFAULT 0 NOT NULL,
  conversions NUMERIC DEFAULT 0 NOT NULL,
  organic_sessions INTEGER DEFAULT 0 NOT NULL,
  engagement_rate NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_ga4_metric_row UNIQUE (client_id, property_id, date)
);

-- -----------------------------------------------------------------------------
-- 8. SEO ACTIVITIES (On-page, Technical, Content, Link Building tasks)
-- -----------------------------------------------------------------------------
CREATE TABLE public.seo_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_title TEXT NOT NULL,
  title TEXT,
  activity_description TEXT,
  activity_type TEXT NOT NULL,
  category TEXT,
  activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT DEFAULT 'Planned' NOT NULL,
  priority TEXT DEFAULT 'Medium',
  target_url TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 9. BACKLINKS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  domain_name TEXT,
  anchor_text TEXT,
  link_type TEXT,
  category TEXT,
  domain_authority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Live / Indexed' NOT NULL,
  acquired_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 10. OFF-PAGE ACTIVITIES TABLE (Submissions, Citations, Bookmarking)
-- -----------------------------------------------------------------------------
CREATE TABLE public.off_page_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  activity_description TEXT,
  activity_type TEXT NOT NULL,
  activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT DEFAULT 'Completed' NOT NULL,
  reference_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 11. CLIENT MEMBERS TABLE (Multi-User Access Control)
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer' NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_client_member UNIQUE (client_id, user_id)
);

-- -----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_cgp_client_id ON public.client_google_properties(client_id);
CREATE INDEX idx_cgp_conn_id ON public.client_google_properties(google_connection_id);
CREATE INDEX idx_ck_client_id ON public.client_keywords(client_id);
CREATE INDEX idx_cbt_client_id ON public.client_brand_terms(client_id);
CREATE INDEX idx_gsc_daily_client_date ON public.gsc_daily_metrics(client_id, date);
CREATE INDEX idx_ga4_daily_client_date ON public.ga4_daily_metrics(client_id, date);
CREATE INDEX idx_seo_act_client_id ON public.seo_activities(client_id);
CREATE INDEX idx_bl_client_id ON public.backlinks(client_id);
CREATE INDEX idx_opa_client_id ON public.off_page_activities(client_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_google_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_brand_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.off_page_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for google_connections" ON public.google_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for client_google_properties" ON public.client_google_properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for client_keywords" ON public.client_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for client_brand_terms" ON public.client_brand_terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for gsc_daily_metrics" ON public.gsc_daily_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ga4_daily_metrics" ON public.ga4_daily_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for seo_activities" ON public.seo_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for backlinks" ON public.backlinks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for off_page_activities" ON public.off_page_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for client_members" ON public.client_members FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SEED INITIAL 13 CLIENTS & PROPERTY MAPPINGS
-- =============================================================================
INSERT INTO public.clients (name, website_url, domain, status) VALUES
  ('Fire-Master', 'https://firemastersafety.com/', 'firemastersafety.com', true),
  ('clg laundry', 'https://clglaundry.com/', 'clglaundry.com', true),
  ('Iynix', 'https://iynixdigital.com/', 'iynixdigital.com', true),
  ('Copper Fox', 'https://copperfox.com/', 'copperfox.com', true),
  ('Appliance Care', 'https://appliancecareservice.com/', 'appliancecareservice.com', true),
  ('PHD', 'https://phdservices.com/', 'phdservices.com', true),
  ('Tri State', 'https://tristateservices.com/', 'tristateservices.com', true),
  ('The plumb hero', 'https://theplumbhero.com/', 'theplumbhero.com', true),
  ('Boulder Decisions', 'https://boulderdecisions.com/', 'boulderdecisions.com', true),
  ('cmed', 'https://consciousmed.com/', 'consciousmed.com', true),
  ('cmed regen', 'https://cmedregen.com/', 'cmedregen.com', true),
  ('Besowell', 'https://besowell.com/', 'besowell.com', true),
  ('KC Construction', 'https://kcconstruction.com/', 'kcconstruction.com', true);

-- -----------------------------------------------------------------------------
-- SEED CLIENT GOOGLE PROPERTIES
-- -----------------------------------------------------------------------------
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '516707960', 'Boulder Decisions GA4 (516707960)', true FROM public.clients WHERE name = 'Boulder Decisions';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'https://boulderdecisions.com/', 'boulderdecisions.com (URL)', true FROM public.clients WHERE name = 'Boulder Decisions';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098114', 'Fire-Master GA4', true FROM public.clients WHERE name = 'Fire-Master';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:firemastersafety.com', 'firemastersafety.com (Domain)', true FROM public.clients WHERE name = 'Fire-Master';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098115', 'Appliance Care GA4', true FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:appliancecareservice.com', 'appliancecareservice.com (Domain)', true FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098116', 'Iynix GA4', true FROM public.clients WHERE name = 'Iynix';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:iynixdigital.com', 'iynixdigital.com (Domain)', true FROM public.clients WHERE name = 'Iynix';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098117', 'The plumb hero GA4', true FROM public.clients WHERE name = 'The plumb hero';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:theplumbhero.com', 'theplumbhero.com (Domain)', true FROM public.clients WHERE name = 'The plumb hero';

-- -----------------------------------------------------------------------------
-- SEED CLIENT BRAND TERMS
-- -----------------------------------------------------------------------------
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'fire master', 'contains' FROM public.clients WHERE name = 'Fire-Master';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'fire-master', 'contains' FROM public.clients WHERE name = 'Fire-Master';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'clg laundry', 'contains' FROM public.clients WHERE name = 'clg laundry';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'clg', 'contains' FROM public.clients WHERE name = 'clg laundry';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'iynix', 'contains' FROM public.clients WHERE name = 'Iynix';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'iynix digital', 'contains' FROM public.clients WHERE name = 'Iynix';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'copper fox', 'contains' FROM public.clients WHERE name = 'Copper Fox';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'copperfox', 'contains' FROM public.clients WHERE name = 'Copper Fox';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'appliance care', 'contains' FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'appliancecare', 'contains' FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'phd', 'contains' FROM public.clients WHERE name = 'PHD';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'phd services', 'contains' FROM public.clients WHERE name = 'PHD';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'tri state', 'contains' FROM public.clients WHERE name = 'Tri State';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'tristate', 'contains' FROM public.clients WHERE name = 'Tri State';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'the plumb hero', 'contains' FROM public.clients WHERE name = 'The plumb hero';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'plumb hero', 'contains' FROM public.clients WHERE name = 'The plumb hero';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'boulder decisions', 'contains' FROM public.clients WHERE name = 'Boulder Decisions';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'boulder decision', 'contains' FROM public.clients WHERE name = 'Boulder Decisions';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'cmed', 'contains' FROM public.clients WHERE name = 'cmed';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'conscious medicine', 'contains' FROM public.clients WHERE name = 'cmed';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'cmed regen', 'contains' FROM public.clients WHERE name = 'cmed regen';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'cmed regenerative', 'contains' FROM public.clients WHERE name = 'cmed regen';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'besowell', 'contains' FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'be so well', 'contains' FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'kc construction', 'contains' FROM public.clients WHERE name = 'KC Construction';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'kcconstruction', 'contains' FROM public.clients WHERE name = 'KC Construction';

-- -----------------------------------------------------------------------------
-- SEED CLIENT KEYWORDS
-- -----------------------------------------------------------------------------
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'commercial fire sprinkler inspection', 'non_branded', 'https://firemastersafety.com/sprinklers', 2, 2, 3900, 'active' FROM public.clients WHERE name = 'Fire-Master';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'fire master safety systems', 'branded', 'https://firemastersafety.com/', 1, 1, 540, 'active' FROM public.clients WHERE name = 'Fire-Master';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'commercial laundry services atlanta', 'non_branded', 'https://clglaundry.com/commercial', 3, 3, 2400, 'active' FROM public.clients WHERE name = 'clg laundry';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'clg laundry pick up delivery', 'branded', 'https://clglaundry.com/', 1, 1, 620, 'active' FROM public.clients WHERE name = 'clg laundry';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'b2b saas seo agency', 'non_branded', 'https://iynixdigital.com/saas-seo', 3, 3, 4800, 'active' FROM public.clients WHERE name = 'Iynix';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'iynix digital marketing', 'branded', 'https://iynixdigital.com/', 1, 1, 720, 'active' FROM public.clients WHERE name = 'Iynix';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'boutique interior design studio', 'non_branded', 'https://copperfox.com/interiors', 3, 3, 3100, 'active' FROM public.clients WHERE name = 'Copper Fox';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'copper fox design', 'branded', 'https://copperfox.com/', 1, 1, 480, 'active' FROM public.clients WHERE name = 'Copper Fox';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'refrigerator repair service atlanta', 'non_branded', 'https://appliancecareservice.com/refrigerators', 2, 2, 6200, 'active' FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'appliance care same day', 'branded', 'https://appliancecareservice.com/', 1, 1, 1100, 'active' FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'commercial building sanitation service', 'non_branded', 'https://phdservices.com/sanitation', 2, 2, 2900, 'active' FROM public.clients WHERE name = 'PHD';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'phd commercial facility care', 'branded', 'https://phdservices.com/', 1, 1, 510, 'active' FROM public.clients WHERE name = 'PHD';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'commercial hvac rooftop installation', 'non_branded', 'https://tristateservices.com/hvac', 3, 3, 4400, 'active' FROM public.clients WHERE name = 'Tri State';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'tri state mechanical services', 'branded', 'https://tristateservices.com/', 1, 1, 880, 'active' FROM public.clients WHERE name = 'Tri State';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'emergency plumber near me', 'non_branded', 'https://theplumbhero.com/emergency', 1, 1, 14200, 'active' FROM public.clients WHERE name = 'The plumb hero';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'the plumb hero', 'branded', 'https://theplumbhero.com/', 1, 1, 890, 'active' FROM public.clients WHERE name = 'The plumb hero';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'ux ui optimization atlanta', 'non_branded', 'https://boulderdecisions.com/services', 3, 3, 2400, 'active' FROM public.clients WHERE name = 'Boulder Decisions';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'boulder decisions consulting', 'branded', 'https://boulderdecisions.com/', 1, 1, 880, 'active' FROM public.clients WHERE name = 'Boulder Decisions';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'functional medicine clinic atlanta', 'non_branded', 'https://consciousmed.com/functional-medicine', 2, 2, 5400, 'active' FROM public.clients WHERE name = 'cmed';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'cmed integrative doctor', 'branded', 'https://consciousmed.com/', 1, 1, 720, 'active' FROM public.clients WHERE name = 'cmed';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'regenerative joint therapy clinic', 'non_branded', 'https://cmedregen.com/joint-therapy', 2, 2, 3800, 'active' FROM public.clients WHERE name = 'cmed regen';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'cmed regen therapies', 'branded', 'https://cmedregen.com/', 1, 1, 640, 'active' FROM public.clients WHERE name = 'cmed regen';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'wellness retreat georgia', 'non_branded', 'https://besowell.com/retreats', 3, 3, 3800, 'active' FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'besowell mindfulness', 'branded', 'https://besowell.com/', 1, 1, 950, 'active' FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'commercial general contractor atlanta', 'non_branded', 'https://kcconstruction.com/commercial', 3, 3, 5100, 'active' FROM public.clients WHERE name = 'KC Construction';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'kc construction building', 'branded', 'https://kcconstruction.com/', 1, 1, 820, 'active' FROM public.clients WHERE name = 'KC Construction';

-- -----------------------------------------------------------------------------
-- SEED SEO ACTIVITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Commercial fire compliance checklist landing page optimization', 'Commercial fire compliance checklist landing page optimization', 'On-page technical optimization', 'On-Page SEO', 'On-Page SEO', CURRENT_DATE - 10, 'Completed'
FROM public.clients WHERE name = 'Fire-Master';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Commercial laundry service schema and local directory expansion', 'Commercial laundry service schema and local directory expansion', 'Local SEO enhancement', 'Local SEO', 'Local SEO', CURRENT_DATE - 12, 'Completed'
FROM public.clients WHERE name = 'clg laundry';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Published SaaS SEO case study and technical migration breakdown', 'Published SaaS SEO case study and technical migration breakdown', 'Case study content creation', 'Content & Blog', 'Content & Blog', CURRENT_DATE - 8, 'Completed'
FROM public.clients WHERE name = 'Iynix';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Portfolio image alt text and core web vitals optimization', 'Portfolio image alt text and core web vitals optimization', 'Core web vitals green score', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 9, 'Completed'
FROM public.clients WHERE name = 'Copper Fox';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Created localized suburban emergency repair service area pages', 'Created localized suburban emergency repair service area pages', 'Local service area landing pages', 'Local SEO', 'Local SEO', CURRENT_DATE - 11, 'Completed'
FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Commercial sanitation case study publication and link outreach', 'Commercial sanitation case study publication and link outreach', 'High authority link outreach', 'Link Building', 'Link Building', CURRENT_DATE - 14, 'Completed'
FROM public.clients WHERE name = 'PHD';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'HVAC repair map pack and GMB category audit', 'HVAC repair map pack and GMB category audit', 'Google Business Profile audit', 'Local SEO', 'Local SEO', CURRENT_DATE - 7, 'Completed'
FROM public.clients WHERE name = 'Tri State';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Implemented LocalBusiness & EmergencyService structured JSON-LD data', 'Implemented LocalBusiness & EmergencyService structured JSON-LD data', 'Structured schema markup', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 5, 'Completed'
FROM public.clients WHERE name = 'The plumb hero';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Search Console property indexation and crawl audit', 'Search Console property indexation and crawl audit', 'Indexing health confirmed', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 14, 'Completed'
FROM public.clients WHERE name = 'Boulder Decisions';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Published comprehensive guide on functional medicine vs conventional care', 'Published comprehensive guide on functional medicine vs conventional care', 'Long form medical content', 'Content & Blog', 'Content & Blog', CURRENT_DATE - 13, 'Completed'
FROM public.clients WHERE name = 'cmed';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Stem cell therapy and regenerative treatment landing page rollout', 'Stem cell therapy and regenerative treatment landing page rollout', 'Service landing page launch', 'On-Page SEO', 'On-Page SEO', CURRENT_DATE - 6, 'Completed'
FROM public.clients WHERE name = 'cmed regen';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Mindfulness retreat schema markup implementation', 'Mindfulness retreat schema markup implementation', 'Event and retreat schema markup', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 15, 'Completed'
FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Commercial general contracting project gallery and schema update', 'Commercial general contracting project gallery and schema update', 'Visual project gallery and schema', 'On-Page SEO', 'On-Page SEO', CURRENT_DATE - 4, 'Completed'
FROM public.clients WHERE name = 'KC Construction';

-- -----------------------------------------------------------------------------
-- SEED BACKLINKS
-- -----------------------------------------------------------------------------
INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://yellowpages.com/business/fire-master', 'https://firemastersafety.com/', 'yellowpages.com', 'Fire Master Safety', 'Business Listing', 'Business Listing', 'Live / Indexed'
FROM public.clients WHERE name = 'Fire-Master';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://clutch.co/profile/iynix-digital', 'https://iynixdigital.com/', 'clutch.co', 'Iynix Digital SEO', 'Directory', 'Directory', 'Live / Indexed'
FROM public.clients WHERE name = 'Iynix';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://angis.com/companylist/appliance-care', 'https://appliancecareservice.com/', 'angis.com', 'Appliance Care Repair', 'Business Listing', 'Business Listing', 'Live / Indexed'
FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://yelp.com/biz/the-plumb-hero', 'https://theplumbhero.com/', 'yelp.com', 'The Plumb Hero Plumbers', 'Business Listing', 'Business Listing', 'Live / Indexed'
FROM public.clients WHERE name = 'The plumb hero';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://clutch.co/profile/boulder-decision', 'https://boulderdecisions.com/', 'clutch.co', 'Boulder Decisions Analytics', 'Directory', 'Directory', 'Live / Indexed'
FROM public.clients WHERE name = 'Boulder Decisions';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://healthgrades.com/group-directory/cmed', 'https://consciousmed.com/', 'healthgrades.com', 'cmed Functional Medicine', 'Medical Citation', 'Medical Citation', 'Live / Indexed'
FROM public.clients WHERE name = 'cmed';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://wellnessmama.com/reviews/besowell', 'https://besowell.com/', 'wellnessmama.com', 'BeSoWell adaptogens', 'Guest Post', 'Guest Post', 'Live / Indexed'
FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://thebluebook.com/kc-construction', 'https://kcconstruction.com/', 'thebluebook.com', 'KC Construction Commercial', 'Directory', 'Directory', 'Live / Indexed'
FROM public.clients WHERE name = 'KC Construction';

-- -----------------------------------------------------------------------------
-- SEED OFF-PAGE ACTIVITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Quora Decision Intelligence Thread', 'Answered enterprise BI framework question with methodology breakdown', 'Quora Submission', CURRENT_DATE - 8, 'Completed', 'https://quora.com/What-is-decision-intelligence'
FROM public.clients WHERE name = 'Boulder Decisions';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Reddit Functional Medicine Discussion', 'Contributed clinic methodology in patient autoimmune thread', 'Reddit Submission', CURRENT_DATE - 5, 'Completed', 'https://reddit.com/r/FunctionalMedicine/'
FROM public.clients WHERE name = 'cmed';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Pinterest Stress Relief Board', 'Created 15 infographic pins linking to adaptogen product page', 'Pinterest Submission', CURRENT_DATE - 11, 'Completed', 'https://pinterest.com/pin/besowell-routine/'
FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Slideshare Kitchen Suppression PDF', 'Uploaded commercial kitchen fire suppression compliance deck', 'PDF Submission', CURRENT_DATE - 6, 'Completed', 'https://slideshare.net/firemastersafety/guide'
FROM public.clients WHERE name = 'Fire-Master';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'YouTube Refrigerator Troubleshooting Video', 'Published DIY tutorial with technician dispatch link in description', 'YouTube Submission', CURRENT_DATE - 7, 'Completed', 'https://youtube.com/watch?v=appliance-care-diy'
FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'B2B SaaS Growth Quora Answer', 'Authored 1200 word SaaS inbound play on Quora', 'Quora Submission', CURRENT_DATE - 5, 'Completed', 'https://quora.com/How-do-SaaS-scale-SEO'
FROM public.clients WHERE name = 'Iynix';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Frozen Pipe Community Thread', 'Emergency plumbing advice post in local community forum', 'Forum Submission', CURRENT_DATE - 4, 'Completed', 'https://reddit.com/r/Plumbing/comments/frozen_pipe'
FROM public.clients WHERE name = 'The plumb hero';



