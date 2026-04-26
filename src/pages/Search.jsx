import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/posts/search?q=${encodeURIComponent(query)}`);
      setPosts(res.data);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-10">
            <SearchIcon className="w-6 h-6 text-zinc-500" />
            <h1 className="text-2xl font-bold text-white">
                Results for <span className="text-zinc-400">"{query}"</span>
            </h1>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-lg text-red-400 text-sm">
                {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-white/10 rounded-lg">
                No updates found matching your search.
            </div>
          ) : (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onUpdate={performSearch} 
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
