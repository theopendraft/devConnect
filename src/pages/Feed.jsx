import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Send, LayoutList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = '/api';

export default function Feed({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [postError, setPostError] = useState(null);
  // Prevent stale realtime refetch while a request is in-flight
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Realtime: silently refresh on new post inserts
  // Requires Realtime enabled on the posts table in Supabase dashboard
  // (Database → Replication → supabase_realtime → posts)
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        if (!fetchingRef.current) fetchPostsSilent();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const buildHeaders = () =>
    session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    fetchingRef.current = true;
    try {
      const res = await axios.get(`${API_URL}/posts`, { headers: buildHeaders() });
      setPosts(res.data?.posts ?? []);
      setHasMore(res.data?.hasMore ?? false);
      setNextCursor(res.data?.nextCursor ?? null);
    } catch (err) {
      console.error('Feed fetch error:', err);
      setError('Failed to load feed.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const fetchPostsSilent = async () => {
    fetchingRef.current = true;
    try {
      const res = await axios.get(`${API_URL}/posts`, { headers: buildHeaders() });
      setPosts(res.data?.posts ?? []);
      setHasMore(res.data?.hasMore ?? false);
      setNextCursor(res.data?.nextCursor ?? null);
    } catch {
      // silent — don't surface errors for background refreshes
    } finally {
      fetchingRef.current = false;
    }
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axios.get(`${API_URL}/posts`, {
        headers: buildHeaders(),
        params: { cursor: nextCursor }
      });
      const newPosts = res.data?.posts ?? [];
      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter(p => !ids.has(p.id))];
      });
      setHasMore(res.data?.hasMore ?? false);
      setNextCursor(res.data?.nextCursor ?? null);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 500) return;

    setPosting(true);
    setPostError(null);
    try {
      await axios.post(
        `${API_URL}/posts`,
        { content: trimmed },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setContent('');
      await fetchPosts();
    } catch (err) {
      console.error('Post creation error:', err);
      setPostError('Failed to publish. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 500;
  const canSubmit = !posting && charCount > 0 && !isOverLimit;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Create post */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 mb-8 hover:border-white/20 transition-all">
          <form onSubmit={handlePost}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What are you building?"
              rows={3}
              className="w-full bg-transparent text-zinc-200 text-sm placeholder:text-zinc-700 outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-400' : 'text-zinc-700'}`}>
                {charCount}/500
              </span>
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-zinc-100 text-zinc-950 text-xs font-medium px-4 py-1.5 rounded-md hover:bg-white transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {posting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                Publish
              </button>
            </div>
          </form>
          {postError && (
            <p className="text-red-400 text-xs font-mono mt-3">{postError}</p>
          )}
        </div>

        {/* Feed header */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <LayoutList className="w-4 h-4 text-zinc-600" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Global Feed</h2>
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
            No updates yet. Be the first to publish.
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={session?.user?.id}
                  onUpdate={fetchPosts}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-5 py-2 rounded-md border border-white/10 text-zinc-500 hover:text-zinc-200 hover:border-white/20 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingMore
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : null}
                  Load more
                </button>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
