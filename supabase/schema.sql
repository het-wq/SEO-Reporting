-- =============================================================================
-- SEO REPORTING DASHBOARD - SUPABASE MULTI-CLIENT DATABASE SCHEMA & SEED DATA
-- Project: Bclderdecisions (qtmoxaxonpimodwpemiy)
-- Clients: Boulder, Conscious Medicine, Besowell, Fire Master, Appliance Care,
--          Iynix Digital, The Plumb Hero
-- =============================================================================

-- Enable pgcrypto / uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. CLIENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  ga4_property_id TEXT,
  gsc_site_url TEXT,
  industry TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. CLIENT KEYWORDS (Rankings & Tracked Search Queries)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  target_url TEXT,
  search_volume INT DEFAULT 0,
  current_position INT,
  previous_position INT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. BRAND KEYWORDS (Branded Query Filtering Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brand_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  match_type TEXT DEFAULT 'contains',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 4. NON-BRAND KEYWORDS (Negative / Generic Categorization Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.non_brand_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. SEO ACTIVITIES (On-page, Technical, Content, Link Building tasks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planned',
  priority TEXT NOT NULL DEFAULT 'Medium',
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 6. BACKLINK AND OFF-PAGE ACTIVITIES (Submissions, Citations, Outreach)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backlink_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  category TEXT NOT NULL,
  domain_authority INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Live / Indexed',
  published_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR HIGH QUERY PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_client_keywords_client_id ON public.client_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_brand_keywords_client_id ON public.brand_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_non_brand_keywords_client_id ON public.non_brand_keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_seo_activities_client_id ON public.seo_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_backlink_activities_client_id ON public.backlink_activities(client_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enables open read/write access for dashboard anon / authenticated API requests
-- -----------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_brand_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlink_activities ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "Public access for clients" ON public.clients;
DROP POLICY IF EXISTS "Public access for client_keywords" ON public.client_keywords;
DROP POLICY IF EXISTS "Public access for brand_keywords" ON public.brand_keywords;
DROP POLICY IF EXISTS "Public access for non_brand_keywords" ON public.non_brand_keywords;
DROP POLICY IF EXISTS "Public access for seo_activities" ON public.seo_activities;
DROP POLICY IF EXISTS "Public access for backlink_activities" ON public.backlink_activities;

CREATE POLICY "Public access for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for client_keywords" ON public.client_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for brand_keywords" ON public.brand_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for non_brand_keywords" ON public.non_brand_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for seo_activities" ON public.seo_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for backlink_activities" ON public.backlink_activities FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SEED DATA: INSERT ALL 7 CLIENTS
-- =============================================================================
INSERT INTO public.clients (name, slug, domain, ga4_property_id, gsc_site_url, industry, description)
VALUES
  ('Boulder', 'boulder', 'https://boulderdecisions.com/', '516707960', 'sc-domain:boulderdecision.com', 'Decision Intelligence & Analytics', 'Enterprise analytics, marketing attribution, and decision intelligence consulting'),
  ('Conscious Medicine', 'conscious-medicine', 'https://consciousmed.com/', '412098112', 'sc-domain:consciousmed.com', 'Integrative & Functional Medicine', 'Personalized functional medicine, holistic therapies, and chronic illness recovery'),
  ('Besowell', 'besowell', 'https://besowell.com/', '412098113', 'sc-domain:besowell.com', 'Wellness & Lifestyle Health', 'Holistic wellness products, adaptogens, stress management, and mindful living'),
  ('Fire Master', 'fire-master', 'https://firemastersafety.com/', '412098114', 'sc-domain:firemastersafety.com', 'Fire Protection & Commercial Safety', 'Commercial fire suppression systems, extinguisher inspections, and life safety services'),
  ('Appliance Care', 'appliance-care', 'https://appliancecareservice.com/', '412098115', 'sc-domain:appliancecareservice.com', 'Appliance Repair & HVAC', 'Residential and commercial refrigeration, oven, washer, and kitchen appliance repairs'),
  ('Iynix Digital', 'iynix-digital', 'https://iynixdigital.com/', '412098116', 'sc-domain:iynixdigital.com', 'Digital Marketing & Growth Agency', 'Performance SEO, paid media advertising, conversion optimization, and web development'),
  ('The Plumb Hero', 'the-plumb-hero', 'https://theplumbhero.com/', '412098117', 'sc-domain:theplumbhero.com', 'Plumbing & Emergency Services', '24/7 emergency plumbing, drain cleaning, water heater repair, and leak detection')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  industry = EXCLUDED.industry,
  description = EXCLUDED.description;

-- =============================================================================
-- SEED DATA: 1. BOULDER
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'boulder';

  -- Client Keywords
  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'ux ui optimization atlanta', 'https://boulderdecisions.com/services', 1400, 3, 5, ARRAY['core', 'atlanta']),
    (v_client_id, 'ai consultants atlanta', 'https://boulderdecisions.com/ai', 880, 2, 4, ARRAY['ai', 'atlanta']),
    (v_client_id, 'boulder decision', 'https://boulderdecisions.com/', 2400, 1, 1, ARRAY['brand']),
    (v_client_id, 'boulder decisions analytics', 'https://boulderdecisions.com/about', 720, 1, 1, ARRAY['brand']),
    (v_client_id, 'decision intelligence consulting', 'https://boulderdecisions.com/services', 3200, 4, 7, ARRAY['strategy']),
    (v_client_id, 'enterprise analytics strategy', 'https://boulderdecisions.com/services', 2100, 6, 8, ARRAY['strategy']);

  -- Brand Keywords
  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'boulder decision', 'contains'),
    (v_client_id, 'boulder decisions', 'contains'),
    (v_client_id, 'boulderdecision', 'contains'),
    (v_client_id, 'boulderdecisions', 'contains'),
    (v_client_id, 'boulder decisions analytics', 'contains');

  -- Non-Brand Keywords
  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'enterprise decision intelligence tools', 'software'),
    (v_client_id, 'seo reporting platform for executives', 'b2b-analytics'),
    (v_client_id, 'automated marketing analytics reporting', 'analytics');

  -- SEO Activities
  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Migrated Search Console property and audited indexing', 'Technical SEO', 'Completed', 'High', CURRENT_DATE - 14, 'https://boulderdecisions.com/', 'Configured domain property and validated sitemaps.'),
    (v_client_id, 'Updated title tags & meta descriptions for decision consulting pages', 'On-Page SEO', 'Completed', 'High', CURRENT_DATE - 10, 'https://boulderdecisions.com/services', 'Integrated target terms into H1 and meta title tags.'),
    (v_client_id, 'Published Q4 Decision Intelligence whitepaper & cluster pages', 'Content & Blog', 'In Progress', 'Medium', CURRENT_DATE - 3, 'https://boulderdecisions.com/blog', 'Drafted 3 topic cluster supporting articles.');

  -- Backlink & Off-Page Activities
  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://clutch.co/profile/boulder-decision', 'https://boulderdecisions.com/', 'Boulder Decision Analytics', 'Business Listing', 88, 'Live / Indexed', CURRENT_DATE - 20, 'Top B2B analytics directory listing'),
    (v_client_id, 'https://www.quora.com/What-is-decision-intelligence-in-modern-BI', 'https://boulderdecisions.com/services', 'decision intelligence consulting framework', 'Quora Submission', 93, 'Live / Indexed', CURRENT_DATE - 8, 'Detailed answer providing BI framework breakdown'),
    (v_client_id, 'https://medium.com/@analytics-insights/enterprise-decision-stack-2026', 'https://boulderdecisions.com/ai', 'enterprise analytics strategy', 'Off-page Blogs Posting', 94, 'In Progress', CURRENT_DATE - 2, 'Industry guest article on Medium');
END $$;

-- =============================================================================
-- SEED DATA: 2. CONSCIOUS MEDICINE
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'conscious-medicine';

  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'functional medicine clinic', 'https://consciousmed.com/functional-medicine', 3600, 4, 8, ARRAY['medical', 'core']),
    (v_client_id, 'integrative medicine doctor', 'https://consciousmed.com/team', 2400, 3, 6, ARRAY['doctor', 'high-intent']),
    (v_client_id, 'holistic health practitioner near me', 'https://consciousmed.com/locations', 1800, 5, 9, ARRAY['local']),
    (v_client_id, 'root cause medicine specialist', 'https://consciousmed.com/services', 1200, 2, 4, ARRAY['specialist']),
    (v_client_id, 'chronic fatigue treatment holistic', 'https://consciousmed.com/conditions/fatigue', 950, 4, 7, ARRAY['condition']);

  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'conscious medicine', 'contains'),
    (v_client_id, 'consciousmed', 'contains'),
    (v_client_id, 'dr conscious medicine', 'contains'),
    (v_client_id, 'conscious medicine clinic', 'contains');

  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'functional medicine lab testing', 'lab-tests'),
    (v_client_id, 'gut health microbiome testing doctor', 'treatments'),
    (v_client_id, 'hormone balance therapy holistic', 'wellness');

  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Implemented MedicalClinic schema markup and physician credentials', 'Technical SEO', 'Completed', 'High', CURRENT_DATE - 12, 'https://consciousmed.com/', 'Structured schema for doctors, accreditations, and clinic hours.'),
    (v_client_id, 'Published patient guide on autoimmune root causes', 'Content & Blog', 'Completed', 'Medium', CURRENT_DATE - 7, 'https://consciousmed.com/blog/autoimmune-root-causes', 'Targeting 1,400 monthly searches.'),
    (v_client_id, 'Optimized Google Business Profile for local clinic queries', 'Local SEO', 'In Progress', 'High', CURRENT_DATE - 1, 'https://consciousmed.com/locations', 'Updating photos, services list, and booking CTA.');

  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://www.healthgrades.com/group-directory/conscious-medicine', 'https://consciousmed.com/', 'Conscious Medicine Clinic', 'Business Listing', 86, 'Live / Indexed', CURRENT_DATE - 15, 'Top medical citation verified'),
    (v_client_id, 'https://www.reddit.com/r/FunctionalMedicine/comments/integrative_care_clinic/', 'https://consciousmed.com/functional-medicine', 'holistic health practitioner near me', 'Reddit Submission', 91, 'Live / Indexed', CURRENT_DATE - 5, 'Shared clinical methodology overview in patient thread');
