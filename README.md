# Pegasus Academy — Customer Portal

A Next.js (App Router) + shadcn-style dashboard for Pegasus Hair Tools customers.
Purchasers of a product get exclusive access to that product's video tutorials and
written guides, track their progress lesson-by-lesson, and earn a QR-verifiable
certificate on completion. Styling follows the Pegasus brand site (Jost + Cormorant
Garamond, ink/paper palette, `#00adbb` accent).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Demo accounts (password: `pegasus`)

| Account | Email | Role |
|---|---|---|
| Sofia Laurent | sofia@atelier-laurent.com | Customer — Hard Rubber + Cellulose |
| Marco Rossi | marco@studio-rossi.it | Customer — Ecowood only |
| Ava Chen | ava@chenhairlab.com | Customer — all three lines |
| Elena Weiss | admin@pegasus.com | Admin — customer tracking + CRM console |

## Features

- **Entitlement-gated content** — every product page and lesson calls
  `requireProductAccess()` server-side ([lib/access.ts](lib/access.ts)); non-purchasers
  are redirected before any content renders. Locked products appear greyed-out in the
  sidebar. Mutations (progress, certificates) re-check entitlements too.
- **Dashboard** — stat cards (products, lessons, overall %, certificates),
  "continue learning" resume card, product library with per-course progress.
- **Courses** — video lessons (HTML5 player) and written guides, curriculum list,
  per-lesson completion with optimistic UI, prev/next navigation, course outline sidebar.
- **Certificates** — claimable at 100% completion; unique ID (`PGS-XXXX-XXXX`),
  print/save-PDF layout, and a QR code linking to a **public verification page**
  (`/verify/[id]`) that confirms who the certificate is assigned to.
- **Auth** — HMAC-signed session cookie ([lib/auth.ts](lib/auth.ts)) + middleware redirects.
  `/logout` clears the session. Role gates: admins are kept out of the customer portal
  and customers out of `/admin` (server-side, [lib/access.ts](lib/access.ts)).
- **Admin console** (`/admin`) — academy overview (customers, enrolments, average
  progress, certificates issued) with a live per-customer progress table; customer CRM
  list (status, tags, country, lifetime value, last contact); customer 360 pages with
  per-course progress, issued certificates, relationship panel and session-only notes
  ([lib/crm.ts](lib/crm.ts) seeds the demo records — frontend only by design); and a
  certificate registry linking every ID to its public verification page.

## Demo data layer

This is a frontend-focused demo: users/entitlements live in [lib/users.ts](lib/users.ts),
the course catalog in [lib/catalog.ts](lib/catalog.ts), and progress/certificates persist
to `data/store.json` via [lib/store.ts](lib/store.ts). To hook up a real backend, replace
those three modules (e.g. entitlements from your Shopify/WooCommerce orders, progress in a
database) — pages and components read only through their exported functions.
