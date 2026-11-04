-- =============================================================================
-- SEO REPORTING DASHBOARD - SUPABASE MULTI-CLIENT DATABASE SCHEMA & SEED DATA
-- Project: Bclderdecisions (qtmoxaxonpimodwpemiy)
-- Clients: Boulder, Conscious Medicine, Besowell, Fire Master, Appliance Care,
--          Iynix Digital, The Plumb Hero
-- (100% Pure Standard SQL - No PL/pgSQL blocks or $$ delimiters)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES IF NEEDED (Clean Start)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.backlink_activities CASCADE;
DROP TABLE IF EXISTS public.seo_activities CASCADE;
DROP TABLE IF EXISTS public.non_brand_keywords CASCADE;
DROP TABLE IF EXISTS public.brand_keywords CASCADE;
DROP TABLE IF EXISTS public.client_keywords CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;

-- -----------------------------------------------------------------------------
-- 2. CREATE CLIENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.clients (
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
-- 3. CREATE SUB-TABLES (Referencing clients.id)
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_keywords (
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

CREATE TABLE public.brand_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  match_type TEXT DEFAULT 'contains',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.non_brand_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.seo_activities (
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

CREATE TABLE public.backlink_activities (
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
-- 4. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_client_keywords_client_id ON public.client_keywords(client_id);
CREATE INDEX idx_brand_keywords_client_id ON public.brand_keywords(client_id);
CREATE INDEX idx_non_brand_keywords_client_id ON public.non_brand_keywords(client_id);
CREATE INDEX idx_seo_activities_client_id ON public.seo_activities(client_id);
CREATE INDEX idx_backlink_activities_client_id ON public.backlink_activities(client_id);

-- -----------------------------------------------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY & OPEN PUBLIC ACCESS POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_brand_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlink_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for client_keywords" ON public.client_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for brand_keywords" ON public.brand_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for non_brand_keywords" ON public.non_brand_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for seo_activities" ON public.seo_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for backlink_activities" ON public.backlink_activities FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. INSERT THE 7 CLIENTS
-- -----------------------------------------------------------------------------
INSERT INTO public.clients (name, slug, domain, ga4_property_id, gsc_site_url, industry, description)
VALUES
  ('Boulder', 'boulder', 'https://boulderdecisions.com/', '516707960', 'sc-domain:boulderdecision.com', 'Decision Intelligence & Analytics', 'Enterprise analytics, marketing attribution, and decision intelligence consulting'),
  ('Conscious Medicine', 'conscious-medicine', 'https://consciousmed.com/', '412098112', 'sc-domain:consciousmed.com', 'Integrative & Functional Medicine', 'Personalized functional medicine, holistic therapies, and chronic illness recovery'),
  ('Besowell', 'besowell', 'https://besowell.com/', '412098113', 'sc-domain:besowell.com', 'Wellness & Lifestyle Health', 'Holistic wellness products, adaptogens, stress management, and mindful living'),
  ('Fire Master', 'fire-master', 'https://firemastersafety.com/', '412098114', 'sc-domain:firemastersafety.com', 'Fire Protection & Commercial Safety', 'Commercial fire suppression systems, extinguisher inspections, and life safety services'),
  ('Appliance Care', 'appliance-care', 'https://appliancecareservice.com/', '412098115', 'sc-domain:appliancecareservice.com', 'Appliance Repair & HVAC', 'Residential and commercial refrigeration, oven, washer, and kitchen appliance repairs'),
  ('Iynix Digital', 'iynix-digital', 'https://iynixdigital.com/', '412098116', 'sc-domain:iynixdigital.com', 'Digital Marketing & Growth Agency', 'Performance SEO, paid media advertising, conversion optimization, and web development'),
  ('The Plumb Hero', 'the-plumb-hero', 'https://theplumbhero.com/', '412098117', 'sc-domain:theplumbhero.com', 'Plumbing & Emergency Services', '24/7 emergency plumbing, drain cleaning, water heater repair, and leak detection');

-- -----------------------------------------------------------------------------
-- 7. SEED: CLIENT KEYWORDS (Rankings)
-- -----------------------------------------------------------------------------
INSERT INTO public.client_keywords (client_id, keyword, target_url, search_volume, current_position, previous_position, tags)
SELECT c.id, k.keyword, k.target_url, k.search_volume, k.current_position, k.previous_position, k.tags
FROM public.clients c
JOIN (VALUES
  -- Boulder
  ('boulder', 'ux ui optimization atlanta', 'https://boulderdecisions.com/services', 1400, 3, 5, ARRAY['core', 'atlanta']),
  ('boulder', 'ai consultants atlanta', 'https://boulderdecisions.com/ai', 880, 2, 4, ARRAY['ai', 'atlanta']),
  ('boulder', 'boulder decision', 'https://boulderdecisions.com/', 2400, 1, 1, ARRAY['brand']),
  ('boulder', 'decision intelligence consulting', 'https://boulderdecisions.com/services', 3200, 4, 7, ARRAY['strategy']),
  -- Conscious Medicine
  ('conscious-medicine', 'functional medicine clinic', 'https://consciousmed.com/functional-medicine', 3600, 4, 8, ARRAY['medical']),
  ('conscious-medicine', 'integrative medicine doctor', 'https://consciousmed.com/team', 2400, 3, 6, ARRAY['doctor']),
  ('conscious-medicine', 'root cause medicine specialist', 'https://consciousmed.com/services', 1200, 2, 4, ARRAY['specialist']),
  -- Besowell
  ('besowell', 'besowell wellness', 'https://besowell.com/', 1600, 1, 1, ARRAY['brand']),
  ('besowell', 'adaptogen stress supplements', 'https://besowell.com/shop/adaptogens', 2900, 5, 9, ARRAY['ecommerce']),
  ('besowell', 'natural stress relief remedies', 'https://besowell.com/blog/natural-stress-relief', 4400, 7, 12, ARRAY['blog']),
  -- Fire Master
  ('fire-master', 'commercial fire suppression systems', 'https://firemastersafety.com/commercial', 2200, 3, 5, ARRAY['commercial']),
  ('fire-master', 'fire extinguisher inspection near me', 'https://firemastersafety.com/inspections', 3100, 2, 4, ARRAY['local']),
  ('fire-master', 'restaurant kitchen fire safety systems', 'https://firemastersafety.com/restaurants', 1400, 4, 7, ARRAY['restaurant']),
  -- Appliance Care
  ('appliance-care', 'appliance repair near me', 'https://appliancecareservice.com/', 9800, 4, 7, ARRAY['emergency']),
  ('appliance-care', 'refrigerator repair service same day', 'https://appliancecareservice.com/refrigerators', 3400, 2, 4, ARRAY['refrigerator']),
  ('appliance-care', 'emergency washer repair technician', 'https://appliancecareservice.com/washers', 2100, 3, 5, ARRAY['washer']),
  -- Iynix Digital
  ('iynix-digital', 'digital marketing agency', 'https://iynixdigital.com/', 8100, 5, 8, ARRAY['agency']),
  ('iynix-digital', 'b2b seo agency for saas', 'https://iynixdigital.com/seo', 2400, 3, 5, ARRAY['saas']),
  ('iynix-digital', 'performance marketing services', 'https://iynixdigital.com/paid-ads', 1900, 4, 7, ARRAY['paid']),
  -- The Plumb Hero
  ('the-plumb-hero', 'emergency plumber near me', 'https://theplumbhero.com/emergency', 12400, 3, 6, ARRAY['emergency']),
  ('the-plumb-hero', 'clogged drain cleaning service', 'https://theplumbhero.com/drain-cleaning', 4600, 2, 4, ARRAY['drains']),
  ('the-plumb-hero', 'tankless water heater repair and installation', 'https://theplumbhero.com/water-heaters', 3200, 4, 7, ARRAY['water-heater'])
) AS k(slug, keyword, target_url, search_volume, current_position, previous_position, tags)
ON c.slug = k.slug;

-- -----------------------------------------------------------------------------
-- 8. SEED: BRAND KEYWORDS
-- -----------------------------------------------------------------------------
INSERT INTO public.brand_keywords (client_id, keyword, match_type)
SELECT c.id, b.keyword, 'contains'
FROM public.clients c
JOIN (VALUES
  ('boulder', 'boulder decision'),
  ('boulder', 'boulder decisions'),
  ('boulder', 'boulderdecision'),
  ('conscious-medicine', 'conscious medicine'),
  ('conscious-medicine', 'consciousmed'),
  ('conscious-medicine', 'dr conscious medicine'),
  ('besowell', 'besowell'),
  ('besowell', 'be so well'),
  ('besowell', 'besowell wellness'),
  ('fire-master', 'fire master'),
  ('fire-master', 'firemaster'),
  ('fire-master', 'fire master safety'),
  ('appliance-care', 'appliance care'),
  ('appliance-care', 'appliancecare'),
  ('appliance-care', 'appliance care service'),
  ('iynix-digital', 'iynix digital'),
  ('iynix-digital', 'iynix'),
  ('iynix-digital', 'iynixdigital'),
  ('the-plumb-hero', 'the plumb hero'),
  ('the-plumb-hero', 'plumb hero'),
  ('the-plumb-hero', 'plumbhero')
) AS b(slug, keyword)
ON c.slug = b.slug;

-- -----------------------------------------------------------------------------
-- 9. SEED: NON-BRAND KEYWORDS
-- -----------------------------------------------------------------------------
INSERT INTO public.non_brand_keywords (client_id, keyword, category)
SELECT c.id, nb.keyword, nb.category
FROM public.clients c
JOIN (VALUES
  ('boulder', 'enterprise decision intelligence tools', 'software'),
  ('boulder', 'seo reporting platform for executives', 'b2b-analytics'),
  ('conscious-medicine', 'functional medicine lab testing', 'lab-tests'),
  ('conscious-medicine', 'gut health microbiome testing doctor', 'treatments'),
  ('besowell', 'ashwagandha focus supplements', 'supplements'),
  ('besowell', 'daily mindfulness routine essentials', 'lifestyle'),
  ('fire-master', 'osha commercial fire code requirements', 'compliance'),
  ('fire-master', 'ansul system kitchen inspection cost', 'commercial'),
  ('appliance-care', 'samsung refrigerator not cooling fix', 'troubleshooting'),
  ('appliance-care', 'sub zero repair specialist near me', 'high-end'),
  ('iynix-digital', 'google ads agency for lead generation', 'ppc'),
  ('iynix-digital', 'enterprise b2b link building agency', 'link-building'),
  ('the-plumb-hero', 'burst pipe emergency repair service', 'emergency'),
  ('the-plumb-hero', 'hydro jetting main line plumbing', 'drain-cleaning')
) AS nb(slug, keyword, category)
ON c.slug = nb.slug;

-- -----------------------------------------------------------------------------
-- 10. SEED: SEO ACTIVITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.seo_activities (client_id, title, category, status, priority, activity_date, target_url, notes)
SELECT c.id, a.title, a.category, a.status, a.priority, CURRENT_DATE - a.days_ago, a.target_url, a.notes
FROM public.clients c
JOIN (VALUES
  ('boulder', 'Migrated Search Console property and audited indexing', 'Technical SEO', 'Completed', 'High', 14, 'https://boulderdecisions.com/', 'Domain verified and clean indexing confirmed.'),
  ('boulder', 'Updated title tags & meta descriptions for consulting pages', 'On-Page SEO', 'Completed', 'High', 10, 'https://boulderdecisions.com/services', 'Integrated target keywords into H1 and meta titles.'),
  ('conscious-medicine', 'Implemented MedicalClinic schema markup and physician credentials', 'Technical SEO', 'Completed', 'High', 12, 'https://consciousmed.com/', 'Doctors schema and accreditations verified.'),
  ('conscious-medicine', 'Optimized Google Business Profile for local clinic queries', 'Local SEO', 'In Progress', 'High', 1, 'https://consciousmed.com/locations', 'Updating photos, clinic hours, and booking CTA.'),
  ('besowell', 'Implemented Product & AggregateOffer rich snippets on shop', 'On-Page SEO', 'Completed', 'High', 9, 'https://besowell.com/shop', 'Showing price and stock badges on SERPs.'),
  ('fire-master', 'Created 8 city-specific service area landing pages', 'Local SEO', 'Completed', 'High', 16, 'https://firemastersafety.com/areas', 'Rankings improved across 5 neighboring counties.'),
  ('appliance-care', 'Optimized 24/7 emergency dispatch landing page for mobile speed', 'Conversion & UX', 'Completed', 'High', 11, 'https://appliancecareservice.com/emergency', 'PageSpeed mobile score improved to 94.'),
  ('iynix-digital', 'Published 4 deep-dive case studies with ROI charts', 'Content & Blog', 'Completed', 'High', 13, 'https://iynixdigital.com/case-studies', 'Showcased 340% organic traffic growth for tech clients.'),
  ('the-plumb-hero', 'Optimized Google Map Pack profile with 42 verified customer reviews', 'Local SEO', 'Completed', 'High', 15, 'https://theplumbhero.com/', 'Ranked #1 in map pack for emergency plumbing keywords.')
) AS a(slug, title, category, status, priority, days_ago, target_url, notes)
ON c.slug = a.slug;

-- -----------------------------------------------------------------------------
-- 11. SEED: BACKLINK AND OFF-PAGE ACTIVITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.backlink_activities (client_id, source_url, target_url, anchor_text, category, domain_authority, status, published_date, notes)
SELECT c.id, bl.source_url, bl.target_url, bl.anchor_text, bl.category, bl.da, bl.status, CURRENT_DATE - bl.days_ago, bl.notes
FROM public.clients c
JOIN (VALUES
  ('boulder', 'https://clutch.co/profile/boulder-decision', 'https://boulderdecisions.com/', 'Boulder Decision Analytics', 'Business Listing', 88, 'Live / Indexed', 20, 'Top B2B analytics directory listing'),
  ('boulder', 'https://www.quora.com/What-is-decision-intelligence-in-modern-BI', 'https://boulderdecisions.com/services', 'decision intelligence consulting framework', 'Quora Submission', 93, 'Live / Indexed', 8, 'Detailed answer providing BI framework breakdown'),
  ('conscious-medicine', 'https://www.healthgrades.com/group-directory/conscious-medicine', 'https://consciousmed.com/', 'Conscious Medicine Clinic', 'Business Listing', 86, 'Live / Indexed', 15, 'Top medical citation verified'),
  ('besowell', 'https://www.pinterest.com/pin/besowell-daily-wellness-routine/', 'https://besowell.com/shop/adaptogens', 'natural stress relief remedies', 'Pinterest Submission', 94, 'Live / Indexed', 11, 'Infographic pin linking to adaptogen product page'),
  ('fire-master', 'https://www.yellowpages.com/business/fire-master-safety-systems', 'https://firemastersafety.com/', 'Fire Master Protection Services', 'Business Listing', 87, 'Live / Indexed', 18, 'Verified local directory listing with NAP match'),
  ('appliance-care', 'https://www.angis.com/companylist/us/appliance-care-specialists', 'https://appliancecareservice.com/', 'Appliance Care Repair', 'Business Listing', 89, 'Live / Indexed', 22, 'Angi Super Service badge and verified profile'),
  ('iynix-digital', 'https://clutch.co/profile/iynix-digital', 'https://iynixdigital.com/', 'Iynix Digital SEO Agency', 'Business Listing', 88, 'Live / Indexed', 17, '5-star reviewed agency profile on Clutch'),
  ('the-plumb-hero', 'https://www.yelp.com/biz/the-plumb-hero-emergency-service', 'https://theplumbhero.com/', 'The Plumb Hero Plumbers', 'Business Listing', 92, 'Live / Indexed', 19, 'Top rated local emergency plumbing citation')
) AS bl(slug, source_url, target_url, anchor_text, category, da, status, days_ago, notes)
ON c.slug = bl.slug;
