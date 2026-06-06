import React from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { Check, Sparkles, AlertCircle, Play, ArrowRight, Lightbulb, Code2 } from 'lucide-react';

interface LessonContentProps {
  onLearnNext: (topic: string) => void;
}

export const LessonContent: React.FC<LessonContentProps> = ({ onLearnNext }) => {
  const {
    currentLesson,
    completedConcepts,
    toggleConcept,
    quizAnswers,
    setQuizAnswer,
    quizSubmitted,
    submitQuiz,
    score,
    currentUtteranceIndex,
    isOrbPlaying
  } = useLessonStore();

  if (!currentLesson) return null;

  // Visual helper to highlight sections synchronized with audio speech
  const isSectionActive = (sectionIndex: number) => {
    return isOrbPlaying && currentUtteranceIndex === sectionIndex;
  };

  const activeSectionBorder = "border-primary ring-2 ring-primary/20 shadow-md shadow-primary/5 bg-primary-light/5";
  const inactiveSectionBorder = "border-border-custom bg-surface";

  return (
    <div className="flex-1 flex flex-col gap-10 max-w-4xl pb-24 select-none">
      
      {/* 1. Hook & Introduction Block */}
      <section 
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          isSectionActive(0) ? activeSectionBorder : inactiveSectionBorder
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-3">
          <Sparkles size={16} />
          <span>INTRODUCTION HOOK</span>
        </div>
        <blockquote className="font-serif text-xl md:text-2xl text-ink font-medium leading-relaxed italic mb-4">
          "{currentLesson.hook}"
        </blockquote>
        <p className="text-sm text-ink2 leading-relaxed font-sans">
          {currentLesson.introduction}
        </p>
      </section>

      {/* 2. Concept Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">Core Concepts</h2>
          <span className="text-xs text-muted font-medium">Click concept cards to check off mastery</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLesson.concepts.map((concept, idx) => {
            const conceptIdx = idx + 1; // Utterance indices 1-4 correspond to concepts
            const isCompleted = completedConcepts.includes(concept.name);
            const isActive = isSectionActive(conceptIdx);
            
            return (
              <div
                key={idx}
                onClick={() => toggleConcept(concept.name)}
                className={`p-5 rounded-2xl border cursor-pointer hover:border-primary/50 transition-all duration-300 relative flex flex-col justify-between h-44 ${
                  isActive ? activeSectionBorder : isCompleted ? 'border-teal-accent/30 bg-teal-accent/5' : inactiveSectionBorder
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{concept.icon}</span>
                    {isCompleted && (
                      <span className="w-5 h-5 rounded-full bg-teal-accent text-white flex items-center justify-center shadow-sm">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base text-ink mb-1.5">{concept.name}</h3>
                  <p className="text-xs text-muted leading-relaxed font-sans">
                    {concept.desc}
                  </p>
                </div>
                
                {/* Visual Audio Wave inside Card if Active */}
                {isActive && (
                  <span className="absolute bottom-4 right-4 text-[10px] font-bold text-primary flex items-center gap-1">
                    <Play size={8} className="fill-primary" /> Audio Playing
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Deep Dive Block */}
      <section 
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          isSectionActive(5) ? activeSectionBorder : inactiveSectionBorder
        }`}
      >
        <h2 className="font-serif text-2xl font-semibold text-ink mb-3">Deep Dive Insights</h2>
        <p className="text-sm text-ink2 leading-relaxed font-sans">
          {currentLesson.deep_dive}
        </p>
      </section>

      {/* 4. Analogy Box */}
      <section className="bg-gradient-to-r from-primary-light/50 to-accent2/10 border border-primary/10 p-6 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
          <Lightbulb size={20} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink mb-1">ELI5 Analogy</h3>
          <p className="text-xs text-ink2 leading-relaxed italic">
            "{currentLesson.analogy}"
          </p>
        </div>
      </section>

      {/* 5. Code Sandbox Snippet (Optional) */}
      {currentLesson.has_code && currentLesson.code_snippet && (
        <section className="border border-border-custom rounded-2xl overflow-hidden bg-zinc-950 text-zinc-100 font-mono text-sm shadow-md">
          <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
            <span className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <Code2 size={14} />
              <span>{currentLesson.code_lang.toUpperCase()} CODE PREVIEW</span>
            </span>
            <span className="text-[10px] font-semibold text-teal-accent">Sandboxed Sandbox Environment</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="text-xs leading-relaxed text-zinc-200">
              <code>{currentLesson.code_snippet}</code>
            </pre>
          </div>
        </section>
      )}

      {/* 6. Real-world Example */}
      <section 
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          isSectionActive(6) ? activeSectionBorder : inactiveSectionBorder
        }`}
      >
        <h3 className="text-xs font-bold text-primary tracking-wider uppercase mb-2">CASE STUDY / EXAMPLE</h3>
        <h2 className="font-serif text-2xl font-semibold text-ink mb-3">{currentLesson.example_title}</h2>
        <p className="text-sm text-ink2 leading-relaxed font-sans">
          {currentLesson.example}
        </p>
      </section>

      {/* 7. Interactive Quiz Engine */}
      <section className="border border-border-custom rounded-2xl p-6 bg-surface shadow-sm">
        <h2 className="font-serif text-2xl font-semibold text-ink mb-1">Concept Evaluation</h2>
        <p className="text-xs text-muted mb-6">Demonstrate your understanding to achieve mastery points.</p>
        
        <div className="flex flex-col gap-8">
          {currentLesson.quiz.map((q, questionIdx) => {
            const selectedOpt = quizAnswers[questionIdx];
            
            return (
              <div key={questionIdx} className="border-b border-border-custom last:border-0 pb-6 last:pb-0">
                <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
                  Question {questionIdx + 1}
                </span>
                <h4 className="font-semibold text-ink2 text-base mb-4 leading-normal">
                  {q.question}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = selectedOpt === optIdx;
                    const isCorrect = optIdx === q.correct;
                    
                    let btnStyle = "border-border-custom bg-surface hover:bg-canvas text-ink2";
                    let badgeStyle = "bg-canvas text-muted border-border-custom";
                    
                    if (quizSubmitted) {
                      if (isCorrect) {
                        btnStyle = "border-teal-accent/30 bg-teal-accent/5 text-teal-accent";
                        badgeStyle = "bg-teal-accent text-white border-none";
                      } else if (isSelected) {
                        btnStyle = "border-rose-accent/30 bg-rose-accent/5 text-rose-accent";
                        badgeStyle = "bg-rose-accent text-white border-none";
                      } else {
                        btnStyle = "border-border-custom bg-surface opacity-60 text-muted";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-primary bg-primary-light/40 text-primary";
                      badgeStyle = "bg-primary text-white border-none";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => !quizSubmitted && setQuizAnswer(questionIdx, optIdx)}
                        disabled={quizSubmitted}
                        className={`p-3.5 border rounded-xl flex items-center gap-3 text-left text-sm font-medium transition-all transition-colors duration-200 cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold border ${badgeStyle}`}>
                          {letters[optIdx]}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question Explanation if Submitted */}
                {quizSubmitted && (
                  <div className="flex gap-2 p-3 bg-canvas/60 border border-border-custom rounded-xl text-xs text-ink2 font-sans mt-3">
                    <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Bar */}
        {!quizSubmitted ? (
          <button
            onClick={submitQuiz}
            disabled={Object.keys(quizAnswers).length < currentLesson.quiz.length}
            className="w-full mt-6 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Submit Answers
          </button>
        ) : (
          <div className="mt-6 p-4 rounded-xl border border-primary/10 bg-primary-light/30 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink2">
              QUIZ SCORE: <strong className="text-primary text-base">{score} / {currentLesson.quiz.length}</strong> Correct
            </span>
            <span className="text-xs font-bold text-teal-accent bg-teal-accent/10 border border-teal-accent/20 px-3 py-1 rounded-full uppercase tracking-wider">
              {score === 3 ? 'Perfect Mastery!' : 'Attempt Logged'}
            </span>
          </div>
        )}
      </section>

      {/* 8. Key Takeaways */}
      <section className="bg-surface border border-border-custom p-6 rounded-2xl shadow-sm">
        <h2 className="font-serif text-2xl font-semibold text-ink mb-4">Key Takeaways</h2>
        <ul className="flex flex-col gap-3">
          {currentLesson.key_takeaways.map((takeaway, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-ink2 font-sans leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                {idx + 1}
              </span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 9. Learn Next Topic Chain */}
      <section>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 block">Topic Chaining (Learn Next)</h3>
        <div className="flex flex-wrap gap-2">
          {currentLesson.next_topics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => onLearnNext(topic)}
              className="bg-primary-light text-primary hover:bg-primary hover:text-white border border-primary/10 rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{topic}</span>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      </section>

      {/* 10. Further Reading */}
      <section className="p-4 bg-canvas border border-border-custom rounded-xl text-xs text-muted leading-relaxed font-sans">
        <strong>Further Reference:</strong> {currentLesson.further_reading}
      </section>

    </div>
  );
};
