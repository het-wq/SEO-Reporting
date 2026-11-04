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
-- SEED INITIAL 7 CLIENTS & PROPERTY MAPPINGS
-- =============================================================================
INSERT INTO public.clients (name, website_url, domain, status) VALUES
  ('Boulder', 'https://boulderdecisions.com/', 'boulderdecisions.com', true),
  ('Conscious Medicine', 'https://consciousmed.com/', 'consciousmed.com', true),
  ('Besowell', 'https://besowell.com/', 'besowell.com', true),
  ('Fire Master', 'https://firemastersafety.com/', 'firemastersafety.com', true),
  ('Appliance Care', 'https://appliancecareservice.com/', 'appliancecareservice.com', true),
  ('Iynix Digital', 'https://iynixdigital.com/', 'iynixdigital.com', true),
  ('The Plumb Hero', 'https://theplumbhero.com/', 'theplumbhero.com', true);

-- -----------------------------------------------------------------------------
-- SEED CLIENT GOOGLE PROPERTIES
-- -----------------------------------------------------------------------------
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '516707960', 'Boulder Decision Web GA4', true FROM public.clients WHERE name = 'Boulder';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:boulderdecision.com', 'boulderdecision.com (Domain)', true FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098112', 'Conscious Medicine GA4', true FROM public.clients WHERE name = 'Conscious Medicine';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:consciousmed.com', 'consciousmed.com (Domain)', true FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098113', 'Besowell E-Commerce GA4', true FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:besowell.com', 'besowell.com (Domain)', true FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098114', 'Fire Master Commercial GA4', true FROM public.clients WHERE name = 'Fire Master';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:firemastersafety.com', 'firemastersafety.com (Domain)', true FROM public.clients WHERE name = 'Fire Master';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098115', 'Appliance Care GA4', true FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:appliancecareservice.com', 'appliancecareservice.com (Domain)', true FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098116', 'Iynix Digital GA4', true FROM public.clients WHERE name = 'Iynix Digital';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:iynixdigital.com', 'iynixdigital.com (Domain)', true FROM public.clients WHERE name = 'Iynix Digital';

INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GA4', '412098117', 'The Plumb Hero GA4', true FROM public.clients WHERE name = 'The Plumb Hero';
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT id, 'GSC', 'sc-domain:theplumbhero.com', 'theplumbhero.com (Domain)', true FROM public.clients WHERE name = 'The Plumb Hero';

-- -----------------------------------------------------------------------------
-- SEED CLIENT BRAND TERMS
-- -----------------------------------------------------------------------------
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'boulder decision', 'contains' FROM public.clients WHERE name = 'Boulder';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'boulder decisions', 'contains' FROM public.clients WHERE name = 'Boulder';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'boulderdecision', 'contains' FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'conscious medicine', 'contains' FROM public.clients WHERE name = 'Conscious Medicine';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'consciousmed', 'contains' FROM public.clients WHERE name = 'Conscious Medicine';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'dr conscious medicine', 'contains' FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'besowell', 'contains' FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'be so well', 'contains' FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'besowell wellness', 'contains' FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'fire master', 'contains' FROM public.clients WHERE name = 'Fire Master';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'firemaster', 'contains' FROM public.clients WHERE name = 'Fire Master';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'fire master safety', 'contains' FROM public.clients WHERE name = 'Fire Master';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'appliance care', 'contains' FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'appliancecare', 'contains' FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'appliance care service', 'contains' FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'iynix digital', 'contains' FROM public.clients WHERE name = 'Iynix Digital';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'iynix', 'contains' FROM public.clients WHERE name = 'Iynix Digital';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'iynixdigital', 'contains' FROM public.clients WHERE name = 'Iynix Digital';

INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'the plumb hero', 'contains' FROM public.clients WHERE name = 'The Plumb Hero';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'plumb hero', 'contains' FROM public.clients WHERE name = 'The Plumb Hero';
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT id, 'plumbhero', 'contains' FROM public.clients WHERE name = 'The Plumb Hero';

