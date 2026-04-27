const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS — lock to ALLOWED_ORIGIN in production; reflects all origins in dev
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({ origin: allowedOrigin || true, credentials: true }));
app.use(express.json());

// Module-scope Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Inline auth helper
async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
  return { sub: user.id, email: user.email };
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase_connected: !!supabase, env: process.env.NODE_ENV });
});

// ── GET /api/posts ─────────────────────────────────────────────────────────────
// Supports cursor-based pagination: ?cursor=<created_at ISO string>
// Returns { posts, hasMore, nextCursor }

app.get('/api/posts', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { cursor } = req.query;
  const PAGE_SIZE = 20;

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
    if (error) throw error;

    // Optionally resolve liked post IDs for the requesting user
    let likedSet = new Set();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes').select('post_id').eq('user_id', user.id);
        if (likes) likedSet = new Set(likes.map(l => l.post_id));
      }
    }

    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0,
      user_has_liked: likedSet.has(post.id)
    }));

    res.json({
      posts: formattedPosts,
      hasMore: formattedPosts.length === PAGE_SIZE,
      nextCursor: formattedPosts.length > 0
        ? formattedPosts[formattedPosts.length - 1].created_at
        : null
    });
  } catch (err) {
    console.error('GET /api/posts error:', err.message);
    const { data } = await supabase.from('posts').select('*')
      .order('created_at', { ascending: false }).limit(20);
    res.json({
      posts: (data || []).map(p => ({
        ...p, username: p.user_email?.split('@')[0] || 'dev',
        likes_count: 0, user_has_liked: false
      })),
      hasMore: false,
      nextCursor: null
    });
  }
});

// ── GET /api/posts/user/:userId ───────────────────────────────────────────────
// Before /:postId routes to prevent "user" matching as a postId

app.get('/api/posts/user/:userId', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

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
    console.error('GET /api/posts/user error:', err.message);
    res.status(500).json({ error: 'Server error fetching user posts' });
  }
});

// ── GET /api/search ───────────────────────────────────────────────────────────
// Uses full-text search (websearch tsquery) for post content via idx_posts_fts.
// Falls back to ILIKE if FTS fails (e.g. query is too short or malformed).

app.get('/api/search', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { q } = req.query;
  if (!q) return res.json({ users: [], posts: [] });

  try {
    const [usersResult, postsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, description, avatar_url')
        .ilike('username', `%${q}%`)
        .limit(10),
      supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!fk_user_profile (username, avatar_url),
          likes_count:post_likes!fk_post_likes_post(count)
        `)
        .textSearch('content', q, { type: 'websearch', config: 'english' })
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    // Fall back to ILIKE if FTS query was rejected (too short, special chars only)
    let postData = postsResult.data;
    if (postsResult.error) {
      const fallback = await supabase
        .from('posts')
        .select(`*, profile:profiles!fk_user_profile (username, avatar_url), likes_count:post_likes!fk_post_likes_post(count)`)
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      postData = fallback.data || [];
    }

    const posts = (postData || []).map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0,
      user_has_liked: false
    }));

    res.json({ users: usersResult.data || [], posts });
  } catch (err) {
    console.error('GET /api/search error:', err.message);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// ── GET /api/profiles/:userId ─────────────────────────────────────────────────

app.get('/api/profiles/:userId', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', req.params.userId).single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { username: 'unknown', description: '' });
  } catch (err) {
    console.error('GET /api/profiles error:', err.message);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// ── PUT /api/profiles/:userId ─────────────────────────────────────────────────

app.put('/api/profiles/:userId', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.sub !== req.params.userId) {
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
      .eq('id', user.sub)
      .select()
      .single();

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

app.post('/api/posts', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { content } = req.body;
  if (!content || content.trim().length === 0 || content.length > 500) {
    return res.status(400).json({ error: 'Content must be 1–500 characters' });
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ user_id: user.sub, user_email: user.email, content: content.trim() }])
      .select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('POST /api/posts error:', err.message);
    res.status(500).json({ error: 'Server error creating post' });
  }
});

// ── DELETE /api/posts/:postId ─────────────────────────────────────────────────

app.delete('/api/posts/:postId', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { error } = await supabase
      .from('posts').delete()
      .eq('id', req.params.postId)
      .eq('user_id', user.sub);

    if (error) throw error;
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /api/posts error:', err.message);
    res.status(500).json({ error: 'Server error deleting post' });
  }
});

// ── POST /api/posts/:postId/toggle-like ───────────────────────────────────────

app.post('/api/posts/:postId/toggle-like', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { postId } = req.params;

  try {
    const { data: existing, error: checkError } = await supabase
      .from('post_likes').select('id')
      .eq('post_id', postId).eq('user_id', user.sub).single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
      const { error } = await supabase.from('post_likes').delete().eq('id', existing.id);
      if (error) throw error;
      return res.json({ action: 'unliked' });
    }

    const { error } = await supabase
      .from('post_likes').insert([{ post_id: postId, user_id: user.sub }]);
    if (error) throw error;
    res.json({ action: 'liked' });
  } catch (err) {
    console.error('POST toggle-like error:', err.message);
    res.status(500).json({ error: 'Server error toggling like' });
  }
});

module.exports = app;
