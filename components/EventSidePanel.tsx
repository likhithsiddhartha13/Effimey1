
import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent, EventProperty, PropertyType } from '../types';
import { X, Calendar as CalendarIcon, Clock, Repeat, Hash, AlignLeft, Type, Plus, ChevronDown, Trash2, Link as LinkIcon, CheckSquare } from 'lucide-react';
import { generateRRuleString } from '../services/scheduleService';

interface EventSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
  initialEvent: Partial<CalendarEvent>;
}

const PROPERTY_TYPES: { type: PropertyType, label: string, icon: any }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'select', label: 'Select', icon: ChevronDown },
  { type: 'url', label: 'URL', icon: LinkIcon },
  { type: 'status', label: 'Status', icon: CheckSquare },
];

const EventSidePanel: React.FC<EventSidePanelProps> = ({ isOpen, onClose, onSave, onDelete, initialEvent }) => {
  const [event, setEvent] = useState<Partial<CalendarEvent>>(initialEvent);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  
  // Recurrence State
  const [recFreq, setRecFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recInterval, setRecInterval] = useState(1);
  const [recEndDate, setRecEndDate] = useState('');

  useEffect(() => {
    setEvent(initialEvent);
    // Parse existing RRule if editing
    if (initialEvent.rrule) {
        const parts = initialEvent.rrule.split(';');
        const freq = parts.find(p => p.startsWith('FREQ='))?.split('=')[1] as any;
        const interval = parts.find(p => p.startsWith('INTERVAL='))?.split('=')[1];
        if (freq) setRecFreq(freq);
        if (interval) setRecInterval(parseInt(interval));
    } else {
        setRecFreq('WEEKLY');
        setRecInterval(1);
        setRecEndDate('');
    }
  }, [initialEvent, isOpen]);

  const handleSave = () => {
    let rrule = undefined;
    if (event.isRecurring) {
        rrule = generateRRuleString(recFreq, recInterval, recEndDate || undefined);
    }
    onSave({ ...event, rrule });
  };

  const addProperty = (type: PropertyType) => {
    const newProp: EventProperty = {
      id: Date.now().toString(),
      name: type === 'url' ? 'Link' : 'New Property',
      type,
      value: ''
    };
    setEvent(prev => ({
      ...prev,
      properties: [...(prev.properties || []), newProp]
    }));
    setIsPropertyMenuOpen(false);
  };

  const updateProperty = (id: string, value: any) => {
    setEvent(prev => ({
      ...prev,
      properties: prev.properties?.map(p => p.id === id ? { ...p, value } : p)
    }));
  };

  const deleteProperty = (id: string) => {
    setEvent(prev => ({
        ...prev,
        properties: prev.properties?.filter(p => p.id !== id)
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-surface-dark shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Top Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex gap-2">
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500"><X size={20} /></button>
            </div>
            <div className="flex gap-2">
                {event.id && (
                    <button onClick={() => onDelete(event.id!)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <Trash2 size={18} />
                    </button>
                )}
                <button onClick={handleSave} className="px-4 py-1.5 bg-brand-red text-white text-sm font-bold rounded-lg hover:bg-brand-burgundy shadow-sm transition-all">
                    Done
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Cover Image Placeholder */}
            <div className="h-40 bg-slate-100 dark:bg-white/5 group relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Add Cover Image
                </div>
            </div>

            <div className="px-12 pb-12 space-y-8">
                {/* Title */}
                <div>
                    <div className="text-4xl mb-4">🗓️</div>
                    <input 
                        type="text" 
                        value={event.title}
                        onChange={(e) => setEvent({...event, title: e.target.value})}
                        placeholder="Event Name"
                        className="text-4xl font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none w-full placeholder-slate-300"
                    />
                </div>

                {/* Properties Grid */}
                <div className="space-y-1">
                    
                    {/* Core: Date */}
                    <div className="flex items-center h-10 group">
                        <div className="w-36 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <CalendarIcon size={16} /> Date
                        </div>
                        <div className="flex-1">
                            <input 
                                type="date" 
                                value={event.date}
                                onChange={(e) => setEvent({...event, date: e.target.value})}
                                className="bg-transparent text-sm text-slate-800 dark:text-white border-none outline-none hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 rounded"
                            />
                        </div>
                    </div>

                    {/* Core: Time & Duration */}
                    <div className="flex items-center h-10 group">
                        <div className="w-36 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <Clock size={16} /> Time
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <input 
                                type="time" 
                                value={event.time}
                                onChange={(e) => setEvent({...event, time: e.target.value})}
                                className="bg-transparent text-sm text-slate-800 dark:text-white border-none outline-none hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 rounded"
                            />
                            <span className="text-slate-400 text-xs">for</span>
                            <input 
                                type="number"
                                value={event.durationMinutes}
                                onChange={(e) => setEvent({...event, durationMinutes: parseInt(e.target.value)})}
                                className="w-16 bg-transparent text-sm text-slate-800 dark:text-white border-none outline-none hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 rounded"
                            />
                            <span className="text-slate-400 text-xs">min</span>
                        </div>
                    </div>

                    {/* Core: Type */}
                    <div className="flex items-center h-10 group">
                        <div className="w-36 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <Hash size={16} /> Type
                        </div>
                        <div className="flex-1">
                            <select
                                value={event.type}
                                onChange={(e) => setEvent({...event, type: e.target.value as any})}
                                className="bg-transparent text-sm text-slate-800 dark:text-white border-none outline-none hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 rounded cursor-pointer"
                            >
                                <option value="study">Study</option>
                                <option value="class">Class</option>
                                <option value="exam">Exam</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Core: Recurrence */}
                    <div className="flex flex-col group min-h-[40px] justify-center">
                        <div className="flex items-center h-10">
                            <div className="w-36 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                <Repeat size={16} /> Repeat
                            </div>
                            <div className="flex-1">
                                <button 
                                    onClick={() => {
                                        setEvent({...event, isRecurring: !event.isRecurring});
                                        if(!event.isRecurring) setRecurrenceOpen(true);
                                    }}
                                    className={`text-sm px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${event.isRecurring ? 'text-brand-red font-bold' : 'text-slate-400'}`}
                                >
                                    {event.isRecurring ? 'Yes' : 'No'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Recurrence Settings Sub-panel */}
                        {event.isRecurring && (
                            <div className="ml-36 mb-4 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 text-sm animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-400 uppercase font-bold">Frequency</label>
                                        <select value={recFreq} onChange={(e) => setRecFreq(e.target.value as any)} className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded px-2 py-1">
                                            <option value="DAILY">Daily</option>
                                            <option value="WEEKLY">Weekly</option>
                                            <option value="MONTHLY">Monthly</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-slate-400 uppercase font-bold">Interval</label>
                                        <input type="number" min="1" value={recInterval} onChange={(e) => setRecInterval(parseInt(e.target.value))} className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded px-2 py-1" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold">End Date (Optional)</label>
                                    <input type="date" value={recEndDate} onChange={(e) => setRecEndDate(e.target.value)} className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded px-2 py-1" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Properties */}
                    {event.properties?.map(prop => (
                        <div key={prop.id} className="flex items-center h-10 group relative">
                            <div className="w-36 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                {prop.type === 'url' ? <LinkIcon size={16} /> : prop.type === 'status' ? <CheckSquare size={16} /> : <Type size={16} />}
                                <input 
                                    value={prop.name}
                                    onChange={(e) => {
                                        const newProps = event.properties?.map(p => p.id === prop.id ? {...p, name: e.target.value} : p);
                                        setEvent({...event, properties: newProps});
                                    }}
                                    className="bg-transparent border-none outline-none w-24 focus:border-b focus:border-slate-300"
                                />
                            </div>
                            <div className="flex-1">
                                <input 
                                    type="text"
                                    value={prop.value}
                                    onChange={(e) => updateProperty(prop.id, e.target.value)}
                                    className="bg-transparent text-sm text-slate-800 dark:text-white border-none outline-none hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 rounded w-full"
                                    placeholder="Empty"
                                />
                            </div>
                            <button 
                                onClick={() => deleteProperty(prop.id)}
                                className="absolute right-0 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    {/* Add Property Button */}
                    <div className="relative pt-2">
                        <button 
                            onClick={() => setIsPropertyMenuOpen(!isPropertyMenuOpen)}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm py-1"
                        >
                            <Plus size={16} /> Add Property
                        </button>

                        {isPropertyMenuOpen && (
                            <div className="absolute top-8 left-0 w-48 bg-white dark:bg-surface-dark shadow-xl rounded-lg border border-slate-100 dark:border-white/10 overflow-hidden z-20">
                                {PROPERTY_TYPES.map(pt => (
                                    <button
                                        key={pt.type}
                                        onClick={() => addProperty(pt.type)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                                    >
                                        <pt.icon size={16} /> {pt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200 dark:bg-white/10 w-full"></div>

                {/* Rich Content Area */}
                <div>
                    <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                        <AlignLeft size={16} /> Description
                    </div>
                    <textarea 
                        value={event.description || ''}
                        onChange={(e) => setEvent({...event, description: e.target.value})}
                        placeholder="Type something... Markdown is supported."
                        className="w-full h-64 bg-transparent border-none outline-none text-slate-800 dark:text-white text-base leading-relaxed resize-none placeholder-slate-300 font-serif"
                    />
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default EventSidePanel;
