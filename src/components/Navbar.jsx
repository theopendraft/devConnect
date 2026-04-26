import { Terminal, LogOut, User, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center transition-all">
      <Link to="/feed" className="flex items-center gap-3 group">
          <div className="p-1.5 bg-[#0A0A0A] border border-white/10 rounded-md group-hover:border-white/20 transition-colors">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-mono selection:bg-white selection:text-black">
            DevConnect
          </span>
      </Link>

      <form onSubmit={handleSearch} className="relative w-full max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 text-zinc-600" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search updates..."
          className="w-full bg-black border border-white/10 text-sm text-zinc-300 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all placeholder:text-zinc-700"
        />
      </form>

      <div className="flex items-center gap-4">
        <Link 
          to="/profile"
          className="p-1.5 text-zinc-500 hover:text-white transition-colors"
        >
          <User className="w-5 h-5" />
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-all font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
