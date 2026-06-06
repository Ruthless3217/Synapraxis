import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, Brain, Zap, Headphones, Map } from 'lucide-react';
import { useLessonStore } from '../store/useLessonStore';

interface HomeScreenProps {
  onSearch: (topic: string) => void;
  isLoading: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSearch, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [searchType, setSearchType] = useState<'lesson' | 'path'>('lesson');
  const { createLearningPath } = useLessonStore();

  const suggestions = [
    'How Neural Networks work',
    'Cognitive Behavioral Therapy',
    'History of the Silk Road',
    'Black Hole Physics',
    'Introduction to Cryptography'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      if (searchType === 'path') {
        createLearningPath(topic.trim());
      } else {
        onSearch(topic.trim());
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-8 py-16 bg-gradient-to-b from-canvas via-white to-canvas text-center">
      {/* Title Header */}
      <div className="max-w-3xl mb-6 animate-fade-in">
        <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10 shadow-sm mb-4">
          <Sparkles size={14} className="fill-primary/10 animate-pulse" />
          <span>Next-Generation Personalized Learning OS</span>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-ink mb-6 leading-[1.1]">
          What do you want to <span className="text-primary underline decoration-accent2/30 decoration-wavy underline-offset-8">master</span> today?
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto font-sans leading-relaxed">
          Type any topic in the world. Synapraxis will build a custom course, narrate the concepts, and teach you interactively in seconds.
        </p>
      </div>

      {/* Mode Selector Toggle */}
      <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-border-custom/50 mb-6 select-none shadow-sm">
        <button
          type="button"
          onClick={() => setSearchType('lesson')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            searchType === 'lesson' 
              ? 'bg-surface text-primary shadow-sm border border-border-custom/55' 
              : 'text-muted hover:text-ink font-semibold'
          }`}
        >
          <BookOpen size={13} />
          <span>Single Lesson</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchType('path')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            searchType === 'path' 
              ? 'bg-surface text-primary shadow-sm border border-border-custom/55' 
              : 'text-muted hover:text-ink font-semibold'
          }`}
        >
          <Map size={13} />
          <span>Custom Learning Path</span>
        </button>
      </div>

      {/* Hero Search Bar */}
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-surface rounded-2xl border border-border-custom p-2 flex items-center shadow-xl shadow-primary/5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300 mb-6"
      >
        <div className="pl-3 text-muted">
          <Search size={22} className="stroke-[2]" />
        </div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={searchType === 'lesson' ? "Enter a subject (e.g. quantum physics, stock market...)" : "Enter a broader path query (e.g. Full-Stack Web Development, Data Science...)"}
          className="flex-1 px-3 py-4 text-ink bg-transparent outline-none font-medium placeholder-muted text-base"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="bg-primary text-white font-bold py-3.5 px-7 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <span>{searchType === 'lesson' ? 'Generate Course' : 'Create Path'}</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestion Pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl mb-16">
        <span className="text-xs font-semibold text-muted self-center mr-1">TRY INSTEAD:</span>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setTopic(sug);
              if (searchType === 'path') {
                createLearningPath(sug);
              } else {
                onSearch(sug);
              }
            }}
            disabled={isLoading}
            className="bg-surface hover:bg-primary-light text-ink2 hover:text-primary border border-border-custom rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Feature Selling Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl w-full text-left">
        <div className="bg-surface border border-border-custom p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-teal-accent/10 text-teal-accent rounded-xl flex items-center justify-center mb-4">
            <Brain size={20} className="stroke-[2.5]" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">Adaptive Instruction</h3>
          <p className="text-xs text-muted leading-relaxed">
            Content, wording, and depth adapt in real-time depending on selected age group and level.
          </p>
        </div>

        <div className="bg-surface border border-border-custom p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-primary-light text-primary rounded-xl flex items-center justify-center mb-4">
            <Zap size={20} className="stroke-[2.5]" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">Interactive Concept Grid</h3>
          <p className="text-xs text-muted leading-relaxed">
            Interactive visual blocks map lessons logically. Tick them off to drive your learning progress.
          </p>
        </div>

        <div className="bg-surface border border-border-custom p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-rose-accent/10 text-rose-accent rounded-xl flex items-center justify-center mb-4">
            <Headphones size={20} className="stroke-[2.5]" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">Auditory Narration</h3>
          <p className="text-xs text-muted leading-relaxed">
            Read-aloud summaries simulate private audio lectures, synced to highlighted screen text.
          </p>
        </div>

        <div className="bg-surface border border-border-custom p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-gold-accent/10 text-gold-accent rounded-xl flex items-center justify-center mb-4">
            <BookOpen size={20} className="stroke-[2.5]" />
          </div>
          <h3 className="font-semibold text-ink mb-1.5">AI Mentorship Chat</h3>
          <p className="text-xs text-muted leading-relaxed">
            Stuck on a concept? Interrupt and ask your tutor at any point. Get short, conversational answers.
          </p>
        </div>
      </div>
    </div>
  );
};
