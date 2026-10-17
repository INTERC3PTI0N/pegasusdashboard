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

## Admin console

- **Staff roles** ([lib/permissions.ts](lib/permissions.ts)) — *Owner* (everything), *Editor*
  (website, media, courses, enquiries), *Support* (customers, keys, certificates, enquiries).
  Every admin page and action checks its permission; the sidebar shows only what the role allows.
  Owners manage staff at `/admin/staff` (temporary password on invite, role changes, suspend,
  remove; there is always at least one owner).
- **Overview** — KPIs, daily new customers / key redemptions / certificates (7, 30 or 90 days),
  a per-course funnel (owners → started → finished → certified) and recent admin activity.
- **Customers** — search, filter, sort, CSV export. Each customer: edit profile, grant/remove
  courses, tick/untick individual lessons, mark a course complete or reset it, issue / revoke /
  reissue certificates, keys they used, internal notes, reset password (temporary, must be
  changed at next sign-in), sign out of all devices, suspend, delete.
- **Courses** — courses live in the `courses` table (seeded from [lib/catalog.ts](lib/catalog.ts)).
  Create, reorder and edit courses, lessons, videos (media library uploads, streamed only to
  owners) and written guides; delete courses nobody owns.
- **Product keys** — batch labels, filters, void / restore unused keys, CSV export for printing.
- **Certificates** — registry with filters and CSV; revoked certificates show as invalid, with the
  reason, on the public verification page, and customers can't re-claim them themselves.
- **Accounts** — customers edit their profile at `/account`; everyone can change their password at
  `/change-password` (which signs out their other devices).
- **Audit log** — every admin action, who and when.

## Website CMS

The admin edits the public Pegasus website (separate repo, `Projects/Pegasus`):

- **Site content** (`/admin/site`) — 17 blocks: SEO, header/menu, footer, every home-page
  section (hero video, heritage, collections, technology, philosophy, sustainability,
  journal articles, who we serve, brochure, contact + office locations) and the three
  collection pages. Forms are generated from [lib/site/schema.ts](lib/site/schema.ts);
  saved data is sanitised against it (unknown fields dropped, unsafe links such as
  `javascript:` removed). The original site copy is in [lib/site/defaults.json](lib/site/defaults.json).
- **Drafts, preview, publish** — edits are drafts until published. *Preview draft* opens the
  website in preview mode with a one-hour signed link. Publishing tells the website to
  refresh immediately (`/api/revalidate`); it also refreshes on its own within 5 minutes.
- **History** — every publish is versioned; any version, or the original copy, can be loaded
  back into the draft.
- **Media library** (`/admin/media`) — images and MP4/WebM up to 4 MB, stored in Postgres and
  served at `/api/site/media/<id>`; the website shows them via its `/cms-media/<id>` rewrite.
- **Enquiries** (`/admin/enquiries`) — the website's brochure and dealer/business forms
  post here (server-to-server with `SITE_SECRET`). Status, internal notes, search, CSV export.
- **Audit log** (`/admin/audit`) — every admin change with who and when.

Connecting the two: set `SITE_URL` + `SITE_SECRET` here, and `CMS_URL` (this app's URL) +
the same `SITE_SECRET` on the website. If this app is unreachable the website keeps working
from its built-in copy.

## Data

Postgres tables, defined in [db/schema.sql](db/schema.sql): `users` (scrypt-hashed passwords,
role, entitlements), `product_keys` (one-time keys; redeeming locks the row and spends the
key and unlocks the product in one transaction), `progress`, `certificates`, and for the
website `site_content`, `site_content_versions`, `media`, `leads` and `audit_log`.
Re-run `node --env-file=.env.local scripts/setup-db.mjs` (no arguments) after pulling
schema changes; it is idempotent. With an email and password it creates or resets an *Owner*.

Connection notes ([lib/db.ts](lib/db.ts)): the app uses Supabase's transaction pooler, so
prepared statements and query pipelining are off, idle connections are retired after 20 s, and
connections are recycled every 5 minutes — this avoids requests hanging on a dropped connection.
Host the app in the same region as the database (e.g. Vercel `syd1` for `ap-southeast-2`). Row Level
Security is on with no policies, so Supabase's public REST API can't read them; the app
connects directly with the database password. The course catalog stays in code
([lib/catalog.ts](lib/catalog.ts)). CRM fields in the admin console (status, tags, lifetime
value) still come from demo data in [lib/crm.ts](lib/crm.ts), so they are blank for real
accounts.
