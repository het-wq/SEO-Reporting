// SEO Reporting Data extracted from Monthly SEO Review (July 2026 vs June 2026)
// This structure is designed to match Google Analytics 4, Google Search Console, and Backlink APIs

export const monthlyReports = {
  '2026-07': {
    periodName: 'July 2026',
    previousPeriodName: 'June 2026',
    dateRange: { start: '2026-07-01', end: '2026-07-31' },
    previousDateRange: { start: '2026-06-01', end: '2026-06-30' },
    client: 'MAMA JAN',
    reportTitle: 'Monthly SEO Review - July 2026',

    // 01. Overall Website Traffic (GA Overview)
    gaOverview: [
      { key: 'overall', label: 'Overall Traffic', current: 742, previous: 681, diff: 8.96, unit: '' },
      { key: 'organic', label: 'Organic Traffic', current: 344, previous: 308, diff: 11.69, unit: '' },
      { key: 'direct', label: 'Direct Traffic', current: 398, previous: 373, diff: 6.70, unit: '' },
      { key: 'organic_new_users', label: 'Organic New Users', current: 326, previous: 288, diff: 13.19, unit: '' },
      { key: 'time_on_site', label: 'Time on site (Organic)', current: '1m 50s', previous: '1m 56s', diff: -5.17, unit: '' },
    ],

    // 02. Google Search Console Overview
    gscOverview: [
      { key: 'clicks', label: 'Clicks', current: 307, previous: 261, diff: 17.62, unit: '', invertColor: false },
      { key: 'impressions', label: 'Impressions', current: 9852, previous: 10584, diff: -6.92, unit: '', invertColor: false },
      { key: 'ctr', label: 'Avg CTR', current: '3.10%', previous: '2.50%', diff: 24.00, unit: '', invertColor: false },
      { key: 'position', label: 'Avg Position', current: 9.3, previous: 9.2, diff: -1.08, unit: '', invertColor: true },
    ],

    // 03. Device Based Traffic (Organic)
    deviceTraffic: [
      { device: 'Desktop', current: 116, previous: 108, diff: 7.41 },
      { device: 'Mobile', current: 187, previous: 147, diff: 27.21 },
    ],

    // Branded vs Non-Branded Queries (Total, Desktop, Mobile)
    queryBreakdown: {
      overall: [
        { label: 'Brand Clicks', current: 116, previous: 104, diff: 11.54 },
        { label: 'Non-Brand Clicks', current: 20, previous: 20, diff: 0.00 },
        { label: 'Brand Impressions', current: 2048, previous: 2116, diff: -3.21 },
        { label: 'Non-Brand Impressions', current: 2857, previous: 2970, diff: -3.80 },
      ],
      desktop: [
        { label: 'Brand Clicks', current: 55, previous: 48, diff: 14.58 },
        { label: 'Non-Brand Clicks', current: 9, previous: 15, diff: -40.00 },
        { label: 'Brand Impressions', current: 606, previous: 614, diff: -1.30 },
        { label: 'Non-Brand Impressions', current: 1690, previous: 1600, diff: 5.63 },
      ],
      mobile: [
        { label: 'Brand Clicks', current: 59, previous: 54, diff: 9.26 },
        { label: 'Non-Brand Clicks', current: 11, previous: 5, diff: 120.00 },
        { label: 'Brand Impressions', current: 1399, previous: 1470, diff: -4.83 },
        { label: 'Non-Brand Impressions', current: 1017, previous: 1269, diff: -19.86 },
      ],
    },

    // 04. Top Performing Keywords (for July 2026)
    topKeywords: [
      { keyword: 'vocal coach atlanta', ranking: 5, change: '+2', status: 'Top 5' },
      { keyword: 'atlanta vocal coach', ranking: 9, change: '+1', status: 'Top 10' },
      { keyword: 'voice lessons in atlanta ga', ranking: 13, change: '+4', status: 'Top 20' },
      { keyword: 'voice lessons atlanta ga', ranking: 17, change: '+1', status: 'Top 20' },
      { keyword: 'vocal coaches in atlanta', ranking: 17, change: '+3', status: 'Top 20' },
      { keyword: 'voice lessons in atlanta ga', ranking: 19, change: '0', status: 'Top 20' },
      { keyword: 'voice training in atlanta ga', ranking: 20, change: '+2', status: 'Top 20' },
      { keyword: 'voice teachers atlanta', ranking: 23, change: '-1', status: 'Top 30' },
      { keyword: 'affordable vocal coaching in ga', ranking: 29, change: '+5', status: 'Top 30' },
      { keyword: 'singing lessons atlanta', ranking: 36, change: '+6', status: 'Top 50' },
    ],

    // AI Visibility (LLM Search Engines)
    aiVisibility: {
      summary: {
        score: { current: 24, previous: 30, diff: -20.0 },
        mentions: { current: 33, previous: 31, diff: 6.45 },
        citedPages: { current: 9, previous: 8, diff: 12.5 },
      },
      engines: [
        { engine: 'ChatGPT', currentMentions: 11, previousMentions: 8, currentCited: 9, previousCited: 8 },
        { engine: 'Google AI Overview', currentMentions: 5, previousMentions: 5, currentCited: 1, previousCited: 1 },
        { engine: 'AI Mode', currentMentions: 9, previousMentions: 9, currentCited: 2, previousCited: 2 },
        { engine: 'Gemini', currentMentions: 8, previousMentions: 9, currentCited: 2, previousCited: 2 },
      ],
    },

    // 06. Local SEO Ranking (Grid My Business Visibility)
    localSeo: [
      {
        keyword: 'songwriting coaching atlanta',
        avgRank: { current: 3.9, previous: 2.1 },
        top3: { current: 43, previous: 79 },
        top10: { current: 36, previous: 2 },
        top20: { current: 2, previous: 0 },
        notes: 'Monitored via Grid My Business (GMB) Rank Tracker',
      },
      {
        keyword: 'vocal coaching atlanta',
        avgRank: { current: 12.8, previous: 10.2 },
        top3: { current: 2, previous: 1 },
        top10: { current: 32, previous: 44 },
        top20: { current: 43, previous: 36 },
        notes: 'Monitored via Grid My Business (GMB) Rank Tracker',
      },
    ],

    // 07. Backlinks Update
    backlinks: [
      { metric: 'Domain Authority (DA)', previous: '31', current: '32', diff: '+1' },
      { metric: 'Page Authority (PA)', previous: '38', current: '38', diff: '0' },
      { metric: 'Total Backlinks', previous: '1,502', current: '1,621', diff: '+119' },
      { metric: 'Referring Domains', previous: '364', current: '371', diff: '+7' },
      { metric: 'Dofollow Links', previous: '569', current: '610', diff: '+41' },
      { metric: 'Nofollow Links', previous: '933', current: '1,011', diff: '+78' },
      { metric: 'Lost Backlinks', previous: '80', current: '93', diff: '+13' },
      { metric: 'Organic Traffic (Backlink Tools)', previous: '344', current: '220', diff: '-124' },
    ],

    // 05. Tasks done for the Month (Off-page Activities)
    offPageActivities: [
      { activity: 'Forum Submissions', count: 1, icon: 'MessageSquare' },
      { activity: 'Classified Submissions', count: 4, icon: 'FileText' },
      { activity: 'Business Listings / Citations', count: 16, icon: 'MapPin' },
      { activity: 'Profile Creations', count: 5, icon: 'UserCheck' },
      { activity: 'Quora Answers', count: 7, icon: 'HelpCircle' },
      { activity: 'PR Submissions', count: 2, icon: 'Send' },
      { activity: 'Reddit Posts / Engagements', count: 1, icon: 'Share2' },
    ],

    // Key Hits & Misses & Next Initiatives
    insights: {
      hitsAndMisses: [
        { type: 'hit', text: 'Clicks increased from 261 to 307 (+17.62%)' },
        { type: 'hit', text: 'Overall traffic increased from 681 to 742 (+8.96%)' },
        { type: 'hit', text: 'Organic traffic increased from 308 to 344 (+11.69%)' },
        { type: 'hit', text: 'Organic new users increased from 288 to 326 (+13.19%)' },
        { type: 'miss', text: 'Impressions decreased from 10,584 to 9,852 (-6.92%)' },
      ],
      newInitiatives: [
        'Review pages with declining impressions or clicks and refresh titles, meta headings, or content for August 2026.',
        'Target "songwriting coaching atlanta" local cluster to regain top 3 grid dominance.',
        'Continue building authoritative niche business citations and PR submissions.',
      ],
    },
  },

  '2026-06': {
    periodName: 'June 2026',
    previousPeriodName: 'May 2026',
    dateRange: { start: '2026-06-01', end: '2026-06-30' },
    previousDateRange: { start: '2026-05-01', end: '2026-05-31' },
    client: 'MAMA JAN',
    reportTitle: 'Monthly SEO Review - June 2026',

    gaOverview: [
      { key: 'overall', label: 'Overall Traffic', current: 681, previous: 620, diff: 9.84, unit: '' },
      { key: 'organic', label: 'Organic Traffic', current: 308, previous: 275, diff: 12.00, unit: '' },
      { key: 'direct', label: 'Direct Traffic', current: 373, previous: 345, diff: 8.12, unit: '' },
      { key: 'organic_new_users', label: 'Organic New Users', current: 288, previous: 250, diff: 15.20, unit: '' },
      { key: 'time_on_site', label: 'Time on site (Organic)', current: '1m 56s', previous: '1m 52s', diff: 3.57, unit: '' },
    ],

    gscOverview: [
      { key: 'clicks', label: 'Clicks', current: 261, previous: 230, diff: 13.48, unit: '', invertColor: false },
      { key: 'impressions', label: 'Impressions', current: 10584, previous: 9800, diff: 8.00, unit: '', invertColor: false },
      { key: 'ctr', label: 'Avg CTR', current: '2.50%', previous: '2.35%', diff: 6.38, unit: '', invertColor: false },
      { key: 'position', label: 'Avg Position', current: 9.2, previous: 9.8, diff: 6.12, unit: '', invertColor: true },
    ],

    deviceTraffic: [
      { device: 'Desktop', current: 108, previous: 98, diff: 10.20 },
      { device: 'Mobile', current: 147, previous: 125, diff: 17.60 },
    ],

    queryBreakdown: {
      overall: [
        { label: 'Brand Clicks', current: 104, previous: 95, diff: 9.47 },
        { label: 'Non-Brand Clicks', current: 20, previous: 18, diff: 11.11 },
        { label: 'Brand Impressions', current: 2116, previous: 2005, diff: 5.54 },
        { label: 'Non-Brand Impressions', current: 2970, previous: 2800, diff: 6.07 },
      ],
      desktop: [
        { label: 'Brand Clicks', current: 48, previous: 44, diff: 9.09 },
        { label: 'Non-Brand Clicks', current: 15, previous: 12, diff: 25.00 },
        { label: 'Brand Impressions', current: 614, previous: 590, diff: 4.07 },
        { label: 'Non-Brand Impressions', current: 1600, previous: 1520, diff: 5.26 },
      ],
      mobile: [
        { label: 'Brand Clicks', current: 54, previous: 51, diff: 5.88 },
        { label: 'Non-Brand Clicks', current: 5, previous: 6, diff: -16.67 },
        { label: 'Brand Impressions', current: 1470, previous: 1415, diff: 3.89 },
        { label: 'Non-Brand Impressions', current: 1269, previous: 1280, diff: -0.86 },
      ],
    },

    topKeywords: [
      { keyword: 'vocal coach atlanta', ranking: 7, change: '+1', status: 'Top 10' },
      { keyword: 'atlanta vocal coach', ranking: 10, change: '+2', status: 'Top 10' },
      { keyword: 'voice lessons in atlanta ga', ranking: 17, change: '0', status: 'Top 20' },
      { keyword: 'voice lessons atlanta ga', ranking: 18, change: '+1', status: 'Top 20' },
      { keyword: 'vocal coaches in atlanta', ranking: 20, change: '+2', status: 'Top 20' },
    ],

    aiVisibility: {
      summary: {
        score: { current: 30, previous: 28, diff: 7.14 },
        mentions: { current: 31, previous: 29, diff: 6.90 },
        citedPages: { current: 8, previous: 7, diff: 14.28 },
      },
      engines: [
        { engine: 'ChatGPT', currentMentions: 8, previousMentions: 7, currentCited: 8, previousCited: 7 },
        { engine: 'Google AI Overview', currentMentions: 5, previousMentions: 4, currentCited: 1, previousCited: 1 },
        { engine: 'AI Mode', currentMentions: 9, previousMentions: 9, currentCited: 2, previousCited: 2 },
        { engine: 'Gemini', currentMentions: 9, previousMentions: 9, currentCited: 2, previousCited: 2 },
      ],
    },

    localSeo: [
      {
        keyword: 'songwriting coaching atlanta',
        avgRank: { current: 2.1, previous: 2.4 },
        top3: { current: 79, previous: 72 },
        top10: { current: 2, previous: 5 },
        top20: { current: 0, previous: 1 },
        notes: 'Monitored via Grid My Business (GMB) Rank Tracker',
      },
      {
        keyword: 'vocal coaching atlanta',
        avgRank: { current: 10.2, previous: 11.5 },
        top3: { current: 1, previous: 0 },
        top10: { current: 44, previous: 40 },
        top20: { current: 36, previous: 38 },
        notes: 'Monitored via Grid My Business (GMB) Rank Tracker',
      },
    ],

    backlinks: [
      { metric: 'Domain Authority (DA)', previous: '30', current: '31', diff: '+1' },
      { metric: 'Page Authority (PA)', previous: '37', current: '38', diff: '+1' },
      { metric: 'Total Backlinks', previous: '1,420', current: '1,502', diff: '+82' },
      { metric: 'Referring Domains', previous: '350', current: '364', diff: '+14' },
      { metric: 'Dofollow Links', previous: '530', current: '569', diff: '+39' },
      { metric: 'Nofollow Links', previous: '890', current: '933', diff: '+43' },
      { metric: 'Lost Backlinks', previous: '75', current: '80', diff: '+5' },
      { metric: 'Organic Traffic (Backlink Tools)', previous: '320', current: '344', diff: '+24' },
    ],

    offPageActivities: [
      { activity: 'Forum Submissions', count: 2, icon: 'MessageSquare' },
      { activity: 'Classified Submissions', count: 3, icon: 'FileText' },
      { activity: 'Business Listings / Citations', count: 12, icon: 'MapPin' },
      { activity: 'Profile Creations', count: 4, icon: 'UserCheck' },
      { activity: 'Quora Answers', count: 5, icon: 'HelpCircle' },
      { activity: 'PR Submissions', count: 1, icon: 'Send' },
      { activity: 'Reddit Posts / Engagements', count: 2, icon: 'Share2' },
    ],

    insights: {
      hitsAndMisses: [
        { type: 'hit', text: 'Continuous growth in organic sessions month over month' },
        { type: 'hit', text: 'Top 3 ranking for songwriting coaching in Atlanta metro' },
      ],
      newInitiatives: [
        'Expand off-page citation building to prepare for July review.',
      ],
    },
  },
};