-- -----------------------------------------------------------------------------
-- SEED CLIENT KEYWORDS
-- -----------------------------------------------------------------------------
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'ux ui optimization atlanta', 'non_branded', 'https://boulderdecisions.com/services', 3, 3, 2400, 'active' FROM public.clients WHERE name = 'Boulder';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'ai consultants atlanta', 'non_branded', 'https://boulderdecisions.com/ai', 2, 2, 1900, 'active' FROM public.clients WHERE name = 'Boulder';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'boulder decision', 'branded', 'https://boulderdecisions.com/', 1, 1, 880, 'active' FROM public.clients WHERE name = 'Boulder';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'decision intelligence consulting', 'non_branded', 'https://boulderdecisions.com/services', 4, 4, 3200, 'active' FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'functional medicine clinic', 'non_branded', 'https://consciousmed.com/functional-medicine', 4, 4, 5400, 'active' FROM public.clients WHERE name = 'Conscious Medicine';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'integrative medicine doctor', 'non_branded', 'https://consciousmed.com/team', 3, 3, 4100, 'active' FROM public.clients WHERE name = 'Conscious Medicine';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'conscious medicine clinic', 'branded', 'https://consciousmed.com/', 1, 1, 720, 'active' FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'besowell wellness', 'branded', 'https://besowell.com/', 1, 1, 950, 'active' FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'adaptogen stress supplements', 'non_branded', 'https://besowell.com/shop/adaptogens', 5, 5, 6800, 'active' FROM public.clients WHERE name = 'Besowell';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'natural stress relief remedies', 'non_branded', 'https://besowell.com/blog/natural-stress-relief', 7, 7, 8200, 'active' FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'commercial fire suppression systems', 'non_branded', 'https://firemastersafety.com/commercial', 3, 3, 3900, 'active' FROM public.clients WHERE name = 'Fire Master';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'fire master safety', 'branded', 'https://firemastersafety.com/', 1, 1, 540, 'active' FROM public.clients WHERE name = 'Fire Master';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'fire extinguisher inspection near me', 'non_branded', 'https://firemastersafety.com/inspections', 2, 2, 7100, 'active' FROM public.clients WHERE name = 'Fire Master';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'appliance repair near me', 'non_branded', 'https://appliancecareservice.com/', 4, 4, 18500, 'active' FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'refrigerator repair service same day', 'non_branded', 'https://appliancecareservice.com/refrigerators', 2, 2, 6200, 'active' FROM public.clients WHERE name = 'Appliance Care';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'appliance care service', 'branded', 'https://appliancecareservice.com/', 1, 1, 1100, 'active' FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'digital marketing agency', 'non_branded', 'https://iynixdigital.com/', 5, 5, 22000, 'active' FROM public.clients WHERE name = 'Iynix Digital';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'b2b seo agency for saas', 'non_branded', 'https://iynixdigital.com/seo', 3, 3, 4800, 'active' FROM public.clients WHERE name = 'Iynix Digital';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'iynix digital agency', 'branded', 'https://iynixdigital.com/', 1, 1, 620, 'active' FROM public.clients WHERE name = 'Iynix Digital';

INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'emergency plumber near me', 'non_branded', 'https://theplumbhero.com/emergency', 3, 3, 14200, 'active' FROM public.clients WHERE name = 'The Plumb Hero';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'clogged drain cleaning service', 'non_branded', 'https://theplumbhero.com/drain-cleaning', 2, 2, 4600, 'active' FROM public.clients WHERE name = 'The Plumb Hero';
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, current_position, search_volume, status)
SELECT id, 'the plumb hero emergency plumbing', 'branded', 'https://theplumbhero.com/', 1, 1, 890, 'active' FROM public.clients WHERE name = 'The Plumb Hero';

-- -----------------------------------------------------------------------------
-- SEED SEO ACTIVITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Migrated Search Console and verified indexing', 'Migrated Search Console and verified indexing', 'Domain clean indexing confirmed', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 14, 'Completed'
FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Optimized title tags and meta descriptions', 'Optimized title tags and meta descriptions', 'Target keywords in metadata', 'On-Page SEO', 'On-Page SEO', CURRENT_DATE - 10, 'Completed'
FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Implemented MedicalClinic schema markup', 'Implemented MedicalClinic schema markup', 'Doctors schema and accreditations verified', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 12, 'Completed'
FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Optimized Google Business Profile for clinic', 'Optimized Google Business Profile for clinic', 'Photos clinic hours and booking CTA updated', 'Local SEO', 'Local SEO', CURRENT_DATE - 1, 'In Progress'
FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Implemented Product rich snippets on shop', 'Implemented Product rich snippets on shop', 'Price and stock badges on search results', 'On-Page SEO', 'On-Page SEO', CURRENT_DATE - 9, 'Completed'
FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Created 8 service area landing pages', 'Created 8 service area landing pages', 'Rankings improved across neighboring counties', 'Local SEO', 'Local SEO', CURRENT_DATE - 16, 'Completed'
FROM public.clients WHERE name = 'Fire Master';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Optimized mobile page speed score to 94', 'Optimized mobile page speed score to 94', 'Core Web Vitals green on all templates', 'Technical SEO', 'Technical SEO', CURRENT_DATE - 11, 'Completed'
FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Published SaaS case studies with ROI metrics', 'Published SaaS case studies with ROI metrics', 'Showcased organic traffic growth for tech clients', 'Content & Blog', 'Content & Blog', CURRENT_DATE - 13, 'Completed'
FROM public.clients WHERE name = 'Iynix Digital';

