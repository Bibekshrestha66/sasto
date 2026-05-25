# Sasto Marketplace Project Documentation and Cleanup Plan

## 1. Project Summary

Sasto Marketplace is a full-stack marketplace application for listings, auctions, rentals, carts, checkout-like flows, seller/buyer dashboards, admin tooling, ads, reviews, messaging, verification, and role-based access control.

The project currently runs as one Node.js application:

- React + Vite frontend served from `frontend/`
- Express backend served from `backend/_core/index.ts`
- tRPC API exposed at `/api/trpc`
- SQLite database for local development through Drizzle ORM
- WebSocket server attached to the same HTTP server
- Static production frontend built into `dist/public`

The project works locally with `pnpm`, not npm or yarn:

```bash
pnpm install
pnpm exec drizzle-kit push
pnpm dev
```

Local URL:

```text
http://localhost:3000/
```

## 2. Technology Stack

### Frontend

- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4
- shadcn/Radix-style UI components in `frontend/src/components/ui`
- Wouter for client-side routing
- TanStack React Query
- tRPC React client
- Socket.IO client for realtime features
- Lucide React icons

### Backend

- Node.js
- Express
- TypeScript via `tsx`
- tRPC server
- Drizzle ORM
- better-sqlite3 for local SQLite
- Socket.IO for realtime features
- bcryptjs for password hashing
- jose for session JWTs
- multer for upload handling

### Database

- SQLite locally, stored in `sqlite.db`
- Drizzle schema in `drizzle/schema.ts`
- Drizzle config in `drizzle.config.ts`
- Historical migration files in `drizzle/*.sql`

### Tooling

- Package manager: `pnpm`
- Type checking: `pnpm run check`
- Build: `pnpm run build`
- Tests: `pnpm test`
- Formatting: `pnpm format`

## 3. Runtime Architecture

### Development Runtime

When `pnpm dev` runs, it starts:

```text
tsx watch backend/_core/index.ts
```

The backend Express server starts first. In development mode it calls `setupVite(app, server)`, which mounts Vite middleware into the Express app. That means the frontend and backend are served from the same origin:

```text
http://localhost:3000
```

This avoids a separate Vite port in normal local development.

### Production Runtime

The build script does two things:

```bash
vite build
esbuild backend/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

Production output:

- Frontend: `dist/public`
- Backend bundle: `dist/index.js`

Production start command:

```bash
pnpm start
```

which runs:

```bash
NODE_ENV=production node dist/index.js
```

## 4. Request Flow

### Frontend Page Flow

1. Browser requests `/`.
2. Express serves Vite dev HTML in development.
3. React boots from `frontend/src/main.tsx`.
4. `frontend/src/App.tsx` sets up app providers:
   - error boundary
   - Google OAuth provider
   - theme provider
   - tooltip provider
   - toaster
   - header/footer/bottom nav
5. Wouter maps browser routes to lazy-loaded page components.

### API Flow

1. Frontend calls tRPC through `frontend/src/lib/trpc.ts`.
2. Requests go to:

```text
/api/trpc
```

3. Express forwards the request to:

```ts
createExpressMiddleware({
  router: appRouter,
  createContext,
})
```

4. `createContext` attempts to authenticate the user from the session cookie.
5. tRPC procedures run as public, protected, or admin procedures.
6. Database calls go through Drizzle in `backend/db.ts`.

### Realtime Flow

1. `backend/_core/index.ts` creates one HTTP server.
2. `initializeWebSocket(server)` attaches Socket.IO/WebSocket behavior.
3. The WebSocket manager is stored globally:

```ts
(global as any).wsManager = wsManager;
```

4. Backend procedures can access it through `getWebSocketManager()`.

## 5. Current Folder Structure

```text
.
├── frontend/
│   ├── public/
│   └── src/
│       ├── _core/
│       ├── components/
│       ├── components/ui/
│       ├── config/
│       ├── contexts/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
├── backend/
│   ├── _core/
│   ├── email-templates/
│   ├── routers/
│   ├── seeds/
│   ├── db.ts
│   ├── routers.ts
│   ├── storage.ts
│   ├── upload.ts
│   └── websocket.ts
├── shared/
├── drizzle/
├── scripts/
├── scratch/
├── dist/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
└── drizzle.config.ts
```

## 6. Important Entry Points

### Frontend

- `frontend/src/main.tsx`: React bootstrapping
- `frontend/src/App.tsx`: routes, layout, top-level providers
- `frontend/src/lib/trpc.ts`: typed tRPC client
- `frontend/src/index.css`: global styles

### Backend

- `backend/_core/index.ts`: Express server entry point
- `backend/_core/vite.ts`: Vite middleware/static serving
- `backend/_core/context.ts`: tRPC request context and auth lookup
- `backend/_core/trpc.ts`: public/protected/admin procedure setup
- `backend/_core/authService.ts`: session token creation and verification
- `backend/db.ts`: database connection and query helper functions
- `backend/routers/index.ts`: active main tRPC router
- `backend/websocket.ts`: realtime manager
- `backend/upload.ts`: upload routes mounted at `/api/upload`

### Database

- `drizzle/schema.ts`: source of truth for tables
- `drizzle.config.ts`: local SQLite Drizzle config
- `sqlite.db`: local database file

## 7. Frontend Routing

The app uses Wouter routes in `frontend/src/App.tsx`.

Main user routes:

- `/`
- `/marketplace`
- `/listing/:id`
- `/auctions`
- `/auction/:id`
- `/rentals`
- `/rentals/:id`
- `/deals-and-offers`
- `/cart`
- `/checkout`
- `/wallet-checkout`

Account routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/profile`
- `/profile/:id`
- `/messages`
- `/verification`

