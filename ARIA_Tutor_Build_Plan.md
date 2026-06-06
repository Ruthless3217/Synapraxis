# ∞ ARIA TUTOR — AI-Powered Personal Learning Platform
### Phase-by-Phase Build Plan · Master Prompt Guide · Full Feature Spec

---

## 📋 Project Overview

ARIA (Autonomous Review & Intelligence Agent) Tutor is a premium, production-grade AI learning platform that generates fully personalized audio-visual lessons on **any topic** for **any age group**. Built on the Anthropic Claude API, it combines a sleek interactive UI with real-time AI lesson generation, voice narration, quizzes, progress tracking, and a conversational AI tutor.

> **Core Vision:** A single-search, infinite-depth learning platform where any human on Earth can type what they want to learn — and receive a world-class, personalized lesson in under 10 seconds.

---

## ⚙️ Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast HMR, tree-shaking |
| Styling | Tailwind CSS + CSS Variables | Custom design system on top |
| AI Engine | Anthropic Claude API (claude-sonnet-4) | Lesson gen + chat |
| Voice / TTS | Web Speech API → ElevenLabs (Phase 3+) | Progressive upgrade |
| State | Zustand + React Query | Local + server state |
| Backend | Node.js + Express OR Next.js App Router | API routes + SSR |
| Database | PostgreSQL + Prisma ORM | History, streaks, paths |
| Auth | Clerk or NextAuth.js | Google + Magic Link |
| Payments | Stripe | Freemium → Pro |
| Deployment | Vercel + Railway/Supabase | Edge-ready |
| Analytics | PostHog or Mixpanel | Event-driven |

---

## 🗺️ Phase-by-Phase Build Plan

---

### Phase 1 — Core Foundation
**Shell, Search & Lesson Engine · Estimated: 2–3 weeks**

**Goals:** Set up the project skeleton, implement the search UI, and wire the Claude API to generate structured lessons on any topic. By end of Phase 1, a user can type any topic and receive a fully rendered lesson.

**Deliverables:**
- Vite + React 18 + TypeScript project scaffold with ESLint, Prettier, path aliases
- Design system: CSS variables, Sora + DM Serif Display typography, full color palette
- Top navigation: logo, tab switcher (Learn / Explore / Progress), streak badge, avatar
- Left sidebar: recent topics, quick-pick topic chips, daily goal tracker with mini progress bar
- Home screen: hero search bar with animated suggestion pills
- Claude API integration: JSON-structured lesson generation with Zod schema validation
- Lesson renderer: intro block, concept cards (4-up grid), deep-dive callout, real-world example
- Progress bar driven by concept card interactions
- "Learn Next" chips for one-click topic chaining
- Fallback lesson object for API failures — zero blank screens

**Key Technical Decisions:**
- Prompt returns pure JSON (no markdown fences) for safe `JSON.parse()`
- Topic normalization: `toLowerCase().trim()` before cache lookup
- localStorage lesson cache keyed by topic hash (prevents duplicate API calls)
- All lesson rendering is pure React — no `dangerouslySetInnerHTML`

---

### Phase 2 — Interactive Learning Layer
**Video Player, Quiz & AI Chat · Estimated: 2–3 weeks**

**Goals:** Add the AI video player simulation, interactive quiz with real-time feedback, and the right-panel AI tutor chat. The platform becomes fully interactive and conversational.

**Deliverables:**
- AI Video Player card: tutor orb pulse animation, audio waveform, scrubber timeline, play/pause, speed control (0.75× / 1× / 1.25× / 1.5× / 2×)
- Browser TTS (Web Speech API): narrates lesson intro + concept summaries with utterance queue
- Voice sync: highlights active sentence in lesson text while TTS reads it (CSS `mark` + JS position tracking)
- Quiz engine: 3 multiple-choice questions, correct/wrong CSS transitions, per-question explanations, score accumulation
- Right panel — Tutor Chat: live Claude API Q&A mid-lesson, typing indicator animation
- Right panel — Notes: auto-generated key points from lesson JSON + manual note-taking field
- Right panel — Stats: streak count, quiz accuracy %, total learning time, subject breakdown bar chart
- Right panel — Path: 5-step roadmap auto-generated per topic with done/active/pending states
- Bottom Ask ARIA input bar (lesson screen): routes to Tutor Chat tab with context injection

