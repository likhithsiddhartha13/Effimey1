
import React from 'react';
import { BellOff, Bell } from 'lucide-react';

interface StudyFocusProps {
  isActive: boolean;
  seconds: number;
  onToggle: () => void;
}

const FlipDigit = ({ value, label }: { value: string, label?: string }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-12 h-16 sm:w-14 sm:h-20 bg-[#003366] dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg shadow-lg flex items-center justify-center overflow-hidden perspective-1000 group">
        {/* Top Half Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 border-b border-black/20 z-10 backdrop-blur-[1px]"></div>
        
        {/* Number */}
        <span className="relative z-0 font-mono text-3xl sm:text-4xl font-bold text-white tracking-widest">
          {value}
        </span>

        {/* Side Hinges */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-2 bg-black/40 rounded-r"></div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-2 bg-black/40 rounded-l"></div>
      </div>
      {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>}
    </div>
  );
};

const StudyFocus: React.FC<StudyFocusProps> = ({ isActive, seconds, onToggle }) => {
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  const timeDisplay = formatTime(seconds);

  return (
    <div className={`bg-surface-light dark:bg-surface-dark rounded-[28px] border p-6 flex flex-col h-full relative overflow-hidden transition-all duration-500 ${isActive ? 'border-brand-red shadow-lg shadow-brand-red/10' : 'border-outline-light dark:border-outline-dark'}`}>
      
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-6 shrink-0 z-20 relative">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          Focus Mode
        </h2>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isActive ? 'bg-brand-red/10 text-brand-red' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
            {isActive ? <BellOff size={14} /> : <Bell size={14} />}
            {isActive ? 'Notifications Blocked' : 'Notifications On'}
        </div>
      </div>
      
      {/* Timer Content */}
      <div className="flex-1 flex flex-col items-center justify-center pb-2 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Flip Clock Display */}
        <div className={`flex items-center gap-2 sm:gap-3 mb-8 transition-opacity duration-300 ${isActive || seconds > 0 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
          <FlipDigit value={timeDisplay.h} label="HRS" />
          <span className="text-2xl font-bold text-slate-300 -mt-6">:</span>
          <FlipDigit value={timeDisplay.m} label="MIN" />
          <span className="text-2xl font-bold text-slate-300 -mt-6">:</span>
          <FlipDigit value={timeDisplay.s} label="SEC" />
        </div>

        {/* Toggle Switch */}
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={onToggle}
                className={`relative w-24 h-12 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-red/20 ${
                    isActive ? 'bg-brand-red shadow-lg shadow-brand-red/30' : 'bg-slate-200 dark:bg-white/10'
                }`}
                aria-label="Toggle Focus Mode"
            >
                <div 
                    className={`absolute top-1 left-1 w-10 h-10 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                        isActive ? 'translate-x-12' : 'translate-x-0'
                    }`}
                >
                   {isActive ? (
                       <div className="w-3 h-3 bg-brand-red rounded-full animate-pulse" />
                   ) : (
                       <div className="w-3 h-3 bg-slate-300 rounded-full" />
                   )}
                </div>
            </button>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isActive ? 'Session Active' : 'Start Session'}
            </p>
        </div>
        
      </div>
    </div>
  );
};

export default StudyFocus;