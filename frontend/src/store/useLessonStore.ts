import { create } from 'zustand';
import type { LessonResponse, ChatMessage } from '../types/lesson';
import { api } from '../config/api';

export interface PathStep {
  order: number;
  topic: string;
  desc: string;
  status: 'completed' | 'active' | 'pending';
}

export interface PathResponse {
  id: number;
  title: string;
  query: string;
  steps: PathStep[];
  current_step: number;
}

export interface RecentLesson {
  id: number;
  topic: string;
  title: string;
  emoji: string;
  subject_tag: string;
  level: string;
  duration: string;
  completed_concepts: string[];
  quiz_score: number;
  last_accessed: string;
}

interface LessonState {
  // Core states
  currentTopic: string;
  currentLesson: LessonResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // View mode: 'home' = search/landing, 'lesson' = active classroom, 'dashboard' = general progress dashboard
  viewMode: 'home' | 'lesson' | 'dashboard';
  setViewMode: (mode: 'home' | 'lesson' | 'dashboard') => void;
  
  // Recent user lessons
  recentLessons: RecentLesson[];
  setRecentLessons: (lessons: RecentLesson[]) => void;
  
  // Navigation tabs in right panel
  activeTab: 'tutor' | 'notes' | 'stats' | 'path';
  
  // Lesson progress / completion
  completedConcepts: string[];
  quizAnswers: Record<number, number>;
  quizSubmitted: boolean;
  score: number;
  
  // Right panel chat & notes
  tutorChatHistory: ChatMessage[];
  isChatLoading: boolean;
  userNotes: string;
  
  // Video player & Audio Narration
  isOrbPlaying: boolean;
  playSpeed: number;
  isNarrating: boolean;
  currentUtteranceIndex: number;
  
  // Streak & general stats (synchronized with backend)
  streak: number;
  xp: number;
  dailyConceptsCompleted: number;
  
  // User Profile
  ageGroup: 'Kids' | 'Teen' | 'Adult' | 'Expert';
  userLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  provider: 'gemini' | 'groq' | 'mistral' | 'cohere' | 'claude';
  
  // Custom Learning Paths
  activePath: PathResponse | null;
  allPaths: PathResponse[];
  setActivePath: (path: PathResponse | null) => void;
  setAllPaths: (paths: PathResponse[]) => void;
  
  // Setters & Actions
  setTopic: (topic: string) => void;
  setLesson: (lesson: LessonResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'tutor' | 'notes' | 'stats' | 'path') => void;
  setQuizAnswer: (questionIndex: number, optionIndex: number) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  setChatLoading: (loading: boolean) => void;
  setUserNotes: (notes: string) => void;
  setOrbPlaying: (playing: boolean) => void;
  setPlaySpeed: (speed: number) => void;
  setNarrating: (narrating: boolean) => void;
  setCurrentUtteranceIndex: (index: number) => void;
  setUserProfile: (ageGroup: 'Kids' | 'Teen' | 'Adult' | 'Expert', level: 'Beginner' | 'Intermediate' | 'Advanced') => void;
  setProvider: (provider: 'gemini' | 'groq' | 'mistral' | 'cohere' | 'claude') => void;
  addXP: (amount: number) => void;
  resetLessonState: () => void;
  
  // Async Sync Actions
  fetchProfile: () => Promise<void>;
  toggleConcept: (conceptName: string) => Promise<void>;
  submitQuiz: () => Promise<void>;
  
  // Path Actions
  fetchPaths: () => Promise<void>;
  createLearningPath: (query: string) => Promise<void>;
  completePathStep: (pathId: number, stepOrder: number) => Promise<void>;
  activateLearningPath: (pathId: number) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  // Core states
  currentTopic: '',
  currentLesson: null,
  isLoading: false,
  error: null,
  
  viewMode: 'home',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  recentLessons: [],
  setRecentLessons: (lessons) => set({ recentLessons: lessons }),
  
  // Navigation
  activeTab: 'tutor',
  
  // Progress
  completedConcepts: [],
  quizAnswers: {},
  quizSubmitted: false,
  score: 0,
  
  // Chat & Notes
  tutorChatHistory: [],
  isChatLoading: false,
  userNotes: '',
  
  // Media Player
  isOrbPlaying: false,
  playSpeed: 1.0,
  isNarrating: false,
  currentUtteranceIndex: 0,
  
  // Stats
  streak: 3,
  xp: 170,
  dailyConceptsCompleted: 0,
  
  // Profile
  ageGroup: 'Adult',
  userLevel: 'Beginner',
  provider: 'gemini',
  
  // Paths
  activePath: null,
  allPaths: [],
  setActivePath: (path) => set({ activePath: path }),
  setAllPaths: (paths) => set({ allPaths: paths }),
  