INSERT INTO public.seo_activities (client_id, activity_title, title, activity_description, activity_type, category, activity_date, status)
SELECT id, 'Optimized Google Map Pack with 42 reviews', 'Optimized Google Map Pack with 42 reviews', 'Ranked top in map pack for emergency plumbing', 'Local SEO', 'Local SEO', CURRENT_DATE - 15, 'Completed'
FROM public.clients WHERE name = 'The Plumb Hero';

-- -----------------------------------------------------------------------------
-- SEED BACKLINKS
-- -----------------------------------------------------------------------------
INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://clutch.co/profile/boulder-decision', 'https://boulderdecisions.com/', 'clutch.co', 'Boulder Decision Analytics', 'Directory', 'Directory', 'Live / Indexed'
FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://www.healthgrades.com/group-directory/conscious-medicine', 'https://consciousmed.com/', 'healthgrades.com', 'Conscious Medicine Clinic', 'Medical Citation', 'Medical Citation', 'Live / Indexed'
FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://wellnessmama.com/reviews/besowell-adaptogen-blend/', 'https://besowell.com/', 'wellnessmama.com', 'BeSoWell adaptogen supplements', 'Guest Post', 'Guest Post', 'Live / Indexed'
FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://www.yellowpages.com/business/fire-master', 'https://firemastersafety.com/', 'yellowpages.com', 'Fire Master Protection Services', 'Business Listing', 'Business Listing', 'Live / Indexed'
FROM public.clients WHERE name = 'Fire Master';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://www.angis.com/companylist/appliance-care', 'https://appliancecareservice.com/', 'angis.com', 'Appliance Care Repair', 'Business Listing', 'Business Listing', 'Live / Indexed'
FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://clutch.co/profile/iynix-digital', 'https://iynixdigital.com/', 'clutch.co', 'Iynix Digital SEO Agency', 'Directory', 'Directory', 'Live / Indexed'
FROM public.clients WHERE name = 'Iynix Digital';

INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, category, status)
SELECT id, 'https://www.yelp.com/biz/the-plumb-hero', 'https://theplumbhero.com/', 'yelp.com', 'The Plumb Hero Plumbers', 'Business Listing', 'Business Listing', 'Live / Indexed'
FROM public.clients WHERE name = 'The Plumb Hero';

-- -----------------------------------------------------------------------------
-- SEED OFF-PAGE ACTIVITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Quora Decision Intelligence Thread', 'Answered enterprise BI framework question with methodology breakdown', 'Quora Submission', CURRENT_DATE - 8, 'Completed', 'https://quora.com/What-is-decision-intelligence'
FROM public.clients WHERE name = 'Boulder';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Reddit Functional Medicine Discussion', 'Contributed clinic methodology in patient autoimmune thread', 'Reddit Submission', CURRENT_DATE - 5, 'Completed', 'https://reddit.com/r/FunctionalMedicine/'
FROM public.clients WHERE name = 'Conscious Medicine';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Pinterest Stress Relief Board', 'Created 15 infographic pins linking to adaptogen product page', 'Pinterest Submission', CURRENT_DATE - 11, 'Completed', 'https://pinterest.com/pin/besowell-routine/'
FROM public.clients WHERE name = 'Besowell';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Slideshare Kitchen Suppression PDF', 'Uploaded commercial kitchen fire suppression compliance deck', 'PDF Submission', CURRENT_DATE - 6, 'Completed', 'https://slideshare.net/firemastersafety/guide'
FROM public.clients WHERE name = 'Fire Master';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'YouTube Refrigerator Troubleshooting Video', 'Published DIY tutorial with technician dispatch link in description', 'YouTube Submission', CURRENT_DATE - 7, 'Completed', 'https://youtube.com/watch?v=appliance-care-diy'
FROM public.clients WHERE name = 'Appliance Care';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'B2B SaaS Growth Quora Answer', 'Authored 1200 word SaaS inbound play on Quora', 'Quora Submission', CURRENT_DATE - 5, 'Completed', 'https://quora.com/How-do-SaaS-scale-SEO'
FROM public.clients WHERE name = 'Iynix Digital';

INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT id, 'Frozen Pipe Community Thread', 'Emergency plumbing advice post in local community forum', 'Forum Submission', CURRENT_DATE - 4, 'Completed', 'https://reddit.com/r/Plumbing/comments/frozen_pipe'
FROM public.clients WHERE name = 'The Plumb Hero';


