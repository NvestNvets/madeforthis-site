# Tier-4 DigiBlog Funnel Implementation

## What changed

The Made For This funnel is no longer hard-coded as a one-off.

It now supports:

- per-client site config
- branded support emails from `support@digioffice.shop`
- client owner notifications for new leads and new purchases
- recurring Codee support emails every 3 days
- separate storage paths for free-library assets and paid bundle assets
- future tier-4 clients by adding config instead of rewriting backend logic

## Current Made For This setup

Site key: `madeforthis`

Configured owner email: `christinac90@yahoo.com`

Configured products:

- `free-library`
- `weekly-reset-bundle`

## Email flow

Buyer flow:

1. Visitor signs up for the free library
2. Immediate branded email sends the free library link
3. Follow-up email 2 goes out after 1 day
4. Follow-up email 3 goes out after 3 days
5. Buyer clicks into the paid bundle
6. Stripe or webhook calls `purchase-complete`
7. Branded delivery email sends the paid bundle link automatically

Client-owner flow:

1. Christina gets a lead notification when someone signs up
2. Christina gets a purchase notification when someone buys
3. Christina gets a Codee support email immediately, then every 3 days
4. Each support email includes inspiration plus 3 rotating blog/post ideas
5. A one-off "check out your changes" owner email can be triggered with `POST /api/funnel/send-owner-update`

## Stripe hookup options

Option 1: direct Stripe Checkout link

- Put the Stripe Checkout URL into `weekly-reset-bundle.checkoutUrl` in [site-config.json](/Users/NvestNvetsFoundation/Desktop/nvest-nvets-site/digiblog/digiblog-tier4-madeforthisblog/backend/site-config.json)
- Keep the success webhook pointed at `/api/funnel/purchase-complete`

Option 2: shared Codee Stripe API

- Keep the frontend hitting the shared Codee endpoint first
- On Stripe success, have the shared backend POST into this tier-4 backend
- Include `siteKey`, `productKey`, `email`, `name`, `orderId`
- Recommended shared endpoint: `POST /api/stripe/checkout/client_digital_product`

## Session-based asset gating

Free asset pages now unlock per browser session.

How it works:

1. Visitor enters name and email on any gated free asset page
2. The direct-download link unlocks on that page
3. The email is stored in `sessionStorage`
4. Other gated free asset pages unlock automatically during the same browser session
5. A new browser session asks for the email again

## Bucket structure to use

Use one top-level folder per tier-4 client:

```text
gs://clients.digioffice.shop/tier4-clients/madeforthis/
gs://clients.digioffice.shop/tier4-clients/<future-client-key>/
```

Inside each client folder keep separate asset folders:

```text
downloads/free-library/
downloads/bundles/weekly-reset-bundle/
```

That separation is important because:

- free signup delivery and paid delivery use different URLs
- product swaps do not break the lead magnet flow
- future bundle launches can be added without rewriting the free-library logic

## Adding the next tier-4 client

1. Copy the site folder or point their frontend at this same backend.
2. Add a new entry under `sites` in [site-config.json](/Users/NvestNvetsFoundation/Desktop/nvest-nvets-site/digiblog/digiblog-tier4-madeforthisblog/backend/site-config.json).
3. Set:
   - `brandName`
   - `siteUrl`
   - `supportEmail`
   - `supportReplyTo`
   - `ownerEmail`
   - `logoUrl`
   - `bucketBasePath`
   - `ownerSupport.topics`
   - `products.free-library`
   - `products.<paid-product>`
4. Set `window.MFT_SITE_KEY` on that client site.
5. Add `data-product-key` on that site's free and paid forms.
6. Upload the PDFs or ZIPs into that client's bucket folder.

## What still needs live credentials

These changes are in code, but live production still needs:

- verified sender domain for `support@digioffice.shop`
- Brevo or SendGrid API key
- real Stripe checkout URL or webhook bridge
- Cloud Scheduler job for `POST /api/funnel/process-queue`
- bucket uploads for the final PDFs and bundles
