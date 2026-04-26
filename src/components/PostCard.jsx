import { Clock, Heart } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

export default function PostCard({ post, onUpdate }) {
  const [localLikes, setLocalLikes] = useState(post.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false); // Initially false, ideally should be passed from backend if user liked it
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;

    // Optimistic Update
    const increment = hasLiked ? -1 : 1;
    setLocalLikes(prev => prev + increment);
    setHasLiked(!hasLiked);
    setIsLiking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          // Revert if no session
          setLocalLikes(prev => prev - increment);
          setHasLiked(hasLiked);
          return;
      }

      await axios.post(`${API_URL}/posts/${post.id}/toggle-like`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      // Optionally sync with server
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert on error
      setLocalLikes(prev => prev - increment);
      setHasLiked(hasLiked);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all group selection:bg-white selection:text-black">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-200 font-mono text-sm group-hover:border-white/20 transition-colors overflow-hidden">
            {post.avatar_url ? (
                <img src={post.avatar_url} alt={post.username} className="w-full h-full object-cover" />
            ) : (
                (post.username || '?').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-tight">
              @{post.username || 'unknown'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(post.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleLike}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group/heart"
        >
          <Heart className={`w-3.5 h-3.5 transition-all ${hasLiked ? 'fill-white text-white' : 'text-zinc-600 group-hover/heart:text-zinc-400'}`} />
          <span className={`text-xs font-mono ${hasLiked ? 'text-white' : 'text-zinc-500'}`}>{localLikes}</span>
        </button>
      </div>
      <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed text-sm selection:bg-white selection:text-black">
        {post.content}
      </p>
    </div>
  );
}
