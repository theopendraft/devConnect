import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Mail, Layout } from 'lucide-react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = '/api';

export default function Profile({ session }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileAndPosts();
    }
  }, [session]);

  const fetchProfileAndPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, postsRes] = await Promise.all([
        axios.get(`${API_URL}/profiles/${session.user.id}`),
        axios.get(`${API_URL}/posts/user/${session.user.id}`)
      ]);
      
      setProfile(profileRes.data);
      
      if (Array.isArray(postsRes.data)) {
        setPosts(postsRes.data);
      } else {
        setPosts([]);
        console.error('Expected array for posts, got:', postsRes.data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile data.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-10 mb-12 flex flex-col items-center text-center group hover:border-white/20 transition-all">
            <div className="w-24 h-24 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-4xl font-bold text-white mb-6 group-hover:border-white/30 transition-all overflow-hidden shadow-2xl">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.username} className="w-full h-full object-cover" />
                ) : (
                    (profile?.username || session?.user?.email || '?')?.charAt(0).toUpperCase()
                )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">@{profile?.username || 'unknown'}</h1>
            <p className="text-zinc-500 text-sm mb-6 font-mono">{session?.user?.email}</p>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                {profile?.description || "This developer hasn't added a bio yet. Silence is code."}
            </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
                <Layout className="w-4 h-4 text-zinc-600" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Your Activity</h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-700">{(Array.isArray(posts) ? posts.length : 0)} UPDATES</span>
          </div>

          {error && (
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-md text-red-400 text-xs font-mono mb-6 text-center">
                {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
            </div>
          ) : !Array.isArray(posts) || posts.length === 0 ? (
            <div className="text-center py-20 text-zinc-700 border border-dashed border-white/5 rounded-lg text-sm">
                You haven't pushed any updates yet.
            </div>
          ) : (
            posts?.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onUpdate={fetchProfileAndPosts} 
              />
            ))
          )}
        </div>
      </main>
    </div>

  );
}
