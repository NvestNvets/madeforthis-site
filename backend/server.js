const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { normalizeEventPayload, toMeasurementProtocolPayload } = require('./services/events');
const { buildReportingSummary } = require('./services/reporting');
const {
  fetchBrevoReport,
  fetchGa4Report,
  fetchMetricoolReport,
  fetchSearchConsoleReport,
  fetchStripeReport,
} = require('./services/providers');

const PORT = process.env.PORT || 8081;
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@digioffice.shop';
const SITE_CONFIG_FILE = path.join(__dirname, 'site-config.json');
const DATA_DIR = path.join(__dirname, 'data');
const OWNER_SUPPORT_TYPE = 'owner_support';
const OWNER_WELCOME_TYPE = 'owner_welcome';
const GA4_MEASUREMENT_ID = (process.env.GA4_MEASUREMENT_ID || '').trim();
const GA4_API_SECRET = (process.env.GA4_API_SECRET || '').trim();
const GOOGLE_ANALYTICS_PROPERTY_ID = (process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '').trim();
const GOOGLE_SEARCH_CONSOLE_SITE_URL = (process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || '').trim();
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();
const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
const METRICOOL_API_KEY = (process.env.METRICOOL_API_KEY || process.env.METRI_KEY || '').trim();
const METRICOOL_USER_ID = (process.env.METRICOOL_USER_ID || '').trim();
const METRICOOL_BLOG_ID = (process.env.METRICOOL_BLOG_ID || '').trim();
const BREVO_CONTACT_FOLDER_NAME = (process.env.BREVO_CONTACT_FOLDER_NAME || 'Tier 4 Clients').trim();
const GOOGLE_SERVICE_ACCOUNT_EMAIL = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
const DASHBOARD_CACHE_MS = Number(process.env.DASHBOARD_CACHE_MS || 5 * 60 * 1000);
const reportCache = new Map();

const jsonCors = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret'
  });
  res.end(JSON.stringify(body));
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const readJsonFile = (filePath, fallback) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJsonFile = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

const nowIso = () => new Date().toISOString();

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const normalizePath = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.startsWith('/') ? raw : `/${raw}`;
};

const withQueryParams = (urlString, params) => {
  if (!urlString) return '';
  const target = new URL(urlString);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    target.searchParams.set(key, String(value));
  });
  return target.toString();
};

const renderEmailHtml = ({
  brandName,
  logoUrl,
  heading,
  intro,
  paragraphs = [],
  bullets = [],
  ctaLabel = '',
  ctaUrl = '',
  signature = '',
  footer = ''
}) => {
  const bulletHtml = bullets.length
    ? `<ul style="margin:0 0 18px 18px;padding:0;color:#334155;line-height:1.7">${bullets
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`
    : '';
  const bodyHtml = paragraphs
    .map((paragraph) => `<p style="margin:0 0 14px 0;color:#334155;line-height:1.7">${escapeHtml(paragraph)}</p>`)
    .join('');
  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<p style="margin:18px 0 18px 0"><a href="${escapeHtml(
          ctaUrl
        )}" style="display:inline-block;background:#1f2937;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">${escapeHtml(
          ctaLabel
        )}</a></p>`
      : '';

  return [
    '<div style="margin:0;padding:24px;background:#f6f4ef;font-family:Georgia,Times New Roman,serif">',
    '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e7e1d8;border-radius:24px;overflow:hidden">',
    '<div style="padding:28px 28px 22px 28px;background:#f8f5ef;border-bottom:1px solid #ece5da">',
    logoUrl
      ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(
          brandName
        )}" style="max-width:180px;height:auto;display:block;margin:0 0 18px 0" />`
      : '',
    `<p style="margin:0 0 8px 0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8b735f">${escapeHtml(
      brandName
    )}</p>`,
    `<h1 style="margin:0;color:#1f2937;font-size:30px;line-height:1.15">${escapeHtml(heading)}</h1>`,
    intro
      ? `<p style="margin:14px 0 0 0;color:#5b6472;line-height:1.7">${escapeHtml(intro)}</p>`
      : '',
    '</div>',
    '<div style="padding:28px">',
    bodyHtml,
    bulletHtml,
    ctaHtml,
    signature
      ? `<p style="margin:18px 0 0 0;color:#334155;line-height:1.7">${escapeHtml(signature)}</p>`
      : '',
    footer
      ? `<p style="margin:22px 0 0 0;color:#8b98a8;font-size:12px;line-height:1.6">${escapeHtml(footer)}</p>`
      : '',
    '</div>',
    '</div>',
    '</div>'
  ].join('');
};

const fallbackConfig = {
  defaultSiteKey: 'madeforthis',
  sites: {
    madeforthis: {
      brandName: 'Made For This',
      senderName: 'Made For This',
      siteUrl: 'https://madeforthis.web.app',
      supportEmail: 'support@digioffice.shop',
      ownerEmail: 'christinac90@yahoo.com',
      ownerName: 'Nina',
      logoUrl: 'https://madeforthis.web.app/assets/brand/logo-primary.png',
      dashboardUrl: 'https://madeforthis.web.app/dashboard.html',
      supportReplyTo: 'christinac90@yahoo.com',
      latestPostUrl: 'https://madeforthis.web.app/why-i-started-made-for-this',
      latestPostTitle: 'Why I Started Made For This',
      pinterestProfileUrl: 'https://www.pinterest.com/',
      checkChangesUrl: 'https://madeforthis.web.app/',
      nextUploadChecklist: [
        'Upload the final Weekly Reset Bundle PDF and ZIP into the paid bundle bucket folder',
        'Upload the individual free printable PDFs into the free-library folder',
        'Upload the next Pinterest pin image for the latest post',
        'Upload one fresh featured cover image for the next printable or bundle'
      ],
      bucketBasePath: 'gs://clients.digioffice.shop/tier4-clients/madeforthis',
      ownerSupport: {
        enabled: false,
        frequencyDays: 3,
        topics: [
          'weekly reset routines',
          'simple home systems',
          'orthodontic assistant work life',
          'motherhood and ambition',
          'printables that reduce overwhelm',
          'Sunday reset habits'
        ]
      },
      automation: {
        leadFollowupsEnabled: false,
        ownerNotificationsEnabled: false
      },
      products: {
        'free-library': {
          kind: 'lead_magnet',
          title: 'Starter Printable Library',
          description: 'Free printable starter bundle for new subscribers.',
          siteRelativeDownloadPath: '/downloads/made-for-this-starter-printable-library.zip',
          bucketFolder: 'downloads/free-library',
          ctaPath: '/free-library'
        },
        'weekly-reset-bundle': {
          kind: 'paid_bundle',
          title: 'Weekly Reset Bundle',
          description: 'Paid printable bundle with planners, routines, and reset pages.',
          siteRelativeDownloadPath: '/downloads/weekly-reset-bundle.zip',
          bucketFolder: 'downloads/bundles/weekly-reset-bundle',
          productPagePath: '/bundles/weekly-reset-bundle.html',
          checkoutPath: '/bundles/weekly-reset-bundle.html?checkout=manual',
          priceLabel: '$7 launch price',
          priceAmountCents: 700
        }
      }
    }
  }
};