Dashboard routes:

- `/seller/dashboard`
- `/buyer/dashboard`
- `/admin/dashboard`
- `/admin/ads`
- `/super-admin/dashboard`

Static/support routes:

- `/about`
- `/help`
- `/categories`
- `/terms`
- `/privacy`
- `/report`
- `/contact`
- `/safety-tips`
- `/career`
- `/partners/:partnerId`

Redirects:

- `/become-seller` -> `/verification`
- `/seller-dashboard` -> `/seller/dashboard`
- `/deal/:id` -> `/listing/:id`

## 8. API Architecture

The active frontend imports the backend router type from:

```ts
backend/routers/index.ts
```

Active router groups include:

- `system`
- `auth`
- `listings`
- `users`
- `categories`
- `auctions`
- `messages`
- `favorites`
- `bookings`
- `transactions`
- `notifications`
- `cart`
- `search`
- `sellerAnalytics`
- `verification`
- `seller`
- `admin`
- `rbac`
- `ads`
- `emails`
- `reviews`
- `rentals`
- `deals`

There is also a legacy-looking `backend/routers.ts`. It overlaps with `backend/routers/index.ts` and should be reviewed for deletion or migration. The active import path used by the server entry point is:

```ts
import { appRouter } from "../routers/index";
```

So `backend/routers.ts` is likely stale or partially duplicated.

## 9. Database Model

The schema currently includes these table groups:

### Core Marketplace

- `users`
- `categories`
- `listings`
- `auctions`
- `bids`
- `bookings`
- `favorites`
- `messages`
- `notifications`

### Reviews and Trust

- `reviews`
- `review_helpful_votes`
- `review_analytics`
- `flagged_reviews`
- `flagged_listings`
- `verification_submissions`

### Admin and RBAC

- `adminLogs`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `role_audit_logs`

### Ads and Promotions

- `advertisers`
- `manual_ads`
- `ad_analytics`
- `adsense_placements`
- `ad_payments`
- `sponsored_ad_pricing`
- `promotion_requests`

### Email

- `email_notification_preferences`
- `email_queue`
- `email_logs`

### Commerce

- `transactions`
- `carts`
- `cart_items`
- `payment_gateways`
- `returns`
- `logistics_partners`

### Company and Content

- `company_configs`
- `reports`
- `careers`
- `disputes`

## 10. Authentication and Authorization

Authentication is cookie/session based.

Main pieces:

- `backend/_core/authService.ts`
- `backend/_core/context.ts`
- `backend/_core/trpc.ts`
- `shared/const.ts`

Flow:

1. Login/register creates a signed JWT session token.
2. Server stores it in a cookie.
3. Each tRPC request tries to read and verify that cookie.
4. `publicProcedure` allows guest access.
5. `protectedProcedure` requires a user.
6. `adminProcedure` requires `admin` or `super_admin`.

Current concern:

- Auth logic exists in several places.
- Google auth, local password auth, role auth, and dev force-login are spread across different modules.
- `backend/routers.ts` contains older auth behavior using plain password comparison, while `backend/routers/index.ts` uses bcrypt. That duplicate file is risky because someone could import the wrong router later.

## 11. Current Problems

### Structural Problems

1. Too many root-level scripts and temporary files:
   - `check-user.ts`
   - `check_cats.ts`
   - `check_db.ts`
   - `check_login.ts`
   - `fix_admin.cjs`
   - `fix_db_awaits.js`
   - `temp_findstr*.txt`
   - `tsc_output.txt`
   - `test_flow.ts`

2. `scratch/` contains migration, verification, seed, and test utilities that are not clearly separated.

3. `backend/routers.ts` duplicates large parts of `backend/routers/index.ts`.

4. Some feature routers exist but are not clearly organized by domain.

