// Curated structured data for the September 2026 "Appliance Care of Atlanta" SEO report.
// Every numeric value below is taken verbatim from the source PDF
// (uploads/appliance-care-sep-2026.pdf, pages 3-13, 45-46). Fields with no
// PDF-supplied value are left null/empty rather than invented, and flagged
// in `meta.unverified` so the UI can render an explicit empty state.

const diffPct = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
};

const metric = (current, previous, { invert = false, unit = '' } = {}) => ({
  current,
  previous,
  diffPct: diffPct(current, previous),
  improvement: invert ? current < previous : current > previous,
  unit,
});

export function buildSeedReport({ pdfFile, totalPages = 47 } = {}) {
  return {
    id: 'appliance-care-sep-2026',
    client: 'Appliance Care of Atlanta',
    period: 'September 2026',
    previousPeriod: 'August 2026',
    reportTitle: 'Monthly SEO Review - Sep 2026',
    pdfFile,
    totalPages,
    uploadedAt: new Date().toISOString(),
    status: 'extracted',
    source: 'seed',

    // Page 3 - Overall Website Traffic (GA Overview)
    traffic: {
      overall: metric(1629, 2350),
      organic: metric(469, 723),
      direct: metric(1160, 1627),
      organicNewUsers: metric(455, 707),
      timeOnSiteOrganic: {
        current: '1m 44s',
        previous: '35s',
        diffPct: 197.14,
        improvement: true,
        currentSeconds: 104,
        previousSeconds: 35,
      },
    },

    // Page 4 - Google Search Console Overview
    searchConsole: {
      clicks: metric(401, 545),
      impressions: metric(106574, 142581),
      avgCtr: { current: 0.4, previous: 0.4, diffPct: 0, improvement: null, unit: '%' },
      avgPosition: metric(22.9, 27.3, { invert: true }),
    },

    // Page 5 - Search Console Clicks by Device
    deviceClicks: {
      desktop: metric(210, 262),
      mobile: metric(185, 278),
    },

    // Pages 6-8 - Branded vs Non-Branded Queries
    brandQueries: {
      all: {
        brandClicks: metric(148, 144),
        nonBrandClicks: metric(253, 401),
        brandImpressions: metric(712, 910),
        nonBrandImpressions: metric(105862, 141671),
      },
      desktop: {
        brandClicks: metric(78, 83),
        nonBrandClicks: metric(132, 179),
        brandImpressions: metric(336, 355),
        nonBrandImpressions: metric(61824, 88418),
      },
      mobile: {
        brandClicks: metric(70, 61),
        nonBrandClicks: metric(115, 217),
        brandImpressions: metric(374, 545),
        nonBrandImpressions: metric(43443, 52353),
      },
    },

    // Page 13 - Top Performing Keywords for Sep 2026 (no Aug ranking supplied)
    keywordRankings: [
      { keyword: 'asko appliance repair', position: 1 },
      { keyword: 'scotsman appliance repair', position: 1 },
      { keyword: 'jennair appliance repair', position: 1 },
      { keyword: 'microwave repair', position: 1 },
      { keyword: 'viking appliance repair', position: 3 },
      { keyword: 'kitchenaid appliance repair', position: 3 },
      { keyword: 'thermador appliance repair', position: 3 },
      { keyword: 'miele appliance repair', position: 4 },
      { keyword: 'hotpoint appliance repair', position: 5 },
      { keyword: 'sub zero appliance repair', position: 5 },
      { keyword: 'local appliance repair', position: 5 },
      { keyword: 'bosch appliance repair', position: 6 },
      { keyword: 'wolf appliance repair', position: 6 },
      { keyword: 'electrolux appliance repair', position: 7 },
      { keyword: 'lg appliance repair', position: 8 },
      { keyword: 'home appliance repair', position: 8 },
      { keyword: 'appliance repair service', position: 9 },
    ],

    // Page 9 - AI Citations. The numbers are embedded in a screenshot image
    // (not selectable PDF text), extracted here via image inspection and
    // cross-checked against the rendered page at uploads/pages/page-09.png.
    aiCitations: {
      pdfPage: 9,
      hasNumericData: true,
      sourceNote: 'Values read from an embedded "AI Search" visibility screenshot on this page; no source URLs are printed, only mention/citation counts per engine.',
      august: {
        aiVisibilityScore: 20,
        mentions: 18,
        citedPages: 123,
        engines: [
          { engine: 'ChatGPT', mentions: 6, citedPages: 21 },
          { engine: 'Google AI Overview', mentions: 1, citedPages: 71 },
          { engine: 'Google AI Mode', mentions: 1, citedPages: 80 },
          { engine: 'Gemini', mentions: 10, citedPages: 4 },
        ],
      },
      september: {
        aiVisibilityScore: 18,
        mentions: 11,
        citedPages: 156,
        engines: [
          { engine: 'ChatGPT', mentions: 2, citedPages: 4 },
          { engine: 'Google AI Overview', mentions: 2, citedPages: 65 },
          { engine: 'Google AI Mode', mentions: 1, citedPages: 109 },
          { engine: 'Gemini', mentions: 6, citedPages: 7 },
        ],
      },
    },

    // Page 10 - Activities Done For The Month Of September
    seoActivities: {
      onsiteBlogPosts: [
        'https://appliancecareofatlanta.com/blog/clogged-dryer-vent-signs/',
        'https://appliancecareofatlanta.com/blog/appliance-keeps-tripping-breaker/',
        'https://appliancecareofatlanta.com/blog/gas-stove-not-working-10-causes-and-fixes/',
        'https://appliancecareofatlanta.com/blog/why-is-my-dishwasher-leaving-water-in-bottom/',
        'https://appliancecareofatlanta.com/blog/why-is-my-washing-machine-shaking-so-much/',
        'https://appliancecareofatlanta.com/blog/dishwasher-smells-bad-after-cleaning/',
        'https://appliancecareofatlanta.com/blog/why-is-my-dryer-taking-2-cycles-to-dry-clothes/',
        'https://appliancecareofatlanta.com/blog/ge-refrigerator-error-codes/',
      ],
      offsiteBlogPosts: [
        'https://medium.com/@appliancecareofatlanta/why-appliances-keep-tripping-circuit-breakers-causes-warning-signs-solutions-a3d1042a69c4',
        'https://writeupcafe.com/why-is-my-dishwasher-beeping-9-causes-and-fixes',
        'https://blogmrworld.com/best-washers-to-buy-and-worst-to-avoid-2026',
        'https://appliancecareofatlanta0.blogspot.com/2026/09/why-does-my-dryer-take-2-hours-to-dry.html',
        'https://www.tumblr.com/appliancecareofatlanta0/827731168705363968/why-is-my-refrigerator-leaking-water-9-common',
        'https://joripress.com/refrigerator-making-clicking-noise',
      ],
      offPageActivities: [
        { type: 'Classified', count: 53 },
        { type: 'Listing', count: 5 },
        { type: 'Profile', count: 5 },
        { type: 'Infographic', count: 35 },
        { type: 'Pinterest', count: 12 },
        { type: 'Blog Promotion', count: 208 },
        { type: 'Blogs', count: 6 },
        { type: 'Quora', count: 5 },
        { type: 'Pdf Submission', count: 10 },
        { type: 'Video Submission', count: 6 },
      ],
    },

    // Page 11 - Changes Done For The Month Of September (Technical SEO)
    technicalSeo: {
      completedChanges: [
        'Fixed LCP issue to improve page loading performance.',
        'Updated Multiple Schema for better review visibility.',
        'Added/optimized Alt Tags for Multiple images.',
        'Fixed non-sequential H2 headings across 78 pages.',
        'Updated meta titles and descriptions with proper H1 for 18 category pages.',
        'Updated FAQ Schema on 7 remaining blog posts.',
        'Improved overall on-page and technical SEO structure.',
        'Created Category page.',
        'On Page Blogs Optimized.',
        'Updated Location pages content.',
        'Internal linking Updated on Multiple Pages.',
        'Fixed Cannibalization Issues for Blogs.',
        'Broken Links Fixed.',
      ],
    },

    // Pages 14-44 - Grid My Business Visibility (31 local rank-tracking
    // grids). The keyword label and rank-tracker numbers are embedded in a
    // screenshot image on each page (not selectable PDF text); extracted
    // here via image inspection and cross-checked against the rendered
    // pages at uploads/pages/page-NN.png. SoLV = Share of Local Voice.
    localSeo: {
      description:
        'Grid My Business Visibility is a local rank-tracking tool that helps businesses monitor their Google My Business (GMB) ranking performance in a visually intuitive way.',
      grids: [
        { pdfPage: 14, keyword: 'dishwasher repair alpharetta', aug: { avgRank: 1.8, top3: 79, top4to10: 2, top11to20: 0, solv: 97.5 }, sep: { avgRank: 2.8, top3: 65, top4to10: 16, top11to20: 0, solv: 80.2 } },
        { pdfPage: 15, keyword: 'refrigerator repair alpharetta', aug: { avgRank: 1.8, top3: 77, top4to10: 4, top11to20: 0, solv: 95.1 }, sep: { avgRank: 3.3, top3: 57, top4to10: 24, top11to20: 0, solv: 70.4 } },
        { pdfPage: 16, keyword: 'wine cooler repair alpharetta', aug: { avgRank: 1.8, top3: 77, top4to10: 4, top11to20: 0, solv: 95.1 }, sep: { avgRank: 3.0, top3: 62, top4to10: 19, top11to20: 0, solv: 76.5 } },
        { pdfPage: 17, keyword: 'built in refrigerator repair alpharetta', aug: { avgRank: 1.9, top3: 80, top4to10: 1, top11to20: 0, solv: 98.8 }, sep: { avgRank: 2.4, top3: 79, top4to10: 2, top11to20: 0, solv: 97.5 } },
        { pdfPage: 18, keyword: 'washing machine repair alpharetta', aug: { avgRank: 2.6, top3: 67, top4to10: 14, top11to20: 0, solv: 82.7 }, sep: { avgRank: 3.5, top3: 48, top4to10: 33, top11to20: 0, solv: 59.3 } },
        { pdfPage: 19, keyword: 'ice machine repair alpharetta', aug: { avgRank: 3.0, top3: 59, top4to10: 22, top11to20: 0, solv: 72.8 }, sep: { avgRank: 4.3, top3: 14, top4to10: 67, top11to20: 0, solv: 17.3 } },
        { pdfPage: 20, keyword: 'freezer repair alpharetta', aug: { avgRank: 2.4, top3: 67, top4to10: 14, top11to20: 0, solv: 82.7 }, sep: { avgRank: 4.0, top3: 35, top4to10: 46, top11to20: 0, solv: 43.2 } },
        { pdfPage: 21, keyword: 'over repair alpharetta', aug: { avgRank: 2.0, top3: 81, top4to10: 0, top11to20: 0, solv: 100.0 }, sep: { avgRank: 3.6, top3: 36, top4to10: 45, top11to20: 0, solv: 44.4 } },
        { pdfPage: 22, keyword: 'dryer repair alpharetta', aug: { avgRank: 2.6, top3: 72, top4to10: 9, top11to20: 0, solv: 88.9 }, sep: { avgRank: 4.1, top3: 8, top4to10: 73, top11to20: 0, solv: 9.9 } },
        { pdfPage: 23, keyword: 'stove repair alpharetta', aug: { avgRank: 2.1, top3: 79, top4to10: 2, top11to20: 0, solv: 97.5 }, sep: { avgRank: 3.6, top3: 36, top4to10: 45, top11to20: 0, solv: 44.4 } },
        { pdfPage: 24, keyword: 'commercial oven and range repair alpharetta', aug: { avgRank: 2.5, top3: 69, top4to10: 12, top11to20: 0, solv: 85.2 }, sep: { avgRank: 3.6, top3: 51, top4to10: 30, top11to20: 0, solv: 63.0 } },
        { pdfPage: 25, keyword: 'microwave repair alpharetta', aug: { avgRank: 2.9, top3: 64, top4to10: 17, top11to20: 0, solv: 79.0 }, sep: { avgRank: 3.8, top3: 29, top4to10: 52, top11to20: 0, solv: 35.8 } },
        { pdfPage: 26, keyword: 'range hood repair alpharetta', aug: { avgRank: 3.6, top3: 42, top4to10: 39, top11to20: 0, solv: 51.9 }, sep: { avgRank: 5.0, top3: 3, top4to10: 78, top11to20: 0, solv: 3.7 } },
        { pdfPage: 27, keyword: 'commercial refrigerator repair alpharetta', aug: { avgRank: 3.7, top3: 38, top4to10: 43, top11to20: 0, solv: 46.9 }, sep: { avgRank: 3.8, top3: 34, top4to10: 47, top11to20: 0, solv: 42.0 } },
        { pdfPage: 28, keyword: 'ice maker repair alpharetta', aug: { avgRank: 2.7, top3: 62, top4to10: 19, top11to20: 0, solv: 76.5 }, sep: { avgRank: 3.6, top3: 38, top4to10: 43, top11to20: 0, solv: 46.9 } },
        { pdfPage: 29, keyword: 'trash compactor repair alpharetta', aug: { avgRank: 4.3, top3: 15, top4to10: 66, top11to20: 0, solv: 18.5 }, sep: { avgRank: 9.8, top3: 46, top4to10: 0, top11to20: 0, solv: 56.8 } },
        { pdfPage: 30, keyword: 'garbage disposal repair alpharetta', aug: { avgRank: 17.9, top3: 0, top4to10: 5, top11to20: 37, solv: 0.0 }, sep: { avgRank: 16.9, top3: 0, top4to10: 7, top11to20: 45, solv: 0.0 } },
        { pdfPage: 31, keyword: 'wine cooler repair', aug: { avgRank: 10.4, top3: 11, top4to10: 35, top11to20: 28, solv: 13.6 }, sep: { avgRank: 11.7, top3: 6, top4to10: 26, top11to20: 39, solv: 7.4 } },
        { pdfPage: 32, keyword: 'trash compactor repair', aug: { avgRank: 7.3, top3: 30, top4to10: 37, top11to20: 1, solv: 37.0 }, sep: { avgRank: 7.3, top3: 21, top4to10: 46, top11to20: 5, solv: 25.9 } },
        { pdfPage: 33, keyword: 'range hood repair', aug: { avgRank: 10.9, top3: 12, top4to10: 29, top11to20: 30, solv: 14.8 }, sep: { avgRank: 11.5, top3: 13, top4to10: 23, top11to20: 34, solv: 16.0 } },
        { pdfPage: 34, keyword: 'built in refrigerator repair', aug: { avgRank: 13.4, top3: 13, top4to10: 16, top11to20: 25, solv: 16.0 }, sep: { avgRank: 14.4, top3: 10, top4to10: 15, top11to20: 22, solv: 12.3 } },
        { pdfPage: 35, keyword: 'microwave repair', aug: { avgRank: 12.6, top3: 15, top4to10: 16, top11to20: 24, solv: 18.5 }, sep: { avgRank: 13.7, top3: 12, top4to10: 17, top11to20: 23, solv: 14.8 } },
        { pdfPage: 36, keyword: 'over repair', aug: { avgRank: 12.8, top3: 19, top4to10: 15, top11to20: 16, solv: 23.5 }, sep: { avgRank: 12.1, top3: 17, top4to10: 20, top11to20: 20, solv: 21.0 } },
        { pdfPage: 37, keyword: 'washing machine repair', aug: { avgRank: 13.4, top3: 15, top4to10: 15, top11to20: 20, solv: 18.5 }, sep: { avgRank: 14.0, top3: 14, top4to10: 13, top11to20: 20, solv: 17.3 } },
        { pdfPage: 38, keyword: 'dryer repair', aug: { avgRank: 13.3, top3: 13, top4to10: 17, top11to20: 20, solv: 16.0 }, sep: { avgRank: 14.5, top3: 10, top4to10: 16, top11to20: 19, solv: 12.3 } },
        { pdfPage: 39, keyword: 'stove repair', aug: { avgRank: 13.6, top3: 13, top4to10: 16, top11to20: 22, solv: 16.0 }, sep: { avgRank: 14.0, top3: 12, top4to10: 15, top11to20: 20, solv: 14.8 } },
        { pdfPage: 40, keyword: 'ice maker repair', aug: { avgRank: 12.2, top3: 16, top4to10: 17, top11to20: 27, solv: 19.8 }, sep: { avgRank: 13.1, top3: 15, top4to10: 16, top11to20: 26, solv: 18.5 } },
        { pdfPage: 41, keyword: 'dishwasher repair', aug: { avgRank: 13.9, top3: 12, top4to10: 17, top11to20: 21, solv: 14.8 }, sep: { avgRank: 15.0, top3: 10, top4to10: 14, top11to20: 18, solv: 12.3 } },
        { pdfPage: 42, keyword: 'freezer repair', aug: { avgRank: 15.7, top3: 8, top4to10: 14, top11to20: 17, solv: 9.9 }, sep: { avgRank: 17.0, top3: 4, top4to10: 11, top11to20: 16, solv: 4.9 } },
        { pdfPage: 43, keyword: 'refrigerator repair', aug: { avgRank: 14.9, top3: 11, top4to10: 13, top11to20: 19, solv: 13.6 }, sep: { avgRank: 15.9, top3: 8, top4to10: 12, top11to20: 15, solv: 9.9 } },
        { pdfPage: 44, keyword: 'commercial refrigerator repair', aug: { avgRank: 16.3, top3: 3, top4to10: 16, top11to20: 17, solv: 3.7 }, sep: { avgRank: 17.2, top3: 3, top4to10: 11, top11to20: 17, solv: 3.7 } },
      ],
    },

    // Page 46 - Backlinks. The metrics table is embedded in a screenshot
    // image (not selectable PDF text); extracted here via image inspection
    // and cross-checked against the rendered page at uploads/pages/page-46.png.
    // Dates as printed on the source table: 31/08/2026 and 30/09/2026.
    backlinks: {
      pdfPage: 46,
      description:
        "A backlinks update typically refers to changes made to how Google's search algorithm evaluates backlinks, which are links from other websites pointing to your website.",
      hasMetrics: true,
      asOf: { previous: '2026-08-31', current: '2026-09-30' },
      metrics: {
        domainAuthority: metric(24, 23),
        pageAuthority: metric(39, 38),
        totalBacklinks: metric(5679, 2352),
        referringDomains: metric(747, 447),
        dofollow: metric(1673, 1136),
        nofollow: metric(3784, 1151),
        lostBacklinks: { current: 129, previous: 23, diffPct: diffPct(129, 23), improvement: false },
        organicTrafficBacklinkTools: { current: '1.6K', previous: '1.7K', diffPct: diffPct(1.6, 1.7), improvement: false },
      },
    },

    // Page 12 - Key Hits for the month (verbatim) + Page 45 narrative, split
    // into measured observations vs. the report's own hypotheses.
    executiveInsights: {
      hits: [
        'Average Position improved from 27.3 to 22.9.',
        'Brand clicks increased from 61 to 70 on mobile (+14.75%).',
      ],
      observations: [
        'Total website visits dropped from 2,350 to 1,629 (-30.68%).',
        'Organic traffic fell from 723 to 469 visits (-35.13%).',
        'Direct visits (typed URL / saved link) fell by approximately 29%.',
        'Branded searches for "Appliance Care of Atlanta" fell by approximately 22%.',
        'Average search position improved from 27.3 to 22.9 despite the traffic decline.',
        'Mobile non-brand clicks fell sharply (217 to 115, -47.00%).',
      ],
      hypotheses: [
        'Direct and branded-search declines do not depend on Google rankings, suggesting fewer people were searching for appliance repair in September overall rather than a ranking-specific loss.',
        'Appliance repair demand is seasonal: refrigerators, freezers and ice makers work hardest in August heat, so repair calls typically peak then and slow as weather cools.',
        'Google began a spam update on September 24, 2026 that was still rolling out as of this report; industry-wide ranking movement in the last week of the month may be partly reflected in these numbers. The report treats this as a correlation being monitored, not a confirmed cause of the traffic decline.',
      ],
      octoberPriorities: [
        'Focus on recovering declining organic traffic by optimizing pages with significant drops in clicks, impressions, and rankings.',
        'Strengthen AI Overview visibility with concise answers, FAQs, entity optimization, and search-intent-focused content.',
        'Refresh declining pages with updated information, improved topical coverage, relevant keywords, and stronger internal linking.',
        'Optimize high-impression, low-click queries by improving titles, meta descriptions, content structure, and CTR.',
        'Audit technical and content issues affecting visibility, while monitoring GSC, GA4, rankings, and AI visibility weekly for corrective actions.',
      ],
      googleUpdate: {
        name: 'Google spam update',
        startDate: '2026-09-24',
        status: 'Rollout in progress at the time of this report',
      },
    },

    meta: {
      pdfPagesExtracted: totalPages,
      verifiedSections: [
        'traffic', 'searchConsole', 'deviceClicks', 'brandQueries',
        'keywordRankings', 'seoActivities', 'technicalSeo', 'executiveInsights',
      ],
      imageExtractedSections: [
        'aiCitations (read from an embedded AI Search screenshot via image inspection, page 9)',
        'backlinks (read from an embedded metrics table screenshot via image inspection, page 46)',
        'localSeo (keyword + rank numbers read from 31 embedded Grid My Business screenshots via image inspection, pages 14-44)',
      ],
      unverifiedOrMissing: [
        'AI Citations has no source URLs for individual citations, only per-engine counts.',
        'Backlinks has no list of individual referring domains or lost/gained link URLs, only aggregate counts.',
      ],
    },
  };
}
