import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Admin from './pages/Admin';
import Landing from './pages/Landing';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error('Supabase connection error:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Configuration Missing</h1>
        <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
          The Supabase connection keys are missing in Vercel. Please add <code className="text-zinc-300">VITE_SUPABASE_URL</code> and <code className="text-zinc-300">VITE_SUPABASE_ANON_KEY</code> to your environment variables.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="w-8 h-8 rounded-md border-2 border-white/20 border-t-white animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={!session ? <Landing /> : <Navigate to="/feed" />} 
        />
        <Route 
          path="/login" 
          element={!session ? <Auth /> : <Navigate to="/feed" />} 
        />
        <Route 
          path="/feed" 
          element={session ? <Feed session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={session ? <Profile session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/search" 
          element={session ? <Search /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={session ? <Admin session={session} /> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
