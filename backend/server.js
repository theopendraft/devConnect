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
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    res.json(posts || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching posts' });
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
