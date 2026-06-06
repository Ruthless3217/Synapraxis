import React from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { Flame, Sparkles, GraduationCap } from 'lucide-react';

interface TopNavProps {
  onNavigateHome: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onNavigateHome }) => {
  const { streak, xp, currentLesson, provider, setProvider, viewMode, setViewMode, logout } = useLessonStore();

  const handleLogoClick = () => {
    setViewMode('home');
    onNavigateHome();
  };

  return (
    <nav className="h-16 border-b border-border-custom bg-surface px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm select-none">
      {/* Logo & Navigation */}
      <div className="flex items-center gap-6">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <GraduationCap size={22} className="stroke-[2.5]" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-ink hover:text-primary transition-colors">
            Synapraxis<span className="text-primary font-sans font-extrabold ml-0.5">.ai</span>
          </span>
        </div>

        {/* Global Navigation Links */}
        <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-border-custom/55 mb-0 shadow-sm">
          <button
            onClick={() => setViewMode('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'home' 
                ? 'bg-surface text-primary shadow-sm border border-border-custom/55' 
                : 'text-muted hover:text-ink font-semibold'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'dashboard' 
                ? 'bg-surface text-primary shadow-sm border border-border-custom/55' 
                : 'text-muted hover:text-ink font-semibold'
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Middle Tab Indicator */}
      {currentLesson && (
        <div 
          onClick={() => setViewMode('lesson')}
          className="hidden md:flex items-center gap-2 bg-canvas px-4 py-1.5 rounded-full border border-border-custom text-sm font-medium text-ink2 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
          title="Click to resume active lesson"
        >
          <span className="text-primary">{currentLesson.emoji}</span>
          <span className="truncate max-w-[200px]">{currentLesson.title}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-accent"></span>
          <span className="text-xs text-muted font-normal">{currentLesson.level}</span>
        </div>
      )}

      {/* Right Stats Dashboard */}
      <div className="flex items-center gap-4">
        {/* LLM Provider Selector */}
        <div className="flex items-center gap-1.5 bg-canvas border border-border-custom px-3 py-1.5 rounded-xl text-xs font-semibold text-ink shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <span className="text-muted font-semibold">Tutor:</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer text-xs p-0 focus:ring-0"
          >
            <option value="gemini" className="bg-surface text-ink">🤖 Gemini</option>
            <option value="groq" className="bg-surface text-ink">⚡ Groq (Llama 3)</option>
            <option value="mistral" className="bg-surface text-ink">🌀 Mistral</option>
            <option value="cohere" className="bg-surface text-ink">🧠 Cohere</option>
            <option value="claude" className="bg-surface text-ink">🔒 Claude</option>
          </select>
        </div>

        {/* XP Points */}
        <div className="flex items-center gap-1.5 bg-primary-light text-primary px-3.5 py-1.5 rounded-full text-sm font-semibold border border-primary/10 shadow-sm">
          <Sparkles size={16} className="fill-primary/25" />
          <span>{xp} XP</span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3.5 py-1.5 rounded-full text-sm font-semibold border border-orange-100 shadow-sm">
          <Flame size={16} className="fill-orange-600/15" />
          <span>{streak} Day Streak</span>
        </div>

        {/* User Badge / Avatar */}
        <button 
          onClick={() => {
            if (window.confirm("Are you sure you want to sign out?")) {
              logout();
            }
          }}
          className="w-9 h-9 rounded-full bg-accent2/25 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm shadow-inner cursor-pointer hover:opacity-85 transition-opacity"
          title="Sign out of Synapraxis"
        >
          YA
        </button>
      </div>
    </nav>
  );
};
