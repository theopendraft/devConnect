const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// DIAGNOSTIC WRAPPER
app.use(async (req, res, next) => {
  try {
    next();
  } catch (err) {
    console.error('CRITICAL SERVER ERROR:', err);
    res.status(500).json({ 
      error: 'Backend Crash', 
      details: err.message,
      path: req.path 
    });
  }
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    supabase_connected: !!supabase,
    env: process.env.NODE_ENV 
  });
});

app.get('/api/posts', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured in Vercel' });
  
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, profile:profiles!fk_user_profile (username, avatar_url), likes_count:post_likes!fk_post_likes_post(count)')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    
    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.profile?.username || post.user_email?.split('@')[0] || 'dev',
      avatar_url: post.profile?.avatar_url,
      likes_count: post.likes_count?.[0]?.count || 0
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error('Query Error:', err.message);
    // Absolute fallback
    const { data } = await supabase.from('posts').select('*').limit(10);
    res.json(data || []);
  }
});

module.exports = app;
