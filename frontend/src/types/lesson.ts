export interface Concept {
  icon: string;
  name: string;
  desc: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LessonResponse {
  title: string;
  emoji: string;
  subject_tag: 'Science' | 'Technology' | 'History' | 'Mathematics' | 'Art' | 'Music' | 'Language' | 'Philosophy' | 'Health' | 'Finance' | 'Cooking' | 'Sports' | 'Other';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  hook: string;
  introduction: string;
  concepts: Concept[];
  deep_dive: string;
  example_title: string;
  example: string;
  has_code: boolean;
  code_snippet: string;
  code_lang: string;
  analogy: string;
  quiz: QuizQuestion[];
  key_takeaways: string[];
  next_topics: string[];
  further_reading: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