const loadSiteRegistry = () => {
  const disk = readJsonFile(SITE_CONFIG_FILE, null);
  if (!disk || typeof disk !== 'object') return fallbackConfig;
  return {
    defaultSiteKey: disk.defaultSiteKey || fallbackConfig.defaultSiteKey,
    sites: disk.sites && typeof disk.sites === 'object' ? disk.sites : fallbackConfig.sites
  };
};

const siteRegistry = loadSiteRegistry();

const resolveSiteConfig = (siteKey) => {
  const key = String(siteKey || siteRegistry.defaultSiteKey || 'madeforthis').trim();
  const source = siteRegistry.sites[key] || siteRegistry.sites[siteRegistry.defaultSiteKey] || fallbackConfig.sites.madeforthis;
  const siteUrl = normalizeUrl(source.siteUrl || fallbackConfig.sites.madeforthis.siteUrl);
  const ownerSupport = source.ownerSupport || {};
  const products = {};

  Object.entries(source.products || {}).forEach(([productKey, product]) => {
    const downloadUrl =
      product.downloadUrl ||
      (product.siteRelativeDownloadPath ? `${siteUrl}${normalizePath(product.siteRelativeDownloadPath)}` : '');
    const productPageUrl =
      product.productPageUrl ||
      (product.productPagePath ? `${siteUrl}${normalizePath(product.productPagePath)}` : '');
    const checkoutUrl =
      product.checkoutUrl ||
      (product.checkoutPath ? `${siteUrl}${normalizePath(product.checkoutPath)}` : productPageUrl);
    const assetDownloads = Array.isArray(product.assetDownloads)
      ? product.assetDownloads
          .map((asset, index) => {
            const assetDownloadUrl =
              asset.downloadUrl ||
              (asset.siteRelativeDownloadPath ? `${siteUrl}${normalizePath(asset.siteRelativeDownloadPath)}` : '');
            const assetPreviewUrl =
              asset.previewUrl ||
              (asset.previewPath ? `${siteUrl}${normalizePath(asset.previewPath)}` : '');
            return {
              key: asset.key || `asset-${index + 1}`,
              title: asset.title || `Asset ${index + 1}`,
              kind: asset.kind || 'printable',
              description: asset.description || '',
              downloadUrl: assetDownloadUrl,
              previewUrl: assetPreviewUrl
            };
          })
          .filter((asset) => asset.downloadUrl)
      : [];

    products[productKey] = {
      key: productKey,
      kind: product.kind || 'digital_product',
      title: product.title || productKey,
      description: product.description || '',
      downloadUrl,
      productPageUrl,
      checkoutUrl,
      bucketFolder: product.bucketFolder || '',
      priceLabel: product.priceLabel || '',
      priceAmountCents: Number(product.priceAmountCents || 0),
      accessLabel: product.accessLabel || '',
      ctaPath: product.ctaPath || '',
      assetDownloads
    };
  });

  return {
    key,
    brandName: source.brandName || key,
    senderName: source.senderName || source.brandName || key,
    siteUrl,
    supportEmail: source.supportEmail || EMAIL_FROM,
    supportReplyTo: source.supportReplyTo || source.ownerEmail || source.supportEmail || EMAIL_FROM,
    ownerEmail: source.ownerEmail || '',
    ownerName: source.ownerName || source.brandName || key,
    logoUrl: source.logoUrl || '',
    dashboardUrl: source.dashboardUrl || `${siteUrl}/dashboard.html`,
    latestPostUrl: source.latestPostUrl || `${siteUrl}/blog/`,
    latestPostTitle: source.latestPostTitle || 'Latest Post',
    pinterestProfileUrl: source.pinterestProfileUrl || '',
    checkChangesUrl: source.checkChangesUrl || siteUrl,
    nextUploadChecklist: Array.isArray(source.nextUploadChecklist) ? source.nextUploadChecklist : [],
    bucketBasePath: source.bucketBasePath || '',
    ownerSupport: {
      enabled: Boolean(ownerSupport.enabled),
      frequencyDays: Number(ownerSupport.frequencyDays || 3),
      topics: Array.isArray(ownerSupport.topics) ? ownerSupport.topics : []
    },
    automation: {
      leadFollowupsEnabled: Boolean(source.automation?.leadFollowupsEnabled),
      ownerNotificationsEnabled: Boolean(source.automation?.ownerNotificationsEnabled)
    },
    products
  };
};

const getProductConfig = (siteConfig, productKey) => {
  const key = String(productKey || '').trim() || (siteConfig.products['free-library'] ? 'free-library' : Object.keys(siteConfig.products)[0]);
  return siteConfig.products[key] || null;
};

const siteDataFiles = (siteKey) => {
  const base = path.join(DATA_DIR, 'sites', siteKey);
  return {
    base,
    leads: path.join(base, 'leads.json'),
    queue: path.join(base, 'email-queue.json'),
    purchases: path.join(base, 'purchases.json'),
    events: path.join(base, 'events.json'),
    brevo: path.join(base, 'brevo.json')
  };
};

const readSiteFile = (siteKey, type, fallback) => {
  const files = siteDataFiles(siteKey);
  ensureDir(files.base);
  return readJsonFile(files[type], fallback);
};

const writeSiteFile = (siteKey, type, value) => {
  const files = siteDataFiles(siteKey);
  ensureDir(files.base);
  writeJsonFile(files[type], value);
};

const invalidateReportCache = (siteKey) => {
  reportCache.delete(siteKey);
};

const appendSiteEvent = (siteKey, record) => {
  const events = readSiteFile(siteKey, 'events', []);
  events.push(record);
  writeSiteFile(siteKey, 'events', events.slice(-3000));
  invalidateReportCache(siteKey);
};

