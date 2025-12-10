
import React, { useState, useEffect } from 'react';
import { Note, User, SUBJECTS } from '../types';
import { 
    Search, Download, FileText, 
    ShieldCheck, X, ExternalLink, Loader2, Users, GraduationCap, LayoutGrid, Bell
} from 'lucide-react';
import { subscribeToAllOfficialSources } from '../services/adminService';

interface WebsiteNotesViewProps {
  searchQuery?: string;
  currentUser?: User;
}

const WebsiteNotesView: React.FC<WebsiteNotesViewProps> = ({ searchQuery = '', currentUser }) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [officialNotes, setOfficialNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('All');
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    // Subscribe to ALL official notes regardless of user class/section
    const unsubscribe = subscribeToAllOfficialSources((notes) => {
        setOfficialNotes(notes);
        setLoading(false);
    });

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDownload = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (note.attachmentUrl) {
        // Create a temporary link to force download or open in new tab
         const element = document.createElement("a");
        element.href = note.attachmentUrl;
        element.target = "_blank"; // Open in new tab mostly for Firebase Storage URLs
        element.download = note.attachmentName || 'download';
        document.body.appendChild(element); 
        element.click();
        document.body.removeChild(element);
    }
  };

  const handleOpenInNewTab = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filter Logic
  const filteredNotes = officialNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = activeSubject === 'All' || note.subject === activeSubject;
    
    return matchesSearch && matchesSubject;
  });

  const isRecent = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Consider items from last 7 days as recent
    } catch (e) {
        return false;
    }
  };

  const recentCount = officialNotes.filter(n => isRecent(n.lastModified)).length;

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Official Course Materials</h3>
            <span className="px-2.5 py-1 bg-brand-light dark:bg-surface-dim rounded-full text-[10px] font-bold text-slate-500 uppercase">Verified</span>
            <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase">
                All Grades
            </span>
        </div>

        {showNotification && recentCount > 0 && (
            <div className="bg-gradient-to-r from-brand-red via-brand-burgundy to-purple-600 p-[1px] rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="bg-white dark:bg-surface-dark rounded-[15px] p-4 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-red/10 text-brand-red rounded-full shrink-0">
                            <Bell size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                                {recentCount} New Resources Added
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Fresh study materials uploaded this week. Look for the <span className="font-bold text-brand-red">NEW</span> badge!
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowNotification(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Compact Subject Navigation / Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
            onClick={() => setActiveSubject('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeSubject === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-red dark:hover:border-brand-red hover:text-brand-red'
            }`}
        >
            All Subjects
        </button>
        {SUBJECTS.map(subject => (
            <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    activeSubject === subject
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                    : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-red dark:hover:border-brand-red hover:text-brand-red'
                }`}
            >
                {subject}
            </button>
        ))}
      </div>

      {/* Main Grid View */}
      {filteredNotes.length === 0 ? (
         <div className="py-16 flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
               <ShieldCheck size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
                {activeSubject === 'All' ? 'No official materials available.' : `No materials found for ${activeSubject}.`}
            </p>
         </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredNotes.map(note => (
                <div 
                    key={note.id} 
                    onClick={() => setSelectedNote(note)}
                    className="group relative bg-surface-light dark:bg-surface-dark rounded-[20px] border border-outline-light dark:border-outline-dark p-5 h-[240px] flex flex-col hover:border-brand-red dark:hover:border-brand-red hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                >
                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {isRecent(note.lastModified) && (
                                <span className="px-2 py-0.5 bg-brand-red text-white text-[9px] font-extrabold rounded-full shadow-sm mb-1 animate-pulse tracking-wide">
                                    NEW
                                </span>
                            )}
                            {note.classGrade && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded flex items-center gap-1">
                                    <GraduationCap size={10} /> {note.classGrade}
                                </span>
                            )}
                            {note.section === 'All' ? (
                                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded flex items-center gap-1">
                                    <Users size={10} /> All Sections
                                </span>
                            ) : note.section && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded flex items-center gap-1">
                                    <LayoutGrid size={10} /> Sec {note.section}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="mb-1 relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{note.subject}</span>
                    </div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-white mb-2 line-clamp-2 leading-snug relative z-10">{note.title}</h4>
                    
                    <div className="flex-1 overflow-hidden relative w-full">
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {note.content}
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-light dark:from-surface-dark to-transparent"></div>
                    </div>

                    <div className="mt-3 flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">Verified</span>
                        <span className="text-[10px] text-slate-400">{note.lastModified}</span>
                    </div>
                </div>
            ))}
          </div>
      )}

      {/* View Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
             onClick={() => setSelectedNote(null)}
             aria-hidden="true"
           />
           
           {/* Modal Content */}
           <div className="relative bg-surface-light dark:bg-surface-dark w-full max-w-5xl h-[85vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-fade-in z-10">
              <div className="p-5 border-b border-outline-light dark:border-outline-dark flex justify-between items-center bg-brand-light dark:bg-surface-dim">
                 <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-md">{selectedNote.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{selectedNote.subject}</span>
                        {selectedNote.classGrade && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                {selectedNote.classGrade}
                            </span>
                        )}
                        {selectedNote.section === 'All' ? (
                            <span className="text-[10px] text-purple-500 font-bold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">All Sections</span>
                        ) : selectedNote.section && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Sec {selectedNote.section}</span>
                        )}
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {selectedNote.attachmentUrl && (
                        <button 
                            onClick={() => handleOpenInNewTab(selectedNote.attachmentUrl!)} 
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-500 hover:text-brand-red transition-colors"
                            title="Open in new tab"
                        >
                            <ExternalLink size={20}/>
                        </button>
                    )}
                    <button 
                        onClick={(e) => handleDownload(e, selectedNote)} 
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-500 hover:text-brand-red transition-colors"
                        title="Download"
                    >
                        <Download size={20}/>
                    </button>
                    <button 
                        onClick={() => setSelectedNote(null)} 
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20}/>
                    </button>
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-surface-dark">
                  {selectedNote.attachmentType === 'pdf' && selectedNote.attachmentUrl ? (
                        <iframe src={selectedNote.attachmentUrl} className="w-full h-full rounded-xl border border-outline-light dark:border-outline-dark bg-white" />
                  ) : selectedNote.attachmentUrl ? (
                      <div className="flex flex-col h-full">
                           <iframe 
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedNote.attachmentUrl)}&embedded=true`}
                                className="w-full flex-1 rounded-xl border border-outline-light dark:border-outline-dark bg-white"
                                title="Document viewer"
                             />
                           <div className="mt-4 flex flex-col items-center">
                                <div className="flex gap-3">
                                    <a 
                                        href={selectedNote.attachmentUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="px-6 py-3 bg-brand-red text-white font-bold rounded-full hover:bg-brand-burgundy transition-colors flex items-center gap-2"
                                    >
                                        <Download size={20} /> Download File
                                    </a>
                                    <a 
                                        href={selectedNote.attachmentUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-bold rounded-full hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center gap-2"
                                    >
                                        <ExternalLink size={20} /> View in New Tab
                                    </a>
                                </div>
                                <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300 mt-4 text-center max-w-2xl">{selectedNote.content}</p>
                           </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300 mt-6">{selectedNote.content}</p>
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteNotesView;
