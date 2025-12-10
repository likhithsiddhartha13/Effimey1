
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  Users, 
  FileText, 
  LogOut, 
  Search, 
  Plus, 
  X, 
  Check, 
  Loader2, 
  Send,
  Image as ImageIcon,
  Paperclip,
  Shield,
  Trash2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { 
    uploadOfficialSource, 
    deleteOfficialSource,
    subscribeToAllOfficialSources,
    sendAdminMessage, 
    addAdmin, 
    removeAdmin, 
    AdminUser,
    subscribeToUsers,
    subscribeToAdmins,
    subscribeToOfficialSources,
    subscribeToAdminMessages
} from '../services/adminService';
import { createEvent } from '../services/scheduleService';
import { auth } from '../services/firebase';
import { SUBJECTS, Note } from '../types';

interface AdminDashboardProps {
  onSignOut: () => void;
}

const CLASSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const SECTIONS = [
  'All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'uploads' | 'messages' | 'team' | 'schedule'>('overview');
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  
  // Real-time Data State
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [filesCount, setFilesCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  
  // Upload State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: 'Mathematics',
    description: '',
    classGrade: '10th',
    section: 'A'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Message State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Admin Team State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Schedule Test State
  const [testForm, setTestForm] = useState({
      title: '',
      day: 'Mon',
      time: '09:00',
      durationMinutes: 60,
      targetUserId: 'all'
  });
  const [isScheduling, setIsScheduling] = useState(false);

  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribeUsers = subscribeToUsers((data) => setUsers(data));
    const unsubscribeAdmins = subscribeToAdmins((data) => setAdmins(data));
    const unsubscribeFilesCount = subscribeToOfficialSources((count) => setFilesCount(count));
    const unsubscribeFilesList = subscribeToAllOfficialSources((notes) => setUploadedNotes(notes));
    const unsubscribeMessages = subscribeToAdminMessages((count) => setMessagesCount(count));

    // Cleanup listeners on unmount
    return () => {
        unsubscribeUsers();
        unsubscribeAdmins();
        unsubscribeFilesCount();
        unsubscribeFilesList();
        unsubscribeMessages();
    };
  }, []);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.title) return;

    setIsUploading(true);
    try {
      await uploadOfficialSource(
          selectedFile, 
          uploadForm.title, 
          uploadForm.subject, 
          uploadForm.description,
          uploadForm.classGrade,
          uploadForm.section
      );
      alert('File uploaded successfully!');
      // Reset form
      setUploadForm({ title: '', subject: 'Mathematics', description: '', classGrade: '10th', section: 'A' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
      if (confirm('Are you sure you want to delete this resource? This cannot be undone.')) {
          try {
              await deleteOfficialSource(id);
          } catch (error) {
              console.error(error);
              alert('Failed to delete resource.');
          }
      }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    // Simulate sending or implement real logic
    const recipient = selectedUser ? selectedUser.id : 'all'; // 'all' logic can be added later
    try {
      if (auth.currentUser) {
          await sendAdminMessage(recipient, messageText, auth.currentUser.uid);
          setMessageSent(true);
          setTimeout(() => setMessageSent(false), 2000);
          setMessageText('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setIsAddingAdmin(true);
    try {
        if (auth.currentUser) {
            await addAdmin(newAdminEmail, auth.currentUser.email || 'System');
            setNewAdminEmail('');
            alert(`Added ${newAdminEmail} as admin.`);
        }
    } catch (e) {
        alert('Failed to add admin. They might already exist.');
    } finally {
        setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
      if (confirm('Are you sure you want to remove this admin?')) {
          await removeAdmin(id);
      }
  };

  const handleScheduleTest = async () => {
    if (!testForm.title) return;
    setIsScheduling(true);
    try {
        await createEvent({
            title: testForm.title,
            day: testForm.day,
            time: testForm.time,
            type: 'exam',
            durationMinutes: testForm.durationMinutes,
            userId: testForm.targetUserId,
            assignedBy: 'admin'
        });
        alert('Test scheduled successfully!');
        setTestForm({ ...testForm, title: '' });
    } catch (e) {
        alert('Failed to schedule test.');
    } finally {
        setIsScheduling(false);
    }
  };

  return (
    <div className="flex h-screen bg-brand-light dark:bg-brand-dark font-sans text-slate-900 dark:text-white overflow-hidden">
      
      {/* Admin Sidebar */}
      <nav className="w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
             <span className="font-bold text-xl leading-none">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Admin</h1>
            <p className="text-xs text-slate-500">Control Panel</p>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'overview' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <LayoutDashboard size={20} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'uploads' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Upload size={20} /> Upload Materials
          </button>
           <button
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'schedule' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Calendar size={20} /> Schedule Tests
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'messages' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <MessageSquare size={20} /> Messages
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'team' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Shield size={20} /> Manage Team
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <button 
            onClick={() => setIsSignOutModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'uploads' ? 'Upload Official Sources' : 
                 activeTab === 'schedule' ? 'Schedule Tests' :
                 activeTab === 'team' ? 'Admin Team' :
                 'User Communication'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-slate-500">Manage the Effimey platform and user experience.</p>
                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Online</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold">
                AD
            </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl w-fit mb-4"><FileText size={24} /></div>
                <h3 className="text-4xl font-bold mb-1">{filesCount}</h3>
                <p className="text-sm font-medium text-slate-500">Files Uploaded</p>
            </div>
            <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl w-fit mb-4"><MessageSquare size={24} /></div>
                <h3 className="text-4xl font-bold mb-1">{messagesCount}</h3>
                <p className="text-sm font-medium text-slate-500">Messages Sent</p>
            </div>
          </div>
        )}

        {/* Uploads Tab */}
        {activeTab === 'uploads' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 p-8 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Upload New Resource</h3>
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="res-title" className="text-sm font-bold text-slate-700 dark:text-slate-300">Resource Title</label>
                            <input 
                                id="res-title"
                                type="text" 
                                required
                                value={uploadForm.title}
                                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                                placeholder="e.g. Calculus II Syllabus 2024"
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="res-subject" className="text-sm font-bold text-slate-700 dark:text-slate-300">Subject</label>
                                <select 
                                    id="res-subject"
                                    value={uploadForm.subject}
                                    onChange={(e) => setUploadForm({...uploadForm, subject: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none"
                                >
                                    <option value="General">General</option>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="res-desc" className="text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
                                <input 
                                    id="res-desc"
                                    type="text"
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                                    placeholder="Optional details..."
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="res-grade" className="text-sm font-bold text-slate-700 dark:text-slate-300">Class / Grade</label>
                                <select 
                                    id="res-grade"
                                    value={uploadForm.classGrade}
                                    onChange={(e) => setUploadForm({...uploadForm, classGrade: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none"
                                >
                                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="res-section" className="text-sm font-bold text-slate-700 dark:text-slate-300">Section</label>
                                <select 
                                    id="res-section"
                                    value={uploadForm.section}
                                    onChange={(e) => setUploadForm({...uploadForm, section: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none"
                                >
                                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">File Attachment</label>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                    selectedFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                                }`}
                                aria-label="Upload File Attachment"
                            >
                                {selectedFile ? (
                                    <>
                                        <Check className="text-emerald-500 mb-2" size={32} />
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{selectedFile.name}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-slate-400 mb-2" size={32} />
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click to browse</p>
                                        <p className="text-xs text-slate-400">PDF, DOCX, PNG (Max 10MB)</p>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    aria-label="File Input"
                                />
                            </button>
                        </div>

                        <button 
                            type="submit"
                            disabled={isUploading || !selectedFile}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                            {isUploading ? 'Uploading...' : 'Upload to Official Sources'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Recent Uploads List */}
            <div className="lg:col-span-3">
                <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
                        <h3 className="text-xl font-bold">Uploaded Resources</h3>
                        <span className="bg-slate-100 dark:bg-white/10 text-xs font-bold px-2 py-1 rounded-full">{uploadedNotes.length} Files</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Title</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Class</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Section</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {uploadedNotes.map(note => (
                                    <tr key={note.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-sm">
                                            <div className="flex items-center gap-3">
                                                <FileText size={16} className="text-slate-400" />
                                                <span className="truncate max-w-[200px]" title={note.title}>{note.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{note.classGrade}</td>
                                        <td className="px-6 py-4">
                                            {note.section === 'All' ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs font-bold">
                                                    All
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-500">{note.section}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{note.lastModified}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {note.attachmentUrl && (
                                                    <a href={note.attachmentUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteSource(note.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    aria-label="Delete resource"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {uploadedNotes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No files uploaded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Schedule Test Tab */}
        {activeTab === 'schedule' && (
            <div className="max-w-2xl">
                <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 p-8 shadow-sm">
                    <h3 className="text-xl font-bold mb-2">Schedule Test / Exam</h3>
                    <p className="text-slate-500 text-sm mb-6">Assign an exam to students schedules automatically.</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="test-title" className="text-sm font-bold text-slate-700 dark:text-slate-300">Test Title</label>
                            <input 
                                id="test-title"
                                type="text" 
                                value={testForm.title}
                                onChange={(e) => setTestForm({...testForm, title: e.target.value})}
                                placeholder="e.g. Physics Midterm"
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label htmlFor="test-day" className="text-sm font-bold text-slate-700 dark:text-slate-300">Day</label>
                                <select 
                                    id="test-day"
                                    value={testForm.day}
                                    onChange={(e) => setTestForm({...testForm, day: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none"
                                >
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="test-time" className="text-sm font-bold text-slate-700 dark:text-slate-300">Time</label>
                                <input 
                                    id="test-time"
                                    type="time"
                                    value={testForm.time}
                                    onChange={(e) => setTestForm({...testForm, time: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label htmlFor="test-duration" className="text-sm font-bold text-slate-700 dark:text-slate-300">Duration (Min)</label>
                                <input 
                                    id="test-duration"
                                    type="number" 
                                    value={testForm.durationMinutes}
                                    onChange={(e) => setTestForm({...testForm, durationMinutes: parseInt(e.target.value) || 60})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                />
                            </div>
                             <div className="space-y-2">
                                <label htmlFor="test-assign" className="text-sm font-bold text-slate-700 dark:text-slate-300">Assign To</label>
                                <select 
                                    id="test-assign"
                                    value={testForm.targetUserId}
                                    onChange={(e) => setTestForm({...testForm, targetUserId: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white appearance-none"
                                >
                                    <option value="all">All Students</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleScheduleTest}
                            disabled={isScheduling || !testForm.title}
                            className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                        >
                            {isScheduling ? <Loader2 size={20} className="animate-spin" /> : <Calendar size={20} />}
                            Schedule Test
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="flex h-[600px] gap-6">
             {/* User List */}
             <div className="w-1/3 bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search users..." className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl pl-9 pr-4 py-2 text-sm outline-none" aria-label="Search users" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button 
                         onClick={() => setSelectedUser(null)}
                         className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${!selectedUser ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                         <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                            ALL
                         </div>
                         <div>
                            <p className="font-bold text-sm">Broadcast All</p>
                            <p className="text-xs text-slate-500">Send to everyone</p>
                         </div>
                    </button>
                    {users.map(user => (
                        <button 
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedUser?.id === user.id ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white flex items-center justify-center font-bold text-sm">
                                {user.name?.charAt(0) || '?'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm truncate">{user.name || 'User'}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </button>
                    ))}
                </div>
             </div>

             {/* Chat Box */}
             <div className="flex-1 bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                    <h3 className="font-bold">
                        {selectedUser ? `Message to ${selectedUser.name}` : 'Broadcast Announcement'}
                    </h3>
                    {selectedUser && <span className="text-xs text-slate-400">{selectedUser.email}</span>}
                </div>
                
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Admin messages will appear in the user's notification center.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                            aria-label="Message text"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!messageText.trim()}
                            className={`p-3 rounded-xl text-white transition-all ${messageSent ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-white dark:text-black hover:opacity-90'}`}
                            aria-label="Send message"
                        >
                            {messageSent ? <Check size={20} /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* Manage Team Tab */}
        {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                     <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                             <h3 className="text-xl font-bold">Admin Users</h3>
                             <span className="bg-slate-100 dark:bg-white/10 text-xs font-bold px-2 py-1 rounded-full">{admins.length} Members</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Added By</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {admins.map(admin => (
                                        <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-sm">{admin.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{admin.addedBy}</td>
                                            <td className="px-6 py-4">
                                                {admin.role !== 'super_admin' && (
                                                    <button onClick={() => handleRemoveAdmin(admin.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove admin">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>

                {/* Add Admin Form */}
                <div>
                     <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 p-6 shadow-sm">
                         <h3 className="text-lg font-bold mb-4">Add New Admin</h3>
                         <div className="space-y-4">
                            <div>
                                <label htmlFor="admin-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                                <input 
                                    id="admin-email"
                                    type="email" 
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    placeholder="newadmin@effimey.app"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                />
                            </div>
                            <button 
                                onClick={handleAddAdmin}
                                disabled={!newAdminEmail.trim() || isAddingAdmin}
                                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isAddingAdmin ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                                Add Admin
                            </button>
                         </div>
                         <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                             <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-1">Note</h4>
                             <p className="text-xs text-blue-600 dark:text-blue-300">New admins will have full access to the dashboard, including file uploads and messaging.</p>
                         </div>
                     </div>
                </div>
            </div>
        )}

      </main>

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="signout-modal-title">
           <button className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setIsSignOutModalOpen(false)} aria-label="Close modal" />
           <div className="relative bg-white dark:bg-surface-dark w-full max-w-sm rounded-[24px] shadow-2xl p-6 border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-200">
              <h3 id="signout-modal-title" className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sign Out</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to sign out of the admin panel?</p>
              
              <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setIsSignOutModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setIsSignOutModalOpen(false);
                      onSignOut();
                    }}
                    className="px-4 py-2 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 transition-all"
                  >
                    Sign Out
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
