// Mobile navigation toggle and close behavior
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const IMAGE_OVERRIDE_KEY = 'mft_image_overrides_v1';
const THEME_PREF_KEY = 'mft_theme_pref_v1';
const THEME_CUSTOM_KEY = 'mft_theme_custom_v1';
const STYLE_VERSION = '20260401-8';
const POSTS_DATA_URL = '/assets/data/posts.json';
const STUDIO_PREVIEW_SHELVES = {
  'Orthodontic Assistant Life': [
    "What It's REALLY Like Being an Orthodontic Assistant",
    'Ortho Assistant Things Only WE Understand',
    'A Day in the Life of an Ortho Assistant',
    'Why This Job Is Exhausting but Worth It',
    'Top Mistakes New Ortho Assistants Make',
    'The Elastic Struggle: If You Know, You Know',
    'Things Patients Say That Make No Sense',
    "We Know When You Don't Wear Your Elastics",
    'Ortho Tools Explained Simply',
    'Clinic Moments That Test Your Patience',
    'The Best Skill I Learned in Ortho',
    'What to Know Before Becoming an Ortho Assistant',
    'How Adjustments Really Feel From the Chairside View',
    'Bonding, Debonding, and the Days That Fly By',
    'Why Chairside Confidence Matters More Than You Think',
    'Funny Clinic Moments You Cannot Make Up',
    'The Real Pace of a Busy Ortho Day',
    'What Makes a Great Ortho Assistant',
    'How I Learned to Talk Patients Off the Edge',
    'The Tiny Details That Keep a Clinic Running'
  ],
  'Mom of 5 Life': [
    'Mom of 5 and Still Trying to Figure It Out',
    'How I Stay Organized With 5 Kids and a Full Schedule',
    'Balancing Work, Kids, and Yourself',
    'Mom Life After Clinic Hours',
    'Small Progress Is Still Progress',
    "You Don't Need Motivation, You Need a System",
    "What I'd Tell My Younger Self Starting Over",
    'Why Simple Plans Always Win',
    'Stop Waiting to Be Ready',
    'Consistency Over Everything',
    'The Reset Hour That Saves My Evenings',
    'My Sunday Reset When the Week Gets Loud',
    'What I Do When Everything Feels Behind',
    'Meal Planning When Nobody Wants the Same Thing',
    'How I Keep the House Moving Without Losing My Mind',
    'The Truth About Motherhood and Multitasking',
    'The Mom Systems That Actually Stick',
    'Busy Days, Loud House, Still Building',
    'Why Grace Helps More Than Guilt',
    'How I Reset Without Starting Over'
  ],
  'Entrepreneur Journey': [
    'Why I Started My DigiBlog',
    'The Day I Realized I Could Make Money From What I Already Know',
    'Why I Started Writing Instead of Just Scrolling',
    "If You've Ever Felt Stuck, Read This",
    'Turning Knowledge Into Income Online',
    'Building Something for Myself',
    'The System That Helped Me Stop Feeling Overwhelmed',
    'From Busy to Building',
    'The First Dollar Online Is the Hardest',
    "You're More Experienced Than You Think",
    'How I Turn Everyday Life Into Content',
    'Why Most People Never Start',
    'Start Messy, Fix Later',
    'What Blogging Taught Me About Confidence',
    'How Codee Inbox Intelligence Quietly Changed My Workflow',
    'Why Simple Systems Beat Big Ideas',
    'The Moment I Took My Own Ideas Seriously',
    'What Building Online Looks Like in Real Life',
    'My Blog Became More Than Just a Blog',
    'Why I Built My Own System Instead of Waiting'
  ]
};
const buildShelfId = (prefix, label) =>
  `${prefix}-${String(label || 'shelf')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;

const buildDraftPreviewUrl = (draft) => {
  const blogDraftId = String(draft?.blogDraftId || '').trim();
  return blogDraftId ? `/studio-draft.html?id=${encodeURIComponent(blogDraftId)}` : '/blog/';
};

const normalizePath = (value = window.location.pathname) => {
  const clean = String(value || '/').trim().replace(/index\.html$/, '').replace(/\/+$/, '');
  return clean || '/';
};

const PUBLIC_SITE_SETTINGS = {
  logoPath: '/assets/dental/madeforthis-logo.png',
  supportEmail: 'christinac90@yahoo.com',
  tagline: 'A softer way to build a life that fits, with stories, printables, and support that keep moving with you.',
  nav: [
    { href: '/index.html', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/free-library/', label: 'Free Printables' },
    { href: '/shop.html', label: 'Shop' },
    { href: '/about.html', label: 'About' },
    { href: '/contact.html', label: 'Contact' }
  ],
  socials: [
    { href: 'https://www.instagram.com/', label: 'Instagram' },
    { href: 'https://www.pinterest.com/', label: 'Pinterest' },
    { href: 'https://www.tiktok.com/', label: 'TikTok' }
  ]
};

const normalizeBrandLogos = () => {
  document.querySelectorAll('.brand-logo, .footer-logo').forEach((img) => {
    img.setAttribute('src', PUBLIC_SITE_SETTINGS.logoPath);
    if (!img.getAttribute('alt')) img.setAttribute('alt', 'Made For This');
  });
};

const mountBackgroundLogoMark = () => {};

const normalizeStylesheetVersion = () => {
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href.includes('style.css')) return;
    const url = new URL(href, window.location.origin);
    url.searchParams.set('v', STYLE_VERSION);
    link.setAttribute('href', `${url.pathname}${url.search}`);
  });
};

const mountPageLoader = () => {
  if (document.querySelector('.page-loader')) return;
  const loader = document.createElement('div');
  loader.className = 'page-loader is-active';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = `
    <span class="page-loader-ambient"></span>
    <span class="page-loader-sweep"></span>
    <div class="page-loader-inner">
      <span class="page-loader-ring page-loader-ring-outer"></span>
      <span class="page-loader-ring page-loader-ring-mid"></span>
      <span class="page-loader-ring page-loader-ring-inner"></span>
      <img src="${PUBLIC_SITE_SETTINGS.logoPath}" alt="" class="page-loader-logo" />
    </div>
  `;
  document.body.appendChild(loader);

  const showLoader = () => loader.classList.add('is-active');
  const hideLoader = () => {
    if (loader.dataset.hiding === 'true') return;
    loader.dataset.hiding = 'true';
    loader.classList.add('is-exiting');
    window.setTimeout(() => {
      loader.classList.remove('is-active', 'is-exiting');
      document.body.classList.add('page-ready');
    }, 360);
  };

  window.addEventListener('beforeunload', showLoader);
  window.addEventListener('pageshow', hideLoader);
  window.addEventListener('load', hideLoader);
  window.setTimeout(hideLoader, 860);
};

const enhanceRevealMotion = () => {
  const sideMotionCards = document.querySelectorAll(
    '.card-grid .card, .featured-stories-grid .card, .home-library-categories .library-shelf, .bundle-preview-grid img'
  );
  sideMotionCards.forEach((node, index) => {
    node.classList.add('reveal');
    node.classList.add(index % 2 === 0 ? 'reveal-left' : 'reveal-right');
    node.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
  });
};

const setupDesktopParallax = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 1024) return;
  const nodes = document.querySelectorAll('.hero-visual-wrap, .journey-section, .featured-reads-section, .about-nina-section');
  if (!nodes.length) return;

  const updateParallax = () => {
    const viewportMiddle = window.innerHeight / 2;
    nodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const delta = (rect.top + rect.height / 2 - viewportMiddle) * -0.03;
      node.style.setProperty('--parallax-y', `${Math.max(-18, Math.min(18, delta + index * 0.4))}px`);
    });
    document.body.style.setProperty('--logo-drift', `${Math.max(-40, Math.min(40, window.scrollY * -0.03))}px`);
  };

  updateParallax();
  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', updateParallax);
};

const INTERNAL_ROUTE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/studio-draft',
  '/printables',
  '/live-printables',
  '/codee-live-printables-export',
  '/digi'
];

const PUBLIC_CATEGORY_LABELS = {
  'Orthodontic Assistant Life': 'Ortho Life',
  'Mom of 5 Life': 'Mom Life',
  'Entrepreneur Journey': 'Building Online'
};

const isInternalRoute = () =>
  INTERNAL_ROUTE_PREFIXES.some((prefix) => normalizePath().startsWith(prefix));

const ensureNoIndex = () => {
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    document.head.appendChild(robots);
  }
  robots.setAttribute('content', 'noindex, nofollow, noarchive');
};

const renderInternalAccessDenied = () => {
  ensureNoIndex();
  document.title = 'Access unavailable | Made For This';
  document.body.innerHTML = `
    <main class="access-denied-shell">
      <section class="section access-denied-card">
        <p class="overline">Made For This</p>
        <h1>This page isn’t part of the public site.</h1>
        <p class="offer-copy">The page you tried to open is reserved for private tools or protected delivery access.</p>
        <div class="button-row">
          <a class="btn btn-primary" href="/index.html">Back to Home</a>
          <a class="btn" href="/contact.html">Contact Support</a>
        </div>
      </section>
    </main>
  `;
};

const inferDraftCategory = (draft) => {
  const direct = String(draft?.category || '').trim();
  if (direct) return direct;
  const title = String(draft?.title || '').trim().toLowerCase();
  for (const [category, titles] of Object.entries(STUDIO_PREVIEW_SHELVES)) {
    if ((titles || []).some((row) => String(row || '').trim().toLowerCase() === title)) return category;
  }
  return 'Studio Stories';
};

const parseIsoDate = (value) => {
  const txt = String(value || '').trim();
  if (!txt) return null;
  const parsed = new Date(txt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatShelfDate = (value) => {
  const parsed = parseIsoDate(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const buildLiveHomepageDraftPosts = (drafts, fallbackImages) => {
  return (Array.isArray(drafts) ? drafts : [])
    .filter((draft) => {
      const status = String(draft?.approvalStatus || '').trim().toLowerCase();
      return status === 'approved_sent_to_wordpress' || status === 'approved_keep_live_demo';
    })
    .map((draft, index) => ({
      slug: `studio-${draft.slug || draft.blogDraftId || index}`,
      category: inferDraftCategory(draft),
      title: draft.title || 'Studio post',
      description: draft.excerpt || 'Live from the Made For This studio.',
      badge: 'New Live Post',
      url: buildDraftPreviewUrl(draft),
      published_at: String(draft.homepageDisplayAt || draft.approvedAt || draft.updatedAt || draft.createdAt || ''),
      images: {
        card: fallbackImages.card || '',
        hero: fallbackImages.hero || fallbackImages.card || '',
        pinterest: fallbackImages.pinterest || fallbackImages.card || ''
      }
    }))
    .sort((a, b) => {
      const aTime = parseIsoDate(a.published_at)?.getTime() || 0;
      const bTime = parseIsoDate(b.published_at)?.getTime() || 0;
      return bTime - aTime;
    });
};

const normalizeMainNav = () => {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const current = normalizePath();
  nav.innerHTML = `
    <p class="main-nav-label">Made For This</p>
    <p class="main-nav-note">Stories, routines, printables, and calm support for real life.</p>
    ${PUBLIC_SITE_SETTINGS.nav
      .map((link) => {
        const target = normalizePath(link.href);
        const isCurrent = current === target;
        return `<a href="${link.href}"${isCurrent ? ' aria-current="page"' : ''}>${link.label}</a>`;
      })
      .join('')}
  `;
};

const normalizePublicFooter = () => {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;
  footer.classList.add('footer-lifestyle');
  footer.innerHTML = `
    <div class="footer-grid">
      <div>
        <p class="footer-brand">Made For This</p>
        <p class="small-copy">${PUBLIC_SITE_SETTINGS.tagline}</p>
      </div>
      <div>
        <p class="footer-heading">Explore</p>
        <p>${PUBLIC_SITE_SETTINGS.nav.map((item) => `<a href="${item.href}">${item.label}</a>`).join(' · ')}</p>
      </div>
      <div>
        <p class="footer-heading">Stay connected</p>
        <p>${PUBLIC_SITE_SETTINGS.socials
          .map((item) => `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.label}</a>`)
          .join(' · ')}</p>
        <p><a href="mailto:${PUBLIC_SITE_SETTINGS.supportEmail}">${PUBLIC_SITE_SETTINGS.supportEmail}</a></p>
        <p class="small-copy">Powered quietly by Codee behind the scenes.</p>
      </div>
    </div>
    <p class="footer-bottom">© 2026 Made For This. Warm routines, honest stories, and practical help for everyday life.</p>
    <p class="footer-legal"><a href="/legal.html">Legal Notices</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></p>
  `;
};
const LEAD_STORAGE_KEY = 'mft_leads_v1';
const LEAD_POPUP_SEEN_KEY = 'mft_lead_popup_seen_v1';
const PAGE_AUDIT_STORAGE_KEY = 'mft_page_audit_v1';
const VISITOR_EMAIL_ENDPOINT =
  window.MFT_EMAIL_API_URL ||
  'https://ai-k9-codee-digiapp-437923042920.us-central1.run.app/api/dashboard/nina/send-digiapp-dashboard-email';
const DASHBOARD_API_BASE = VISITOR_EMAIL_ENDPOINT.replace('/api/dashboard/nina/send-digiapp-dashboard-email', '');
const FUNNEL_API_BASE =
  window.MFT_FUNNEL_API_URL || 'https://madeforthis-tier4-funnel-437923042920.us-central1.run.app';
const STRIPE_CHECKOUT_API_URL =
  window.MFT_STRIPE_CHECKOUT_API_URL ||
  'https://ai-k9-codee-digiapp-437923042920.us-central1.run.app/api/stripe/checkout/client_digital_product';
const LIVE_BUNDLE_CHECKOUT_URL =
  window.MFT_LIVE_BUNDLE_CHECKOUT_URL || 'https://buy.stripe.com/dRmcN59oPeE68pt8bt9oc02';
const SITE_KEY = window.MFT_SITE_KEY || document.body?.dataset?.siteKey || 'madeforthis';
const FREE_LIBRARY_PRODUCT_KEY = window.MFT_FREE_PRODUCT_KEY || 'free-library';
const DEFAULT_BUNDLE_PRODUCT_KEY = window.MFT_BUNDLE_PRODUCT_KEY || 'weekly-reset-bundle';
const DEFAULT_LIVE_UPDATE_EMAIL = 'christinac90@yahoo.com';
const SESSION_LEAD_KEY = `mft_session_lead_${SITE_KEY}`;
const ANALYTICS_CLIENT_KEY = `mft_analytics_client_${SITE_KEY}`;
const ANALYTICS_SESSION_KEY = `mft_analytics_session_${SITE_KEY}`;
const ANALYTICS_STARTED_KEY = `mft_lead_started_${SITE_KEY}`;
const TRACKING_ENDPOINT = buildTrackingEndpoint();
let funnelConfigPromise = null;
let ga4BootPromise = null;
const MFT_SITE_PAGES = [
  { category: 'Core', title: 'Home', url: '/index.html' },
  { category: 'Core', title: 'Blog Hub', url: '/blog/' },
  { category: 'Core', title: 'Posts Page', url: '/posts.html' },
  { category: 'Core', title: 'Shop', url: '/shop.html' },
  { category: 'Core', title: 'About', url: '/about.html' },
  { category: 'Core', title: 'Contact', url: '/contact.html' },
  { category: 'Core', title: 'Download Center', url: '/download-center.html' },
  { category: 'Core', title: 'Free Library', url: '/free-library/' },
  { category: 'Core', title: 'Jewelry', url: '/jewelry.html' },
  { category: 'Core', title: 'Digi Lane', url: '/digi/' },
  { category: 'Blog Posts', title: 'Why I Started Made For This', url: '/why-i-started-made-for-this.html' },
  { category: 'Blog Posts', title: 'Chaos Behind Getting Life Together', url: '/post-chaos-behind-getting-life-together.html' },
  { category: 'Blog Posts', title: 'Creative Routines', url: '/post-creative-routines.html' },
  { category: 'Blog Posts', title: 'From Ortho To Online', url: '/post-from-ortho-to-online.html' },
  { category: 'Blog Posts', title: 'Grace Over Perfection', url: '/post-grace-over-perfection.html' },
  { category: 'Blog Posts', title: 'Home Reset Checklist', url: '/post-home-reset-checklist.html' },
  { category: 'Blog Posts', title: 'Leaving Healthcare Harder Than Expected', url: '/post-leaving-healthcare-harder-than-expected.html' },
  { category: 'Blog Posts', title: 'Motherhood And Ambition', url: '/post-motherhood-and-ambition.html' },
  { category: 'Blog Posts', title: 'Patients Don’t Realize', url: '/post-ortho-patients-dont-realize.html' },
  { category: 'Blog Posts', title: 'Orthodontic Reference Sheets', url: '/post-orthodontic-assistant-reference-sheets.html' },
  { category: 'Blog Posts', title: 'What Orthodontic Assistants Actually Do', url: '/post-orthodontic-assistants-actually-do.html' },
  { category: 'Blog Posts', title: 'Printables Save Sanity', url: '/post-printables-save-sanity.html' },
  { category: 'Blog Posts', title: 'Real Goal Behind Made For This', url: '/post-real-goal-behind-made-for-this.html' },
  { category: 'Blog Posts', title: 'Simple Weekly Reset Routine', url: '/post-simple-weekly-reset-routine.html' },
  { category: 'Blog Posts', title: 'Sunday Reset Blueprint', url: '/post-sunday-reset-blueprint.html' },
  { category: 'Blog Posts', title: 'Truth About Leaving Healthcare', url: '/post-truth-about-leaving-healthcare.html' },
  { category: 'Bundles', title: 'Bundle Market', url: '/bundles/' },
  { category: 'Bundles', title: 'Weekly Reset Bundle', url: '/bundles/weekly-reset-bundle.html' },
  { category: 'Bundles', title: 'Faith + Peace Coloring Pages', url: '/bundles/faith-peace-coloring-pages.html' },
  { category: 'Bundles', title: 'Funny Quote Coloring Pages', url: '/bundles/funny-quote-coloring-pages.html' },
  { category: 'Bundles', title: 'Kids Activity Bundle', url: '/bundles/kids-activity-coloring-bundle.html' },
  { category: 'Bundles', title: 'Money Mindset Pages', url: '/bundles/money-mindset-coloring-pages.html' },
  { category: 'Bundles', title: 'Motivation Pages', url: '/bundles/motivation-coloring-pages.html' },
  { category: 'Printables', title: 'Printables Index', url: '/printables/' },
  { category: 'Printables', title: 'Daily Focus Sheet', url: '/printables/daily-focus-sheet/' },
  { category: 'Printables', title: 'Gratitude Journal Page', url: '/printables/gratitude-journal-page/' },
  { category: 'Printables', title: 'Habit Tracker', url: '/printables/habit-tracker/' },
  { category: 'Printables', title: 'Kids Activity Pack', url: '/printables/kids-activity-pack/' },
  { category: 'Printables', title: 'Reset Bundle Cover Page', url: '/printables/reset-bundle-cover-page/' },
  { category: 'Printables', title: 'Sunday Reset Routine', url: '/printables/sunday-reset-routine/' },
  { category: 'Printables', title: 'Weekly Reset Planner', url: '/printables/weekly-reset-planner/' },
  { category: 'Live Printables', title: 'Live Bundle Index', url: '/live-printables/kids-activity/' },
  { category: 'Live Printables', title: 'Live Bundle Page', url: '/live-printables/kids-activity/bundle.html' },
  { category: 'Live Printables', title: 'Coloring Pages Pack', url: '/live-printables/kids-activity/coloring-pages-pack.html' },
  { category: 'Live Printables', title: 'Cut and Paste Pack', url: '/live-printables/kids-activity/cut-and-paste-pack.html' },
  { category: 'Live Printables', title: 'Find and Seek Pack', url: '/live-printables/kids-activity/find-and-seek-pack.html' },
  { category: 'Live Printables', title: 'Matching Activities Pack', url: '/live-printables/kids-activity/matching-activities-pack.html' },
  { category: 'Live Printables', title: 'Mazes Pack', url: '/live-printables/kids-activity/mazes-pack.html' },
  { category: 'Live Printables', title: 'Quiet Time Pack', url: '/live-printables/kids-activity/quiet-time-pack.html' },
  { category: 'Live Printables', title: 'Trace and Learn Pack', url: '/live-printables/kids-activity/trace-and-learn-pack.html' },
  { category: 'Policy', title: 'Returns Policy', url: '/returns-policy.html' },
  { category: 'Policy', title: 'Shipping Policy', url: '/shipping-policy.html' }
];

function buildTrackingEndpoint() {
  if (!FUNNEL_API_BASE) return '';
  return `${FUNNEL_API_BASE.replace(/\/+$/, '')}/api/funnel/collect`;
}
const THEME_PRESETS = {
  luxe_boho_charcoal: {
    '--bg': '#f1f1f0',
    '--bg-soft': '#ffffff',
    '--surface': '#ffffff',
    '--surface-soft': '#f7f7f6',
    '--text': '#222120',
    '--muted': '#666360',
    '--line': '#dfddda',
    '--accent': '#2f2c29',
    '--accent-deep': '#1f1d1b',
    '--accent-soft': '#e6e4e1'
  },
  soft_editorial_stone: {
    '--bg': '#eceae7',
    '--bg-soft': '#faf9f8',
    '--surface': '#ffffff',
    '--surface-soft': '#f3f1ee',
    '--text': '#2e2c29',
    '--muted': '#66615a',
    '--line': '#d8d4cf',
    '--accent': '#4d4741',
    '--accent-deep': '#3a3530',
    '--accent-soft': '#e3dfd9'
  },
  warm_neutral_beige: {
    '--bg': '#e8ded7',
    '--bg-soft': '#fffaf6',
    '--surface': '#ffffff',
    '--surface-soft': '#f6eee8',
    '--text': '#2b2521',
    '--muted': '#6f645c',
    '--line': '#ddcfc4',
    '--accent': '#8b5e4a',
    '--accent-deep': '#744d3d',
    '--accent-soft': '#ead8cc'
  },
  aik9_codee: {
    '--bg': '#0f141a',
    '--bg-soft': '#141b23',
    '--surface': '#1b2530',
    '--surface-soft': '#202b37',
    '--text': '#f1f5f9',
    '--muted': '#a5b4c3',
    '--line': '#2f3b49',
    '--accent': '#50d3c8',
    '--accent-deep': '#28b7aa',
    '--accent-soft': '#1a5d62'
  }
};

const readImageOverrides = () => {
  try {
    const raw = localStorage.getItem(IMAGE_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeImageOverrides = (overrides) => {
  localStorage.setItem(IMAGE_OVERRIDE_KEY, JSON.stringify(overrides));
};

const applyThemeVars = (vars) => {
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setThemePreference = (themeId, customVars = null) => {
  const preset = THEME_PRESETS[themeId] || THEME_PRESETS.luxe_boho_charcoal;
  localStorage.setItem(THEME_PREF_KEY, themeId);
  applyThemeVars(preset);
  if (customVars) {
    localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(customVars));
    applyThemeVars(customVars);
  } else {
    localStorage.removeItem(THEME_CUSTOM_KEY);
  }
};

const hydrateTheme = () => {
  const themeId = localStorage.getItem(THEME_PREF_KEY) || 'luxe_boho_charcoal';
  const preset = THEME_PRESETS[themeId] || THEME_PRESETS.luxe_boho_charcoal;
  applyThemeVars(preset);
  const customVars = readJsonStorage(THEME_CUSTOM_KEY, null);
  if (customVars) applyThemeVars(customVars);
};

const BUNDLE_LEADS_KEY = 'mft_bundle_leads_v1';
const SLOT_PLACEHOLDER_MAP = {
  home_hero: '/assets/dental/Homepage-hero.png',
  home_post_day: '/assets/dental/home-post-of-the-day.png',
  home_featured_1: '/assets/dental/home-featured-mindset.png',
  home_featured_2: '/assets/dental/home-featured-routine.png',
  home_featured_3: '/assets/dental/home-post-of-the-day.png',
  about_main: '/assets/dental/Homepage-hero.png',
  home_story: '/assets/dental/Homepage-hero.png',
  contact_main: '/assets/dental/Homepage-hero.png',
  post1_hero: '/assets/dental/home-featured-routine.png',
  post2_hero: '/assets/dental/home-featured-mindset.png',
  post3_hero: '/assets/dental/home-post-of-the-day.png',
  post4_hero: '/assets/post-3.svg',
  post5_hero: '/assets/post-1.svg',
  post6_hero: '/assets/post-2.svg',
  post7_hero: '/assets/dental/home-post-of-the-day.png',
  post8_hero: '/assets/leaving-healthcare.svg',
  post9_hero: '/assets/dental/home-featured-mindset.png',
  post10_hero: '/assets/printables/faith-peace-preview-1.svg',
  post11_hero: '/assets/dental/home-featured-routine.png',
  post12_hero: '/assets/post-1.svg',
  post13_hero: '/assets/post-2.svg',
  post14_hero: '/assets/post-3.svg',
  post15_hero: '/assets/dental/home-featured-mindset.png',
  post16_hero: '/assets/leaving-healthcare.svg',
  merch_1: '/assets/brand/logo-primary.png',
  merch_2: '/assets/dental/site-logo.png',
  merch_3: '/assets/dental/jewelry-cover.png'
};

const applyImageOverrides = () => {
  const overrides = readImageOverrides();
  document.querySelectorAll('img[data-image-key]').forEach((img) => {
    const key = img.getAttribute('data-image-key');
    if (!key) return;
    if (overrides[key]) {
      img.src = overrides[key];
      return;
    }
    if (SLOT_PLACEHOLDER_MAP[key]) {
      img.src = SLOT_PLACEHOLDER_MAP[key];
    }
  });
};

const setOrCreateMeta = (key, value, attr = 'property') => {
  if (!value) return;
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', value);
};

const setCanonical = (url) => {
  if (!url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
};

const buildFunnelUrl = (endpointPath) => {
  if (!FUNNEL_API_BASE) return '';
  const base = FUNNEL_API_BASE.replace(/\/+$/, '');
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${base}${path}`;
};

