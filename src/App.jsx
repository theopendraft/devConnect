import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Search from './pages/Search';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          element={!session ? <Auth /> : <Navigate to="/feed" />} 
        />
        <Route 
          path="/feed" 
          element={session ? <Feed session={session} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/profile" 
          element={session ? <Profile session={session} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/search" 
          element={session ? <Search /> : <Navigate to="/" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
