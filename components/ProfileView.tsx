
import React, { useState, useEffect, useRef } from 'react';
import { User, School as SchoolIcon, BookOpen, MapPin, Save, Camera, X, Image as ImageIcon, MessageSquare, UserPlus, Lock, AtSign, Wand2, UserCheck } from 'lucide-react';
import { getUserById, sendFriendRequest, checkUsernameExists } from '../services/userService';
import { subscribeToSchools } from '../services/developerService';
import { auth, db, storage } from '../services/firebase';
import { School, User as UserType } from '../types';

interface UserProfile {
  name: string;
  username: string;
  email: string;
  school: string;
  major: string;
  class: string;
  section: string;
  bio: string;
  location: string;
  joinDate: string;
}

interface ProfileViewProps {
    viewingUserId?: string | null;
    onStartChat?: (userId: string) => void;
    currentUser?: UserType | null;
}

const ProfileView: React.FC<ProfileViewProps> = ({ viewingUserId, onStartChat, currentUser }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Determine if we are viewing our own profile or someone else's
  const isOwnProfile = !viewingUserId || (auth.currentUser && viewingUserId === auth.currentUser.uid);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Student',
    username: '',
    email: '',
    school: 'State University',
    major: 'Computer Science',
    class: '',
    section: '',
    bio: 'Aspiring professional passionate about learning.',
    location: 'City, Country',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  });

  // Main Image State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  // Temporary State for Edit Modal
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [tempBanner, setTempBanner] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [usernameError, setUsernameError] = useState<string>('');
  
  // Custom School State
  const [isCustomSchool, setIsCustomSchool] = useState(false);
  
  // Schools List
  const [schoolsList, setSchoolsList] = useState<School[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to schools
  useEffect(() => {
    const unsubscribe = subscribeToSchools(setSchoolsList);
    return () => unsubscribe();
  }, []);

  // Load User Data
  useEffect(() => {
    const loadProfileData = async () => {
        setIsLoadingProfile(true);
        try {
            let targetUid = viewingUserId;
            
            // If viewing own profile (or default), get current auth user ID
            if (isOwnProfile && auth.currentUser) {
                targetUid = auth.currentUser.uid;
            }

            if (!targetUid) return;

            // Fetch from Firestore
            let userData: any = null;
            
            if (isOwnProfile) {
                const userDoc = await db.collection('users').doc(targetUid).get();
                if (userDoc.exists) userData = userDoc.data();
            } else {
                const fetchedUser = await getUserById(targetUid);
                if (fetchedUser) userData = fetchedUser;
            }

            if (userData) {
                setProfile(prev => ({
                    ...prev,
                    name: userData.name || userData.displayName || 'Student',
                    username: userData.username || '',
                    email: userData.email || '',
                    school: userData.school || 'University',
                    major: userData.major || 'Major',
                    class: userData.class || '',
                    section: userData.section || '',
                    bio: userData.bio || 'No bio yet.',
                    location: userData.location || 'Location',
                }));
                
                if (userData.avatarUrl || userData.avatar) {
                    setAvatarUrl(userData.avatarUrl || userData.avatar);
                } else {
                    setAvatarUrl(null);
                }

                if (userData.bannerUrl) {
                    setBannerUrl(userData.bannerUrl);
                } else {
                    setBannerUrl(null);
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    loadProfileData();
  }, [viewingUserId, isOwnProfile]);

  const handleEditClick = () => {
    setEditForm({ ...profile });
    setTempAvatar(avatarUrl);
    setTempBanner(bannerUrl);
    setUsernameError('');
    
    // Check if current school is in list
    const schoolExists = schoolsList.some(s => s.name === profile.school);
    if (profile.school && !schoolExists && schoolsList.length > 0) {
        setIsCustomSchool(true);
    } else {
        setIsCustomSchool(false);
    }
    
    // Attempt to parse existing location if needed
    if (profile.location) {
        const parts = profile.location.split(',').map(s => s.trim());
        if (parts.length === 2) {
             const city = parts[0];
             const state = parts[1];
             setSelectedCity(city);
             setSelectedState(state);
        }
    }
    
    setIsEditModalOpen(true);
  };

  const generateUsername = () => {
      const baseName = editForm.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const randomSuffix = Math.floor(Math.random() * 1000);
      const newUsername = `${baseName}_${randomSuffix}`;
      setEditForm(prev => ({ ...prev, username: newUsername }));
      setUsernameError('');
  };

  const uploadImageToStorage = async (dataUrl: string, path: string) => {
      try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const ref = storage.ref(path);
          await ref.put(blob);
          return await ref.getDownloadURL();
      } catch (error) {
          console.error("Image upload failed:", error);
          throw error;
      }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;
    setUsernameError('');
    setLoading(true);
    
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("No user authenticated");

        // --- VALIDATION START ---
        const finalUsername = editForm.username.trim().toLowerCase();
        const usernameRegex = /^[a-z0-9_]+$/;

        if (!finalUsername) {
            setUsernameError('Username is required.');
            setLoading(false);
            return;
        }

        if (!usernameRegex.test(finalUsername)) {
            setUsernameError('Only letters, numbers, and underscores allowed.');
            setLoading(false);
            return;
        }

        // Check uniqueness only if changed
        if (finalUsername !== profile.username) {
            const exists = await checkUsernameExists(finalUsername);
            if (exists) {
                setUsernameError('This username is already taken. Please try another.');
                setLoading(false);
                return;
            }
        }
        // --- VALIDATION END ---

        if (editForm.name !== currentUser.displayName) {
            await currentUser.updateProfile({ displayName: editForm.name });
        }

        // Image Handling
        let finalAvatarUrl = avatarUrl;
        let finalBannerUrl = bannerUrl;

        // Upload Avatar if changed and is base64 (new upload)
        if (tempAvatar && tempAvatar !== avatarUrl && tempAvatar.startsWith('data:')) {
            finalAvatarUrl = await uploadImageToStorage(tempAvatar, `users/${currentUser.uid}/avatar_${Date.now()}`);
        } else if (tempAvatar === null) {
            finalAvatarUrl = null;
        }

        // Upload Banner if changed and is base64 (new upload)
        if (tempBanner && tempBanner !== bannerUrl && tempBanner.startsWith('data:')) {
            finalBannerUrl = await uploadImageToStorage(tempBanner, `users/${currentUser.uid}/banner_${Date.now()}`);
        } else if (tempBanner === null) {
            finalBannerUrl = null;
        }

        const firestoreData = {
            name: editForm.name,
            username: finalUsername,
            email: editForm.email,
            school: editForm.school,
            major: editForm.major,
            class: editForm.class,
            section: editForm.section,
            bio: editForm.bio,
            location: editForm.location,
            avatarUrl: finalAvatarUrl,
            bannerUrl: finalBannerUrl,
            lastUpdated: new Date().toISOString()
        };

        await db.collection('users').doc(currentUser.uid).set(firestoreData, { merge: true });

        setProfile({ ...editForm, username: finalUsername });
        
        if (finalAvatarUrl !== avatarUrl) {
            setAvatarUrl(finalAvatarUrl);
            if (finalAvatarUrl) localStorage.setItem('effimey_user_avatar', finalAvatarUrl);
            window.dispatchEvent(new Event('user-avatar-update'));
        }
        
        if (finalBannerUrl !== bannerUrl) {
            setBannerUrl(finalBannerUrl);
            if (finalBannerUrl) localStorage.setItem('effimey_user_banner', finalBannerUrl);
        }

        setIsEditModalOpen(false);

    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save changes. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check (5MB limit for sanity before upload)
      if (file.size > 5 * 1024 * 1024) {
          alert("File is too large. Please select an image under 5MB.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'avatar') setTempAvatar(result);
        else setTempBanner(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      
      if (val === 'Other') {
          setIsCustomSchool(true);
          setEditForm(prev => ({ ...prev, school: '' }));
          // Clear location locks
          setSelectedState('');
          setSelectedCity('');
          setEditForm(prev => ({ ...prev, location: '' }));
      } else {
          setIsCustomSchool(false);
          setEditForm(prev => ({ ...prev, school: val }));
          
          const matchedSchool = schoolsList.find(s => s.name === val);
          if (matchedSchool && matchedSchool.region) {
              const region = matchedSchool.region;
              const parts = region.split(',').map(s => s.trim());
              if (parts.length === 2) {
                  const city = parts[0];
                  const state = parts[1];
                  setSelectedState(state);
                  setSelectedCity(city);
              } else {
                  setSelectedState('');
                  setSelectedCity('');
              }
              setEditForm(prev => ({ ...prev, location: region }));
          } else if (!val) {
              setSelectedState('');
              setSelectedCity('');
              setEditForm(prev => ({ ...prev, location: '' }));
          }
      }
  };

  const handleAddFriend = async () => {
    if (!auth.currentUser || !viewingUserId) return;
    try {
        await sendFriendRequest({
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || 'User',
            email: auth.currentUser.email || '',
            avatar: localStorage.getItem('effimey_user_avatar') || '',
            status: 'online'
        }, viewingUserId);
        alert('Friend request sent!');
    } catch (e) {
        alert('Could not send friend request.');
    }
  };

  const isLocationLocked = !!editForm.school && schoolsList.some(s => s.name === editForm.school);
  
  // Friendship check
  const isFriend = viewingUserId && currentUser?.friends?.includes(viewingUserId);

  if (isLoadingProfile) {
      return <div className="flex h-96 items-center justify-center"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Profile Header Card */}
      <div className="relative bg-white dark:bg-surface-dark rounded-[32px] overflow-hidden shadow-sm border border-slate-100 dark:border-white/5">
        {/* Cover Image */}
        <div className="h-48 relative bg-slate-100 dark:bg-slate-800">
           {bannerUrl ? (
               <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" width="1024" height="192" loading="eager" />
           ) : (
               <div className="w-full h-full bg-gradient-to-r from-brand-red to-brand-burgundy"></div>
           )}
           <div className="absolute inset-0 bg-black/10"></div>
           <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-[28px] bg-white dark:bg-surface-dark p-2 shadow-xl">
                 <div className="w-full h-full rounded-[22px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" width="128" height="128" loading="eager" />
                    ) : (
                      <span className="text-4xl font-bold text-slate-400">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                 </div>
              </div>
            </div>

            {/* Header Info */}
            <div className="flex-1 mb-2">
               <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{profile.name}</h1>
               {profile.username && (
                   <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-2">@{profile.username}</p>
               )}
               <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <SchoolIcon size={16} />
                    {profile.school}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={16} />
                    {profile.major}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    {profile.location}
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-2 w-full md:w-auto">
               {isOwnProfile ? (
                   <button 
                      onClick={handleEditClick}
                      className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
                   >
                      Edit Profile
                   </button>
               ) : (
                   <>
                       <button 
                          onClick={() => viewingUserId && onStartChat && onStartChat(viewingUserId)}
                          className="px-6 py-2.5 rounded-xl bg-brand-red text-white font-bold hover:bg-brand-burgundy transition-all flex items-center gap-2"
                       >
                          <MessageSquare size={18} /> Message
                       </button>
                       {isFriend ? (
                           <button 
                              disabled
                              className="px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold cursor-default flex items-center gap-2 border border-emerald-200 dark:border-emerald-800"
                           >
                              <UserCheck size={18} /> 
                              <span className="hidden sm:inline">Friend</span>
                           </button>
                       ) : (
                           <button 
                              onClick={handleAddFriend}
                              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                              aria-label="Add Friend"
                           >
                              <UserPlus size={18} />
                           </button>
                       )}
                   </>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-brand-red/10 text-brand-red rounded-xl">
                    <User size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">About</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{profile.bio}"
                    </p>
                </div>
                <div className="h-px bg-slate-100 dark:bg-white/5 md:col-span-2 my-2"></div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">University / School</h4>
                    <p className="text-base font-medium text-slate-800 dark:text-white">{profile.school}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Major / Subject</h4>
                    <p className="text-base font-medium text-slate-800 dark:text-white">{profile.major}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Class & Section</h4>
                    <p className="text-base font-medium text-slate-800 dark:text-white">
                        {profile.class || profile.section ? `${profile.class} ${profile.section ? '- ' + profile.section : ''}` : 'Not set'}
                    </p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</h4>
                    <p className="text-base font-medium text-slate-800 dark:text-white">{profile.location}</p>
                </div>
                {isOwnProfile && (
                    <div className="md:col-span-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</h4>
                        <p className="text-base font-medium text-slate-800 dark:text-white">{profile.email}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Settings (Only for Own Profile) */}
        {isOwnProfile && (
            <div className="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Account Settings</h2>
                    <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl">
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Email Notifications</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Receive weekly study summaries</p>
                        </div>
                        <button className="w-12 h-6 bg-brand-red rounded-full relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red" role="switch" aria-checked="true" aria-label="Toggle email notifications">
                            <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </button>
                    </div>
                    </div>
            </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setIsEditModalOpen(false)} aria-label="Close modal" />
          <div className="relative bg-white dark:bg-surface-dark w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[32px] shadow-2xl flex flex-col border border-white/20 dark:border-white/5 transform scale-100">
             
             {/* Modal Header */}
             <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-surface-dark z-20">
                <h3 id="edit-profile-title" className="text-xl font-bold text-slate-800 dark:text-white">Edit Profile</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
             </div>

             {/* Image Editing Section */}
             <div className="relative h-48 bg-slate-100 dark:bg-black/20 group">
                {tempBanner ? (
                    <img src={tempBanner} alt="Banner Preview" className="w-full h-full object-cover opacity-80" width="672" height="192" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-brand-red to-brand-burgundy opacity-80"></div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors font-medium text-sm"
                    >
                        <ImageIcon size={18} /> Change Cover
                    </button>
                    <input 
                        type="file" 
                        ref={bannerInputRef} 
                        onChange={(e) => handleFileChange(e, 'banner')} 
                        className="hidden" 
                        accept="image/*"
                        aria-label="Upload banner image"
                    />
                </div>

                <div className="absolute -bottom-10 left-8">
                    <div className="relative group/avatar">
                        <div className="w-24 h-24 rounded-[24px] bg-white dark:bg-surface-dark p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-[18px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                                {tempAvatar ? (
                                    <img src={tempAvatar} alt="Profile" className="w-full h-full object-cover" width="96" height="96" />
                                ) : (
                                    <span className="text-3xl font-bold text-slate-400">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer w-full h-full border-none" aria-label="Change profile photo">
                                    <Camera size={24} className="text-white" />
                                </button>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={avatarInputRef} 
                            onChange={(e) => handleFileChange(e, 'avatar')} 
                            className="hidden" 
                            accept="image/*"
                            aria-label="Upload profile photo"
                        />
                    </div>
                </div>
             </div>

             {/* Modal Form */}
             <div className="p-8 pt-12 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                        <label htmlFor="edit-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input 
                            id="edit-name"
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2 relative">
                        <label htmlFor="edit-username" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <AtSign size={16} />
                            </div>
                            <input 
                                id="edit-username"
                                type="text" 
                                value={editForm.username}
                                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                placeholder="username"
                                className={`w-full bg-slate-50 dark:bg-black/20 border ${usernameError ? 'border-red-500' : 'border-transparent'} focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl pl-10 pr-12 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all`}
                            />
                            <button 
                                onClick={generateUsername}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-red hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                title="Auto-generate from Name"
                            >
                                <Wand2 size={16} />
                            </button>
                        </div>
                        {usernameError && <p className="text-xs text-red-500 mt-1 font-medium">{usernameError}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <input 
                            type="email" 
                            value={editForm.email}
                            disabled
                            className="w-full bg-slate-100 dark:bg-black/40 border border-transparent rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 font-medium outline-none cursor-not-allowed"
                        />
                    </div>
                    
                    {/* School Section with Custom Toggle */}
                    <div className="space-y-2">
                        <label htmlFor="edit-school" className="text-xs font-bold text-slate-500 uppercase tracking-wider">University / School</label>
                        {isCustomSchool ? (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={editForm.school}
                                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                                    placeholder="Enter school name"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all"
                                />
                                <button 
                                    type="button"
                                    onClick={() => { setIsCustomSchool(false); setEditForm({...editForm, school: ''}); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold bg-slate-100 dark:bg-white/10 px-2 py-1 rounded"
                                >
                                    Select
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <select 
                                    id="edit-school"
                                    value={editForm.school}
                                    onChange={handleSchoolChange}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select School</option>
                                    {schoolsList.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                    <option value="Other">Other (Type manually)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="edit-major" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Major / Subject</label>
                        <input 
                            id="edit-major"
                            type="text" 
                            value={editForm.major}
                            onChange={(e) => setEditForm({...editForm, major: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="edit-class" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class / Grade</label>
                        <input 
                            id="edit-class"
                            type="text" 
                            value={editForm.class}
                            onChange={(e) => setEditForm({...editForm, class: e.target.value})}
                            placeholder="e.g. 10th, Sophomore"
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="edit-section" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section</label>
                        <input 
                            id="edit-section"
                            type="text" 
                            value={editForm.section}
                            onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                            placeholder="e.g. A, B, CS-1"
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            State {isLocationLocked && <Lock size={10} className="text-slate-400" />}
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={selectedState}
                                disabled={isLocationLocked}
                                onChange={(e) => { setSelectedState(e.target.value); setEditForm(prev => ({...prev, location: `${selectedCity}, ${e.target.value}`})); }}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all disabled:opacity-60"
                                placeholder="State"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            City {isLocationLocked && <Lock size={10} className="text-slate-400" />}
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={selectedCity}
                                disabled={isLocationLocked}
                                onChange={(e) => { setSelectedCity(e.target.value); setEditForm(prev => ({...prev, location: `${e.target.value}, ${selectedState}`})); }}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all disabled:opacity-60"
                                placeholder="City"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label htmlFor="edit-bio" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio</label>
                        <textarea 
                            id="edit-bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium outline-none transition-all min-h-[100px] resize-none"
                        />
                    </div>
                </div>
             </div>

             {/* Modal Footer */}
             <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-end gap-3 rounded-b-[32px] sticky bottom-0 z-20">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-brand-red text-white font-bold hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