const buildFunnelGetUrl = (endpointPath, params = {}) => {
  const endpoint = buildFunnelUrl(endpointPath);
  if (!endpoint) return '';
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const callFunnelApi = async (endpointPath, payload) => {
  const endpoint = buildFunnelUrl(endpointPath);
  if (!endpoint) return null;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Funnel request failed (${response.status})`);
  }
  return data;
};

const callDashboardApi = async (endpointPath, payload) => {
  const base = (DASHBOARD_API_BASE || '').replace(/\/+$/, '');
  if (!base) throw new Error('Dashboard API is unavailable.');
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.detail || data?.error || `Dashboard request failed (${response.status})`);
  }
  return data;
};

const fetchFunnelConfig = async () => {
  if (funnelConfigPromise) return funnelConfigPromise;
  const endpoint = buildFunnelGetUrl('/api/funnel/config', { siteKey: SITE_KEY });
  if (!endpoint) return null;
  funnelConfigPromise = fetch(endpoint, { cache: 'no-store' })
    .then((response) => response.json().catch(() => ({})).then((data) => (response.ok && data?.ok !== false ? data : null)))
    .catch(() => null);
  return funnelConfigPromise;
};

const readStorageValue = (storage, key, fallbackFactory) => {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const created = fallbackFactory();
    storage.setItem(key, created);
    return created;
  } catch {
    return fallbackFactory();
  }
};

const analyticsClientId = () => readStorageValue(localStorage, ANALYTICS_CLIENT_KEY, () => crypto.randomUUID());
const analyticsSessionId = () =>
  readStorageValue(sessionStorage, ANALYTICS_SESSION_KEY, () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

const ensureGa4 = async () => {
  if (ga4BootPromise) return ga4BootPromise;
  ga4BootPromise = (async () => {
    const config = await fetchFunnelConfig();
    const measurementId = window.MFT_GA4_MEASUREMENT_ID || config?.ga4MeasurementId || '';
    if (!measurementId) return null;
    if (!window.dataLayer) window.dataLayer = [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true
    });
    return measurementId;
  })();
  return ga4BootPromise;
};

const sendTrackingPayload = (payload) => {
  if (!TRACKING_ENDPOINT) return;
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(TRACKING_ENDPOINT, blob);
    return;
  }
  fetch(TRACKING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  }).catch(() => {});
};

const trackEvent = async (eventName, params = {}, options = {}) => {
  const payload = {
    siteKey: SITE_KEY,
    eventName,
    clientId: analyticsClientId(),
    sessionId: analyticsSessionId(),
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    referrer: document.referrer || '',
    traffic_source: params.traffic_source || params.source || '',
    ...params
  };

  if (options.server !== false) {
    sendTrackingPayload(payload);
  }

  const measurementId = await ensureGa4();
  if (measurementId && window.gtag) {
    window.gtag('event', eventName, {
      site_key: SITE_KEY,
      session_id: payload.sessionId,
      page_location: payload.page_location,
      page_path: payload.page_path,
      page_title: payload.page_title,
      product_key: payload.product_key,
      product_title: payload.product_title,
      form_name: payload.form_name,
      source: payload.source,
      link_url: payload.link_url,
      link_text: payload.link_text,
      value: payload.value
    });
  }
};

const markLeadSignupStarted = (form, extra = {}) => {
  const formName = form?.getAttribute('data-lead-source') || form?.getAttribute('id') || 'lead_form';
  const startedKey = `${ANALYTICS_STARTED_KEY}:${formName}`;
  try {
    if (sessionStorage.getItem(startedKey) === '1') return;
    sessionStorage.setItem(startedKey, '1');
  } catch {
    // ignore
  }
  trackEvent('lead_signup_started', {
    form_name: formName,
    source: formName,
    ...extra
  });
};

const readSessionLead = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_LEAD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSessionLead = (lead) => {
  try {
    sessionStorage.setItem(SESSION_LEAD_KEY, JSON.stringify(lead));
  } catch {
    // Ignore storage issues.
  }
};

const unlockBundleDirectLinks = () => {
  const sessionLead = readSessionLead();
  if (!sessionLead?.email) return;
  document.querySelectorAll('.bundle-lead-form').forEach((form) => {
    const section = form.closest('.bundle-download-section');
    const directLink = section?.querySelector('.bundle-direct-link');
    const message = form.querySelector('.bundle-form-message');
    const downloadUrl = form.getAttribute('data-download-url');
    if (!directLink || !downloadUrl) return;
    directLink.href = downloadUrl;
    directLink.hidden = false;
    if (message) message.textContent = `Download unlocked for ${sessionLead.email} in this browser session.`;
  });
};

const hydrateFunnelDrivenLinks = async () => {
  const config = await fetchFunnelConfig();
  if (!config) return;

  document.querySelectorAll('a').forEach((link) => {
    const label = (link.textContent || '').trim().toLowerCase();
    if (label === 'pinterest' && link.getAttribute('href') === '#' && config.pinterestProfileUrl) {
      link.href = config.pinterestProfileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    if (label.includes('latest') && link.getAttribute('href') === '#' && config.latestPostUrl) {
      link.href = config.latestPostUrl;
    }
  });
};

const hydratePostImageAndSeo = async () => {
  try {
    const response = await fetch(POSTS_DATA_URL, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    const posts = Array.isArray(payload.posts) ? payload.posts : [];
    const postMap = Object.fromEntries(posts.map((post) => [post.slug, post]));
    const fallbackImages = payload.default?.images || {};
    let liveDrafts = [];
    try {
      const queueResponse = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/madeforthis-content-os`, { cache: 'no-store' });
      const queuePayload = await queueResponse.json().catch(() => ({}));
      if (queueResponse.ok && queuePayload?.ok !== false) {
        liveDrafts = Array.isArray(queuePayload?.drafts) ? queuePayload.drafts : [];
      }
    } catch {}
    const liveDraftMap = Object.fromEntries(
      liveDrafts.map((draft) => [String(draft.title || '').trim().toLowerCase(), draft])
    );

    const publishedTargets = [
      document.getElementById('home-library-categories'),
      document.getElementById('blog-hub-categories')
    ].filter(Boolean);
    const studioTargets = [
      document.getElementById('home-studio-previews'),
      document.getElementById('blog-hub-studio')
    ].filter(Boolean);
    const featuredTargets = [
      document.getElementById('home-featured-posts'),
      document.getElementById('blog-hub-featured')
    ].filter(Boolean);

    const combinedPosts = [...buildLiveHomepageDraftPosts(liveDrafts, fallbackImages), ...posts];
    const grouped = combinedPosts.reduce((acc, post) => {
      const rawCategory = String(post.category || 'More Stories').trim();
      const category = PUBLIC_CATEGORY_LABELS[rawCategory] || rawCategory;
      acc[category] = acc[category] || [];
      acc[category].push(post);
      return acc;
    }, {});

    const publishedShelvesHtml = Object.entries(grouped)
      .map(
        ([category, items]) => `
            <section class="library-shelf">
              <div class="section-heading-row">
                <div>
                  <p class="overline">Category</p>
                  <h3>${escapeHtml(category)}</h3>
                </div>
                <div class="library-shelf-head-actions">
                  <span class="small-copy">${items.length} post${items.length === 1 ? '' : 's'}</span>
                  <div class="library-carousel-actions" aria-label="${escapeHtml(category)} carousel controls">
                    <button class="library-carousel-btn" type="button" data-carousel-target="${escapeHtml(buildShelfId('published', category))}" data-carousel-direction="prev" aria-label="Scroll ${escapeHtml(category)} left">‹</button>
                    <button class="library-carousel-btn" type="button" data-carousel-target="${escapeHtml(buildShelfId('published', category))}" data-carousel-direction="next" aria-label="Scroll ${escapeHtml(category)} right">›</button>
                  </div>
                </div>
              </div>
              <div class="library-shelf-row" id="${escapeHtml(buildShelfId('published', category))}">
                ${items
                  .map(
                    (post) => `
                      <article class="card library-book-card">
                        <div class="library-book-meta">
                          <span class="library-badge">${escapeHtml(post.badge || PUBLIC_CATEGORY_LABELS[post.category] || post.category || 'Read')}</span>
                        </div>
                        <img src="${escapeHtml(post.images?.card || fallbackImages.card || '')}" alt="${escapeHtml(post.title || '')}" loading="lazy" decoding="async" />
                        <h4>${escapeHtml(post.title || '')}</h4>
                        <p>${escapeHtml(post.description || '')}</p>
                        ${post.published_at ? `<p class="small-copy">${escapeHtml(formatShelfDate(post.published_at))}</p>` : ''}
                        <a class="text-link" href="${escapeHtml(post.url || '#')}">Open post</a>
                      </article>
                    `
                  )
                  .join('')}
              </div>
            </section>
          `
      )
      .join('');

    publishedTargets.forEach((target) => {
      target.innerHTML = publishedShelvesHtml;
    });

    const previewImage = fallbackImages.card || '';
    const studioShelvesHtml = Object.entries(STUDIO_PREVIEW_SHELVES)
      .map(
        ([category, titles]) => `
            <section class="library-shelf">
              <div class="section-heading-row">
                <div>
                  <p class="overline">Studio queue</p>
                  <h3>${escapeHtml(category)}</h3>
                </div>
                <div class="library-shelf-head-actions">
                  <span class="small-copy">${titles.length} drafts</span>
                  <div class="library-carousel-actions" aria-label="${escapeHtml(category)} studio carousel controls">
                    <button class="library-carousel-btn" type="button" data-carousel-target="${escapeHtml(buildShelfId('studio', category))}" data-carousel-direction="prev" aria-label="Scroll ${escapeHtml(category)} drafts left">‹</button>
                    <button class="library-carousel-btn" type="button" data-carousel-target="${escapeHtml(buildShelfId('studio', category))}" data-carousel-direction="next" aria-label="Scroll ${escapeHtml(category)} drafts right">›</button>
                  </div>
                </div>
              </div>
              <div class="library-shelf-row" id="${escapeHtml(buildShelfId('studio', category))}">
                ${titles
                  .map(
                    (title) => `
                      <article class="card library-book-card library-book-card-draft">
                        <div class="library-book-meta">
                          <span class="library-badge">Studio Draft</span>
                        </div>
                        <img src="${escapeHtml(previewImage)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" />
                        <h4>${escapeHtml(title)}</h4>
                        <p>Queued for review inside Made For This Studio before final publish.</p>
                        <a class="text-link" href="${escapeHtml(
                          (liveDraftMap[String(title).trim().toLowerCase()] || {}).blogDraftId
                            ? buildDraftPreviewUrl(liveDraftMap[String(title).trim().toLowerCase()])
                            : '/blog/'
                        )}">${
                          (liveDraftMap[String(title).trim().toLowerCase()] || {}).blogDraftId
                            ? 'Open draft post'
                            : 'Open Blog Hub'
                        }</a>
                      </article>
                    `
                  )
                  .join('')}
              </div>
            </section>
          `
      )
      .join('');

    studioTargets.forEach((target) => {
      target.innerHTML = studioShelvesHtml;
    });

    featuredTargets.forEach((target) => {
      const cardCount = target.id === 'blog-hub-featured' ? 6 : 3;
      target.innerHTML = combinedPosts
        .slice(0, cardCount)
        .map(
          (post) => `
            <article class="card feature-story-card">
              <div class="library-book-meta">
                <span class="library-badge">${escapeHtml(post.badge || PUBLIC_CATEGORY_LABELS[post.category] || post.category || 'Featured')}</span>
              </div>
              <img src="${escapeHtml(post.images?.card || fallbackImages.card || '')}" alt="${escapeHtml(post.title || '')}" loading="lazy" decoding="async" width="900" height="1200" />
              <h3>${escapeHtml(post.title || '')}</h3>
              <p>${escapeHtml(post.description || '')}</p>
              <a class="text-link" href="${escapeHtml(post.url || '#')}">Read more</a>
            </article>
          `
        )
        .join('');
    });

    document.querySelectorAll('img[data-post-slug][data-post-image]').forEach((img) => {
      const slug = img.getAttribute('data-post-slug');
      const imageType = img.getAttribute('data-post-image');
      if (!slug || !imageType) return;
      const target = postMap[slug]?.images?.[imageType] || fallbackImages[imageType];
      if (target) img.src = target;
    });

    const pageSlug = document.body?.getAttribute('data-post-slug');
    if (!pageSlug || !postMap[pageSlug]) return;

    const pagePost = postMap[pageSlug];
    const canonicalUrl = pagePost.url || window.location.href;
    const seoImage = pagePost.images?.pinterest || pagePost.images?.hero || pagePost.images?.card;

    setCanonical(canonicalUrl);
    setOrCreateMeta('og:type', 'article');
    setOrCreateMeta('og:title', pagePost.title);
    setOrCreateMeta('og:description', pagePost.description);
    setOrCreateMeta('og:url', canonicalUrl);
    setOrCreateMeta('og:image', seoImage);
    setOrCreateMeta('twitter:card', 'summary_large_image', 'name');
    setOrCreateMeta('twitter:title', pagePost.title, 'name');
    setOrCreateMeta('twitter:description', pagePost.description, 'name');
    setOrCreateMeta('twitter:image', seoImage, 'name');

    document.querySelectorAll('img[data-post-image]').forEach((img) => {
      const imageType = img.getAttribute('data-post-image');
      if (!imageType) return;
      const target = pagePost.images?.[imageType] || fallbackImages[imageType];
      if (target) img.src = target;
    });
  } catch {
    // Static-safe: skip if JSON is unavailable.
  }
};

if (isInternalRoute()) {
  renderInternalAccessDenied();
}

hydrateTheme();
normalizeStylesheetVersion();
applyImageOverrides();
normalizeMainNav();
normalizePublicFooter();
normalizeBrandLogos();
mountBackgroundLogoMark();
mountPageLoader();
enhanceRevealMotion();
setupDesktopParallax();
hydratePostImageAndSeo();

document.addEventListener('click', (event) => {
  const trigger = event.target instanceof HTMLElement ? event.target.closest('[data-carousel-target]') : null;
  if (!trigger) return;
  const targetId = trigger.getAttribute('data-carousel-target');
  const direction = trigger.getAttribute('data-carousel-direction');
  if (!targetId || !direction) return;
  const shelf = document.getElementById(targetId);
  if (!shelf) return;
  const amount = Math.max(220, Math.round(shelf.clientWidth * 0.88));
  shelf.scrollBy({
    left: direction === 'prev' ? -amount : amount,
    behavior: 'smooth'
  });
});
hydrateFunnelDrivenLinks();
unlockBundleDirectLinks();
trackEvent('page_view', {
  page_type: document.body?.dataset?.postSlug ? 'post' : window.location.pathname.includes('/printables') ? 'printable' : 'page',
  content_group: window.location.pathname
});

const triggerVisitorEmail = async (payload) => {
  try {
    await fetch(VISITOR_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Silent fail for static hosting when backend is unavailable.
  }
};

document.querySelectorAll('[data-email-trigger]').forEach((link) => {
  link.addEventListener('click', () => {
    trackEvent('email_cta_clicked', {
      link_url: link.href || window.location.href,
      link_text: (link.textContent || '').trim() || 'Email CTA',
      source: 'data_email_trigger'
    });
    const postTitle = link.getAttribute('data-post-title') || 'Why I Started Made for This';
    triggerVisitorEmail({
      event: 'post_click',
      siteKey: SITE_KEY,
      email: 'christinac90@yahoo.com',
      postTitle,
      subject: 'A visitor clicked Nina’s featured blog post',
      body: `A visitor clicked "${postTitle}".\n\nThis blog is different from most lifestyle blogs because it blends authentic storytelling, practical tools, and printable bundle resources in one place.\n\nUpsell link: https://aik9kennel.online`,
      upsellUrl: 'https://aik9kennel.online',
      landingUrl: window.location.href
    });
  });
});

document.querySelectorAll('.lead-capture-form').forEach((form) => {
  const primeStart = () => markLeadSignupStarted(form);
  form.addEventListener('focusin', primeStart, { once: true });
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', primeStart, { once: true });
  });
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  const text = (link.textContent || '').trim();

  if (href.startsWith('mailto:')) {
    trackEvent('email_cta_clicked', {
      link_url: href,
      link_text: text || 'mailto',
      source: 'mailto'
    });
  }

  if (
    href.includes('/live-printables/') ||
    href.includes('/codee-live-printables/') ||
    link.matches('[data-pin-gate]') ||
    /view this bundle|open pack|open bundle|preview/i.test(text)
  ) {
    trackEvent('product_preview_opened', {
      link_url: href || window.location.href,
      link_text: text || 'preview',
      source: 'preview_click'
    });
  }

  if (link.classList.contains('bundle-direct-link') || /starter-printable-library|downloads\/.*\.zip/i.test(href)) {
    trackEvent('free_bundle_downloaded', {
      link_url: href,
      link_text: text || 'download',
      source: 'download_link'
    });
  }
});