END $$;

-- =============================================================================
-- SEED DATA: 3. BESOWELL
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'besowell';

  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'besowell wellness', 'https://besowell.com/', 1600, 1, 1, ARRAY['brand']),
    (v_client_id, 'adaptogen stress supplements', 'https://besowell.com/shop/adaptogens', 2900, 5, 9, ARRAY['ecommerce', 'supplements']),
    (v_client_id, 'natural stress relief remedies', 'https://besowell.com/blog/natural-stress-relief', 4400, 7, 12, ARRAY['blog', 'volume']),
    (v_client_id, 'organic mindfulness wellness products', 'https://besowell.com/shop', 850, 4, 6, ARRAY['products']);

  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'besowell', 'contains'),
    (v_client_id, 'be so well', 'contains'),
    (v_client_id, 'besowell wellness', 'contains'),
    (v_client_id, 'besowell shop', 'contains');

  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'ashwagandha focus supplements', 'supplements'),
    (v_client_id, 'daily mindfulness routine essentials', 'lifestyle'),
    (v_client_id, 'clean label vitamins and herbs', 'nutrition');

  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Implemented Product & AggregateOffer rich snippets on shop items', 'On-Page SEO', 'Completed', 'High', CURRENT_DATE - 9, 'https://besowell.com/shop', 'Showing price, rating, and in-stock badges on Google SERPs.'),
    (v_client_id, 'Launched Pinterest lifestyle campaign for stress relief guides', 'Link Building', 'In Progress', 'Medium', CURRENT_DATE - 4, 'https://besowell.com/blog', 'Created 15 educational pin boards with backlinks.');

  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://www.pinterest.com/pin/besowell-daily-wellness-routine/', 'https://besowell.com/shop/adaptogens', 'natural stress relief remedies', 'Pinterest Submission', 94, 'Live / Indexed', CURRENT_DATE - 11, 'Infographic pin linking to adaptogen product page'),
    (v_client_id, 'https://wellnessmama.com/reviews/besowell-adaptogen-blend/', 'https://besowell.com/', 'BeSoWell adaptogen supplements', 'Guest Posting', 78, 'In Progress', CURRENT_DATE - 2, 'Organic supplement review & backlink');
