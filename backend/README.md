# Made For This Funnel Backend

This service now supports the current Made For This tier-4 DigiBlog flow plus future tier-4 clients through config.

Current flow:

1. Lead signs up for the free printable library
2. Branded delivery email is sent from `support@digioffice.shop`
3. Follow-up emails are queued
4. Client owner gets lead and purchase notifications
5. Customer checks out the paid bundle
6. Post-purchase email sends the download automatically
7. Client owner gets a Codee inspiration + post-ideas email immediately, then every 3 days

## Run locally

```bash
cd backend
node server.js
```

Default port: `8081`

## Frontend hookup

Set this in your site before `script.js` loads:

```html
<script>
  window.MFT_FUNNEL_API_URL = 'https://YOUR-BACKEND-DOMAIN';
  window.MFT_SITE_KEY = 'madeforthis';
</script>
```

## API endpoints

- `GET /health`
- `GET /api/funnel/config`
- `POST /api/funnel/signup`
- `POST /api/funnel/create-checkout`
- `POST /api/funnel/purchase-complete`
- `POST /api/funnel/process-queue`
- `POST /api/funnel/send-owner-update`

## Environment variables

- `PORT` (default `8081`)
- `EMAIL_PROVIDER` = `mock` | `sendgrid` | `brevo`
- `EMAIL_FROM` (recommended: `support@digioffice.shop`)
- `SENDGRID_API_KEY` (if sendgrid)
- `BREVO_API_KEY` (if brevo)
- `WEBHOOK_SECRET` (optional webhook protection)

## Site config

Per-client settings live in [site-config.json](/Users/NvestNvetsFoundation/Desktop/nvest-nvets-site/digiblog/digiblog-tier4-madeforthisblog/backend/site-config.json).

Each site can define:

- brand name and logo
- sender email and reply-to
- owner email for support notifications
- owner support cadence and post-idea topics
- per-product download URL, checkout URL, and bucket folder

## Stripe implementation

Recommended production wiring:

1. Set the paid product `checkoutUrl` in `site-config.json` to the real Stripe Checkout URL or to your shared Codee Stripe session endpoint.
2. Preferred: use the shared Codee Stripe endpoint `POST /api/stripe/checkout/client_digital_product`.
3. Let the shared Stripe webhook fan out into `POST /api/funnel/purchase-complete`.
4. Send `siteKey`, `productKey`, `email`, `name`, and `orderId`.
5. Set `WEBHOOK_SECRET` and send the same value in `X-Webhook-Secret`.

Example payload:

```json
{
  "siteKey": "madeforthis",
  "productKey": "weekly-reset-bundle",
  "email": "customer@example.com",
  "name": "Customer Name",
  "orderId": "cs_test_123"
}
```

## Bucket layout

The site config includes a `bucketBasePath` plus per-product `bucketFolder`.

Recommended object layout:

```text
gs://clients.digioffice.shop/tier4-clients/madeforthis/
  downloads/free-library/
    made-for-this-starter-printable-library.pdf
    made-for-this-starter-printable-library.zip
    weekly-reset-planner.pdf
    daily-focus-sheet.pdf
    quiet-time-activity-sheet.pdf
    orthodontic-assistant-quick-reference.pdf
    30-day-habit-tracker.pdf
  downloads/bundles/weekly-reset-bundle/
    weekly-reset-bundle.pdf
    weekly-reset-bundle.zip
    01-cover-page.pdf
    02-weekly-reset-planner.pdf
    03-daily-focus-sheet.pdf
    04-habit-tracker.pdf
    05-monthly-reset-planner.pdf
    06-cleaning-reset-checklist.pdf
    07-meal-planner-page.pdf
    08-brain-dump-page.pdf
    09-simple-budget-overview.pdf
    10-sunday-reset-routine.pdf
```

Keep each future tier-4 client under its own prefix:

```text
gs://clients.digioffice.shop/tier4-clients/<client-site-key>/...
```

## Notes

- In `mock` mode, emails are treated as successful without provider calls.
- Queue data is stored per client in `backend/data/sites/<siteKey>/`.
- Due follow-up emails are processed on incoming API requests and via `POST /api/funnel/process-queue`.
- For production, hit `POST /api/funnel/process-queue` from Cloud Scheduler every few hours so the 1-day and 3-day emails go out even when site traffic is quiet.