if (menuToggle && mainNav) {
  if (!menuToggle.getAttribute('aria-label')) {
    menuToggle.setAttribute('aria-label', 'Toggle menu');
  }

  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open');
    document.body.classList.toggle('menu-open', !expanded);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

// Shared footer year
const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const launchCountdownCard = document.querySelector('[data-launch-countdown]');

const startLaunchCountdown = () => {
  if (!launchCountdownCard) return;
  const target = String(launchCountdownCard.getAttribute('data-launch-target') || '').trim();
  const targetTime = new Date(target).getTime();
  if (!Number.isFinite(targetTime)) return;

  const daysNode = launchCountdownCard.querySelector('[data-countdown-days]');
  const hoursNode = launchCountdownCard.querySelector('[data-countdown-hours]');
  const minutesNode = launchCountdownCard.querySelector('[data-countdown-minutes]');
  const secondsNode = launchCountdownCard.querySelector('[data-countdown-seconds]');

  const tick = () => {
    const diff = Math.max(0, targetTime - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (daysNode) daysNode.textContent = String(days);
    if (hoursNode) hoursNode.textContent = String(hours).padStart(2, '0');
    if (minutesNode) minutesNode.textContent = String(minutes).padStart(2, '0');
    if (secondsNode) secondsNode.textContent = String(seconds).padStart(2, '0');
  };

  tick();
  window.setInterval(tick, 1000);
};

startLaunchCountdown();

// Dashboard image upload controls
const imageUploadForm = document.getElementById('image-upload-form');
const dashboardMessage = document.getElementById('dashboard-message');
const imageSlot = document.getElementById('image-slot');
const imageFile = document.getElementById('image-file');
const removeImageBtn = document.getElementById('remove-image');
const clearImagesBtn = document.getElementById('clear-images');
const applyPlaceholdersBtn = document.getElementById('apply-placeholders');
const makeUpdatesLiveBtn = document.getElementById('make-updates-live');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressLabel = document.getElementById('upload-progress-label');
const themePreset = document.getElementById('theme-preset');
const themeMessage = document.getElementById('theme-message');
const applyThemeBtn = document.getElementById('apply-theme');
const applyCustomThemeBtn = document.getElementById('apply-custom-theme');
const resetThemeBtn = document.getElementById('reset-theme');
const customBg = document.getElementById('custom-bg');
const customBgSoft = document.getElementById('custom-bg-soft');
const customSurface = document.getElementById('custom-surface');
const customText = document.getElementById('custom-text');
const customLine = document.getElementById('custom-line');
const customAccent = document.getElementById('custom-accent');
const printableStudioForm = document.getElementById('printable-studio-form');
const printablePromptField = document.getElementById('printable-prompt');
const printableReferenceImageField = document.getElementById('printable-reference-image');
const printableVariationCountField = document.getElementById('printable-variation-count');
const printableStudioMessage = document.getElementById('printable-studio-message');
const printableStudioLinks = document.getElementById('printable-studio-links');
const printablePackLinks = document.getElementById('printable-pack-links');
const printableMarkLiveBtn = document.getElementById('printable-mark-live');
const analyticsStatus = document.getElementById('analytics-status');
const analyticsSummaryCards = document.getElementById('analytics-summary-cards');
const analyticsTraffic = document.getElementById('analytics-traffic');
const analyticsSeo = document.getElementById('analytics-seo');
const analyticsEmail = document.getElementById('analytics-email');
const analyticsSales = document.getElementById('analytics-sales');
const analyticsSocial = document.getElementById('analytics-social');
const folderTabs = Array.from(document.querySelectorAll('[data-tab-target]'));
const folderPanels = Array.from(document.querySelectorAll('[data-tab-panel]'));
const pinterestFrequency = document.getElementById('pinterest-frequency');
const pinterestFocusUrl = document.getElementById('pinterest-focus-url');
const pinterestSecondaryUrl = document.getElementById('pinterest-secondary-url');
const pinterestHookAngle = document.getElementById('pinterest-hook-angle');
const pinterestKeywords = document.getElementById('pinterest-keywords');
const pinterestCampaignPrompts = document.getElementById('pinterest-campaign-prompts');
const pinterestTitleBank = document.getElementById('pinterest-title-bank');
const pinterestDescriptionBank = document.getElementById('pinterest-description-bank');
const pinterestPromptCards = document.getElementById('pinterest-prompt-cards');
const pinterestSavedDrafts = document.getElementById('pinterest-saved-drafts');
const pinterestCustomUploads = document.getElementById('pinterest-custom-uploads');
const promptVaultTopicSelect = document.getElementById('prompt-vault-topic');
const promptVaultRefreshBtn = document.getElementById('prompt-vault-refresh');
const promptVaultCopyTopicBtn = document.getElementById('prompt-vault-copy-topic');
const promptVaultStatus = document.getElementById('prompt-vault-status');
const promptVaultRefreshNote = document.getElementById('prompt-vault-refresh-note');
const promptVaultIntelligence = document.getElementById('prompt-vault-intelligence');
const promptVaultApproved = document.getElementById('prompt-vault-approved');
const promptVaultGallery = document.getElementById('prompt-vault-gallery');
const promptVaultPrevBtn = document.getElementById('prompt-vault-prev');
const promptVaultNextBtn = document.getElementById('prompt-vault-next');
const pinterestTaskChecks = Array.from(document.querySelectorAll('[data-pinterest-task]'));
const savePinterestPlanBtn = document.getElementById('save-pinterest-plan');
const copyPinterestPromptsBtn = document.getElementById('copy-pinterest-prompts');
const copyPinterestTitlesBtn = document.getElementById('copy-pinterest-titles');
const copyPinterestDescriptionsBtn = document.getElementById('copy-pinterest-descriptions');
const renderPinterestPromptsBtn = document.getElementById('render-pinterest-prompts');
const clearPinterestSavedDraftsBtn = document.getElementById('clear-pinterest-saved-drafts');
const pinterestStatusButtons = Array.from(document.querySelectorAll('[data-pinterest-status]'));
const pinterestPlanMessage = document.getElementById('pinterest-plan-message');
const pinterestGeneratorStatus = document.getElementById('pinterest-generator-status');
const pinterestGeneratorProgress = document.getElementById('pinterest-generator-progress');
const pinterestGeneratorProgressLabel = document.getElementById('pinterest-generator-progress-label');
const pinterestCustomUploadForm = document.getElementById('pinterest-custom-upload-form');
const pinterestCustomTitle = document.getElementById('pinterest-custom-title');
const pinterestCustomIsCover = document.getElementById('pinterest-custom-is-cover');
const pinterestCustomNotes = document.getElementById('pinterest-custom-notes');
const pinterestCustomTopic = document.getElementById('pinterest-custom-topic');
const pinterestCustomFile = document.getElementById('pinterest-custom-file');
const pinterestCustomUploadProgress = document.getElementById('pinterest-custom-upload-progress');
const pinterestCustomUploadProgressLabel = document.getElementById('pinterest-custom-upload-progress-label');
const pinterestCustomUploadMessage = document.getElementById('pinterest-custom-upload-message');
const pinterestWeekFields = Array.from({ length: 7 }, (_, index) => document.getElementById(`pinterest-day-${index + 1}`));
const canvaConnectionStatus = document.getElementById('canva-connection-status');
const canvaConnectionNote = document.getElementById('canva-connection-note');
const canvaConnectButton = document.getElementById('canva-connect-button');
const canvaRefreshWorkspaceButton = document.getElementById('canva-refresh-workspace');
const canvaImportForm = document.getElementById('canva-import-form');
const canvaImportTitle = document.getElementById('canva-import-title');
const canvaImportUrl = document.getElementById('canva-import-url');
const canvaImportType = document.getElementById('canva-import-type');
const canvaImportNotes = document.getElementById('canva-import-notes');
const canvaImportMessage = document.getElementById('canva-import-message');
const canvaImportQueue = document.getElementById('canva-import-queue');
const canvaSummaryConnection = document.getElementById('canva-summary-connection');
const canvaSummaryAccount = document.getElementById('canva-summary-account');
const canvaSummaryQueue = document.getElementById('canva-summary-queue');
const canvaSummaryPending = document.getElementById('canva-summary-pending');
const canvaSummaryReady = document.getElementById('canva-summary-ready');
const canvaSummaryLatest = document.getElementById('canva-summary-latest');
const canvaCapabilityList = document.getElementById('canva-capability-list');
const canvaRefreshNote = document.getElementById('canva-refresh-note');
const canvaSourceLibrary = document.getElementById('canva-source-library');
const canvaDesignStatus = document.getElementById('canva-design-status');
const googleInboxConnectionStatus = document.getElementById('google-inbox-connection-status');
const googleInboxConnectionNote = document.getElementById('google-inbox-connection-note');
const googleInboxConnectButton = document.getElementById('google-inbox-connect-button');
const googleInboxScanButton = document.getElementById('google-inbox-scan-button');
const googleInboxRecords = document.getElementById('google-inbox-records');
const generateBlogDraftsButton = document.getElementById('generate-blog-drafts');
const refreshBlogSignalsButton = document.getElementById('refresh-blog-signals');
const blogDraftsStatus = document.getElementById('blog-drafts-status');
const blogDraftsGrid = document.getElementById('blog-drafts-grid');
const blogDraftCount = document.getElementById('blog-draft-count');
const contentSignalCount = document.getElementById('content-signal-count');
const contentSignalsStatus = document.getElementById('content-signals-status');
const contentSignalsGrid = document.getElementById('content-signals-grid');
const pinterestDetailsStatus = document.getElementById('pinterest-details-status');
const pinterestDetailsGrid = document.getElementById('pinterest-details-grid');

let madeForThisContentOs = { drafts: [], signals: [], summary: {} };

const PINTEREST_PLAN_KEY = 'mft-dashboard-pinterest-plan-v1';
const PINTEREST_DRAFTS_KEY = 'mft-dashboard-pinterest-drafts-v1';
const PINTEREST_CUSTOM_UPLOADS_KEY = 'mft-dashboard-pinterest-custom-uploads-v1';
const PROMPT_VAULT_STATE_KEY = 'mft-dashboard-prompt-vault-v1';
const PROMPT_VAULT_SELECTED_TOPIC_KEY = 'mft-dashboard-prompt-vault-selected-topic-v1';
const PROMPT_VAULT_REFRESH_MS = 6 * 60 * 60 * 1000;
let canvaWorkspaceState = null;
let dashboardReportingState = null;
const promptVaultHeroGenerationState = {};

const PROMPT_VAULT_TOPICS = [
  {
    id: 'relatable-quotes',
    label: 'Relatable',
    heading: 'Relatable Quote Coloring Pages',
    subtext: '10 Simple Designs to Color',
    subject: 'realistic printable coloring page bundle mockup for a modern, minimal brand',
    previewQuotes: ['I need a minute', 'Doing my best today', 'One thing at a time'],
    illustrationNotes: 'simple coffee cup doodle, cozy blanket or pillow, small calm face or relaxed character',
    styleNotes:
      'clean black and white line art, thick smooth outlines, minimal detail, easy to color, slightly mature but still kid-friendly',
    sceneNotes:
      'light beige or cream surface, soft wood elements, neutral toned colored pencils, small wooden pencil holder, minimal binder clips, soft natural daylight, gentle shadows, warm calm tone, realistic product photography feel',
    seedImages: [
      'https://storage.googleapis.com/clients.digioffice.shop/codee-generated/madeforthis/pinterest-drafts/2026-03-22/relatable-topic-hero-test-bb6a50c4dc.png',
      '/assets/printables/funny-preview.svg',
      '/assets/printables/motivation-preview.svg',
      '/assets/printables/money-preview.svg'
    ]
  },
  {
    id: 'calm-cozy',
    label: 'Calm & Cozy',
    heading: 'Calm & Cozy Coloring Pages',
    subtext: '10 Relaxing Designs to Color',
    subject: 'realistic printable coloring page bundle mockup for a calm, cozy lifestyle-themed coloring set',
    previewQuotes: ['Slow days are okay', 'Cozy and calm', 'Rest and reset'],
    illustrationNotes: 'steaming mug, cozy socks or blanket, small plant or window scene, simple bed or reading nook',
    styleNotes: 'minimal black and white line art, soft rounded doodles, clean lines, balanced white space',
    sceneNotes:
      'warm neutral desk or fabric background, soft linen or textured beige surface, wooden cup with pencils, soft neutral props, optional folded notebook, diffused daylight, cozy shadows, Pinterest-friendly mood',
    seedImages: [
      'https://storage.googleapis.com/clients.digioffice.shop/codee-generated/madeforthis/pinterest-drafts/2026-03-22/calm-cozy-topic-hero-5704e0b630.png',
      '/assets/printables/faith-peace-preview-1.svg',
      '/assets/printables/faith-peace-preview-2.svg',
      '/assets/printables/faith-peace-preview-3.svg'
    ]
  },
  {
    id: 'quiet-time',
    label: 'Quiet Time',
    heading: 'Quiet Time Coloring Pages',
    subtext: '10 Calm & Easy Pages for Kids',
    subject: 'realistic printable coloring page bundle mockup designed for parents looking for quiet time activities for kids',
    previewQuotes: ['Quiet time', 'Color and relax', 'Take a calm moment'],
    illustrationNotes: 'child sitting and coloring, simple stars or clouds, soft smiling character, basic playful doodles',
    styleNotes: 'clean black and white line art, thicker lines, simple shapes, very easy to follow, soothing and parent-friendly',
    sceneNotes:
      'light neutral desk, soft minimal background, a few colored pencils, very gentle shadows, clean and practical setup, no overstimulation',
    seedImages: [
      'https://storage.googleapis.com/clients.digioffice.shop/codee-generated/madeforthis/pinterest-drafts/2026-03-22/quiet-time-topic-hero-77e115a609.png',
      '/assets/printables/kids-activity/kids-quiet-preview.png',
      '/assets/printables/kids-activity/kids-coloring-preview.png',
      '/assets/printables/kids-activity/kids-find-preview.png'
    ]
  },
  {
    id: 'general-quotes',
    label: 'General Quotes',
    heading: 'Quote Coloring Pages',
    subtext: '10 Easy Designs to Color',
    subject: 'realistic printable coloring page bundle mockup for a simple and modern quote coloring set',
    previewQuotes: ['Be kind', 'Keep going', 'You’ve got this'],
    illustrationNotes: 'simple hearts, stars, smiley faces, light decorative doodles',
    styleNotes: 'minimal black and white, clean outlines, balanced and neutral, not too childish',
    sceneNotes:
      'clean beige background, minimal props, a few neutral pencils, optional binder clip, soft daylight, natural shadows, versatile for all audiences',
    seedImages: [
      'https://storage.googleapis.com/clients.digioffice.shop/codee-generated/madeforthis/pinterest-drafts/2026-03-22/general-quotes-topic-hero-76b50b4a64.png',
      '/assets/printables/funny-preview.svg',
      '/assets/printables/motivation-preview.svg',
      '/assets/printables/faith-peace-preview-1.svg'
    ]
  },
];

const PROMPT_VAULT_VARIANTS = [
  { id: 'hero-stack', title: 'Hero stack mockup', angle: 'top page fully visible with 3 smaller preview pages layered neatly in front' },
  { id: 'desk-flatlay', title: 'Desk flatlay', angle: 'flat-lay scene with a centered stack of printable sheets and calm styling props nearby' },
  { id: 'soft-wood', title: 'Soft wood surface', angle: 'slightly angled product shot with soft wood accents and light beige surface textures' },
  { id: 'pencil-holder', title: 'Pencil holder variation', angle: 'include a small wooden pencil holder and only a few muted pencils for a clean realistic setup' },
  { id: 'binder-clip', title: 'Binder clip variation', angle: 'show neat binder clips and layered preview sheets without clutter or loud props' },
  { id: 'close-crop', title: 'Close crop preview', angle: 'slightly closer crop so the title and layered mini pages feel more premium and Pinterest-ready' },
];

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value || 0));
const formatCurrency = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100);
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const renderSimpleRows = (rows, emptyMessage = 'No data yet.') => {
  if (!Array.isArray(rows) || !rows.length) return `<p class="small-copy">${emptyMessage}</p>`;
  return `
    <div class="analytics-table">
      ${rows
        .map(
          (row) => `
            <div class="analytics-row">
              <span>${row.label || row.title || row.productKey || 'Item'}</span>
              <strong>${row.count !== undefined ? formatNumber(row.count) : row.value !== undefined ? row.value : row.revenueCents !== undefined ? formatCurrency(row.revenueCents) : row.url || ''}</strong>
            </div>
          `
        )
        .join('')}
    </div>
  `;
};

const renderProviderPills = (providerStatus = {}) =>
  Object.entries(providerStatus)
    .map(([key, value]) => {
      const ready =
        key === 'metricool'
          ? Boolean(value?.brandReady)
          : Boolean(value?.configured || value?.measurementProtocolReady || value?.dataApiReady || value?.apiReady);
      return `<span class="analytics-pill ${ready ? 'ready' : 'pending'}">${key}${ready ? ' ready' : ' needs setup'}</span>`;
    })
    .join('');

const normalizeTrafficBucket = (label = '') => {
  const value = String(label || '').trim().toLowerCase();
  if (!value || value === '(not set)') return 'Other';
  if (value.includes('pinterest')) return 'Pinterest';
  if (value.includes('(direct)') || value.includes('(none)') || value === 'direct') return 'Direct';
  if (value.includes('madeforthis.web.app') || value.includes('/internal') || value.includes('internal')) return 'Blog Internal';
  return 'Other';
};

const buildPromptVaultIntelligenceRows = (topic) => {
  const report = dashboardReportingState || {};
  const providerStatus = report.providerStatus || {};
  const traffic = report.sections?.traffic || {};
  const referrals = Array.isArray(traffic.topReferralSources) ? traffic.topReferralSources : [];
  const pinterestReferrals = referrals
    .filter((row) => normalizeTrafficBucket(row.label) === 'Pinterest')
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
  const referenceImages = getPromptVaultTopicReferenceImages(topic.id);
  const topicState = ensurePromptVaultTopicState(topic.id);
  const heroGenerated = Boolean(topicState?.topicHeroImage);
  const metricoolReady = Boolean(providerStatus.metricool?.brandReady);
  const socialReady = metricoolReady ? 'Connected and brand-ready' : 'Needs brand-level Metricool setup';
  const nextMove =
    pinterestReferrals > 0
      ? 'Repin the strongest winner and update the CTA on the destination page.'
      : metricoolReady
        ? 'Publish two fresh pins from this topic and watch for first-click patterns.'
        : 'Finish the social connection path so Codee can rank Pinterest performance, not just suggest topics.';
  return [
    {
      title: 'Connected Source Intelligence',
      body: `Metricool is ${socialReady}. Pinterest is already visible in reporting${pinterestReferrals ? ` with ${formatNumber(pinterestReferrals)} tracked referral click${pinterestReferrals === 1 ? '' : 's'}` : ''}.`,
    },
    {
      title: 'Topic Focus',
      body: `${topic.heading} is active. Codee is weighting this wall for clean printable mockups, calm Pinterest-ready layouts, and repeatable bundle framing.${referenceImages.length ? ` ${formatNumber(referenceImages.length)} uploaded reference image${referenceImages.length === 1 ? '' : 's'} are linked to this topic.` : ''}`,
    },
    {
      title: 'Next Best Move',
      body: nextMove,
    },
    {
      title: 'Traffic Signal',
      body: `Current top source mix: ${(referrals.slice(0, 3).map((row) => `${normalizeTrafficBucket(row.label)} ${formatNumber(row.count)}`).join(' • ')) || 'No tracked sources yet'}.`,
    },
    {
      title: 'Image Cycle',
      body: referenceImages.length
        ? 'Uploaded topic references are active, so Codee uses those visuals as the first suggestion layer for this wall.'
        : heroGenerated
          ? 'A generated topic hero image is attached to this wall and will refresh on the 6-hour suggestion cycle.'
          : 'No generated topic hero yet. Codee will create one and carry it across this wall on the next refresh.',
    },
  ];
};

const renderPromptVaultIntelligence = (topic) => {
  if (!promptVaultIntelligence) return;
  const rows = buildPromptVaultIntelligenceRows(topic);
  promptVaultIntelligence.innerHTML = rows
    .map(
      (row) => `
        <article class="prompt-vault-intelligence-card">
          <h4>${escapeHtml(row.title)}</h4>
          <p class="small-copy">${escapeHtml(row.body)}</p>
        </article>
      `
    )
    .join('');
};

