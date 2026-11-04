-- =============================================================================
-- MULTI-CLIENT SEO REPORTING DASHBOARD - SUPABASE DATABASE MIGRATION
-- Migration: 20261104_multi_client_schema.sql
-- 11 Tables: clients, google_connections, client_google_properties,
--            client_keywords, client_brand_terms, gsc_daily_metrics,
--            ga4_daily_metrics, seo_activities, backlinks,
--            off_page_activities, client_members
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. CLIENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  domain TEXT,
  status BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT true;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_name_unique ON public.clients (lower(trim(name)));

-- -----------------------------------------------------------------------------
-- 2. GOOGLE CONNECTIONS TABLE (Encrypted Refresh Tokens, Multi-Account Support)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_connections (
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
-- Maps a Client to their GA4 and GSC Properties under a Google Connection
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_google_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  google_connection_id UUID REFERENCES public.google_connections(id) ON DELETE SET NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('GA4', 'GSC', 'GBP', 'ADS')),
  property_id TEXT NOT NULL,
  property_name TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cgp_unique ON public.client_google_properties (client_id, property_type, property_id);

-- -----------------------------------------------------------------------------
-- 4. CLIENT KEYWORDS (Rank Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'non_branded',
  target_url TEXT,
  target_location TEXT,
  target_position INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.client_keywords ADD COLUMN IF NOT EXISTS keyword_type TEXT DEFAULT 'non_branded';
ALTER TABLE public.client_keywords ADD COLUMN IF NOT EXISTS target_url TEXT;
ALTER TABLE public.client_keywords ADD COLUMN IF NOT EXISTS target_location TEXT;
ALTER TABLE public.client_keywords ADD COLUMN IF NOT EXISTS target_position INTEGER;
ALTER TABLE public.client_keywords ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.client_keywords ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- -----------------------------------------------------------------------------
-- 5. CLIENT BRAND TERMS (Branded Query Filtering Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_brand_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  match_type TEXT DEFAULT 'contains',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cbt_unique ON public.client_brand_terms (client_id, lower(trim(term)));

-- -----------------------------------------------------------------------------
-- 6. GSC DAILY METRICS (Stored Reporting Data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gsc_daily_metrics (
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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_unique ON public.gsc_daily_metrics (client_id, property_id, date, query, page);

-- -----------------------------------------------------------------------------
-- 7. GA4 DAILY METRICS (Stored Reporting Data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ga4_daily_metrics (
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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ga4_unique ON public.ga4_daily_metrics (client_id, property_id, date);

-- -----------------------------------------------------------------------------
-- 8. SEO ACTIVITIES (On-page, Technical, Content, Link Building tasks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  activity_type TEXT NOT NULL,
  activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT DEFAULT 'Planned' NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS activity_title TEXT;
ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS activity_description TEXT;
ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS activity_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Planned';
ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE public.seo_activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- -----------------------------------------------------------------------------
-- 9. BACKLINKS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  domain_name TEXT,
  anchor_text TEXT,
  link_type TEXT,
  status TEXT DEFAULT 'Live / Indexed' NOT NULL,
  acquired_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 10. OFF-PAGE ACTIVITIES TABLE (Submissions, Citations, Bookmarking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.off_page_activities (
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
CREATE TABLE IF NOT EXISTS public.client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer' NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_members_unique ON public.client_members (client_id, user_id);

-- -----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cgp_client_id ON public.client_google_properties(client_id);
CREATE INDEX IF NOT EXISTS idx_cgp_conn_id ON public.client_google_properties(google_connection_id);
CREATE INDEX IF NOT EXISTS idx_ck_client_id ON public.client_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_cbt_client_id ON public.client_brand_terms(client_id);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_client_date ON public.gsc_daily_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_daily_client_date ON public.ga4_daily_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_seo_act_client_id ON public.seo_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_bl_client_id ON public.backlinks(client_id);
CREATE INDEX IF NOT EXISTS idx_opa_client_id ON public.off_page_activities(client_id);

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

-- Permissive public policies for application operations
DROP POLICY IF EXISTS "Allow all for clients" ON public.clients;
CREATE POLICY "Allow all for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for google_connections" ON public.google_connections;
CREATE POLICY "Allow all for google_connections" ON public.google_connections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for client_google_properties" ON public.client_google_properties;
CREATE POLICY "Allow all for client_google_properties" ON public.client_google_properties FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for client_keywords" ON public.client_keywords;
CREATE POLICY "Allow all for client_keywords" ON public.client_keywords FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for client_brand_terms" ON public.client_brand_terms;
CREATE POLICY "Allow all for client_brand_terms" ON public.client_brand_terms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for gsc_daily_metrics" ON public.gsc_daily_metrics;
CREATE POLICY "Allow all for gsc_daily_metrics" ON public.gsc_daily_metrics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for ga4_daily_metrics" ON public.ga4_daily_metrics;
CREATE POLICY "Allow all for ga4_daily_metrics" ON public.ga4_daily_metrics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for seo_activities" ON public.seo_activities;
CREATE POLICY "Allow all for seo_activities" ON public.seo_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for backlinks" ON public.backlinks;
CREATE POLICY "Allow all for backlinks" ON public.backlinks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for off_page_activities" ON public.off_page_activities;
CREATE POLICY "Allow all for off_page_activities" ON public.off_page_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for client_members" ON public.client_members;
CREATE POLICY "Allow all for client_members" ON public.client_members FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SEED INITIAL 7 CLIENTS & PROPERTY MAPPINGS
-- =============================================================================
INSERT INTO public.clients (name, website_url, domain, status)
SELECT c.name, c.website_url, c.domain, c.status
FROM (VALUES
  ('Boulder', 'https://boulderdecisions.com/', 'boulderdecisions.com', true),
  ('Conscious Medicine', 'https://consciousmed.com/', 'consciousmed.com', true),
  ('Besowell', 'https://besowell.com/', 'besowell.com', true),
  ('Fire Master', 'https://firemastersafety.com/', 'firemastersafety.com', true),
  ('Appliance Care', 'https://appliancecareservice.com/', 'appliancecareservice.com', true),
  ('Iynix Digital', 'https://iynixdigital.com/', 'iynixdigital.com', true),
  ('The Plumb Hero', 'https://theplumbhero.com/', 'theplumbhero.com', true)
) AS c(name, website_url, domain, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients existing WHERE lower(trim(existing.name)) = lower(trim(c.name))
);

-- SEED CLIENT GOOGLE PROPERTIES
INSERT INTO public.client_google_properties (client_id, property_type, property_id, property_name, is_active)
SELECT c.id, p.property_type, p.property_id, p.property_name, true
FROM public.clients c
JOIN (VALUES
  ('Boulder', 'GA4', '516707960', 'Boulder Decision Web GA4'),
  ('Boulder', 'GSC', 'sc-domain:boulderdecision.com', 'boulderdecision.com (Domain)'),
  ('Conscious Medicine', 'GA4', '412098112', 'Conscious Medicine GA4'),
  ('Conscious Medicine', 'GSC', 'sc-domain:consciousmed.com', 'consciousmed.com (Domain)'),
  ('Besowell', 'GA4', '412098113', 'Besowell E-Commerce GA4'),
  ('Besowell', 'GSC', 'sc-domain:besowell.com', 'besowell.com (Domain)'),
  ('Fire Master', 'GA4', '412098114', 'Fire Master Commercial GA4'),
  ('Fire Master', 'GSC', 'sc-domain:firemastersafety.com', 'firemastersafety.com (Domain)'),
  ('Appliance Care', 'GA4', '412098115', 'Appliance Care GA4'),
  ('Appliance Care', 'GSC', 'sc-domain:appliancecareservice.com', 'appliancecareservice.com (Domain)'),
  ('Iynix Digital', 'GA4', '412098116', 'Iynix Digital GA4'),
  ('Iynix Digital', 'GSC', 'sc-domain:iynixdigital.com', 'iynixdigital.com (Domain)'),
  ('The Plumb Hero', 'GA4', '412098117', 'The Plumb Hero GA4'),
  ('The Plumb Hero', 'GSC', 'sc-domain:theplumbhero.com', 'theplumbhero.com (Domain)')
) AS p(client_name, property_type, property_id, property_name)
ON lower(trim(c.name)) = lower(trim(p.client_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_google_properties cgp 
  WHERE cgp.client_id = c.id AND cgp.property_type = p.property_type AND cgp.property_id = p.property_id
);

-- SEED CLIENT BRAND TERMS
INSERT INTO public.client_brand_terms (client_id, term, match_type)
SELECT c.id, b.term, 'contains'
FROM public.clients c
JOIN (VALUES
  ('Boulder', 'boulder decision'),
  ('Boulder', 'boulder decisions'),
  ('Boulder', 'boulderdecision'),
  ('Conscious Medicine', 'conscious medicine'),
  ('Conscious Medicine', 'consciousmed'),
  ('Conscious Medicine', 'dr conscious medicine'),
  ('Besowell', 'besowell'),
  ('Besowell', 'be so well'),
  ('Besowell', 'besowell wellness'),
  ('Fire Master', 'fire master'),
  ('Fire Master', 'firemaster'),
  ('Fire Master', 'fire master safety'),
  ('Appliance Care', 'appliance care'),
  ('Appliance Care', 'appliancecare'),
  ('Appliance Care', 'appliance care service'),
  ('Iynix Digital', 'iynix digital'),
  ('Iynix Digital', 'iynix'),
  ('Iynix Digital', 'iynixdigital'),
  ('The Plumb Hero', 'the plumb hero'),
  ('The Plumb Hero', 'plumb hero'),
  ('The Plumb Hero', 'plumbhero')
) AS b(client_name, term)
ON lower(trim(c.name)) = lower(trim(b.client_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_brand_terms cbt
  WHERE cbt.client_id = c.id AND lower(trim(cbt.term)) = lower(trim(b.term))
);

-- SEED CLIENT KEYWORDS
INSERT INTO public.client_keywords (client_id, keyword, keyword_type, target_url, target_position, status)
SELECT c.id, k.keyword, k.keyword_type, k.target_url, k.target_position, 'active'
FROM public.clients c
JOIN (VALUES
  ('Boulder', 'ux ui optimization atlanta', 'non_branded', 'https://boulderdecisions.com/services', 3),
  ('Boulder', 'ai consultants atlanta', 'non_branded', 'https://boulderdecisions.com/ai', 2),
  ('Boulder', 'boulder decision', 'branded', 'https://boulderdecisions.com/', 1),
  ('Boulder', 'decision intelligence consulting', 'non_branded', 'https://boulderdecisions.com/services', 4),
  ('Conscious Medicine', 'functional medicine clinic', 'non_branded', 'https://consciousmed.com/functional-medicine', 4),
  ('Conscious Medicine', 'integrative medicine doctor', 'non_branded', 'https://consciousmed.com/team', 3),
  ('Conscious Medicine', 'conscious medicine clinic', 'branded', 'https://consciousmed.com/', 1),
  ('Besowell', 'besowell wellness', 'branded', 'https://besowell.com/', 1),
  ('Besowell', 'adaptogen stress supplements', 'non_branded', 'https://besowell.com/shop/adaptogens', 5),
  ('Besowell', 'natural stress relief remedies', 'non_branded', 'https://besowell.com/blog/natural-stress-relief', 7),
  ('Fire Master', 'commercial fire suppression systems', 'non_branded', 'https://firemastersafety.com/commercial', 3),
  ('Fire Master', 'fire master safety', 'branded', 'https://firemastersafety.com/', 1),
  ('Fire Master', 'fire extinguisher inspection near me', 'non_branded', 'https://firemastersafety.com/inspections', 2),
  ('Appliance Care', 'appliance repair near me', 'non_branded', 'https://appliancecareservice.com/', 4),
  ('Appliance Care', 'refrigerator repair service same day', 'non_branded', 'https://appliancecareservice.com/refrigerators', 2),
  ('Appliance Care', 'appliance care service', 'branded', 'https://appliancecareservice.com/', 1),
  ('Iynix Digital', 'digital marketing agency', 'non_branded', 'https://iynixdigital.com/', 5),
  ('Iynix Digital', 'b2b seo agency for saas', 'non_branded', 'https://iynixdigital.com/seo', 3),
  ('Iynix Digital', 'iynix digital agency', 'branded', 'https://iynixdigital.com/', 1),
  ('The Plumb Hero', 'emergency plumber near me', 'non_branded', 'https://theplumbhero.com/emergency', 3),
  ('The Plumb Hero', 'clogged drain cleaning service', 'non_branded', 'https://theplumbhero.com/drain-cleaning', 2),
  ('The Plumb Hero', 'the plumb hero emergency plumbing', 'branded', 'https://theplumbhero.com/', 1)
) AS k(client_name, keyword, keyword_type, target_url, target_position)
ON lower(trim(c.name)) = lower(trim(k.client_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_keywords ck
  WHERE ck.client_id = c.id AND lower(trim(ck.keyword)) = lower(trim(k.keyword))
);

-- SEED SEO ACTIVITIES
INSERT INTO public.seo_activities (client_id, activity_title, activity_description, activity_type, activity_date, status)
SELECT c.id, a.title, a.description, a.activity_type, CURRENT_DATE - a.days_ago, a.status
FROM public.clients c
JOIN (VALUES
  ('Boulder', 'Migrated Search Console property and audited indexing', 'Domain verified and clean indexing confirmed.', 'Technical SEO', 14, 'Completed'),
  ('Boulder', 'Updated title tags & meta descriptions for consulting pages', 'Integrated target keywords into H1 and meta titles.', 'On-Page SEO', 10, 'Completed'),
  ('Conscious Medicine', 'Implemented MedicalClinic schema markup', 'Doctors schema and accreditations verified.', 'Technical SEO', 12, 'Completed'),
  ('Conscious Medicine', 'Optimized Google Business Profile for local clinic queries', 'Updating photos, clinic hours, and booking CTA.', 'Local SEO', 1, 'In Progress'),
  ('Besowell', 'Implemented Product & AggregateOffer rich snippets on shop', 'Showing price and stock badges on SERPs.', 'On-Page SEO', 9, 'Completed'),
  ('Fire Master', 'Created 8 city-specific service area landing pages', 'Rankings improved across 5 neighboring counties.', 'Local SEO', 16, 'Completed'),
  ('Appliance Care', 'Optimized mobile page speed to 94', 'PageSpeed mobile score improved to 94.', 'Technical SEO', 11, 'Completed'),
  ('Iynix Digital', 'Published 4 deep-dive case studies with ROI metrics', 'Showcased 340% organic traffic growth for tech clients.', 'Content & Blog', 13, 'Completed'),
  ('The Plumb Hero', 'Optimized Google Map Pack profile with 42 verified reviews', 'Ranked #1 in map pack for emergency plumbing keywords.', 'Local SEO', 15, 'Completed')
) AS a(client_name, title, description, activity_type, days_ago, status)
ON lower(trim(c.name)) = lower(trim(a.client_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.seo_activities sa
  WHERE sa.client_id = c.id AND lower(trim(sa.activity_title)) = lower(trim(a.title))
);

-- SEED BACKLINKS
INSERT INTO public.backlinks (client_id, source_url, target_url, domain_name, anchor_text, link_type, status)
SELECT c.id, bl.source_url, bl.target_url, bl.domain_name, bl.anchor_text, bl.link_type, bl.status
FROM public.clients c
JOIN (VALUES
  ('Boulder', 'https://clutch.co/profile/boulder-decision', 'https://boulderdecisions.com/', 'clutch.co', 'Boulder Decision Analytics', 'Directory', 'Live / Indexed'),
  ('Conscious Medicine', 'https://www.healthgrades.com/group-directory/conscious-medicine', 'https://consciousmed.com/', 'healthgrades.com', 'Conscious Medicine Clinic', 'Medical Citation', 'Live / Indexed'),
  ('Besowell', 'https://wellnessmama.com/reviews/besowell-adaptogen-blend/', 'https://besowell.com/', 'wellnessmama.com', 'BeSoWell adaptogen supplements', 'Guest Post', 'Live / Indexed'),
  ('Fire Master', 'https://www.yellowpages.com/business/fire-master', 'https://firemastersafety.com/', 'yellowpages.com', 'Fire Master Protection Services', 'Business Listing', 'Live / Indexed'),
  ('Appliance Care', 'https://www.angis.com/companylist/appliance-care', 'https://appliancecareservice.com/', 'angis.com', 'Appliance Care Repair', 'Business Listing', 'Live / Indexed'),
  ('Iynix Digital', 'https://clutch.co/profile/iynix-digital', 'https://iynixdigital.com/', 'clutch.co', 'Iynix Digital SEO Agency', 'Directory', 'Live / Indexed'),
  ('The Plumb Hero', 'https://www.yelp.com/biz/the-plumb-hero', 'https://theplumbhero.com/', 'yelp.com', 'The Plumb Hero Plumbers', 'Business Listing', 'Live / Indexed')
) AS bl(client_name, source_url, target_url, domain_name, anchor_text, link_type, status)
ON lower(trim(c.name)) = lower(trim(bl.client_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.backlinks b
  WHERE b.client_id = c.id AND lower(trim(b.source_url)) = lower(trim(bl.source_url))
);

-- SEED OFF-PAGE ACTIVITIES
INSERT INTO public.off_page_activities (client_id, activity_name, activity_description, activity_type, activity_date, status, reference_url)
SELECT c.id, o.name, o.description, o.type, CURRENT_DATE - o.days_ago, o.status, o.ref_url
FROM public.clients c
JOIN (VALUES
  ('Boulder', 'Quora Decision Intelligence Thread', 'Answered enterprise BI framework question with methodology breakdown', 'Quora Submission', 8, 'Completed', 'https://quora.com/What-is-decision-intelligence'),
  ('Conscious Medicine', 'Reddit Functional Medicine Discussion', 'Contributed clinic methodology in patient autoimmune thread', 'Reddit Submission', 5, 'Completed', 'https://reddit.com/r/FunctionalMedicine/'),
  ('Besowell', 'Pinterest Stress Relief Board', 'Created 15 infographic pins linking to adaptogen product page', 'Pinterest Submission', 11, 'Completed', 'https://pinterest.com/pin/besowell-routine/'),
  ('Fire Master', 'Slideshare Kitchen Suppression PDF', 'Uploaded commercial kitchen fire suppression compliance deck', 'PDF Submission', 6, 'Completed', 'https://slideshare.net/firemastersafety/guide'),
  ('Appliance Care', 'YouTube Refrigerator Troubleshooting Video', 'Published DIY tutorial with technician dispatch link in description', 'YouTube Submission', 7, 'Completed', 'https://youtube.com/watch?v=appliance-care-diy'),
  ('Iynix Digital', 'B2B SaaS Growth Quora Answer', 'Authored 1,200 word SaaS inbound play on Quora', 'Quora Submission', 5, 'Completed', 'https://quora.com/How-do-SaaS-scale-SEO'),
  ('The Plumb Hero', 'Frozen Pipe Community Thread', 'Emergency plumbing advice post in local community forum', 'Forum Submission', 4, 'Completed', 'https://reddit.com/r/Plumbing/comments/frozen_pipe')
) AS o(client_name, name, description, type, days_ago, status, ref_url)
ON lower(trim(c.name)) = lower(trim(o.client_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.off_page_activities opa
  WHERE opa.client_id = c.id AND lower(trim(opa.activity_name)) = lower(trim(o.name))
);

