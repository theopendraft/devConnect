-- ============================================================
-- DevConnect Database Schema
-- Run this in the Supabase SQL Editor to initialize the DB.
-- ============================================================

-- PROFILES (linked to auth.users via trigger on signup)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  description text default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- POSTS
-- FK constraint named fk_user_profile — must match PostgREST join hint:
--   profiles!fk_user_profile used in server.js / api/posts.js
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  user_email text,
  content    text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now(),
  constraint fk_user_profile
    foreign key (user_id) references public.profiles(id) on delete cascade
);

-- POST_LIKES
-- FK constraint named fk_post_likes_post — must match PostgREST join hint:
--   post_likes!fk_post_likes_post used in server.js / api/posts.js
create table public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint fk_post_likes_post
    foreign key (post_id) references public.posts(id) on delete cascade,
  constraint uq_post_likes_user
    unique (post_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Feed: most-recent-first query
create index idx_posts_created_at     on public.posts(created_at desc);

-- Profile page: all posts by a user
create index idx_posts_user_id        on public.posts(user_id);

-- Like lookup / count per post
create index idx_post_likes_post_user on public.post_likes(post_id, user_id);

-- Full-text search on post content (used by future FTS upgrade)
create index idx_posts_fts
  on public.posts using gin(to_tsvector('english', content));

-- Username search
create index idx_profiles_username    on public.profiles(username);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- Note: backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- These policies apply to direct client-side Supabase calls.
-- ============================================================

alter table public.profiles  enable row level security;
alter table public.posts      enable row level security;
alter table public.post_likes enable row level security;

-- Profiles: public read, owner update
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Posts: public read, authenticated insert (own), owner delete
create policy "posts_select_all" on public.posts
  for select using (true);
create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = user_id);

-- Likes: public read, authenticated manage own
create policy "likes_select_all" on public.post_likes
  for select using (true);
create policy "likes_insert_own" on public.post_likes
  for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.post_likes
  for delete using (auth.uid() = user_id);
