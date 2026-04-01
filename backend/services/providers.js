const crypto = require('crypto');

const GOOGLE_TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token';
const METADATA_TOKEN_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';

const base64Url = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const toInteger = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sumRows = (rows, key) =>
  (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + Number(row?.[key] || 0), 0);

const mapCountRows = (rows = [], labelKey, countKey = 'count') =>
  rows
    .map((row) => ({
      label: String(row?.[labelKey] || '').trim(),
      count: toInteger(row?.[countKey] || 0),
    }))
    .filter((row) => row.label)
    .sort((a, b) => b.count - a.count);

const mapValueRows = (rows = [], labelKey, valueKey) =>
  rows
    .map((row) => ({
      label: String(row?.[labelKey] || '').trim(),
      value: toInteger(row?.[valueKey] || 0),
    }))
    .filter((row) => row.label)
    .sort((a, b) => b.value - a.value);

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 15000));
  try {
    const headers = { ...(options.headers || {}) };
    let body = options.body;

    if (options.form && !body) {
      body = new URLSearchParams(options.form).toString();
      headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';
    } else if (body && typeof body !== 'string' && !(body instanceof Buffer)) {
      body = JSON.stringify(body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const message =
        (parsed && (parsed.message || parsed.error?.message || parsed.error)) ||
        text ||
        `${response.status} ${response.statusText}`;
      throw new Error(String(message).slice(0, 500));
    }

    return parsed !== null ? parsed : text;
  } finally {
    clearTimeout(timeout);
  }
};

