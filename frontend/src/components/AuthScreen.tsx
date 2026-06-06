import React, { useState, useEffect } from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { GraduationCap, Sparkles, LogIn, UserPlus, AlertCircle, Loader } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, signup, googleLogin, authLoading, authError, clearAuthError } = useLessonStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear errors when switching views
  useEffect(() => {
    clearAuthError();
    setValidationError(null);
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setValidationError("Please fill out all fields.");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    if (isLogin) {
      await login(emailTrim, password);
    } else {
      await signup(emailTrim, password);
    }
  };

  const handleGoogleLogin = async () => {
    setValidationError(null);
    await googleLogin();
  };

  return (
    <div className="min-h-screen w-full bg-canvas flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Visual Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent2/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-md bg-surface border border-border-custom p-8 rounded-3xl shadow-2xl flex flex-col relative z-10 backdrop-blur-md">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-3.5 transform hover:scale-105 transition-transform duration-300">
            <GraduationCap size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-ink">
            Synapraxis<span className="text-primary font-sans font-black">.ai</span>
          </h1>
          <p className="text-xs text-muted font-medium mt-1 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-primary fill-primary/15" />
            <span>AI-Powered Personal Learning OS</span>
          </p>
        </div>

        {/* Mode Selector Tab */}
        <div className="flex bg-canvas p-1 rounded-2xl border border-border-custom/50 mb-6 relative">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              isLogin 
                ? 'bg-surface text-primary shadow-sm border border-border-custom/55' 
                : 'text-muted hover:text-ink font-semibold'
            }`}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              !isLogin 
                ? 'bg-surface text-primary shadow-sm border border-border-custom/55' 
                : 'text-muted hover:text-ink font-semibold'
            }`}
          >
            <UserPlus size={14} />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Errors Display Box */}
        {(authError || validationError) && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-xs flex gap-2 font-medium mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-normal">{validationError || authError}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-canvas border border-border-custom px-4 py-3 rounded-xl text-xs text-ink outline-none font-medium placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary/20"
              disabled={authLoading}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-canvas border border-border-custom px-4 py-3 rounded-xl text-xs text-ink outline-none font-medium placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary/20"
              disabled={authLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-6 bg-primary text-white font-bold py-3.5 rounded-2xl hover:bg-primary/95 transition-all shadow-md shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            {authLoading ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-border-custom/50"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-muted uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-border-custom/50"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={authLoading}
          className="w-full bg-canvas border border-border-custom text-ink font-bold py-3.5 rounded-2xl hover:bg-canvas/80 transition-all flex items-center justify-center gap-2.5 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Bottom helper */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {isLogin 
              ? "New to Synapraxis? Switch to the Sign Up tab to get started!" 
              : "Already have an account? Switch to Sign In to continue your journey!"}
          </p>
        </div>

      </div>
    </div>
  );
};