END $$;

-- =============================================================================
-- SEED DATA: 4. FIRE MASTER
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'fire-master';

  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'commercial fire suppression systems', 'https://firemastersafety.com/commercial', 2200, 3, 5, ARRAY['commercial', 'high-ticket']),
    (v_client_id, 'fire extinguisher inspection near me', 'https://firemastersafety.com/inspections', 3100, 2, 4, ARRAY['inspection', 'local']),
    (v_client_id, 'restaurant kitchen fire safety systems', 'https://firemastersafety.com/restaurants', 1400, 4, 7, ARRAY['restaurant']),
    (v_client_id, 'emergency fire sprinkler maintenance', 'https://firemastersafety.com/sprinklers', 1900, 5, 8, ARRAY['sprinkler']);

  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'fire master', 'contains'),
    (v_client_id, 'firemaster', 'contains'),
    (v_client_id, 'fire master safety', 'contains'),
    (v_client_id, 'fire master fire protection', 'contains');

  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'osha commercial fire code requirements', 'compliance'),
    (v_client_id, 'ansul system kitchen inspection cost', 'commercial'),
    (v_client_id, 'fire alarm backflow testing certification', 'inspections');

  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Created 8 city-specific service area landing pages', 'Local SEO', 'Completed', 'High', CURRENT_DATE - 16, 'https://firemastersafety.com/areas', 'Rankings improved across 5 neighboring counties.'),
    (v_client_id, 'Published OSHA Fire Safety Checklist PDF download for B2B leads', 'Content & Blog', 'Completed', 'Medium', CURRENT_DATE - 8, 'https://firemastersafety.com/safety-checklist', 'Gated PDF asset generating commercial leads.');

  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://www.yellowpages.com/business/fire-master-safety-systems', 'https://firemastersafety.com/', 'Fire Master Protection Services', 'Business Listing', 87, 'Live / Indexed', CURRENT_DATE - 18, 'Verified local directory listing with NAP match'),
    (v_client_id, 'https://www.slideshare.net/firemastersafety/commercial-kitchen-fire-suppression-guide-2026', 'https://firemastersafety.com/restaurants', 'restaurant kitchen fire safety systems', 'PDF Submission', 92, 'Live / Indexed', CURRENT_DATE - 6, 'Uploaded PDF compliance deck with dofollow links');