5. Frontend pages contain both old and new variants:
   - `Marketplace.tsx` and `MarketplaceResponsive.tsx`
   - `Auctions.tsx` and `AuctionResponsive.tsx`
   - `Rentals.tsx` and `RentalResponsive.tsx`
   - `Login.tsx` and `LoginPage.tsx`

6. `dist/`, `sqlite.db`, and local generated artifacts exist in the working tree.

7. Tests are colocated inconsistently across `frontend/src`, `backend`, and root scripts.

8. There are many docs, but they are fragmented and not a clear source of truth.

### Technical Problems

1. npm install fails because the project is a pnpm project and npm enforces a Vite peer dependency conflict.

2. Drizzle migrations appear stale compared with the current `drizzle/schema.ts`; `drizzle-kit migrate` created a database missing newer columns. `drizzle-kit push` was needed locally.

3. Server startup previously checked whether a port was free before listening, but still crashed if the port became busy before `server.listen`. This has been improved to retry on actual `EADDRINUSE`.

4. Some optional env vars are not documented in one place.

5. Several modules use direct imports from large utility files, especially `backend/db.ts`, instead of domain-specific services/repositories.

6. `backend/db.ts` is too large and mixes many domains in one file.

7. Global WebSocket access through `(global as any).wsManager` is convenient but weakly typed and hard to reason about.

8. Some code uses broad `any`, mixed naming conventions, and inconsistent error handling.

## 12. Recommended Clean Architecture

This project should move toward a domain-based structure.

Recommended target:

```text
.
├── apps/
│   └── web/
│       ├── frontend/
│       └── backend/
├── packages/
│   ├── db/
│   ├── shared/
│   └── config/
├── docs/
├── scripts/
│   ├── db/
│   ├── maintenance/
│   └── seeds/
└── tests/
```

However, moving to a monorepo immediately may be too disruptive. A safer intermediate structure is:

```text
.
├── frontend/
│   └── src/
│       ├── app/
│       ├── features/
│       ├── shared/
│       ├── components/ui/
│       └── pages/
├── backend/
│   ├── app/
│   ├── features/
│   ├── shared/
│   └── integrations/
├── db/
│   ├── schema.ts
│   ├── relations.ts
│   ├── migrations/
│   └── seeds/
├── scripts/
│   ├── db/
│   ├── maintenance/
│   └── one-off/
├── docs/
└── shared/
```

## 13. Proposed Frontend Structure

Recommended:

```text
frontend/src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── layout.tsx
├── features/
│   ├── auth/
│   ├── marketplace/
│   ├── auctions/
│   ├── rentals/
│   ├── cart/
│   ├── checkout/
│   ├── messages/
│   ├── reviews/
│   ├── verification/
│   ├── seller/
│   ├── buyer/
│   ├── admin/
│   └── ads/
├── components/
│   ├── layout/
│   ├── common/
│   └── ui/
├── hooks/
├── lib/
├── styles/
└── main.tsx
```

Example feature folder:

```text
frontend/src/features/marketplace/
├── pages/
│   ├── MarketplacePage.tsx
│   └── ListingDetailPage.tsx
├── components/
│   ├── ListingCard.tsx
│   ├── ListingGrid.tsx
│   └── SearchFilters.tsx
├── hooks/
│   └── useListings.ts
├── api.ts
└── types.ts
```

Rules:

- `components/ui` should only contain generic UI primitives.
- Feature-specific components should live inside `features/<domain>/components`.
- `pages/` should become thin route wrappers, not large business components.
- Replace duplicate pages with one canonical route component.

## 14. Proposed Backend Structure

Recommended:

```text
backend/
├── app/
│   ├── index.ts
│   ├── express.ts
│   ├── trpc.ts
│   ├── context.ts
│   └── vite.ts
├── features/
│   ├── auth/
│   ├── users/
│   ├── listings/
│   ├── categories/
│   ├── auctions/
│   ├── rentals/
│   ├── messages/
│   ├── cart/
│   ├── transactions/
│   ├── reviews/
│   ├── verification/
│   ├── ads/
│   ├── admin/
│   └── rbac/
├── shared/
│   ├── errors.ts
│   ├── env.ts
│   ├── cookies.ts
│   └── security.ts
└── integrations/
    ├── email/
    ├── storage/
    ├── oauth/
    └── websocket/
```

Example backend feature:

```text
backend/features/listings/
├── listings.router.ts
├── listings.service.ts
├── listings.repository.ts
├── listings.schema.ts
└── listings.types.ts
```

Rules:

- Router files validate input and call services.
- Service files contain business rules.
- Repository files contain Drizzle queries.
- Shared helpers should not become dumping grounds.
- `backend/db.ts` should be split into repositories by domain.

## 15. Cleanup Plan

### Phase 0: Lock Down the Current Working State