**TTS Implementation:**
```javascript
// Split lesson into utterance queue
const utterances = [lesson.introduction, ...lesson.concepts.map(c => c.desc), lesson.deep_dive];
const queue = utterances.map(text => {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95; u.pitch = 1.0; u.lang = 'en-US';
  return u;
});
queue.forEach((u, i) => { u.onend = () => highlightSection(i + 1); });
speechSynthesis.speak(queue[0]);
```

---

### Phase 3 — Personalization & Auth
**User Profiles, History & Adaptive Learning · Estimated: 2–3 weeks**

**Goals:** User accounts, persistent history, streak tracking, and adaptive difficulty. The platform learns who the user is and tailors every lesson.

**Deliverables:**
- Authentication: Clerk (recommended) with Google + Email magic link
- User profile: name, avatar, age group selector (Kids 6–12 / Teen 13–17 / Adult 18+ / Expert)
- Age-adaptive prompting: system prompt adjusts vocabulary + depth by age group
- Level toggle: Beginner / Intermediate / Advanced injected into lesson prompt at call time
- Learning history: PostgreSQL table storing topic, timestamp, quiz score, duration
- Streak engine: server-side calculation with 1-day grace period freeze mechanic
- Personalized home dashboard: "Continue Learning", "Recommended For You", "Review Due"
- Spaced repetition scheduler: flag lessons for review at 1d / 3d / 7d / 14d intervals
- Subject auto-tagging: Claude returns `subject_tag` field in JSON (Science / Math / History / etc.)

**Core Database Schema:**
```sql
-- users
id UUID PK, name TEXT, email TEXT UNIQUE, age_group TEXT, level TEXT, avatar_url TEXT, created_at TIMESTAMP

-- lessons
id UUID PK, user_id UUID FK, topic TEXT, subject_tag TEXT, level TEXT,
json_content JSONB, duration_seconds INT, created_at TIMESTAMP

-- quiz_attempts
id UUID PK, lesson_id UUID FK, user_id UUID FK, score INT, answers JSONB, created_at TIMESTAMP

-- streaks
id UUID PK, user_id UUID FK, current_streak INT, longest_streak INT, last_activity_date DATE

-- spaced_repetition
id UUID PK, user_id UUID FK, lesson_id UUID FK, next_review_date DATE, interval_days INT
```

---

### Phase 4 — Premium Audio-Visual
**ElevenLabs Voices & Animations · Estimated: 2 weeks**

**Goals:** Upgrade with ElevenLabs premium narration, CSS/Canvas concept animations, and a visual design pass. This is what makes ARIA feel like a $50/month product.

**Deliverables:**
- ElevenLabs streaming TTS: sentence-level audio chunks with natural prosody
- Tutor persona selection: Professor / Coach / Friend / Storyteller / Sage (5+ voices)
- Concept animations: CSS keyframe animations per concept card type (trigger on scroll into view)
- Auto-generated SVG diagrams for science/math topics (Claude generates Mermaid, render client-side)
- Code execution sandbox: Pyodide (Python in WASM) + sandboxed iframe (JS) for running examples inline
- Full dark mode: CSS variable swap + `prefers-color-scheme` detection
- Mobile layout: bottom tab nav, swipe gestures between lesson sections, collapsible sidebar
- PDF export: Puppeteer server-side lesson-to-PDF with cover page and branding
- Anki export: generate `.apkg` flashcard deck from lesson concepts + quiz questions

**ElevenLabs Implementation:**
```javascript
async function streamNarration(text, voiceId) {
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/stream', {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_turbo_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
  });
  // Stream to AudioContext for gapless playback
  const reader = res.body.getReader();
  // ... chunk-by-chunk decode + AudioBufferSourceNode
}
```

---

