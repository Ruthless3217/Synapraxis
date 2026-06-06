import { create } from 'zustand';
import type { LessonResponse, ChatMessage } from '../types/lesson';
import { api, authFetch } from '../config/api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

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
  // Auth states
  token: string | null;
  isAuthenticated: boolean;
  authError: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;

  // Core states
  currentTopic: string;
  currentLesson: LessonResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // View mode
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
  // Auth Initial State
  token: localStorage.getItem('synapraxis_token'),
  isAuthenticated: localStorage.getItem('synapraxis_token') !== null,
  authError: null,
  authLoading: false,

  clearAuthError: () => set({ authError: null }),

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('synapraxis_token', token);
      set({ 
        token: token, 
        isAuthenticated: true, 
        authLoading: false,
        viewMode: 'home' 
      });
      // Fetch stats immediately
      await get().fetchProfile();
      await get().fetchPaths();
      return true;
    } catch (err: any) {
      // Clean up Firebase error messages if they look like "Firebase: Error (auth/invalid-credential)."
      let errMsg = err.message || 'Failed to login';
      if (errMsg.includes('auth/invalid-credential') || errMsg.includes('auth/user-not-found') || errMsg.includes('auth/wrong-password')) {
        errMsg = 'Incorrect email or password.';
      } else if (errMsg.includes('auth/invalid-email')) {
        errMsg = 'Please enter a valid email address.';
      }
      set({ authError: errMsg, authLoading: false });
      return false;
    }
  },

  signup: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('synapraxis_token', token);
      set({ 
        token: token, 
        isAuthenticated: true, 
        authLoading: false,
        viewMode: 'home'
      });
      // Fetch stats immediately (will return 0 XP, 0 Streak for new user)
      await get().fetchProfile();
      await get().fetchPaths();
      return true;
    } catch (err: any) {
      let errMsg = err.message || 'Failed to sign up';
      if (errMsg.includes('auth/email-already-in-use')) {
        errMsg = 'A user with this email address already exists.';
      } else if (errMsg.includes('auth/weak-password')) {
        errMsg = 'Password is too weak. Must be at least 6 characters.';
      } else if (errMsg.includes('auth/invalid-email')) {
        errMsg = 'Please enter a valid email address.';
      }
      set({ authError: errMsg, authLoading: false });
      return false;
    }
  },

  googleLogin: async () => {
    set({ authLoading: true, authError: null });
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('synapraxis_token', token);
      set({ 
        token: token, 
        isAuthenticated: true, 
        authLoading: false,
        viewMode: 'home' 
      });
      // Fetch stats immediately
      await get().fetchProfile();
      await get().fetchPaths();
      return true;
    } catch (err: any) {
      // Ignore if user closed popup
      if (err.code === 'auth/popup-closed-by-user') {
        set({ authLoading: false });
        return false;
      }
      set({ authError: err.message || 'Failed to sign in with Google', authLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut failed:", err);
    }
    localStorage.removeItem('synapraxis_token');
    set({ 
      token: null, 
      isAuthenticated: false, 
      viewMode: 'home',
      currentLesson: null,
      recentLessons: [],
      activePath: null,
      allPaths: [],
      xp: 0,
      streak: 0,
      dailyConceptsCompleted: 0
    });
  },

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
  
  // Stats - default initial values (will be updated dynamically by fetchProfile)
  streak: 0,
  xp: 0,
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
  
  // Sync Actions via authFetch
  fetchProfile: async () => {
    if (!get().isAuthenticated) return;
    try {
      const response = await authFetch(api.user.profile);
      if (response.ok) {
        const data = await response.json();
        set({
          xp: data.xp,
          streak: data.streak,
          dailyConceptsCompleted: data.daily_concepts_completed,
          recentLessons: data.recent_lessons
        });
        
        if (data.active_path_id) {
          const pathRes = await authFetch(api.path.detail(data.active_path_id));
          if (pathRes.ok) {
            const pathData = await pathRes.json();
            set({ activePath: pathData });
          }
        } else {
          set({ activePath: null });
        }
      } else if (response.status === 401) {
        get().logout();
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
      const response = await authFetch(api.user.conceptComplete, {
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
        
        get().fetchProfile();
      } else if (response.status === 401) {
        get().logout();
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
      const response = await authFetch(api.user.quizSubmit, {
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
        
        get().fetchProfile();
      } else if (response.status === 401) {
        get().logout();
      }
    } catch (err) {
      console.error("Failed to submit quiz score:", err);
    }
  },
  
  fetchPaths: async () => {
    if (!get().isAuthenticated) return;
    try {
      const response = await authFetch(api.path.all);
      if (response.ok) {
        const data = await response.json();
        set({ allPaths: data });
      } else if (response.status === 401) {
        get().logout();
      }
    } catch (err) {
      console.error("Failed to fetch learning paths:", err);
    }
  },
  
  createLearningPath: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(api.path.generate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          provider: get().provider
        })
      });
      if (!response.ok) {
        if (response.status === 401) {
          get().logout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error("Failed to generate learning path");
      }
      const data = await response.json();
      set({ 
        activePath: data,
        viewMode: 'lesson' 
      });
      
      await get().fetchPaths();
      await get().fetchProfile();
    } catch (err: any) {
      set({ error: err.message || "Failed to generate learning path" });
    } finally {
      set({ isLoading: false });
    }
  },
  
  completePathStep: async (pathId, stepOrder) => {
    try {
      const response = await authFetch(api.path.updateStep(pathId), {
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
        
        await get().fetchPaths();
        await get().fetchProfile();
      } else if (response.status === 401) {
        get().logout();
      }
    } catch (err) {
      console.error("Failed to complete path step:", err);
    }
  },
  
  activateLearningPath: async (pathId) => {
    try {
      const response = await authFetch(api.path.activate(pathId), {
        method: 'POST'
      });
      if (response.ok) {
        const pathRes = await authFetch(api.path.detail(pathId));
        if (pathRes.ok) {
          const pathData = await pathRes.json();
          set({ activePath: pathData });
        }
        await get().fetchProfile();
      } else if (response.status === 401) {
        get().logout();
      }
    } catch (err) {
      console.error("Failed to activate learning path:", err);
    }
  }
}));
