import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

export default function Feed({ session }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(res.data);
    } catch (err) {
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (content.length > 500) return;

    setSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      await axios.post(`${API_URL}/posts`, 
        { content }, 
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      
      setContent('');
      await fetchPosts();
    } catch (err) {
      console.error(err);
      setError('Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Create Post Section */}
        <div className="bg-[#0A0A0A] border border-white/10 p-4 sm:p-6 rounded-lg mb-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full bg-black border border-white/10 text-zinc-200 rounded-md px-4 py-3 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-colors placeholder:text-zinc-600 resize-none"
              placeholder="What are you working on?"
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs ${content.length > 450 ? 'text-orange-400' : 'text-zinc-500'}`}>
                {content.length} / 500
              </span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="w-full bg-zinc-100 text-zinc-950 font-medium py-2.5 rounded-md hover:bg-white transition-all focus:ring-2 focus:ring-zinc-400 focus:outline-none flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-zinc-300" />
            <h2 className="text-xl font-bold tracking-tight text-white">Global Feed</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No posts yet. Be the first!
            </div>
          ) : (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onUpdate={fetchPosts} 
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