### Phase 5 — Gamification, Social & Monetization
**XP, Badges, Leaderboards & Stripe · Estimated: 2–3 weeks**

**Goals:** XP engine, badges, leaderboards, study groups, and the Stripe freemium/pro paywall.

**Deliverables:**
- XP system: Lesson Complete (+50 XP), Quiz Perfect (+30 XP), Daily Streak (+20 XP), Note Created (+5 XP)
- 30+ achievement badges: First Lesson, Polymath, Speed Learner, Streak Master, Subject Expert, etc.
- Level-up progression: Bronze → Silver → Gold → Platinum → Diamond (with celebratory animation)
- Global + friend leaderboards: weekly XP rankings, filterable by subject
- Study groups: shared topic rooms, group streaks, member activity feed
- Lesson sharing: public shareable lesson URL (no auth required to view)
- Stripe paywall: Free tier (5 lessons/day, Web Speech TTS) → Pro ($12/mo, unlimited + ElevenLabs + PDF export)
- Referral system: earn 7 Pro days per successful referral
- Admin dashboard: usage heatmap, lesson quality ratings, top topics, cohort retention

---

### Phase 6 — Advanced AI Features
**Multi-Modal & Agents · Estimated: 3–4 weeks**

**Goals:** Image input, document upload, autonomous curriculum agent, and advanced pedagogical modes.

**Deliverables:**
- Image input: upload a photo of a textbook page, diagram, or equation → ARIA explains it (Claude vision)
- Document upload: PDF/DOCX → extract text → generate lesson or Q&A session from content
- Auto-curriculum agent: input a goal ("become a data scientist in 3 months") → 30-lesson auto-syllabus
- Daily briefing agent: 5-min personalized morning digest of recommended topics
- Socratic mode: ARIA asks guiding questions instead of explaining — student discovers the answer
- Debate mode: student defends a thesis, ARIA plays devil's advocate with counterarguments
- Live web search grounding: `web_search` tool call injects current context into lesson for news/recent topics
- Voice input: mic button → Web Speech STT → topic sent to lesson engine (hands-free learning)

---

## 🎯 Feature Priority Matrix

| Feature | Description | Priority |
|---|---|---|
| Lesson generation | Core AI lesson from any topic | **Critical** |
| Audio narration | TTS reads lesson content | **Critical** |
| Interactive quiz | MCQ with instant AI feedback | **Critical** |
| AI tutor chat | Live Q&A mid-lesson | **Critical** |
| User auth + profiles | Persistent identity + history | High |
| Age-adaptive prompting | Scales by age/level | High |
| Learning paths | Auto multi-lesson syllabi | High |
| Dark mode | Theme switching | High |
| PDF + Anki export | Offline lesson access | Medium |
| ElevenLabs voices | Studio-quality narration | Medium |
| XP + badges | Gamification layer | Medium |
| Study groups | Collaborative learning | Medium |
| Image/doc upload | Visual Q&A | Medium |
| Stripe paywall | Monetization | Medium |
| Auto-curriculum agent | AI course builder | Low |
| Socratic / Debate mode | Advanced pedagogy | Low |

---

## 🧠 Master Prompt — Antigravity Edition

> Use these prompts verbatim in your Claude API calls. They are engineered for maximum lesson quality, structural reliability, and pedagogical depth.

---

### SYSTEM PROMPT — Lesson Generation Engine

