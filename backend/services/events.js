const crypto = require('crypto');

const EVENT_NAMES = new Set([
  'page_view',
  'lead_signup_started',
  'lead_signup_completed',
  'free_bundle_downloaded',
  'product_preview_opened',
  'checkout_started',
  'purchase_completed',
  'email_cta_clicked'
]);

const sanitizeString = (value, max = 240) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max);
};

const sanitizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeEventPayload = (payload = {}) => {
  const eventName = sanitizeString(payload.eventName || payload.name || '').toLowerCase();
  if (!EVENT_NAMES.has(eventName)) return null;

  const params = {};
  const addString = (key, max = 120) => {
    const value = sanitizeString(payload[key], max);
    if (value) params[key] = value;
  };
  const addNumber = (key) => {
    const value = sanitizeNumber(payload[key]);
    if (value !== undefined) params[key] = value;
  };

  addString('page_location', 500);
  addString('page_path', 280);
  addString('page_title', 180);
  addString('product_key', 120);
  addString('product_title', 180);
  addString('source', 180);
  addString('referrer', 500);
  addString('link_url', 500);
  addString('link_text', 180);
  addString('form_name', 120);
  addString('traffic_source', 120);
  addString('page_type', 80);
  addString('content_group', 120);
  addNumber('value');

  const clientId = sanitizeString(payload.clientId || payload.client_id || '', 120);
  const sessionId = sanitizeString(payload.sessionId || payload.session_id || '', 120);

  return {
    id: crypto.randomUUID(),
    eventName,
    clientId,
    sessionId,
    params,
    createdAt: new Date().toISOString(),
  };
};

const toMeasurementProtocolPayload = ({ measurementId, apiSecret, siteKey, record }) => {
  if (!measurementId || !apiSecret || !record?.eventName || !record?.clientId) return null;
  return {
    url: `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    body: {
      client_id: record.clientId,
      timestamp_micros: `${Date.now()}000`,
      events: [
        {
          name: record.eventName,
          params: {
            site_key: siteKey,
            session_id: record.sessionId || undefined,
            engagement_time_msec: 1,
            ...record.params,
          },
        },
      ],
    },
  };
};

module.exports = {
  EVENT_NAMES,
  normalizeEventPayload,
  toMeasurementProtocolPayload,
};
