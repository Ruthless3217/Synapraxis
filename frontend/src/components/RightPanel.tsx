import React, { useState, useRef, useEffect } from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { MessageSquare, FileText, BarChart3, Map, Send, FileEdit, Trash2, BrainCircuit, Check } from 'lucide-react';
import { api } from '../config/api';

export const RightPanel: React.FC = () => {
  const {
    currentLesson,
    activeTab,
    setActiveTab,
    tutorChatHistory,
    addChatMessage,
    isChatLoading,
    setChatLoading,
    userNotes,
    setUserNotes,
    completedConcepts,
    score,
    quizSubmitted
  } = useLessonStore();

  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when messages update or loading starts
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorChatHistory, isChatLoading]);

  if (!currentLesson) return null;

  // Handle Tutor Chat Q&A Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const query = inputMessage.trim();
    setInputMessage('');
    addChatMessage('user', query);
    setChatLoading(true);

    try {
      // Map Zustand history to Pydantic ChatMessage format
      const chatHistory = tutorChatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(api.chat.tutor, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_topic: currentLesson.title,
          message: query,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error('Tutor network response was not ok');
      }

      const data = await response.json();
      addChatMessage('assistant', data.reply);
    } catch (err) {
      console.error("Failed to fetch tutor response:", err);
      addChatMessage('assistant', "Sorry, I lost connection to my knowledge base. Could you try asking again in a moment?");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="w-80 border-l border-border-custom bg-surface flex flex-col h-[calc(100vh-4rem)] sticky top-16 right-0 z-30 shrink-0 select-none">
      
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-border-custom bg-canvas/30 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('tutor')}
          className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
            activeTab === 'tutor' 
              ? 'bg-surface text-primary font-bold shadow-sm border border-border-custom/50' 
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <MessageSquare size={16} />
          <span className="text-[10px] mt-1 uppercase tracking-wide">Tutor</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
            activeTab === 'notes' 
              ? 'bg-surface text-primary font-bold shadow-sm border border-border-custom/50' 
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <FileText size={16} />
          <span className="text-[10px] mt-1 uppercase tracking-wide">Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
            activeTab === 'stats' 
              ? 'bg-surface text-primary font-bold shadow-sm border border-border-custom/50' 
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <BarChart3 size={16} />
          <span className="text-[10px] mt-1 uppercase tracking-wide">Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('path')}
          className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
            activeTab === 'path' 
              ? 'bg-surface text-primary font-bold shadow-sm border border-border-custom/50' 
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <Map size={16} />
          <span className="text-[10px] mt-1 uppercase tracking-wide">Path</span>
        </button>
      </div>

      {/* Tab Panels Contents */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        
        {/* TAB 1: TUTOR CHAT */}
        {activeTab === 'tutor' && (
          <div className="flex-1 flex flex-col justify-between min-h-0 bg-canvas/20">
            {/* Chat Messages Frame */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {tutorChatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 px-1">
                    {msg.role === 'user' ? 'Student' : 'Synapraxis'}
                  </span>
                  <div 
                    className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-surface text-ink2 border border-border-custom/80 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {/* Typing Loader animation */}
              {isChatLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1">
                    Synapraxis
                  </span>
                  <div className="p-3.5 bg-surface text-ink2 border border-border-custom/80 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border-custom bg-surface flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask your tutor a question..."
                className="flex-1 bg-canvas border border-border-custom px-3.5 py-2.5 rounded-xl text-xs text-ink outline-none placeholder-muted font-medium focus:border-primary"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/95 transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send size={15} className="fill-white stroke-none translate-x-[1px]" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: NOTES SECTION */}
        {activeTab === 'notes' && (
          <div className="p-4 flex-1 flex flex-col gap-5 justify-between min-h-0 bg-canvas/10">
            {/* Auto Takeaways Frame */}
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-surface border border-border-custom/80 p-4 rounded-xl shadow-sm">
                <h4 className="text-xs font-bold text-ink mb-2.5 flex items-center gap-1.5">
                  <BrainCircuit size={15} className="text-primary" />
                  <span>Auto-Generated Summary</span>
                </h4>
                <ul className="list-disc list-outside pl-4 space-y-1.5 text-xs text-ink2 leading-relaxed">
                  {currentLesson.key_takeaways.map((takeaway, idx) => (
                    <li key={idx}>{takeaway}</li>
                  ))}
                </ul>
              </div>

              {/* Personal Notes TextArea */}
              <div className="flex-1 flex flex-col min-h-[160px]">
                <h4 className="text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
                  <FileEdit size={15} className="text-primary" />
                  <span>My Workspace Notes</span>
                </h4>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Summarize parts in your own words, outline connections, or draft thoughts here..."
                  className="w-full flex-1 min-h-[120px] bg-surface border border-border-custom p-3 rounded-xl text-xs text-ink2 outline-none font-medium placeholder-muted focus:border-primary resize-none shadow-sm"
                />
              </div>
            </div>

            {/* Clear Button */}
            {userNotes.trim() && (
              <button
                onClick={() => setUserNotes('')}
                className="w-full py-2 bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-rose-accent hover:border-rose-accent/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Workspace Notes</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: STATS SECTION */}
        {activeTab === 'stats' && (
          <div className="p-4 space-y-6 flex-1 bg-canvas/10">
            {/* XP and Concepts Completion Card */}
            <div className="bg-surface border border-border-custom p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Concepts Completed</span>
                <span className="font-serif text-2xl font-bold text-ink">
                  {completedConcepts.length} / 4
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-accent/15 flex items-center justify-center text-teal-accent">
                <Check size={20} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Quiz Accuracy */}
            <div className="bg-surface border border-border-custom p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Quiz Accuracy</span>
                <span className="font-serif text-2xl font-bold text-ink">
                  {quizSubmitted ? `${((score / 3) * 100).toFixed(0)}%` : 'No Attempts'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                %
              </div>
            </div>

            {/* Category Bar Chart */}
            <div className="bg-surface border border-border-custom p-4 rounded-xl shadow-sm">
              <h4 className="text-xs font-bold text-ink mb-3.5">Learning Subject Coverage</h4>
              <div className="space-y-3">
                {[
                  { name: 'Science', pct: 85, color: 'bg-primary' },
                  { name: 'Technology', pct: 60, color: 'bg-teal-accent' },
                  { name: 'Mathematics', pct: 30, color: 'bg-gold-accent' },
                  { name: 'History', pct: 15, color: 'bg-rose-accent' }
                ].map((subject, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-ink2">
                      <span>{subject.name}</span>
                      <span>{subject.pct}% Mastery</span>
                    </div>
                    <div className="w-full bg-canvas h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${subject.color}`} 
                        style={{ width: `${subject.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PATH ROADMAP */}
        {activeTab === 'path' && (
          <div className="p-4 space-y-5 flex-1 bg-canvas/10 overflow-y-auto">
            <h4 className="text-xs font-bold text-ink mb-1">Generated Syllabus Flow</h4>
            <p className="text-[10px] text-muted mb-4">5-step roadmap sequenced automatically for this topic.</p>
            
            <div className="relative border-l border-primary/20 ml-2.5 pl-5 space-y-6">
              {[
                { order: 1, topic: 'Foundations & Hook principles', desc: 'Acquire introductory vocabulary and core baseline logic.', status: 'completed' },
                { order: 2, topic: currentLesson.title, desc: 'Your current active deep-dive module.', status: 'active' },
                { order: 3, topic: currentLesson.next_topics[0] || 'Advanced concepts', desc: 'Expand on dynamic applications and edge mechanics.', status: 'pending' },
                { order: 4, topic: currentLesson.next_topics[1] || 'Real world systems', desc: 'Investigate case studies and systemic performance criteria.', status: 'pending' },
                { order: 5, topic: 'Capston Synthesis Project', desc: 'Integrate the 4 concept blocks into a practical demonstration.', status: 'pending' }
              ].map((step, idx) => {
                let dotStyle = "border-primary bg-surface";
                let textStyle = "text-ink2";
                
                if (step.status === 'completed') {
                  dotStyle = "border-teal-accent bg-teal-accent text-white";
                  textStyle = "text-muted line-through decoration-muted/30";
                } else if (step.status === 'active') {
                  dotStyle = "border-primary bg-primary ring-4 ring-primary/10";
                  textStyle = "text-ink font-semibold";
                } else {
                  dotStyle = "border-border-custom bg-surface text-muted";
                  textStyle = "text-muted";
                }

                return (
                  <div key={idx} className="relative group">
                    {/* Circle Connectors */}
                    <span 
                      className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold transition-all ${dotStyle}`}
                    >
                      {step.status === 'completed' && <Check size={8} className="stroke-[4]" />}
                    </span>
                    
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                        Step {step.order}
                      </span>
                      <h5 className={`text-xs leading-normal ${textStyle}`}>
                        {step.topic}
                      </h5>
                      <p className="text-[10px] text-muted leading-relaxed font-sans mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
