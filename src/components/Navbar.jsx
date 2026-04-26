import { Terminal, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-md border border-white/10">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-mono">
            DevConnect
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
    </nav>
  );
}
