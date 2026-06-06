import React, { useEffect } from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { Flame, Sparkles, BookOpen, Clock, ArrowRight, CheckCircle2, GraduationCap, Map } from 'lucide-react';

interface DashboardScreenProps {
  onSelectTopic: (topic: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onSelectTopic }) => {
  const {
    xp,
    streak,
    dailyConceptsCompleted,
    recentLessons,
    allPaths,
    activePath,
    fetchProfile,
    fetchPaths,
    activateLearningPath,
    setViewMode
  } = useLessonStore();

  useEffect(() => {
    fetchProfile();
    fetchPaths();
  }, []);

  const handleResumeLesson = (topic: string) => {
    onSelectTopic(topic);
  };

  const progressPercent = Math.min((dailyConceptsCompleted / 4) * 100, 100);

  return (
    <div className="w-full max-w-5xl px-6 py-8 space-y-8 select-none">
      
      {/* 1. Welcoming Hero Stat Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total XP Card */}
        <div className="bg-surface border border-border-custom p-6 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shadow-inner">
            <Sparkles size={24} className="fill-primary/20" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-0.5">Total XP Acquired</span>
            <span className="text-3xl font-bold text-ink leading-none">{xp} XP</span>
          </div>
        </div>

        {/* Current Streak Card */}
        <div className="bg-surface border border-border-custom p-6 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
            <Flame size={24} className="fill-orange-600/10" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-0.5">Active Streak</span>
            <span className="text-3xl font-bold text-ink leading-none">{streak} Days</span>
          </div>
        </div>

        {/* Daily Goal Progress Card */}
        <div className="bg-surface border border-border-custom p-6 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-0.5">Daily Goal Progress</span>
              <span className="text-lg font-bold text-ink leading-none">{dailyConceptsCompleted} / 4 Concepts</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-canvas h-2 rounded-full overflow-hidden border border-border-custom/50">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Roadmap/Syllabus Path */}
      {activePath && (
        <div className="bg-surface border border-border-custom rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3.5">
            <Map className="text-primary" size={20} />
            <div>
              <h3 className="font-serif text-lg font-bold text-ink">Active Learning Path</h3>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Structured Roadmap: {activePath.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {activePath.steps.map((step, idx) => {
              let stepStyle = "border-border-custom/75 bg-canvas/30 text-muted";
              let pillStyle = "bg-canvas text-muted-foreground";
              
              if (step.status === 'completed') {
                stepStyle = "border-teal-500/20 bg-teal-500/5 text-ink";
                pillStyle = "bg-teal-500 text-white";
              } else if (step.status === 'active') {
                stepStyle = "border-primary/30 bg-primary-light/10 text-ink ring-2 ring-primary/10";
                pillStyle = "bg-primary text-white";
              }

              return (
                <div 
                  key={idx} 
                  className={`border p-4 rounded-xl flex flex-col justify-between relative transition-all ${stepStyle}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${pillStyle}`}>
                        Step {step.order}
                      </span>
                      {step.status === 'completed' && (
                        <CheckCircle2 size={14} className="text-teal-500" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold leading-snug line-clamp-2">
                      {step.topic}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                      {step.desc}
                    </p>
                  </div>

                  {step.status === 'active' && (
                    <button
                      onClick={() => handleResumeLesson(step.topic)}
                      className="mt-4 w-full py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-primary/15"
                    >
                      <span>Study Now</span>
                      <ArrowRight size={10} />
                    </button>
                  )}

                  {step.status === 'completed' && (
                    <button
                      onClick={() => handleResumeLesson(step.topic)}
                      className="mt-4 w-full py-1.5 bg-teal-500/10 text-teal-600 rounded-lg text-[10px] font-bold hover:bg-teal-500/15 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Review Step</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2.5 All Learning Paths */}
      {allPaths && allPaths.length > 0 && (
        <div className="bg-surface border border-border-custom rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-custom pb-3">
            <Map className="text-primary" size={20} />
            <div>
              <h3 className="font-serif text-lg font-bold text-ink">My Learning Paths</h3>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">All created roadmaps</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPaths.map((path) => {
              const isActive = activePath?.id === path.id;
              const completedStepsCount = path.steps.filter(s => s.status === 'completed').length;
              const pathPct = path.steps.length > 0 ? (completedStepsCount / path.steps.length) * 100 : 0;
              return (
                <div 
                  key={path.id}
                  className={`border p-4 rounded-xl flex flex-col justify-between transition-all ${
                    isActive 
                      ? 'border-primary/40 bg-primary-light/5 shadow-sm' 
                      : 'border-border-custom hover:border-primary/20 bg-surface'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-ink line-clamp-1">{path.title}</h4>
                      {isActive && (
                        <span className="text-[9px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">Roadmap based on: "{path.query}"</p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-muted font-bold uppercase">
                        <span>Progress</span>
                        <span>{completedStepsCount} / {path.steps.length} Steps</span>
                      </div>
                      <div className="w-full bg-canvas h-1.5 rounded-full overflow-hidden border border-border-custom/30">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${pathPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {!isActive && (
                    <button
                      onClick={() => activateLearningPath(path.id)}
                      className="mt-4 w-full py-1.5 bg-canvas hover:bg-border-custom/20 border border-border-custom text-ink rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      Resume Path
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Grid of Past / Recent Lessons */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-bold text-ink border-b border-border-custom pb-2 flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <span>My Learning Vault</span>
        </h3>
        
        {recentLessons.length === 0 ? (
          <div className="bg-surface border border-border-custom p-8 rounded-2xl text-center space-y-3">
            <GraduationCap size={40} className="mx-auto text-muted-foreground stroke-1" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">No Lessons Found</h4>
              <p className="text-xs text-muted max-w-xs mx-auto">Generate a custom syllabus roadmap or search for a single topic to begin your learning journey!</p>
            </div>
            <button
              onClick={() => setViewMode('home')}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all cursor-pointer shadow-md shadow-primary/15"
            >
              Start First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentLessons.map((lesson) => {
              const conceptsPct = (lesson.completed_concepts.length / 4) * 100;
              return (
                <div 
                  key={lesson.id}
                  onClick={() => handleResumeLesson(lesson.topic)}
                  className="bg-surface border border-border-custom p-5 rounded-2xl shadow-sm hover:border-primary/40 transition-all cursor-pointer flex justify-between gap-4 group"
                >
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lesson.emoji}</span>
                        <h4 className="text-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-1">
                          {lesson.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted font-semibold">
                        <span>{lesson.subject_tag}</span>
                        <span>•</span>
                        <span>{lesson.level}</span>
                      </div>
                    </div>

                    {/* Progress tracking details */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-bold text-muted uppercase">
                        <span>Concept Mastery</span>
                        <span>{lesson.completed_concepts.length}/4</span>
                      </div>
                      <div className="w-full bg-canvas h-1.5 rounded-full overflow-hidden border border-border-custom/30">
                        <div 
                          className="bg-teal-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${conceptsPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end shrink-0">
                    <span className="text-[10px] text-muted font-semibold flex items-center gap-1">
                      <Clock size={12} />
                      <span>{lesson.duration}</span>
                    </span>

                    {/* Quiz score indicator */}
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-muted uppercase block">Quiz Score</span>
                      <span className="text-xs font-bold text-ink">
                        {lesson.quiz_score !== -1 ? `${lesson.quiz_score} / 3` : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
