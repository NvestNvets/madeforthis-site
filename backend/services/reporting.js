const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const delta = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - delta);
  return d;
};

const startOfMonth = (date) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const isInRange = (value, from) => {
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t >= from.getTime();
};

const countBy = (rows, getter) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = getter(row);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
};

const summarizeRevenueByProduct = (purchases, products) => {
  const rows = {};
  purchases.forEach((purchase) => {
    const productKey = String(purchase.productKey || '').trim() || 'unknown';
    const product = products[productKey] || {};
    const cents = Number(purchase.amountCents || product.priceAmountCents || 0);
    if (!rows[productKey]) {
      rows[productKey] = {
        productKey,
        title: product.title || productKey,
        purchases: 0,
        revenueCents: 0,
      };
    }
    rows[productKey].purchases += 1;
    rows[productKey].revenueCents += cents;
  });
  return Object.values(rows).sort((a, b) => b.revenueCents - a.revenueCents);
};

const topPageFromViews = (pageViews, matcher) => {
  const hits = countBy(pageViews.filter((row) => matcher(row)), (row) => row.params?.page_path || row.params?.page_location || '');
  return hits[0] || null;
};

const buildReportingSummary = ({
  events = [],
  leads = [],
  purchases = [],
  products = {},
  providerStatus = {},
  remote = {},
}) => {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);

  const todayEvents = events.filter((row) => isInRange(row.createdAt, today));
  const weekEvents = events.filter((row) => isInRange(row.createdAt, week));
  const monthEvents = events.filter((row) => isInRange(row.createdAt, month));
  const pageViews = monthEvents.filter((row) => row.eventName === 'page_view');
  const todayPageViews = todayEvents.filter((row) => row.eventName === 'page_view');
  const todaySignups = todayEvents.filter((row) => row.eventName === 'lead_signup_completed');
  const todayDownloads = todayEvents.filter((row) => row.eventName === 'free_bundle_downloaded');
  const todayPurchases = todayEvents.filter((row) => row.eventName === 'purchase_completed');
  const weekCheckouts = weekEvents.filter((row) => row.eventName === 'checkout_started').length;
  const weekPurchases = weekEvents.filter((row) => row.eventName === 'purchase_completed').length;
  const monthRevenueByProduct = summarizeRevenueByProduct(purchases.filter((row) => isInRange(row.createdAt, month)), products);
  const monthRevenueCents = monthRevenueByProduct.reduce((sum, row) => sum + row.revenueCents, 0);
  const monthSignups = leads.filter((row) => isInRange(row.createdAt, month)).length;
  const topLandingPages = countBy(pageViews, (row) => row.params?.page_path || row.params?.page_location || '').slice(0, 5);
  const topReferralSources = countBy(pageViews, (row) => row.params?.traffic_source || row.params?.source || row.params?.referrer || '').slice(0, 5);
  const signupForms = countBy(monthEvents.filter((row) => row.eventName === 'lead_signup_completed'), (row) => row.params?.form_name || row.params?.source || 'website').slice(0, 5);
  const recentRealtimeUsers = new Set(
    events
      .filter((row) => {
        const created = new Date(row.createdAt).getTime();
        return Number.isFinite(created) && created >= Date.now() - 5 * 60 * 1000;
      })
      .map((row) => row.clientId)
      .filter(Boolean)
  ).size;

  const trafficSessions = new Set(pageViews.map((row) => row.sessionId).filter(Boolean)).size;
  const trafficUsers = new Set(pageViews.map((row) => row.clientId).filter(Boolean)).size;
  const topBlogPost = topPageFromViews(pageViews, (row) => /post-|why-i-started|blog/.test(row.params?.page_path || ''));
  const topPrintablePage = topPageFromViews(pageViews, (row) => /printable|bundle|live-printables|codee-live-printables/.test(row.params?.page_path || row.params?.page_location || ''));
  const bestSource = topReferralSources[0] || null;
  const socialTopPost = ((remote.metricool || {}).topPosts || [])[0] || null;
  const useRemoteStripe = Boolean(remote.stripe?.scoped);
  const useRemoteBrevo = Boolean(remote.brevo?.scoped);
  const effectiveRevenueByProduct =
    useRemoteStripe && Array.isArray(remote.stripe?.revenueByProduct) && remote.stripe.revenueByProduct.length
      ? remote.stripe.revenueByProduct
      : monthRevenueByProduct;
  const effectiveRevenueCents = Number(useRemoteStripe ? remote.stripe?.revenueCents || 0 : monthRevenueCents);
  const effectiveSignups = Number(useRemoteBrevo ? remote.brevo?.newSubscribers || 0 : monthSignups);
  const topProduct = effectiveRevenueByProduct[0] || null;
  const landingConversions = pageViews.length ? Math.round((effectiveSignups / pageViews.length) * 1000) / 10 : 0;

  return {
    generatedAt: now.toISOString(),
    providerStatus,
    summaryCards: {
      today: {
        visits: todayPageViews.length,
        signups: todaySignups.length,
        downloads: todayDownloads.length,
        purchases: todayPurchases.length,
      },
      thisWeek: {
        topBlogPost: topBlogPost?.label || 'No data yet',
        topPrintablePage: topPrintablePage?.label || 'No data yet',
        bestTrafficSource: bestSource?.label || 'Direct / unknown',
        bestSocialPost: socialTopPost?.title || 'Metricool not connected yet',
      },
      thisMonth: {
        revenueCents: effectiveRevenueCents,
        subscriberGrowth: effectiveSignups,
        searchClicks: Number(remote.searchConsole?.clicks || 0),
        landingPageConversionRate: landingConversions,
        topProduct: topProduct?.title || 'No purchases yet',
      },
    },
    sections: {
      traffic: {
        sessions: Number(remote.ga4?.sessions || trafficSessions),
        users: Number(remote.ga4?.users || trafficUsers),
        pageviews: Number(remote.ga4?.pageviews || pageViews.length),
        topLandingPages: (remote.ga4?.topPages || topLandingPages).slice(0, 5),
        topReferralSources: (remote.ga4?.topSources || topReferralSources).slice(0, 5),
        realtimeVisitors: Number(remote.ga4?.realtimeVisitors || recentRealtimeUsers),
      },
      seo: {
        clicks: Number(remote.searchConsole?.clicks || 0),
        impressions: Number(remote.searchConsole?.impressions || 0),
        ctr: Number(remote.searchConsole?.ctr || 0),
        topQueries: Array.isArray(remote.searchConsole?.topQueries) ? remote.searchConsole.topQueries.slice(0, 5) : [],
        topPages: Array.isArray(remote.searchConsole?.topPages) ? remote.searchConsole.topPages.slice(0, 5) : topLandingPages,
        bestLandingPages: topLandingPages,
      },
      email: {
        newSubscribers: effectiveSignups,
        freeDownloadSignups: leads.length,
        welcomeEmailSends: Number(useRemoteBrevo ? remote.brevo?.welcomeEmailSends || 0 : leads.filter((row) => row.freeDeliveredAt).length),
        topSignupForms: signupForms,
        flowStatus: remote.brevo?.flowStatus || (providerStatus.brevo?.configured ? 'Brevo connected' : 'Brevo credentials missing'),
      },
      sales: {
        purchases: Number(useRemoteStripe ? remote.stripe?.purchases || 0 : purchases.length),
        revenueCents: effectiveRevenueCents,
        revenueByProduct: effectiveRevenueByProduct,
        checkoutStarts: Number(
          useRemoteStripe ? remote.stripe?.checkoutStarts || 0 : monthEvents.filter((row) => row.eventName === 'checkout_started').length
        ),
        checkoutConversionRate: Number(
          useRemoteStripe
            ? remote.stripe?.checkoutConversionRate || 0
            : weekCheckouts
              ? Math.round((weekPurchases / weekCheckouts) * 1000) / 10
              : 0
        ),
        incompleteCheckoutIndicators: Number(
          useRemoteStripe
            ? remote.stripe?.incompleteCheckoutIndicators || 0
            : Math.max(0, monthEvents.filter((row) => row.eventName === 'checkout_started').length - purchases.length)
        ),
      },
      social: {
        performanceByPlatform: Array.isArray(remote.metricool?.platforms) ? remote.metricool.platforms : [],
        topPosts: Array.isArray(remote.metricool?.topPosts) ? remote.metricool.topPosts.slice(0, 5) : [],
        linkClicks: Number(remote.metricool?.linkClicks || 0),
        bestPostingTimes: Array.isArray(remote.metricool?.bestPostingTimes) ? remote.metricool.bestPostingTimes : [],
        followerGrowth: Number(remote.metricool?.followerGrowth || 0),
        flowStatus:
          remote.metricool?.setupHint ||
          remote.metricool?.error ||
          (providerStatus.metricool?.configured ? 'Metricool connected' : 'Metricool credentials missing'),
      },
    },
  };
};

module.exports = {
  buildReportingSummary,
};
