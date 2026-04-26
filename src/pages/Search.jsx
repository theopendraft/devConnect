import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = '/api';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      if (res.data && typeof res.data === 'object') {
          setResults({
              users: Array.isArray(res.data.users) ? res.data.users : [],
              posts: Array.isArray(res.data.posts) ? res.data.posts : []
          });
      } else {
          setResults({ users: [], posts: [] });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
            <SearchIcon className="w-5 h-5 text-zinc-600" />
            <h1 className="text-xl font-bold text-white tracking-tight">
                Search results for <span className="text-zinc-500 font-mono">"{query}"</span>
            </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-10 border-b border-white/5">
            <button 
                onClick={() => setActiveTab('posts')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'text-white border-b border-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                Posts ({(Array.isArray(results?.posts) ? results.posts.length : 0)})
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-white border-b border-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                People ({(Array.isArray(results?.users) ? results.users.length : 0)})
            </button>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-lg text-red-400 text-xs font-mono">
                {error}
            </div>
          ) : activeTab === 'posts' ? (
            !Array.isArray(results?.posts) || results.posts.length === 0 ? (
                <div className="text-center py-20 text-zinc-700 border border-dashed border-white/5 rounded-lg text-sm">
                    No technical updates found.
                </div>
            ) : (
                results.posts?.map(post => (
                    <PostCard key={post.id} post={post} onUpdate={performSearch} />
                ))
            )
          ) : (
            !Array.isArray(results?.users) || results.users.length === 0 ? (
                <div className="text-center py-20 text-zinc-700 border border-dashed border-white/5 rounded-lg text-sm">
                    No builders found.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {results.users?.map(user => (
                        <div key={user.id} className="bg-[#0A0A0A] border border-white/10 p-4 rounded-lg flex items-center gap-4 hover:border-white/20 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-black border border-white/5 flex items-center justify-center text-white font-mono">
                                {user.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">@{user.username || 'unknown'}</div>
                                <div className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{user.description || 'No description provided.'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )
          )}
        </div>
      </main>
    </div>

  );
}
