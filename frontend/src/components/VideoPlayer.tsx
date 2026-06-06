import React, { useEffect, useRef } from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { Play, Pause, RotateCcw, Volume2, FastForward } from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const {
    currentLesson,
    isOrbPlaying,
    playSpeed,
    currentUtteranceIndex,
    setOrbPlaying,
    setPlaySpeed,
    setCurrentUtteranceIndex
  } = useLessonStore();

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    
    // Cleanup speech on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Set up speech utterances when a new lesson is loaded
  useEffect(() => {
    if (!currentLesson || !synthRef.current) return;

    // Cancel any active speech
    synthRef.current.cancel();
    setOrbPlaying(false);
    setCurrentUtteranceIndex(0);

    // Build speech queue:
    // 0: Introduction
    // 1: Concept 1
    // 2: Concept 2
    // 3: Concept 3
    // 4: Concept 4
    // 5: Deep Dive
    // 6: Example
    const speechChunks = [
      currentLesson.introduction,
      ...currentLesson.concepts.map(c => `${c.name}. ${c.desc}`),
      currentLesson.deep_dive,
      `Here is a real-world example: ${currentLesson.example}`
    ];

    utterancesRef.current = speechChunks.map((text, idx) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = playSpeed;
      u.pitch = 1.0;
      u.lang = 'en-US';
      
      u.onstart = () => {
        setCurrentUtteranceIndex(idx);
      };
      
      u.onend = () => {
        if (idx === speechChunks.length - 1) {
          setOrbPlaying(false);
          setCurrentUtteranceIndex(0);
        } else {
          // Play next chunk
          const nextIdx = idx + 1;
          if (utterancesRef.current[nextIdx] && synthRef.current?.speaking) {
            // Re-apply rate just in case it changed mid-playback
            utterancesRef.current[nextIdx].rate = playSpeed;
            synthRef.current.speak(utterancesRef.current[nextIdx]);
          }
        }
      };
      
      u.onerror = (e) => {
        console.error("Speech utterance error:", e);
      };

      return u;
    });
  }, [currentLesson]);

  // Handle speed changes
  useEffect(() => {
    if (!currentLesson) return;
    
    // Update rate for all utterances in queue
    utterancesRef.current.forEach(u => {
      u.rate = playSpeed;
    });

    // If currently speaking, we restart speech at the current index to apply new rate
    if (synthRef.current && synthRef.current.speaking && isOrbPlaying) {
      synthRef.current.cancel();
      // Restart speaking from current index
      const activeIdx = currentUtteranceIndex;
      if (utterancesRef.current[activeIdx]) {
        synthRef.current.speak(utterancesRef.current[activeIdx]);
      }
    }
  }, [playSpeed]);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (!synthRef.current || utterancesRef.current.length === 0) return;

    if (isOrbPlaying) {
      // Pause speech
      synthRef.current.pause();
      setOrbPlaying(false);
    } else {
      setOrbPlaying(true);
      if (synthRef.current.paused) {
        // Resume if paused
        synthRef.current.resume();
      } else {
        // Start from current index
        const activeIdx = currentUtteranceIndex;
        if (utterancesRef.current[activeIdx]) {
          synthRef.current.speak(utterancesRef.current[activeIdx]);
        }
      }
    }
  };

  const handleRestart = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setOrbPlaying(false);
    setCurrentUtteranceIndex(0);
    
    // Play from beginning
    setTimeout(() => {
      setOrbPlaying(true);
      if (utterancesRef.current[0] && synthRef.current) {
        synthRef.current.speak(utterancesRef.current[0]);
      }
    }, 100);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaySpeed(speeds[nextIndex]);
  };

  if (!currentLesson) return null;

  // Visual highlights progress based on the utterance index
  const totalUtterances = utterancesRef.current.length || 7;
  const progressPercent = ((currentUtteranceIndex) / (totalUtterances - 1)) * 100;

  return (
    <div className="bg-surface border border-border-custom rounded-2xl p-6 shadow-sm flex flex-col items-center select-none">
      {/* Waveform Visualization */}
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-ink2 uppercase tracking-wide flex items-center gap-1.5">
          <Volume2 size={15} className="text-primary" />
          <span>Interactive Audio Lecture</span>
        </span>
        {/* Dynamic Waveform Visualizer */}
        <div className="flex gap-1 items-end h-4 w-12">
          {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
            // Stagger animation delays for natural waveform look
            const delay = `${(bar * 0.15).toFixed(2)}s`;
            return (
              <span
                key={bar}
                className="w-1 bg-primary rounded-full origin-bottom"
                style={{
                  height: '100%',
                  animation: isOrbPlaying ? 'var(--animate-wave-bar)' : 'none',
                  animationDelay: delay,
                  transform: isOrbPlaying ? undefined : 'scaleY(0.2)'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Pulsing Orb Frame */}
      <div className="relative w-44 h-44 flex items-center justify-center mb-6">
        {/* Glowing Orb Background */}
        <div 
          className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-accent2 transition-all duration-300"
          style={{
            animation: isOrbPlaying ? 'var(--animate-orb-pulse)' : 'none',
            boxShadow: isOrbPlaying 
              ? '0 0 25px rgba(91,79,255,0.5)' 
              : '0 4px 16px rgba(91,79,255,0.15)'
          }}
        />
        {/* Text over Orb */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-white font-serif text-3xl font-bold filter drop-shadow">
            {currentLesson.emoji}
          </span>
          <span className="text-white/85 text-[10px] font-bold tracking-widest uppercase mt-1 filter drop-shadow">
            {isOrbPlaying ? 'STUDIO' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Scrubber Timeline */}
      <div className="w-full flex flex-col gap-1.5 mb-5">
        <div className="flex justify-between text-[10px] font-bold text-muted">
          <span>SECTION {currentUtteranceIndex + 1} OF {totalUtterances}</span>
          <span>{progressPercent.toFixed(0)}% Read</span>
        </div>
        <div className="w-full bg-border-custom h-1.5 rounded-full overflow-hidden relative">
          <div 
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between w-full">
        {/* Speed Adjustment */}
        <button
          onClick={cycleSpeed}
          className="text-xs font-bold text-primary bg-primary-light border border-primary/10 rounded-lg px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-1 min-w-[70px] justify-center"
        >
          <FastForward size={14} />
          <span>{playSpeed}x</span>
        </button>

        {/* Play Pause Orb */}
        <button
          onClick={handlePlayPause}
          className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md shadow-primary/25 cursor-pointer"
        >
          {isOrbPlaying ? (
            <Pause size={20} className="fill-white stroke-none" />
          ) : (
            <Play size={20} className="fill-white stroke-none translate-x-[1px]" />
          )}
        </button>

        {/* Restart Audio */}
        <button
          onClick={handleRestart}
          className="p-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-canvas"
          title="Restart audio lecture"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};
