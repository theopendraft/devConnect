// Pure Vercel serverless handler — no Express dependency
// req.body, req.query, res.status(), res.json() are provided by Vercel's runtime
const { createClient } = require('@supabase/supabase-js');

const PAGE_SIZE = 20;

const supabase =
  process.env.SUPABASE_URL &&
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      )
    : null;

function setCors(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

async function requireAuth(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }
  const { data: { user }, error } = await supabase.auth.getUser(auth.split(' ')[1]);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
  return { sub: user.id, email: user.email };
}

function formatPost(p, likedSet = new Set()) {
  return {
    ...p,
    username: p.profile?.username || p.user_email?.split('@')[0] || 'dev',
    avatar_url: p.profile?.avatar_url || null,
    likes_count: p.likes_count?.[0]?.count ?? 0,
    user_has_liked: likedSet.has(p.id),
  };
}

const JOIN = `*, profile:profiles!fk_user_profile(username,avatar_url), likes_count:post_likes!fk_post_likes_post(count)`;

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const method = req.method;
  const path = (req.url || '/').split('?')[0].replace(/\/$/, '') || '/';
  const q = req.query || {};
  const body = req.body || {};

  // ── GET /api/health ──────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/api/health') {
    return res.status(200).json({ status: 'ok', ts: Date.now() });
  }

  // ── GET /api/posts ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/api/posts') {
    try {
      let query = supabase.from('posts').select(JOIN)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (q.cursor) query = query.lt('created_at', q.cursor);

      const { data: posts, error } = await query;
      if (error) throw error;

      let likedSet = new Set();
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) {
        const { data: { user } } = await supabase.auth.getUser(auth.split(' ')[1]);
        if (user) {
          const { data: likes } = await supabase
            .from('post_likes').select('post_id').eq('user_id', user.id);
          if (likes) likedSet = new Set(likes.map(l => l.post_id));
        }
      }

      const formatted = posts.map(p => formatPost(p, likedSet));
      return res.status(200).json({
        posts: formatted,
        hasMore: formatted.length === PAGE_SIZE,
        nextCursor: formatted.length > 0 ? formatted[formatted.length - 1].created_at : null,
      });
    } catch (err) {
      console.error('GET /api/posts fallback:', err.message);
      const { data } = await supabase.from('posts').select('*')
        .order('created_at', { ascending: false }).limit(PAGE_SIZE);
      return res.status(200).json({
        posts: (data || []).map(p => ({ ...p, username: p.user_email?.split('@')[0] || 'dev', likes_count: 0, user_has_liked: false })),
        hasMore: false, nextCursor: null,
      });
    }
  }

  // ── GET /api/posts/user/:userId ──────────────────────────────────────────────
  const userPostsM = path.match(/^\/api\/posts\/user\/([^/]+)$/);
  if (method === 'GET' && userPostsM) {
    try {
      const { data: posts, error } = await supabase.from('posts').select(JOIN)
        .eq('user_id', userPostsM[1]).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(posts.map(p => formatPost(p)));
    } catch {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // ── GET /api/search ──────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/api/search') {
    const searchQ = q.q;
    if (!searchQ) return res.status(200).json({ users: [], posts: [] });
    try {
      const [usersRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('id,username,description,avatar_url')
          .ilike('username', `%${searchQ}%`).limit(10),
        supabase.from('posts').select(JOIN)
          .textSearch('content', searchQ, { type: 'websearch', config: 'english' })
          .order('created_at', { ascending: false }).limit(20),
      ]);
      let postData = postsRes.data;
      if (postsRes.error) {
        const fb = await supabase.from('posts').select(JOIN)
          .ilike('content', `%${searchQ}%`).order('created_at', { ascending: false }).limit(20);
        postData = fb.data || [];
      }
      return res.status(200).json({ users: usersRes.data || [], posts: (postData || []).map(p => formatPost(p)) });
    } catch {
      return res.status(500).json({ error: 'Search error' });
    }
  }

  // ── GET /api/profiles/:userId ────────────────────────────────────────────────
  const profileM = path.match(/^\/api\/profiles\/([^/]+)$/);
  if (method === 'GET' && profileM) {
    try {
      const { data, error } = await supabase.from('profiles').select('*')
        .eq('id', profileM[1]).single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || { username: 'unknown', description: '' });
    } catch {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // ── PUT /api/profiles/:userId ────────────────────────────────────────────────
  if (method === 'PUT' && profileM) {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (user.sub !== profileM[1]) return res.status(403).json({ error: 'Forbidden' });
    const { username, description, avatar_url } = body;
    if (!username?.trim()) return res.status(400).json({ error: 'Username required' });
    try {
      const { data, error } = await supabase.from('profiles')
        .update({ username: username.trim(), description: description || '', avatar_url: avatar_url || null })
        .eq('id', user.sub).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      return res.status(err.code === '23505' ? 409 : 500)
        .json({ error: err.code === '23505' ? 'Username taken' : 'Server error' });
    }
  }

  // ── POST /api/posts ──────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/api/posts') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { content } = body;
    if (!content?.trim() || content.length > 500)
      return res.status(400).json({ error: 'Content must be 1–500 characters' });
    try {
      const { data, error } = await supabase.from('posts')
        .insert([{ user_id: user.sub, user_email: user.email, content: content.trim() }])
        .select().single();
      if (error) throw error;
      return res.status(201).json(data);
    } catch {
      return res.status(500).json({ error: 'Server error creating post' });
    }
  }

  // ── DELETE /api/posts/:postId ────────────────────────────────────────────────
  const postM = path.match(/^\/api\/posts\/([^/]+)$/);
  if (method === 'DELETE' && postM) {
    const user = await requireAuth(req, res);
    if (!user) return;
    try {
      const { error } = await supabase.from('posts').delete()
        .eq('id', postM[1]).eq('user_id', user.sub);
      if (error) throw error;
      return res.status(200).json({ message: 'Deleted' });
    } catch {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // ── POST /api/posts/:postId/toggle-like ──────────────────────────────────────
  const likeM = path.match(/^\/api\/posts\/([^/]+)\/toggle-like$/);
  if (method === 'POST' && likeM) {
    const user = await requireAuth(req, res);
    if (!user) return;
    const postId = likeM[1];
    try {
      const { data: existing, error: chkErr } = await supabase.from('post_likes')
        .select('id').eq('post_id', postId).eq('user_id', user.sub).single();
      if (chkErr && chkErr.code !== 'PGRST116') throw chkErr;
      if (existing) {
        await supabase.from('post_likes').delete().eq('id', existing.id);
        return res.status(200).json({ action: 'unliked' });
      }
      await supabase.from('post_likes').insert([{ post_id: postId, user_id: user.sub }]);
      return res.status(200).json({ action: 'liked' });
    } catch {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(404).json({ error: 'Not found', path, method });
};
