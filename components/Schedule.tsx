
import React, { useEffect, useState } from 'react';
import { CalendarEvent } from '../types';
import { ArrowRight, Clock } from 'lucide-react';
import { subscribeToEvents } from '../services/scheduleService';
import { auth } from '../services/firebase';

const Schedule: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Real-time listener ensures dashboard updates instantly when user adds event in ScheduleView
    const unsubscribe = subscribeToEvents(auth.currentUser.uid, (data) => {
        // Filter for today's events
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`;

        const todayEvents = data.filter(e => {
            // Strictly match date
            return e.date === todayDate;
        });
        setEvents(todayEvents.sort((a, b) => a.time.localeCompare(b.time)));
    });

    return () => unsubscribe();
  }, []);

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[28px] h-full flex flex-col overflow-hidden p-6 shadow-sm border border-white/20 dark:border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Up Next</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Today's Timeline</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-4 pr-1">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-8 opacity-60">
              <Clock size={32} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No events scheduled today.</p>
            </div>
          ) : (
            <div className="space-y-3 relative">
                {/* Timeline Line */}
                <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-slate-100 dark:bg-white/10 rounded-full"></div>

                {events.map((event, index) => {
                    let borderClass = 'border-slate-200 dark:border-white/10';
                    let bgClass = 'bg-white dark:bg-slate-800';
                    let dotColor = 'bg-slate-400';
                    
                    if (event.type === 'class') { 
                        dotColor = 'bg-blue-500'; 
                        bgClass = 'bg-blue-50 dark:bg-blue-900/20';
                        borderClass = 'border-blue-100 dark:border-blue-900/30';
                    }
                    if (event.type === 'study') { 
                        dotColor = 'bg-brand-red'; 
                        bgClass = 'bg-red-50 dark:bg-red-900/20';
                        borderClass = 'border-red-100 dark:border-red-900/30';
                    }
                    if (event.type === 'exam') { 
                        dotColor = 'bg-amber-500'; 
                        bgClass = 'bg-amber-50 dark:bg-amber-900/20';
                        borderClass = 'border-amber-100 dark:border-amber-900/30';
                    }
                    if (event.assignedBy === 'admin') { 
                        dotColor = 'bg-purple-500';
                        bgClass = 'bg-purple-50 dark:bg-purple-900/20'; 
                        borderClass = 'border-purple-100 dark:border-purple-900/30';
                    }

                    const endTime = event.endTime || calculateEndTime(event.time, event.durationMinutes);

                    return (
                    <div key={event.id} className="relative flex items-center gap-4 group cursor-pointer pl-4">
                        {/* Dot */}
                        <div className={`absolute left-0 w-3 h-3 rounded-full border-2 border-white dark:border-surface-dark shadow-sm ${dotColor} z-10`}></div>

                        {/* Card */}
                        <div className={`flex-1 p-3 rounded-xl border ${borderClass} ${bgClass} hover:shadow-md transition-all duration-200`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{event.time} - {endTime}</span>
                                <span className="text-[10px] font-medium text-slate-400 opacity-80">{event.durationMinutes}m</span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">{event.title}</h3>
                        </div>
                    </div>
                    );
                })}
            </div>
          )}
      </div>
      
      <button className="mt-3 w-full py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group border border-transparent hover:border-slate-200 dark:hover:border-white/10">
        Full Calendar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default Schedule;
