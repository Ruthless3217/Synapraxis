import React from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { Flame, Sparkles, GraduationCap } from 'lucide-react';

interface TopNavProps {
  currentView: 'home' | 'lesson';
  onNavigateHome: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentView, onNavigateHome }) => {
  const { streak, xp, currentLesson } = useLessonStore();

  return (
    <nav className="h-16 border-b border-border-custom bg-surface px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Brand Logo */}
      <div 
        onClick={onNavigateHome}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
          <GraduationCap size={22} className="stroke-[2.5]" />
        </div>
        <span className="font-serif text-xl font-bold tracking-tight text-ink hover:text-primary transition-colors">
          Synapraxis<span className="text-primary font-sans font-extrabold ml-0.5">.ai</span>
        </span>
      </div>

      {/* Middle Tab Indicator */}
      {currentView === 'lesson' && currentLesson && (
        <div className="hidden md:flex items-center gap-2 bg-canvas px-4 py-1.5 rounded-full border border-border-custom text-sm font-medium text-ink2">
          <span className="text-primary">{currentLesson.emoji}</span>
          <span className="truncate max-w-[200px]">{currentLesson.title}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-accent"></span>
          <span className="text-xs text-muted font-normal">{currentLesson.level}</span>
        </div>
      )}

      {/* Right Stats Dashboard */}
      <div className="flex items-center gap-4">
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
        <div className="w-9 h-9 rounded-full bg-accent2/25 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm shadow-inner cursor-pointer hover:opacity-85 transition-opacity">
          YA
        </div>
      </div>
    </nav>
  );
};
