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
      // Added a fake delay since env vars likely missing - mocking success for UI testing
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
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

          <div className="space-y-4">
            <button 
              type="button"
              onClick={() => handleOAuth('github')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black hover:bg-[#111] border border-white/10 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <Github className="w-5 h-5 text-white" />
              Continue with GitHub
            </button>

            <button 
               type="button"
               onClick={() => handleOAuth('google')}
               className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black hover:bg-[#111] border border-white/10 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <svg className="w-5 h-5 text-zinc-300" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Or continue with email</span>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
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

          <div className="text-center mt-8">
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
