require('dotenv').config({ path: 'backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkJoin() {
  console.log('Testing complex join query...');
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (username, avatar_url),
      likes_count:post_likes!fk_post_likes_post(count)
    `)
    .limit(1);

  if (error) {
    console.error('JOIN ERROR:', error.message);
    console.error('HINT:', error.hint);
    console.error('DETAILS:', error.details);
  } else {
    console.log('Join success!');
    console.log('Result sample:', JSON.stringify(data[0], null, 2));
  }
}

checkJoin();
