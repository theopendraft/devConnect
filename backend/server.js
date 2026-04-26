const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Client (Service Role for admin actions or Anon for general API)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: SUPABASE_URL and SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY must be set in .env');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/posts', async (req, res) => {
  try {
    // Attempt complex join
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
      console.error('Complex query failed, falling back to simple query:', error.message);
      // Fallback to simple query if relationships are broken
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
    console.error('Fatal fetch error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.length > 500) {
      return res.status(400).json({ error: 'Invalid content' });
    }

    // req.user is populated by our authMiddleware (verifies JWT)
    const { data: savedPost, error } = await supabase
      .from('posts')
      .insert([{
        user_id: req.user.sub,
        user_email: req.user.email,
        content: content
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating post' });
  }
});

// GET /api/posts/user/:userId - Fetch posts for a specific user
app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!user_id (username, avatar_url),
        likes_count:post_likes!fk_post_likes_post(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.profile?.username || 'unknown',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user posts' });
  }
});

// Unified Search: Profiles and Posts
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [], posts: [] });

    // Search Profiles
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, username, description, avatar_url')
      .ilike('username', `%${q}%`)
      .limit(10);

    // Search Posts (with profile joins)
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!user_id (username, avatar_url),
        likes_count:post_likes!fk_post_likes_post(count)
      `)
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (userError || postError) throw userError || postError;

    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.profile?.username || post.user_email.split('@')[0],
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0
    }));

    res.json({ users: users || [], posts: formattedPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// POST /api/posts/:postId/toggle-like - Add or remove a like
app.post('/api/posts/:postId/toggle-like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.sub;

    // Check if like exists
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);
      if (deleteError) throw deleteError;
      return res.json({ action: 'unliked' });
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }]);
      if (insertError) throw insertError;
      return res.json({ action: 'liked' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error toggling like' });
  }
});

// DELETE /api/posts/:postId - Delete a post (Admin/Owner functionality)
app.delete('/api/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting post' });
  }
});

// GET /api/profiles/:userId - Fetch profile details
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(profile || { username: 'unknown', description: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