const loadDashboardReporting = async () => {
  if (!analyticsSummaryCards) return;
  if (analyticsStatus) analyticsStatus.textContent = 'Loading reporting...';
  try {
    const endpoint = buildFunnelGetUrl('/api/funnel/reporting', { siteKey: SITE_KEY });
    const response = await fetch(endpoint, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Reporting load failed.');
    const report = data?.report || {};
    dashboardReportingState = report;
    const summary = report.summaryCards || {};
    const sections = report.sections || {};

    analyticsSummaryCards.innerHTML = `
      <article class="analytics-card">
        <p class="overline">Today</p>
        <h3>${formatNumber(summary.today?.visits)}</h3>
        <p class="small-copy">visits</p>
        <div class="analytics-mini-grid">
          <span>${formatNumber(summary.today?.signups)} signups</span>
          <span>${formatNumber(summary.today?.downloads)} downloads</span>
          <span>${formatNumber(summary.today?.purchases)} purchases</span>
        </div>
      </article>
      <article class="analytics-card">
        <p class="overline">This Week</p>
        <h3>What’s winning</h3>
        <div class="analytics-mini-grid analytics-mini-grid-rows">
          <span><strong>Blog:</strong> ${summary.thisWeek?.topBlogPost || 'No data yet'}</span>
          <span><strong>Printable:</strong> ${summary.thisWeek?.topPrintablePage || 'No data yet'}</span>
          <span><strong>Source:</strong> ${summary.thisWeek?.bestTrafficSource || 'No data yet'}</span>
          <span><strong>Social:</strong> ${summary.thisWeek?.bestSocialPost || 'No data yet'}</span>
        </div>
      </article>
      <article class="analytics-card">
        <p class="overline">This Month</p>
        <h3>${formatCurrency(summary.thisMonth?.revenueCents)}</h3>
        <p class="small-copy">revenue</p>
        <div class="analytics-mini-grid analytics-mini-grid-rows">
          <span>${formatNumber(summary.thisMonth?.subscriberGrowth)} subscriber growth</span>
          <span>${formatNumber(summary.thisMonth?.searchClicks)} search clicks</span>
          <span>${formatPercent(summary.thisMonth?.landingPageConversionRate)} landing conversion</span>
          <span>${summary.thisMonth?.topProduct || 'No top product yet'}</span>
        </div>
      </article>
    `;

    analyticsTraffic.innerHTML = `
      <div class="analytics-section-grid">
        <div class="analytics-card analytics-card-compact"><p class="overline">Traffic</p><h3>${formatNumber(sections.traffic?.sessions)}</h3><p class="small-copy">sessions</p></div>
        <div class="analytics-card analytics-card-compact"><p class="overline">Users</p><h3>${formatNumber(sections.traffic?.users)}</h3><p class="small-copy">users</p></div>
        <div class="analytics-card analytics-card-compact"><p class="overline">Pageviews</p><h3>${formatNumber(sections.traffic?.pageviews)}</h3><p class="small-copy">pageviews</p></div>
        <div class="analytics-card analytics-card-compact"><p class="overline">Realtime</p><h3>${formatNumber(sections.traffic?.realtimeVisitors)}</h3><p class="small-copy">visitors now</p></div>
      </div>
      <div class="analytics-columns">
        <div><h3>Top landing pages</h3>${renderSimpleRows(sections.traffic?.topLandingPages, 'Landing page data will appear after tracking starts.')}</div>
        <div><h3>Top referral sources</h3>${renderSimpleRows(sections.traffic?.topReferralSources, 'Referral source data will appear after tracking starts.')}</div>
      </div>
    `;

    analyticsSeo.innerHTML = `
      <div class="analytics-section-grid">
        <div class="analytics-card analytics-card-compact"><p class="overline">Clicks</p><h3>${formatNumber(sections.seo?.clicks)}</h3></div>
        <div class="analytics-card analytics-card-compact"><p class="overline">Impressions</p><h3>${formatNumber(sections.seo?.impressions)}</h3></div>
        <div class="analytics-card analytics-card-compact"><p class="overline">CTR</p><h3>${formatPercent(sections.seo?.ctr)}</h3></div>
      </div>
      <div class="analytics-columns">
        <div><h3>Top queries</h3>${renderSimpleRows(sections.seo?.topQueries, 'Search Console is not connected yet.')}</div>
        <div><h3>Top pages from search</h3>${renderSimpleRows(sections.seo?.topPages, 'Search page data will appear here.')}</div>
      </div>
    `;

    if (promptVaultTopicSelect) {
      renderPromptVault();
    }

    if (analyticsEmail) {
      analyticsEmail.innerHTML = `
        <div class="analytics-section-grid">
          <div class="analytics-card analytics-card-compact"><p class="overline">Subscribers</p><h3>${formatNumber(sections.email?.newSubscribers)}</h3></div>
          <div class="analytics-card analytics-card-compact"><p class="overline">Freebie signups</p><h3>${formatNumber(sections.email?.freeDownloadSignups)}</h3></div>
          <div class="analytics-card analytics-card-compact"><p class="overline">Welcome sends</p><h3>${formatNumber(sections.email?.welcomeEmailSends)}</h3></div>
        </div>
        <div class="analytics-columns">
          <div><h3>Top signup forms</h3>${renderSimpleRows(sections.email?.topSignupForms, 'Signup form performance will appear here.')}</div>
          <div><h3>Email flow status</h3><p class="small-copy">${sections.email?.flowStatus || 'No email flow data yet.'}</p></div>
        </div>
      `;
    }

    if (analyticsSales) {
      analyticsSales.innerHTML = `
        <div class="analytics-section-grid">
          <div class="analytics-card analytics-card-compact"><p class="overline">Purchases</p><h3>${formatNumber(sections.sales?.purchases)}</h3></div>
          <div class="analytics-card analytics-card-compact"><p class="overline">Revenue</p><h3>${formatCurrency(sections.sales?.revenueCents)}</h3></div>
          <div class="analytics-card analytics-card-compact"><p class="overline">Checkout starts</p><h3>${formatNumber(sections.sales?.checkoutStarts)}</h3></div>
          <div class="analytics-card analytics-card-compact"><p class="overline">Conversion</p><h3>${formatPercent(sections.sales?.checkoutConversionRate)}</h3></div>
        </div>
        <div class="analytics-columns">
          <div><h3>Revenue by product</h3>${renderSimpleRows(sections.sales?.revenueByProduct, 'Revenue by product will appear once purchases are tracked.')}</div>
          <div><h3>Checkout drop-off</h3><p class="small-copy">${formatNumber(sections.sales?.incompleteCheckoutIndicators)} incomplete or unfinished checkout signals tracked this month.</p></div>
        </div>
      `;
    }

    if (analyticsSocial) {
      analyticsSocial.innerHTML = `
        <div class="analytics-provider-row">${renderProviderPills(report.providerStatus || {})}</div>
        <div class="analytics-columns">
          <div><h3>Top posts</h3>${renderSimpleRows(sections.social?.topPosts, 'Metricool top posts will appear after the API connection is added.')}</div>
          <div>
            <h3>Platform summary</h3>
            <p class="small-copy">${sections.social?.flowStatus || 'Metricool status will appear here.'}</p>
            <p class="small-copy">Link clicks: ${formatNumber(sections.social?.linkClicks)}</p>
            <p class="small-copy">Follower growth: ${formatNumber(sections.social?.followerGrowth)}</p>
            ${Array.isArray(sections.social?.bestPostingTimes) && sections.social.bestPostingTimes.length ? renderSimpleRows(sections.social.bestPostingTimes) : '<p class="small-copy">Best posting times will populate after Metricool reporting is connected.</p>'}
          </div>
        </div>
      `;
    }

    if (analyticsStatus) analyticsStatus.textContent = `Reporting updated ${new Date(report.generatedAt || Date.now()).toLocaleString()}.`;
  } catch (error) {
    if (analyticsStatus) analyticsStatus.textContent = error.message || 'Reporting could not load.';
  }
};

const activateFolderTab = (tabKey) => {
  folderTabs.forEach((tab) => {
    const active = tab.getAttribute('data-tab-target') === tabKey;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  folderPanels.forEach((panel) => {
    const active = panel.getAttribute('data-tab-panel') === tabKey;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
};

const applyDashboardOAuthState = () => {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('platform') || '';
  const oauth = params.get('oauth') || '';
  if (platform === 'canva') {
    activateFolderTab('canva');
    if (canvaConnectionNote) {
      canvaConnectionNote.textContent =
        oauth === 'connected'
          ? 'Canva connected successfully. Refreshing the studio now.'
          : 'Canva connection was interrupted. Try Connect Canva again from this tab.';
    }
  }
  if (oauth || platform) {
    const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
};

if (folderTabs.length && folderPanels.length) {
  folderTabs.forEach((tab) => {
    tab.addEventListener('click', () => activateFolderTab(tab.getAttribute('data-tab-target') || 'traffic'));
  });
}

const readDashboardPreference = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeDashboardPreference = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const loadPinterestPlan = () => {
  if (!pinterestFrequency && !pinterestFocusUrl && !pinterestCampaignPrompts) return;
  const plan = readDashboardPreference(PINTEREST_PLAN_KEY, {});
  if (pinterestFrequency && plan.frequency) pinterestFrequency.value = plan.frequency;
  if (pinterestFocusUrl && plan.focusUrl) pinterestFocusUrl.value = plan.focusUrl;
  if (pinterestSecondaryUrl && plan.secondaryUrl) pinterestSecondaryUrl.value = plan.secondaryUrl;
  if (pinterestHookAngle && plan.hookAngle) pinterestHookAngle.value = plan.hookAngle;
  if (pinterestKeywords && plan.keywords) pinterestKeywords.value = plan.keywords;
  if (pinterestCampaignPrompts && plan.prompts) pinterestCampaignPrompts.value = plan.prompts;
  if (pinterestTitleBank && plan.titleBank) pinterestTitleBank.value = plan.titleBank;
  if (pinterestDescriptionBank && plan.descriptionBank) pinterestDescriptionBank.value = plan.descriptionBank;
  const activeStatus = String(plan.status || 'planning');
  pinterestStatusButtons.forEach((button) => {
    button.classList.toggle('is-active', button.getAttribute('data-pinterest-status') === activeStatus);
  });
  const tasks = plan.tasks || {};
  pinterestTaskChecks.forEach((input) => {
    input.checked = Boolean(tasks[input.getAttribute('data-pinterest-task') || '']);
  });
  const weeklyBoard = Array.isArray(plan.weeklyBoard) ? plan.weeklyBoard : [];
  pinterestWeekFields.forEach((field, index) => {
    if (field) field.value = weeklyBoard[index] || '';
  });
};

const splitPinterestPrompts = (rawText) =>
  String(rawText || '')
    .split(/\n\s*\n+/)
    .map((item) => item.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean);

let pinterestGeneratedDraftMap = {};

const loadSavedPinterestDrafts = () => readDashboardPreference(PINTEREST_DRAFTS_KEY, []);

const saveSavedPinterestDrafts = (items) => {
  writeDashboardPreference(PINTEREST_DRAFTS_KEY, items);
};

const loadSavedPinterestUploads = () => readDashboardPreference(PINTEREST_CUSTOM_UPLOADS_KEY, []);

const saveSavedPinterestUploads = (items) => {
  writeDashboardPreference(PINTEREST_CUSTOM_UPLOADS_KEY, items);
};

const getPromptVaultTopicReferenceImages = (topicId) =>
  loadSavedPinterestUploads()
    .filter((item) => String(item.topicId || '').trim() === String(topicId || '').trim() && String(item.imageUrl || '').trim())
    .map((item) => item.imageUrl)
    .filter(Boolean);

const buildPromptVaultPrompt = (topic, variant) => {
  const quotes = topic.previewQuotes.map((quote) => `“${quote}”`).join(', ');
  return [
    `Create a ${topic.subject}.`,
    `Main title on top page: ${topic.heading}.`,
    `Subtext on page: ${topic.subtext}.`,
    `Include 3 preview mini pages layered on top using these quotes: ${quotes}.`,
    `Illustrations on pages: ${topic.illustrationNotes}.`,
    `Style of drawings: ${topic.styleNotes}.`,
    `Scene setup: stack of printable pages slightly fanned out, top page fully visible, 2 to 3 smaller pages layered on top.`,
    `Environment and props: ${topic.sceneNotes}.`,
    `Variation direction: ${variant.angle}.`,
    'Add bold hand-lettered typography with thicker strokes, strong visual hierarchy, dynamic composition, playful but clean doodles, and intentional white space.',
    'Keep everything at 10 pages only. No bright colors, no clutter, no overly cartoonish style. Make it feel like a calm realistic printable product ready to download.'
  ].join(' ');
};

const buildPromptVaultCards = (topic, { referenceImages = [], heroImage = '' } = {}) =>
  PROMPT_VAULT_VARIANTS.map((variant, index) => {
    const uploadedImage = Array.isArray(referenceImages) && referenceImages.length ? referenceImages[index % referenceImages.length] : '';
    const seededImage = Array.isArray(topic.seedImages) && topic.seedImages.length ? topic.seedImages[index % topic.seedImages.length] : '';
    const imageUrl = uploadedImage || heroImage || seededImage || '';
    return {
      id: `${topic.id}-${variant.id}`,
      topicId: topic.id,
      topicLabel: topic.label,
      title: `${topic.label} ${index + 1}`,
      variantTitle: variant.title,
      prompt: buildPromptVaultPrompt(topic, variant),
      imageUrl,
      imageSource: uploadedImage ? 'upload' : heroImage ? 'generated-topic-hero' : seededImage ? 'seed' : 'none',
      storagePath: '',
      publicPath: '',
      model: '',
      feedback: 'pending',
      approvedAt: '',
      rejectedAt: '',
      updatedAt: ''
    };
  });

const createPromptVaultSeed = () =>
  PROMPT_VAULT_TOPICS.reduce((acc, topic) => {
    const referenceImages = getPromptVaultTopicReferenceImages(topic.id);
    const seededHeroImage = referenceImages.length ? '' : String(topic.seedImages?.[0] || '').trim();
    acc[topic.id] = {
      topicId: topic.id,
      topicLabel: topic.label,
      lastRefreshedAt: new Date().toISOString(),
      topicHeroImage: seededHeroImage,
      topicHeroGeneratedAt: seededHeroImage ? new Date().toISOString() : '',
      cards: buildPromptVaultCards(topic, { referenceImages, heroImage: seededHeroImage })
    };
    return acc;
  }, {});

const loadPromptVaultState = () => readDashboardPreference(PROMPT_VAULT_STATE_KEY, {});

const savePromptVaultState = (state) => {
  writeDashboardPreference(PROMPT_VAULT_STATE_KEY, state);
};

const loadPromptVaultTopicId = () =>
  localStorage.getItem(PROMPT_VAULT_SELECTED_TOPIC_KEY) || PROMPT_VAULT_TOPICS[0]?.id || 'relatable-quotes';

const savePromptVaultTopicId = (topicId) => {
  localStorage.setItem(PROMPT_VAULT_SELECTED_TOPIC_KEY, topicId);
};

const ensurePromptVaultTopicState = (topicId, { forceRefresh = false } = {}) => {
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId) || PROMPT_VAULT_TOPICS[0];
  if (!topic) return null;
  const state = loadPromptVaultState();
  const current = state[topic.id];
  const now = Date.now();
  const stale = !current?.lastRefreshedAt || now - new Date(current.lastRefreshedAt).getTime() >= PROMPT_VAULT_REFRESH_MS;
  if (!current || stale || forceRefresh) {
    const referenceImages = getPromptVaultTopicReferenceImages(topic.id);
    const seededHeroImage = referenceImages.length ? '' : String(current?.topicHeroImage || topic.seedImages?.[0] || '').trim();
    const seededCards = buildPromptVaultCards(topic, {
      referenceImages,
      heroImage: seededHeroImage,
    });
    const previousCards = Array.isArray(current?.cards) ? current.cards : [];
    state[topic.id] = {
      topicId: topic.id,
      topicLabel: topic.label,
      lastRefreshedAt: new Date().toISOString(),
      topicHeroImage: seededHeroImage,
      topicHeroGeneratedAt: referenceImages.length ? '' : String(current?.topicHeroGeneratedAt || (seededHeroImage ? new Date().toISOString() : '')).trim(),
      cards: seededCards.map((card) => {
        const existing = previousCards.find((item) => item?.id === card.id);
        return existing
          ? {
              ...card,
              ...existing,
              prompt: card.prompt,
              title: card.title,
              variantTitle: card.variantTitle,
              imageUrl: existing.imageUrl || card.imageUrl || '',
              imageSource:
                existing.imageSource === 'upload' || card.imageSource === 'upload'
                  ? 'upload'
                  : existing.imageSource === 'generated-topic-hero'
                    ? 'generated-topic-hero'
                    : card.imageSource,
            }
          : card;
      })
    };
    savePromptVaultState(state);
  }
  return loadPromptVaultState()[topic.id] || null;
};

const slugifyValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildPinterestAssetKey = ({ siteKey, title, isCover }) => {
  const base = slugifyValue(siteKey || 'client') || 'client';
  if (isCover) return `${base}-cover`;
  const suffix = slugifyValue(title || 'image') || 'image';
  return `${base}-cover-${suffix}`;
};

const getClientDashboardId = () => slugifyValue(SITE_KEY || 'madeforthis') || 'madeforthis';

const populateCanvaImportForm = ({ title = '', imageUrl = '', notes = '', assetType = 'pinterest_pin' } = {}) => {
  if (canvaImportTitle) canvaImportTitle.value = title;
  if (canvaImportUrl) canvaImportUrl.value = imageUrl;
  if (canvaImportNotes) canvaImportNotes.value = notes;
  if (canvaImportType) canvaImportType.value = assetType;
  if (canvaImportMessage) {
    canvaImportMessage.textContent = title ? `Loaded "${title}" into the Canva handoff form.` : 'Canva handoff form is ready.';
  }
};

const getCanvaStatusTone = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (!normalized) return 'pending';
  if (['success', 'completed', 'connected', 'approved_in_canva'].includes(normalized)) return 'ready';
  if (normalized.includes('error') || normalized === 'needs_revision') return 'pending';
  return 'pending';
};

const getLocalCanvaSourceAssets = () => {
  const drafts = loadSavedPinterestDrafts().map((item, index) => ({
    id: item.id || `draft-${index}`,
    title: item.label || `Saved draft ${index + 1}`,
    imageUrl: item.imageUrl || '',
    notes: item.prompt || '',
    assetType: 'pinterest_pin',
    sourceType: 'Generated draft',
    savedAt: item.savedAt || '',
  }));
  const uploads = loadSavedPinterestUploads().map((item, index) => ({
    id: item.id || `upload-${index}`,
    title: item.title || `Custom upload ${index + 1}`,
    imageUrl: item.imageUrl || '',
    notes: item.notes || '',
    assetType: 'pinterest_pin',
    sourceType: item.isCover ? 'Cover upload' : 'Custom upload',
    savedAt: item.savedAt || '',
  }));
  return [...uploads, ...drafts].filter((item) => item.imageUrl);
};

const renderCanvaSourceLibrary = () => {
  if (!canvaSourceLibrary) return;
  const items = getLocalCanvaSourceAssets();
  if (!items.length) {
    canvaSourceLibrary.innerHTML =
      '<div class="pinterest-draft-empty">No saved drafts or uploads yet. Create something in Pinterest Studio first, then send the winners here.</div>';
    return;
  }
  canvaSourceLibrary.innerHTML = items
    .slice(0, 8)
    .map(
      (item) => `
        <article class="pinterest-generated-card">
          <div class="pinterest-generated-card-header">
            <div>
              <h4>${escapeHtml(item.title || 'Canva source')}</h4>
              <p class="pinterest-card-status">${escapeHtml(item.sourceType || 'Dashboard asset')}</p>
            </div>
            <span class="analytics-pill ready">${escapeHtml(item.assetType || 'pinterest_pin')}</span>
          </div>
          <img src="${escapeHtml(item.imageUrl || '')}" alt="${escapeHtml(item.title || 'Canva source')}" loading="lazy" />
          <div class="pinterest-draft-meta">
            <span class="pinterest-card-status">${escapeHtml(item.notes || 'Ready to send into Canva for editing.')}</span>
            <span class="pinterest-card-status">${item.savedAt ? `Saved ${escapeHtml(new Date(item.savedAt).toLocaleString())}` : 'Saved in dashboard'}</span>
          </div>
          <div class="button-row">
            <button type="button" class="btn btn-primary" data-canva-prefill-title="${escapeHtml(item.title || '')}" data-canva-prefill-url="${escapeHtml(item.imageUrl || '')}" data-canva-prefill-notes="${escapeHtml(item.notes || '')}" data-canva-prefill-type="${escapeHtml(item.assetType || 'pinterest_pin')}">Load Into Canva Form</button>
            <a class="btn" href="${escapeHtml(item.imageUrl || '#')}" target="_blank" rel="noopener noreferrer">Open Asset</a>
          </div>
        </article>
      `
    )
    .join('');
};

const renderCanvaImportQueue = (workspace) => {
  if (!canvaImportQueue) return;
  const queue = Array.isArray(workspace?.queue) ? workspace.queue : [];
  if (!queue.length) {
    canvaImportQueue.innerHTML =
      '<div class="pinterest-draft-empty">No Canva imports queued yet. Load a generated draft or custom upload into the form above, then send it to Canva.</div>';
    return;
  }

  canvaImportQueue.innerHTML = queue
    .map(
      (item) => `
        <article class="pinterest-generated-card">
          <div class="pinterest-generated-card-header">
            <div>
              <h4>${escapeHtml(item.title || 'Untitled Canva import')}</h4>
              <p class="pinterest-card-status">Status: ${escapeHtml(item.canva_status || 'saved')}</p>
            </div>
            <span class="analytics-pill ${getCanvaStatusTone(item.canva_status)}">${escapeHtml(item.asset_type || 'pinterest_pin')}</span>
          </div>
          ${item.source_url ? `<img src="${escapeHtml(item.source_url)}" alt="${escapeHtml(item.title || 'Canva import')}" loading="lazy" />` : ''}
          <div class="pinterest-draft-meta">
            <span class="pinterest-card-status">Suggested key: ${escapeHtml(item.suggested_asset_key || '')}</span>
            ${item.canva_job_id ? `<span class="pinterest-card-status">Canva job: ${escapeHtml(item.canva_job_id)}</span>` : ''}
            ${item.canva_error ? `<span class="pinterest-card-status">Error: ${escapeHtml(item.canva_error)}</span>` : ''}
          </div>
          <p class="pinterest-prompt-text">${escapeHtml(item.notes || 'Saved for editable Canva production and later campaign reuse.')}</p>
          <div class="button-row">
            <button type="button" class="btn" data-canva-prefill-title="${escapeHtml(item.title || '')}" data-canva-prefill-url="${escapeHtml(item.source_url || '')}" data-canva-prefill-notes="${escapeHtml(item.notes || '')}" data-canva-prefill-type="${escapeHtml(item.asset_type || 'pinterest_pin')}">Reuse Form</button>
            ${item.canva_edit_url ? `<a class="btn btn-primary" href="${escapeHtml(item.canva_edit_url)}" target="_blank" rel="noopener noreferrer">Open in Canva</a>` : ''}
            ${item.canva_view_url ? `<a class="btn" href="${escapeHtml(item.canva_view_url)}" target="_blank" rel="noopener noreferrer">View Design</a>` : ''}
          </div>
        </article>
      `
    )
    .join('');
};

const renderCanvaSummary = (workspace) => {
  const canva = workspace?.canva || {};
  const summary = workspace?.summary || {};
  if (canvaSummaryConnection) {
    canvaSummaryConnection.textContent = canva.connected ? 'Connected' : 'Not Connected';
  }
  if (canvaSummaryAccount) {
    canvaSummaryAccount.textContent = canva.connected
      ? `${canva.provider_account_name || 'Canva approved'}${canva.last_refreshed_at ? ` • refreshed ${new Date(canva.last_refreshed_at).toLocaleString()}` : ''}`
      : 'Connect Canva once, then this studio can push launch assets into editable designs.';
  }
  if (canvaSummaryQueue) {
    canvaSummaryQueue.textContent = `${formatNumber(summary.total_items || 0)} assets`;
  }
  if (canvaSummaryPending) {
    canvaSummaryPending.textContent = `${formatNumber(summary.pending_items || 0)} pending • ${formatNumber(summary.error_items || 0)} issue${Number(summary.error_items || 0) === 1 ? '' : 's'}`;
  }
  if (canvaSummaryReady) {
    canvaSummaryReady.textContent = `${formatNumber(summary.ready_items || 0)} designs`;
  }
  if (canvaSummaryLatest) {
    canvaSummaryLatest.textContent = summary.latest_title
      ? `${summary.latest_title} • ${summary.latest_status || 'saved'}`
      : 'The latest design handoff will appear here.';
  }
  if (canvaCapabilityList) {
    const flags = canva.capability_flags || {};
    const scopes = Array.isArray(canva.granted_scopes) ? canva.granted_scopes : [];
    const pills = [
      { label: canva.connected ? 'OAuth approved' : 'Awaiting OAuth', ready: Boolean(canva.connected) },
      { label: scopes.includes('asset:write') ? 'Asset write' : 'Asset write pending', ready: scopes.includes('asset:write') },
      { label: scopes.includes('design:content:write') ? 'Design creation' : 'Design creation pending', ready: scopes.includes('design:content:write') },
      { label: scopes.includes('design:meta:read') ? 'Design metadata' : 'Design metadata pending', ready: scopes.includes('design:meta:read') },
      { label: flags.design_review ? 'Design review mode' : 'Design review staging', ready: Boolean(flags.design_review) || canva.connected },
    ];
    canvaCapabilityList.innerHTML = pills
      .map((pill) => `<span class="analytics-pill ${pill.ready ? 'ready' : 'pending'}">${escapeHtml(pill.label)}</span>`)
      .join('');
  }
  if (canvaRefreshNote) {
    canvaRefreshNote.textContent = canva.connected
      ? 'Canva is connected. Refresh anytime to pull the newest design status and edit links into this studio.'
      : 'Connect Canva first, then refresh to pull the newest design status and edit links into this studio.';
  }
  if (canvaDesignStatus) {
    const rows = [
      { label: 'Queued assets', value: formatNumber(summary.total_items || 0) },
      { label: 'Ready to edit', value: formatNumber(summary.ready_items || 0) },
      { label: 'Still processing', value: formatNumber(summary.pending_items || 0) },
      { label: 'Needs attention', value: formatNumber(summary.error_items || 0) },
    ];
    canvaDesignStatus.innerHTML = rows
      .map(
        (row) => `
          <div class="analytics-row">
            <span>${escapeHtml(row.label)}</span>
            <strong>${escapeHtml(row.value)}</strong>
          </div>
        `
      )
      .join('');
  }
};

const renderCanvaWorkspace = (workspace) => {
  canvaWorkspaceState = workspace;
  const canva = workspace?.canva || {};
  if (canvaConnectionStatus) {
    canvaConnectionStatus.textContent = canva.connected
      ? `Connected${canva.provider_account_name ? ` as ${canva.provider_account_name}` : ''}`
      : `Not connected (${canva.status || 'not_connected'})`;
  }
  if (canvaConnectionNote) {
    const scopes =
      Array.isArray(canva.granted_scopes) && canva.granted_scopes.length
        ? `Granted scopes: ${canva.granted_scopes.join(', ')}.`
        : canva.last_error
          ? `Canva auth error: ${canva.last_error}`
          : 'Once connected, hosted asset URLs can be turned into editable Canva designs from this dashboard.';
    canvaConnectionNote.textContent = scopes;
  }
  renderCanvaSummary(workspace);
  renderCanvaImportQueue(workspace);
  renderCanvaSourceLibrary();
};

const loadCanvaWorkspace = async () => {
  if (!canvaImportQueue && !canvaConnectionStatus) return;
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${encodeURIComponent(getClientDashboardId())}/canva/workspace`, {
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Could not load Canva workspace.');
    renderCanvaWorkspace(data);
  } catch (error) {
    if (canvaConnectionStatus) canvaConnectionStatus.textContent = 'Canva workspace unavailable.';
    if (canvaConnectionNote) canvaConnectionNote.textContent = error.message || 'Could not load Canva workspace.';
    renderCanvaImportQueue({ queue: [] });
  }
};

const renderGoogleInboxStatus = (payload) => {
  const status = payload?.status || {};
  if (googleInboxConnectionStatus) {
    googleInboxConnectionStatus.textContent = status.connected
      ? `Connected${status.account_name ? ` (${status.account_name})` : ''}`
      : `Not connected (${status.status || 'not_connected'})`;
  }
  if (googleInboxConnectionNote) {
    googleInboxConnectionNote.textContent = status.connected
      ? 'Read-only inbox scanning is ready. Codee can classify forwarded job alerts and opportunity emails into proposal-ready signals.'
      : status.configured
        ? 'Google Inbox OAuth is configured. Connect Christina’s inbox to unlock read-only signal scans.'
        : `Google Inbox app credentials are still missing${status.detail ? `: ${status.detail}` : ''}.`;
  }
  if (googleInboxRecords) {
    const rows = Array.isArray(payload?.records) ? payload.records : [];
    googleInboxRecords.innerHTML = rows.length
      ? rows
          .slice(0, 5)
          .map(
            (row) => `
              <div class="analytics-row">
                <span>${row.subject || 'Inbox signal'}</span>
                <strong>${row.sender || row.mailboxEmail || row.category || 'Stored'}</strong>
              </div>
            `
          )
          .join('')
      : '<div class="analytics-row"><span>Inbox signals</span><strong>No scanned records yet.</strong></div>';
  }
};

const loadGoogleInboxStatus = async () => {
  if (!googleInboxConnectionStatus && !googleInboxRecords) return;
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${encodeURIComponent(getClientDashboardId())}/inbox/google/status`, {
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.detail || data?.error || 'Could not load Google Inbox status.');
    renderGoogleInboxStatus(data);
  } catch (error) {
    if (googleInboxConnectionStatus) googleInboxConnectionStatus.textContent = 'Google Inbox unavailable.';
    if (googleInboxConnectionNote) googleInboxConnectionNote.textContent = error.message || 'Could not load Google Inbox status.';
  }
};

const renderMadeForThisSignals = (signals) => {
  if (contentSignalCount) contentSignalCount.textContent = String(Array.isArray(signals) ? signals.length : 0);
  if (!contentSignalsGrid) return;
  const rows = Array.isArray(signals) ? signals : [];
  contentSignalsGrid.innerHTML = rows.length
    ? rows
        .slice(0, 12)
        .map(
          (row) => `
            <div class="analytics-row">
              <span>
                <strong>${escapeHtml(row.subject || 'Made For This note')}</strong><br />
                <small>${escapeHtml(row.summary || row.requestedOutcome || 'No summary saved yet.')}</small>
              </span>
              <strong>${escapeHtml(row.sender || 'Inbox signal')}<br /><small>${escapeHtml(new Date(row.receivedAt || Date.now()).toLocaleString())}</small></strong>
            </div>
          `
        )
        .join('')
    : '<div class="analytics-row"><span>Recent Christina notes</span><strong>No matching inbox signals found in the last 2 days.</strong></div>';
};

const renderPinterestDetails = (drafts) => {
  if (!pinterestDetailsGrid) return;
  const approved = (Array.isArray(drafts) ? drafts : []).filter((row) => String(row.approvalStatus || '') === 'approved_sent_to_wordpress');
  if (!approved.length) {
    pinterestDetailsGrid.innerHTML = '<div class="pinterest-draft-empty">Approve a blog draft first. Its 3 Pinterest detail variants will appear here.</div>';
    return;
  }
  const cards = [];
  approved.forEach((draft) => {
    (draft.pinVariants || []).forEach((variant) => {
      cards.push(`
        <article class="card bundle-card">
          <p class="overline">${escapeHtml(variant.label || 'Pinterest variant')}</p>
          <h3>${escapeHtml(variant.title || draft.title || 'Pin detail')}</h3>
          <p class="small-copy">${escapeHtml(variant.description || '')}</p>
          <div class="analytics-table" style="margin-top:0.8rem">
            <div class="analytics-row"><span>Linked draft</span><strong>${escapeHtml(draft.title || '')}</strong></div>
            <div class="analytics-row"><span>Board</span><strong>${escapeHtml(variant.board || 'Made For This | Blog Ideas')}</strong></div>
          </div>
        </article>
      `);
    });
  });
  pinterestDetailsGrid.innerHTML = cards.join('');
};

const renderBlogDrafts = (drafts) => {
  if (blogDraftCount) blogDraftCount.textContent = String(Array.isArray(drafts) ? drafts.length : 0);
  if (!blogDraftsGrid) return;
  const rows = Array.isArray(drafts) ? drafts : [];
  if (!rows.length) {
    blogDraftsGrid.innerHTML = '<div class="pinterest-draft-empty">No blog drafts yet. Generate a new 20-draft stack to start the content queue.</div>';
    renderPinterestDetails([]);
    return;
  }
  blogDraftsGrid.innerHTML = rows
    .map(
      (draft) => `
        <article class="card blog-draft-post-card">
          <p class="overline">Headline score ${escapeHtml(draft.headlineScore || 0)}</p>
          <h3>${escapeHtml(draft.title || 'Untitled draft')}</h3>
          <p class="small-copy">${escapeHtml(draft.excerpt || draft.topic || '')}</p>
          <div class="analytics-table" style="margin-top:0.8rem">
            <div class="analytics-row"><span>Status</span><strong>${escapeHtml(draft.status || 'ready_for_review')}</strong></div>
            <div class="analytics-row"><span>Editor lane</span><strong>${escapeHtml(draft.editorStatus || 'ready_for_editor_review')}</strong></div>
            <div class="analytics-row"><span>Assets</span><strong>${escapeHtml(draft.assetRequestStatus || 'awaiting_client_assets')}</strong></div>
            <div class="analytics-row"><span>Printable placeholder</span><strong><a class="text-link" href="${escapeHtml(draft.printablePlaceholderUrl || '#')}" target="_blank" rel="noopener noreferrer">Open link</a></strong></div>
            <div class="analytics-row"><span>Pin variants</span><strong>${escapeHtml((draft.pinVariants || []).length || 0)}</strong></div>
            <div class="analytics-row"><span>Demo draft</span><strong>${draft.wpDraftUrl ? `<a class="text-link" href="${escapeHtml(draft.wpDraftUrl)}" target="_blank" rel="noopener noreferrer">Open demo draft</a>` : 'Not posted yet'}</strong></div>
          </div>
          <p class="small-copy" style="margin-top:0.8rem">${escapeHtml(draft.assetAutoGeneratePolicy || '')}</p>
          <div class="button-row" style="margin-top:0.9rem">
            ${draft.blogDraftId ? `<a class="btn" href="${escapeHtml(buildDraftPreviewUrl(draft))}">Open draft post</a>` : '<button type="button" class="btn" disabled>Posting demo...</button>'}
            <button type="button" class="btn btn-primary" data-blog-draft-approve="${escapeHtml(draft.blogDraftId || '')}">Approve + Keep Demo</button>
            <button type="button" class="btn" data-blog-draft-decision="deny" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}">Deny</button>
            <button type="button" class="btn" data-blog-draft-decision="hold" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}">Hold</button>
          </div>
          <div class="dashboard-note-box" style="margin-top:0.9rem">
            <p class="small-copy"><strong>Pin angles:</strong></p>
            ${(draft.pinVariants || [])
              .map(
                (variant) => `
                  <p class="small-copy" style="margin-top:0.35rem"><strong>${escapeHtml(variant.label || '')}:</strong> ${escapeHtml(variant.title || '')}</p>
                `
              )
              .join('')}
          </div>
          <details class="dashboard-note-box" style="margin-top:0.9rem">
            <summary><strong>Studio editor</strong> <span class="small-copy">Edit copy, notes, and preview support before Christina keeps the post.</span></summary>
            <div class="blog-draft-editor">
              <label>Title<input type="text" data-draft-field="title" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" value="${escapeHtml(draft.title || '')}" /></label>
              <label>Meta description<textarea data-draft-field="metaDescription" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" rows="3">${escapeHtml(draft.metaDescription || '')}</textarea></label>
              <label>Excerpt<textarea data-draft-field="excerpt" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" rows="3">${escapeHtml(draft.excerpt || '')}</textarea></label>
              <label>Printable link<input type="url" data-draft-field="printablePlaceholderUrl" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" value="${escapeHtml(draft.printablePlaceholderUrl || '')}" /></label>
              <label>Suggested Pinterest title<input type="text" data-draft-field="suggestedPinterestTitle" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" value="${escapeHtml(draft.suggestedPinterestTitle || '')}" /></label>
              <label>Email subject<input type="text" data-draft-field="suggestedEmailSubject" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" value="${escapeHtml(draft.suggestedEmailSubject || '')}" /></label>
              <label>Upload / asset name<input type="text" data-draft-field="editorAssetName" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" value="${escapeHtml(draft.editorAssetName || '')}" placeholder="PDF, image set, Canva file, etc." /></label>
              <label>Upload / asset URL<input type="url" data-draft-field="editorAssetUrl" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" value="${escapeHtml(draft.editorAssetUrl || '')}" placeholder="Paste uploaded asset link" /></label>
              <label>Editor notes<textarea data-draft-field="editorNotes" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" rows="4">${escapeHtml(draft.editorNotes || '')}</textarea></label>
              <label>Article HTML<textarea data-draft-field="articleHtml" data-blog-draft-id="${escapeHtml(draft.blogDraftId || '')}" rows="12">${escapeHtml(draft.articleHtml || '')}</textarea></label>
            </div>
            <div class="button-row" style="margin-top:0.9rem">
              <button type="button" class="btn btn-primary" data-blog-draft-save="${escapeHtml(draft.blogDraftId || '')}">Save Edit</button>
              <button type="button" class="btn" data-blog-draft-ready="${escapeHtml(draft.blogDraftId || '')}">Mark Ready</button>
              <button type="button" class="btn" data-blog-draft-refresh-demo="${escapeHtml(draft.blogDraftId || '')}">Refresh Demo Draft</button>
              ${draft.wpPreviewUrl ? `<a class="btn" href="${escapeHtml(draft.wpPreviewUrl)}" target="_blank" rel="noopener noreferrer">Preview Link</a>` : ''}
            </div>
          </details>
        </article>
      `
    )
    .join('');
  renderPinterestDetails(rows);
};

const renderMadeForThisContentOs = (payload) => {
  madeForThisContentOs = payload || { drafts: [], signals: [], summary: {} };
  renderBlogDrafts(madeForThisContentOs.drafts || []);
  renderMadeForThisSignals(madeForThisContentOs.signals || []);
  if (blogDraftsStatus) {
    blogDraftsStatus.textContent = `Loaded ${(madeForThisContentOs.drafts || []).length} draft${(madeForThisContentOs.drafts || []).length === 1 ? '' : 's'} from Codee's Made For This content queue.`;
  }
  if (contentSignalsStatus) {
    contentSignalsStatus.textContent = `${(madeForThisContentOs.signals || []).length} inbox signal${(madeForThisContentOs.signals || []).length === 1 ? '' : 's'} are steering the current draft stack.`;
  }
  if (pinterestDetailsStatus) {
    const approved = (madeForThisContentOs.drafts || []).filter((row) => String(row.approvalStatus || '') === 'approved_sent_to_wordpress').length;
    pinterestDetailsStatus.textContent = approved
      ? `${approved} approved story package${approved === 1 ? '' : 's'} now has Pinterest detail variants ready.`
      : 'Approve a story to turn its 3 pin variants into a ready package.';
  }
};

const readPageAuditState = () => readJsonStorage(PAGE_AUDIT_STORAGE_KEY, {});

const writePageAuditState = (state) => {
  try {
    localStorage.setItem(PAGE_AUDIT_STORAGE_KEY, JSON.stringify(state || {}));
  } catch {}
};

const recommendedPageDecision = (page) => {
  const title = String(page?.title || '').trim().toLowerCase();
  const category = String(page?.category || '').trim();
  if (title === 'weekly reset bundle') return 'keep';
  if (category === 'Bundles' || category === 'Printables' || category === 'Live Printables') return 'remove';
  return 'keep';
};

const pageDecisionCopy = (decision, url) => {
  if (decision === 'remove') return `Marked ${url} for removal from the public site review queue.`;
  if (decision === 'update') return `Marked ${url} for content/design updates in the review queue.`;
  return `Keeping ${url} in the public site plan.`;
};

const pageMapRail = document.getElementById('page-map-rail');
const pageInventoryGrid = document.getElementById('page-inventory-grid');
const pageMapStatus = document.getElementById('page-map-status');

const renderPageInventory = () => {
  if (!pageMapRail || !pageInventoryGrid) return;
  const auditState = readPageAuditState();
  const categories = [...new Set(MFT_SITE_PAGES.map((page) => page.category))];
  pageMapRail.innerHTML = categories
    .map((category) => `<a class="btn" href="#page-group-${escapeHtml(category.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${escapeHtml(category)}</a>`)
    .join('');
  pageInventoryGrid.innerHTML = categories
    .map((category) => {
      const pages = MFT_SITE_PAGES.filter((page) => page.category === category);
      return `
        <section class="page-group-table" id="page-group-${escapeHtml(category.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">
          <div class="page-group-title">
            <p class="overline">${escapeHtml(category)}</p>
            <h3>${escapeHtml(category)} pages</h3>
          </div>
          <div class="page-audit-table-wrap">
            <table class="page-audit-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Path</th>
                  <th>Open</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                ${pages
                  .map((page) => {
                    const state = auditState[page.url] || {};
                    const decision = state.decision || recommendedPageDecision(page);
                    return `
                      <tr class="page-row-${escapeHtml(decision)}">
                        <td><strong>${escapeHtml(page.title)}</strong></td>
                        <td><code>${escapeHtml(page.url)}</code></td>
                        <td><a class="btn btn-table" href="${escapeHtml(page.url)}" target="_blank" rel="noopener noreferrer">Open</a></td>
                        <td>
                          <select data-page-audit-url="${escapeHtml(page.url)}">
                            <option value="keep" ${decision === 'keep' ? 'selected' : ''}>Keep</option>
                            <option value="update" ${decision === 'update' ? 'selected' : ''}>Update</option>
                            <option value="remove" ${decision === 'remove' ? 'selected' : ''}>Remove</option>
                          </select>
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join('');
  if (pageMapStatus) {
    const allDecisions = Object.entries(auditState).reduce(
      (acc, [, value]) => {
        const decision = String(value?.decision || '').trim();
        if (decision === 'remove') acc.remove += 1;
        else if (decision === 'update') acc.update += 1;
        else if (decision === 'keep') acc.keep += 1;
        return acc;
      },
      { keep: 0, update: 0, remove: 0 }
    );
    pageMapStatus.textContent = `${MFT_SITE_PAGES.length} pages loaded • Keep ${allDecisions.keep} • Update ${allDecisions.update} • Remove ${allDecisions.remove}`;
  }
};

const renderGlobalPageAuditStrip = () => {
  return;
  if (document.querySelector('.global-page-audit-strip')) return;
  const currentPath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname;
  const match = MFT_SITE_PAGES.find((page) => page.url === currentPath || page.url.replace(/index\.html$/, '') === currentPath.replace(/index\.html$/, ''));
  if (!match) return;
  const auditState = readPageAuditState();
  const decision = auditState[match.url]?.decision || recommendedPageDecision(match);
  const strip = document.createElement('div');
  strip.className = 'global-page-audit-strip';
  strip.innerHTML = `
    <div>
      <strong>${escapeHtml(match.title)}</strong><br />
      <span class="small-copy">${escapeHtml(match.category)}</span>
    </div>
    <div class="global-page-audit-actions">
      <select data-global-page-audit-url="${escapeHtml(match.url)}">
        <option value="keep" ${decision === 'keep' ? 'selected' : ''}>Keep</option>
        <option value="update" ${decision === 'update' ? 'selected' : ''}>Update</option>
        <option value="remove" ${decision === 'remove' ? 'selected' : ''}>Remove</option>
      </select>
      <a class="btn btn-table" href="/dashboard.html">Open Studio</a>
    </div>
  `;
  document.body.appendChild(strip);
};

pageInventoryGrid?.addEventListener('change', (event) => {
  const target = event.target instanceof HTMLSelectElement ? event.target : null;
  if (!target) return;
  const url = target.getAttribute('data-page-audit-url');
  if (!url) return;
  const auditState = readPageAuditState();
  auditState[url] = {
    ...(auditState[url] || {}),
    decision: target.value || 'keep',
    updatedAt: new Date().toISOString()
  };
  writePageAuditState(auditState);
  renderPageInventory();
  if (pageMapStatus) {
    pageMapStatus.textContent = pageDecisionCopy(target.value || 'keep', url);
  }
});

document.addEventListener('change', (event) => {
  const target = event.target instanceof HTMLSelectElement ? event.target : null;
  if (!target) return;
  const url = target.getAttribute('data-global-page-audit-url');
  if (!url) return;
  const auditState = readPageAuditState();
  auditState[url] = {
    ...(auditState[url] || {}),
    decision: target.value || 'keep',
    updatedAt: new Date().toISOString()
  };
  writePageAuditState(auditState);
  if (pageMapStatus) pageMapStatus.textContent = pageDecisionCopy(target.value || 'keep', url);
});

const loadMadeForThisContentOs = async ({ regenerate = false } = {}) => {
  if (!blogDraftsGrid && !contentSignalsGrid) return;
  const endpoint = regenerate
    ? `${DASHBOARD_API_BASE}/api/dashboard/nina/madeforthis-content-os/generate`
    : `${DASHBOARD_API_BASE}/api/dashboard/nina/madeforthis-content-os`;
  if (blogDraftsStatus) {
    blogDraftsStatus.textContent = regenerate ? 'Generating 60+ fresh blog drafts across ortho life, mom life, and entrepreneur journey...' : 'Loading Made For This content queue...';
  }
  const response = await fetch(endpoint, regenerate ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 60 }) } : { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.detail || data?.error || 'Could not load the Made For This content queue.');
  }
  renderMadeForThisContentOs(data);
  markDashboardReady();
};

const approveMadeForThisBlogDraft = async (blogDraftId) => {
  if (!blogDraftId) return;
  if (blogDraftsStatus) blogDraftsStatus.textContent = 'Sending this approved draft into WordPress and Pinterest prep...';
  const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/madeforthis-content-os/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blogDraftId })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.detail || data?.error || 'Could not approve this draft.');
  }
  const nextDrafts = (madeForThisContentOs.drafts || []).map((row) => (String(row.blogDraftId || '') === String(blogDraftId) ? data.draft : row));
  renderMadeForThisContentOs({ ...madeForThisContentOs, drafts: nextDrafts });
  if (blogDraftsStatus) blogDraftsStatus.textContent = 'Approved draft kept as the live demo version. Three Pinterest variants are now attached to it.';
};