Goal: prevent the project from getting worse while cleanup starts.

Tasks:

- Keep `pnpm-lock.yaml`.
- Do not use `npm install`.
- Add or update `.gitignore` entries for:
  - `node_modules`
  - `dist`
  - `sqlite.db`
  - `*.tsbuildinfo`
  - temporary output files
- Make `README.md` point to this documentation and local setup.
- Keep `pnpm run check` and `pnpm run build` passing after every cleanup step.

### Phase 1: Remove Obvious Garbage

Goal: clean the root folder without changing app behavior.

Move one-off scripts from root into:

```text
scripts/one-off/
```

Move temporary text files into:

```text
scratch/archive/
```

or delete them if not needed.

Candidates to move/delete:

- `temp_findstr.txt`
- `temp_findstr_rental.txt`
- `temp_transactions.txt`
- `tsc_output.txt`
- root `check_*.ts`
- root `fix_*.js`
- root `reset_*.ts`
- root `test_flow.ts`

Do not delete immediately unless there is git history or a backup. First move, run checks, then delete in a later commit.

### Phase 2: Resolve Duplicate Router Files

Goal: one backend router source of truth.

Tasks:

- Confirm `backend/routers/index.ts` is the only active `appRouter`.
- Compare it against `backend/routers.ts`.
- Migrate any missing procedures from `backend/routers.ts` into `backend/routers/index.ts` or feature routers.
- Delete `backend/routers.ts` after verification.

This is high priority because duplicate auth and listing logic is risky.

### Phase 3: Normalize Database Management

Goal: make local DB setup predictable.

Tasks:

- Decide whether migrations or schema push is the official local workflow.
- If migrations are official, regenerate clean migrations from current `drizzle/schema.ts`.
- If push is official for local dev, document:

```bash
pnpm exec drizzle-kit push
```

- Move `drizzle/` to `db/` only after the migration strategy is clear.
- Move seed files into one place:

```text
db/seeds/
```

or:

```text
scripts/seeds/
```

### Phase 4: Clean Frontend Pages

Goal: remove duplicate and unclear page variants.

Tasks:

- Pick canonical route pages:
  - keep `MarketplaceResponsive` or rename it to `MarketplacePage`
  - keep `AuctionResponsive` or rename it to `AuctionsPage`
  - keep `RentalResponsive` or rename it to `RentalsPage`
- Delete unused older pages after confirming no imports.
- Move route definitions out of `App.tsx` into `frontend/src/app/router.tsx`.
- Move providers into `frontend/src/app/providers.tsx`.
- Move layout into `frontend/src/app/layout.tsx`.

### Phase 5: Split Backend by Domain

Goal: stop adding more code to giant shared files.

Tasks:

- Create domain folders under `backend/features`.
- Start with one domain, preferably `listings`, because it is central and currently used by many pages.
- Move listing queries from `backend/db.ts` into `backend/features/listings/listings.repository.ts`.
- Move listing procedures into `backend/features/listings/listings.router.ts`.
- Export the router into the root app router.
- Repeat for categories, auctions, messages, cart, reviews, admin.

### Phase 6: Testing Strategy

Goal: have confidence while refactoring.

Minimum tests:

- API smoke tests for:
  - auth me
  - categories list
  - listings list
  - listing detail
  - cart operations
- Frontend component tests for:
  - header navigation
  - listing card
  - search filters
  - login/register forms
- One end-to-end happy path later:
  - register/login
  - create listing
  - view listing
  - add to cart or message seller

### Phase 7: Documentation Cleanup

Goal: one clear source of truth.

Recommended docs:

```text
docs/
├── architecture.md
├── local-development.md
├── database.md
├── api.md
├── deployment.md
├── testing.md
└── cleanup-plan.md
```

Existing root docs should be reviewed and either moved into `docs/` or deleted if outdated.

## 16. Recommended Immediate Next Steps

Do these first:

1. Keep using `pnpm`.
2. Add a proper `.env.example`.
3. Move root temporary scripts/files into `scripts/one-off` or `scratch/archive`.
4. Resolve `backend/routers.ts` vs `backend/routers/index.ts`.
5. Decide official database workflow: migrations or `drizzle-kit push`.
6. Rename duplicate responsive pages into canonical page names.
7. Split `backend/db.ts` into feature repositories one domain at a time.

## 17. Definition of Clean

The project is clean when:

- A new developer can run it with three commands.
- There is exactly one active backend router entry point.
- There is exactly one canonical page per route.
- Database schema and migrations agree.
- Temporary scripts are not in the root folder.
- Source code, generated code, local data, and documentation are separated.
- Each feature has a predictable place for UI, API, service logic, database access, and tests.
- `pnpm run check`, `pnpm run build`, and core tests pass before and after each refactor.
