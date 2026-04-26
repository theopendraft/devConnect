require('dotenv').config({ path: 'backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Seeding mock data...');

  // 1. Create Mock Profiles (using some real-looking UUIDs or let database handle it if they exist)
  // Note: These IDs should ideally correspond to real auth.users, 
  // but for a demo we can just insert into profiles if RLS allows.
  
  const mockUsers = [
    { id: '00000000-0000-0000-0000-000000000001', username: 'alex_codes', description: 'Senior Frontend Architect @ Vercel. Obsessed with performance and minimalist design.', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
    { id: '00000000-0000-0000-0000-000000000002', username: 'sarah_dev', description: 'Full-stack explorer. Building the next generation of social tools.', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: '00000000-0000-0000-0000-000000000003', username: 'ghost_coder', description: 'Building in the shadows. High-performance rust enthusiast.', avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' }
  ];

  for (const user of mockUsers) {
    const { error } = await supabase.from('profiles').upsert(user);
    if (error) console.error(`Error seeding profile ${user.username}:`, error.message);
  }

  console.log('Profiles seeded.');

  // 2. Create Mock Posts
  const mockPosts = [
    { 
      user_id: '00000000-0000-0000-0000-000000000001', 
      user_email: 'alex@vercel.com',
      content: 'Just deployed the new DevConnect interaction system. The monochrome aesthetic feels so much cleaner than the old purple theme. Less is more.' 
    },
    { 
      user_id: '00000000-0000-0000-0000-000000000002', 
      user_email: 'sarah@dev.com',
      content: 'Working on a new React library for fluid animations. Anyone tried the new Framer Motion layout transitions? They are a game changer for UX.' 
    },
    { 
      user_id: '00000000-0000-0000-0000-000000000003', 
      user_email: 'ghost@rust.org',
      content: 'Rust is the future of the web. Rewrite your backend in Rust and watch your server costs plummet. 🦀' 
    },
    { 
      user_id: '00000000-0000-0000-0000-000000000001', 
      user_email: 'alex@vercel.com',
      content: 'Thinking about adding a "Darker Mode" where everything is pitch black with only 2% opacity text for the ultra-minimalists. Crazy or genius?' 
    }
  ];

  const { error: postError } = await supabase.from('posts').insert(mockPosts);
  if (postError) console.error('Error seeding posts:', postError.message);

  console.log('Posts seeded successfully.');
}

seed();
