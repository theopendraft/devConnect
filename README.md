# DevConnect

Developer social feed — share updates, connect with peers, and showcase what you're building.

**Live:** https://devconnect-tan-one.vercel.app

---

## System Architecture

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 6 + Tailwind CSS v4 |
| API — production | Vercel Serverless (Node.js) |
| API — local dev | Express 5 |
| Database + Auth | Supabase (PostgreSQL + PostgREST + GoTrue) |
| Realtime | Supabase Realtime (`postgres_changes`) |
| CI / CD | GitHub Actions → Vercel |

### Data flow

```
Browser (React SPA)
  │  axios /api/*
  ▼
Vercel Serverless (api/posts.js)        ← production
Express 5 (backend/server.js)           ← local dev
  │  @supabase/supabase-js (service role key)
  ▼
Supabase PostgreSQL
  │  Realtime channel (postgres_changes INSERT)
  ▼
React Feed (auto-refresh, no polling)
```

### Auth flow

1. User signs in via Supabase Auth (email + password or GitHub OAuth)
2. Supabase issues a JWT `access_token`
3. Frontend attaches `Authorization: Bearer <token>` to every mutating request
4. Serverless handler calls `supabase.auth.getUser(token)` to validate — no local JWT verification
5. On first sign-up, a PostgreSQL trigger (`handle_new_user`) auto-creates a `profiles` row

---

## AI Usage Log

| Area | How AI was used |
|---|---|
| Database schema | Generated Supabase SQL with named FK constraints (`fk_user_profile`, `fk_post_likes_post`) required for PostgREST join hints, RLS policies, and auto-profile trigger |
| UI layout | Scaffolded Tailwind CSS component layouts for Feed, Profile, and Auth pages to match the monochrome design system |
| Vercel routing | Debugged 405 Method Not Allowed — traced to a conflict between `rewrites` and automatic `api/` file routing for non-GET methods |

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/theopendraft/devConnect.git
cd devConnect
npm install
cd backend && npm install && cd ..
```

### 2. Configure environment variables

**Root `.env`** (frontend — Vite build-time):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

**`backend/.env`** (Express server — runtime):

```
PORT=5000
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_JWT_SECRET=<jwt_secret>
ALLOWED_ORIGIN=http://localhost:5173
```

### 3. Initialize the database

Open the Supabase Dashboard → SQL Editor → New query, paste the contents of `supabase/schema.sql`, and run it. This creates all tables, indexes, RLS policies, and the auto-profile trigger.

### 4. Run locally

```bash
# Terminal 1 — API
cd backend && node server.js

# Terminal 2 — frontend (proxies /api/* to localhost:5000)
npm run dev
```

Open `http://localhost:5173`.

---

## API Endpoints

All routes are served by `api/posts.js` in production (Vercel Serverless) and `backend/server.js` locally (Express 5). Mutating routes require `Authorization: Bearer <supabase_access_token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/posts` | optional | Paginated global feed (`?cursor=<ISO timestamp>`) |
| `GET` | `/api/posts/user/:userId` | — | All posts by a specific user |
| `GET` | `/api/search?q=` | — | Full-text search across posts and usernames |
| `GET` | `/api/profiles/:userId` | — | Fetch a user profile |
| `PUT` | `/api/profiles/:userId` | required | Update own username / bio / avatar |
| `POST` | `/api/posts` | required | Create a post (max 500 chars) |
| `DELETE` | `/api/posts/:postId` | required | Delete own post |
| `POST` | `/api/posts/:postId/toggle-like` | required | Like or unlike a post |

Pagination response shape:

```json
{ "posts": [...], "hasMore": true, "nextCursor": "2024-01-14T10:00:00.000Z" }
```

---

## CI / CD

Every push to `main` runs three sequential GitHub Actions jobs:

1. **Lint** — ESLint across `src/` (zero warnings policy)
2. **Test** — Vitest unit tests
3. **Deploy** — Vercel production deployment (only runs if lint + test both pass; skipped on PRs)

### Required GitHub secrets

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

### Required Vercel environment variables

Set in the Vercel project dashboard under **Settings → Environment Variables**:

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN`

---

## Design System

Strict monochrome dark aesthetic (Vercel / Linear inspired):

- **Backgrounds:** `bg-black` or `bg-[#0A0A0A]` only
- **Cards:** `bg-[#0A0A0A] border border-white/10 rounded-lg`
- **Primary button:** `bg-zinc-100 text-zinc-950`
- **No accent colors** — indigo, purple, and blue are explicitly prohibited
- **Icons:** `lucide-react` exclusively