const collectDraftEditorPayload = (blogDraftId) => {
  const fields = Array.from(document.querySelectorAll(`[data-draft-field][data-blog-draft-id="${blogDraftId}"]`));
  return fields.reduce((payload, field) => {
    const key = field.getAttribute('data-draft-field');
    if (!key) return payload;
    payload[key] = field.value || '';
    return payload;
  }, {});
};

const updateMadeForThisBlogDraft = async (blogDraftId, updates = {}) => {
  if (!blogDraftId) return null;
  const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/madeforthis-content-os/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blogDraftId, ...updates })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.detail || data?.error || 'Could not update this draft.');
  }
  const nextDrafts = (madeForThisContentOs.drafts || []).map((row) => (String(row.blogDraftId || '') === String(blogDraftId) ? data.draft : row));
  renderMadeForThisContentOs({ ...madeForThisContentOs, drafts: nextDrafts });
  return data.draft;
};

const draftPreviewShell = document.getElementById('draft-preview-shell');
const draftPreviewState = document.getElementById('draft-preview-state');
const draftPreviewTitle = document.getElementById('draft-preview-title');
const draftPreviewSubtitle = document.getElementById('draft-preview-subtitle');
const draftPreviewPolicy = document.getElementById('draft-preview-policy');
const draftPreviewMeta = document.getElementById('draft-preview-meta');
const draftPreviewContent = document.getElementById('draft-preview-content');
const draftPreviewPins = document.getElementById('draft-preview-pins');
const draftPreviewPrintable = document.getElementById('draft-preview-printable');
const draftPreviewDemo = document.getElementById('draft-preview-demo');
const draftPreviewStatus = document.getElementById('draft-preview-status');
const draftPreviewApprove = document.getElementById('draft-preview-approve');
const draftPreviewDeny = document.getElementById('draft-preview-deny');
const draftPreviewHold = document.getElementById('draft-preview-hold');
const draftPreviewOpenDemo = document.getElementById('draft-preview-open-demo');
const draftPreviewEmpty = document.getElementById('draft-preview-empty');
const draftPreviewEditTitle = document.getElementById('draft-preview-edit-title');
const draftPreviewEditMeta = document.getElementById('draft-preview-edit-meta');
const draftPreviewEditExcerpt = document.getElementById('draft-preview-edit-excerpt');
const draftPreviewEditNotes = document.getElementById('draft-preview-edit-notes');
const draftPreviewEditArticle = document.getElementById('draft-preview-edit-article');
const draftPreviewSave = document.getElementById('draft-preview-save');
const draftPreviewExpand = document.getElementById('draft-preview-expand');
const dashboardLoader = document.getElementById('dashboard-loader');

const markDashboardReady = () => {
  if (!dashboardLoader) return;
  document.body?.classList.remove('dashboard-is-loading');
  document.body?.classList.add('dashboard-ready');
  window.setTimeout(() => {
    dashboardLoader.remove();
  }, 260);
};

const findMadeForThisDraft = (draftId) =>
  (madeForThisContentOs.drafts || []).find((row) => String(row.blogDraftId || '') === String(draftId || ''));

const renderDraftPreviewPage = (draft) => {
  if (!draftPreviewShell || !draftPreviewContent) return;
  if (!draft) {
    if (draftPreviewShell) draftPreviewShell.hidden = true;
    if (draftPreviewEmpty) draftPreviewEmpty.hidden = false;
    if (draftPreviewTitle) draftPreviewTitle.textContent = 'Draft not found';
    if (draftPreviewSubtitle) draftPreviewSubtitle.textContent = 'This studio draft could not be loaded from the Made For This queue.';
    return;
  }
  if (draftPreviewEmpty) draftPreviewEmpty.hidden = true;
  draftPreviewShell.hidden = false;
  if (draftPreviewTitle) draftPreviewTitle.textContent = draft.title || 'Studio draft';
  if (draftPreviewSubtitle) {
    draftPreviewSubtitle.textContent =
      draft.excerpt || 'This post is live on Made For This as a studio draft while Christina reviews it.';
  }
  if (draftPreviewState) {
    draftPreviewState.textContent =
      String(draft.approvalStatus || '').startsWith('approved') ? 'Approved demo live' : 'Pending Christina review';
  }
  if (draftPreviewPolicy) {
    draftPreviewPolicy.textContent =
      draft.assetAutoGeneratePolicy ||
      'If no corrections are requested within 24 hours, this version stays live as the published post.';
  }
  if (draftPreviewMeta) {
    draftPreviewMeta.textContent = `Status: ${draft.status || 'ready_for_review'} · Editor lane: ${draft.editorStatus || 'ready_for_editor_review'}`;
  }
  if (draftPreviewContent) {
    draftPreviewContent.innerHTML =
      draft.articleHtml ||
      `<p>${escapeHtml(draft.excerpt || 'This draft is waiting for Christina’s review.')}</p>`;
  }
  if (draftPreviewEditTitle) draftPreviewEditTitle.value = draft.title || '';
  if (draftPreviewEditMeta) draftPreviewEditMeta.value = draft.metaDescription || '';
  if (draftPreviewEditExcerpt) draftPreviewEditExcerpt.value = draft.excerpt || '';
  if (draftPreviewEditNotes) draftPreviewEditNotes.value = draft.editorNotes || '';
  if (draftPreviewEditArticle) draftPreviewEditArticle.value = draft.articleHtml || '';
  if (draftPreviewPins) {
    draftPreviewPins.innerHTML = (draft.pinVariants || [])
      .map(
        (variant) =>
          `<li><strong>${escapeHtml(variant.label || 'Pin angle')}:</strong> ${escapeHtml(variant.title || '')}</li>`
      )
      .join('');
  }
  if (draftPreviewPrintable) {
    draftPreviewPrintable.innerHTML = draft.printablePlaceholderUrl
      ? `<a class="text-link" href="${escapeHtml(draft.printablePlaceholderUrl)}" target="_blank" rel="noopener noreferrer">Open printable placeholder</a>`
      : 'Printable placeholder pending.';
  }
  if (draftPreviewDemo) {
    draftPreviewDemo.innerHTML = draft.wpDraftUrl
      ? `<a class="text-link" href="${escapeHtml(draft.wpDraftUrl)}" target="_blank" rel="noopener noreferrer">Open WordPress demo draft</a>`
      : 'WordPress demo draft pending.';
  }
  if (draftPreviewOpenDemo) {
    if (draft.wpDraftUrl) {
      draftPreviewOpenDemo.href = draft.wpDraftUrl;
      draftPreviewOpenDemo.hidden = false;
    } else {
      draftPreviewOpenDemo.hidden = true;
    }
  }
  const canonicalUrl = `${window.location.origin}/studio-draft.html?id=${encodeURIComponent(draft.blogDraftId || '')}`;
  document.title = `${draft.title || 'Studio draft'} | Made For This`;
  setCanonical(canonicalUrl);
  setOrCreateMeta('og:type', 'article');
  setOrCreateMeta('og:title', draft.title || 'Studio draft');
  setOrCreateMeta('og:description', draft.metaDescription || draft.excerpt || '');
  setOrCreateMeta('og:url', canonicalUrl);
  setOrCreateMeta('twitter:card', 'summary_large_image', 'name');
  setOrCreateMeta('twitter:title', draft.title || 'Studio draft', 'name');
  setOrCreateMeta('twitter:description', draft.metaDescription || draft.excerpt || '', 'name');
};

const initDraftPreviewPage = async () => {
  if (!draftPreviewShell && !draftPreviewEmpty) return;
  const draftId = new URLSearchParams(window.location.search).get('id');
  if (!draftId) {
    renderDraftPreviewPage(null);
    return;
  }
  try {
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Loading studio draft...';
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/madeforthis-content-os`, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.detail || data?.error || 'Could not load this studio draft.');
    }
    madeForThisContentOs = data || { drafts: [], signals: [], summary: {} };
    const draft = findMadeForThisDraft(draftId);
    renderDraftPreviewPage(draft);
    if (draftPreviewStatus) {
      draftPreviewStatus.textContent = draft
        ? 'This preview is live on Made For This while Christina reviews it.'
        : 'Draft not found in the current Made For This queue.';
    }
  } catch (error) {
    renderDraftPreviewPage(null);
    if (draftPreviewStatus) draftPreviewStatus.textContent = error.message || 'Could not load this studio draft.';
  }
};

const collectDraftPreviewPayload = () => ({
  title: draftPreviewEditTitle?.value || '',
  metaDescription: draftPreviewEditMeta?.value || '',
  excerpt: draftPreviewEditExcerpt?.value || '',
  editorNotes: draftPreviewEditNotes?.value || '',
  articleHtml: draftPreviewEditArticle?.value || ''
});

const startGoogleInboxConnection = async () => {
  if (googleInboxConnectionNote) googleInboxConnectionNote.textContent = 'Preparing Google Inbox connection...';
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${encodeURIComponent(getClientDashboardId())}/oauth/start?platform=google_inbox`, {
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.detail || data?.error || 'Google Inbox connection could not start.');
    if (data?.connect_url) {
      window.location.href = data.connect_url;
      return;
    }
    throw new Error(data?.note || 'Google Inbox connection URL is unavailable.');
  } catch (error) {
    if (googleInboxConnectionNote) googleInboxConnectionNote.textContent = error.message || 'Google Inbox connection could not start.';
  }
};

const runGoogleInboxScan = async () => {
  if (googleInboxConnectionNote) googleInboxConnectionNote.textContent = 'Scanning the connected inbox for recent market signals...';
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${encodeURIComponent(getClientDashboardId())}/inbox/google/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'newer_than:1d', maxResults: 12 })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.detail || data?.error || 'Inbox scan could not start.');
    renderGoogleInboxStatus(data);
    if (googleInboxConnectionNote) {
      googleInboxConnectionNote.textContent = `Stored ${data?.count || 0} inbox signals${data?.mailboxEmail ? ` from ${data.mailboxEmail}` : ''}.`;
    }
  } catch (error) {
    if (googleInboxConnectionNote) googleInboxConnectionNote.textContent = error.message || 'Inbox scan could not start.';
  }
};