const getGoogleAccessToken = async ({ serviceAccountEmail = '', serviceAccountPrivateKey = '' } = {}) => {
  try {
    const metadata = await fetchJson(METADATA_TOKEN_URL, {
      headers: { 'Metadata-Flavor': 'Google' },
      timeoutMs: 4000,
    });
    if (metadata?.access_token) return metadata.access_token;
  } catch {
    // Fallback to explicit service account JWT below.
  }

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    throw new Error('Google service account credentials are missing');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64Url(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
      ].join(' '),
      aud: GOOGLE_TOKEN_AUDIENCE,
      exp: expiresAt,
      iat: issuedAt,
    })
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claimSet}`);
  signer.end();
  const signature = signer
    .sign(serviceAccountPrivateKey)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const assertion = `${header}.${claimSet}.${signature}`;

  const tokenResponse = await fetchJson(GOOGLE_TOKEN_AUDIENCE, {
    method: 'POST',
    form: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    },
    timeoutMs: 10000,
  });

  if (!tokenResponse?.access_token) {
    throw new Error('Google token response did not include an access token');
  }
  return tokenResponse.access_token;
};

const fetchGa4Report = async ({
  propertyId = '',
  serviceAccountEmail = '',
  serviceAccountPrivateKey = '',
} = {}) => {
  if (!propertyId) {
    return { connected: false, reason: 'missing_property_id', topPages: [], topSources: [] };
  }

  const accessToken = await getGoogleAccessToken({ serviceAccountEmail, serviceAccountPrivateKey });
  const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [overview, pages, sources, realtime] = await Promise.all([
    fetchJson(`${baseUrl}:runReport`, {
      method: 'POST',
      headers,
      body: {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
      },
    }),
    fetchJson(`${baseUrl}:runReport`, {
      method: 'POST',
      headers,
      body: {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      },
    }),
    fetchJson(`${baseUrl}:runReport`, {
      method: 'POST',
      headers,
      body: {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      },
    }),
    fetchJson(`${baseUrl}:runRealtimeReport`, {
      method: 'POST',
      headers,
      body: {
        metrics: [{ name: 'activeUsers' }],
      },
    }).catch(() => ({ rows: [] })),
  ]);

  const overviewRow = (overview?.rows || [])[0];
  const overviewValues = overviewRow?.metricValues || [];

  return {
    connected: true,
    propertyId,
    sessions: toInteger(overviewValues[0]?.value),
    users: toInteger(overviewValues[1]?.value),
    pageviews: toInteger(overviewValues[2]?.value),
    topPages: (pages?.rows || []).map((row) => ({
      label: String(row?.dimensionValues?.[0]?.value || '').trim(),
      count: toInteger(row?.metricValues?.[0]?.value),
    })),
    topSources: (sources?.rows || []).map((row) => ({
      label: String(row?.dimensionValues?.[0]?.value || '').trim(),
      count: toInteger(row?.metricValues?.[0]?.value),
    })),
    realtimeVisitors: toInteger(realtime?.rows?.[0]?.metricValues?.[0]?.value || 0),
  };
};

const fetchSearchConsoleReport = async ({
  siteUrl = '',
  serviceAccountEmail = '',
  serviceAccountPrivateKey = '',
} = {}) => {
  if (!siteUrl) {
    return { connected: false, reason: 'missing_site_url', topQueries: [], topPages: [] };
  }

  const accessToken = await getGoogleAccessToken({ serviceAccountEmail, serviceAccountPrivateKey });
  const targetSite = encodeURIComponent(siteUrl);
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${targetSite}/searchAnalytics/query`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const bodyBase = {
    startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    rowLimit: 5,
  };

  const [queries, pages] = await Promise.all([
    fetchJson(endpoint, {
      method: 'POST',
      headers,
      body: { ...bodyBase, dimensions: ['query'] },
    }),
    fetchJson(endpoint, {
      method: 'POST',
      headers,
      body: { ...bodyBase, dimensions: ['page'] },
    }),
  ]);

  const queryRows = Array.isArray(queries?.rows) ? queries.rows : [];
  const pageRows = Array.isArray(pages?.rows) ? pages.rows : [];
  const clicks = sumRows(queryRows, 'clicks');
  const impressions = sumRows(queryRows, 'impressions');

  return {
    connected: true,
    siteUrl,
    clicks,
    impressions,
    ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
    topQueries: queryRows.map((row) => ({
      label: String(row?.keys?.[0] || '').trim(),
      count: toInteger(row?.clicks),
      impressions: toInteger(row?.impressions),
      ctr: Number(row?.ctr || 0),
    })),
    topPages: pageRows.map((row) => ({
      label: String(row?.keys?.[0] || '').trim(),
      count: toInteger(row?.clicks),
      impressions: toInteger(row?.impressions),
      ctr: Number(row?.ctr || 0),
    })),
  };
};

