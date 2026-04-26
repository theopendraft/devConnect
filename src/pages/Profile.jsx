import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Mail, Layout } from 'lucide-react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

export default function Profile({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPosts();
    }
  }, [session]);

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/user/${session.user.id}`);
      setPosts(res.data);
    } catch (err) {
      setError('Failed to load your posts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-8 mb-12 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-3xl font-bold text-white mb-4 mx-auto">
                {session?.user?.email?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{session?.user?.email?.split('@')[0]}</h1>
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                <Mail className="w-4 h-4" />
                {session?.user?.email}
            </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4">
            <Layout className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xl font-bold text-white">Your Updates</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-lg">
                You haven't posted anything yet.
            </div>
          ) : (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onUpdate={fetchUserPosts} 
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
