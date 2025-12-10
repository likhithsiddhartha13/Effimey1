
import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { Search, Plus, Tag, Clock, MoreHorizontal, Book, Upload, FileText, Image, X, Trash2, Paperclip, Download, Eye, ExternalLink, Loader2, Check } from 'lucide-react';
import { createNote, getNotes, deleteNote } from '../services/noteService';
import { auth } from '../services/firebase';

interface NotesViewProps {
  searchQuery?: string;
}

const NotesView: React.FC<NotesViewProps> = ({ searchQuery = '' }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);

  const [newNote, setNewNote] = useState<{
    title: string;
    subject: string;
    content: string;
    tags: string;
    attachmentFile?: File | null;
  }>({
    title: '',
    subject: 'Math',
    content: '',
    tags: '',
    attachmentFile: null
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchNotes = async () => {
        const data = await getNotes(auth.currentUser!.uid);
        setNotes(data);
        setLoading(false);
    };
    fetchNotes();
  }, []);

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewNote({
        title: file.name,
        subject: 'Other',
        content: `Uploaded file: ${file.name}`,
        tags: 'upload',
        attachmentFile: file
      });
      setIsModalOpen(true);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.title || !auth.currentUser) return;
    setIsUploading(true);
    try {
        const created = await createNote({
            userId: auth.currentUser.uid,
            title: newNote.title,
            subject: newNote.subject,
            content: newNote.content,
            tags: newNote.tags.split(',').map(t => t.trim()).filter(t => t),
            lastModified: new Date().toISOString()
        }, newNote.attachmentFile || undefined);
        
        setNotes([created, ...notes]);
        closeModal();
    } catch (e) {
        alert("Failed to create note");
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this source?")) {
        await deleteNote(id);
        setNotes(notes.filter(n => n.id !== id));
        if (selectedNote?.id === id) setSelectedNote(null);
    }
  };

  const handleDownload = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (note.attachmentUrl) {
        const element = document.createElement("a");
        element.href = note.attachmentUrl;
        element.target = "_blank";
        element.download = note.attachmentName || 'download';
        document.body.appendChild(element); 
        element.click();
        document.body.removeChild(element);
    }
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleView = (e: React.MouseEvent, note: Note) => {
      e.stopPropagation();
      if (note.attachmentUrl) {
          handleOpenInNewTab(note.attachmentUrl);
      } else {
          setSelectedNote(note);
      }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewNote({ title: '', subject: 'Math', content: '', tags: '', attachmentFile: null });
    if (quickUploadInputRef.current) quickUploadInputRef.current.value = '';
  };

  const getFileIcon = (type?: string, size: number = 24) => {
    switch(type) {
      case 'pdf': return <FileText size={size} className="text-brand-red" />;
      case 'image': return <Image size={size} className="text-blue-500" />;
      case 'doc': return <FileText size={size} className="text-blue-600" />;
      default: return <FileText size={size} className="text-slate-400" />;
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
     return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-brand-red" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sources ({filteredNotes.length})</h3>
        <div className="flex gap-3">
           <input 
            type="file" 
            ref={quickUploadInputRef} 
            className="hidden" 
            onChange={handleQuickUpload} 
            aria-label="Upload File"
          />
           <button 
            onClick={() => quickUploadInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-light dark:bg-surface-dim hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full text-sm font-medium transition-colors"
           >
             <Upload size={20} /> Upload Source
           </button>
           <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-light dark:bg-surface-dim hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full text-sm font-medium transition-colors"
           >
             <Plus size={20} /> New Note
           </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <div 
              key={note.id} 
              className="group relative bg-surface-light dark:bg-surface-dark rounded-[20px] border border-outline-light dark:border-outline-dark h-[260px] flex flex-col hover:border-brand-red dark:hover:border-brand-red hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              {/* Content Container - No onClick */}
              <div className="w-full h-full text-left p-5 flex flex-col rounded-[20px]">
                {/* Header / Type */}
                <div className="flex items-start justify-between mb-3 w-full">
                    <div className="p-2.5 bg-brand-light dark:bg-surface-dim rounded-xl">
                        {getFileIcon(note.attachmentType, 24)}
                    </div>
                </div>
                
                {/* Body */}
                <h4 className="font-bold text-base text-slate-800 dark:text-white mb-2 line-clamp-2 leading-snug">{note.title}</h4>
                <div className="flex-1 overflow-hidden relative w-full">
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed">
                        {note.content}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface-light dark:from-surface-dark to-transparent"></div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">{note.subject}</span>
                    <span className="text-[10px] text-slate-400">{new Date(note.lastModified).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons (Appears on Hover) */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                  <button 
                      onClick={(e) => handleView(e, note)}
                      className="p-2 bg-white dark:bg-black/40 backdrop-blur-md text-slate-600 dark:text-slate-200 hover:text-brand-red dark:hover:text-brand-red rounded-xl shadow-sm border border-slate-100 dark:border-white/10 hover:scale-110 transition-all"
                      title="View in new tab"
                  >
                      <Eye size={18} />
                  </button>
                  {note.attachmentUrl && (
                    <button 
                        onClick={(e) => handleDownload(e, note)}
                        className="p-2 bg-white dark:bg-black/40 backdrop-blur-md text-slate-600 dark:text-slate-200 hover:text-brand-red dark:hover:text-brand-red rounded-xl shadow-sm border border-slate-100 dark:border-white/10 hover:scale-110 transition-all"
                        title="Download"
                    >
                        <Download size={18} />
                    </button>
                  )}
                  <button 
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-2 bg-white dark:bg-black/40 backdrop-blur-md text-slate-600 dark:text-slate-200 hover:text-red-500 dark:hover:text-red-500 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 hover:scale-110 transition-all"
                      title="Delete"
                  >
                      <Trash2 size={18} />
                  </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-60">
             <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Book size={32} className="text-slate-400" />
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium">No sources added yet.</p>
          </div>
        )}
      </div>

      {/* Add Note Modal - Unchanged */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} aria-label="Close modal" />
          <div className="relative bg-surface-light dark:bg-surface-dark w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden animate-fade-in z-10">
             <div className="p-6 pb-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add Source</h3>
                <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full" aria-label="Close"><X size={20}/></button>
             </div>
             <div className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                    <input 
                        type="text" 
                        value={newNote.title}
                        onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                        className="w-full bg-brand-light dark:bg-black/20 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-red/20 text-sm"
                        placeholder="Source Title"
                    />
                </div>
                {newNote.attachmentFile && (
                    <div className="text-sm text-emerald-500 font-bold flex items-center gap-2">
                        <Check size={16} /> Attached: {newNote.attachmentFile.name}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Content / Description</label>
                    <textarea 
                        value={newNote.content}
                        onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                        className="w-full h-32 bg-brand-light dark:bg-black/20 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-red/20 resize-none text-sm"
                        placeholder="Paste content or write notes..."
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={closeModal} className="px-5 py-2.5 rounded-full text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 text-sm">Cancel</button>
                    <button onClick={handleSaveNote} disabled={isUploading} className="px-6 py-2.5 rounded-full bg-brand-red text-white font-medium hover:bg-brand-burgundy text-sm flex items-center gap-2">
                        {isUploading && <Loader2 size={16} className="animate-spin" />}
                        {isUploading ? 'Uploading...' : 'Add Source'}
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* View Modal - Only needed for text notes or fallback */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNote(null)} aria-label="Close modal" />
           <div className="relative bg-surface-light dark:bg-surface-dark w-full max-w-5xl h-[85vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-fade-in z-10">
              <div className="p-5 border-b border-outline-light dark:border-outline-dark flex justify-between items-center bg-brand-light dark:bg-surface-dim">
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-md">{selectedNote.title}</h2>
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
                    <button onClick={(e) => handleDownload(e, selectedNote)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors" aria-label="Download"><Download size={20}/></button>
                    <button onClick={() => setSelectedNote(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors" aria-label="Close"><X size={20}/></button>
                 </div>
              </div>
              <div className="flex-1 flex overflow-hidden relative">
                 <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-surface-dark">
                    <div className="prose dark:prose-invert max-w-4xl mx-auto">
                        <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300 mt-6">{selectedNote.content}</p>
                        
                        {selectedNote.attachmentUrl && (
                             <div className="mt-4 p-4 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-between">
                                 <div>
                                     <p className="text-sm font-bold text-slate-800 dark:text-white">Attachment Available</p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">View externally or download.</p>
                                 </div>
                                 <div className="flex gap-2">
                                     <a href={selectedNote.attachmentUrl} target="_blank" className="text-brand-red font-bold text-sm hover:underline flex items-center gap-1">
                                        <Download size={16} /> Download
                                     </a>
                                     <button onClick={() => handleOpenInNewTab(selectedNote.attachmentUrl!)} className="text-slate-500 font-bold text-sm hover:underline flex items-center gap-1">
                                        <ExternalLink size={16} /> Open
                                     </button>
                                 </div>
                             </div>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NotesView;
