const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — lock to ALLOWED_ORIGIN in production; reflects all origins in dev
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({ origin: allowedOrigin || true, credentials: true }));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: SUPABASE_URL and SUPABASE_KEY must be set in .env');
}
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Rate limiters — 30 write/like actions per IP per 15 min
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: !!process.env.SUPABASE_URL, env: process.env.NODE_ENV });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── GET /api/posts ─────────────────────────────────────────────────────────────
// Cursor pagination: ?cursor=<created_at ISO>
// Returns { posts, hasMore, nextCursor }

const PAGE_SIZE = 20;

app.get('/api/posts', async (req, res) => {
  const { cursor } = req.query;
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!fk_user_profile (username, avatar_url),
        likes_count:post_likes!fk_post_likes_post(count)
      `)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) query = query.lt('created_at', cursor);

    const { data: posts, error } = await query;

    if (error) {
      console.error('Complex query failed, falling back:', error.message);
      const { data: simplePosts, error: simpleError } = await supabase
        .from('posts').select('*')
        .order('created_at', { ascending: false }).limit(PAGE_SIZE);
      if (simpleError) throw simpleError;
      const formatted = simplePosts.map(p => ({
        ...p, likes_count: 0, username: p.user_email?.split('@')[0] || 'dev', user_has_liked: false
      }));
      return res.json({ posts: formatted, hasMore: formatted.length === PAGE_SIZE, nextCursor: formatted.at(-1)?.created_at || null });
    }

    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0,
      user_has_liked: false
    }));

    res.json({
      posts: formattedPosts,
      hasMore: formattedPosts.length === PAGE_SIZE,
      nextCursor: formattedPosts.length > 0 ? formattedPosts.at(-1).created_at : null
    });
  } catch (err) {
    console.error('Fatal fetch error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── GET /api/posts/user/:userId ───────────────────────────────────────────────

app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!fk_user_profile (username, avatar_url),
        likes_count:post_likes!fk_post_likes_post(count)
      `)
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(posts.map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0,
      user_has_liked: false
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user posts' });
  }
});

// ── GET /api/search ───────────────────────────────────────────────────────────
// FTS on post content; falls back to ILIKE if query is malformed.

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [], posts: [] });

    const [usersResult, postsResult] = await Promise.all([
      supabase
        .from('profiles').select('id, username, description, avatar_url')
        .ilike('username', `%${q}%`).limit(10),
      supabase
        .from('posts')
        .select(`*, profile:profiles!fk_user_profile (username, avatar_url), likes_count:post_likes!fk_post_likes_post(count)`)
        .textSearch('content', q, { type: 'websearch', config: 'english' })
        .order('created_at', { ascending: false }).limit(20)
    ]);

    let postData = postsResult.data;
    if (postsResult.error) {
      const fallback = await supabase
        .from('posts')
        .select(`*, profile:profiles!fk_user_profile (username, avatar_url), likes_count:post_likes!fk_post_likes_post(count)`)
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false }).limit(20);
      postData = fallback.data || [];
    }

    const formattedPosts = (postData || []).map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0
    }));

    res.json({ users: usersResult.data || [], posts: formattedPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// ── GET /api/profiles/:userId ─────────────────────────────────────────────────

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles').select('*').eq('id', req.params.userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(profile || { username: 'unknown', description: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// ── PUT /api/profiles/:userId ─────────────────────────────────────────────────

app.put('/api/profiles/:userId', authMiddleware, async (req, res) => {
  if (req.user.sub !== req.params.userId) {
    return res.status(403).json({ error: 'Cannot edit another user\'s profile' });
  }

  const { username, description, avatar_url } = req.body;
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), description: description || '', avatar_url: avatar_url || null })
      .eq('id', req.user.sub)
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    const isDuplicate = err.message?.includes('unique') || err.code === '23505';
    res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? 'Username already taken' : 'Server error updating profile'
    });
  }
});

// ── POST /api/posts ───────────────────────────────────────────────────────────

app.post('/api/posts', writeLimiter, authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0 || content.length > 500) {
      return res.status(400).json({ error: 'Content must be 1–500 characters' });
    }
    const { data: savedPost, error } = await supabase
      .from('posts')
      .insert([{ user_id: req.user.sub, user_email: req.user.email, content: content.trim() }])
      .select().single();
    if (error) throw error;
    res.status(201).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating post' });
  }
});

// ── POST /api/posts/:postId/toggle-like ───────────────────────────────────────

app.post('/api/posts/:postId/toggle-like', writeLimiter, authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.sub;

    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes').select('id')
      .eq('post_id', postId).eq('user_id', userId).single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingLike) {
      const { error } = await supabase.from('post_likes').delete().eq('id', existingLike.id);
      if (error) throw error;
      return res.json({ action: 'unliked' });
    }
    const { error } = await supabase.from('post_likes').insert([{ post_id: postId, user_id: userId }]);
    if (error) throw error;
    res.json({ action: 'liked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error toggling like' });
  }
});

// ── DELETE /api/posts/:postId ─────────────────────────────────────────────────

app.delete('/api/posts/:postId', writeLimiter, authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('posts').delete()
      .eq('id', req.params.postId)
      .eq('user_id', req.user.sub);
    if (error) throw error;
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting post' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
