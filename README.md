# THE NINTH DROP — Admin

A separate Next.js project (not nested inside `clothing/`) implementing the operations dashboard for THE NINTH DROP storefront. Talks to the same backend (`../clothing/backend`) and the same MongoDB database as the customer frontend — nothing here is a second source of truth.

```
clothing-landing/
  clothing/          ← customer frontend (untouched)
    backend/         ← Express + MongoDB API (shared by both apps)
  admin/             ← this project
```

## Why a separate project

The brief asked for the admin to feel like part of the same brand while having "its own professional application layout suitable for managing a complete e-commerce business." Keeping it a separate Next.js app (rather than a route group inside the storefront) means:

- The customer frontend's bundle, routing, and `proxy.js` auth gate stay completely untouched.
- The admin can ship its own layout system (sidebar, dense tables, drawers) without fighting the storefront's editorial page structure.
- The two apps can be deployed, scaled, and access-controlled independently — the admin never needs to be publicly reachable at all.

## Design system — sourced from the frontend, not reinvented

Read directly from `clothing/src/app/globals.css` and `clothing/src/app/layout.js` before writing any admin CSS:

| Token | Value | Used here for |
|---|---|---|
| `--stitch` (#6d1930) | the one accent | primary buttons, active nav item, links, focus rings |
| `--ink` / `--paper` | #2a1116 / #faf5ec | text / base surfaces |
| `--line-paper` (#e7dac6) | hairline | every card border, table row divider |
| Playfair Display | serif | page titles, KPI numbers — same face as the storefront's headlines |
| Inter | body | table/form text — same face as the storefront's body copy |
| IBM Plex Mono | utility | status badges, ids, timestamps, filter chips — the storefront already uses this face for "spec sheet" data (SKUs, tags); reused here for the same reason: this is a data-dense tool, not editorial copy |
| `rounded-full` buttons/badges, `rounded-xl`/`rounded-2xl` cards | — | identical radius language to the storefront's `Button`/`Card`-equivalent patterns |

What's new and admin-only (documented in `src/app/globals.css`): a cooler `--surface`/`--surface-sunken` neutral pair (a UI read all day shouldn't use the storefront's warm editorial paper), a dark sidebar (`--sidebar-*` tokens, using the same ink as the storefront's announcement bar), and semantic `success/warning/danger/info` tokens for status badges — none of which exist in the storefront because it never needed them.

## Installation

```bash
cd admin
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm run dev                   # http://localhost:3002
```

**Before this works**, the backend must have your admin origin in its `CLIENT_ORIGIN` allowlist (`backend/.env` → `CLIENT_ORIGIN=http://localhost:3000,http://localhost:3002`) and a staff user must exist — `npm run seed` in `backend/` creates `admin@thenine.example.com` / `ChangeMe123!` with role `admin`. Change that password immediately outside local development.

Verified: `npm install` succeeds and `npx next build` compiles and prerenders all 23 routes cleanly (no MongoDB connection needed for this, since every page fetches client-side). Not verified in this environment: a live end-to-end run against a real MongoDB instance, since none was available here — see the root project's audit notes for the same caveat on the backend.

## Authentication

Calls `POST /auth/admin/login` (not the customer `/auth/login`) — the backend rejects any account whose role isn't a staff role there, so a customer account cannot obtain an admin session even with valid credentials. Session is the same httpOnly JWT cookie mechanism as the customer frontend; `AuthContext` here additionally checks the returned `role` client-side before rendering the shell (defense in depth — the real gate is server-side).

## Feature → backend endpoint map

| Admin screen | Endpoint(s) |
|---|---|
| Dashboard | `GET /admin/dashboard`, `GET /analytics/sales`, `GET /orders/admin/all` |
| Orders / detail / status / notes / refund | `GET /orders/admin/all`, `GET /orders/admin/:orderNumber`, `PATCH .../status`, `POST .../notes`, `POST .../refund` |
| Payments | `GET /orders/admin/all` (payment-focused columns) + `GET /payments/admin/:orderNumber/attempts` (raw Cashfree attempt history) |
| Shipments | `GET /orders/admin/all?shippingOnly=true` |
| Returns & Refunds | `GET /orders/admin/all?returnsOnly=true` |
| Products / new / edit / media | `GET /products/admin`, `GET /products/admin/:id`, `POST /products`, `PATCH /products/:id`, `POST/DELETE /products/:id/media` |
| Categories | `GET/POST/PATCH/DELETE /categories` |
| Inventory | `GET /admin/inventory`, `GET /admin/inventory/:productId/history` |
| Customers / detail | `GET /users?role=customer`, `GET /users/:id` |
| Coupons / orders drill-down | `GET/POST/PATCH/DELETE /coupons`, `GET /coupons/:id/orders` |
| Homepage Content | `GET /content/admin`, `POST/PATCH/DELETE /content`, `POST /content/:id/media` |
| Media Library | `GET /uploads/library`, `POST /uploads/batch`, `DELETE /uploads` |
| Sales / Product / Customer Analytics | `GET /analytics/sales|products|customers` |
| Finance | `GET /admin/finance` |
| Notifications | `GET /admin/notifications` |
| Activity Logs | `GET /admin/activity-logs` |
| Settings & Team | `GET /users?role=staff`, `PATCH /users/:id` |

Full request/response shapes: `clothing/backend/docs/ADMIN_API.md`.

## Roles

`src/lib/constants.js#STAFF_ROLES` mirrors `backend/src/config/roles.js` exactly. Every write action in this app hits an endpoint the backend has already role-gated (Order Manager can update order status but not process refunds; Product Manager can manage the catalog but not customers; etc.) — the frontend doesn't re-implement permission logic, it just reflects what the backend allows and lets a `403` surface as a toast if a screen assumes access it doesn't have. Only `super_admin`/`admin` can change another account's role, enforced identically on both sides.

## What's real vs. what to build next

Every number, table, and chart in this app is a live query against the shared MongoDB database via the backend — there is no mock data anywhere (see `backend/src/services/analytics.service.js` for the aggregation pipelines behind the Dashboard/Finance/Analytics screens). What's deliberately out of scope for this pass, per the backend's own design notes (`backend/docs/ADMIN_API.md`):

- No drag-to-reorder media (a "make featured" / delete model is used instead — see `MediaManager.js`).
- No automated Cashfree refund API call — refunds recorded here are a ledger entry for a refund already actioned on the Cashfree dashboard, by design (see the refund modal's own inline warning).
- No granular per-permission UI (e.g., hiding individual buttons per exact permission) — role gating is enforced by the backend on every request; the frontend doesn't duplicate that logic, it just handles the resulting `403`.
