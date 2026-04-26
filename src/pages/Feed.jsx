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
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      } else {
        console.error('Invalid API response:', res.data);
        setError('Server returned invalid data format.');
      }
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
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-center">
              <p className="text-red-400 text-sm font-medium mb-1">Feed Sync Interrupted</p>
              <p className="text-zinc-600 text-xs mb-4">Error: {error}</p>
              <button onClick={fetchPosts} className="text-xs text-zinc-100 px-4 py-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">Retry Connection</button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
              <span className="text-[10px] text-zinc-700 uppercase tracking-[0.2em]">Authenticating Stream...</span>
            </div>
          ) : posts.length === 0 && !error ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <div className="w-12 h-12 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                 <Loader2 className="w-5 h-5 text-zinc-800" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">The feed is currently silent.</p>
              <p className="text-zinc-600 text-xs mt-1">If this is unexpected, check your network connection.</p>
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
