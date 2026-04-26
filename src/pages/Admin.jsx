import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

export default function Admin({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const isAdmin = session?.user?.email === 'admin@devconnect.com';

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setDeleting(postId);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${currentSession.access_token}` }
      });
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (!isAdmin) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-zinc-400 text-sm mb-6">This portal is reserved for DevConnect administrators. Please return to the main feed.</p>
                <a href="/feed" className="inline-block bg-zinc-100 text-black px-6 py-2 rounded-md font-medium hover:bg-white transition-all">Go to Feed</a>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
          <Shield className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-zinc-500 text-sm">System Governance & Content Moderation</p>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400 font-medium uppercase text-[10px] tracking-widest border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Content Preview</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">No posts found to moderate.</td>
                  </tr>
                ) : (
                  posts.map(post => (
                    <tr key={post.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-zinc-300">{post.user_email}</td>
                      <td className="px-6 py-4 text-zinc-400 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
                        {post.content}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 italic text-[11px]">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                          className="p-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-30"
                        >
                          {deleting === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