```
You are ARIA, the world's most knowledgeable and engaging AI tutor. Your teaching style 
combines the clarity of Richard Feynman, the warmth of a great mentor, and the precision 
of an Oxford professor. You can teach any topic on Earth — science, history, mathematics, 
art, music, philosophy, programming, languages, finance, fitness, cooking, or anything else 
a human might want to learn.

RESPONSE FORMAT:
You MUST return ONLY valid JSON. No markdown. No backticks. No preamble. No explanation 
outside the JSON object. If the JSON is malformed, the lesson fails entirely — be meticulous.

TEACHING PHILOSOPHY:
- Every lesson must open with a "hook" — something surprising, counterintuitive, or 
  awe-inspiring about the topic that makes the learner lean forward
- The deep_dive must contain at least one fact the user would never have expected
- Concepts must build on each other logically — each one unlocking the next
- Use concrete, vivid language — no abstract filler. Every sentence must teach something.
- The analogy field must make the entire topic click in one sentence (ELI5 quality)

ADAPTIVE DIFFICULTY:
- Kids/Beginner: everyday analogies, zero jargon, simple sentence structure, 
  relatable examples from daily life
- Teen/Intermediate: introduce terminology with immediate definitions, build mental models,
  connect to things they care about (games, social media, sports)
- Adult/Advanced: precise language, acknowledge nuance, reference mechanisms not just outcomes
- Expert: use field-standard terminology, include caveats and edge cases, 
  reference foundational papers or thinkers where relevant

QUALITY GATES — every lesson must pass all of these:
1. Hook is genuinely surprising (not just "X is important because...")  
2. Introduction references the hook naturally
3. All 4 concepts are distinct (no overlap)
4. Deep dive goes beyond what a Wikipedia intro would say
5. Example is concrete and specific (not "X is used in many industries")
6. Quiz questions test understanding, not memorization
7. Next topics flow naturally from the lesson (not random suggestions)
```

---

### USER PROMPT TEMPLATE — Lesson Generation

```
Generate a comprehensive, engaging lesson on: "{TOPIC}"

Learner profile:
- Age group: {AGE_GROUP}   // Kids (6-12) | Teen (13-17) | Adult (18+) | Expert
- Level: {LEVEL}           // Beginner | Intermediate | Advanced
- Language: {LANGUAGE}     // default: English
- Prior lessons on this subject: {PRIOR_COUNT}  // 0 = first time, 5+ = familiar

Return JSON matching EXACTLY this schema (no extra fields, no missing fields):

{
  "title": "string — clean lesson title (not a question)",
  "emoji": "string — single most relevant emoji",
  "subject_tag": "string — one of: Science | Technology | History | Mathematics | Art | Music | Language | Philosophy | Health | Finance | Cooking | Sports | Other",
  "level": "string — Beginner | Intermediate | Advanced",
  "duration": "string — e.g. '8 min read' or '12 min read'",
  "hook": "string — 1 sentence. The most surprising or counterintuitive fact about this topic. Must make the reader go 'wait, really?'",
  "introduction": "string — 2-3 sentences. Must reference the hook in the first or second sentence. Set up why this topic matters.",
  "concepts": [
    {
      "icon": "string — single emoji",
      "name": "string — concept name (2-4 words)",
      "desc": "string — exactly 2 sentences. First sentence: what it is. Second: why it matters or how it connects."
    }
  ],
  // concepts array must have EXACTLY 4 items, building in logical order
  "deep_dive": "string — 3-4 sentences. Go beyond surface level. Include a mechanism, a paradox, an unexpected connection, or a frontier insight.",
  "example_title": "string — short title for the real-world example",
  "example": "string — 2-3 sentences. Specific, named real-world application. Not generic. Name an actual product, person, event, or place.",
  "has_code": "boolean — true ONLY if the topic is programming, data science, algorithms, or web tech",
  "code_snippet": "string — if has_code, a clean 5-15 line runnable example with inline comments. Empty string otherwise.",
  "code_lang": "string — language name if has_code. Empty string otherwise.",
  "analogy": "string — 1 sentence. The best possible ELI5 analogy for the entire topic. Should make someone go 'oh NOW I get it'.",
  "quiz": [
    {
      "question": "string — tests conceptual understanding, not trivia",
      "options": ["string", "string", "string", "string"],
      "correct": "number — 0-3 index of correct answer",
      "explanation": "string — 1-2 sentences explaining why the correct answer is right"
    }
  ],
  // quiz array must have EXACTLY 3 questions, increasing in difficulty
  "key_takeaways": ["string", "string", "string"],
  // exactly 3 items. Each is a complete, standalone insight. No vague phrases like "X is important".
  "next_topics": ["string", "string", "string"],
  // exactly 3 natural follow-on topics the learner should explore next
  "further_reading": "string — one specific book title, article, paper, or resource + 1 sentence on why it's the best next step"
}
```