const providerStatus = () => {
  const googleAuthConfigured = Boolean(
    (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) || process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
  return {
    ga4: {
      configured: Boolean(GA4_MEASUREMENT_ID),
      measurementProtocolReady: Boolean(GA4_MEASUREMENT_ID && GA4_API_SECRET),
      dataApiReady: Boolean(GOOGLE_ANALYTICS_PROPERTY_ID && googleAuthConfigured),
    },
    searchConsole: {
      configured: Boolean(GOOGLE_SEARCH_CONSOLE_SITE_URL),
      apiReady: Boolean(GOOGLE_SEARCH_CONSOLE_SITE_URL && googleAuthConfigured),
    },
    stripe: {
      configured: Boolean(STRIPE_SECRET_KEY),
    },
    brevo: {
      configured: Boolean(BREVO_API_KEY),
    },
    metricool: {
      configured: Boolean(METRICOOL_API_KEY),
      brandReady: Boolean(METRICOOL_API_KEY && METRICOOL_USER_ID && METRICOOL_BLOG_ID),
    },
  };
};

const sendMeasurementProtocolEvent = async (siteKey, record) => {
  const payload = toMeasurementProtocolPayload({
    measurementId: GA4_MEASUREMENT_ID,
    apiSecret: GA4_API_SECRET,
    siteKey,
    record,
  });
  if (!payload) return { ok: false, skipped: true };
  try {
    const response = await fetch(payload.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.body),
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

const recordSiteEvent = async (siteKey, payload) => {
  const record = normalizeEventPayload(payload);
  if (!record) return null;
  appendSiteEvent(siteKey, record);
  const mp = await sendMeasurementProtocolEvent(siteKey, record);
  return { ...record, measurementProtocol: mp };
};

const withProviderError = (label, fallback, error) => ({
  ...fallback,
  connected: false,
  error: `${label}: ${String(error?.message || error || 'unknown error').slice(0, 280)}`,
});

const buildRemoteSections = async (siteConfig) => {
  const googleArgs = {
    serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    serviceAccountPrivateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  };

  const [ga4, searchConsole, stripe, brevo, metricool] = await Promise.all([
    fetchGa4Report({
      propertyId: GOOGLE_ANALYTICS_PROPERTY_ID,
      ...googleArgs,
    }).catch((error) =>
      withProviderError(
        'ga4',
        {
          connected: false,
          propertyId: GOOGLE_ANALYTICS_PROPERTY_ID || '',
          topPages: [],
          topSources: [],
          sessions: 0,
          users: 0,
          pageviews: 0,
          realtimeVisitors: 0,
        },
        error
      )
    ),
    fetchSearchConsoleReport({
      siteUrl: GOOGLE_SEARCH_CONSOLE_SITE_URL || siteConfig.siteUrl,
      ...googleArgs,
    }).catch((error) =>
      withProviderError(
        'search_console',
        {
          connected: false,
          siteUrl: GOOGLE_SEARCH_CONSOLE_SITE_URL || siteConfig.siteUrl,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          topQueries: [],
          topPages: [],
        },
        error
      )
    ),
    fetchStripeReport({
      secretKey: STRIPE_SECRET_KEY,
      siteKey: siteConfig.key,
      productKeys: Object.keys(siteConfig.products || {}),
    }).catch((error) =>
      withProviderError(
        'stripe',
        {
          connected: false,
          purchases: 0,
          revenueCents: 0,
          checkoutStarts: 0,
          checkoutConversionRate: 0,
          incompleteCheckoutIndicators: 0,
          revenueByProduct: [],
        },
        error
      )
    ),
    fetchBrevoReport({ apiKey: BREVO_API_KEY }).catch((error) =>
      withProviderError(
        'brevo',
        {
          connected: false,
          contactCount: 0,
          newSubscribers: 0,
          welcomeEmailSends: 0,
          flowStatus: 'Brevo credentials missing',
          topSignupForms: [],
        },
        error
      )
    ),
    fetchMetricoolReport({
      apiKey: METRICOOL_API_KEY,
      userId: METRICOOL_USER_ID,
      blogId: METRICOOL_BLOG_ID,
    }).catch((error) =>
      withProviderError(
        'metricool',
        {
          connected: false,
          platforms: [],
          topPosts: [],
          linkClicks: 0,
          bestPostingTimes: [],
          followerGrowth: 0,
        },
        error
      )
    ),
  ]);

  return { ga4, searchConsole, stripe, brevo, metricool };
};

const buildDashboardReport = async (siteConfig) => {
  const cached = reportCache.get(siteConfig.key);
  if (cached && Date.now() - cached.createdAt < DASHBOARD_CACHE_MS) {
    return cached.payload;
  }
  const leads = readSiteFile(siteConfig.key, 'leads', []);
  const purchases = readSiteFile(siteConfig.key, 'purchases', []).map((purchase) => ({
    ...purchase,
    amountCents: Number(purchase.amountCents || siteConfig.products[purchase.productKey]?.priceAmountCents || 0),
  }));
  const events = readSiteFile(siteConfig.key, 'events', []);
  const payload = buildReportingSummary({
    events,
    leads,
    purchases,
    products: siteConfig.products,
    providerStatus: providerStatus(),
    remote: await buildRemoteSections(siteConfig),
  });
  reportCache.set(siteConfig.key, { createdAt: Date.now(), payload });
  return payload;
};

const buildOwnerSupportIdeas = (siteConfig, sequence) => {
  const topics = siteConfig.ownerSupport.topics.length
    ? siteConfig.ownerSupport.topics
    : ['simple routines', 'printable offers', 'story-driven blog posts'];
  const startIndex = (sequence * 3) % topics.length;
  return [0, 1, 2].map((offset) => topics[(startIndex + offset) % topics.length]);
};

const emailTemplates = {
  free_delivery: ({ lead, siteConfig, productConfig }) => {
    const subject = `Welcome to ${siteConfig.brandName}`;
    const paragraphs = [
      `Hi${lead.name ? ` ${lead.name}` : ''},`,
      `Welcome to the ${siteConfig.brandName} blog list.`,
      'You were made for this journey.',
      "I'm really glad you're here.",
      'I created these printables because I know how overwhelming life can feel when everything starts piling up: work, home, kids, responsibilities, all of it.',
      'These are simple tools I use to reset, stay organized, and make things feel a little more manageable.'
    ];
    const bullets = [
      'Weekly Reset Planner',
      'Daily Focus Sheet',
      'Habit Tracker',
      'Quiet Time Activity Page',
      'Orthodontic Assistant Quick Reference'
    ];
    const text = [
      paragraphs.join('\n\n'),
      `Download your free printable library:\n${productConfig.downloadUrl}`,
      `Check out my latest post here:\n${siteConfig.latestPostUrl}`,
      `Inside you'll find:\n- ${bullets.join('\n- ')}`,
      "Start simple. You don't need to do everything at once.",
      'Just pick one page and begin there.',
      `- ${siteConfig.ownerName}\n${siteConfig.brandName}`
    ].join('\n\n');
    const html = renderEmailHtml({
        brandName: siteConfig.brandName,
        logoUrl: siteConfig.logoUrl,
        heading: `Welcome to ${siteConfig.brandName}`,
        intro: `Welcome to the ${siteConfig.brandName} blog list. You were made for this journey.`,
        paragraphs,
        bullets,
      ctaLabel: 'Download Your Free Printables',
      ctaUrl: productConfig.downloadUrl,
      signature: `${siteConfig.ownerName}\n${siteConfig.brandName}`,
      footer: `Sent by ${siteConfig.supportEmail} for ${siteConfig.brandName}.`
    });
    return { subject, text, html };
  },
  followup_2: ({ siteConfig }) => {
    const subject = 'This is where most people get stuck';
    const paragraphs = [
      'Hi,',
      "Most people don't struggle because they don't have tools.",
      'They struggle because everything feels like too much at once.',
      'That is why I focus on simple resets instead of trying to fix everything.',
      'Pick one small area this week: your schedule, your home, or your routine.',
      'Use one of the printables and start there.',
      'Small steps build real change.'
    ];
    return {
      subject,
      text: `${paragraphs.join('\n\n')}\n\n- ${siteConfig.ownerName}`,
      html: renderEmailHtml({
        brandName: siteConfig.brandName,
        logoUrl: siteConfig.logoUrl,
        heading: 'This Is Where Most People Get Stuck',
        intro: 'Progress gets easier when the reset is small and clear.',
        paragraphs,
        signature: `${siteConfig.ownerName}\n${siteConfig.brandName}`,
        footer: `Sent by ${siteConfig.supportEmail} for ${siteConfig.brandName}.`
      })
    };
  },
  followup_3: ({ siteConfig, productConfig }) => {
    const subject = 'If you want something more structured';
    const bullets = [
      'weekly and daily planners',
      'cleaning reset checklist',
      'meal planner',
      'budget overview',
      'simple Sunday reset routine'
    ];
    const paragraphs = [
      'Hi,',
      'If the free printables helped even a little, I put together a full system that goes a step further.',
      `It's called the ${productConfig.title}.`,
      'Everything is designed to help you get your life organized without feeling overwhelmed.'
    ];
    return {
      subject,
      text: `${paragraphs.join('\n\n')}\n\nIncludes:\n- ${bullets.join('\n- ')}\n\nView the bundle:\n${
        productConfig.productPageUrl
      }\n\n- ${siteConfig.ownerName}`,
      html: renderEmailHtml({
        brandName: siteConfig.brandName,
        logoUrl: siteConfig.logoUrl,
        heading: 'If You Want Something More Structured',
        intro: `${productConfig.title} was built as the next step after the free library.`,
        paragraphs,
        bullets,
        ctaLabel: `View ${productConfig.title}`,
        ctaUrl: productConfig.productPageUrl,
        signature: `${siteConfig.ownerName}\n${siteConfig.brandName}`,
        footer: `Sent by ${siteConfig.supportEmail} for ${siteConfig.brandName}.`
      })
    };
  },
  purchase_delivery: ({ purchase, siteConfig, productConfig }) => {
    const subject = `Your ${productConfig.title} is Ready`;
    const assetBullets = productConfig.assetDownloads.length
      ? productConfig.assetDownloads.map((asset) => `${asset.title} - ${asset.downloadUrl}`)
      : [];
    const paragraphs = [
      `Hi${purchase.name ? ` ${purchase.name}` : ''},`,
      'Thank you for your purchase.',
      `${productConfig.title} is ready to open now.`,
      'I hope this gives you a simple system you can actually use in real life.',
      productConfig.assetDownloads.length
        ? 'I also included the individual printable links below in case you want to save them one by one.'
        : ''
    ].filter(Boolean);
    const textSections = [
      paragraphs.join('\n\n'),
      `Open your bundle library:\n${productConfig.downloadUrl}`
    ];
    if (assetBullets.length) {
      textSections.push(`Individual printable links:\n- ${assetBullets.join('\n- ')}`);
    }
    textSections.push(`- ${siteConfig.ownerName}\n${siteConfig.brandName}`);
    return {
      subject,
      text: textSections.join('\n\n'),
      html: renderEmailHtml({
        brandName: siteConfig.brandName,
        logoUrl: siteConfig.logoUrl,
        heading: `${productConfig.title} Is Ready`,
        intro: 'Your purchase is confirmed and the bundle library is unlocked.',
        paragraphs,
        bullets: assetBullets,
        ctaLabel: productConfig.accessLabel || 'Open Your Bundle',
        ctaUrl: productConfig.downloadUrl,
        signature: `${siteConfig.ownerName}\n${siteConfig.brandName}`,
        footer: `Sent by ${siteConfig.supportEmail} for ${siteConfig.brandName}.`
      })
    };
  },
  owner_asset_ready: ({ siteConfig, productConfig }) => {
    const subject = `Codee asset pack ready for ${siteConfig.brandName}`;
    const bullets = [
      `Live bundle page - ${productConfig.productPageUrl || siteConfig.siteUrl}`,
      `Bundle access - ${productConfig.downloadUrl}`,
      ...(productConfig.checkoutUrl ? [`Checkout link - ${productConfig.checkoutUrl}`] : []),
      ...productConfig.assetDownloads.map((asset) => `${asset.title} - ${asset.downloadUrl}`)
    ];
    const paragraphs = [
      `Hi ${siteConfig.ownerName},`,
      `Codee finished preparing the upgraded printable links for ${productConfig.title}.`,
      'These links now replace the earlier draft set so you can review the live printable pages one by one and see the bundle access page in the same email.',
      'After payment, the buyer receives the main bundle link automatically, and the same product can include the individual printable links in the delivery email.'
    ];
    return {
      subject,
      text: `${paragraphs.join('\n\n')}\n\nUpdated live links:\n- ${bullets.join('\n- ')}`,
      html: renderEmailHtml({
        brandName: siteConfig.brandName,
        logoUrl: siteConfig.logoUrl,
        heading: 'Upgraded Printable Asset Pack Ready',
        intro: 'Codee prepared the refreshed printable files, live product page, and delivery structure for review.',
        paragraphs,
        bullets,
        ctaLabel: 'Open Live Bundle Page',
        ctaUrl: productConfig.productPageUrl || productConfig.downloadUrl,
        signature: 'Codee',
        footer: `Owner asset notice for ${siteConfig.brandName}`
      })
    };
  },
  owner_new_lead: ({ lead, siteConfig, productConfig }) => {
    const subject = `New lead for ${siteConfig.brandName}`;
    const text = [
      `A new lead signed up for ${productConfig.title}.`,
      `Name: ${lead.name || '(not provided)'}`,
      `Email: ${lead.email}`,
      `Source: ${lead.source}`,
      `Captured at: ${lead.createdAt}`,
      '',
      `Client support inbox: ${siteConfig.supportEmail}`,
      `Site: ${siteConfig.siteUrl}`
    ].join('\n');
    const html = renderEmailHtml({
      brandName: siteConfig.brandName,
      logoUrl: siteConfig.logoUrl,
      heading: 'New Lead Captured',
      intro: 'Codee recorded a new printable signup.',
      paragraphs: [
        `${lead.name || 'A subscriber'} joined the list for ${productConfig.title}.`,
        `Email: ${lead.email}`,
        `Source: ${lead.source}`
      ],
      ctaLabel: 'Open Dashboard',
      ctaUrl: siteConfig.dashboardUrl,
      signature: `Sent to ${siteConfig.ownerEmail || 'client owner'}`,
      footer: `Support sender: ${siteConfig.supportEmail}`
    });
    return { subject, text, html };
  },
  owner_new_purchase: ({ purchase, siteConfig, productConfig }) => {
    const assetLines = productConfig.assetDownloads.length
      ? productConfig.assetDownloads.map((asset) => `${asset.title}: ${asset.downloadUrl}`)
      : [];
    const subject = `New purchase for ${siteConfig.brandName}`;
    const text = [
      `A customer purchased ${productConfig.title}.`,
      `Name: ${purchase.name || '(not provided)'}`,
      `Email: ${purchase.email}`,
      `Order ID: ${purchase.orderId}`,
      `Delivered bundle access: ${productConfig.downloadUrl}`,
      ...(assetLines.length ? ['', 'Individual printable links:', ...assetLines] : [])
    ].join('\n');
    const html = renderEmailHtml({
      brandName: siteConfig.brandName,
      logoUrl: siteConfig.logoUrl,
      heading: 'New Bundle Purchase',
      intro: `${productConfig.title} was purchased and delivery email was sent automatically.`,
      paragraphs: [
        `Customer: ${purchase.name || 'Unknown name'}`,
        `Email: ${purchase.email}`,
        `Order ID: ${purchase.orderId}`
      ],
      bullets: assetLines,
      ctaLabel: 'Open Product Page',
      ctaUrl: productConfig.productPageUrl || siteConfig.siteUrl,
      signature: `Support sender: ${siteConfig.supportEmail}`,
      footer: `Owner notification for ${siteConfig.brandName}`
    });
    return { subject, text, html };
  },
  owner_welcome: ({ siteConfig }) => {
    const subject = `Codee update: check out your ${siteConfig.brandName} changes`;
    const bullets = [
      `Live site: ${siteConfig.checkChangesUrl}`,
      `Latest post link: ${siteConfig.latestPostUrl}`,
      `Pinterest profile: ${siteConfig.pinterestProfileUrl || 'add when available'}`,
      ...siteConfig.nextUploadChecklist.map((item) => `Next upload: ${item}`)
    ];
    const paragraphs = [
      `Hi ${siteConfig.ownerName},`,
      `Codee finished the latest automation and funnel updates for ${siteConfig.brandName}.`,
      'Check your live links, confirm the current covers, and upload the next content items so the funnel stays fresh.'
    ];
    return {
      subject,
      text: `${paragraphs.join('\n\n')}\n\n- ${bullets.join('\n- ')}`,
      html: renderEmailHtml({
        brandName: siteConfig.brandName,
        logoUrl: siteConfig.logoUrl,
        heading: 'Check Out Your Changes',
        intro: 'Your tier-4 blog updates are ready for review.',
        paragraphs,
        bullets,
        ctaLabel: 'Open Live Site',
        ctaUrl: siteConfig.checkChangesUrl,
        signature: 'Codee',
        footer: `Sent from ${siteConfig.supportEmail}`
      })
    };
  },
  owner_support: ({ siteConfig, sequence }) => {
    const ideas = buildOwnerSupportIdeas(siteConfig, sequence);
    const subject = `Codee support for ${siteConfig.brandName}: inspiration + 3 post ideas`;
    const paragraphs = [
      `Hi ${siteConfig.ownerName},`,
      `Here is your current ${siteConfig.brandName} support check-in from Codee.`,
      'Focus this round on one emotional story post, one practical printable post, and one trust-building educational post.'
    ];
    const bullets = [
      `Inspiration message: You do not need to publish perfectly. Clear, helpful posts build trust faster than polished silence.`,
      `Post idea 1: ${ideas[0]}`,
      `Post idea 2: ${ideas[1]}`,
      `Post idea 3: ${ideas[2]}`,
      ...(siteConfig.nextUploadChecklist.length
        ? [`Next upload to prepare: ${siteConfig.nextUploadChecklist[sequence % siteConfig.nextUploadChecklist.length]}`]
        : [])
    ];
    const text = `${paragraphs.join('\n\n')}\n\n- ${bullets.join('\n- ')}\n\nOpen dashboard:\n${siteConfig.dashboardUrl}`;
    const html = renderEmailHtml({
      brandName: siteConfig.brandName,
      logoUrl: siteConfig.logoUrl,
      heading: 'Codee Support Check-In',
      intro: 'A fresh inspiration note and post ideas for the next publishing cycle.',
      paragraphs,
      bullets,
      ctaLabel: 'Open Dashboard',
      ctaUrl: siteConfig.dashboardUrl,
      signature: 'Codee support automation',
      footer: `Recurring every ${siteConfig.ownerSupport.frequencyDays} days from ${siteConfig.supportEmail}.`
    });
    return { subject, text, html };
  }
};

const sendSendgridEmail = (to, message, siteConfig) =>
  new Promise((resolve, reject) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return reject(new Error('Missing SENDGRID_API_KEY'));

    const data = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: siteConfig.supportEmail || EMAIL_FROM, name: siteConfig.senderName || siteConfig.brandName },
      reply_to: siteConfig.supportReplyTo ? { email: siteConfig.supportReplyTo, name: siteConfig.ownerName || siteConfig.brandName } : undefined,
      subject: message.subject,
      content: [
        { type: 'text/plain', value: message.text || '' },
        { type: 'text/html', value: message.html || `<pre>${escapeHtml(message.text || '')}</pre>` }
      ]
    });

    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve();
        reject(new Error(`SendGrid status ${res.statusCode}`));
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });

