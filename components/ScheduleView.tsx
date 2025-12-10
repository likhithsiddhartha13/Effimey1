
import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, Loader2, ShieldAlert, X, Clock, Calendar as CalendarIcon, Repeat, Trash2, AlignLeft } from 'lucide-react';
import { subscribeToEvents, createEvent, updateEvent, deleteEvent, expandRecurringEvents, generateRRuleString, fetchGoogleCalendarEvents } from '../services/scheduleService';
import { auth } from '../services/firebase';

const ScheduleView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [displayedEvents, setDisplayedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent>>({});
  
  // Recurrence Local State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recFreq, setRecFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recInterval, setRecInterval] = useState(1);
  const [recEndDate, setRecEndDate] = useState('');

  // Navigation State
  const [viewDate, setViewDate] = useState(new Date());

  // Helper to get local YYYY-MM-DD string
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

  // Real-time subscription
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToEvents(auth.currentUser.uid, (data) => {
        setEvents(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Expand Recurring Events when viewDate or events change
  useEffect(() => {
      // Determine view range (Mon to Sun)
      const start = getStartOfWeek(viewDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59);

      // Separate non-recurring and recurring
      const normalEvents = events.filter(e => !e.isRecurring);
      const recurring = events.filter(e => e.isRecurring);

      // Expand recurring
      const expanded = expandRecurringEvents(recurring, start, end);

      // Filter Google Events for this week (although they are fetched by range, simple filter ensures view consistency)
      const visibleGoogleEvents = googleEvents.filter(e => {
          const eDate = new Date(e.date!);
          return eDate >= start && eDate <= end;
      });

      setDisplayedEvents([...normalEvents, ...expanded, ...visibleGoogleEvents]);
  }, [events, googleEvents, viewDate]);

  const handleSyncGoogle = async () => {
      setIsSyncing(true);
      const start = getStartOfWeek(viewDate);
      // Fetch for 1 month around view to have some buffer
      const fetchStart = new Date(start);
      fetchStart.setDate(fetchStart.getDate() - 14);
      const fetchEnd = new Date(start);
      fetchEnd.setDate(fetchEnd.getDate() + 45);

      const gEvents = await fetchGoogleCalendarEvents(fetchStart, fetchEnd);
      if (gEvents.length > 0) {
          setGoogleEvents(gEvents);
      }
      setIsSyncing(false);
  };

  const handleOpenModal = (event?: Partial<CalendarEvent>) => {
      if (event && event.assignedBy === 'admin') {
          alert("This is an official test/event scheduled by your admin. You cannot edit it.");
          return;
      }
      if (event && event.id?.startsWith('gcal_')) {
          const link = event.properties?.find(p => p.id === 'gcal_link')?.value;
          if (link) window.open(link, '_blank');
          else alert("This is a Google Calendar event.");
          return;
      }

      if (event) {
          setSelectedEvent(event);
          // Parse recurrence
          if (event.rrule) {
              setIsRecurring(true);
              const parts = event.rrule.split(';');
              const freq = parts.find(p => p.startsWith('FREQ='))?.split('=')[1] as any;
              const interval = parts.find(p => p.startsWith('INTERVAL='))?.split('=')[1];
              const until = parts.find(p => p.startsWith('UNTIL='))?.split('=')[1];
              
              if (freq) setRecFreq(freq);
              if (interval) setRecInterval(parseInt(interval));
              if (until) {
                  // YYYYMMDD -> YYYY-MM-DD
                  const y = until.substring(0, 4);
                  const m = until.substring(4, 6);
                  const d = until.substring(6, 8);
                  setRecEndDate(`${y}-${m}-${d}`);
              } else {
                  setRecEndDate('');
              }
          } else {
              setIsRecurring(false);
              setRecFreq('WEEKLY');
              setRecInterval(1);
              setRecEndDate('');
          }
      } else {
          // Default new event
          setSelectedEvent({
            title: '',
            date: getLocalDateString(new Date()),
            time: '09:00',
            durationMinutes: 60,
            type: 'study'
          });
          setIsRecurring(false);
          setRecFreq('WEEKLY');
          setRecInterval(1);
          setRecEndDate('');
      }
      setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent.title || !auth.currentUser) return;

    try {
      const payload: any = {
          ...selectedEvent,
          userId: auth.currentUser.uid,
          // Ensure defaults
          time: selectedEvent.time || '09:00',
          durationMinutes: selectedEvent.durationMinutes || 60,
          date: selectedEvent.date || getLocalDateString(new Date()),
      };

      if (isRecurring) {
          payload.isRecurring = true;
          payload.rrule = generateRRuleString(recFreq, recInterval, recEndDate || undefined);
      } else {
          payload.isRecurring = false;
          payload.rrule = null;
      }

      // Handle expanded IDs (editing an instance vs master)
      // For simplicity in this revert, we strip the suffix and update the master
      if (payload.id && payload.id.includes('_')) {
          payload.id = payload.id.split('_')[0];
      }

      if (payload.id) {
        await updateEvent(payload.id, payload);
      } else {
        await createEvent(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save event");
    }
  };

  const handleDeleteEvent = async () => {
      if (!selectedEvent.id) return;
      // Handle expanded IDs
      const masterId = selectedEvent.id.split('_')[0];
      try {
        await deleteEvent(masterId);
        setIsModalOpen(false);
      } catch (error) {
        alert("Failed to delete event");
      }
  };

  // --- Time Logic ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
      if (!loading && scrollRef.current) {
          const hours = new Date().getHours();
          const scrollPos = Math.max(0, (hours * 60) - 100); 
          scrollRef.current.scrollTop = scrollPos;
      }
  }, [loading]);

  const getCurrentTimePosition = () => {
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      return (hours * 60) + minutes;
  };
  const timePosition = getCurrentTimePosition();

  // --- Helpers ---
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const newDate = new Date(d.setDate(diff));
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const getWeekDate = (dayIndex: number) => {
    const startOfWeek = getStartOfWeek(viewDate);
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + dayIndex);
    return d;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
      setViewDate(d);
  };

  const formatTimeLabel = (hour: number) => {
      if (hour === 0) return '12 AM';
      if (hour === 12) return '12 PM';
      return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const getEventStyle = (event: CalendarEvent) => {
    const baseClasses = "absolute inset-x-1 rounded-md p-2 text-xs border border-transparent hover:border-black/10 dark:hover:border-white/20 transition-all cursor-pointer shadow-sm z-10 flex flex-col gap-0.5 overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-red";
    
    if (event.id.startsWith('gcal_')) {
        return `${baseClasses} bg-white border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800`;
    }

    if (event.assignedBy === 'admin') {
         return `${baseClasses} bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800`;
    }

    switch (event.type) {
      case 'class': return `${baseClasses} bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100`;
      case 'study': return `${baseClasses} bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100`;
      case 'exam': return `${baseClasses} bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100`;
      default: return `${baseClasses} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200`;
    }
  };

  const getEventsForDay = (dayIndex: number) => {
      const columnDateStr = getLocalDateString(getWeekDate(dayIndex));
      return displayedEvents.filter(e => e.date === columnDateStr);
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col max-w-full mx-auto bg-white dark:bg-brand-dark overflow-hidden rounded-none lg:rounded-[24px] shadow-sm border border-slate-200 dark:border-white/5">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-brand-dark z-20">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {viewDate.toLocaleString('default', { month: 'long' })} <span className="text-slate-400 font-normal">{viewDate.getFullYear()}</span>
            </h2>
            <div className="flex bg-slate-100 dark:bg-white/5 rounded-md p-0.5">
                <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded shadow-sm transition-all text-slate-600 dark:text-slate-300" aria-label="Previous week"><ChevronLeft size={16} /></button>
                <button onClick={() => setViewDate(new Date())} className="px-3 text-xs font-bold text-slate-600 dark:text-slate-300">Today</button>
                <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded shadow-sm transition-all text-slate-600 dark:text-slate-300" aria-label="Next week"><ChevronRight size={16} /></button>
            </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleSyncGoogle}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-white dark:bg-white/10 text-slate-600 dark:text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/20 transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
            >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <CalendarIcon size={16} />}
                {isSyncing ? 'Syncing...' : 'Sync Google'}
            </button>
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-brand-red text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-brand-burgundy transition-colors shadow-sm"
            >
                <Plus size={16} /> New Event
            </button>
        </div>
      </div>

      {/* Calendar Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Sticky Header: Days */}
        <div className="flex border-b border-slate-100 dark:border-white/5 bg-white dark:bg-brand-dark shrink-0 z-10 pr-[8px]">
            <div className="w-16 shrink-0 border-r border-slate-100 dark:border-white/5"></div>
            <div className="flex-1 grid grid-cols-7">
                {days.map((day, i) => {
                    const dateObj = getWeekDate(i);
                    const isToday = getLocalDateString(dateObj) === getLocalDateString(new Date());
                    
                    return (
                        <div key={day} className={`py-3 text-center border-r border-slate-100 dark:border-white/5 last:border-r-0`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-brand-red' : 'text-slate-400'}`}>
                                {day}
                            </span>
                            <div className="flex justify-center mt-1">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-medium ${isToday ? 'bg-brand-red text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {dateObj.getDate()}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto relative" ref={scrollRef}>
            <div className="flex relative min-h-[1440px]">
                {/* Global Current Time Line */}
                <div 
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${timePosition}px` }}
                >
                    <div className="w-16 shrink-0 flex justify-end pr-2">
                        <span className="text-[10px] font-bold text-brand-red bg-white dark:bg-brand-dark px-1">
                            {currentTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                        </span>
                    </div>
                    <div className="flex-1 h-[2px] bg-brand-red"></div>
                </div>

                {/* Left Time Column */}
                <div className="w-16 shrink-0 border-r border-slate-100 dark:border-white/5 bg-white dark:bg-brand-dark z-10">
                    {times.map(hour => (
                        <div key={hour} className="h-[60px] relative">
                            <span className="absolute -top-2 right-2 text-[10px] text-slate-400 font-medium">
                                {hour !== 0 && formatTimeLabel(hour)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="flex-1 grid grid-cols-7 relative">
                    <div className="absolute inset-0 z-0 flex flex-col pointer-events-none">
                        {times.map(hour => (
                            <div key={hour} className="h-[60px] border-b border-slate-50 dark:border-white/[0.03] w-full"></div>
                        ))}
                    </div>

                    {days.map((day, i) => (
                        <div key={day} className="relative border-r border-slate-50 dark:border-white/[0.03] last:border-r-0 h-full group">
                            {/* Click to Create Slot */}
                            {times.map(hour => (
                                <button 
                                    key={`${day}-${hour}`}
                                    className="h-[60px] w-full block hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors focus:outline-none"
                                    onClick={() => handleOpenModal({
                                        date: getLocalDateString(getWeekDate(i)),
                                        time: `${hour.toString().padStart(2, '0')}:00`,
                                        durationMinutes: 60,
                                        type: 'study'
                                    })}
                                ></button>
                            ))}

                            {/* Render Events */}
                            {getEventsForDay(i).map(event => {
                                const [h, m] = event.time.split(':').map(Number);
                                const startMinutes = h * 60 + m;
                                return (
                                    <button 
                                        key={event.id}
                                        className={getEventStyle(event)}
                                        style={{
                                            top: `${startMinutes}px`,
                                            height: `${event.durationMinutes}px`
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenModal(event);
                                        }}
                                    >
                                        <div className="font-bold truncate text-[11px] leading-tight flex items-center gap-1">
                                            {event.assignedBy === 'admin' && <ShieldAlert size={10} />}
                                            {event.id.startsWith('gcal_') && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded">G</span>}
                                            {event.title}
                                        </div>
                                        {event.durationMinutes >= 45 && (
                                            <div className="opacity-80 text-[10px] truncate">
                                                {event.time} ({event.durationMinutes}m)
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Edit/Create Modal (Standard UI) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-bold text-slate-800 dark:text-white">{selectedEvent.id ? 'Edit Event' : 'New Event'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>

            <div className="p-4 space-y-4">
                <input 
                    type="text" 
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
                    placeholder="Event Title"
                    className="w-full text-lg font-bold bg-transparent border-b border-slate-200 dark:border-white/10 pb-2 outline-none focus:border-brand-red placeholder-slate-300 dark:text-white"
                    autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><CalendarIcon size={12} /> Date</label>
                        <input 
                            type="date" 
                            value={selectedEvent.date}
                            onChange={(e) => setSelectedEvent({...selectedEvent, date: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm dark:text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><AlignLeft size={12} /> Type</label>
                        <select 
                            value={selectedEvent.type}
                            onChange={(e) => setSelectedEvent({...selectedEvent, type: e.target.value as any})}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm dark:text-white outline-none"
                        >
                            <option value="class">Class</option>
                            <option value="study">Study</option>
                            <option value="exam">Exam</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={12} /> Start</label>
                        <input 
                            type="time" 
                            value={selectedEvent.time}
                            onChange={(e) => setSelectedEvent({...selectedEvent, time: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm dark:text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={12} /> Duration (m)</label>
                        <input 
                            type="number" 
                            value={selectedEvent.durationMinutes}
                            onChange={(e) => setSelectedEvent({...selectedEvent, durationMinutes: parseInt(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm dark:text-white outline-none"
                        />
                    </div>
                </div>

                {/* Recurrence Section */}
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Repeat size={14} /> Repeat Event
                        </label>
                        <input 
                            type="checkbox" 
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                        />
                    </div>
                    
                    {isRecurring && (
                        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Frequency</label>
                                <select 
                                    value={recFreq}
                                    onChange={(e) => setRecFreq(e.target.value as any)}
                                    className="w-full text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded px-2 py-1 dark:text-white"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Interval</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={recInterval}
                                    onChange={(e) => setRecInterval(parseInt(e.target.value))}
                                    className="w-full text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded px-2 py-1 dark:text-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">End Date (Optional)</label>
                                <input 
                                    type="date"
                                    value={recEndDate}
                                    onChange={(e) => setRecEndDate(e.target.value)}
                                    className="w-full text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded px-2 py-1 dark:text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/5 flex justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                {selectedEvent.id ? (
                    <button onClick={handleDeleteEvent} className="p-2 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={18} />
                    </button>
                ) : <div></div>}
                
                <div className="flex gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                    <button onClick={handleSaveEvent} className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-burgundy shadow-sm transition-colors">Save</button>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
