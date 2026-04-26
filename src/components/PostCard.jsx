import { Clock, Heart } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

export default function PostCard({ post, onUpdate }) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    try {
      setIsLiking(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await axios.patch(`${API_URL}/posts/${post.id}/like`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to like post:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-white font-medium shrink-0">
            {(post.user_email || post.userEmail || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm text-zinc-200">
              {(post.user_email || post.userEmail || 'Unknown User').split('@')[0]}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(post.created_at || post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
        >
          <Heart className={`w-4 h-4 ${post.likes_count > 0 ? 'fill-white text-white' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium">{post.likes_count || 0}</span>
        </button>
      </div>
      <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
        {post.content}
      </p>
    </div>
  );
}