END $$;

-- =============================================================================
-- SEED DATA: 5. APPLIANCE CARE
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'appliance-care';

  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'appliance repair near me', 'https://appliancecareservice.com/', 9800, 4, 7, ARRAY['high-volume', 'emergency']),
    (v_client_id, 'refrigerator repair service same day', 'https://appliancecareservice.com/refrigerators', 3400, 2, 4, ARRAY['refrigerator']),
    (v_client_id, 'emergency washer repair technician', 'https://appliancecareservice.com/washers', 2100, 3, 5, ARRAY['washer']),
    (v_client_id, 'commercial dishwasher maintenance', 'https://appliancecareservice.com/commercial', 1100, 3, 6, ARRAY['commercial']);

  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'appliance care', 'contains'),
    (v_client_id, 'appliancecare', 'contains'),
    (v_client_id, 'appliance care service', 'contains'),
    (v_client_id, 'appliance care repair', 'contains');

  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'samsung refrigerator not cooling fix', 'troubleshooting'),
    (v_client_id, 'sub zero repair specialist near me', 'high-end'),
    (v_client_id, 'dryer vent cleaning and thermal fuse replacement', 'repairs');

  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Optimized 24/7 emergency dispatch landing page for mobile speed', 'Conversion & UX', 'Completed', 'High', CURRENT_DATE - 11, 'https://appliancecareservice.com/emergency', 'Mobile PageSpeed score increased from 58 to 94.'),
    (v_client_id, 'Geo-targeted suburb pages with LocalBusiness schema', 'Local SEO', 'Completed', 'High', CURRENT_DATE - 6, 'https://appliancecareservice.com/locations', 'Local map pack rankings improved by 3 positions.');

  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://www.angis.com/companylist/us/appliance-care-specialists', 'https://appliancecareservice.com/', 'Appliance Care Repair', 'Business Listing', 89, 'Live / Indexed', CURRENT_DATE - 22, 'Angi Super Service badge and verified profile'),
    (v_client_id, 'https://www.youtube.com/watch?v=diy-refrigerator-troubleshooting', 'https://appliancecareservice.com/refrigerators', 'same day refrigerator repair service', 'YouTube Submission', 98, 'Live / Indexed', CURRENT_DATE - 7, 'Video description link on DIY refrigerator troubleshooting tutorial');
END $$;

