import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Layout, Pencil, X, Check, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = '/api';

export default function Profile({ session }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  useEffect(() => {
    if (session?.user?.id) fetchProfileAndPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile data.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditUsername(profile?.username || '');
    setEditDescription(profile?.description || '');
    setEditAvatarUrl(profile?.avatar_url || '');
    setSaveError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editUsername.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await axios.put(
        `${API_URL}/profiles/${session.user.id}`,
        { username: editUsername.trim(), description: editDescription, avatar_url: editAvatarUrl || null },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">

        {/* Profile card */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-10 mb-12 hover:border-white/20 transition-all group">

          {!editing ? (
            /* ── View mode ── */
            <div className="flex flex-col items-center text-center relative">
              <button
                onClick={startEditing}
                className="absolute top-0 right-0 p-1.5 text-zinc-700 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-all"
                title="Edit profile"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <div className="w-24 h-24 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-4xl font-bold text-white mb-6 group-hover:border-white/30 transition-all overflow-hidden shadow-2xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.username} className="w-full h-full object-cover" />
                ) : (
                  (profile?.username || session?.user?.email || '?')?.charAt(0).toUpperCase()
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
                @{profile?.username || 'unknown'}
              </h1>
              <p className="text-zinc-500 text-sm mb-6 font-mono">{session?.user?.email}</p>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                {profile?.description || "This developer hasn't added a bio yet. Silence is code."}
              </p>
            </div>
          ) : (
            /* ── Edit mode ── */
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-white">Edit Profile</h2>
                <button
                  onClick={cancelEditing}
                  className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-md text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {saveError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className="w-full bg-black border border-white/10 text-zinc-200 text-sm rounded-md px-3 py-2.5 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-colors placeholder:text-zinc-700 font-mono"
                  placeholder="yourhandle"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Bio</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                  maxLength={200}
                  className="w-full bg-black border border-white/10 text-zinc-200 text-sm rounded-md px-3 py-2.5 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-colors placeholder:text-zinc-700 resize-none leading-relaxed"
                  placeholder="What are you building?"
                />
                <p className="text-[10px] font-mono text-zinc-700 text-right">{editDescription.length}/200</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Avatar URL</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={e => setEditAvatarUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 text-zinc-200 text-sm rounded-md px-3 py-2.5 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-colors placeholder:text-zinc-700"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editUsername.trim()}
                  className="flex items-center gap-2 bg-zinc-100 text-zinc-950 text-sm font-medium px-4 py-2 rounded-md hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />}
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <Layout className="w-4 h-4 text-zinc-600" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Your Activity</h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-700">
              {Array.isArray(posts) ? posts.length : 0} UPDATES
            </span>
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
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session?.user?.id}
                onUpdate={fetchProfileAndPosts}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