const sendBrevoEmail = (to, message, siteConfig) =>
  new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return reject(new Error('Missing BREVO_API_KEY'));

    const data = JSON.stringify({
      sender: { email: siteConfig.supportEmail || EMAIL_FROM, name: siteConfig.senderName || siteConfig.brandName },
      replyTo: siteConfig.supportReplyTo ? { email: siteConfig.supportReplyTo, name: siteConfig.ownerName || siteConfig.brandName } : undefined,
      to: [{ email: to }],
      subject: message.subject,
      textContent: message.text || '',
      htmlContent: message.html || `<pre>${escapeHtml(message.text || '')}</pre>`
    });

    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve();
        reject(new Error(`Brevo status ${res.statusCode}`));
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });

const fetchBrevoJson = async (endpointPath, { method = 'GET', body } = {}) => {
  if (!BREVO_API_KEY) {
    throw new Error('Missing BREVO_API_KEY');
  }

  const response = await fetch(`https://api.brevo.com${endpointPath}`, {
    method,
    headers: {
      'api-key': BREVO_API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message = parsed?.message || parsed?.code || text || `Brevo status ${response.status}`;
    throw new Error(String(message).slice(0, 500));
  }

  return parsed;
};

const slugName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureBrevoFolder = async (siteKey, folderName = BREVO_CONTACT_FOLDER_NAME) => {
  const cache = readSiteFile(siteKey, 'brevo', {});
  if (cache?.folderId) return Number(cache.folderId);

  const existingFolders = await fetchBrevoJson('/v3/contacts/folders?limit=100&offset=0').catch(() => ({ folders: [] }));
  const rows = Array.isArray(existingFolders?.folders) ? existingFolders.folders : [];
  const match = rows.find((row) => String(row?.name || '').trim().toLowerCase() === folderName.trim().toLowerCase());
  if (match?.id) {
    writeSiteFile(siteKey, 'brevo', { ...cache, folderId: Number(match.id), folderName });
    return Number(match.id);
  }

  const created = await fetchBrevoJson('/v3/contacts/folders', {
    method: 'POST',
    body: { name: folderName }
  });
  const folderId = Number(created?.id || 0);
  if (!folderId) throw new Error('Brevo folder create returned no id');
  writeSiteFile(siteKey, 'brevo', { ...cache, folderId, folderName });
  return folderId;
};

const ensureBrevoList = async (siteKey, listKey, listName) => {
  const cache = readSiteFile(siteKey, 'brevo', {});
  const cachedListId = cache?.lists?.[listKey];
  if (cachedListId) return Number(cachedListId);

  const folderId = await ensureBrevoFolder(siteKey);
  const existingLists = await fetchBrevoJson('/v3/contacts/lists?limit=100&offset=0').catch(() => ({ lists: [] }));
  const rows = Array.isArray(existingLists?.lists) ? existingLists.lists : [];
  const match = rows.find((row) => String(row?.name || '').trim().toLowerCase() === listName.trim().toLowerCase());
  if (match?.id) {
    writeSiteFile(siteKey, 'brevo', {
      ...cache,
      folderId,
      folderName: BREVO_CONTACT_FOLDER_NAME,
      lists: {
        ...(cache?.lists || {}),
        [listKey]: Number(match.id),
      }
    });
    return Number(match.id);
  }

  const created = await fetchBrevoJson('/v3/contacts/lists', {
    method: 'POST',
    body: {
      folderId,
      name: listName
    }
  });
  const listId = Number(created?.id || 0);
  if (!listId) throw new Error('Brevo list create returned no id');
  writeSiteFile(siteKey, 'brevo', {
    ...cache,
    folderId,
    folderName: BREVO_CONTACT_FOLDER_NAME,
    lists: {
      ...(cache?.lists || {}),
      [listKey]: listId,
    }
  });
  return listId;
};

const syncBrevoContact = async ({ siteConfig, productConfig, email, name = '', source = 'website', stage = 'lead' }) => {
  if (!BREVO_API_KEY || !siteConfig?.key || !productConfig?.key) return { ok: false, skipped: true, reason: 'missing_brevo_api_key' };

  const brandName = String(siteConfig.brandName || siteConfig.senderName || siteConfig.key).trim();
  const generalListName = `${brandName} | ${stage === 'purchase' ? 'Buyers' : 'Leads'}`;
  const productListName = `${brandName} | ${productConfig.title}`;
  const generalListKey = `${stage}_${slugName(generalListName)}`;
  const productListKey = `${stage}_${productConfig.key}`;

  const [generalListId, productListId] = await Promise.all([
    ensureBrevoList(siteConfig.key, generalListKey, generalListName),
    ensureBrevoList(siteConfig.key, productListKey, productListName),
  ]);

  const payload = {
    email,
    updateEnabled: true,
    listIds: [generalListId, productListId].filter(Boolean),
  };

  await fetchBrevoJson('/v3/contacts', {
    method: 'POST',
    body: payload
  });

  const cache = readSiteFile(siteConfig.key, 'brevo', {});
  writeSiteFile(siteConfig.key, 'brevo', {
    ...cache,
    folderName: BREVO_CONTACT_FOLDER_NAME,
    lastSync: {
      email,
      source,
      stage,
      productKey: productConfig.key,
      syncedAt: nowIso(),
      generalListId,
      productListId
    }
  });

  return {
    ok: true,
    generalListId,
    productListId,
    generalListName,
    productListName
  };
};

const sendEmail = async (to, message, siteConfig) => {
  if (!to) return;
  if (EMAIL_PROVIDER === 'sendgrid') return sendSendgridEmail(to, message, siteConfig);
  if (EMAIL_PROVIDER === 'brevo') return sendBrevoEmail(to, message, siteConfig);
  return Promise.resolve();
};

const queueFollowups = (siteKey, lead) => {
  const siteConfig = resolveSiteConfig(siteKey);
  if (!siteConfig.automation.leadFollowupsEnabled) return;
  const queue = readSiteFile(siteKey, 'queue', []);
  const base = Date.now();
  const items = [
    { type: 'followup_2', dueAt: new Date(base + 24 * 60 * 60 * 1000).toISOString() },
    { type: 'followup_3', dueAt: new Date(base + 3 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  items.forEach((item) => {
    queue.push({
      id: crypto.randomUUID(),
      type: item.type,
      siteKey,
      productKey: 'weekly-reset-bundle',
      email: lead.email,
      name: lead.name,
      source: lead.source,
      dueAt: item.dueAt,
      sentAt: null,
      createdAt: nowIso()
    });
  });

  writeSiteFile(siteKey, 'queue', queue);
};

const ensureOwnerSupportQueue = (siteConfig) => {
  if (!siteConfig.ownerSupport.enabled || !siteConfig.ownerEmail) return;
  const queue = readSiteFile(siteConfig.key, 'queue', []);
  const welcomeExists = queue.find((item) => item.type === OWNER_WELCOME_TYPE);
  if (!welcomeExists) {
    queue.push({
      id: crypto.randomUUID(),
      type: OWNER_WELCOME_TYPE,
      siteKey: siteConfig.key,
      productKey: '',
      email: siteConfig.ownerEmail,
      name: siteConfig.ownerName,
      dueAt: nowIso(),
      sentAt: null,
      createdAt: nowIso()
    });
  }
  const pending = queue.find((item) => item.type === OWNER_SUPPORT_TYPE && !item.sentAt);
  if (pending) {
    writeSiteFile(siteConfig.key, 'queue', queue);
    return;
  }
  queue.push({
    id: crypto.randomUUID(),
    type: OWNER_SUPPORT_TYPE,
    siteKey: siteConfig.key,
    productKey: '',
    email: siteConfig.ownerEmail,
    name: siteConfig.ownerName,
    dueAt: nowIso(),
    sentAt: null,
    createdAt: nowIso(),
    frequencyDays: siteConfig.ownerSupport.frequencyDays,
    sequence: 0
  });
  writeSiteFile(siteConfig.key, 'queue', queue);
};

const maybeQueueNextOwnerSupport = (siteConfig, currentItem, queue) => {
  if (currentItem.type !== OWNER_SUPPORT_TYPE) return;
  const hasPending = queue.find((item) => item.type === OWNER_SUPPORT_TYPE && !item.sentAt);
  if (hasPending) return;
  const dueAt = new Date(Date.now() + (currentItem.frequencyDays || siteConfig.ownerSupport.frequencyDays || 3) * 24 * 60 * 60 * 1000).toISOString();
  queue.push({
    id: crypto.randomUUID(),
    type: OWNER_SUPPORT_TYPE,
    siteKey: siteConfig.key,
    productKey: '',
    email: siteConfig.ownerEmail,
    name: siteConfig.ownerName,
    dueAt,
    sentAt: null,
    createdAt: nowIso(),
    frequencyDays: currentItem.frequencyDays || siteConfig.ownerSupport.frequencyDays || 3,
    sequence: Number(currentItem.sequence || 0) + 1
  });
};

const renderQueueMessage = (item, siteConfig) => {
  if ((item.type === 'followup_2' || item.type === 'followup_3') && !siteConfig.automation.leadFollowupsEnabled) {
    return null;
  }
  if ((item.type === OWNER_SUPPORT_TYPE || item.type === OWNER_WELCOME_TYPE) && !siteConfig.ownerSupport.enabled) {
    return null;
  }
  const productConfig =
    getProductConfig(siteConfig, item.productKey) || getProductConfig(siteConfig, 'weekly-reset-bundle') || getProductConfig(siteConfig, 'free-library');
  if (!emailTemplates[item.type]) return null;
  return emailTemplates[item.type]({
    lead: item,
    purchase: item,
    siteConfig,
    productConfig,
    sequence: Number(item.sequence || 0)
  });
};

const processDueQueueForSite = async (siteConfig) => {
  ensureOwnerSupportQueue(siteConfig);
  const queue = readSiteFile(siteConfig.key, 'queue', []);
  let processed = 0;
  const now = Date.now();

  for (const item of queue) {
    if (item.sentAt) continue;
    if (new Date(item.dueAt).getTime() > now) continue;
    const message = renderQueueMessage(item, siteConfig);
    if (!message) {
      item.sentAt = nowIso();
      item.skippedAt = item.sentAt;
      item.skipReason = 'automation_disabled';
      continue;
    }
    await sendEmail(item.email, message, siteConfig);
    item.sentAt = nowIso();
    processed += 1;
    maybeQueueNextOwnerSupport(siteConfig, item, queue);
  }

  writeSiteFile(siteConfig.key, 'queue', queue);
  return processed;
};

const processAllDueQueues = async () => {
  let processed = 0;
  Object.keys(siteRegistry.sites || {}).forEach((siteKey) => {
    ensureDir(siteDataFiles(siteKey).base);
  });
  for (const siteKey of Object.keys(siteRegistry.sites || {})) {
    processed += await processDueQueueForSite(resolveSiteConfig(siteKey));
  }
  return { processed };
};

const parseJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

const getRequestUrl = (req) => new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

ensureDir(DATA_DIR);

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return jsonCors(res, 200, { ok: true });

  try {
    await processAllDueQueues();
  } catch {
    // Keep requests responsive even if background queue processing fails.
  }

  const requestUrl = getRequestUrl(req);
  const pathname = requestUrl.pathname;

  if (req.method === 'GET' && pathname === '/health') {
    return jsonCors(res, 200, { ok: true, provider: EMAIL_PROVIDER, sites: Object.keys(siteRegistry.sites || {}) });
  }

  if (req.method === 'GET' && pathname === '/api/funnel/config') {
    const siteConfig = resolveSiteConfig(requestUrl.searchParams.get('siteKey'));
    const freeLibrary = getProductConfig(siteConfig, 'free-library');
    const weeklyReset = getProductConfig(siteConfig, 'weekly-reset-bundle');
    return jsonCors(res, 200, {
      ok: true,
      siteKey: siteConfig.key,
      brandName: siteConfig.brandName,
      supportEmail: siteConfig.supportEmail,
      ownerEmail: siteConfig.ownerEmail,
      latestPostUrl: siteConfig.latestPostUrl,
      latestPostTitle: siteConfig.latestPostTitle,
      pinterestProfileUrl: siteConfig.pinterestProfileUrl,
      checkChangesUrl: siteConfig.checkChangesUrl,
      bucketBasePath: siteConfig.bucketBasePath,
      ga4MeasurementId: GA4_MEASUREMENT_ID,
      analyticsEnabled: Boolean(GA4_MEASUREMENT_ID),
      providerStatus: providerStatus(),
      freeDownloadUrl: freeLibrary?.downloadUrl || '',
      paidBundleUrl: weeklyReset?.productPageUrl || '',
      checkoutUrl: weeklyReset?.checkoutUrl || '',
      products: Object.values(siteConfig.products)
    });
  }

  if (req.method === 'GET' && pathname === '/api/funnel/reporting') {
    try {
      const siteConfig = resolveSiteConfig(requestUrl.searchParams.get('siteKey'));
      const report = await buildDashboardReport(siteConfig);
      return jsonCors(res, 200, {
        ok: true,
        siteKey: siteConfig.key,
        siteUrl: siteConfig.siteUrl,
        report
      });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/collect') {
    try {
      const payload = await parseJsonBody(req);
      const siteConfig = resolveSiteConfig(payload.siteKey);
      const eventResult = await recordSiteEvent(siteConfig.key, {
        ...payload,
        page_location: payload.page_location || payload.pageLocation,
        page_path: payload.page_path || payload.pagePath,
        page_title: payload.page_title || payload.pageTitle,
        product_key: payload.product_key || payload.productKey,
        product_title: payload.product_title || payload.productTitle,
        form_name: payload.form_name || payload.formName,
        traffic_source: payload.traffic_source || payload.trafficSource
      });
      if (!eventResult) {
        return jsonCors(res, 400, { ok: false, error: 'invalid_event_name' });
      }
      return jsonCors(res, 200, { ok: true, event: eventResult });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/signup') {
    try {
      const payload = await parseJsonBody(req);
      const siteConfig = resolveSiteConfig(payload.siteKey);
      const productConfig = getProductConfig(siteConfig, payload.productKey || 'free-library');
      const email = String(payload.email || '').trim().toLowerCase();
      const name = String(payload.name || '').trim();
      const source = String(payload.source || '').trim() || 'website';
      if (!productConfig) return jsonCors(res, 400, { ok: false, error: 'Unknown product key' });
      if (!email || !email.includes('@')) {
        return jsonCors(res, 400, { ok: false, error: 'Valid email required' });
      }

      const leads = readSiteFile(siteConfig.key, 'leads', []);
      const existing = leads.find((lead) => lead.email === email && lead.productKey === productConfig.key);

      if (!existing) {
        const lead = {
          id: crypto.randomUUID(),
          siteKey: siteConfig.key,
          productKey: productConfig.key,
          email,
          name,
          source,
          createdAt: nowIso(),
          freeDeliveredAt: null
        };
        leads.push(lead);
        writeSiteFile(siteConfig.key, 'leads', leads);

        const delivery = emailTemplates.free_delivery({ lead, siteConfig, productConfig });
        await sendEmail(email, delivery, siteConfig);
        lead.freeDeliveredAt = nowIso();
        lead.brevoSync = await syncBrevoContact({
          siteConfig,
          productConfig,
          email,
          name,
          source,
          stage: 'lead'
        }).catch((error) => ({ ok: false, error: error.message }));
        writeSiteFile(siteConfig.key, 'leads', leads);

        await recordSiteEvent(siteConfig.key, {
          eventName: 'lead_signup_completed',
          clientId: payload.clientId || payload.client_id || email,
          sessionId: payload.sessionId || payload.session_id || '',
          page_location: payload.page_location || payload.pageLocation || siteConfig.siteUrl,
          page_path: payload.page_path || payload.pagePath || payload.source || '/',
          page_title: payload.page_title || payload.pageTitle || productConfig.title,
          product_key: productConfig.key,
          product_title: productConfig.title,
          form_name: payload.form_name || payload.formName || payload.source || 'website',
          source,
          value: 1,
        });

        queueFollowups(siteConfig.key, lead);

        if (siteConfig.automation.ownerNotificationsEnabled && siteConfig.ownerEmail) {
          const ownerNotice = emailTemplates.owner_new_lead({ lead, siteConfig, productConfig });
          await sendEmail(siteConfig.ownerEmail, ownerNotice, siteConfig);
        }
      }

      return jsonCors(res, 200, {
        ok: true,
        message: 'Signup completed',
        siteKey: siteConfig.key,
        freeDownloadUrl: productConfig.downloadUrl,
        paidBundleUrl: (getProductConfig(siteConfig, 'weekly-reset-bundle') || {}).productPageUrl || '',
        brevo:
          leads.find((lead) => lead.email === email && lead.productKey === productConfig.key)?.brevoSync || null
      });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/create-checkout') {
    try {
      const payload = await parseJsonBody(req);
      const siteConfig = resolveSiteConfig(payload.siteKey);
      const productConfig = getProductConfig(siteConfig, payload.productKey || 'weekly-reset-bundle');
      const email = String(payload.email || '').trim().toLowerCase();
      const name = String(payload.name || '').trim();
      if (!productConfig) return jsonCors(res, 400, { ok: false, error: 'Unknown product key' });
      if (!email || !email.includes('@')) {
        return jsonCors(res, 400, { ok: false, error: 'Valid email required' });
      }

      const orderToken = crypto.randomBytes(8).toString('hex');
      const checkoutUrl = withQueryParams(productConfig.checkoutUrl || productConfig.productPageUrl || siteConfig.siteUrl, {
        email,
        name,
        siteKey: siteConfig.key,
        productKey: productConfig.key,
        token: orderToken
      });

      await recordSiteEvent(siteConfig.key, {
        eventName: 'checkout_started',
        clientId: payload.clientId || payload.client_id || email,
        sessionId: payload.sessionId || payload.session_id || '',
        page_location: payload.page_location || payload.pageLocation || productConfig.productPageUrl || siteConfig.siteUrl,
        page_path: payload.page_path || payload.pagePath || productConfig.productPageUrl || '/',
        page_title: payload.page_title || payload.pageTitle || productConfig.title,
        product_key: productConfig.key,
        product_title: productConfig.title,
        source: 'checkout_form',
        value: Number(productConfig.priceAmountCents || 0) / 100,
      });

      return jsonCors(res, 200, {
        ok: true,
        siteKey: siteConfig.key,
        productKey: productConfig.key,
        checkoutUrl,
        orderToken,
        bucketFolder: productConfig.bucketFolder
      });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/purchase-complete') {
    try {
      const payload = await parseJsonBody(req);
      const siteConfig = resolveSiteConfig(payload.siteKey);
      const webhookSecret = String(process.env.WEBHOOK_SECRET || '').trim();
      if (webhookSecret) {
        const supplied = req.headers['x-webhook-secret'] || '';
        if (supplied !== webhookSecret) {
          return jsonCors(res, 403, { ok: false, error: 'Invalid webhook secret' });
        }
      }

      const productConfig = getProductConfig(siteConfig, payload.productKey || 'weekly-reset-bundle');
      const email = String(payload.email || '').trim().toLowerCase();
      const name = String(payload.name || '').trim();
      const orderId = String(payload.orderId || crypto.randomUUID());
      if (!productConfig) return jsonCors(res, 400, { ok: false, error: 'Unknown product key' });
      if (!email || !email.includes('@')) {
        return jsonCors(res, 400, { ok: false, error: 'Valid email required' });
      }

      const purchases = readSiteFile(siteConfig.key, 'purchases', []);
      let purchase = purchases.find((entry) => entry.orderId === orderId);
      if (!purchase) {
        purchase = {
          orderId,
          siteKey: siteConfig.key,
          productKey: productConfig.key,
          email,
          name,
          createdAt: nowIso(),
          downloadUrl: productConfig.downloadUrl,
          amountCents: Number(productConfig.priceAmountCents || 0)
        };
        purchases.push(purchase);
        writeSiteFile(siteConfig.key, 'purchases', purchases);
      }

      const delivery = emailTemplates.purchase_delivery({ purchase, siteConfig, productConfig });
      await sendEmail(email, delivery, siteConfig);
      purchase.brevoSync = await syncBrevoContact({
        siteConfig,
        productConfig,
        email,
        name,
        source: 'purchase_complete',
        stage: 'purchase'
      }).catch((error) => ({ ok: false, error: error.message }));
      writeSiteFile(siteConfig.key, 'purchases', purchases);

      await recordSiteEvent(siteConfig.key, {
        eventName: 'purchase_completed',
        clientId: payload.clientId || payload.client_id || email,
        sessionId: payload.sessionId || payload.session_id || '',
        page_location: payload.page_location || payload.pageLocation || productConfig.productPageUrl || siteConfig.siteUrl,
        page_path: payload.page_path || payload.pagePath || productConfig.productPageUrl || '/',
        page_title: payload.page_title || payload.pageTitle || productConfig.title,
        product_key: productConfig.key,
        product_title: productConfig.title,
        source: 'purchase_complete',
        value: Number(productConfig.priceAmountCents || 0) / 100,
      });

      if (siteConfig.automation.ownerNotificationsEnabled && siteConfig.ownerEmail) {
        const ownerNotice = emailTemplates.owner_new_purchase({ purchase, siteConfig, productConfig });
        await sendEmail(siteConfig.ownerEmail, ownerNotice, siteConfig);
      }

      return jsonCors(res, 200, {
        ok: true,
        message: 'Purchase recorded and delivery sent',
        siteKey: siteConfig.key,
        productKey: productConfig.key,
        downloadUrl: productConfig.downloadUrl,
        brevo: purchase.brevoSync || null
      });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/process-queue') {
    try {
      const stats = await processAllDueQueues();
      return jsonCors(res, 200, { ok: true, ...stats });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/send-owner-update') {
    try {
      const payload = await parseJsonBody(req);
      const siteConfig = resolveSiteConfig(payload.siteKey);
      if (!siteConfig.ownerEmail) {
        return jsonCors(res, 400, { ok: false, error: 'missing_owner_email' });
      }
      const message = emailTemplates.owner_welcome({ siteConfig });
      await sendEmail(siteConfig.ownerEmail, message, siteConfig);
      return jsonCors(res, 200, { ok: true, sentTo: siteConfig.ownerEmail, siteKey: siteConfig.key });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/funnel/send-owner-asset-pack') {
    try {
      const payload = await parseJsonBody(req);
      const siteConfig = resolveSiteConfig(payload.siteKey);
      const productConfig = getProductConfig(siteConfig, payload.productKey || 'kids-activity-coloring-bundle');
      if (!siteConfig.ownerEmail) {
        return jsonCors(res, 400, { ok: false, error: 'missing_owner_email' });
      }
      if (!productConfig) {
        return jsonCors(res, 400, { ok: false, error: 'unknown_product_key' });
      }
      const message = emailTemplates.owner_asset_ready({ siteConfig, productConfig });
      await sendEmail(siteConfig.ownerEmail, message, siteConfig);
      return jsonCors(res, 200, {
        ok: true,
        sentTo: siteConfig.ownerEmail,
        siteKey: siteConfig.key,
        productKey: productConfig.key,
        assetCount: productConfig.assetDownloads.length
      });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && (pathname === '/purchase-email' || pathname === '/visitor-click-email')) {
    try {
      const payload = await parseJsonBody(req);
      if (!payload.email) return jsonCors(res, 400, { ok: false, error: 'email required' });
      const siteConfig = resolveSiteConfig(payload.siteKey);
      await sendEmail(
        payload.email,
        {
          subject: payload.subject || 'Website event',
          text: payload.body || 'Event received.',
          html: renderEmailHtml({
            brandName: siteConfig.brandName,
            logoUrl: siteConfig.logoUrl,
            heading: payload.subject || 'Website event',
            paragraphs: [payload.body || 'Event received.'],
            ctaLabel: payload.upsellUrl ? 'Open link' : '',
            ctaUrl: payload.upsellUrl || '',
            footer: `Support sender: ${siteConfig.supportEmail}`
          })
        },
        siteConfig
      );
      return jsonCors(res, 200, { ok: true, provider: EMAIL_PROVIDER });
    } catch (err) {
      return jsonCors(res, 500, { ok: false, error: err.message });
    }
  }

  return jsonCors(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Funnel backend listening on ${PORT}`);
});
