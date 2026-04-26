const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase (Using env variables from Vercel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware (Simplified for internal api use)
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw error;
    req.user = { sub: user.id, email: user.email };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// --- ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: !!process.env.SUPABASE_URL });
});

app.get('/api/posts', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!fk_user_profile (username, avatar_url),
        likes_count:post_likes!fk_post_likes_post(count)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      // Fallback
      const { data: simplePosts, error: simpleError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (simpleError) throw simpleError;
      return res.json(simplePosts.map(p => ({ ...p, likes_count: 0, username: p.user_email?.split('@')[0] || 'dev' })));
    }

    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0
    }));

    res.json(formattedPosts);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Alias for Vercel
app.get('/posts', (req, res) => res.redirect('/api/posts'));

app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { data: savedPost, error } = await supabase
      .from('posts')
      .insert([{ user_id: req.user.sub, user_email: req.user.email, content }])
      .select().single();
    if (error) throw error;
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: 'Error creating post' });
  }
});

app.post('/api/posts/:postId/toggle-like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.sub;
    const { data: existingLike } = await supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', userId).single();
    if (existingLike) {
      await supabase.from('post_likes').delete().eq('id', existingLike.id);
      return res.json({ action: 'unliked' });
    } else {
      await supabase.from('post_likes').insert([{ post_id: postId, user_id: userId }]);
      return res.json({ action: 'liked' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error toggling like' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [], posts: [] });
    const { data: users } = await supabase.from('profiles').select('id, username, description, avatar_url').ilike('username', `%${q}%`).limit(10);
    const { data: posts } = await supabase.from('posts').select('*, profile:profiles!fk_user_profile (username, avatar_url), likes_count:post_likes!fk_post_likes_post(count)').ilike('content', `%${q}%`).order('created_at', { ascending: false }).limit(20);
    const formattedPosts = (posts || []).map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0
    }));
    res.json({ users: users || [], posts: formattedPosts });
  } catch (err) {
    res.status(500).json({ error: 'Search error' });
  }
});

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.params.userId).single();
    res.json(profile || { username: 'unknown', description: '' });
  } catch (err) {
    res.status(500).json({ error: 'Profile error' });
  }
});

module.exports = app;
