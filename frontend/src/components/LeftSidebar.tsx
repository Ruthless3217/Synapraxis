import React from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { Target, Settings, Compass, History } from 'lucide-react';

interface LeftSidebarProps {
  onSelectTopic: (topic: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onSelectTopic }) => {
  const { 
    ageGroup, 
    userLevel, 
    setUserProfile, 
    completedConcepts
  } = useLessonStore();

  const quickChips = [
    { label: 'Quantum Physics', emoji: '⚛️' },
    { label: 'Stoicism Philosophy', emoji: '🏛️' },
    { label: 'Photosynthesis', emoji: '🌱' },
    { label: 'Python Algorithms', emoji: '🐍' },
    { label: 'Stock Market Basics', emoji: '📈' }
  ];

  const recentTopics = [
    'Machine Learning',
    'French Revolution',
    'Basic Chemistry'
  ];

  // Calculate daily goal progress (mocking that completion of 4 concepts satisfies the daily goal)
  const progressPercent = Math.min((completedConcepts.length / 4) * 100, 100);

  return (
    <aside className="w-64 border-r border-border-custom bg-surface flex flex-col h-[calc(100vh-4rem)] sticky top-16 left-0 z-30 shrink-0 select-none">
      {/* Search Suggestion Chips */}
      <div className="p-4 border-b border-border-custom">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted tracking-wider uppercase mb-3">
          <Compass size={14} />
          <span>Quick Exploration</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTopic(chip.label)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink2 rounded-lg hover:bg-primary-light hover:text-primary transition-colors text-left font-medium"
            >
              <span>{chip.emoji}</span>
              <span className="truncate">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent History */}
      <div className="p-4 border-b border-border-custom flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted tracking-wider uppercase mb-3">
          <History size={14} />
          <span>Recent Lessons</span>
        </div>
        <div className="flex flex-col gap-1">
          {recentTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTopic(topic)}
              className="px-3 py-1.5 text-xs text-muted hover:text-primary transition-colors text-left truncate rounded-md hover:bg-canvas"
            >
              • {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Goal Tracker */}
      <div className="p-4 border-b border-border-custom bg-canvas/30">
        <div className="flex items-center justify-between text-xs font-semibold text-muted mb-2">
          <div className="flex items-center gap-1.5">
            <Target size={14} className="text-primary" />
            <span>Daily Goal</span>
          </div>
          <span>{completedConcepts.length}/4 Concepts</span>
        </div>
        <div className="w-full bg-border-custom h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-muted mt-2 leading-relaxed">
          Complete 4 concept cards today to keep your streak alive!
        </p>
      </div>

      {/* Personalization Profiles Editor */}
      <div className="p-4 bg-canvas/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted tracking-wider uppercase mb-3">
          <Settings size={14} />
          <span>Adaptability Config</span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Age Selector */}
          <div>
            <label className="text-[10px] font-bold text-muted block mb-1">LEARNER GROUP</label>
            <select
              value={ageGroup}
              onChange={(e) => setUserProfile(e.target.value as any, userLevel)}
              className="w-full px-2 py-1.5 text-xs bg-surface border border-border-custom rounded-md font-medium text-ink2 focus:outline-none focus:border-primary"
            >
              <option value="Kids">Kids (6–12 yrs)</option>
              <option value="Teen">Teen (13–17 yrs)</option>
              <option value="Adult">Adult (18+ yrs)</option>
              <option value="Expert">Expert/Professional</option>
            </select>
          </div>

          {/* Level Selector */}
          <div>
            <label className="text-[10px] font-bold text-muted block mb-1">DIFFICULTY LEVEL</label>
            <select
              value={userLevel}
              onChange={(e) => setUserProfile(ageGroup, e.target.value as any)}
              className="w-full px-2 py-1.5 text-xs bg-surface border border-border-custom rounded-md font-medium text-ink2 focus:outline-none focus:border-primary"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
};
