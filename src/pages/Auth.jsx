import { useState } from 'react';
import { Github, Mail, Lock, Loader2, Sparkles, Terminal, Code2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setError(`Failed to sign in with ${provider}.`);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-black font-sans text-zinc-100 overflow-hidden">
      
      {/* LEFT PANEL - Visual / Brand */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-black bg-radial-glow relative border-r border-white/10">
        
        {/* Abstract shapes / background elements */}
        <div className="absolute top-0 right-0 p-32 opacity-20 transform rotate-12 blur-3xl pointer-events-none">
          <div className="w-64 h-64 bg-zinc-700 rounded-lg"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-md border border-white/10">
               <Terminal className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-bold tracking-tight text-white font-mono">
               DevConnect
             </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <Code2 className="w-12 h-12 text-zinc-700 mb-6" />
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            Build together. <br/>
            <span className="text-zinc-500">Grow faster.</span>
          </h1>
          <p className="text-lg text-zinc-400">
            Join the ultimate developer ecosystem. Connect with peers, showcase your projects, and iterate on ideas in real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-zinc-500">
           <Sparkles className="w-4 h-4 text-zinc-400 opacity-70" />
           <span>Trusted by 10,000+ developers worldwide</span>
        </div>
      </div>

      {/* RIGHT PANEL - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#0A0A0A] relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
         <div className="absolute top-8 left-8 flex lg:hidden items-center gap-3">
            <div className="p-2 bg-white/10 rounded-md border border-white/10">
               <Terminal className="w-5 h-5 text-white" />
             </div>
             <span className="text-xl font-bold tracking-tight text-white font-mono">
               DevConnect
             </span>
        </div>

        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-zinc-400 text-sm">
              {isLogin 
                ? 'Enter your credentials to access your terminal.' 
                : 'Sign up to start connecting with developers.'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5 pt-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 ml-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500" />
                  </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border border-white/10 text-zinc-200 rounded-md pl-10 pr-4 py-3 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-colors placeholder:text-zinc-600"
                      placeholder="you@example.com"
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-zinc-300">Password</label>
                  {isLogin && (
                    <a href="#" className="text-xs text-white hover:text-zinc-300 transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500" />
                  </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black border border-white/10 text-zinc-200 rounded-md pl-10 pr-4 py-3 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-colors placeholder:text-zinc-600"
                      placeholder="••••••••"
                    />
                </div>
              </div>
            </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-100 text-zinc-950 font-medium py-2.5 rounded-md hover:bg-white transition-all focus:ring-2 focus:ring-zinc-400 focus:outline-none flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* GitHub OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            className="w-full flex items-center justify-center gap-3 bg-[#0A0A0A] border border-white/10 text-zinc-300 text-sm font-medium py-2.5 rounded-md hover:border-white/20 hover:text-white transition-all"
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="text-white font-medium">Sign up</span></>
              ) : (
                <>Already have an account? <span className="text-white font-medium">Log in</span></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
