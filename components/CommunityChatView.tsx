
import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MoreVertical, Search, Image as ImageIcon, Camera, Plus, X, MessageSquare, Loader2, Check, Moon, Paperclip, FileText, Download, Phone, Video, Mic, Clock, Trash2, CornerUpRight, Edit2, MoreHorizontal } from 'lucide-react';
import { User } from '../types';
import { 
    createGroup, 
    getOrCreateDmChannel, 
    subscribeToGroups, 
    subscribeToMessages, 
    sendMessage, 
    uploadGroupLogo,
    uploadChatFile,
    markChannelAsRead,
    deleteMessage,
    editMessage,
    ChatGroup,
    GroupMessage
} from '../services/chatService';
import { createCall, joinCall, setupMediaSources } from '../services/webrtcService';
import VideoCallModal from './VideoCallModal';
import { getFriends } from '../services/userService';
import { auth, db } from '../services/firebase';

interface CommunityChatViewProps {
  targetUserId?: string | null;
}

const NOTIFICATION_SOUND_URL = 'public/Notis.mp3';

const CommunityChatView: React.FC<CommunityChatViewProps> = ({ targetUserId }) => {
  const [channels, setChannels] = useState<ChatGroup[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  
  // Call State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallExists, setActiveCallExists] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const callStartTimeRef = useRef<number | null>(null);
  
  // Create Group Form State
  const [newGroupLogoFile, setNewGroupLogoFile] = useState<File | null>(null);
  const [newGroupLogoPreview, setNewGroupLogoPreview] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  
  // Chat Attachment State
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Friends List for Group Creation
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Time Tick for Seen Status
  const [timeTick, setTimeTick] = useState(0);

  // Message Actions State
  const [messageToForward, setMessageToForward] = useState<GroupMessage | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');

  // Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupLogoInputRef = useRef<HTMLInputElement>(null);
  const newGroupLogoInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMsgIdRef = useRef<string | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    audioRef.current.load();
    audioRef.current.onerror = () => {
        console.warn('Chat notification audio failed to load.');
    };
  }, []);

  const playNotification = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented
                console.log('Chat notification playback blocked:', error);
            });
        }
    }
  };

  // Play sound on new incoming message
  useEffect(() => {
      if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          // If message is new (not in history we just loaded) and not from me
          // And message isn't too old (e.g. initial load of history)
          if (lastMsg.id !== lastMsgIdRef.current && lastMsg.senderId !== auth.currentUser?.uid) {
               // Only play if we are fairly close to now (real-time) to avoid sound blast on history load
               if (Date.now() - new Date(lastMsg.timestamp).getTime() < 10000) {
                   playNotification();
               }
          }
          lastMsgIdRef.current = lastMsg.id;
      }
  }, [messages]);

  // Listen to current user status for Focus Mode
  useEffect(() => {
      if (!auth.currentUser) return;
      const userRef = db.collection('users').doc(auth.currentUser.uid);
      const unsub = userRef.onSnapshot(doc => {
          const status = doc.data()?.status;
          setIsFocusMode(status === 'busy');
      });
      return () => unsub();
  }, []);

  // Update time tick every minute to refresh 'Seen Xm ago'
  useEffect(() => {
      const timer = setInterval(() => setTimeTick(t => t + 1), 60000);
      return () => clearInterval(timer);
  }, []);

  // 1. Subscribe to User's Groups on Mount
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToGroups(auth.currentUser.uid, (groups) => {
        setChannels(groups);
        if (!activeChannelId && groups.length > 0 && !targetUserId) {
            setActiveChannelId(groups[0].id);
        }
    });
    return () => unsubscribe();
  }, []);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // 2. Subscribe to Messages and Active Calls when Active Channel Changes
  useEffect(() => {
    if (messagesUnsubscribeRef.current) messagesUnsubscribeRef.current();
    setActiveCallExists(false);
    setEditingMessageId(null);
    setActiveMenuMessageId(null);

    if (activeChannelId && activeChannel) {
        messagesUnsubscribeRef.current = subscribeToMessages(activeChannelId, activeChannel.type, (msgs) => {
            setMessages(msgs);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        
        const callDoc = db.collection('calls').doc(activeChannelId);
        const unsubCall = callDoc.onSnapshot(async (snapshot) => {
            const hasCall = snapshot.exists && !!snapshot.data()?.offer;
            setActiveCallExists(hasCall);
        });
        
        return () => {
            unsubCall();
        }
    } else {
        setMessages([]);
    }

    return () => {
        if (messagesUnsubscribeRef.current) messagesUnsubscribeRef.current();
    };
  }, [activeChannelId, activeChannel]);

  // 3. Mark channel as read
  useEffect(() => {
    if (!activeChannelId || !activeChannel || !auth.currentUser || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastReadEntry = activeChannel.lastRead?.[auth.currentUser.uid];
    
    let shouldUpdate = false;

    if (!lastReadEntry) {
        shouldUpdate = true;
    } else {
        const lastReadTime = (typeof lastReadEntry.toMillis === 'function') 
            ? lastReadEntry.toMillis() 
            : new Date(lastReadEntry).getTime();
            
        const lastMsgTime = new Date(lastMessage.timestamp).getTime();
        
        if (lastMsgTime > lastReadTime + 1000) {
            shouldUpdate = true;
        }
    }

    if (shouldUpdate) {
        markChannelAsRead(activeChannelId, auth.currentUser.uid, activeChannel.type);
    }
  }, [activeChannelId, messages, activeChannel]);

  useEffect(() => {
    const initDm = async () => {
        if (targetUserId && auth.currentUser) {
            try {
                const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
                const friends = userDoc.data()?.friends || [];
                
                if (!friends.includes(targetUserId)) {
                    alert("You must be friends to chat with this user.");
                    return;
                }

                const targetUserDoc = await db.collection('users').doc(targetUserId).get();
                const targetName = targetUserDoc.exists ? (targetUserDoc.data()?.name || 'User') : 'User';
                const currentName = userDoc.data()?.name || auth.currentUser.displayName || 'User';

                const group = await getOrCreateDmChannel(auth.currentUser.uid, targetUserId, targetName, currentName);
                if (group) {
                   setActiveChannelId(group.id);
                }
            } catch (error) {
                console.error("Error initiating DM:", error);
            }
        }
    }
    initDm();
  }, [targetUserId]);

  useEffect(() => {
    if (isCreateGroupModalOpen && auth.currentUser) {
        setIsLoadingFriends(true);
        const fetchFriendsList = async () => {
            try {
                const userDoc = await db.collection('users').doc(auth.currentUser!.uid).get();
                const friendIds = userDoc.data()?.friends || [];
                if (friendIds.length > 0) {
                    const fullFriends = await getFriends(friendIds);
                    setFriendsList(fullFriends);
                } else {
                    setFriendsList([]);
                }
            } catch (error) {
                console.error("Error fetching friends", error);
            } finally {
                setIsLoadingFriends(false);
            }
        };
        fetchFriendsList();
    }
  }, [isCreateGroupModalOpen]);

  // Close message menu on click outside
  useEffect(() => {
      const handleClickOutside = () => setActiveMenuMessageId(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !chatFile) || !activeChannelId || !activeChannel || !auth.currentUser) return;

    setIsUploading(true);
    try {
        let attachment = null;
        if (chatFile) {
            attachment = await uploadChatFile(activeChannelId, chatFile);
        }

        await sendMessage(
            activeChannelId, 
            inputText, 
            auth.currentUser.uid, 
            auth.currentUser.displayName || 'Unknown',
            activeChannel.type,
            attachment
        );
        setInputText('');
        setChatFile(null);
    } catch (e) {
        console.error("Failed to send message", e);
        alert("Failed to send message.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, msg: GroupMessage) => {
      e.stopPropagation();
      setEditingMessageId(msg.id);
      setEditingText(msg.text || '');
      setActiveMenuMessageId(null);
  };

  const handleCancelEdit = () => {
      setEditingMessageId(null);
      setEditingText('');
  };

  const handleSaveEdit = async () => {
      if (!activeChannelId || !activeChannel || !editingMessageId) return;
      try {
          await editMessage(activeChannelId, editingMessageId, editingText, activeChannel.type);
          setEditingMessageId(null);
          setEditingText('');
      } catch (e) {
          alert("Failed to update message");
      }
  };

  const handleDeleteMessage = async (e: React.MouseEvent, messageId: string) => {
      e.stopPropagation();
      if (!activeChannelId || !activeChannel) return;
      if (confirm("Are you sure you want to delete this message?")) {
          try {
              await deleteMessage(activeChannelId, messageId, activeChannel.type);
          } catch (e) {
              alert("Failed to delete message");
          }
      }
      setActiveMenuMessageId(null);
  };

  const initForwardMessage = (e: React.MouseEvent, msg: GroupMessage) => {
      e.stopPropagation();
      setMessageToForward(msg);
      setIsForwardModalOpen(true);
      setForwardSearchQuery('');
      setActiveMenuMessageId(null);
  };

  const handleForwardToChannel = async (targetChannel: ChatGroup) => {
      if (!messageToForward || !auth.currentUser) return;
      try {
          await sendMessage(
              targetChannel.id,
              messageToForward.text || "",
              auth.currentUser.uid,
              auth.currentUser.displayName || 'Unknown',
              targetChannel.type,
              messageToForward.attachment ? { ...messageToForward.attachment } : null
          );
          setIsForwardModalOpen(false);
          setMessageToForward(null);
          setActiveChannelId(targetChannel.id);
      } catch (e) {
          alert("Failed to forward message");
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 10 * 1024 * 1024) {
              alert("File is too large (Max 10MB)");
              return;
          }
          setChatFile(file);
      }
      e.target.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !auth.currentUser) return;
    try {
        const groupId = await createGroup({
            name: newGroupName,
            type: 'channel',
            description: newGroupDesc || 'New study group',
            memberIds: [auth.currentUser.uid, ...newGroupMembers],
            createdBy: auth.currentUser.uid,
            inviteCode: Math.random().toString(36).substring(7)
        });

        if (newGroupLogoFile) {
            await uploadGroupLogo(groupId, newGroupLogoFile, 'channel');
        }

        setActiveChannelId(groupId);
        setIsCreateGroupModalOpen(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setNewGroupMembers([]);
        setNewGroupLogoFile(null);
        setNewGroupLogoPreview(null);
    } catch (e) {
        alert("Failed to create group");
    }
  };

  // ... (Call functions remain same)
  const handleStartCall = async (video: boolean = true) => {
      if (!activeChannelId || !auth.currentUser || !activeChannel) return;
      try {
          setIsCaller(true);
          const { localStream, remoteStream } = await setupMediaSources(video);
          setLocalStream(localStream);
          setRemoteStream(remoteStream);
          setIsCallModalOpen(true);
          callStartTimeRef.current = Date.now();
          await sendMessage(activeChannelId, video ? "Started a video call" : "Started an audio call", auth.currentUser.uid, auth.currentUser.displayName || 'Unknown', activeChannel.type, null, 'call');
          await createCall(activeChannelId, (stream) => { setRemoteStream(stream); });
      } catch (e) {
          console.error("Error starting call:", e);
          alert("Could not access camera/microphone.");
      }
  };

  const handleJoinCall = async () => {
      if (!activeChannelId) return;
      try {
          setIsCaller(false);
          const { localStream, remoteStream } = await setupMediaSources(true);
          setLocalStream(localStream);
          setRemoteStream(remoteStream);
          setIsCallModalOpen(true);
          callStartTimeRef.current = Date.now();
          await joinCall(activeChannelId, (stream) => { setRemoteStream(stream); });
      } catch (e) {
          console.error("Error joining call:", e);
          alert("Could not join call.");
      }
  };

  const handleCallClose = async () => {
      let duration = 0;
      if (callStartTimeRef.current) duration = Math.round((Date.now() - callStartTimeRef.current) / 1000);
      if (activeChannelId && auth.currentUser && activeChannel) {
          await sendMessage(activeChannelId, "Call ended", auth.currentUser.uid, auth.currentUser.displayName || 'Unknown', activeChannel.type, null, 'call', duration);
      }
      setIsCallModalOpen(false);
      setLocalStream(null);
      setRemoteStream(null);
      callStartTimeRef.current = null;
  };

  const formatDuration = (seconds: number) => {
      if (!seconds) return '';
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
  };

  const handleNewGroupLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewGroupLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewGroupLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGroupLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeChannelId && activeChannel) {
          await uploadGroupLogo(activeChannelId, file, activeChannel.type);
      }
  };

  const toggleMemberSelection = (userId: string) => {
      if (newGroupMembers.includes(userId)) {
          setNewGroupMembers(prev => prev.filter(id => id !== userId));
      } else {
          setNewGroupMembers(prev => [...prev, userId]);
      }
  };

  const getChannelName = (channel: ChatGroup) => {
      if (channel.type === 'dm' && channel.participantNames && auth.currentUser) {
          const otherId = channel.memberIds.find(id => id !== auth.currentUser?.uid);
          if (otherId && channel.participantNames[otherId]) {
              return channel.participantNames[otherId];
          }
      }
      return channel.name; 
  };

  const getLastSeenMessageId = () => {
    if (!activeChannel || activeChannel.type !== 'dm' || !auth.currentUser) return null;
    const otherUserId = activeChannel.memberIds.find(id => id !== auth.currentUser?.uid);
    if (!otherUserId) return null;
    const readTimestamp = activeChannel.lastRead?.[otherUserId];
    if (!readTimestamp) return null;
    const readTimeMillis = (typeof readTimestamp.toMillis === 'function') ? readTimestamp.toMillis() : new Date(readTimestamp).getTime();
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.senderId === auth.currentUser.uid) {
            const msgTime = new Date(msg.timestamp).getTime();
            if (readTimeMillis >= msgTime) return msg.id; 
        }
    }
    return null;
  };

  const getReadTimeMillis = () => {
      if (!activeChannel || activeChannel.type !== 'dm' || !auth.currentUser) return 0;
      const otherUserId = activeChannel.memberIds.find(id => id !== auth.currentUser?.uid);
      if (!otherUserId) return 0;
      const ts = activeChannel.lastRead?.[otherUserId];
      if (!ts) return 0;
      return (typeof ts.toMillis === 'function') ? ts.toMillis() : new Date(ts).getTime();
  };

  const formatSeenTime = (timestamp: number) => {
      if (!timestamp) return 'Seen';
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
      if (diffSeconds < 60) return "Seen just now";
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `Seen ${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Seen ${diffHours}h ago`;
      return `Seen ${Math.floor(diffHours/24)}d ago`;
  };

  const isUnread = (channel: ChatGroup) => {
    if (!auth.currentUser) return false;
    // If active channel, don't show unread dot
    if (channel.id === activeChannelId) return false;

    const lastMsg = channel.lastMessageAt;
    if (!lastMsg) return false;
    
    const lastMsgTime = typeof lastMsg.toMillis === 'function' ? lastMsg.toMillis() : new Date(lastMsg).getTime();
    
    const readEntry = channel.lastRead?.[auth.currentUser.uid];
    const lastReadTime = readEntry 
        ? (typeof readEntry.toMillis === 'function' ? readEntry.toMillis() : new Date(readEntry).getTime())
        : 0;
        
    return lastMsgTime > lastReadTime;
  };

  const lastSeenMsgId = getLastSeenMessageId();
  const readTime = getReadTimeMillis();

  const displayChannels = channels.filter(c => c.type === 'channel' && c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const displayDms = channels.filter(c => c.type === 'dm' && getChannelName(c).toLowerCase().includes(searchQuery.toLowerCase()));
  
  const forwardChannels = channels.filter(c => {
      const name = getChannelName(c);
      return name.toLowerCase().includes(forwardSearchQuery.toLowerCase());
  });

  return (
    <div className="h-full flex gap-6 overflow-hidden relative pb-4">
      
      {isFocusMode && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 h-full rounded-[28px] border border-white/10">
              <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Moon size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Focus Mode Active</h2>
              <p className="text-slate-300 max-w-md">
                  Messages are silenced while you study. Good luck with your session!
              </p>
          </div>
      )}

      {isCallModalOpen && activeChannel && (
          <VideoCallModal 
            channelId={activeChannelId}
            channelName={getChannelName(activeChannel)}
            localStream={localStream}
            remoteStream={remoteStream}
            onClose={handleCallClose}
            isCaller={isCaller}
          />
      )}

      {/* Sidebar Channel List */}
      <div className={`w-80 flex flex-col bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[28px] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden shrink-0 ${isFocusMode ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
        <div className="p-6 pb-2">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Study Groups</h2>
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter chats..." 
                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                aria-label="Filter chats"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6">
          
          {/* Groups Section */}
          <div>
                <div className="px-3 mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Groups</span>
                  <button 
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    className="p-1 text-slate-400 hover:text-brand-red hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    aria-label="Create Group"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {displayChannels.length > 0 ? (
                    <div className="space-y-1">
                    {displayChannels.map(channel => (
                        <button
                        key={channel.id}
                        onClick={() => { setActiveChannelId(channel.id); setSearchQuery(''); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                            activeChannelId === channel.id 
                            ? 'bg-brand-red text-white shadow-md shadow-brand-red/20' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        >
                        <div className="flex items-center gap-3 w-full overflow-hidden">
                            <div className="relative shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden ${
                                    activeChannelId === channel.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                }`}>
                                    {channel.logo ? (
                                        <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover" width="32" height="32" loading="lazy" />
                                    ) : (
                                        channel.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                {isUnread(channel) && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-red border-2 border-white dark:border-surface-dark rounded-full"></div>
                                )}
                            </div>
                            <span className="truncate flex-1 text-left">{channel.name}</span>
                        </div>
                        </button>
                    ))}
                    </div>
                ) : (
                    <div className="px-3 text-xs text-slate-400 italic">No groups found.</div>
                )}
            </div>

          {/* DMs Section */}
          {(displayDms.length > 0) && (
            <div>
                <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Messages</span>
                </div>
                <div className="space-y-1">
                {displayDms.map(channel => {
                    const name = getChannelName(channel);
                    return (
                    <button
                        key={channel.id}
                        onClick={() => { setActiveChannelId(channel.id); setSearchQuery(''); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                        activeChannelId === channel.id 
                        ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                    >
                        <div className="relative shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-slate-400`}>
                                {name.charAt(0)}
                            </div>
                            {isUnread(channel) && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-red border-2 border-white dark:border-surface-dark rounded-full"></div>
                            )}
                        </div>
                        <span className="truncate flex-1 text-left">{name}</span>
                    </button>
                    );
                })}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[28px] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden relative ${isFocusMode ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
        
        {!activeChannel ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-60">
                 <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={40} className="text-slate-300 dark:text-slate-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No conversation selected</h3>
            </div>
        ) : (
        <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity text-left bg-transparent border-none p-0"
                        onClick={() => {
                            if (activeChannel.type === 'channel') setIsGroupInfoModalOpen(true);
                        }}
                        disabled={activeChannel.type === 'dm'}
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 overflow-hidden">
                            {activeChannel.logo ? (
                                <img src={activeChannel.logo} alt={activeChannel.name} className="w-full h-full object-cover" width="40" height="40" loading="lazy" />
                            ) : (
                                <span className="font-bold">{getChannelName(activeChannel).substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                            {getChannelName(activeChannel)}
                            {activeChannel.type === 'channel' && <span className="text-[10px] font-normal px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full text-slate-500 dark:text-slate-400">Group</span>}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Users size={12} /> {activeChannel.memberIds.length} members
                        </p>
                        </div>
                    </button>
                </div>
            
                <div className="flex items-center gap-2">
                    {activeCallExists ? (
                        <button 
                            onClick={handleJoinCall}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-pulse"
                        >
                            <Phone size={16} /> Join Call
                        </button>
                    ) : (
                        <>
                            <button onClick={() => handleStartCall(false)} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><Phone size={20} /></button>
                            <button onClick={() => handleStartCall(true)} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><Video size={20} /></button>
                        </>
                    )}
                    <button onClick={() => { if (activeChannel.type === 'channel') setIsGroupInfoModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No messages yet.</p>
                </div>
            ) : (
                messages.map((msg, index) => {
                if (msg.type === 'call') {
                    return (
                        <div key={msg.id} className="flex flex-col items-center justify-center my-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-slate-100 dark:bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-slate-200 dark:border-white/5">
                                <div className={`p-1 rounded-full ${msg.text.includes('ended') ? 'bg-red-100 text-red-500 dark:bg-red-900/20' : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/20'}`}>
                                    <Phone size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {msg.text.includes('ended') ? `Call Ended` : msg.text}
                                </span>
                                {msg.callDuration !== undefined && msg.callDuration !== null && (
                                    <span className="text-xs text-slate-400 font-mono border-l border-slate-300 dark:border-white/10 pl-2 ml-1">
                                        {formatDuration(msg.callDuration)}
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400 ml-1">
                                    • {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    );
                }

                const isMe = msg.senderId === auth.currentUser?.uid;
                const isSequence = index > 0 && messages[index - 1].senderId === msg.senderId && messages[index-1].type !== 'call';
                const isEditing = editingMessageId === msg.id;

                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSequence ? 'mt-1' : 'mt-4'} group relative`}>
                        <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} items-end w-full`}>
                            {!isMe && !isSequence && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-500 shadow-sm mb-4`}>
                                {msg.senderName?.charAt(0) || '?'}
                                </div>
                            )}
                            {!isMe && isSequence && <div className="w-8 shrink-0"></div>}
                            
                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'} relative group/msg`}>
                                {!isSequence && !isMe && (
                                <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1">{msg.senderName}</span>
                                )}
                                <div 
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm relative ${
                                    isMe 
                                    ? 'bg-brand-red text-white rounded-tr-sm' 
                                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-tl-sm'
                                }`}
                                >
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <textarea 
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                className="bg-white/20 dark:bg-black/20 border border-white/30 rounded p-2 text-white outline-none w-full text-sm resize-none"
                                                rows={3}
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleCancelEdit} className="px-3 py-1 hover:bg-white/20 rounded text-xs font-bold text-white/80 hover:text-white transition-colors">Cancel</button>
                                                <button onClick={handleSaveEdit} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold text-white transition-colors">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.attachment && (
                                                <div className="mb-2">
                                                    {msg.attachment.type === 'image' ? (
                                                        <a href={msg.attachment.url} target="_blank" rel="noreferrer">
                                                            <img 
                                                                src={msg.attachment.url} 
                                                                alt="attachment" 
                                                                className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a 
                                                            href={msg.attachment.url} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                        >
                                                            <div className={`p-1.5 rounded ${isMe ? 'bg-white/20' : 'bg-white dark:bg-white/10'}`}>
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="font-bold truncate max-w-[150px]">{msg.attachment.name}</span>
                                                                <span className="text-[10px] opacity-80 uppercase font-bold">File</span>
                                                            </div>
                                                            <Download size={16} className="ml-1 opacity-70" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.text && <span className="whitespace-pre-wrap">{msg.text}</span>}
                                            {msg.isEdited && <span className="text-[9px] opacity-70 ml-1 italic block text-right mt-1">(edited)</span>}
                                        </>
                                    )}
                                </div>
                                {!isSequence && msg.timestamp && (
                                    <span className={`text-[10px] text-slate-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                )}

                                {/* Action Menu Button */}
                                {!isEditing && (
                                    <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id); }}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        {activeMenuMessageId === msg.id && (
                                            <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-slate-100 dark:border-white/10 z-50 min-w-[120px] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100`}>
                                                <button onClick={(e) => initForwardMessage(e, msg)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                    <CornerUpRight size={14} /> Forward
                                                </button>
                                                {isMe && (
                                                    <>
                                                        <button onClick={(e) => handleStartEdit(e, msg)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <div className="h-px bg-slate-100 dark:bg-white/5 my-1"></div>
                                                        <button onClick={(e) => handleDeleteMessage(e, msg.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Seen Indicator */}
                        {lastSeenMsgId === msg.id && (
                            <div className="text-[10px] text-slate-400 text-right mt-1 mr-1 font-medium select-none">
                                {formatSeenTime(readTime)}
                            </div>
                        )}
                    </div>
                );
                })
            )}
            <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/40 dark:bg-black/20 backdrop-blur-md border-t border-slate-100 dark:border-white/5">
                {chatFile && (
                    <div className="mb-2 p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                {chatFile.type.startsWith('image/') ? <ImageIcon size={20} className="text-slate-500" /> : <FileText size={20} className="text-slate-500" />}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{chatFile.name}</p>
                                <p className="text-xs text-slate-500">{(chatFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button onClick={() => setChatFile(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 transition-colors"><X size={16} /></button>
                    </div>
                )}

                <div className="bg-white dark:bg-[#003366] rounded-[24px] shadow-sm border border-slate-200 dark:border-white/5 p-2 flex items-end gap-2 transition-all focus-within:ring-2 focus-within:ring-brand-red/10 focus-within:border-brand-red/50 relative">
                    <input type="file" ref={chatFileInputRef} className="hidden" onChange={handleFileSelect} aria-label="Upload File" />
                    <button onClick={() => chatFileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors mb-0.5"><Paperclip size={20} /></button>
                    <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyPress} placeholder={`Message ${getChannelName(activeChannel)}`} className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-400 text-sm py-3 min-h-[44px] max-h-32 resize-none" rows={1} aria-label="Message Input" />
                    <div className="flex items-center gap-1 shrink-0 pb-1">
                        <button onClick={handleSendMessage} disabled={(!inputText.trim() && !chatFile) || isUploading} className="p-2.5 bg-brand-red text-white rounded-full hover:bg-brand-burgundy disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-red/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </>
        )}
      </div>

      {/* Forward Modal */}
      {isForwardModalOpen && messageToForward && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsForwardModalOpen(false)} />
           <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-[24px] shadow-2xl flex flex-col border border-white/20 dark:border-white/5 max-h-[80vh]">
              <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><CornerUpRight size={20} className="text-blue-500" /> Forward Message</h3>
                <button onClick={() => setIsForwardModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 italic line-clamp-3">{messageToForward.text || (messageToForward.attachment ? "[Attachment]" : "")}</div>
              </div>
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" value={forwardSearchQuery} onChange={(e) => setForwardSearchQuery(e.target.value)} placeholder="Search chats..." className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-white outline-none" />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {forwardChannels.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">No channels found.</div> : forwardChannels.map(channel => (
                      <button key={channel.id} onClick={() => handleForwardToChannel(channel)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group text-left">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                                <span className="font-bold text-slate-500 dark:text-slate-400">{getChannelName(channel).substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{getChannelName(channel)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{channel.type === 'dm' ? 'Direct Message' : 'Group Chat'}</p>
                            </div>
                          </div>
                          <div className="bg-blue-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Send size={14} /></div>
                      </button>
                  ))}
              </div>
           </div>
        </div>
      )}

      {/* Create Group & Group Info Modals ... (Using existing logic, minimal changes) */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
           <button className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setIsCreateGroupModalOpen(false)} />
           <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-[28px] shadow-2xl flex flex-col border border-white/20 dark:border-white/5 max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Create Group</h3>
                <button onClick={() => setIsCreateGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                 <div className="flex justify-center">
                    <button className="relative group cursor-pointer border-none bg-transparent" onClick={() => newGroupLogoInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-red transition-colors">
                            {newGroupLogoPreview ? <img src={newGroupLogoPreview} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-400" />}
                        </div>
                        <input type="file" ref={newGroupLogoInputRef} onChange={handleNewGroupLogoUpload} className="hidden" accept="image/*" />
                    </button>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                    <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Calculus Study Squad" className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/20 dark:text-white" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                    <textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="What's this group about?" className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/20 dark:text-white min-h-[80px] resize-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Friends</label>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-black/20 rounded-xl p-2 border border-slate-100 dark:border-white/5">
                        {isLoadingFriends ? <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div> : friendsList.length === 0 ? <div className="text-center py-4 text-sm text-slate-400">You haven't added any friends yet.</div> : friendsList.map(friend => (
                            <button key={friend.id} onClick={() => toggleMemberSelection(friend.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-left ${newGroupMembers.includes(friend.id) ? 'bg-brand-red/10 dark:bg-brand-red/20' : 'hover:bg-slate-200 dark:hover:bg-white/5'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${newGroupMembers.includes(friend.id) ? 'bg-brand-red border-brand-red' : 'border-slate-300 dark:border-slate-600'}`}>{newGroupMembers.includes(friend.id) && <Check size={12} className="text-white" />}</div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{friend.name}</span>
                            </button>
                        ))}
                    </div>
                 </div>
                 <button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="w-full py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-burgundy disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-red/20 transition-all">Create Group</button>
              </div>
           </div>
        </div>
      )}

      {isGroupInfoModalOpen && activeChannel && activeChannel.type === 'channel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
           <button className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setIsGroupInfoModalOpen(false)} />
           <div className="relative bg-white dark:bg-surface-dark w-full max-w-lg rounded-[28px] shadow-2xl flex flex-col border border-white/20 dark:border-white/5 max-h-[85vh]">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Group Details</h3>
                <button onClick={() => setIsGroupInfoModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 <div className="flex flex-col items-center text-center">
                    <button className="relative group mb-3 bg-transparent border-none">
                         <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                            {activeChannel.logo ? <img src={activeChannel.logo} alt={activeChannel.name} className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-slate-400">{activeChannel.name.substring(0, 2).toUpperCase()}</span>}
                         </div>
                         <div onClick={() => groupLogoInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera size={24} className="text-white" /></div>
                         <input type="file" ref={groupLogoInputRef} onChange={handleGroupLogoChange} className="hidden" accept="image/*" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{activeChannel.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeChannel.description}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunityChatView;