const startCanvaConnection = async () => {
  if (canvaConnectionNote) canvaConnectionNote.textContent = 'Preparing Canva connection...';
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${encodeURIComponent(getClientDashboardId())}/oauth/start?platform=canva`, {
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.detail || data?.error || 'Canva connection could not start.');
    if (data?.connect_url) {
      window.location.href = data.connect_url;
      return;
    }
    throw new Error(data?.note || 'Canva connection URL is unavailable.');
  } catch (error) {
    if (canvaConnectionNote) canvaConnectionNote.textContent = error.message || 'Canva connection could not start.';
  }
};

const submitCanvaImport = async () => {
  const title = canvaImportTitle?.value.trim() || '';
  const sourceUrl = canvaImportUrl?.value.trim() || '';
  if (!title || !sourceUrl) {
    if (canvaImportMessage) canvaImportMessage.textContent = 'Add both a design title and a hosted image URL before sending to Canva.';
    return;
  }
  if (canvaImportMessage) canvaImportMessage.textContent = 'Sending this asset to Canva...';
  const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/${encodeURIComponent(getClientDashboardId())}/canva/import-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      source_url: sourceUrl,
      asset_type: canvaImportType?.value || 'pinterest_pin',
      notes: canvaImportNotes?.value.trim() || ''
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.detail || data?.error || 'Could not send the asset to Canva.');
  }
  if (canvaImportMessage) {
    canvaImportMessage.textContent = data?.item?.canva_job_id
      ? 'Canva import job created. The queue below will refresh with edit links when available.'
      : 'Saved into the Canva queue. Connect Canva to create live design jobs.';
  }
  await loadCanvaWorkspace();
};

const renderSavedPinterestDrafts = () => {
  if (!pinterestSavedDrafts) return;
  const drafts = loadSavedPinterestDrafts();
  if (!drafts.length) {
    pinterestSavedDrafts.innerHTML = '<div class="pinterest-draft-empty">No saved Pinterest drafts yet. Generate one in Prompt Studio, then save the winners here.</div>';
    return;
  }

  pinterestSavedDrafts.innerHTML = drafts
    .map(
      (draft, index) => `
        <article class="pinterest-generated-card">
          <div class="pinterest-generated-card-header">
            <div>
              <h4>${escapeHtml(draft.label || `Saved draft ${index + 1}`)}</h4>
              <p class="pinterest-card-status">Saved ${escapeHtml(new Date(draft.savedAt || Date.now()).toLocaleString())}</p>
            </div>
            <button type="button" class="btn" data-pinterest-saved-remove="${escapeHtml(draft.id || String(index))}">Remove</button>
          </div>
          <img src="${escapeHtml(draft.imageUrl || '')}" alt="${escapeHtml(draft.label || `Saved Pinterest draft ${index + 1}`)}" loading="lazy" />
          <p class="pinterest-prompt-text">${escapeHtml(draft.prompt || '')}</p>
          <div class="button-row">
            <a class="btn" href="${escapeHtml(draft.imageUrl || '#')}" target="_blank" rel="noopener noreferrer">Open Image</a>
            <button type="button" class="btn" data-pinterest-copy-url="${escapeHtml(draft.imageUrl || '')}">Copy URL</button>
            <button type="button" class="btn" data-canva-prefill-title="${escapeHtml(draft.label || `Saved draft ${index + 1}`)}" data-canva-prefill-url="${escapeHtml(draft.imageUrl || '')}" data-canva-prefill-notes="${escapeHtml(draft.prompt || '')}" data-canva-prefill-type="pinterest_pin">Use in Canva</button>
          </div>
        </article>
      `
    )
    .join('');
};

const renderSavedPinterestUploads = () => {
  if (!pinterestCustomUploads) return;
  const uploads = loadSavedPinterestUploads();
  if (!uploads.length) {
    pinterestCustomUploads.innerHTML = '<div class="pinterest-draft-empty">No custom Pinterest uploads saved yet.</div>';
    return;
  }

  pinterestCustomUploads.innerHTML = uploads
    .map(
      (item, index) => `
        <article class="pinterest-generated-card">
          <div class="pinterest-generated-card-header">
            <div>
              <h4>${escapeHtml(item.title || `Custom upload ${index + 1}`)}</h4>
              <p class="pinterest-card-status">${escapeHtml(item.notes || 'Saved for site and Pinterest campaign use')}</p>
            </div>
          </div>
          <img src="${escapeHtml(item.imageUrl || '')}" alt="${escapeHtml(item.title || `Custom upload ${index + 1}`)}" loading="lazy" />
          <div class="pinterest-draft-meta">
            <span class="pinterest-card-status">Asset key: ${escapeHtml(item.assetKey || '')}</span>
            <span class="pinterest-card-status">Hosted URL: ${escapeHtml(item.imageUrl || '')}</span>
            <span class="pinterest-card-status">Saved ${escapeHtml(new Date(item.savedAt || Date.now()).toLocaleString())}</span>
          </div>
          <div class="button-row">
            <a class="btn" href="${escapeHtml(item.imageUrl || '#')}" target="_blank" rel="noopener noreferrer">Open Image</a>
            <button type="button" class="btn" data-pinterest-copy-url="${escapeHtml(item.imageUrl || '')}">Copy URL</button>
            <button type="button" class="btn" data-canva-prefill-title="${escapeHtml(item.title || `Custom upload ${index + 1}`)}" data-canva-prefill-url="${escapeHtml(item.imageUrl || '')}" data-canva-prefill-notes="${escapeHtml(item.notes || '')}" data-canva-prefill-type="pinterest_pin">Use in Canva</button>
          </div>
        </article>
      `
    )
    .join('');
};

const renderPinterestPromptCards = () => {
  if (!pinterestPromptCards || !pinterestCampaignPrompts) return;
  const prompts = splitPinterestPrompts(pinterestCampaignPrompts.value);
  if (!prompts.length) {
    pinterestPromptCards.innerHTML = '<div class="pinterest-draft-empty">Add one or more Pinterest prompts above, then refresh prompt cards.</div>';
    return;
  }

  pinterestPromptCards.innerHTML = prompts
    .map((prompt, index) => {
      const draft = pinterestGeneratedDraftMap[index];
      const preview = draft?.imageUrl
        ? `
          <div class="pinterest-draft-preview">
            <img src="${escapeHtml(draft.imageUrl)}" alt="Generated Pinterest draft ${index + 1}" loading="lazy" />
            <div class="pinterest-draft-meta">
              <span class="pinterest-card-status">Model: ${escapeHtml(draft.model || 'gpt-image-1.5')}</span>
              <span class="pinterest-card-status">Saved path: ${escapeHtml(draft.publicPath || draft.storagePath || '')}</span>
            </div>
            <div class="button-row">
              <button type="button" class="btn btn-primary" data-pinterest-save="${index}">Save Draft</button>
              <a class="btn" href="${escapeHtml(draft.imageUrl)}" target="_blank" rel="noopener noreferrer">Open Image</a>
              <button type="button" class="btn" data-pinterest-copy-url="${escapeHtml(draft.imageUrl)}">Copy URL</button>
              <button type="button" class="btn" data-canva-prefill-title="Prompt ${index + 1} Draft" data-canva-prefill-url="${escapeHtml(draft.imageUrl)}" data-canva-prefill-notes="${escapeHtml(prompt)}" data-canva-prefill-type="pinterest_pin">Use in Canva</button>
            </div>
          </div>
        `
        : '<div class="pinterest-draft-empty">No image generated yet for this prompt.</div>';

      return `
        <article class="pinterest-prompt-card" data-pinterest-prompt-card="${index}">
          <div class="pinterest-prompt-card-header">
            <div>
              <h4>Prompt ${index + 1}</h4>
              <p class="pinterest-card-status" data-pinterest-status-text="${index}">${escapeHtml(draft?.statusText || 'Ready to generate')}</p>
            </div>
          </div>
          <p class="pinterest-prompt-text">${escapeHtml(prompt)}</p>
          <div class="button-row">
            <button type="button" class="btn" data-pinterest-copy="${index}">Copy Prompt</button>
            <button type="button" class="btn btn-primary" data-pinterest-generate="${index}">Generate Image Draft</button>
          </div>
          ${preview}
        </article>
      `;
    })
    .join('');
};

const savePinterestDraft = (index) => {
  const draft = pinterestGeneratedDraftMap[index];
  if (!draft?.imageUrl) {
    if (pinterestPlanMessage) pinterestPlanMessage.textContent = 'Generate an image first, then save it.';
    return;
  }
  const existing = loadSavedPinterestDrafts();
  const next = [
    {
      id: draft.id || `${Date.now()}-${index}`,
      label: draft.label || `Prompt ${index + 1}`,
      prompt: draft.prompt,
      imageUrl: draft.imageUrl,
      savedAt: new Date().toISOString(),
      storagePath: draft.storagePath || '',
      publicPath: draft.publicPath || ''
    },
    ...existing.filter((item) => item.imageUrl !== draft.imageUrl),
  ];
  saveSavedPinterestDrafts(next);
  renderSavedPinterestDrafts();
  renderCanvaSourceLibrary();
  if (pinterestPlanMessage) pinterestPlanMessage.textContent = `Prompt ${index + 1} draft saved in this dashboard browser.`;
};

const generatePinterestDraft = async (index) => {
  const prompts = splitPinterestPrompts(pinterestCampaignPrompts?.value || '');
  const prompt = prompts[index];
  if (!prompt) return;
  pinterestGeneratedDraftMap[index] = {
    ...(pinterestGeneratedDraftMap[index] || {}),
    prompt,
    label: `Prompt ${index + 1}`,
    statusText: 'Generating image draft...'
  };
  let progressValue = 8;
  if (pinterestGeneratorProgress) pinterestGeneratorProgress.value = progressValue;
  if (pinterestGeneratorProgressLabel) pinterestGeneratorProgressLabel.textContent = `Generator progress: ${progressValue}%`;
  if (pinterestGeneratorStatus) pinterestGeneratorStatus.textContent = `Prompt ${index + 1} is generating. This usually takes 20 to 40 seconds.`;
  const progressTimer = window.setInterval(() => {
    progressValue = Math.min(progressValue + 7, 92);
    if (pinterestGeneratorProgress) pinterestGeneratorProgress.value = progressValue;
    if (pinterestGeneratorProgressLabel) pinterestGeneratorProgressLabel.textContent = `Generator progress: ${progressValue}%`;
  }, 1800);
  renderPinterestPromptCards();

  try {
    const response = await callDashboardApi('/api/cappy/pinterest-image-draft', {
      client_id: SITE_KEY,
      prompt,
      draft_label: `made-for-this-prompt-${index + 1}`,
      size: '1024x1536'
    });
    pinterestGeneratedDraftMap[index] = {
      id: `${Date.now()}-${index}`,
      prompt,
      label: `Prompt ${index + 1}`,
      imageUrl: response.image_url || '',
      model: response.model || 'gpt-image-1.5',
      storagePath: response.storage_path || '',
      publicPath: response.public_path || '',
      statusText: 'Image draft generated.'
    };
    window.clearInterval(progressTimer);
    if (pinterestGeneratorProgress) pinterestGeneratorProgress.value = 100;
    if (pinterestGeneratorProgressLabel) pinterestGeneratorProgressLabel.textContent = 'Generator progress: 100%';
    if (pinterestGeneratorStatus) pinterestGeneratorStatus.textContent = `Prompt ${index + 1} image draft is ready.`;
    renderPinterestPromptCards();
    if (pinterestPlanMessage) pinterestPlanMessage.textContent = `Prompt ${index + 1} image draft generated.`;
  } catch (error) {
    window.clearInterval(progressTimer);
    if (pinterestGeneratorProgress) pinterestGeneratorProgress.value = 0;
    if (pinterestGeneratorProgressLabel) pinterestGeneratorProgressLabel.textContent = 'Generator progress: 0%';
    if (pinterestGeneratorStatus) pinterestGeneratorStatus.textContent = error.message || 'Image generation failed.';
    pinterestGeneratedDraftMap[index] = {
      ...(pinterestGeneratedDraftMap[index] || {}),
      prompt,
      label: `Prompt ${index + 1}`,
      statusText: error.message || 'Image generation failed.'
    };
    renderPinterestPromptCards();
    if (pinterestPlanMessage) pinterestPlanMessage.textContent = error.message || 'Image generation failed.';
  }
};

const formatPromptVaultRefresh = (isoValue) => {
  if (!isoValue) return 'Refreshes every 6 hours.';
  const next = new Date(new Date(isoValue).getTime() + PROMPT_VAULT_REFRESH_MS);
  return `Refreshes every 6 hours. Next refresh after ${next.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`;
};

const downloadTextFile = (filename, contents) => {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const renderPromptVaultTopicOptions = () => {
  if (!promptVaultTopicSelect) return;
  promptVaultTopicSelect.innerHTML = PROMPT_VAULT_TOPICS.map(
    (topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.heading)}</option>`
  ).join('');
  promptVaultTopicSelect.value = loadPromptVaultTopicId();
};