const fetchStripeReport = async ({ secretKey = '', siteKey = '', productKeys = [] } = {}) => {
  if (!secretKey) {
    return { connected: false, reason: 'missing_secret_key' };
  }

  const monthStart = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
  const url = `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${monthStart}`;
  const response = await fetchJson(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const sessions = Array.isArray(response?.data) ? response.data : [];
  const allowedProducts = new Set((Array.isArray(productKeys) ? productKeys : []).map((item) => String(item || '').trim()).filter(Boolean));
  const scopedSessions = sessions.filter((row) => {
    const sessionSiteKey = String(row?.metadata?.site_key || row?.metadata?.siteKey || '').trim();
    const sessionProductKey = String(
      row?.metadata?.product_key || row?.metadata?.productKey || row?.client_reference_id || ''
    ).trim();
    if (siteKey && sessionSiteKey && sessionSiteKey === siteKey) return true;
    if (sessionProductKey && allowedProducts.has(sessionProductKey)) return true;
    return false;
  });
  const paid = scopedSessions.filter((row) => row?.payment_status === 'paid');
  const incomplete = scopedSessions.filter((row) => row?.status !== 'complete' || row?.payment_status !== 'paid');

  const revenueByProductMap = {};
  paid.forEach((session) => {
    const productKey =
      String(session?.metadata?.product_key || session?.metadata?.productKey || session?.client_reference_id || '').trim() ||
      'unknown';
    if (!revenueByProductMap[productKey]) {
      revenueByProductMap[productKey] = {
        productKey,
        title: productKey,
        purchases: 0,
        revenueCents: 0,
      };
    }
    revenueByProductMap[productKey].purchases += 1;
    revenueByProductMap[productKey].revenueCents += toInteger(session?.amount_total);
  });

  return {
    connected: true,
    scoped: scopedSessions.length > 0,
    purchases: paid.length,
    revenueCents: paid.reduce((sum, row) => sum + toInteger(row?.amount_total), 0),
    checkoutStarts: scopedSessions.length,
    checkoutConversionRate: scopedSessions.length ? Math.round((paid.length / scopedSessions.length) * 1000) / 10 : 0,
    incompleteCheckoutIndicators: incomplete.length,
    revenueByProduct: Object.values(revenueByProductMap).sort((a, b) => b.revenueCents - a.revenueCents),
  };
};

const fetchBrevoReport = async ({ apiKey = '' } = {}) => {
  if (!apiKey) {
    return { connected: false, flowStatus: 'Brevo credentials missing' };
  }

  const headers = { 'api-key': apiKey };
  const contacts = await fetchJson('https://api.brevo.com/v3/contacts?limit=1&offset=0&sort=desc', {
      headers,
    }).catch(() => ({ contacts: [], count: 0 }));

  return {
    connected: true,
    scoped: false,
    contactCount: toInteger(contacts?.count || 0),
    newSubscribers: 0,
    welcomeEmailSends: 0,
    flowStatus: 'Brevo connected for signup and transactional delivery',
    topSignupForms: [],
  };
};

const fetchMetricoolReport = async ({
  apiKey = '',
  userId = '',
  blogId = '',
} = {}) => {
  if (!apiKey) {
    return { connected: false, reason: 'missing_api_key' };
  }
  if (!userId || !blogId) {
    return {
      connected: false,
      reason: 'missing_user_or_blog_id',
      setupHint: 'Add METRICOOL_USER_ID and METRICOOL_BLOG_ID to unlock Metricool analytics rollups.',
      platforms: [],
      topPosts: [],
      linkClicks: 0,
      bestPostingTimes: [],
      followerGrowth: 0,
    };
  }

  const headers = { 'X-Mc-Auth': apiKey };
  const params = new URLSearchParams({ userId: String(userId), blogId: String(blogId) });
  const profiles = await fetchJson(`https://app.metricool.com/api/admin/simpleProfiles?${params.toString()}`, {
    headers,
  });

  const brands = Array.isArray(profiles) ? profiles : [];
  const currentBrand = brands.find((row) => String(row?.id || row?.blogId || '') === String(blogId)) || brands[0] || null;
  const socials = Array.isArray(currentBrand?.connectedSocialNetworks)
    ? currentBrand.connectedSocialNetworks
    : Array.isArray(currentBrand?.socialNetworks)
      ? currentBrand.socialNetworks
      : [];

  return {
    connected: true,
    brands: brands.map((row) => ({
      id: String(row?.id || row?.blogId || '').trim(),
      label: String(row?.name || row?.label || row?.blogName || '').trim(),
    })),
    brandLabel: String(currentBrand?.name || currentBrand?.label || '').trim(),
    performanceByPlatform: socials.map((row) => ({
      label: String(row?.network || row?.name || row?.type || '').trim(),
      count: 1,
    })),
    platforms: socials.map((row) => ({
      label: String(row?.network || row?.name || row?.type || '').trim(),
      count: 1,
    })),
    topPosts: [],
    linkClicks: 0,
    bestPostingTimes: [],
    followerGrowth: 0,
  };
};

module.exports = {
  fetchBrevoReport,
  fetchGa4Report,
  fetchMetricoolReport,
  fetchSearchConsoleReport,
  fetchStripeReport,
};
