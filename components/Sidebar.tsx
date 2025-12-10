
import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, Calendar, BookOpen, Settings, LogOut, FileText, Users } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  hasUnreadMessages?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, onOpenSettings, onSignOut, hasUnreadMessages }) => {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'website-notes', icon: FileText, label: 'Official Sources' },
    { id: 'notes', icon: BookOpen, label: 'My Sources' },
    { id: 'community', icon: Users, label: 'Study Groups' },
  ];

  const handleSignOutClick = () => {
    setIsSignOutModalOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <button 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 w-full h-full cursor-default ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-label="Close sidebar"
        tabIndex={isOpen ? 0 : -1}
      />

      {/* Sidebar Container */}
      <nav className={`
        fixed inset-y-0 left-0 z-50 flex flex-col 
        transition-all duration-300 ease-in-out
        ${isOpen 
            ? 'translate-x-0 bg-brand-light/95 dark:bg-brand-dark/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 shadow-xl' 
            : '-translate-x-full lg:translate-x-0 lg:bg-transparent lg:border-none lg:shadow-none'
        }
        w-[260px] lg:w-[88px] 
        lg:hover:w-[260px] lg:hover:bg-transparent lg:hover:backdrop-blur-xl
        group
      `}>
        
        {/* Logo Section */}
        <div className="h-24 flex items-center px-6 gap-4 shrink-0 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-red to-brand-burgundy rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-red/20 shrink-0">
             <span className="font-bold text-xl leading-none font-sans">E</span>
          </div>
          <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Effimey</h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`relative w-full flex items-center gap-4 px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-white dark:bg-white/10 text-brand-red dark:text-white shadow-sm shadow-slate-200/50 dark:shadow-none'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={item.label}
            >
              <div className="relative shrink-0">
                <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : ''}`} />
                
                {/* Notification Dot on Icon */}
                {item.id === 'community' && hasUnreadMessages && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-red rounded-full shadow-sm animate-pulse border-2 border-white dark:border-brand-dark"></span>
                )}
              </div>
              
              <span className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap delay-75 font-semibold">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 mb-4 space-y-2 overflow-hidden shrink-0">
          <button 
            onClick={() => {
              onOpenSettings();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-medium text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200"
            title="Settings"
          >
            <Settings size={24} strokeWidth={2} className="shrink-0" />
            <span className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap delay-75">
              Settings
            </span>
          </button>
          <button 
            onClick={handleSignOutClick}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-medium text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
            title="Sign Out"
          >
            <LogOut size={24} strokeWidth={2} className="shrink-0" />
            <span className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap delay-75">
              Sign Out
            </span>
          </button>
        </div>
      </nav>

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="signout-title">
           <button 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" 
             onClick={() => setIsSignOutModalOpen(false)}
             aria-label="Close modal"
           />
           <div className="relative bg-white dark:bg-surface-dark w-full max-w-sm rounded-[24px] shadow-2xl p-6 border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-200">
              <h3 id="signout-title" className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sign Out</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to sign out of your account?</p>
              
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
    </>
  );
};

export default Sidebar;