const renderPromptVaultApproved = (topicState) => {
  if (!promptVaultApproved) return;
  const approvedCards = (topicState?.cards || []).filter((card) => card.feedback === 'approved');
  if (!approvedCards.length) {
    promptVaultApproved.innerHTML =
      '<div class="prompt-vault-empty">No approved winners yet for this topic. Generate a few drafts and use the thumbs-up button on the strongest ones.</div>';
    return;
  }
  promptVaultApproved.innerHTML = approvedCards
    .map(
      (card) => `
        <article class="prompt-vault-card is-approved">
          <div class="prompt-vault-card-header">
            <div>
              <h4>${escapeHtml(card.variantTitle || card.title)}</h4>
              <p class="small-copy">${escapeHtml(card.topicLabel || '')}</p>
            </div>
            <span class="prompt-vault-status-pill">Approved</span>
          </div>
          ${card.imageUrl ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.title)}" loading="lazy" />` : ''}
          <div class="prompt-vault-card-body">
            <p class="pinterest-prompt-text prompt-vault-prompt-preview is-collapsed">${escapeHtml(card.prompt)}</p>
            <button type="button" class="prompt-vault-read-more" data-prompt-vault-expand>${'...read more...'}</button>
          </div>
        </article>
      `
    )
    .join('');
};

const renderPromptVaultGallery = (topicState) => {
  if (!promptVaultGallery) return;
  const cards = Array.isArray(topicState?.cards) ? topicState.cards : [];
  if (!cards.length) {
    promptVaultGallery.innerHTML = '<div class="prompt-vault-empty">No prompts available for this topic yet.</div>';
    return;
  }
  promptVaultGallery.innerHTML = cards
    .map((card, index) => {
      const statusLabel =
        card.feedback === 'approved' ? 'Approved' : card.feedback === 'rejected' ? 'Skipped' : card.imageUrl ? 'Generated' : 'Ready';
      const statusClass =
        card.feedback === 'approved' ? ' is-approved' : card.feedback === 'rejected' ? ' is-rejected' : '';
      return `
        <article class="prompt-vault-card${statusClass}" data-prompt-vault-card="${escapeHtml(card.id)}">
          <div class="prompt-vault-card-header">
            <div>
              <h4>${escapeHtml(card.variantTitle || `Prompt ${index + 1}`)}</h4>
              <p class="small-copy">${escapeHtml(card.topicLabel || '')}</p>
            </div>
            <span class="prompt-vault-status-pill">${escapeHtml(statusLabel)}</span>
          </div>
          ${card.imageUrl ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.title)}" loading="lazy" />` : '<div class="prompt-vault-empty">No image generated yet for this prompt.</div>'}
          <div class="prompt-vault-card-body">
            <p class="pinterest-prompt-text prompt-vault-prompt-preview is-collapsed">${escapeHtml(card.prompt)}</p>
            <button type="button" class="prompt-vault-read-more" data-prompt-vault-expand>${'...read more...'}</button>
          </div>
          <div class="button-row">
            <button type="button" class="btn" data-prompt-vault-copy="${escapeHtml(card.id)}">Copy Prompt</button>
            <button type="button" class="btn btn-primary" data-prompt-vault-download="${escapeHtml(card.id)}">Download Suggestion</button>
          </div>
          <div class="prompt-vault-feedback-row">
            <button type="button" class="btn prompt-vault-feedback-btn" data-prompt-vault-feedback="${escapeHtml(card.id)}" data-feedback-value="approved">👍</button>
            <button type="button" class="btn prompt-vault-feedback-btn" data-prompt-vault-feedback="${escapeHtml(card.id)}" data-feedback-value="rejected">👎</button>
            ${card.imageUrl ? `<button type="button" class="btn" data-pinterest-copy-url="${escapeHtml(card.imageUrl)}">Copy URL</button>` : ''}
          </div>
        </article>
      `;
    })
    .join('');
};

const renderPromptVault = ({ forceRefresh = false } = {}) => {
  const topicId = promptVaultTopicSelect?.value || loadPromptVaultTopicId();
  const topicState = ensurePromptVaultTopicState(topicId, { forceRefresh });
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId) || PROMPT_VAULT_TOPICS[0];
  if (!topicState || !topic) return;
  savePromptVaultTopicId(topicId);
  if (promptVaultRefreshNote) promptVaultRefreshNote.textContent = formatPromptVaultRefresh(topicState.lastRefreshedAt);
  if (promptVaultStatus) {
    promptVaultStatus.textContent = `${topic.heading} is active. ${topicState.cards.length} prompt cards are ready in this topic wall.`;
  }
  renderPromptVaultIntelligence(topic);
  renderPromptVaultApproved(topicState);
  renderPromptVaultGallery(topicState);
};

const applyPromptVaultTopicHero = (topicId, payload = {}) => {
  const state = loadPromptVaultState();
  const topicState = state[topicId];
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId);
  if (!topicState || !topic) return null;
  const referenceImages = getPromptVaultTopicReferenceImages(topicId);
  topicState.topicHeroImage = String(payload.imageUrl || '').trim();
  topicState.topicHeroGeneratedAt = new Date().toISOString();
  topicState.cards = buildPromptVaultCards(topic, {
    referenceImages,
    heroImage: referenceImages.length ? '' : topicState.topicHeroImage,
  }).map((card) => {
    const existing = (Array.isArray(topicState.cards) ? topicState.cards : []).find((item) => item?.id === card.id);
    return existing
      ? {
          ...card,
          ...existing,
          prompt: card.prompt,
          title: card.title,
          variantTitle: card.variantTitle,
          imageUrl: existing.imageSource === 'upload' ? existing.imageUrl || card.imageUrl || '' : card.imageUrl || existing.imageUrl || '',
          imageSource: existing.imageSource === 'upload' ? 'upload' : card.imageSource,
          model: payload.model || existing.model || '',
          storagePath: payload.storagePath || existing.storagePath || '',
          publicPath: payload.publicPath || existing.publicPath || '',
        }
      : card;
  });
  state[topicId] = topicState;
  savePromptVaultState(state);
  return topicState;
};

const refreshPromptVaultTopicReferences = (topicId) => {
  const state = loadPromptVaultState();
  const topicState = state[topicId];
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId);
  if (!topicState || !topic) return null;
  const referenceImages = getPromptVaultTopicReferenceImages(topicId);
  topicState.cards = buildPromptVaultCards(topic, {
    referenceImages,
    heroImage: referenceImages.length ? '' : String(topicState.topicHeroImage || '').trim(),
  }).map((card) => {
    const existing = (Array.isArray(topicState.cards) ? topicState.cards : []).find((item) => item?.id === card.id);
    return existing
      ? {
          ...card,
          ...existing,
          prompt: card.prompt,
          title: card.title,
          variantTitle: card.variantTitle,
          imageUrl: card.imageUrl || existing.imageUrl || '',
          imageSource: card.imageSource,
        }
      : card;
  });
  state[topicId] = topicState;
  savePromptVaultState(state);
  return topicState;
};

const hydratePromptVaultTopicHero = async (topicId, { force = false } = {}) => {
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId);
  if (!topic || promptVaultHeroGenerationState[topicId]) return;
  const referenceImages = getPromptVaultTopicReferenceImages(topicId);
  if (referenceImages.length) {
    refreshPromptVaultTopicReferences(topicId);
    if ((promptVaultTopicSelect?.value || loadPromptVaultTopicId()) === topicId) renderPromptVault();
    return;
  }
  const topicState = ensurePromptVaultTopicState(topicId);
  const lastGeneratedAt = new Date(topicState?.topicHeroGeneratedAt || 0).getTime();
  const isFresh = Number.isFinite(lastGeneratedAt) && Date.now() - lastGeneratedAt < PROMPT_VAULT_REFRESH_MS;
  if (!force && topicState?.topicHeroImage && isFresh) return;
  const heroPrompt = topicState?.cards?.[0]?.prompt || buildPromptVaultPrompt(topic, PROMPT_VAULT_VARIANTS[0]);
  promptVaultHeroGenerationState[topicId] = true;
  try {
    if ((promptVaultTopicSelect?.value || loadPromptVaultTopicId()) === topicId && promptVaultStatus) {
      promptVaultStatus.textContent = `Generating a fresh hero image for ${topic.heading}...`;
    }
    const response = await callDashboardApi('/api/cappy/pinterest-image-draft', {
      client_id: SITE_KEY,
      prompt: heroPrompt,
      draft_label: `${topicId}-suggestion-studio-hero`,
      size: '1024x1536'
    });
    applyPromptVaultTopicHero(topicId, {
      imageUrl: response.image_url || '',
      model: response.model || 'gpt-image-1.5',
      storagePath: response.storage_path || '',
      publicPath: response.public_path || '',
    });
    if ((promptVaultTopicSelect?.value || loadPromptVaultTopicId()) === topicId) {
      renderPromptVault();
      if (promptVaultStatus) promptVaultStatus.textContent = `${topic.heading} refreshed with a new generated hero image.`;
    }
  } catch (error) {
    if ((promptVaultTopicSelect?.value || loadPromptVaultTopicId()) === topicId && promptVaultStatus) {
      promptVaultStatus.textContent = error.message || `Could not refresh ${topic.heading} hero image yet.`;
    }
  } finally {
    promptVaultHeroGenerationState[topicId] = false;
  }
};

const primePromptVaultTopicImages = async ({ force = false } = {}) => {
  for (const topic of PROMPT_VAULT_TOPICS) {
    // Keep this sequential so the dashboard does not flood the image endpoint.
    // Each topic gets one managed hero image cycle unless uploaded references already exist.
    // eslint-disable-next-line no-await-in-loop
    await hydratePromptVaultTopicHero(topic.id, { force });
  }
};

const togglePromptVaultReadMore = (button) => {
  const card = button.closest('.prompt-vault-card');
  const prompt = card?.querySelector('.prompt-vault-prompt-preview');
  if (!prompt) return;
  const isCollapsed = prompt.classList.contains('is-collapsed');
  prompt.classList.toggle('is-collapsed', !isCollapsed);
  button.textContent = isCollapsed ? 'Show less' : '...read more...';
};

const scrollPromptVaultGallery = (direction = 1) => {
  if (!promptVaultGallery) return;
  const distance = Math.max(promptVaultGallery.clientWidth * 0.88, 320) * direction;
  promptVaultGallery.scrollBy({ left: distance, behavior: 'smooth' });
};

const updatePromptVaultCard = (topicId, cardId, updater) => {
  const state = loadPromptVaultState();
  const topicState = state[topicId];
  if (!topicState || !Array.isArray(topicState.cards)) return null;
  topicState.cards = topicState.cards.map((card) => {
    if (card.id !== cardId) return card;
    const nextCard = typeof updater === 'function' ? updater(card) : { ...card, ...(updater || {}) };
    return { ...nextCard, updatedAt: new Date().toISOString() };
  });
  state[topicId] = topicState;
  savePromptVaultState(state);
  return topicState.cards.find((card) => card.id === cardId) || null;
};

const findPromptVaultCard = (topicId, cardId) => {
  const topicState = ensurePromptVaultTopicState(topicId);
  return topicState?.cards?.find((card) => card.id === cardId) || null;
};

const savePromptVaultApprovalToDrafts = (card) => {
  if (!card?.imageUrl) return;
  const existing = loadSavedPinterestDrafts();
  const next = [
    {
      id: card.id,
      label: card.variantTitle || card.title,
      prompt: card.prompt,
      imageUrl: card.imageUrl,
      savedAt: new Date().toISOString(),
      storagePath: card.storagePath || '',
      publicPath: card.publicPath || '',
      topic: card.topicLabel || ''
    },
    ...existing.filter((item) => item.imageUrl !== card.imageUrl),
  ];
  saveSavedPinterestDrafts(next);
  renderSavedPinterestDrafts();
  renderCanvaSourceLibrary();
};

const setPromptVaultFeedback = (topicId, cardId, feedback) => {
  const nextCard = updatePromptVaultCard(topicId, cardId, (card) => ({
    ...card,
    feedback,
    approvedAt: feedback === 'approved' ? new Date().toISOString() : '',
    rejectedAt: feedback === 'rejected' ? new Date().toISOString() : ''
  }));
  if (feedback === 'approved' && nextCard?.imageUrl) savePromptVaultApprovalToDrafts(nextCard);
  renderPromptVault();
  if (promptVaultStatus) {
    promptVaultStatus.textContent =
      feedback === 'approved'
        ? `${nextCard?.variantTitle || 'Prompt'} approved and saved for future campaign use.`
        : `${nextCard?.variantTitle || 'Prompt'} marked as a skip for now.`;
  }
};

const downloadPromptVaultSuggestion = (topicId, cardId) => {
  const current = findPromptVaultCard(topicId, cardId);
  if (!current) return;
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId);
  const lines = [
    `${topic?.heading || current.topicLabel || 'Codee Suggestion'}`,
    '',
    `Variation: ${current.variantTitle || current.title}`,
    '',
    current.prompt,
    '',
    'Use this as a managed suggestion prompt for the next Pinterest or printable asset direction.'
  ].join('\n');
  downloadTextFile(`${slugifyValue(current.title || current.variantTitle || 'codee-suggestion') || 'codee-suggestion'}.txt`, lines);
  if (promptVaultStatus) promptVaultStatus.textContent = `${current.variantTitle || current.title} suggestion downloaded.`;
};

const uploadPinterestCustomAsset = async () => {
  if (!pinterestCustomFile?.files || !pinterestCustomFile.files.length) {
    if (pinterestCustomUploadMessage) pinterestCustomUploadMessage.textContent = 'Choose an image to upload first.';
    return;
  }

  const title = pinterestCustomTitle?.value.trim() || 'Custom Pinterest Image';
  const notes = pinterestCustomNotes?.value.trim() || '';
  const isCover = Boolean(pinterestCustomIsCover?.checked);
  const topicId = String(pinterestCustomTopic?.value || loadPromptVaultTopicId() || 'relatable-quotes').trim();
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId) || null;
  const assetKey = buildPinterestAssetKey({ siteKey: SITE_KEY, title, isCover });
  const file = pinterestCustomFile.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('client_email', 'christinac90@yahoo.com');
  formData.append('ref', SITE_KEY);
  formData.append('service_type', 'digiblog');
  formData.append('asset_key', assetKey);

  if (pinterestCustomUploadProgress) pinterestCustomUploadProgress.value = 12;
  if (pinterestCustomUploadProgressLabel) pinterestCustomUploadProgressLabel.textContent = 'Upload progress: 12%';
  if (pinterestCustomUploadMessage) {
    pinterestCustomUploadMessage.textContent =
      'Uploading custom Pinterest image into the client asset bucket for site and campaign use...';
  }

  const response = await fetch(`${DASHBOARD_API_BASE}/api/forms/uploads/cover`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.details || data?.error || `Upload failed (${response.status})`);
  }

  const uploads = loadSavedPinterestUploads();
  const entry = {
    id: `${Date.now()}-${assetKey}`,
    title,
    notes,
    isCover,
    topicId,
    topicLabel: topic?.label || '',
    assetKey,
    imageUrl: data.asset_url || data.cover_url || '',
    gcsPath: data.gcs_path || '',
    savedAt: new Date().toISOString()
  };
  saveSavedPinterestUploads([entry, ...uploads.filter((item) => item.imageUrl !== entry.imageUrl)]);
  renderSavedPinterestUploads();
  renderCanvaSourceLibrary();
  refreshPromptVaultTopicReferences(topicId);
  if ((promptVaultTopicSelect?.value || loadPromptVaultTopicId()) === topicId) {
    renderPromptVault();
  }

  if (pinterestCustomUploadProgress) pinterestCustomUploadProgress.value = 100;
  if (pinterestCustomUploadProgressLabel) pinterestCustomUploadProgressLabel.textContent = 'Upload progress: 100%';
  if (pinterestCustomUploadMessage) {
    pinterestCustomUploadMessage.textContent =
      `Custom Pinterest image saved as ${assetKey}. It is now stored in the client asset bucket and attached to ${topic?.heading || 'the selected topic'} as a reference visual for future suggestions.`;
  }
  pinterestCustomUploadForm?.reset();
  if (pinterestCustomTopic) pinterestCustomTopic.value = topicId;
};

savePinterestPlanBtn?.addEventListener('click', () => {
  const tasks = {};
  pinterestTaskChecks.forEach((input) => {
    const key = input.getAttribute('data-pinterest-task') || '';
    if (key) tasks[key] = Boolean(input.checked);
  });
  writeDashboardPreference(PINTEREST_PLAN_KEY, {
    frequency: pinterestFrequency?.value || '6_per_week',
    focusUrl: pinterestFocusUrl?.value.trim() || '',
    secondaryUrl: pinterestSecondaryUrl?.value.trim() || '',
    hookAngle: pinterestHookAngle?.value.trim() || '',
    keywords: pinterestKeywords?.value || '',
    prompts: pinterestCampaignPrompts?.value || '',
    titleBank: pinterestTitleBank?.value || '',
    descriptionBank: pinterestDescriptionBank?.value || '',
    status:
      pinterestStatusButtons.find((button) => button.classList.contains('is-active'))?.getAttribute('data-pinterest-status') || 'planning',
    tasks,
    weeklyBoard: pinterestWeekFields.map((field) => field?.value || '')
  });
  if (pinterestPlanMessage) pinterestPlanMessage.textContent = 'Pinterest plan saved in this dashboard browser.';
});

const copyPinterestText = async (text, successMessage) => {
  try {
    await navigator.clipboard.writeText(text);
    if (pinterestPlanMessage) pinterestPlanMessage.textContent = successMessage;
  } catch {
    if (pinterestPlanMessage) pinterestPlanMessage.textContent = 'Could not copy. Select and copy manually.';
  }
};

copyPinterestPromptsBtn?.addEventListener('click', async () => {
  const parts = [
    'Pinterest keyword bank',
    pinterestKeywords?.value || '',
    '',
    'Pinterest prompt bank',
    pinterestCampaignPrompts?.value || '',
    '',
    'Pin title bank',
    pinterestTitleBank?.value || '',
    '',
    'Pin description bank',
    pinterestDescriptionBank?.value || '',
  ].join('\n');
  await copyPinterestText(parts, 'Pinterest brief copied.');
});

copyPinterestTitlesBtn?.addEventListener('click', async () => {
  await copyPinterestText(pinterestTitleBank?.value || '', 'Pinterest titles copied.');
});

copyPinterestDescriptionsBtn?.addEventListener('click', async () => {
  await copyPinterestText(pinterestDescriptionBank?.value || '', 'Pinterest descriptions copied.');
});

pinterestStatusButtons.forEach((button) => {
  button.addEventListener('click', () => {
    pinterestStatusButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
  });
});

renderPinterestPromptsBtn?.addEventListener('click', () => {
  renderPinterestPromptCards();
  if (pinterestPlanMessage) pinterestPlanMessage.textContent = 'Prompt cards refreshed.';
});

pinterestCampaignPrompts?.addEventListener('input', () => {
  renderPinterestPromptCards();
});

promptVaultTopicSelect?.addEventListener('change', () => {
  if (pinterestCustomTopic) pinterestCustomTopic.value = promptVaultTopicSelect.value;
  renderPromptVault();
  hydratePromptVaultTopicHero(promptVaultTopicSelect.value);
});

promptVaultRefreshBtn?.addEventListener('click', () => {
  renderPromptVault({ forceRefresh: true });
  const topicId = promptVaultTopicSelect?.value || loadPromptVaultTopicId();
  hydratePromptVaultTopicHero(topicId, { force: true });
  if (promptVaultStatus) promptVaultStatus.textContent = 'Prompt wall refreshed from the current topic catalog and image cycle.';
});

promptVaultCopyTopicBtn?.addEventListener('click', async () => {
  const topicId = promptVaultTopicSelect?.value || loadPromptVaultTopicId();
  const topicState = ensurePromptVaultTopicState(topicId);
  const topic = PROMPT_VAULT_TOPICS.find((item) => item.id === topicId);
  const text = (topicState?.cards || []).map((card) => `${card.variantTitle}\n${card.prompt}`).join('\n\n');
  await copyPinterestText(text, `${topic?.heading || 'Topic'} prompts copied.`);
});

pinterestPromptCards?.addEventListener('click', async (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;

  const copyIndex = target.getAttribute('data-pinterest-copy');
  if (copyIndex !== null) {
    const prompt = splitPinterestPrompts(pinterestCampaignPrompts?.value || '')[Number(copyIndex)] || '';
    await copyPinterestText(prompt, `Prompt ${Number(copyIndex) + 1} copied.`);
    return;
  }

  const generateIndex = target.getAttribute('data-pinterest-generate');
  if (generateIndex !== null) {
    await generatePinterestDraft(Number(generateIndex));
    return;
  }

  const saveIndex = target.getAttribute('data-pinterest-save');
  if (saveIndex !== null) {
    savePinterestDraft(Number(saveIndex));
    return;
  }

  const copyUrl = target.getAttribute('data-pinterest-copy-url');
  if (copyUrl) {
    await copyPinterestText(copyUrl, 'Image URL copied.');
  }

  const canvaTitle = target.getAttribute('data-canva-prefill-title');
  if (canvaTitle !== null) {
    populateCanvaImportForm({
      title: canvaTitle || '',
      imageUrl: target.getAttribute('data-canva-prefill-url') || '',
      notes: target.getAttribute('data-canva-prefill-notes') || '',
      assetType: target.getAttribute('data-canva-prefill-type') || 'pinterest_pin'
    });
  }
});

promptVaultGallery?.addEventListener('click', async (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const topicId = promptVaultTopicSelect?.value || loadPromptVaultTopicId();

  if (target.matches('[data-prompt-vault-expand]')) {
    togglePromptVaultReadMore(target);
    return;
  }

  const copyCardId = target.getAttribute('data-prompt-vault-copy');
  if (copyCardId) {
    const card = findPromptVaultCard(topicId, copyCardId);
    await copyPinterestText(card?.prompt || '', `${card?.variantTitle || 'Prompt'} copied.`);
    return;
  }

  const downloadCardId = target.getAttribute('data-prompt-vault-download');
  if (downloadCardId) {
    downloadPromptVaultSuggestion(topicId, downloadCardId);
    return;
  }

  const feedbackCardId = target.getAttribute('data-prompt-vault-feedback');
  if (feedbackCardId) {
    const feedback = target.getAttribute('data-feedback-value') || 'pending';
    setPromptVaultFeedback(topicId, feedbackCardId, feedback);
    return;
  }

  const copyUrl = target.getAttribute('data-pinterest-copy-url');
  if (copyUrl) {
    await copyPinterestText(copyUrl, 'Image URL copied.');
  }
});

promptVaultApproved?.addEventListener('click', (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  if (target.matches('[data-prompt-vault-expand]')) {
    togglePromptVaultReadMore(target);
  }
});

promptVaultPrevBtn?.addEventListener('click', () => {
  scrollPromptVaultGallery(-1);
});

promptVaultNextBtn?.addEventListener('click', () => {
  scrollPromptVaultGallery(1);
});

pinterestSavedDrafts?.addEventListener('click', async (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;

  const removeId = target.getAttribute('data-pinterest-saved-remove');
  if (removeId !== null) {
    const next = loadSavedPinterestDrafts().filter((item) => String(item.id || '') !== removeId);
    saveSavedPinterestDrafts(next);
    renderSavedPinterestDrafts();
    renderCanvaSourceLibrary();
    if (pinterestPlanMessage) pinterestPlanMessage.textContent = 'Saved Pinterest draft removed.';
    return;
  }

  const copyUrl = target.getAttribute('data-pinterest-copy-url');
  if (copyUrl) {
    await copyPinterestText(copyUrl, 'Image URL copied.');
  }

  const canvaTitle = target.getAttribute('data-canva-prefill-title');
  if (canvaTitle !== null) {
    populateCanvaImportForm({
      title: canvaTitle || '',
      imageUrl: target.getAttribute('data-canva-prefill-url') || '',
      notes: target.getAttribute('data-canva-prefill-notes') || '',
      assetType: target.getAttribute('data-canva-prefill-type') || 'pinterest_pin'
    });
  }
});

clearPinterestSavedDraftsBtn?.addEventListener('click', () => {
  saveSavedPinterestDrafts([]);
  renderSavedPinterestDrafts();
  renderCanvaSourceLibrary();
  if (pinterestPlanMessage) pinterestPlanMessage.textContent = 'Saved Pinterest drafts cleared.';
});

pinterestCustomUploads?.addEventListener('click', async (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const copyUrl = target.getAttribute('data-pinterest-copy-url');
  if (copyUrl) {
    await copyPinterestText(copyUrl, 'Image URL copied.');
  }

  const canvaTitle = target.getAttribute('data-canva-prefill-title');
  if (canvaTitle !== null) {
    populateCanvaImportForm({
      title: canvaTitle || '',
      imageUrl: target.getAttribute('data-canva-prefill-url') || '',
      notes: target.getAttribute('data-canva-prefill-notes') || '',
      assetType: target.getAttribute('data-canva-prefill-type') || 'pinterest_pin'
    });
  }
});

pinterestCustomUploadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await uploadPinterestCustomAsset();
  } catch (error) {
    if (pinterestCustomUploadProgress) pinterestCustomUploadProgress.value = 0;
    if (pinterestCustomUploadProgressLabel) pinterestCustomUploadProgressLabel.textContent = 'Upload progress: 0%';
    if (pinterestCustomUploadMessage) {
      pinterestCustomUploadMessage.textContent = error.message || 'Could not upload the custom Pinterest image.';
    }
  }
});

generateBlogDraftsButton?.addEventListener('click', async () => {
  try {
    await loadMadeForThisContentOs({ regenerate: true });
  } catch (error) {
    if (blogDraftsStatus) blogDraftsStatus.textContent = error.message || 'Could not generate the draft stack.';
  }
});

refreshBlogSignalsButton?.addEventListener('click', async () => {
  try {
    await loadMadeForThisContentOs();
  } catch (error) {
    if (contentSignalsStatus) contentSignalsStatus.textContent = error.message || 'Could not refresh recent Christina notes.';
  }
});

blogDraftsGrid?.addEventListener('click', async (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const draftId = target.getAttribute('data-blog-draft-approve');
  try {
    if (draftId) {
      await approveMadeForThisBlogDraft(draftId);
      return;
    }
    const saveId = target.getAttribute('data-blog-draft-save');
    if (saveId) {
      if (blogDraftsStatus) blogDraftsStatus.textContent = 'Saving edits to the studio draft...';
      await updateMadeForThisBlogDraft(saveId, collectDraftEditorPayload(saveId));
      if (blogDraftsStatus) blogDraftsStatus.textContent = 'Draft edits saved.';
      return;
    }
    const readyId = target.getAttribute('data-blog-draft-ready');
    if (readyId) {
      if (blogDraftsStatus) blogDraftsStatus.textContent = 'Marking this draft ready for approval...';
      await updateMadeForThisBlogDraft(readyId, {
        ...collectDraftEditorPayload(readyId),
        decision: 'ready'
      });
      if (blogDraftsStatus) blogDraftsStatus.textContent = 'Draft marked ready for Christina to approve.';
      return;
    }
    const refreshDemoId = target.getAttribute('data-blog-draft-refresh-demo');
    if (refreshDemoId) {
      if (blogDraftsStatus) blogDraftsStatus.textContent = 'Refreshing the WordPress demo draft...';
      await updateMadeForThisBlogDraft(refreshDemoId, {
        ...collectDraftEditorPayload(refreshDemoId),
        refreshWordpressDemo: true
      });
      if (blogDraftsStatus) blogDraftsStatus.textContent = 'WordPress demo draft refreshed.';
      return;
    }
    const decision = target.getAttribute('data-blog-draft-decision');
    const decisionId = target.getAttribute('data-blog-draft-id');
    if (decision && decisionId) {
      if (blogDraftsStatus) blogDraftsStatus.textContent = decision === 'deny' ? 'Marking this draft for changes...' : 'Holding this draft in the studio queue...';
      await updateMadeForThisBlogDraft(decisionId, {
        ...collectDraftEditorPayload(decisionId),
        decision
      });
      if (blogDraftsStatus) blogDraftsStatus.textContent = decision === 'deny' ? 'Draft marked for changes.' : 'Draft moved to hold.';
    }
  } catch (error) {
    if (blogDraftsStatus) blogDraftsStatus.textContent = error.message || 'Could not update this draft.';
  }
});

draftPreviewApprove?.addEventListener('click', async () => {
  const draftId = new URLSearchParams(window.location.search).get('id');
  if (!draftId) return;
  try {
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Approving this draft and keeping the live demo...';
    await approveMadeForThisBlogDraft(draftId);
    renderDraftPreviewPage(findMadeForThisDraft(draftId));
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Approved. This version stays live as the kept demo draft.';
  } catch (error) {
    if (draftPreviewStatus) draftPreviewStatus.textContent = error.message || 'Could not approve this draft.';
  }
});

draftPreviewDeny?.addEventListener('click', async () => {
  const draftId = new URLSearchParams(window.location.search).get('id');
  if (!draftId) return;
  try {
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Marking this draft for changes...';
    await updateMadeForThisBlogDraft(draftId, { decision: 'deny' });
    renderDraftPreviewPage(findMadeForThisDraft(draftId));
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Draft marked for changes.';
  } catch (error) {
    if (draftPreviewStatus) draftPreviewStatus.textContent = error.message || 'Could not deny this draft.';
  }
});

draftPreviewHold?.addEventListener('click', async () => {
  const draftId = new URLSearchParams(window.location.search).get('id');
  if (!draftId) return;
  try {
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Holding this draft in the studio queue...';
    await updateMadeForThisBlogDraft(draftId, { decision: 'hold' });
    renderDraftPreviewPage(findMadeForThisDraft(draftId));
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Draft moved to hold.';
  } catch (error) {
    if (draftPreviewStatus) draftPreviewStatus.textContent = error.message || 'Could not hold this draft.';
  }
});

draftPreviewSave?.addEventListener('click', async () => {
  const draftId = new URLSearchParams(window.location.search).get('id');
  if (!draftId) return;
  try {
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Saving draft edits...';
    const draft = await updateMadeForThisBlogDraft(draftId, collectDraftPreviewPayload());
    renderDraftPreviewPage(draft);
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Draft edits saved on Made For This.';
  } catch (error) {
    if (draftPreviewStatus) draftPreviewStatus.textContent = error.message || 'Could not save this draft.';
  }
});

draftPreviewExpand?.addEventListener('click', async () => {
  const draftId = new URLSearchParams(window.location.search).get('id');
  if (!draftId) return;
  try {
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Codee is extending this post in the current Made For This voice...';
    const draft = await updateMadeForThisBlogDraft(draftId, {
      ...collectDraftPreviewPayload(),
      expandArticle: true
    });
    renderDraftPreviewPage(draft);
    if (draftPreviewStatus) draftPreviewStatus.textContent = 'Codee added more to the post. Review and trim anything you do not want.';
  } catch (error) {
    if (draftPreviewStatus) draftPreviewStatus.textContent = error.message || 'Could not expand this draft.';
  }
});

canvaConnectButton?.addEventListener('click', async () => {
  await startCanvaConnection();
});

googleInboxConnectButton?.addEventListener('click', async () => {
  await startGoogleInboxConnection();
});

googleInboxScanButton?.addEventListener('click', async () => {
  await runGoogleInboxScan();
});

canvaRefreshWorkspaceButton?.addEventListener('click', async () => {
  await loadCanvaWorkspace();
});

canvaImportForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await submitCanvaImport();
  } catch (error) {
    if (canvaImportMessage) canvaImportMessage.textContent = error.message || 'Could not send this asset to Canva.';
  }
});

renderPageInventory();
renderGlobalPageAuditStrip();

canvaImportQueue?.addEventListener('click', (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const canvaTitle = target.getAttribute('data-canva-prefill-title');
  if (canvaTitle !== null) {
    populateCanvaImportForm({
      title: canvaTitle || '',
      imageUrl: target.getAttribute('data-canva-prefill-url') || '',
      notes: target.getAttribute('data-canva-prefill-notes') || '',
      assetType: target.getAttribute('data-canva-prefill-type') || 'pinterest_pin'
    });
  }
});

const renderPrintableStudio = (studio) => {
  if (!printableStudioLinks || !printablePackLinks) return;
  const localLibraryUrl = `${window.location.origin}/live-printables/kids-activity/`;
  const localProductPageUrl = `${window.location.origin}/bundles/kids-activity-coloring-bundle.html`;
  const packs = Array.isArray(studio?.packs) ? studio.packs : [];
  const localPacks = packs.map((pack) => ({
    ...pack,
    url: `${window.location.origin}/live-printables/kids-activity/${pack.key}.html`
  }));
  printableStudioLinks.innerHTML = `
    <p class="small-copy"><strong>Status:</strong> ${studio?.status || 'ready_for_review'}</p>
    <p class="small-copy"><strong>Mode:</strong> ${studio?.mode || 'live_printable_pages'}</p>
    <p class="small-copy"><a class="text-link" href="${localProductPageUrl}" target="_blank" rel="noopener noreferrer">Open product page</a></p>
    <p class="small-copy"><a class="text-link" href="${localLibraryUrl}" target="_blank" rel="noopener noreferrer">Open live printable library</a></p>
  `;
  printablePackLinks.innerHTML = localPacks
    .map(
      (pack) => `
        <article class="card bundle-card">
          <h3>${pack.title || pack.key || 'Printable pack'}</h3>
          <p class="small-copy">${pack.key || ''}</p>
          <div class="button-row"><a class="btn" href="${pack.url || '#'}" target="_blank" rel="noopener noreferrer">Open Pack</a></div>
        </article>
      `
    )
    .join('');
};

const loadPrintableStudio = async () => {
  if (!printableStudioForm) return;
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/printables`);
    const data = await response.json();
    const studio = data?.printable_studio || {};
    if (printablePromptField) printablePromptField.value = studio.prompt || '';
    if (printableReferenceImageField) printableReferenceImageField.value = studio.reference_image_url || '';
    if (printableVariationCountField) printableVariationCountField.value = String(studio.variation_count || 4);
    renderPrintableStudio(studio);
  } catch (error) {
    if (printableStudioMessage) printableStudioMessage.textContent = 'Printable Studio could not load.';
  }
};

if (printableStudioForm) {
  printableStudioForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (printableStudioMessage) printableStudioMessage.textContent = 'Saving Printable Studio...';
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/printables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: printablePromptField?.value.trim() || '',
          reference_image_url: printableReferenceImageField?.value.trim() || '',
          variation_count: Number(printableVariationCountField?.value || '4'),
          status: 'ready_for_review'
        })
      });
      const data = await response.json();
      renderPrintableStudio(data?.printable_studio || {});
      if (printableStudioMessage) printableStudioMessage.textContent = 'Printable Studio saved.';
    } catch (error) {
      if (printableStudioMessage) printableStudioMessage.textContent = 'Printable Studio save failed.';
    }
  });

  printableMarkLiveBtn?.addEventListener('click', async () => {
    if (printableStudioMessage) printableStudioMessage.textContent = 'Marking live library ready...';
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/nina/printables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: printablePromptField?.value.trim() || '',
          reference_image_url: printableReferenceImageField?.value.trim() || '',
          variation_count: Number(printableVariationCountField?.value || '4'),
          status: 'published_live_pages'
        })
      });
      const data = await response.json();
      renderPrintableStudio(data?.printable_studio || {});
      if (printableStudioMessage) printableStudioMessage.textContent = 'Live printable library marked ready.';
    } catch (error) {
      if (printableStudioMessage) printableStudioMessage.textContent = 'Could not mark live library ready.';
    }
  });

  loadPrintableStudio();
}

loadPinterestPlan();
applyDashboardOAuthState();
if (!Object.keys(loadPromptVaultState()).length) {
  savePromptVaultState(createPromptVaultSeed());
}
renderPromptVaultTopicOptions();
renderPromptVault();
if (pinterestCustomTopic) {
  pinterestCustomTopic.value = loadPromptVaultTopicId();
}
if (promptVaultTopicSelect) {
  window.setInterval(() => {
    renderPromptVault();
    hydratePromptVaultTopicHero(promptVaultTopicSelect.value);
  }, 5 * 60 * 1000);
}
primePromptVaultTopicImages();
renderPinterestPromptCards();
renderSavedPinterestDrafts();
renderSavedPinterestUploads();
renderCanvaSourceLibrary();
loadCanvaWorkspace();
loadGoogleInboxStatus();
initDraftPreviewPage();
loadMadeForThisContentOs().catch((error) => {
  if (blogDraftsStatus) blogDraftsStatus.textContent = error.message || 'Could not load the Made For This content queue.';
  markDashboardReady();
});

if (!blogDraftsGrid && dashboardLoader) {
  window.setTimeout(() => {
    markDashboardReady();
  }, 300);
}

if (analyticsSummaryCards) {
  loadDashboardReporting();
}

if (imageUploadForm && dashboardMessage && imageSlot && imageFile) {
  imageUploadForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!imageSlot.value || !imageFile.files || imageFile.files.length === 0) {
      dashboardMessage.textContent = 'Please select an image slot and choose a file.';
      return;
    }

    const file = imageFile.files[0];
    const reader = new FileReader();

    if (uploadProgress && uploadProgressLabel) {
      uploadProgress.value = 0;
      uploadProgressLabel.textContent = 'Upload progress: 0%';
    }

    reader.onprogress = (progressEvent) => {
      if (!uploadProgress || !uploadProgressLabel || !progressEvent.lengthComputable) return;
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      uploadProgress.value = percent;
      uploadProgressLabel.textContent = `Upload progress: ${percent}%`;
    };

    reader.onload = () => {
      const overrides = readImageOverrides();
      overrides[imageSlot.value] = String(reader.result);
      writeImageOverrides(overrides);
      if (uploadProgress && uploadProgressLabel) {
        uploadProgress.value = 100;
        uploadProgressLabel.textContent = 'Upload complete: 100%';
      }
      dashboardMessage.textContent =
        'Image saved for local preview. Refresh pages to see it. Deploy is required for permanent live-site source updates.';
      imageUploadForm.reset();
    };
    reader.readAsDataURL(file);
  });

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      if (!imageSlot.value) {
        dashboardMessage.textContent = 'Select an image slot to remove.';
        return;
      }
      const overrides = readImageOverrides();
      delete overrides[imageSlot.value];
      writeImageOverrides(overrides);
      dashboardMessage.textContent = 'Slot reset to default image.';
    });
  }

  if (clearImagesBtn) {
    clearImagesBtn.addEventListener('click', () => {
      localStorage.removeItem(IMAGE_OVERRIDE_KEY);
      dashboardMessage.textContent = 'All custom images cleared.';
    });
  }

  if (applyPlaceholdersBtn) {
    applyPlaceholdersBtn.addEventListener('click', () => {
      const merged = {
        ...readImageOverrides(),
        ...SLOT_PLACEHOLDER_MAP
      };
      writeImageOverrides(merged);
      dashboardMessage.textContent =
        'Placeholder set applied by slot title. Refresh site pages to preview.';
    });
  }

  if (makeUpdatesLiveBtn) {
    makeUpdatesLiveBtn.addEventListener('click', async () => {
      const overrides = readImageOverrides();
      const slotCount = Object.keys(overrides).length;
      if (slotCount === 0) {
        dashboardMessage.textContent = 'No pending image updates found. Upload or apply placeholders first.';
        return;
      }

      const body = [
        'Dashboard publish request from Made For This',
        '',
        `Pending image slots: ${slotCount}`,
        '',
        'This dashboard is unique because it allows instant local visual preview before going live.',
        'Workflow:',
        '1) Upload and preview changes locally by slot.',
        '2) Final review on site pages.',
        '3) Press Make Updates Live to request global publish.',
        '',
        'Important:',
        'To make changes visible to everyone, source assets must be committed/deployed.',
        '',
        `Triggered from: ${window.location.href}`
      ].join('\n');

      await triggerVisitorEmail({
        event: 'dashboard_make_updates_live',
        siteKey: SITE_KEY,
        email: DEFAULT_LIVE_UPDATE_EMAIL,
        subject: 'Make Updates Live requested from Made For This dashboard',
        body,
        landingUrl: window.location.href
      });

      dashboardMessage.textContent =
        'Publish request sent. Final step: deploy source image updates to make them live for everyone.';
    });
  }
}

