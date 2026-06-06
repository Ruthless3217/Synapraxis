/**
 * API Configuration
 * 
 * In development (npm run dev): Vite proxy or direct localhost:8000
 * In production / Docker:       Nginx proxies /api/ to the backend container
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  lesson: {
    generate: (params: Record<string, string>) =>
      `${API_BASE_URL}/api/lesson/generate?${new URLSearchParams(params)}`,
  },
  chat: {
    tutor: `${API_BASE_URL}/api/chat/tutor`,
  },
  user: {
    profile: `${API_BASE_URL}/api/user/profile`,
    conceptComplete: `${API_BASE_URL}/api/user/concept-complete`,
    quizSubmit: `${API_BASE_URL}/api/user/quiz-submit`,
  },
  path: {
    generate: `${API_BASE_URL}/api/path/generate`,
    all: `${API_BASE_URL}/api/path/all`,
    detail: (id: number) => `${API_BASE_URL}/api/path/${id}`,
    updateStep: (id: number) => `${API_BASE_URL}/api/path/${id}/step`,
    activate: (id: number) => `${API_BASE_URL}/api/path/${id}/activate`,
  }
};
