import { Link } from 'react-router-dom';
import { Terminal, Shield, Zap, Globe, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6" />
          <span className="text-xl font-bold font-mono tracking-tighter">DevConnect</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Log In</Link>
          <Link to="/login" className="bg-zinc-100 text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-white transition-all">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-400 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Now supporting multi-service deploys
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          The Minimalist Network<br />for Developers.
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Sync with builders, share technical updates, and grow your network in a workspace designed for speed and clarity. No noise, just code.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/login" 
            className="w-full sm:w-auto bg-zinc-100 text-black px-8 py-4 rounded-md font-bold hover:bg-white transition-all flex items-center justify-center gap-2 group"
          >
            Start Building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="https://github.com/theopendraft/devConnect"
            target="_blank"
            className="w-full sm:w-auto border border-white/10 px-8 py-4 rounded-md font-bold hover:bg-white/5 transition-all"
          >
            Stay Update
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="group">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:border-white/20 transition-colors">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Ultra Fast</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Built on Vite and Express for instantaneous interaction. Share updates the moment they happen.
            </p>
          </div>

          <div className="group">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:border-white/20 transition-colors">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Private & Secure</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Authentication powered by Supabase. Your data is encrypted and protected by modern standards.
            </p>
          </div>

          <div className="group">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:border-white/20 transition-colors">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Global Feed</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Connect with developers across the globe. Follow progress, learn new tech, and find collaborators.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-zinc-600 text-sm">
        <p>&copy; 2026 DevConnect. Built for builders.</p>
      </footer>
    </div>
  );
}
