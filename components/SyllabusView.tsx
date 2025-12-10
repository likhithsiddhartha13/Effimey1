
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar as CalendarIcon, 
  MoreHorizontal, 
  FileText, 
  CheckCircle2, 
  CircleDashed,
  Clock,
  Hash,
  AlignLeft,
  Sun,
  Type,
  CheckSquare,
  Layout,
  Wand2
} from 'lucide-react';
import { SyllabusSubject, SyllabusTopic, TopicStatus } from '../types';
import { subscribeToSyllabus, createSubject, updateSubjectTopics, deleteSubject } from '../services/syllabusService';
import { auth } from '../services/firebase';

const STATUS_CONFIG: Record<TopicStatus, { color: string, bg: string }> = {
  'Todo': { 
    color: 'text-red-700 dark:text-red-300', 
    bg: 'bg-red-100 dark:bg-red-900/40' 
  },
  'In Progress': { 
    color: 'text-blue-700 dark:text-blue-300', 
    bg: 'bg-blue-100 dark:bg-blue-900/40' 
  },
  'Done': { 
    color: 'text-emerald-700 dark:text-emerald-300', 
    bg: 'bg-emerald-100 dark:bg-emerald-900/40' 
  },
  'Almost': { 
    color: 'text-purple-700 dark:text-purple-300', 
    bg: 'bg-purple-100 dark:bg-purple-900/40' 
  }
};

const PREDEFINED_SUBJECTS = [
  "English Paper-1",
  "English Paper-2",
  "2L Hindi / Telugu",
  "History & Civics",
  "Geography",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Computer Applications",
  "Commercial Applications",
  "Environmental Science",
  "Home Science",
  "Physical Education"
];