if (themePreset && themeMessage) {
  const currentTheme = localStorage.getItem(THEME_PREF_KEY) || 'luxe_boho_charcoal';
  themePreset.value = currentTheme;

  if (applyThemeBtn) {
    applyThemeBtn.addEventListener('click', () => {
      setThemePreference(themePreset.value);
      themeMessage.textContent = 'Preset theme applied immediately.';
    });
  }

  if (applyCustomThemeBtn) {
    applyCustomThemeBtn.addEventListener('click', () => {
      const customVars = {};
      const entries = [
        ['--bg', customBg?.value.trim()],
        ['--bg-soft', customBgSoft?.value.trim()],
        ['--surface', customSurface?.value.trim()],
        ['--text', customText?.value.trim()],
        ['--line', customLine?.value.trim()],
        ['--accent', customAccent?.value.trim()]
      ];

      entries.forEach(([key, value]) => {
        if (value) customVars[key] = value;
      });

      if (Object.keys(customVars).length === 0) {
        themeMessage.textContent = 'Enter at least one custom color value.';
        return;
      }

      setThemePreference(themePreset.value || 'luxe_boho_charcoal', customVars);
      themeMessage.textContent = 'Custom palette applied immediately.';
    });
  }

  if (resetThemeBtn) {
    resetThemeBtn.addEventListener('click', () => {
      localStorage.removeItem(THEME_PREF_KEY);
      localStorage.removeItem(THEME_CUSTOM_KEY);
      setThemePreference('luxe_boho_charcoal');
      themePreset.value = 'luxe_boho_charcoal';
      if (customBg) customBg.value = '';
      if (customBgSoft) customBgSoft.value = '';
      if (customSurface) customSurface.value = '';
      if (customText) customText.value = '';
      if (customLine) customLine.value = '';
      if (customAccent) customAccent.value = '';
      themeMessage.textContent = 'Theme reset to Luxe Boho Charcoal.';
    });
  }
}

// Reusable lead-capture forms (homepage, inline components, popup)
const readLeadEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveLeadEntries = (entries) => {
  localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(entries));
};

const submitLeadCapture = async (form, messageNode) => {
  markLeadSignupStarted(form);
  const sessionLead = readSessionLead();
  if (sessionLead?.email) {
    if (messageNode) {
      messageNode.innerHTML = `You are already signed up in this browser session as <strong>${sessionLead.email}</strong>.`;
    }
    return;
  }

  const nameField = form.querySelector('input[name="name"]');
  const emailField = form.querySelector('input[name="email"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const name = nameField?.value.trim() || '';
  const email = emailField?.value.trim().toLowerCase() || '';
  const source = form.getAttribute('data-lead-source') || window.location.pathname;

  if (!name) {
    if (messageNode) messageNode.textContent = 'Please enter your name.';
    return;
  }

  if (!emailField || !emailField.validity.valid) {
    if (messageNode) messageNode.textContent = 'Please enter a valid email address.';
    return;
  }

  const existing = readLeadEntries();
  const alreadyCaptured = existing.some((entry) => entry.email === email && entry.source === source);
  if (alreadyCaptured) {
    if (messageNode) messageNode.textContent = 'You are already signed up for this offer.';
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (messageNode) messageNode.textContent = 'Submitting...';

  try {
    const funnelResult = await callFunnelApi('/api/funnel/signup', {
      siteKey: SITE_KEY,
      productKey: form.getAttribute('data-product-key') || FREE_LIBRARY_PRODUCT_KEY,
      name,
      email,
      source
    });

    existing.push({
      name,
      email,
      source,
      capturedAt: new Date().toISOString()
    });
    saveLeadEntries(existing);
    saveSessionLead({ name, email, source, capturedAt: new Date().toISOString() });

    await triggerVisitorEmail({
      event: 'lead_capture',
      siteKey: SITE_KEY,
      email: DEFAULT_LIVE_UPDATE_EMAIL,
      subject: 'New printable lead captured',
      body: `Lead source: ${source}\nName: ${name}\nEmail: ${email}\nPage: ${window.location.href}`,
      landingUrl: window.location.href
    });

    await trackEvent('lead_signup_completed', {
      form_name: form.getAttribute('data-lead-source') || 'lead_capture_form',
      source,
      product_key: form.getAttribute('data-product-key') || FREE_LIBRARY_PRODUCT_KEY,
      product_title: 'Starter Printable Library',
      value: 1
    }, { server: false });

    if (messageNode) {
      if (funnelResult?.freeDownloadUrl) {
        messageNode.innerHTML = `Success. <a class="text-link" href="${funnelResult.freeDownloadUrl}" target="_blank" rel="noopener noreferrer">Download your free printable library</a>.`;
        await trackEvent('free_bundle_downloaded', {
          link_url: funnelResult.freeDownloadUrl,
          link_text: 'Free printable library',
          source: 'signup_success'
        });
      } else {
        messageNode.textContent = 'Success. Check your inbox for printable access updates.';
      }
    }
    form.reset();
  } catch (error) {
    if (messageNode) messageNode.textContent = error?.message || 'Something went wrong. Please try again.';
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

document.querySelectorAll('.lead-capture-form[data-lead-source]').forEach((form) => {
  const messageNode = form.parentElement?.querySelector('[data-lead-message]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitLeadCapture(form, messageNode);
  });
});

const LEAD_POPUP_PIN_IMAGES = [
  { src: '/assets/madefirthis-free-bundle.png', alt: 'Made For This free bundle preview' },
  { src: '/assets/dental/jewelry-cover.png', alt: 'Made For This jewelry cover image' },
  { src: '/assets/dental/home-featured-mindset.png', alt: 'Home featured mindset image' },
  { src: '/assets/dental/pinterest-pin.png', alt: 'Pinterest pin preview' },
  { src: '/assets/dental/new-blog-logo.png', alt: 'New blog logo graphic' },
  { src: '/assets/dental/home-post-of-the-day.png', alt: 'Home post of the day preview' },
  { src: '/assets/dental/Homepage-hero.png', alt: 'Homepage hero preview' },
  { src: '/assets/dental/pinterest-pins2.png', alt: 'Pinterest pin collage preview' },
  { src: '/assets/dental/madeforthis-hoodie.png', alt: 'Made For This hoodie product preview' },
  { src: '/assets/dental/madeforthis-logo.png', alt: 'Made For This logo graphic' },
  { src: '/assets/dental/why-i-started-hero.png', alt: 'Why I Started hero image' },
  { src: '/assets/dental/Ai-K9-Codee-logo.png', alt: 'AI K9 Codee logo graphic' },
  { src: '/assets/dental/new -blog-logo.png', alt: 'Alternate new blog logo graphic' },
  { src: '/assets/dental/home-featured-routine.png', alt: 'Home featured routine image' },
  { src: '/assets/dental/site-logo.png', alt: 'Site logo graphic' },
  { src: '/assets/dental/digiblog-logo.png', alt: 'Digi blog logo graphic' },
  { src: '/assets/printables/kids-activity/kids-quiet-preview.png', alt: 'Kids quiet activity printable preview' },
  { src: '/assets/printables/kids-activity/kids-cut-preview.png', alt: 'Kids cut activity printable preview' },
  { src: '/assets/printables/kids-activity/kids-find-preview.png', alt: 'Kids find activity printable preview' },
  { src: '/assets/printables/kids-activity/kids-matching-preview.png', alt: 'Kids matching activity printable preview' },
  { src: '/assets/printables/kids-activity/kids-trace-preview.png', alt: 'Kids trace activity printable preview' },
  { src: '/assets/printables/kids-activity/kids-coloring-preview.png', alt: 'Kids coloring activity printable preview' },
  { src: '/assets/printables/kids-activity/kids-mazes-preview.png', alt: 'Kids mazes activity printable preview' },
  { src: '/assets/madeforthis-printables-cover.PNG', alt: 'Made For This printables cover image' },
  { src: '/assets/brand/logo-primary.png', alt: 'Made For This primary brand logo' },
];

const mountLeadPopup = () => {
  if (sessionStorage.getItem(LEAD_POPUP_SEEN_KEY) === '1') return;
  if (readSessionLead()?.email) return;
  if (window.location.pathname.includes('dashboard')) return;

  const popup = document.createElement('section');
  popup.className = 'lead-popup';
  popup.setAttribute('aria-label', 'Free printable signup');
  popup.innerHTML = `
    <button class="lead-popup-close" type="button" aria-label="Close signup popup">×</button>
    <p class="overline">Free Gift</p>
    <h2>Get Free Printables When You Sign Up!</h2>
    <img class="lead-popup-pin-img" src="${escapeHtml(LEAD_POPUP_PIN_IMAGES[0].src)}" alt="${escapeHtml(LEAD_POPUP_PIN_IMAGES[0].alt)}" loading="lazy" />
    <p class="small-copy">Join and instantly unlock free printables including personal growth sheets, coloring pages, weekly reset tools, and more.</p>
    <form class="lead-capture-form" data-lead-source="popup-free-library" novalidate>
      <label class="sr-only" for="lead-popup-name">Name</label>
      <input id="lead-popup-name" name="name" type="text" placeholder="Your name" required />
      <label class="sr-only" for="lead-popup-email">Email</label>
      <input id="lead-popup-email" name="email" type="email" placeholder="you@example.com" required />
      <button class="btn btn-primary" type="submit">Yes! Send Me the Free Pins</button>
    </form>
    <p class="lead-message" data-lead-message role="status" aria-live="polite"></p>
  `;
  document.body.appendChild(popup);

  const closeBtn = popup.querySelector('.lead-popup-close');
  const popupForm = popup.querySelector('.lead-capture-form');
  const popupMessage = popup.querySelector('[data-lead-message]');
  const pinImg = popup.querySelector('.lead-popup-pin-img');

  let pinIndex = 0;
  const pinRotationInterval = window.setInterval(() => {
    if (!pinImg) return;
    pinImg.classList.add('lead-popup-pin-fade');
    window.setTimeout(() => {
      pinIndex = (pinIndex + 1) % LEAD_POPUP_PIN_IMAGES.length;
      pinImg.src = LEAD_POPUP_PIN_IMAGES[pinIndex].src;
      pinImg.alt = LEAD_POPUP_PIN_IMAGES[pinIndex].alt;
      pinImg.classList.remove('lead-popup-pin-fade');
    }, 300);
  }, 5000);

  const closePopup = () => {
    clearInterval(pinRotationInterval);
    popup.classList.remove('show');
    sessionStorage.setItem(LEAD_POPUP_SEEN_KEY, '1');
  };

  closeBtn?.addEventListener('click', closePopup);
  popupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitLeadCapture(popupForm, popupMessage);
    clearInterval(pinRotationInterval);
    sessionStorage.setItem(LEAD_POPUP_SEEN_KEY, '1');
  });

  const triggerShow = () => {
    if (sessionStorage.getItem(LEAD_POPUP_SEEN_KEY) === '1') return;
    popup.classList.add('show');
  };

  const timer = window.setTimeout(triggerShow, 12000);
  const onScroll = () => {
    const scrollRatio = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (scrollRatio > 0.55) {
      clearTimeout(timer);
      triggerShow();
      window.removeEventListener('scroll', onScroll);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
};

mountLeadPopup();

const contactForm = document.getElementById('contact-form');
const contactMessage = document.getElementById('contact-message');

if (contactForm && contactMessage) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const honeypot = contactForm.querySelector('input[name="company"]');
    if (honeypot?.value.trim()) return;

    const requiredFields = contactForm.querySelectorAll('input[required], textarea[required]');
    const hasInvalidField = Array.from(requiredFields).some((field) => !field.value.trim());

    if (hasInvalidField) {
      contactMessage.textContent = 'Please complete all fields before submitting.';
      return;
    }

    const payload = {
      event: 'contact_form_submission',
      siteKey: SITE_KEY,
      email: PUBLIC_SITE_SETTINGS.supportEmail,
      visitorName: contactForm.querySelector('input[name="name"]')?.value.trim() || '',
      visitorEmail: contactForm.querySelector('input[name="email"]')?.value.trim() || '',
      inquiryType: contactForm.querySelector('select[name="inquiryType"]')?.value.trim() || 'General inquiry',
      subject: `Made For This inquiry: ${contactForm.querySelector('select[name="inquiryType"]')?.value.trim() || 'General inquiry'}`,
      body: `Name: ${contactForm.querySelector('input[name="name"]')?.value.trim() || ''}\nEmail: ${contactForm.querySelector('input[name="email"]')?.value.trim() || ''}\nInquiry Type: ${contactForm.querySelector('select[name="inquiryType"]')?.value.trim() || 'General inquiry'}\n\nMessage:\n${contactForm.querySelector('textarea[name="message"]')?.value.trim() || ''}`,
      replyToEmail: contactForm.querySelector('input[name="email"]')?.value.trim() || '',
      landingUrl: window.location.href
    };

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalLabel = submitButton.textContent || 'Send Message';
        submitButton.textContent = 'Sending...';
      }
      contactMessage.textContent = 'Sending your message...';
      await triggerVisitorEmail(payload);
      await trackEvent('contact_form_submitted', {
        inquiry_type: payload.inquiryType,
        source: 'contact_page'
      }, { server: false });
      contactMessage.textContent = 'Thanks for reaching out. Nina will reply as soon as she can.';
      contactForm.reset();
    } catch {
      contactMessage.textContent = 'Something went wrong. Please try again or email support directly.';
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalLabel || 'Send Message';
      }
    }
  });
}

const bundlePinTriggers = document.querySelectorAll('[data-pin-gate]');
if (bundlePinTriggers.length > 0) {
bundlePinTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      trackEvent('product_preview_opened', {
        link_url: trigger.getAttribute('data-pin-target') || window.location.href,
        link_text: (trigger.textContent || '').trim() || 'View bundle',
        source: 'pin_gate'
      });
      const expectedPin = trigger.getAttribute('data-pin') || '';
      const targetUrl = trigger.getAttribute('data-pin-target') || '';
      const enteredPin = window.prompt('Enter bundle access PIN');
      if (enteredPin === null) return;
      if (enteredPin.trim() !== expectedPin) {
        window.alert('Incorrect PIN.');
        return;
      }
      if (targetUrl) window.location.href = targetUrl;
    });
  });
}

// Paid bundle checkout + purchase automation hooks
const weeklyCheckoutForm = document.getElementById('weekly-reset-checkout-form');
const weeklyCheckoutMessage = document.getElementById('weekly-reset-checkout-message');
if (weeklyCheckoutForm) {
  weeklyCheckoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = weeklyCheckoutForm.querySelector('input[name="name"]')?.value.trim() || '';
    const email = weeklyCheckoutForm.querySelector('input[name="email"]')?.value.trim().toLowerCase() || '';
    const productKey = weeklyCheckoutForm.getAttribute('data-product-key') || DEFAULT_BUNDLE_PRODUCT_KEY;
    const productTitle = weeklyCheckoutForm.getAttribute('data-product-title') || document.querySelector('h1')?.textContent?.trim() || 'Bundle';
    const formLiveCheckoutUrl = weeklyCheckoutForm.getAttribute('data-live-checkout-url') || '';
    const formPriceId = weeklyCheckoutForm.getAttribute('data-stripe-price-id') || '';
    if (!email || !email.includes('@')) {
      if (weeklyCheckoutMessage) weeklyCheckoutMessage.textContent = 'Enter a valid email to continue.';
      return;
    }

    if (!FUNNEL_API_BASE) {
      if (weeklyCheckoutMessage) {
        weeklyCheckoutMessage.innerHTML =
          'Checkout endpoint is not connected yet. Set <code>window.MFT_FUNNEL_API_URL</code> to enable live checkout.';
      }
      return;
    }

    try {
      if (weeklyCheckoutMessage) weeklyCheckoutMessage.textContent = 'Preparing secure checkout...';
      await trackEvent('checkout_started', {
        product_key: productKey,
        product_title: productTitle,
        source: 'bundle_checkout_form',
        value: 7
      }, { server: false });
      const fallbackCheckoutUrl =
        formLiveCheckoutUrl || (productKey === DEFAULT_BUNDLE_PRODUCT_KEY ? LIVE_BUNDLE_CHECKOUT_URL : '');
      if (fallbackCheckoutUrl && !STRIPE_CHECKOUT_API_URL) {
        window.location.href = fallbackCheckoutUrl;
        return;
      }
      const result = await callFunnelApi('/api/funnel/create-checkout', {
        siteKey: SITE_KEY,
        productKey,
        name,
        email
      });
      if (result?.checkoutUrl && !STRIPE_CHECKOUT_API_URL) {
        window.location.href = result.checkoutUrl;
      } else if (weeklyCheckoutMessage) {
        weeklyCheckoutMessage.textContent = 'Checkout could not start. Please try again.';
      }

      if (STRIPE_CHECKOUT_API_URL) {
        const response = await fetch(STRIPE_CHECKOUT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer_email: email,
            site_key: SITE_KEY,
            product_key: productKey,
            product_title: productTitle,
            client_brand: document.title || 'Made For This',
            client_id: SITE_KEY,
            price_id: formPriceId || undefined,
            delivery_bridge_url: buildFunnelUrl('/api/funnel/purchase-complete'),
            success_url:
              weeklyCheckoutForm.getAttribute('data-success-url') ||
              `${window.location.origin}/thank-you-weekly-reset.html`,
            cancel_url: window.location.href
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.url) {
          throw new Error(data?.message || data?.error || 'Stripe checkout failed.');
        }
        window.location.href = data.url;
      }
    } catch (error) {
      if (weeklyCheckoutMessage) weeklyCheckoutMessage.textContent = error.message || 'Checkout failed.';
    }
  });
}

const weeklyPurchaseForm = document.getElementById('weekly-reset-purchase-complete-form');
const weeklyPurchaseMessage = document.getElementById('weekly-reset-purchase-message');
if (weeklyPurchaseForm) {
  weeklyPurchaseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = weeklyPurchaseForm.querySelector('input[name="name"]')?.value.trim() || '';
    const email = weeklyPurchaseForm.querySelector('input[name="email"]')?.value.trim().toLowerCase() || '';
    const orderId = weeklyPurchaseForm.querySelector('input[name="orderId"]')?.value.trim() || '';
    if (!email || !email.includes('@')) {
      if (weeklyPurchaseMessage) weeklyPurchaseMessage.textContent = 'Enter a valid email for delivery.';
      return;
    }

    if (!FUNNEL_API_BASE) {
      if (weeklyPurchaseMessage) {
        weeklyPurchaseMessage.innerHTML =
          'Purchase webhook endpoint is not connected yet. Set <code>window.MFT_FUNNEL_API_URL</code> to enable auto-delivery.';
      }
      return;
    }

    try {
      if (weeklyPurchaseMessage) weeklyPurchaseMessage.textContent = 'Sending your bundle delivery email...';
      const result = await callFunnelApi('/api/funnel/purchase-complete', {
        siteKey: SITE_KEY,
        productKey: weeklyPurchaseForm.getAttribute('data-product-key') || DEFAULT_BUNDLE_PRODUCT_KEY,
        name,
        email,
        orderId: orderId || `manual-${Date.now()}`
      });
      if (weeklyPurchaseMessage) {
        weeklyPurchaseMessage.innerHTML = `Purchase recorded. <a class="text-link" href="${result.downloadUrl}" target="_blank" rel="noopener noreferrer">Download your Weekly Reset Bundle</a>.`;
      }
      await trackEvent('purchase_completed', {
        product_key: weeklyPurchaseForm.getAttribute('data-product-key') || DEFAULT_BUNDLE_PRODUCT_KEY,
        product_title: 'Weekly Reset Bundle',
        source: 'manual_purchase_complete',
        value: 7
      }, { server: false });
    } catch (error) {
      if (weeklyPurchaseMessage) weeklyPurchaseMessage.textContent = error.message || 'Delivery failed.';
    }
  });
}

// Bundle lead-capture placeholder interaction
const bundleLeadForms = document.querySelectorAll('.bundle-lead-form');
if (bundleLeadForms.length > 0) {
  bundleLeadForms.forEach((form) => {
    const message = form.querySelector('.bundle-form-message');
    const directLink = form
      .closest('.bundle-download-section')
      ?.querySelector('.bundle-direct-link');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      markLeadSignupStarted(form, {
        product_key: form.getAttribute('data-product-key') || FREE_LIBRARY_PRODUCT_KEY
      });
      const sessionLead = readSessionLead();
      if (sessionLead?.email) {
        const downloadUrl = form.getAttribute('data-download-url');
        if (directLink && downloadUrl) {
          directLink.href = downloadUrl;
          directLink.hidden = false;
        }
        if (message) message.textContent = `Download already unlocked for ${sessionLead.email}.`;
        return;
      }
      const name = form.querySelector('input[name="name"]')?.value.trim() || '';
      const email = form.querySelector('input[name="email"]')?.value.trim() || '';

      if (!name || !email || !email.includes('@')) {
        if (message) message.textContent = 'Please enter a valid name and email.';
        return;
      }

      try {
        await callFunnelApi('/api/funnel/signup', {
          siteKey: SITE_KEY,
          productKey: form.getAttribute('data-product-key') || FREE_LIBRARY_PRODUCT_KEY,
          name,
          email,
          source: form.getAttribute('data-lead-source') || window.location.pathname
        });
        try {
          const existing = JSON.parse(localStorage.getItem(BUNDLE_LEADS_KEY) || '[]');
          existing.push({
            name,
            email,
            bundle: window.location.pathname,
            capturedAt: new Date().toISOString()
          });
          localStorage.setItem(BUNDLE_LEADS_KEY, JSON.stringify(existing));
          saveSessionLead({
            name,
            email,
            source: window.location.pathname,
            capturedAt: new Date().toISOString()
          });
        } catch {
          // Ignore storage failures after the funnel signup succeeds.
        }
      } catch (error) {
        if (message) {
          message.textContent = error?.message || 'Signup could not be completed. Please try again.';
        }
        return;
      }

      const downloadUrl = form.getAttribute('data-download-url');
      if (directLink && downloadUrl) {
        directLink.href = downloadUrl;
        directLink.hidden = false;
      }
      const successUrl = form.getAttribute('data-success-url') || '';
      if (successUrl) {
        window.location.href = successUrl;
        return;
      }
      if (message) message.textContent = 'Thanks. Your direct download link is now available below.';
      await trackEvent('lead_signup_completed', {
        form_name: form.getAttribute('data-lead-source') || 'bundle_form',
        source: form.getAttribute('data-lead-source') || window.location.pathname,
        product_key: form.getAttribute('data-product-key') || FREE_LIBRARY_PRODUCT_KEY,
        product_title: 'Starter Printable Library',
        value: 1
      }, { server: false });
      if (downloadUrl) {
        await trackEvent('free_bundle_downloaded', {
          link_url: downloadUrl,
          link_text: 'Direct bundle link',
          source: 'bundle_unlock'
        });
      }
      form.reset();
    });
  });
}

// Subtle reveal animation
const revealNodes = document.querySelectorAll('.reveal');
if (revealNodes.length > 0 && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries, revealObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('visible'));
}

const floatingUpsell = document.querySelector('.floating-upsell');
const siteFooter = document.querySelector('.site-footer');

if (floatingUpsell) {
  floatingUpsell.remove();
}

if (floatingUpsell && siteFooter && 'IntersectionObserver' in window) {
  const footerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          floatingUpsell.classList.add('show');
        } else {
          floatingUpsell.classList.remove('show');
        }
      });
    },
    { threshold: 0.2 }
  );

  footerObserver.observe(siteFooter);
}
