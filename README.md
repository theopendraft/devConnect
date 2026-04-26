# DevConnect

DevConnect is a premium, minimalist social network designed specifically for developers. It features a robust Vercel/Linear-inspired sleek monochrome UI aesthetic, robust authentication, and a chronological global feed. 

This repository utilizes a dual-engine architecture:
- **Frontend Engine**: React + Vite (Port 5173)
- **Backend API**: Node.js + Express (Port 5000)
- **Database & Auth**: Supabase

## 1. Quick Start

Ensure you have [Node.js](https://nodejs.org/) installed, and a [Supabase](https://supabase.com) project created.

### Environment Setup
You will need two `.env` files.

1. **Frontend (`/.env`)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. **Backend (`/backend/.env`)**
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### Database Schema
Navigate to the Supabase SQL Editor and run the following query to initialize the `posts` table:
```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  user_email text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
```

## 2. Booting Up Locally

You need to run two terminal instances simultaneously.

**Terminal 1: Start the Frontend (Vite)**
```bash
npm install
npm run dev
```

**Terminal 2: Start the Backend (Express)**
```bash
cd backend
npm install
node server.js
```

### Design System Notes
This project strictly follows a custom Vercel / Linear inspired developer aesthetic. 
- All backgrounds utilize `bg-black` or `bg-[#0A0A0A]`.
- All borders use exact translucent configurations (`border-white/10`).
- The primary interactive components utilize solid off-white styles (`bg-zinc-100 text-zinc-950`).
- No generic Bootstrap/Tailwind standard colors (indigo, purple, blue) are permitted.
