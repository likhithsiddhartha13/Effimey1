
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, SUBJECTS } from '../types';
import { Plus, Filter, MoreVertical, Calendar, Clock, AlertCircle, X, Trash2, Check, AlignLeft, Type, Tag, Flag } from 'lucide-react';
import { subscribeToTasks, saveTask, deleteTask, updateTask } from '../services/taskService';
import { auth } from '../services/firebase';

interface TasksViewProps {
  searchQuery?: string;
}

const TasksView: React.FC<TasksViewProps> = ({ searchQuery = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task>>({
    title: '',
    subject: 'Mathematics',
    description: '',
    priority: 'medium',
    status: TaskStatus.TODO,
    dueDate: new Date().toISOString().split('T')[0]
  });
  
  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, taskId: string | null}>({
    isOpen: false, 
    taskId: null
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToTasks(auth.currentUser.uid, (data) => setTasks(data));
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask({ ...task });
    } else {
      setEditingTask({
        title: '',
        subject: 'Mathematics',
        description: '',
        priority: 'medium',
        status: TaskStatus.TODO,
        dueDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask({});
  };

  const handleSaveTask = async () => {
    if (!editingTask.title || !auth.currentUser) return;

    try {
        if (editingTask.id) {
            // Update - Explicitly include userId to satisfy security rules
            await updateTask(editingTask.id, {
                title: editingTask.title,
                subject: editingTask.subject,
                description: editingTask.description,
                priority: editingTask.priority,
                status: editingTask.status,
                dueDate: editingTask.dueDate,
                userId: auth.currentUser.uid 
            });
        } else {
            // Create
            await saveTask({
                userId: auth.currentUser.uid,
                title: editingTask.title,
                subject: editingTask.subject || 'Other',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                status: editingTask.status || TaskStatus.TODO,
                dueDate: editingTask.dueDate || new Date().toISOString()
            });
        }
        handleCloseModal();
    } catch (e: any) {
        console.error("Task Save Error:", e);
        // Display a more friendly error if it's a permission issue
        if (e.code === 'permission-denied') {
            alert("Permission denied. You do not have access to modify this task.");
        } else {
            alert("Error saving task. Please try again.");
        }
    }
  };

  const handleDeleteClick = (id?: string) => {
    const taskId = id || editingTask.id;
    if (taskId) {
        setDeleteConfirmation({ isOpen: true, taskId });
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.taskId) {
        try {
            await deleteTask(deleteConfirmation.taskId);
            if (isModalOpen && editingTask.id === deleteConfirmation.taskId) {
                handleCloseModal();
            }
        } catch (e) {
            console.error("Error deleting task", e);
            alert("Error deleting task.");
        }
    }
    setDeleteConfirmation({ isOpen: false, taskId: null });
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Column = ({ title, status, count }: { title: string, status: TaskStatus, count: number }) => (
    <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex flex-col h-full border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          {title}
          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">{count}</span>
        </h3>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {filteredTasks.filter(t => t.status === status).map(task => (
          <div 
            key={task.id} 
            className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <button
                onClick={() => handleOpenModal(task)}
                className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-red/50 rounded-xl"
                aria-label={`Edit task: ${task.title}`}
            >
                <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    task.subject.includes('Math') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300' :
                    task.subject.includes('Biology') ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300' :
                    task.subject.includes('Physics') ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300' :
                    'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                }`}>
                    {task.subject}
                </span>
                {task.priority === 'high' && (
                    <span className="text-brand-red dark:text-red-400" title="High Priority">
                    <AlertCircle size={14} />
                    </span>
                )}
                </div>
                
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{task.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
                </div>
            </button>
            
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(task.id); }}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded transition-colors"
                    title="Delete Task"
                    aria-label="Delete task"
                 >
                    <Trash2 size={14} />
                 </button>
            </div>
          </div>
        ))}
        {filteredTasks.filter(t => t.status === status).length === 0 && (
          <div className="text-center py-4 text-slate-400 text-xs italic">
            No tasks in this column match your search.
          </div>
        )}
      </div>
      
      <button 
        onClick={() => {
            setEditingTask({
                title: '',
                subject: 'Mathematics',
                description: '',
                priority: 'medium',
                status: status,
                dueDate: new Date().toISOString().split('T')[0]
            });
            setIsModalOpen(true);
        }}
        className="mt-3 py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 transition-colors"
      >
        <Plus size={16} /> Add Task
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your assignments and projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:border-brand-red hover:text-brand-red transition-colors" aria-label="Filter tasks">
            <Filter size={18} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-burgundy transition-colors shadow-lg shadow-brand-red/20"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px] min-w-[900px]">
          <Column title="To Do" status={TaskStatus.TODO} count={filteredTasks.filter(t => t.status === TaskStatus.TODO).length} />
          <Column title="In Progress" status={TaskStatus.IN_PROGRESS} count={filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length} />
          <Column title="Completed" status={TaskStatus.DONE} count={filteredTasks.filter(t => t.status === TaskStatus.DONE).length} />
        </div>
      </div>

      {/* Edit/Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={handleCloseModal} aria-label="Close modal" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 id="modal-title" className="text-xl font-bold text-slate-800 dark:text-white">
                {editingTask.id ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="task-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Type size={14} /> Title
                </label>
                <input 
                  id="task-title"
                  type="text" 
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  placeholder="e.g. Finish Chapter 5"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white transition-all font-medium"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="task-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <AlignLeft size={14} /> Description
                </label>
                <textarea 
                  id="task-desc"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  placeholder="Add details about this task..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white transition-all min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Subject */}
                <div className="space-y-2">
                  <label htmlFor="task-subject" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Tag size={14} /> Subject
                  </label>
                  <select 
                    id="task-subject"
                    value={editingTask.subject}
                    onChange={(e) => setEditingTask({...editingTask, subject: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white transition-all appearance-none"
                  >
                    <option value="" disabled>Select Subject</option>
                    {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                 {/* Priority */}
                 <div className="space-y-2">
                  <label htmlFor="task-priority" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Flag size={14} /> Priority
                  </label>
                  <select 
                    id="task-priority"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as any})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white transition-all appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-2">
                  <label htmlFor="task-status" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} /> Status
                  </label>
                  <select 
                    id="task-status"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value as any})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white transition-all appearance-none"
                  >
                    <option value={TaskStatus.TODO}>To Do</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.DONE}>Completed</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label htmlFor="task-date" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} /> Due Date
                  </label>
                  <input 
                    id="task-date"
                    type="date" 
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red dark:text-white transition-all"
                  />
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                {editingTask.id && (
                  <button 
                    onClick={() => handleDeleteClick()}
                    className="px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2 font-medium"
                  >
                    <Trash2 size={18} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleCloseModal}
                  className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTask}
                  className="px-6 py-2 bg-brand-red text-white font-medium rounded-xl hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 flex items-center gap-2 transition-all"
                >
                  <Check size={18} />
                  {editingTask.id ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <button className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setDeleteConfirmation({isOpen: false, taskId: null})} aria-label="Close modal" />
            <div className="relative bg-white dark:bg-[#18181b] w-full max-w-sm rounded-[24px] shadow-2xl p-6 border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                    <Trash2 size={24} />
                </div>
                <h3 id="delete-title" className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Task?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                    Are you sure you want to delete this task? This action cannot be undone.
                </p>
                
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setDeleteConfirmation({isOpen: false, taskId: null})}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;