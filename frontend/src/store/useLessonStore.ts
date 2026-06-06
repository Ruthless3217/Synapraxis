import { create } from 'zustand';
import type { LessonResponse, ChatMessage } from '../types/lesson';

interface LessonState {
  // Core states
  currentTopic: string;
  currentLesson: LessonResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Navigation
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
  
  // Streak & general stats
  streak: number;
  xp: number;
  
  // User Profile
  ageGroup: 'Kids' | 'Teen' | 'Adult' | 'Expert';
  userLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // LLM Provider selection
  provider: 'gemini' | 'groq' | 'mistral' | 'cohere' | 'claude';
  setProvider: (provider: 'gemini' | 'groq' | 'mistral' | 'cohere' | 'claude') => void;
  
  // Setters & Actions
  setTopic: (topic: string) => void;
  setLesson: (lesson: LessonResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'tutor' | 'notes' | 'stats' | 'path') => void;
  toggleConcept: (conceptName: string) => void;
  setQuizAnswer: (questionIndex: number, optionIndex: number) => void;
  submitQuiz: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  setChatLoading: (loading: boolean) => void;
  setUserNotes: (notes: string) => void;
  setOrbPlaying: (playing: boolean) => void;
  setPlaySpeed: (speed: number) => void;
  setNarrating: (narrating: boolean) => void;
  setCurrentUtteranceIndex: (index: number) => void;
  setUserProfile: (ageGroup: 'Kids' | 'Teen' | 'Adult' | 'Expert', level: 'Beginner' | 'Intermediate' | 'Advanced') => void;
  addXP: (amount: number) => void;
  resetLessonState: () => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  // Core states
  currentTopic: '',
  currentLesson: null,
  isLoading: false,
  error: null,
  
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
  streak: 3, // Initial mock streak
  xp: 120, // Initial mock XP
  
  // Profile
  ageGroup: 'Adult',
  userLevel: 'Beginner',
  provider: 'gemini',
  
  // Actions
  setTopic: (topic) => set({ currentTopic: topic }),
  setLesson: (lesson) => set({ currentLesson: lesson }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setProvider: (provider) => set({ provider }),
  
  toggleConcept: (conceptName) => set((state) => {
    const isCompleted = state.completedConcepts.includes(conceptName);
    const completed = isCompleted 
      ? state.completedConcepts.filter(name => name !== conceptName)
      : [...state.completedConcepts, conceptName];
    
    // Add XP if completed
    const xpReward = !isCompleted ? 10 : 0;
    
    return { 
      completedConcepts: completed,
      xp: state.xp + xpReward
    };
  }),
  
  setQuizAnswer: (questionIndex, optionIndex) => set((state) => ({
    quizAnswers: { ...state.quizAnswers, [questionIndex]: optionIndex }
  })),
  
  submitQuiz: () => set((state) => {
    if (!state.currentLesson) return {};
    
    let correctCount = 0;
    state.currentLesson.quiz.forEach((q, idx) => {
      if (state.quizAnswers[idx] === q.correct) {
        correctCount++;
      }
    });
    
    const isPerfect = correctCount === state.currentLesson.quiz.length;
    const quizXP = (correctCount * 10) + (isPerfect ? 20 : 0);
    
    return {
      quizSubmitted: true,
      score: correctCount,
      xp: state.xp + quizXP
    };
  }),
  
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
  }))
})
);
