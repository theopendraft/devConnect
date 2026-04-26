const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token by calling Supabase directly
    // This is more secure than local verification and doesn't require the JWT secret
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error(error?.message || 'User not found');
    }

    // Map Supabase user object to what the routes expect
    req.user = {
      sub: user.id,
      email: user.email
    };
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
