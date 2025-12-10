
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import AIChatWidget from './components/AIChatWidget';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';
import { Menu, Bell, Search, X, Moon, Sun, Monitor, MessageSquare, UserPlus, Loader2, Clock, Eye, User as UserIcon, LogOut, Settings as SettingsIcon, FileText } from 'lucide-react';
import { User, FriendRequest, Note } from './types';
import { searchUsers, sendFriendRequest, subscribeToFriendRequests, acceptFriendRequest, rejectFriendRequest, checkRequestStatus, updateUserStatus } from './services/userService';
import { updateStudyTime } from './services/studyStatsService';
import { auth, db } from './services/firebase';
import { checkIsAdmin, subscribeToAllOfficialSources } from './services/adminService';
import { checkIsDeveloper } from './services/developerService';
import { subscribeToUnreadCount } from './services/chatService';

// Lazy load components for code splitting
const DashboardView = lazy(() => import('./components/DashboardView'));
const TasksView = lazy(() => import('./components/TasksView'));
const NotesView = lazy(() => import('./components/NotesView'));
const WebsiteNotesView = lazy(() => import('./components/WebsiteNotesView'));
const CommunityChatView = lazy(() => import('./components/CommunityChatView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const LoginView = lazy(() => import('./components/LoginView'));
const SignupView = lazy(() => import('./components/SignupView'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const DeveloperDashboard = lazy(() => import('./components/DeveloperDashboard'));
const ScheduleView = lazy(() => import('./components/ScheduleView'));

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
  </div>
);

// Standard notification sound - Using 'public/' prefix based on your file structure
const NOTIFICATION_SOUND_URL = 'public/Notis.mp3';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  
  // Public App Navigation State
  const [publicPage, setPublicPage] = useState<'home' | 'login' | 'signup' | 'privacy' | 'terms' | 'contact'>('home');

  // Main App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [feedbackText, setFeedbackText] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Profile Reminder State
  const [isProfileReminderOpen, setIsProfileReminderOpen] = useState(false);
  const [dontRemind, setDontRemind] = useState(false);

  // Focus Mode State (Global Persistence)
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);

  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  // User Search & Social State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [communityTargetUser, setCommunityTargetUser] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Notification Sound Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevReqLength = useRef(0);
  const prevNotesLength = useRef(0);
  const isFirstLoad = useRef(true);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    // Preload to check for errors
    audioRef.current.load();
    audioRef.current.onerror = () => {
        console.warn(`Audio failed to load from ${NOTIFICATION_SOUND_URL}. Please check the file path.`);
    };
  }, []);

  const playNotification = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented or file not found
                console.log('Audio play blocked or file missing:', error);
            });
        }
    }
  };

  // Monitor Friend Requests for Sound
  useEffect(() => {
      if (!isAuthLoading && !isFirstLoad.current) {
          if (friendRequests.length > prevReqLength.current) {
              playNotification();
          }
      }
      prevReqLength.current = friendRequests.length;
  }, [friendRequests, isAuthLoading]);

  // Monitor Notes for Sound
  useEffect(() => {
      if (!isAuthLoading && !isFirstLoad.current) {
          if (recentNotes.length > prevNotesLength.current) {
              playNotification();
          }
      }
      prevNotesLength.current = recentNotes.length;
  }, [recentNotes, isAuthLoading]);

  // Handle First Load Flag
  useEffect(() => {
      if (!isAuthLoading) {
          const timer = setTimeout(() => {
              isFirstLoad.current = false;
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [isAuthLoading]);

  // Safety Timeout for Auth Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthLoading) {
        setIsAuthLoading(false);
      }
    }, 5000); // 5s timeout
    return () => clearTimeout(timer);
  }, [isAuthLoading]);

  // Check LocalStorage for Active Focus Session on Mount
  useEffect(() => {
    const savedStart = localStorage.getItem('effimey_focus_start');
    if (savedStart) {
        const startTime = parseInt(savedStart, 10);
        if (!isNaN(startTime)) {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            if (elapsed >= 0) {
                setFocusActive(true);
                setFocusSeconds(elapsed);
            } else {
                // Invalid future time, clear it
                localStorage.removeItem('effimey_focus_start');
            }
        }
    }
  }, []);

  // Global Focus Timer - Uses Date.now() difference for background accuracy
  useEffect(() => {
    let interval: any;
    if (focusActive) {
        interval = setInterval(() => {
            const savedStart = localStorage.getItem('effimey_focus_start');
            if (savedStart) {
                const startTime = parseInt(savedStart, 10);
                const now = Date.now();
                // Calculate actual elapsed time regardless of background throttling
                setFocusSeconds(Math.floor((now - startTime) / 1000));
            } else {
                // Fallback (should typically have savedStart if focusActive is true)
                setFocusSeconds(prev => prev + 1);
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusActive]);

  const handleToggleFocus = async () => {
    if (focusActive) {
        // Stop Session - UI Update First
        setFocusActive(false);
        localStorage.removeItem('effimey_focus_start');
        
        // Save current session duration
        const sessionDuration = focusSeconds;
        setFocusSeconds(0);

        if (auth.currentUser) {
            updateUserStatus(auth.currentUser.uid, 'online').catch(() => {});
        }

        if (sessionDuration >= 60) {
            // Async save without blocking UI (handles offline queuing via updated service)
            updateStudyTime(Math.floor(sessionDuration / 60)).catch(() => {});
        }
    } else {
        // Start Session
        setFocusActive(true);
        localStorage.setItem('effimey_focus_start', Date.now().toString());
        
        if (auth.currentUser) {
            updateUserStatus(auth.currentUser.uid, 'busy').catch(() => {});
        }
    }
  };

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        try {
            if (user) {
                // Check Developer Status First (Priority)
                let isDev = false;
                try {
                    isDev = await checkIsDeveloper(user.uid, user.email);
                } catch (e) {
                    // Silent catch
                }
                setIsDeveloper(isDev);

                if (!isDev) {
                   // Check Admin Status only if not developer
                   let isAdminUser = false;
                   try {
                       isAdminUser = await checkIsAdmin(user.uid, user.email);
                   } catch (e) {
                        // Silent catch
                   }
                   setIsAdmin(isAdminUser);
                }

                setIsAuthenticated(true);
                setPublicPage('home'); 

                // Real-time listener for current user data
                const userDocRef = db.collection('users').doc(user.uid);
                userDocRef.onSnapshot((docSnap) => {
                    if (docSnap.exists) {
                        const data = docSnap.data() as any;
                        const userData: User = {
                            id: user.uid,
                            name: data.name || user.displayName || 'User',
                            username: data.username || '',
                            email: user.email || '',
                            avatar: data.avatarUrl || user.photoURL || '',
                            status: data.status || 'online',
                            friends: data.friends || [],
                            class: data.class,
                            section: data.section,
                            school: data.school
                        };
                        setCurrentUserData(userData);
                        
                        if (data.avatarUrl) {
                            setUserAvatar(data.avatarUrl);
                            localStorage.setItem('effimey_user_avatar', data.avatarUrl);
                        }

                        // Check Profile Completeness
                        // Includes new checks for class and section
                        const isProfileIncomplete = !data.username || !data.school || !data.major || !data.class || !data.section;
                        if (isProfileIncomplete && !isDev && !isAdmin) { // Admins/Devs don't need this
                            const suppressed = localStorage.getItem(`hide_profile_nag_${user.uid}`);
                            if (!suppressed) {
                                setIsProfileReminderOpen(true);
                            }
                        }

                    } else {
                        setCurrentUserData({
                            id: user.uid,
                            name: user.displayName || 'User',
                            username: '',
                            email: user.email || '',
                            avatar: user.photoURL || '',
                            status: 'online',
                            friends: []
                        });
                        if (!isDev && !isAdmin) {
                            setIsProfileReminderOpen(true); // New user or no doc -> trigger reminder
                        }
                        if (user.photoURL) {
                            setUserAvatar(user.photoURL);
                            localStorage.setItem('effimey_user_avatar', user.photoURL);
                        }
                    }
                }, (error) => {
                    // Silent catch
                });

            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
                setIsDeveloper(false);
                setUserAvatar(null);
                setCurrentUserData(null);
            }
        } catch (error) {
            console.error("Auth state change error:", error);
        } finally {
            setIsAuthLoading(false);
        }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Services when authenticated
  useEffect(() => {
    if (isAuthenticated && !isAdmin && !isDeveloper && auth.currentUser) {
      const uid = auth.currentUser.uid;
      
      // Subscribe to Friend Requests
      const unsubRequests = subscribeToFriendRequests(uid, (requests) => {
        setFriendRequests(requests);
      });

      // Subscribe to Official Notes for Notifications
      const unsubNotes = subscribeToAllOfficialSources((notes) => {
          // Filter for notes uploaded within the last 24 hours
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          const recent = notes.filter(n => {
              let noteDate: Date;
              if (n.createdAt && typeof n.createdAt.toDate === 'function') {
                  noteDate = n.createdAt.toDate();
              } else {
                  noteDate = new Date(n.lastModified);
              }
              return !isNaN(noteDate.getTime()) && noteDate >= twentyFourHoursAgo;
          });
          setRecentNotes(recent);
      });

      // Subscribe to Unread Messages count
      const unsubChat = subscribeToUnreadCount(uid, (hasUnread) => {
          setHasUnreadMessages(hasUnread);
      });

      return () => {
        unsubRequests();
        unsubNotes();
        unsubChat();
      };
    }
  }, [isAuthenticated, isAdmin, isDeveloper]);
  
  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, 1000); 
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Handle Login
  const handleLogin = () => {
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
        await auth.signOut();
        setActiveTab('dashboard'); 
        setPublicPage('home'); 
        localStorage.removeItem('effimey_user_avatar');
        setIsProfileMenuOpen(false);
    } catch (error) {
        console.error("Error signing out", error);
    }
  };

  // Handle User Search (Strictly for finding students now)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (userSearchQuery.trim() && auth.currentUser) {
        setIsSearching(true);
        const results = await searchUsers(userSearchQuery, auth.currentUser.uid);
        setUserSearchResults(results);
        setIsSearching(false);
      } else {
        setUserSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery, currentUserData]);

  const handleStartChat = (userId: string) => {
    // Double check friendship before allowing chat
    if (currentUserData?.friends?.includes(userId)) {
        setCommunityTargetUser(userId);
        setActiveTab('community');
        setUserSearchQuery('');
        setUserSearchResults([]);
    } else {
        alert("You must be friends to chat.");
    }
  };

  const handleViewProfile = (userId: string) => {
    setViewingProfileId(userId);
    setActiveTab('profile');
    setUserSearchQuery('');
    setUserSearchResults([]);
  }

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
        await acceptFriendRequest(request.id, request.fromId, request.toId);
    } catch (e) {
        // Silent
    }
  };

  const handleCloseProfileReminder = () => {
      if (dontRemind && auth.currentUser) {
          localStorage.setItem(`hide_profile_nag_${auth.currentUser.uid}`, 'true');
      }
      setIsProfileReminderOpen(false);
  };

  const handleGoToProfile = () => {
      handleCloseProfileReminder();
      setViewingProfileId(null); // Ensure looking at own profile
      setActiveTab('profile');
  };

  // Load avatar
  useEffect(() => {
    const loadAvatar = () => {
      const stored = localStorage.getItem('effimey_user_avatar');
      if (stored) setUserAvatar(stored);
    };
    loadAvatar();

    const handleAvatarUpdate = () => loadAvatar();
    window.addEventListener('user-avatar-update', handleAvatarUpdate);
    return () => window.removeEventListener('user-avatar-update', handleAvatarUpdate);
  }, [isAuthenticated]);

  // Handle Theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (theme === 'dark') root.classList.add('dark');
      else if (theme === 'light') root.classList.remove('dark');
    };
    applyTheme();
  }, [theme]);

  const renderContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (activeTab) {
            case 'dashboard': return <DashboardView searchQuery={userSearchQuery} focusMode={{isActive: focusActive, seconds: focusSeconds, toggle: handleToggleFocus}} />;
            case 'tasks': return <TasksView />;
            case 'schedule': return <ScheduleView />;
            case 'notes': return <NotesView />;
            case 'website-notes': return <WebsiteNotesView currentUser={currentUserData!} />;
            case 'community': return <CommunityChatView targetUserId={communityTargetUser} />;
            case 'profile': return <ProfileView viewingUserId={viewingProfileId} onStartChat={handleStartChat} currentUser={currentUserData} />;
            default: return <DashboardView searchQuery={userSearchQuery} focusMode={{isActive: focusActive, seconds: focusSeconds, toggle: handleToggleFocus}} />;
          }
        })()}
      </Suspense>
    );
  };

  const handleSendFeedback = () => {
    setTimeout(() => {
      setIsFeedbackOpen(false);
      setFeedbackText('');
      alert("Thank you for your feedback!");
    }, 500);
  };

  if (isAuthLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-brand-light dark:bg-brand-dark">
            <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-brand-light dark:bg-brand-dark">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
      }>
        {(() => {
          if (publicPage === 'login') return <LoginView onLogin={handleLogin} onBack={() => setPublicPage('home')} onSignupClick={() => setPublicPage('signup')} />;
          if (publicPage === 'signup') return <SignupView onLoginClick={() => setPublicPage('login')} onBack={() => setPublicPage('home')} />;
          if (publicPage === 'privacy') return <PrivacyPolicyPage onHomeClick={() => setPublicPage('home')} />;
          if (publicPage === 'terms') return <TermsPage onHomeClick={() => setPublicPage('home')} />;
          if (publicPage === 'contact') return <ContactPage onHomeClick={() => setPublicPage('home')} />;
          return <LandingPage 
              onLoginClick={() => setPublicPage('login')}
              onSignupClick={() => setPublicPage('signup')} 
              onPrivacyClick={() => setPublicPage('privacy')}
              onTermsClick={() => setPublicPage('terms')}
              onContactClick={() => setPublicPage('contact')}
          />;
        })()}
      </Suspense>
    );
  }

  // Admin and Developer Views take precedence over Student App
  if (isDeveloper) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DeveloperDashboard onSignOut={handleSignOut} />
      </Suspense>
    );
  }

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminDashboard onSignOut={handleSignOut} />
      </Suspense>
    );
  }

  return (
    <div className="relative flex h-screen font-sans transition-colors duration-200 overflow-hidden bg-brand-light dark:bg-brand-dark">
      
      {/* Aurora Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-300 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
            // If user clicks sidebar profile, clear viewingId to show their own
            if (tab === 'profile') setViewingProfileId(null);
            setActiveTab(tab);
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
        hasUnreadMessages={hasUnreadMessages}
      />

      {/* Main Content Wrapper - Added lg:ml-[88px] to offset fixed sidebar */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 lg:ml-[88px] transition-all duration-300">
        <header className="h-20 px-8 flex items-center justify-between shrink-0 relative z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full lg:hidden transition-colors" aria-label="Open menu">
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
              </h2>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <p>
                  {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {/* Global Focus Indicator */}
                {focusActive && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-bold border border-brand-red/20 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red"></span>
                        Focus Active
                    </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end max-w-2xl relative">
            {/* User Search Bar - Strictly for finding students */}
            <div className="hidden md:flex flex-1 items-center bg-white/60 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-brand-red/20 relative">
              <Search size={20} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Find students..." 
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none ml-3 text-sm text-slate-700 dark:text-slate-200 w-full placeholder-slate-400 font-normal"
                aria-label="Search users"
              />
              {isSearching && <Loader2 size={16} className="animate-spin text-brand-red" />}
              {userSearchQuery && !isSearching && (
                <button onClick={() => setUserSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Dropdown - Simplified: Name & Avatar Only */}
            {userSearchResults.length > 0 && userSearchQuery && (
              <div className="absolute top-[120%] left-0 w-[calc(100%-140px)] bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="px-4 py-2 border-b border-slate-50 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Found</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {userSearchResults.map(user => {
                     return (
                      <div
                        key={user.id}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default"
                      >
                        <button onClick={() => handleViewProfile(user.id)} className="flex items-center gap-3 text-left flex-1 focus:outline-none" aria-label={`View profile of ${user.name}`}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-slate-200 dark:bg-slate-700">
                                {user.avatar && user.avatar.startsWith('http') ? (
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" width="32" height="32" loading="lazy" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-600 dark:text-white">{user.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                            </div>
                        </button>
                      </div>
                  )})}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-all"
                aria-label="Notifications"
              >
                <Bell size={24} strokeWidth={2} />
                {(friendRequests.length > 0 || recentNotes.length > 0) && (
                     <span className="absolute top-2 right-2.5 w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                 <div className="absolute top-[120%] right-0 w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                     <div className="px-4 py-3 border-b border-slate-50 dark:border-white/5 flex justify-between items-center">
                         <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                         <button onClick={() => setIsNotificationsOpen(false)} aria-label="Close notifications"><X size={16} className="text-slate-400" /></button>
                     </div>
                     <div className="max-h-64 overflow-y-auto p-2">
                         {friendRequests.length === 0 && recentNotes.length === 0 ? (
                             <div className="text-center py-6 text-slate-400 text-sm">No new notifications</div>
                         ) : (
                             <>
                                {friendRequests.map(req => (
                                    <div key={req.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl mb-2">
                                        <p className="text-sm text-slate-800 dark:text-white mb-2">
                                            <span className="font-bold">{req.fromName}</span> sent a friend request.
                                        </p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleAcceptRequest(req)}
                                                className="flex-1 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-burgundy transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => rejectFriendRequest(req.id)}
                                                className="flex-1 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {recentNotes.map(note => (
                                    <div 
                                        key={note.id} 
                                        className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl mb-2 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors"
                                        onClick={() => {
                                            setIsNotificationsOpen(false);
                                            setActiveTab('website-notes');
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                                                <FileText size={10} /> New Resource
                                            </span>
                                            <span className="text-[10px] text-slate-400">{new Date(note.lastModified).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-1">{note.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{note.subject}</p>
                                    </div>
                                ))}
                             </>
                         )}
                     </div>
                 </div>
              )}

              <div className="relative">
                <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-red to-brand-burgundy flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-lg shadow-brand-red/20 hover:scale-105 transition-transform overflow-hidden"
                    aria-label="Profile Menu"
                >
                    {userAvatar ? (
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" width="40" height="40" loading="eager" />
                    ) : (
                    currentUserData?.name?.charAt(0).toUpperCase() || "U"
                    )}
                </button>

                {/* Profile Menu Dropdown */}
                {isProfileMenuOpen && (
                    <>
                        <button className="fixed inset-0 z-40 cursor-default bg-transparent w-full h-full" onClick={() => setIsProfileMenuOpen(false)} aria-label="Close menu" />
                        <div className="absolute top-[120%] right-0 w-48 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 space-y-1">
                                <button 
                                    onClick={() => {
                                        setViewingProfileId(null);
                                        setActiveTab('profile');
                                        setIsProfileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <UserIcon size={18} className="text-slate-400" />
                                    Profile
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsSettingsOpen(true);
                                        setIsProfileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <SettingsIcon size={18} className="text-slate-400" />
                                    Settings
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-white/5 my-1"></div>
                                <button 
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 px-4 lg:px-8 transition-all duration-200 ${activeTab === 'community' ? 'overflow-hidden pb-0' : 'overflow-y-auto pb-8 scroll-smooth'}`}>
          <div className={`max-w-[1600px] mx-auto ${activeTab === 'community' ? 'h-full pb-0' : 'pb-20'}`}>
            <div key={activeTab} className={`animate-fade-in ${activeTab === 'community' ? 'h-full' : ''}`}>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Profile Incomplete Reminder Modal */}
      {isProfileReminderOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-[28px] p-8 shadow-2xl border border-white/20 dark:border-white/10 relative transform scale-100 transition-all">
                <button 
                    onClick={handleCloseProfileReminder}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="w-14 h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-6">
                    <UserIcon size={32} className="text-brand-red" />
                </div>

                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Complete Your Profile</h3>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-8">
                    Your profile is missing some details like your <strong>username</strong>, <strong>class</strong>, or <strong>section</strong>. Please update them to get the best experience on Effimey.
                </p>
                
                <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => setDontRemind(!dontRemind)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${dontRemind ? 'bg-brand-red border-brand-red' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'}`}>
                        {dontRemind && (
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                    </div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                        Don't remind me again
                    </label>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleCloseProfileReminder} 
                        className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handleGoToProfile} 
                        className="flex-1 px-4 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 transition-all hover:scale-[1.02]"
                    >
                        Go to Profile
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal (Unchanged) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity w-full h-full cursor-default" onClick={() => setIsSettingsOpen(false)} aria-label="Close settings" />
          <div className="relative bg-white dark:bg-surface-dark rounded-[28px] shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all" aria-label="Close">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor size={22} className="text-slate-400" />
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Appearance</h4>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'system'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        theme === mode 
                          ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm' 
                          : 'border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {mode === 'light' ? <Sun size={24} className="mb-2" /> : mode === 'dark' ? <Moon size={24} className="mb-2" /> : <Monitor size={24} className="mb-2" />}
                      <span className="text-[10px] font-medium capitalize">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-white/5">
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsFeedbackOpen(true); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={22} className="text-slate-400 group-hover:text-brand-red transition-colors" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Send Feedback</span>
                  </div>
                </button>
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsTermsOpen(true); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                >
                   <div className="flex items-center gap-3">
                    <span className="text-slate-400 group-hover:text-brand-red transition-colors"><MessageSquare size={22} /></span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Terms of Service</span>
                  </div>
                </button>
                 <button 
                  onClick={() => { setIsSettingsOpen(false); setIsPrivacyOpen(true); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                >
                   <div className="flex items-center gap-3">
                    <span className="text-slate-400 group-hover:text-brand-red transition-colors"><MessageSquare size={22} /></span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Privacy Policy</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal (Unchanged) */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-md w-full h-full cursor-default" onClick={() => setIsFeedbackOpen(false)} aria-label="Close modal" />
          <div className="relative bg-white dark:bg-surface-dark w-full max-w-lg rounded-[28px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 dark:border-white/5">
            <div className="p-6 pb-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Send feedback to Effimey</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Help us improve your experience.</p>
            </div>

            <div className="px-6 py-4">
              <textarea 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="w-full h-32 bg-slate-50 dark:bg-black/20 border-none rounded-xl p-4 text-sm text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:ring-2 focus:ring-brand-red/20 outline-none transition-all"
                aria-label="Feedback message"
              />
            </div>

            <div className="p-6 pt-2 flex justify-end gap-3">
                <button onClick={() => setIsFeedbackOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">Cancel</button>
                <button onClick={handleSendFeedback} disabled={!feedbackText.trim()} className="px-6 py-2.5 bg-brand-red text-white text-sm font-medium rounded-full hover:bg-brand-burgundy disabled:opacity-50 transition-all">Send</button>
            </div>
          </div>
        </div>
      )}

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <AIChatWidget />
    </div>
  );
};

export default App;