---

### SYSTEM PROMPT — Tutor Chat (Right Panel Q&A)

```
You are ARIA, a warm, brilliant, and encouraging AI tutor currently teaching a lesson on 
"{CURRENT_TOPIC}". A student has just asked you a question during the lesson.

Your response rules:
1. Maximum 3 sentences — be concise and direct. Students don't want essays.
2. Always anchor your answer to the current lesson topic when relevant.
3. If the concept is abstract, use a micro-analogy (1 sentence max).
4. End with a gentle nudge if the student seems confused: "Does that help? Try thinking of it as..."
5. If the question is off-topic, answer briefly then redirect: "Great question! Interestingly, 
   this actually connects back to {CURRENT_TOPIC} because..."
6. Never say "As an AI..." or "I don't have opinions..." — you ARE ARIA, a tutor, not a chatbot.
7. Be warm but not sycophantic. Don't say "Great question!" every single time.
8. If the student is frustrated, acknowledge it first before answering.

Tone: think of your favorite teacher — the one who made hard things click. Be that person.
```

---

### SYSTEM PROMPT — Learning Path Generator

```
You are ARIA's curriculum architect. Given a learning goal, you generate a structured, 
progressive multi-lesson learning path.

Return ONLY valid JSON with this structure:
{
  "path_name": "string",
  "goal": "string — what the learner will be able to do at the end",
  "total_lessons": "number (5-30)",
  "estimated_weeks": "number",
  "level_progression": "string — e.g. Beginner → Intermediate → Advanced",
  "lessons": [
    {
      "order": "number",
      "topic": "string — exact topic string to pass to lesson generator",
      "why": "string — 1 sentence on why this lesson comes at this point",
      "prerequisite": "string | null — topic name that must be done first"
    }
  ],
  "milestone_projects": [
    {
      "after_lesson": "number",
      "project_name": "string",
      "description": "string — what the learner builds or does to prove mastery"
    }
  ]
}

Constraints:
- Each lesson must be learnable in one ARIA session (8-15 min)
- Progress from foundational → applied → advanced → synthesis
- Include a milestone project every 5-7 lessons
- Lessons should be specific enough to prompt the lesson engine directly (not vague titles)
```

---

## 🚀 Deployment Checklist

### Security
- [ ] `ANTHROPIC_API_KEY` server-side only — never exposed to client
- [ ] Rate limit lesson generation: max 10 requests/min per user IP
- [ ] Zod schema validation on all Claude JSON output before rendering
- [ ] React error boundaries on all AI-generated content components
- [ ] Content Security Policy headers (prevent XSS from injected content)

### Performance
- [ ] Redis lesson cache: key = `sha256(topic + level + age_group)`, TTL = 24h
- [ ] Vercel Edge Functions for lesson streaming (reduce cold start)
- [ ] CDN for audio files (Cloudflare R2 or AWS S3 + CloudFront)
- [ ] React.lazy + Suspense for right panel tabs
- [ ] Lighthouse score > 90: Performance, Accessibility, Best Practices, SEO

### Accessibility
- [ ] WCAG 2.1 AA: all text contrast ratios pass
- [ ] All interactive elements keyboard navigable
- [ ] ARIA labels on icon-only buttons
- [ ] Reduced motion media query for animations
- [ ] Screen reader tested (NVDA + VoiceOver)

### Analytics Events to Track
```
lesson_started       { topic, level, age_group, source }
lesson_completed     { topic, duration_seconds, concepts_completed }
quiz_submitted       { topic, score, question_count }
chat_message_sent    { topic, message_length }
topic_chained        { from_topic, to_topic }
lesson_shared        { topic, share_method }
pro_upgrade          { from_plan, trigger }
streak_milestone     { days, user_id }
```

---

## 💡 Antigravity Master Prompt — Full Platform Build

> Copy this into any AI coding assistant (Claude Code, Cursor, Copilot) to generate the entire ARIA Tutor codebase from scratch.