  // Actions
  setTopic: (topic) => set({ currentTopic: topic }),
  setLesson: (lesson) => {
    if (lesson) {
      // If a lesson is set, load its saved completed concepts and quiz score if they exist
      const completed = (lesson as any).completed_concepts || [];
      const score = (lesson as any).quiz_score;
      set({ 
        currentLesson: lesson,
        completedConcepts: completed,
        quizSubmitted: score !== undefined && score !== -1,
        score: score !== undefined && score !== -1 ? score : 0
      });
    } else {
      set({ currentLesson: null });
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setQuizAnswer: (questionIndex, optionIndex) => set((state) => ({
    quizAnswers: { ...state.quizAnswers, [questionIndex]: optionIndex }
  })),
  
  addChatMessage: (role, content) => set((state) => ({
    tutorChatHistory: [...state.tutorChatHistory, { role, content }]
  })),
  
  setChatLoading: (loading) => set({ isChatLoading: loading }),
  setUserNotes: (notes) => set({ userNotes: notes }),
  setOrbPlaying: (playing) => set({ isOrbPlaying: playing }),
  setPlaySpeed: (speed) => set({ playSpeed: speed }),
  setNarrating: (narrating) => set({ isNarrating: narrating }),
  setCurrentUtteranceIndex: (index) => set({ currentUtteranceIndex: index }),
  setUserProfile: (ageGroup, level) => set({ ageGroup, userLevel: level }),
  setProvider: (provider) => set({ provider }),
  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
  
  resetLessonState: () => set(() => ({
    completedConcepts: [],
    quizAnswers: {},
    quizSubmitted: false,
    score: 0,
    tutorChatHistory: [
      { role: 'assistant', content: `Hi! I am Synapraxis, your learning mentor. Ask me any questions you have during today's lesson!` }
    ],
    userNotes: '',
    isOrbPlaying: false,
    isNarrating: false,
    currentUtteranceIndex: 0
  })),
  
  // Sync Actions
  fetchProfile: async () => {
    try {
      const response = await fetch(api.user.profile);
      if (response.ok) {
        const data = await response.json();
        set({
          xp: data.xp,
          streak: data.streak,
          dailyConceptsCompleted: data.daily_concepts_completed,
          recentLessons: data.recent_lessons
        });
        
        // Also fetch active path if one is set
        if (data.active_path_id) {
          const pathRes = await fetch(api.path.detail(data.active_path_id));
          if (pathRes.ok) {
            const pathData = await pathRes.json();
            set({ activePath: pathData });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  },
  
  toggleConcept: async (conceptName) => {
    const { currentTopic, completedConcepts } = get();
    const isCompleted = completedConcepts.includes(conceptName);
    
    // Optimistic UI updates
    const updated = isCompleted 
      ? completedConcepts.filter(name => name !== conceptName)
      : [...completedConcepts, conceptName];
    set({ completedConcepts: updated });
    
    try {
      const response = await fetch(api.user.conceptComplete, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          concept_name: conceptName
        })
      });
      if (response.ok) {
        const data = await response.json();
        set({
          xp: data.xp,
          streak: data.streak,
          dailyConceptsCompleted: data.daily_concepts_completed,
          completedConcepts: data.completed_concepts
        });
        
        // Check if all concepts in current lesson are completed
        const { currentLesson, activePath } = get();
        if (currentLesson && activePath && data.completed_concepts.length === currentLesson.concepts.length) {
          const activeStep = activePath.steps.find(s => s.status === 'active');
          if (activeStep && activeStep.topic.toLowerCase() === currentTopic.toLowerCase()) {
            await get().completePathStep(activePath.id, activeStep.order);
          }
        }
        
        // Refresh profile to get updated recent lessons
        get().fetchProfile();
      }
    } catch (err) {
      console.error("Failed to sync concept completion:", err);
    }
  },
  
  submitQuiz: async () => {
    const { currentLesson, quizAnswers, currentTopic } = get();
    if (!currentLesson) return;
    
    let correctCount = 0;
    currentLesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correctCount++;
      }
    });
    
    set({
      quizSubmitted: true,
      score: correctCount
    });
    
    try {
      const response = await fetch(api.user.quizSubmit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          score: correctCount
        })
      });
      if (response.ok) {
        const data = await response.json();
        set({
          xp: data.xp,
          streak: data.streak
        });
        
        // Refresh profile
        get().fetchProfile();
      }
    } catch (err) {
      console.error("Failed to submit quiz score:", err);
    }
  },
  
  fetchPaths: async () => {
    try {
      const response = await fetch(api.path.all);
      if (response.ok) {
        const data = await response.json();
        set({ allPaths: data });
      }
    } catch (err) {
      console.error("Failed to fetch learning paths:", err);
    }
  },
  
  createLearningPath: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(api.path.generate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          provider: get().provider
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate learning path");
      }
      const data = await response.json();
      set({ 
        activePath: data,
        viewMode: 'lesson' // switch view mode to show path
      });
      
      // Refresh list of paths & profile
      get().fetchPaths();
      get().fetchProfile();
    } catch (err: any) {
      set({ error: err.message || "Failed to generate learning path" });
    } finally {
      set({ isLoading: false });
    }
  },
  
  completePathStep: async (pathId, stepOrder) => {
    try {
      const response = await fetch(api.path.updateStep(pathId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_order: stepOrder,
          status: 'completed'
        })
      });
      if (response.ok) {
        const updatedSteps = await response.json();
        const { activePath } = get();
        if (activePath && activePath.id === pathId) {
          set({
            activePath: {
              ...activePath,
              steps: updatedSteps
            }
          });
        }
        
        // Refresh paths & profile
        get().fetchPaths();
        get().fetchProfile();
      }
    } catch (err) {
      console.error("Failed to complete path step:", err);
    }
  },
  
  activateLearningPath: async (pathId) => {
    try {
      const response = await fetch(api.path.activate(pathId), {
        method: 'POST'
      });
      if (response.ok) {
        const pathRes = await fetch(api.path.detail(pathId));
        if (pathRes.ok) {
          const pathData = await pathRes.json();
          set({ activePath: pathData });
        }
        get().fetchProfile();
      }
    } catch (err) {
      console.error("Failed to activate learning path:", err);
    }
  }
}));
