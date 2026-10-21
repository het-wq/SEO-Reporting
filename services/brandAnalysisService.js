import { google } from 'googleapis';

const calcDiff = (curr, prev) => {
  if (prev === 0 || !prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 10000) / 100;
};

export const parseBrandTerms = (termsInput) => {
  if (Array.isArray(termsInput) && termsInput.length > 0) {
    return termsInput.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }

  const envTerms = process.env.BRAND_KEYWORDS;
  if (envTerms) {
    return envTerms.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  return [
    'boulder decision',
    'boulder decisions',
    'boulderdecision',
    'boulderdecisions',
    'boulder decision analytics',
  ];
};

export const parseNonBrandTerms = (termsInput) => {
  if (Array.isArray(termsInput) && termsInput.length > 0) {
    return termsInput.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }

  const envTerms = process.env.NON_BRAND_KEYWORDS;
  if (envTerms) {
    return envTerms.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  return [];
};

export const isBrandQuery = (query, brandTerms = [], nonBrandTerms = []) => {
  if (!query) return false;
  const q = String(query).toLowerCase().trim();
  // If explicitly listed in nonBrandTerms, classify as non-brand
  if (Array.isArray(nonBrandTerms) && nonBrandTerms.some((term) => q.includes(term))) {
    return false;
  }
  return Array.isArray(brandTerms) && brandTerms.some((term) => q.includes(term));
};

/**
 * Calculates live Brand vs Non-Brand Search Console metrics across devices
 */
export const getBrandAnalysis = async ({
  auth,
  siteUrl,
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  brandTerms: userTerms,
  nonBrandTerms: userNonBrandTerms,
}) => {
  if (!auth) throw new Error('Not authenticated with Google');
  if (!siteUrl) throw new Error('Search Console siteUrl is required');

  const brandTerms = parseBrandTerms(userTerms);
  const nonBrandTerms = parseNonBrandTerms(userNonBrandTerms);
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Query with dimensions ['query', 'device']
  const currentReq = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'device'],
      rowLimit: 1000,
    },
  });

  const prevReq = (prevStartDate && prevEndDate)
    ? searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: prevStartDate,
          endDate: prevEndDate,
          dimensions: ['query', 'device'],
          rowLimit: 1000,
        },
      }).catch(() => ({ data: { rows: [] } }))
    : Promise.resolve({ data: { rows: [] } });

  const [currentRes, prevRes] = await Promise.all([currentReq, prevReq]);

  const cRows = currentRes.data.rows || [];
  const pRows = prevRes.data.rows || [];

  // Aggregation buckets
  const createBucket = () => ({
    brandClicks: 0,
    nonBrandClicks: 0,
    brandImpressions: 0,
    nonBrandImpressions: 0,
  });

  const currentStats = {
    all: createBucket(),
    desktop: createBucket(),
    mobile: createBucket(),
  };

  const prevStats = {
    all: createBucket(),
    desktop: createBucket(),
    mobile: createBucket(),
  };

  const brandQueriesMap = new Map();
  const nonBrandQueriesMap = new Map();

  // Process current period rows
  cRows.forEach((row) => {
    const query = row.keys?.[0] || '';
    const device = (row.keys?.[1] || '').toLowerCase();
    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const isBrand = isBrandQuery(query, brandTerms, nonBrandTerms);

    // Aggregate overall
    if (isBrand) {
      currentStats.all.brandClicks += clicks;
      currentStats.all.brandImpressions += impressions;
    } else {
      currentStats.all.nonBrandClicks += clicks;
      currentStats.all.nonBrandImpressions += impressions;
    }

    // Aggregate by device
    if (device === 'desktop') {
      if (isBrand) {
        currentStats.desktop.brandClicks += clicks;
        currentStats.desktop.brandImpressions += impressions;
      } else {
        currentStats.desktop.nonBrandClicks += clicks;
        currentStats.desktop.nonBrandImpressions += impressions;
      }
    } else if (device === 'mobile') {
      if (isBrand) {
        currentStats.mobile.brandClicks += clicks;
        currentStats.mobile.brandImpressions += impressions;
      } else {
        currentStats.mobile.nonBrandClicks += clicks;
        currentStats.mobile.nonBrandImpressions += impressions;
      }
    }

    // Record for top query tables
    const targetMap = isBrand ? brandQueriesMap : nonBrandQueriesMap;
    const existing = targetMap.get(query) || { query, clicks: 0, impressions: 0, positionSum: 0, count: 0 };
    existing.clicks += clicks;
    existing.impressions += impressions;
    existing.positionSum += (row.position || 0) * impressions;
    existing.count += 1;
    targetMap.set(query, existing);
  });

  // Process previous period rows
  pRows.forEach((row) => {
    const query = row.keys?.[0] || '';
    const device = (row.keys?.[1] || '').toLowerCase();
    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const isBrand = isBrandQuery(query, brandTerms, nonBrandTerms);

    if (isBrand) {
      prevStats.all.brandClicks += clicks;
      prevStats.all.brandImpressions += impressions;
    } else {
      prevStats.all.nonBrandClicks += clicks;
      prevStats.all.nonBrandImpressions += impressions;
    }

    if (device === 'desktop') {
      if (isBrand) {
        prevStats.desktop.brandClicks += clicks;
        prevStats.desktop.brandImpressions += impressions;
      } else {
        prevStats.desktop.nonBrandClicks += clicks;
        prevStats.desktop.nonBrandImpressions += impressions;
      }
    } else if (device === 'mobile') {
      if (isBrand) {
        prevStats.mobile.brandClicks += clicks;
        prevStats.mobile.brandImpressions += impressions;
      } else {
        prevStats.mobile.nonBrandClicks += clicks;
        prevStats.mobile.nonBrandImpressions += impressions;
      }
    }
  });

  const formatSection = (curr, prev) => ({
    brandClicks: {
      current: curr.brandClicks,
      previous: prev.brandClicks,
      diffPct: calcDiff(curr.brandClicks, prev.brandClicks),
      improvement: curr.brandClicks >= prev.brandClicks,
    },
    nonBrandClicks: {
      current: curr.nonBrandClicks,
      previous: prev.nonBrandClicks,
      diffPct: calcDiff(curr.nonBrandClicks, prev.nonBrandClicks),
      improvement: curr.nonBrandClicks >= prev.nonBrandClicks,
    },
    brandImpressions: {
      current: curr.brandImpressions,
      previous: prev.brandImpressions,
      diffPct: calcDiff(curr.brandImpressions, prev.brandImpressions),
      improvement: curr.brandImpressions >= prev.brandImpressions,
    },
    nonBrandImpressions: {
      current: curr.nonBrandImpressions,
      previous: prev.nonBrandImpressions,
      diffPct: calcDiff(curr.nonBrandImpressions, prev.nonBrandImpressions),
      improvement: curr.nonBrandImpressions >= prev.nonBrandImpressions,
    },
  });

  const mapQueryList = (map) =>
    Array.from(map.values())
      .map((q) => {
        const avgPos = q.impressions > 0 ? q.positionSum / q.impressions : 0;
        const ctr = q.impressions > 0 ? (q.clicks / q.impressions) * 100 : 0;
        return {
          query: q.query,
          clicks: q.clicks,
          impressions: q.impressions,
          ctr: ctr.toFixed(2) + '%',
          position: Math.round(avgPos * 10) / 10,
        };
      })
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
      .slice(0, 50);

  return {
    source: 'Google Search Console (Brand vs Non-Brand Engine)',
    brandTerms,
    nonBrandTerms,
    totalRowsAnalyzed: cRows.length,
    brandQueryCount: brandQueriesMap.size,
    nonBrandQueryCount: nonBrandQueriesMap.size,
    all: formatSection(currentStats.all, prevStats.all),
    desktop: formatSection(currentStats.desktop, prevStats.desktop),
    mobile: formatSection(currentStats.mobile, prevStats.mobile),
    topBrandQueries: mapQueryList(brandQueriesMap),
    topNonBrandQueries: mapQueryList(nonBrandQueriesMap),
  };
};
