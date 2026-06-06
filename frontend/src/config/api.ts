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
};