```
Build ARIA Tutor — a production-grade, premium AI learning platform as a React 18 + 
TypeScript + Vite application. Use Tailwind CSS for styling with a custom CSS variable 
design system (Sora + DM Serif Display fonts, accent #5B4FFF, teal #06D6A0, rose #F43F5E).

ARCHITECTURE:
- /src/components/nav — TopNav with logo, tab switcher, streak badge, avatar
- /src/components/sidebar — LeftSidebar with recent topics, quick chips, daily goal
- /src/components/home — HomeScreen with hero search bar and feature grid
- /src/components/lesson — LessonScreen, VideoPlayer, ConceptGrid, QuizEngine, DeepDive
- /src/components/panel — RightPanel with Tutor/Notes/Stats/Path tabs
- /src/hooks — useLesson, useChat, useProgress, useTTS, useStreak
- /src/api — claude.ts (lesson generation), chat.ts (tutor Q&A)
- /src/store — Zustand store for lesson state, user profile, progress
- /src/types — Full TypeScript interfaces for LessonJSON, UserProfile, QuizAttempt

CLAUDE API INTEGRATION:
- POST to https://api.anthropic.com/v1/messages
- Model: claude-sonnet-4-20250514
- Lesson prompt: returns strict JSON (title, emoji, subject_tag, level, duration, hook, 
  introduction, concepts[4], deep_dive, example, has_code, code_snippet, analogy, 
  quiz[3 with explanation], key_takeaways[3], next_topics[3], further_reading)
- Chat prompt: system injects current topic, returns 2-3 sentence answer
- Zod schema validation on all AI JSON responses
- localStorage cache keyed by sha256(topic+level+ageGroup), TTL 24h
- Fallback lesson object renders if API fails — zero blank screens

UI REQUIREMENTS:
- AI Video Player: tutor orb (pulsing CSS animation), audio waveform (7 bars, wave keyframe), 
  timeline scrubber, play/pause (toggles animation), 5 speed options
- Concept Cards: 2×2 grid, click to mark done, drives progress bar (35% base → 100%)
- Quiz: 3 MCQ, A/B/C/D letter badges, correct=green/wrong=red CSS transition, show explanation
- Right panel tabs: Tutor Chat (typing indicator, message bubbles), Notes (lesson key points), 
  Stats (streak/accuracy/time/subject bars), Path (5-step roadmap with dot connectors)
- Typing indicator: 3 animated dots while Claude API is responding
- Progress bar: top of lesson, updates on concept complete + quiz answer
- Ask ARIA input: bottom of lesson screen, routes to Tutor Chat tab

DESIGN SYSTEM:
- Primary: #5B4FFF (accent), #A78BFA (accent2), #06D6A0 (teal), #F43F5E (rose), #F59E0B (gold)
- Background: #F9F8FF (canvas), #FFFFFF (surface), #F3F2FA (surface2)
- Text: #0F0F13 (ink), #3B3B4F (ink2), #6B6B80 (ink3/muted)
- Border: #E5E3F5, radius 14px (cards), 8px (elements)
- Shadow: 0 2px 16px rgba(91,79,255,0.10)
- All animations use CSS keyframes: orb-pulse, wave, fade-in, shimmer (skeleton)

INTERACTIVITY:
- Sidebar topic chips: click → auto-populate search + start lesson
- Concept card: click marks done → green border + checkmark + progress update
- Quiz option: click → color feedback + disabled + explanation shown + chat notification
- Play button: toggles orb animation + waveform animation + isPlaying state
- Speed button: cycles 0.75× → 1× → 1.25× → 1.5× → 2×
- "Learn Next" chips: click → start new lesson on that topic
- TTS: Web Speech API utterance queue, narrates lesson on load (pauseable)

Make every component fully typed with TypeScript. Use React Query for API state. 
Implement proper loading states (skeleton shimmer), error boundaries, and empty states. 
The app must work without auth in Phase 1 (localStorage only). Design for mobile-first 
with the layout adapting gracefully below 768px.
```

---

*Built by Zeus · ARIA Tutor Platform · 2026*
