import React from 'react';
import { useLessonStore } from './store/useLessonStore';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { HomeScreen } from './components/HomeScreen';
import { VideoPlayer } from './components/VideoPlayer';
import { LessonContent } from './components/LessonContent';
import { RightPanel } from './components/RightPanel';
import { Sparkles, ArrowLeft, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { api } from './config/api';

export const App: React.FC = () => {
  const {
    currentLesson,
    isLoading,
    error,
    ageGroup,
    userLevel,
    setTopic,
    setLesson,
    setLoading,
    setError,
    resetLessonState
  } = useLessonStore();

  const handleSearchTopic = async (topic: string) => {
    if (!topic.trim()) return;

    setTopic(topic);
    setLoading(true);
    setError(null);
    resetLessonState();

    try {
      const response = await fetch(api.lesson.generate({
        topic: topic,
        level: userLevel,
        age_group: ageGroup,
        language: 'English'
      }));
      if (!response.ok) {
        throw new Error('Failed to generate lesson. Please check backend connection.');
      }

      const data = await response.json();
      setLesson(data);
    } catch (err: any) {
      console.error("Failed to load lesson:", err);
      setError(err.message || 'Failed to generate lesson. Please check that your FastAPI server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateHome = () => {
    setLesson(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans text-ink antialiased">
      {/* 1. Header Navigation */}
      <TopNav 
        currentView={currentLesson ? 'lesson' : 'home'} 
        onNavigateHome={handleNavigateHome} 
      />

      {/* 2. Primary Body Layout */}
      {!currentLesson ? (
        // Land/Search Hero Screen
        <div className="flex-1 flex flex-col items-center justify-center">
          {error && (
            <div className="max-w-md bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-600 text-xs flex gap-2 font-medium mb-4 select-none">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <HomeScreen 
            onSearch={handleSearchTopic} 
            isLoading={isLoading} 
          />
        </div>
      ) : (
        // Split Column Classroom Screen
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Navigation & Customizers */}
          <LeftSidebar onSelectTopic={handleSearchTopic} />

          {/* Middle Classroom Workspace */}
          <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col items-center">
            
            {/* Header Back Button & Lesson Meta */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 select-none">
              <button
                onClick={handleNavigateHome}
                className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Return Home</span>
              </button>

              <div className="flex items-center gap-3.5 text-xs font-bold text-muted">
                <span className="flex items-center gap-1">
                  <BookOpen size={14} className="text-primary/70" />
                  <span>{currentLesson.subject_tag}</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-border-custom"></span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-primary/70" />
                  <span>{currentLesson.duration}</span>
                </span>
              </div>
            </div>

            {/* Central Lesson Body */}
            <div className="w-full max-w-4xl flex flex-col gap-8">
              
              {/* Main Course Title */}
              <div className="select-none">
                <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-ink flex items-center gap-3 mb-2 leading-tight">
                  <span>{currentLesson.title}</span>
                  <span className="text-3xl filter drop-shadow-sm">{currentLesson.emoji}</span>
                </h1>
                <p className="text-sm font-semibold text-primary flex items-center gap-1">
                  <Sparkles size={14} className="fill-primary/10" />
                  <span>Customized for {ageGroup} Group • {userLevel} Complexity</span>
                </p>
              </div>

              {/* simulated Audio Narrative Orb Player */}
              <VideoPlayer />

              {/* Structured text explanation blocks, cards, and quiz */}
              <LessonContent onLearnNext={handleSearchTopic} />

            </div>
          </main>

          {/* Right Panel Tabs (Chat, Notes, Stats, Path) */}
          <RightPanel />

        </div>
      )}
    </div>
  );
};

export default App;