const SyllabusView: React.FC = () => {
  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'board' | 'calendar'>('table');
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToSyllabus(auth.currentUser.uid, (data) => {
        setSubjects(data);
        if (!selectedSubjectId && data.length > 0) {
            setSelectedSubjectId(data[0].id); // Select first by default
        } else if (selectedSubjectId && !data.find(s => s.id === selectedSubjectId)) {
             if (data.length > 0) setSelectedSubjectId(data[0].id);
             else setSelectedSubjectId(null);
        }
    });
    return () => unsubscribe();
  }, [selectedSubjectId]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !auth.currentUser) return;
    try {
        await createSubject(auth.currentUser.uid, newSubjectName);
        setNewSubjectName('');
        setIsAddingSubject(false);
    } catch (e) {
        alert("Failed to create subject");
    }
  };

  const handleInitializeDefaults = async () => {
      if (!auth.currentUser) return;
      setIsInitializing(true);
      try {
          // Create subjects in parallel
          const promises = PREDEFINED_SUBJECTS.map(name => 
              createSubject(auth.currentUser!.uid, name)
          );
          await Promise.all(promises);
      } catch (e) {
          console.error("Failed to initialize subjects", e);
      } finally {
          setIsInitializing(false);
      }
  };

  const handleDeleteSubject = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete this subject and all its progress?")) {
          await deleteSubject(id);
      }
  };

  const handleAddTopic = async () => {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      if (!subject || !newTopicName.trim()) return;

      const newTopic: SyllabusTopic = {
          id: Date.now().toString(),
          title: newTopicName,
          isCompleted: false,
          status: 'Todo',
          doneInSchool: false,
          timeSpent: 0
      };

      const updatedTopics = [...subject.topics, newTopic];
      await updateSubjectTopics(subject.id, updatedTopics);
      setNewTopicName('');
  };

  const handleAddTopicWithStatus = async (status: TopicStatus) => {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      if (!subject) return;

      const newTopic: SyllabusTopic = {
          id: Date.now().toString(),
          title: 'Untitled',
          isCompleted: status === 'Done',
          status: status,
          doneInSchool: false,
          timeSpent: 0
      };

      const updatedTopics = [...subject.topics, newTopic];
      await updateSubjectTopics(subject.id, updatedTopics);
  };

  const updateTopicField = async (topicId: string, field: keyof SyllabusTopic, value: any) => {
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => {
      if (t.id === topicId) {
        const updated = { ...t, [field]: value };
        // Sync isCompleted with status
        if (field === 'status') {
            updated.isCompleted = value === 'Done';
        }
        return updated;
      }
      return t;
    });

    await updateSubjectTopics(subject.id, updatedTopics);
  };

  const cycleStatus = (current: TopicStatus): TopicStatus => {
    const statuses: TopicStatus[] = ['Todo', 'In Progress', 'Done', 'Almost'];
    const idx = statuses.indexOf(current);
    return statuses[(idx + 1) % statuses.length];
  };

  const deleteTopic = async (topicId: string) => {
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;
    const updatedTopics = subject.topics.filter(t => t.id !== topicId);
    await updateSubjectTopics(subject.id, updatedTopics);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-0 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-[#191919] text-xs">
       
       {/* Sidebar: Subject List - Reduced Width */}
       <div className="w-48 bg-slate-50 dark:bg-[#202020] border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0 transition-all duration-300">
            <div className="p-3 flex items-center justify-between group">
                <h2 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Subjects
                </h2>
                <button 
                    onClick={() => setIsAddingSubject(!isAddingSubject)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-all text-slate-400 hover:text-brand-red"
                    title="Add Subject"
                >
                    <Plus size={14} />
                </button>
            </div>

            {isAddingSubject && (
                <div className="px-2 mb-2 animate-in slide-in-from-top-1 space-y-2">
                    <div className="flex gap-1">
                        <input 
                            type="text" 
                            value={newSubjectName} 
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder="Subject Name..."
                            className="flex-1 bg-white dark:bg-[#2C2C2C] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-brand-red dark:text-white"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        />
                    </div>
                    {/* Quick Add Suggestions */}
                    <div className="flex flex-wrap gap-1">
                        {PREDEFINED_SUBJECTS.slice(0, 6).map(sub => (
                            <button
                                key={sub}
                                onClick={() => { setNewSubjectName(sub); handleAddSubject(); }}
                                className="px-1.5 py-0.5 bg-slate-200 dark:bg-white/5 rounded text-[9px] text-slate-600 dark:text-slate-400 hover:bg-brand-red hover:text-white transition-colors"
                            >
                                {sub.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-1 space-y-0.5 custom-scrollbar">
                {subjects.length === 0 && !isAddingSubject && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <div className="p-2 bg-slate-200 dark:bg-white/5 rounded-full mb-2">
                            <BookOpen size={16} className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-[10px] mb-3">No subjects yet.</p>
                        <button 
                            onClick={handleInitializeDefaults}
                            disabled={isInitializing}
                            className="px-3 py-1.5 bg-brand-red text-white text-[10px] font-bold rounded-lg hover:bg-brand-burgundy transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            {isInitializing ? <Clock size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            Auto-Fill Subjects
                        </button>
                    </div>
                )}
                {subjects.map(subject => (
                    <button
                        key={subject.id}
                        onClick={() => setSelectedSubjectId(subject.id)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between group transition-colors ${
                            selectedSubjectId === subject.id 
                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className={`shrink-0 ${selectedSubjectId === subject.id ? 'text-brand-red' : 'opacity-70'}`}>
                                <FileText size={14} />
                            </span>
                            <span className="text-[11px] font-medium truncate">{subject.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                                onClick={(e) => handleDeleteSubject(e, subject.id)}
                                className="hover:text-red-500 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                <Trash2 size={12} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="p-2 border-t border-slate-200 dark:border-white/5">
                <button 
                    onClick={() => setIsAddingSubject(true)} 
                    className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5"
                >
                    <Plus size={12} /> Add Subject
                </button>
            </div>
       </div>

       {/* Main Content: Notion-style Table/Board */}
       <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#191919] relative">
            {selectedSubject ? (
                <>
                    {/* Header / Cover Area - Compact */}
                    <div className="px-4 pt-3 pb-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2 group">
                            <div className="text-xl">📘</div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white group-hover:bg-slate-50 dark:group-hover:bg-white/5 px-1.5 -ml-1.5 rounded transition-colors cursor-text border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                                {selectedSubject.name}
                            </h1>
                        </div>
                        
                        {/* Toolbar - Compact */}
                        <div className="flex items-center justify-between mt-1 border-b border-slate-200 dark:border-white/5 pb-1">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setViewMode('table')}
                                    className={`pb-1 text-[11px] font-medium border-b-[2px] transition-all ${
                                        viewMode === 'table' 
                                        ? 'border-brand-red text-slate-900 dark:text-white' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Table
                                </button>
                                <button 
                                    onClick={() => setViewMode('board')}
                                    className={`pb-1 text-[11px] font-medium border-b-[2px] transition-all ${
                                        viewMode === 'board' 
                                        ? 'border-brand-red text-slate-900 dark:text-white' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Board
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-1 pb-1">
                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-colors">
                                    <Filter size={14} />
                                </button>
                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-colors">
                                    <Search size={14} />
                                </button>
                                <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                                <button 
                                    onClick={() => {
                                        if (viewMode === 'board') {
                                            handleAddTopicWithStatus('Todo');
                                        } else {
                                            // Trigger table input focus? For now just rely on bottom row
                                        }
                                    }}
                                    className="ml-1 px-2.5 py-1 bg-brand-red text-white text-[10px] font-bold rounded-md hover:bg-brand-burgundy transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    New <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table View - Dense */}
                    {viewMode === 'table' && (
                        <div className="flex-1 overflow-auto bg-white dark:bg-[#191919]">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="sticky top-0 bg-white dark:bg-[#191919] z-10 text-[10px] text-slate-500 dark:text-slate-400 font-normal border-b border-slate-200 dark:border-white/5 shadow-sm">
                                    <tr>
                                        <th className="font-normal px-3 py-2 border-r border-slate-100 dark:border-white/5 w-[35%] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <Type size={12} /> Chapter Title
                                            </div>
                                        </th>
                                        <th className="font-normal px-3 py-2 border-r border-slate-100 dark:border-white/5 w-[15%] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <Sun size={12} /> School Status
                                            </div>
                                        </th>
                                        <th className="font-normal px-3 py-2 border-r border-slate-100 dark:border-white/5 w-[15%] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <CircleDashed size={12} /> My Progress
                                            </div>
                                        </th>
                                        <th className="font-normal px-3 py-2 border-r border-slate-100 dark:border-white/5 w-[15%] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon size={12} /> Target Date
                                            </div>
                                        </th>
                                        <th className="font-normal px-3 py-2 border-r border-slate-100 dark:border-white/5 w-[15%] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <AlignLeft size={12} /> Notes
                                            </div>
                                        </th>
                                        <th className="font-normal px-3 py-2 border-r border-slate-100 dark:border-white/5 w-[5%] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <Hash size={12} /> Hrs
                                            </div>
                                        </th>
                                        <th className="px-1 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSubject.topics.map((topic) => (
                                        <tr key={topic.id} className="group border-b border-slate-100 dark:border-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-[11px] text-slate-900 dark:text-slate-100">
                                            
                                            {/* Chapter Title */}
                                            <td className="px-3 py-1 border-r border-slate-100 dark:border-white/[0.02]">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-slate-400 shrink-0" />
                                                    <input 
                                                        type="text"
                                                        value={topic.title}
                                                        onChange={(e) => updateTopicField(topic.id, 'title', e.target.value)}
                                                        className="bg-transparent border-none outline-none font-medium w-full placeholder-slate-400 py-1"
                                                        placeholder="Untitled Chapter"
                                                    />
                                                </div>
                                            </td>

                                            {/* Done In School */}
                                            <td className="px-3 py-1 border-r border-slate-100 dark:border-white/[0.02]">
                                                <button 
                                                    onClick={() => updateTopicField(topic.id, 'doneInSchool', !topic.doneInSchool)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1.5 ${
                                                        topic.doneInSchool 
                                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' 
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                                >
                                                    {topic.doneInSchool ? <CheckCircle2 size={10} /> : <CircleDashed size={10} />}
                                                    {topic.doneInSchool ? 'Completed' : 'Pending'}
                                                </button>
                                            </td>

                                            {/* Status */}
                                            <td className="px-3 py-1 border-r border-slate-100 dark:border-white/[0.02]">
                                                <button 
                                                    onClick={() => updateTopicField(topic.id, 'status', cycleStatus(topic.status || 'Todo'))}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                                        STATUS_CONFIG[topic.status || 'Todo'].bg
                                                    } ${STATUS_CONFIG[topic.status || 'Todo'].color}`}
                                                >
                                                    {topic.status || 'Todo'}
                                                </button>
                                            </td>

                                            {/* Due Date */}
                                            <td className="px-3 py-1 border-r border-slate-100 dark:border-white/[0.02]">
                                                <input 
                                                    type="date"
                                                    value={topic.dueDate || ''}
                                                    onChange={(e) => updateTopicField(topic.id, 'dueDate', e.target.value)}
                                                    className="bg-transparent border-none outline-none text-[10px] text-slate-500 dark:text-slate-400 w-full cursor-pointer hover:text-slate-800 dark:hover:text-white py-1"
                                                />
                                            </td>

                                            {/* Notes */}
                                            <td className="px-3 py-1 border-r border-slate-100 dark:border-white/[0.02]">
                                                <input 
                                                    type="text"
                                                    value={topic.notes || ''}
                                                    onChange={(e) => updateTopicField(topic.id, 'notes', e.target.value)}
                                                    placeholder="Add notes..."
                                                    className="bg-transparent border-none outline-none text-[10px] text-slate-500 dark:text-slate-400 w-full placeholder-slate-300 dark:placeholder-slate-700 py-1"
                                                />
                                            </td>

                                            {/* Time Spent */}
                                            <td className="px-3 py-1 border-r border-slate-100 dark:border-white/[0.02]">
                                                <div className="flex items-center gap-1">
                                                    <input 
                                                        type="number"
                                                        value={topic.timeSpent || 0}
                                                        onChange={(e) => updateTopicField(topic.id, 'timeSpent', parseFloat(e.target.value))}
                                                        className="bg-transparent border-none outline-none text-[10px] text-slate-500 dark:text-slate-400 w-12 text-right py-1"
                                                    />
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-2 py-1 text-center">
                                                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => deleteTopic(topic.id)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {/* New Page Row */}
                                    <tr className="border-b border-slate-100 dark:border-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => {
                                        // Focus the input
                                        const input = document.getElementById('new-topic-input');
                                        if(input) input.focus();
                                    }}>
                                        <td colSpan={7} className="px-3 py-1.5">
                                            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                                <Plus size={14} className="text-slate-400" />
                                                <input 
                                                    id="new-topic-input"
                                                    type="text"
                                                    value={newTopicName}
                                                    onChange={(e) => setNewTopicName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                                                    placeholder="Add a new chapter..."
                                                    className="bg-transparent border-none outline-none text-[11px] font-medium text-slate-500 dark:text-slate-400 w-full py-1 placeholder-slate-400"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Spacer Rows to fill screen if empty */}
                                    {Array.from({ length: Math.max(0, 15 - selectedSubject.topics.length) }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-white/[0.02]">
                                            <td colSpan={7} className="py-3"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Board View - Compact */}
                    {viewMode === 'board' && (
                        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-white dark:bg-[#191919]">
                            <div className="flex h-full gap-4 min-w-max">
                                {(['Todo', 'In Progress', 'Almost', 'Done'] as TopicStatus[]).map(status => (
                                    <div key={status} className="w-56 flex flex-col h-full bg-slate-50 dark:bg-[#202020] rounded-lg border border-slate-200 dark:border-white/5">
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`}>
                                                    {status}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {selectedSubject.topics.filter(t => (t.status || 'Todo') === status).length}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleAddTopicWithStatus(status)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-white/10 rounded transition-colors"><Plus size={12} /></button>
                                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-white/10 rounded transition-colors"><MoreHorizontal size={12} /></button>
                                            </div>
                                        </div>
                                        
                                        {/* Column Content */}
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                            {selectedSubject.topics.filter(t => (t.status || 'Todo') === status).map(topic => (
                                                <div key={topic.id} className="group bg-white dark:bg-[#2C2C2C] p-3 rounded-lg shadow-sm border border-slate-200 dark:border-white/5 hover:border-brand-red/30 dark:hover:border-brand-red/30 hover:shadow-md transition-all relative">
                                                    {/* Card Content */}
                                                    <div className="mb-2">
                                                        <input 
                                                            value={topic.title}
                                                            onChange={(e) => updateTopicField(topic.id, 'title', e.target.value)}
                                                            className="bg-transparent border-none outline-none font-bold text-xs w-full text-slate-800 dark:text-white"
                                                            placeholder="Untitled"
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {topic.dueDate && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-100 dark:border-white/5">
                                                                <CalendarIcon size={10} /> {new Date(topic.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                                            </div>
                                                        )}
                                                        {topic.doneInSchool && (
                                                            <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/30">
                                                                <Sun size={10} /> School
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Notes Preview */}
                                                    {topic.notes && (
                                                        <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-snug">{topic.notes}</p>
                                                    )}

                                                    {/* Hover Actions */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-[#2C2C2C]/90 pl-1 rounded backdrop-blur-sm">
                                                        <button 
                                                            onClick={() => updateTopicField(topic.id, 'status', cycleStatus(topic.status || 'Todo'))} 
                                                            className="p-1 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                                                            title="Next Status"
                                                        >
                                                            <ArrowUpDown size={12} />
                                                        </button>
                                                         <button 
                                                            onClick={() => deleteTopic(topic.id)} 
                                                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                onClick={() => handleAddTopicWithStatus(status)} 
                                                className="w-full py-2 flex items-center justify-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-dashed border-slate-200 dark:border-white/10"
                                            >
                                                <Plus size={12} /> New {status}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-60">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                        <BookOpen size={32} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No Subject Selected</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                        Select a subject from the sidebar to view its syllabus, or create a new one to get started.
                    </p>
                </div>
            )}
       </div>
    </div>
  );
};

export default SyllabusView;