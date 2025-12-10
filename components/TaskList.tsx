
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, SUBJECTS } from '../types';
import { Plus, Check, Trash2, X, Type, AlignLeft, Tag, Flag, Calendar } from 'lucide-react';
import { subscribeToTasks, toggleTaskStatus, deleteTask, saveTask } from '../services/taskService';
import { auth } from '../services/firebase';

interface TaskListProps {
  searchQuery?: string;
}

const TaskList: React.FC<TaskListProps> = ({ searchQuery = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    subject: 'Mathematics',
    description: '',
    priority: 'medium',
    status: TaskStatus.TODO,
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToTasks(auth.currentUser.uid, (fetchedTasks) => {
        setTasks(fetchedTasks);
        setLoading(false);
        // Trigger global event to notify Dashboard to refresh stats
        window.dispatchEvent(new Event('task-update')); 
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (task: Task) => {
    await toggleTaskStatus(task);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
        try {
            await deleteTask(deleteId);
        } catch (error) {
            console.error("Error deleting task", error);
        }
    }
    setDeleteId(null);
  };

  const handleOpenModal = () => {
    setNewTask({
        title: '',
        subject: 'Mathematics',
        description: '',
        priority: 'medium',
        status: TaskStatus.TODO,
        dueDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveTask = async () => {
    if (!newTask.title || !auth.currentUser) return;

    try {
        await saveTask({
            userId: auth.currentUser.uid,
            title: newTask.title,
            subject: newTask.subject || 'Other',
            description: newTask.description || '',
            priority: newTask.priority || 'medium',
            status: newTask.status || TaskStatus.TODO,
            dueDate: newTask.dueDate || new Date().toISOString()
        });
        handleCloseModal();
    } catch (e) {
        console.error("Task Save Error:", e);
        alert("Error saving task.");
    }
  };

  const filteredTasks = tasks
    .filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
        // 1. Status Check: Done tasks go to the bottom
        const isDoneA = a.status === TaskStatus.DONE;
        const isDoneB = b.status === TaskStatus.DONE;
        
        if (isDoneA && !isDoneB) return 1;
        if (!isDoneA && isDoneB) return -1;

        // 2. Priority Check (High -> Medium -> Low) for pending tasks
        if (!isDoneA) {
            const pMap: Record<string, number> = { high: 0, medium: 1, low: 2 };
            const pA = pMap[a.priority || 'medium'] ?? 1;
            const pB = pMap[b.priority || 'medium'] ?? 1;
            if (pA !== pB) return pA - pB;
        }

        // 3. Date Check (Sooner -> Later)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  if (loading) {
    return (
        <div className="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[28px] h-full p-6 flex items-center justify-center">
             <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full"></div>
        </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[28px] flex flex-col h-full overflow-hidden p-6 shadow-sm relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Priority Tasks</h2>
        <button 
          onClick={handleOpenModal}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-brand-red hover:text-white transition-all hover:rotate-90 duration-300 shadow-sm"
          aria-label="Add Task"
        >
          <Plus size={22} />
        </button>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
        {filteredTasks.length > 0 ? filteredTasks.map(task => (
          <div 
            key={task.id} 
            className={`group relative rounded-[20px] flex items-center gap-4 transition-all duration-300 border ${
              task.status === TaskStatus.DONE 
                ? 'bg-slate-50/50 dark:bg-white/5 border-transparent opacity-60' 
                : 'bg-white dark:bg-[#003366] border-transparent shadow-sm hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <button
                onClick={() => handleToggle(task)}
                className="flex-1 flex items-center gap-4 p-4 text-left focus:outline-none focus:ring-2 focus:ring-brand-red/50 rounded-[20px]"
                aria-label={`Toggle status for ${task.title}`}
            >
                <div className={`w-5 h-5 rounded-full border-[2px] flex items-center justify-center transition-all duration-300 shrink-0 ${
                    task.status === TaskStatus.DONE 
                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                    : 'border-slate-300 dark:border-slate-600 group-hover:border-brand-red'
                }`}>
                    {task.status === TaskStatus.DONE && <Check size={14} strokeWidth={4} />}
                </div>
                
                <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base truncate transition-all duration-300 ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        task.subject === 'Math' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                        task.subject === 'Biology' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                    }`}>
                        {task.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
                </div>
            </button>

            <button 
                onClick={(e) => handleDeleteClick(e, task.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete"
                aria-label="Delete task"
            >
                <Trash2 size={18} />
            </button>
          </div>
        )) : (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No tasks found.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md rounded-[28px]" role="dialog" aria-modal="true">
            <div className="w-full bg-white dark:bg-[#003366] rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 p-4 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 text-center">Delete Task?</h3>
                <div className="flex gap-2 justify-center mt-4">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={handleCloseModal} />
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add New Task</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-5">
               {/* Title */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Type size={14} /> Title</label>
                  <input type="text" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Finish Chapter 5" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white" autoFocus />
               </div>
               
               {/* Description */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><AlignLeft size={14} /> Description</label>
                  <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} placeholder="Add details..." className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white min-h-[80px] resize-none" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Tag size={14} /> Subject</label>
                    <select value={newTask.subject} onChange={(e) => setNewTask({...newTask, subject: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white appearance-none">
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="Other">Other</option>
                    </select>
                  </div>
                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Flag size={14} /> Priority</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white appearance-none">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Calendar size={14} /> Due Date</label>
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white" />
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                <button onClick={handleCloseModal} className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSaveTask} className="px-6 py-2 bg-brand-red text-white font-medium rounded-xl hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 flex items-center gap-2 transition-all">Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
