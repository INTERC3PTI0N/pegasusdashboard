# Pegasus Academy — Customer Portal

A Next.js (App Router) + shadcn-style dashboard for Pegasus Hair Tools customers.
Purchasers of a product get exclusive access to that product's video tutorials and
written guides, track their progress lesson-by-lesson, and earn a QR-verifiable
certificate on completion. Styling follows the Pegasus brand site (Jost + Cormorant
Garamond, ink/paper palette, `#00adbb` accent).

## Setup

1. **Database** — create a free [Supabase](https://supabase.com) project (any Postgres 14+
   also works). In the project, open **Connect** and copy the **Transaction pooler**
   connection string (port 6543), with your database password filled in.
2. **Environment** — copy `.env.example` to `.env.local` and set `DATABASE_URL` and
   `SESSION_SECRET`. On a host like Vercel, set the same two variables in the project settings.
3. **Install, create the tables and the first admin** (safe to re-run; re-running resets
   that admin's password):

```bash
npm install
```

```bash
node --env-file=.env.local scripts/setup-db.mjs admin@yourcompany.com "a-strong-password" "Your Name"
```

4. **Run** — `npm run dev`, open http://localhost:3000.

## Test flow

1. Admin signs in → **Product keys** → generates (or uploads) keys for a product.
2. Customer opens `/signup`, creates an account → lands on **Register product**.
3. Customer enters a key → that product's course unlocks; the key is spent.
4. Customer completes every lesson → **Certificates** → claims the certificate.
5. Anyone scans the QR / opens `/verify/<id>` to confirm it.
6. Admin sees the customer, progress, certificate and which key they used.

Product keys are `XXXX-XXXX-XXXX` (letters and digits). Customers can type them in any
case, with or without dashes. A key works once: a used key, an unknown key, or a key for a
product the customer already owns is refused (the last without spending the key).

## Features

- **Entitlement-gated content** — every product page and lesson calls
  `requireProductAccess()` server-side ([lib/access.ts](lib/access.ts)); non-purchasers
  are redirected before any content renders. Locked products appear greyed-out in the
  sidebar. Mutations (progress, certificates) re-check entitlements too.
- **Content protection** — course videos live in `/media` (not `/public`) and are only
  served by [/api/media/[slug]/[lessonId]](app/api/media/[slug]/[lessonId]/route.ts) to
  signed-in owners, in 1 MB ranges, for in-page playback only. The player has no download,
  picture-in-picture or casting, and a drifting watermark with the viewer's email (kept in
  fullscreen). The portal blocks right-click, copy, drag, Save/Print/View-source shortcuts,
  and course pages print blank. This deters casual saving; it is not DRM — for encrypted
  playback move videos to a DRM host (Mux, Bunny Stream, VdoCipher).
- **Dashboard** — stat cards (products, lessons, overall %, certificates),
  "continue learning" resume card, product library with per-course progress.
- **Courses** — video lessons (HTML5 player) and written guides, curriculum list,
  per-lesson completion with optimistic UI, prev/next navigation, course outline sidebar.
- **Product keys** — admins bulk upload or generate one-time keys per product
  (`/admin/keys`); customers redeem them at `/register-product` to unlock a course.
- **Certificates** — claimable at 100% completion; unique ID (`PGS-XXXX-XXXX`), the
  Certificato di Mastery design with the holder's name, print/save-PDF layout, and a QR code linking to a **public verification page**
  (`/verify/[id]`) that confirms who the certificate is assigned to.
- **Auth** — sign-up / sign-in with scrypt-hashed passwords, HMAC-signed session cookie ([lib/auth.ts](lib/auth.ts)) + middleware redirects.
  `/logout` clears the session. Role gates: admins are kept out of the customer portal
  and customers out of `/admin` (server-side, [lib/access.ts](lib/access.ts)).
- **Admin console** (`/admin`) — academy overview (customers, enrolments, average
  progress, certificates issued) with a live per-customer progress table; customer CRM
  list (status, tags, country, lifetime value, last contact); customer 360 pages with
  per-course progress, issued certificates, relationship panel and session-only notes
  ([lib/crm.ts](lib/crm.ts) seeds the demo records — frontend only by design); and a
  certificate registry linking every ID to its public verification page.

## Data

Postgres tables, defined in [db/schema.sql](db/schema.sql): `users` (scrypt-hashed passwords,
role, entitlements), `product_keys` (one-time keys; redeeming locks the row and spends the
key and unlocks the product in one transaction), `progress` and `certificates`. Row Level
Security is on with no policies, so Supabase's public REST API can't read them; the app
connects directly with the database password. The course catalog stays in code
([lib/catalog.ts](lib/catalog.ts)). CRM fields in the admin console (status, tags, lifetime
value) still come from demo data in [lib/crm.ts](lib/crm.ts), so they are blank for real
accounts.
