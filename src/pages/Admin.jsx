import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = '/api';

export default function Admin({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/posts`);
      // API now returns { posts, hasMore, nextCursor }
      setPosts(Array.isArray(res.data) ? res.data : (res.data?.posts ?? []));
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (deleting) return;
    setDeleting(postId);
    setError(null);
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Delete failed. You may not own this post.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
          <ShieldAlert className="w-5 h-5 text-zinc-500" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{posts.length} TOTAL POSTS</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-md text-red-400 text-xs font-mono mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-700 border border-dashed border-white/5 rounded-lg text-sm">
            No posts in the system.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div
                key={post.id}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">
                      @{post.username || 'unknown'}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting === post.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/5 bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 text-zinc-600 hover:text-red-400 transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting === post.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
