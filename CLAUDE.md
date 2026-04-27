# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)
```bash
npm install        # install frontend deps
npm run dev        # start Vite dev server on port 5173
npm run build      # production build
npm run preview    # preview production build
```

### Backend
```bash
cd backend
npm install
node server.js     # start Express on port 5000
```

Both processes must run simultaneously for full local functionality. The Vite dev server proxies `/api/*` to `http://localhost:5000` (configured in `vite.config.js`).

## Environment Variables

**Root `/.env`** (frontend):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**`/backend/.env`** (backend):
```
PORT=5000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```

## Architecture

### Dual-Engine Setup
This is not a monorepo with shared packages — it is two completely independent Node.js projects that happen to share a repo:

- **Frontend**: `src/` — React 19 + Vite + Tailwind CSS v4. ESM (`"type": "module"` in root `package.json`).
- **Backend**: `backend/` — Express 5 + CommonJS (`"type": "commonjs"` in `backend/package.json`). Do not mix module systems between them.
- **Vercel Serverless**: `api/posts.js` — a slimmed-down duplicate of the backend used for Vercel production deployments. `vercel.json` rewrites all `/api/*` traffic to this file.

### Auth Flow
Authentication is entirely Supabase-managed. `src/lib/supabase.js` exports a nullable client (returns `null` if env vars are missing — `App.jsx` renders a config-error screen in that case). The backend's `backend/middleware/auth.js` validates JWTs by calling `supabase.auth.getUser(token)` rather than verifying locally, so `SUPABASE_ANON_KEY` is required on the backend even though it also has `SUPABASE_SERVICE_ROLE_KEY`.

Frontend sends the Supabase session `access_token` as `Authorization: Bearer <token>` on all mutating API calls. `req.user` is populated as `{ sub: user.id, email: user.email }` by the middleware.

### Routing
`App.jsx` controls all route-level auth guards. Authenticated routes (`/feed`, `/profile`, `/search`, `/admin`) redirect to `/login` when no session exists; auth routes redirect to `/feed` when a session is present.

### Data Flow
All frontend API calls go through `axios` using the relative path `/api` (e.g. `axios.get('/api/posts')`), which works both locally (via Vite proxy) and on Vercel (via `vercel.json` rewrite).

### Supabase Schema
The backend queries these tables with joins:
- `posts` — `id`, `user_id`, `user_email`, `content`, `created_at`
- `profiles` — `id`, `username`, `description`, `avatar_url` (joined via foreign key `fk_user_profile`)
- `post_likes` — `id`, `post_id`, `user_id` (joined via foreign key `fk_post_likes_post`)

The complex join in `GET /api/posts` has a silent fallback to a plain `select('*')` if the join fails (e.g. tables/FK not yet created). This is intentional.

### CI/CD
`.github/workflows/deploy.yml` triggers on push to `main`: installs both root and backend deps, then deploys to Vercel production via `amondnet/vercel-action`. Required secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Design System

This project follows a strict monochrome dark aesthetic (Vercel/Linear-inspired). Deviating from these rules breaks visual consistency:

- **Backgrounds**: `bg-black` or `bg-[#0A0A0A]` only. Never `bg-zinc-950`.
- **Cards/containers**: `bg-[#0A0A0A] border border-white/10 rounded-lg`
- **Borders**: always translucent white — `border-white/10`, hover state `border-white/20`
- **Primary button**: `bg-zinc-100 text-zinc-950` (off-white, not indigo/blue)
- **Primary text**: `text-zinc-100` or `text-white`; secondary: `text-zinc-400`–`text-zinc-600`
- **No standard Tailwind accent colors** (indigo, purple, blue) — these are explicitly prohibited
- **Font**: `font-mono` for brand/usernames; default sans for body copy
- Icons from `lucide-react` exclusively