-- =============================================================================
-- SEED DATA: 6. IYNIX DIGITAL
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'iynix-digital';

  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'digital marketing agency', 'https://iynixdigital.com/', 8100, 5, 8, ARRAY['agency', 'core']),
    (v_client_id, 'b2b seo agency for saas', 'https://iynixdigital.com/seo', 2400, 3, 5, ARRAY['seo', 'saas']),
    (v_client_id, 'performance marketing services', 'https://iynixdigital.com/paid-ads', 1900, 4, 7, ARRAY['paid']),
    (v_client_id, 'conversion rate optimization agency', 'https://iynixdigital.com/cro', 1600, 2, 4, ARRAY['cro']);

  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'iynix digital', 'contains'),
    (v_client_id, 'iynix', 'contains'),
    (v_client_id, 'iynixdigital', 'contains'),
    (v_client_id, 'iynix agency', 'contains');

  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'google ads agency for high ticket lead generation', 'ppc'),
    (v_client_id, 'enterprise b2b link building agency reviews', 'link-building'),
    (v_client_id, 'technical core web vitals agency audit', 'technical');

  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Published 4 deep-dive case studies with ROI charts', 'Content & Blog', 'Completed', 'High', CURRENT_DATE - 13, 'https://iynixdigital.com/case-studies', 'Showcased 340% organic traffic growth for tech clients.'),
    (v_client_id, 'Conducting outreach for Q4 digital marketing summit guest post', 'Link Building', 'In Progress', 'Medium', CURRENT_DATE - 3, 'https://iynixdigital.com/seo', 'Outreached to 12 marketing podcasts and publications.');

  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://clutch.co/profile/iynix-digital', 'https://iynixdigital.com/', 'Iynix Digital SEO Agency', 'Business Listing', 88, 'Live / Indexed', CURRENT_DATE - 17, '5-star reviewed agency profile on Clutch'),
    (v_client_id, 'https://www.quora.com/How-do-B2B-SaaS-companies-scale-organic-pipeline-with-SEO', 'https://iynixdigital.com/seo', 'b2b seo agency for saas', 'Quora Submission', 93, 'Live / Indexed', CURRENT_DATE - 5, 'Authored 1,200 word SaaS pipeline play on Quora');
END $$;

-- =============================================================================
-- SEED DATA: 7. THE PLUMB HERO
-- =============================================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients WHERE slug = 'the-plumb-hero';

  INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
  VALUES
    (v_client_id, 'emergency plumber near me', 'https://theplumbhero.com/emergency', 12400, 3, 6, ARRAY['emergency', 'high-intent']),
    (v_client_id, 'clogged drain cleaning service', 'https://theplumbhero.com/drain-cleaning', 4600, 2, 4, ARRAY['drains']),
    (v_client_id, 'tankless water heater repair and installation', 'https://theplumbhero.com/water-heaters', 3200, 4, 7, ARRAY['water-heater']),
    (v_client_id, 'sewer line camera inspection cost', 'https://theplumbhero.com/sewer-lines', 2100, 3, 5, ARRAY['sewer']);

  INSERT INTO public.brand_keywords (client_id, keyword, match_type)
  VALUES
    (v_client_id, 'the plumb hero', 'contains'),
    (v_client_id, 'plumb hero', 'contains'),
    (v_client_id, 'plumbhero', 'contains'),
    (v_client_id, 'the plumb hero plumbing', 'contains');

  INSERT INTO public.non_brand_keywords (client_id, keyword, category)
  VALUES
    (v_client_id, 'burst pipe emergency repair service', 'emergency'),
    (v_client_id, 'hydro jetting main line plumbing', 'drain-cleaning'),
    (v_client_id, 'slab leak detection specialist', 'inspections');

  INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
  VALUES
    (v_client_id, 'Optimized Google Map Pack profile with 42 verified customer reviews', 'Local SEO', 'Completed', 'High', CURRENT_DATE - 15, 'https://theplumbhero.com/', 'Ranked #1 in map pack for emergency plumbing keywords.'),
    (v_client_id, 'Implemented EmergencyService schema and click-to-call tracking', 'Technical SEO', 'Completed', 'High', CURRENT_DATE - 8, 'https://theplumbhero.com/emergency', 'Phone conversion rate lifted by 28%.');

  INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
  VALUES
    (v_client_id, 'https://www.yelp.com/biz/the-plumb-hero-emergency-service', 'https://theplumbhero.com/', 'The Plumb Hero Plumbers', 'Business Listing', 92, 'Live / Indexed', CURRENT_DATE - 19, 'Top rated local emergency plumbing citation'),
    (v_client_id, 'https://www.reddit.com/r/Plumbing/comments/how_to_handle_frozen_pipe_burst/', 'https://theplumbhero.com/emergency', 'emergency plumber near me', 'Reddit Submission', 91, 'Live / Indexed', CURRENT_DATE - 4, 'Community expert advice thread with emergency advice');
END $$;
