
import React, { useEffect, useState, useCallback } from 'react';
import StatsCard from './StatsCard';
import TaskList from './TaskList';
import StudyFocus from './StudyFocus';
import Schedule from './Schedule';
import { CheckCircle, Quote, AlertCircle } from 'lucide-react';
import { getTaskStats } from '../services/taskService';
import { auth } from '../services/firebase';

interface DashboardViewProps {
  searchQuery?: string;
  focusMode?: {
      isActive: boolean;
      seconds: number;
      toggle: () => void;
  };
}

const DashboardView: React.FC<DashboardViewProps> = ({ searchQuery = '', focusMode }) => {
  const [taskStats, setTaskStats] = useState({
    done: 0,
    pending: 0
  });

  const refreshTaskStats = useCallback(async () => {
    if (auth.currentUser) {
      const tStats = await getTaskStats(auth.currentUser.uid);
      setTaskStats({
        done: tStats.done,
        pending: tStats.pending
      });
    }
  }, []);

  useEffect(() => {
    // Initial Task Stats
    refreshTaskStats();

    // Listen for task updates globally
    const handleTaskUpdate = () => refreshTaskStats();
    window.addEventListener('task-update', handleTaskUpdate);

    return () => {
      window.removeEventListener('task-update', handleTaskUpdate);
    };
  }, [refreshTaskStats]);

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard 
          title="Tasks Done" 
          value={taskStats.done.toString()} 
          trend="Completed" 
          trendUp={true} 
          icon={CheckCircle} 
          colorClass="text-emerald-500" 
        />
        <StatsCard 
          title="Pending Tasks" 
          value={taskStats.pending.toString()} 
          trend="Remaining" 
          trendUp={false} 
          icon={AlertCircle} 
          colorClass="text-amber-500" 
        />
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[minmax(150px,auto)]">
        
        {/* Column 1: Task List */}
        <div className="lg:col-span-1 lg:row-span-2">
          <TaskList searchQuery={searchQuery} />
        </div>
        
        {/* Column 2: Schedule */}
        <div className="lg:col-span-1 lg:row-span-2">
            <Schedule />
        </div>
          
        {/* Column 3: Tools */}
        <div className="lg:col-span-1 lg:row-span-2 flex flex-col gap-6">
           {/* Top Widget - Study Focus */}
           <div className="h-[280px] flex-shrink-0">
             {focusMode ? (
                 <StudyFocus 
                    isActive={focusMode.isActive} 
                    seconds={focusMode.seconds} 
                    onToggle={focusMode.toggle} 
                 />
             ) : (
                 <div className="bg-surface-light dark:bg-surface-dark h-full rounded-[28px] flex items-center justify-center text-slate-400 text-sm">
                     Loading Focus Mode...
                 </div>
             )}
           </div>

           {/* Bottom Widget - Quote */}
           <div className="flex-1 min-h-[180px] relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-br from-brand-red to-brand-burgundy text-white flex flex-col justify-between shadow-xl shadow-brand-red/20 group hover:scale-[1.01] transition-transform duration-300">
             {/* Decorative Background Circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            <Quote className="text-white/40 mb-2 relative z-10" size={40} />
            <div className="relative z-10">
                <blockquote className="text-xl font-medium leading-snug tracking-tight text-white mb-4">
                "The expert in anything was once a beginner."
                </blockquote>
                <div className="flex items-center gap-3">
                    <div className="h-[2px] w-6 bg-white/50 rounded-full"></div>
                    <p className="text-white/90 text-xs font-bold uppercase tracking-widest">Helen Hayes</p>
                </div>
            </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;