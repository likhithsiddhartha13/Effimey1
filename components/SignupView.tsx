
import React, { useState, useEffect } from 'react';
import { ArrowRight, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, User, School, ChevronLeft, ChevronDown, GraduationCap, LayoutGrid, Sparkles, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { subscribeToSchools } from '../services/developerService';
import { School as SchoolType, CLASSES, SECTIONS } from '../types';

interface SignupViewProps {
  onLoginClick: () => void;
  onBack?: () => void;
}

const SignupView: React.FC<SignupViewProps> = ({ onLoginClick, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // School State
  const [school, setSchool] = useState('');
  const [schoolsList, setSchoolsList] = useState<SchoolType[]>([]);
  const [isCustomSchool, setIsCustomSchool] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);

  // Class & Section State
  const [classGrade, setClassGrade] = useState('');
  const [section, setSection] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Success State
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSchools((data) => {
        setSchoolsList(data);
        setLoadingSchools(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSchoolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'Other') {
          setIsCustomSchool(true);
          setSchool('');
      } else {
          setIsCustomSchool(false);
          setSchool(val);
      }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!name.trim() || !email.trim() || !school.trim() || !classGrade || !section) {
        setError("Please fill in all fields including School, Class, and Section.");
        return;
    }

    if (!password || password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }

    setIsLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
          // 2. Update Profile Name
          await user.updateProfile({ displayName: name });

          // 3. Create Firestore User Document
          await db.collection('users').doc(user.uid).set({
              id: user.uid,
              name: name,
              email: email,
              username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
              school: school,
              class: classGrade,
              section: section,
              role: 'student',
              status: 'online',
              createdAt: new Date().toISOString(),
              avatar: '',
              friends: []
          });
          
          setIsSubmitted(true);
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
          setError("Email is already registered. Please sign in.");
      } else {
          setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
      return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-brand-light dark:bg-brand-dark font-sans transition-colors duration-200">
            {/* Back Button */}
            {onBack && (
                <button 
                    onClick={onBack}
                    className="absolute top-8 left-8 z-20 p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
            )}
            
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob"></div>
                <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-4 text-center">
                <div className="bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 dark:text-emerald-400">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Account Created!</h1>
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 leading-relaxed">
                        Welcome to Effimey, <span className="font-bold text-slate-800 dark:text-white">{name}</span>. Your account is ready.
                    </p>
                    <button 
                        onClick={onLoginClick}
                        className="w-full bg-brand-red text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-brand-burgundy transition-all duration-200"
                    >
                        Sign In Now
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-brand-light dark:bg-brand-dark font-sans transition-colors duration-200">
      
      {/* Back Button */}
      {onBack && (
        <button 
            onClick={onBack}
            className="absolute top-8 left-8 z-20 p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full transition-colors"
        >
            <ChevronLeft size={24} />
        </button>
      )}

      {/* Aurora Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-300 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold uppercase tracking-wider mb-4 border border-brand-red/20">
                <Sparkles size={12} /> Student Access
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
                Create Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                Get started with your personalized student workspace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-4 py-3 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-4 py-3 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* School */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">School / University</label>
              <div className="relative group">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                {isCustomSchool ? (
                    <div className="relative">
                        <input 
                            type="text" 
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="Enter school name"
                            autoFocus
                            className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-10 py-3 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all font-medium"
                        />
                        <button 
                            type="button"
                            onClick={() => { setIsCustomSchool(false); setSchool(''); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <span className="text-xs font-bold">List</span>
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <select 
                            value={school}
                            onChange={handleSchoolSelect}
                            className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-10 py-3 outline-none text-slate-800 dark:text-white transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select School</option>
                            {schoolsList.length > 0 ? (
                                schoolsList.map((s) => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))
                            ) : (
                                <option disabled>{loadingSchools ? 'Loading schools...' : 'No schools found'}</option>
                            )}
                            <option value="Other">Other (Type manually)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Class and Section Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Class / Grade</label>
                    <div className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                        <select 
                            value={classGrade} 
                            onChange={(e) => setClassGrade(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-10 py-3 outline-none text-slate-800 dark:text-white transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select Class</option>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Section</label>
                    <div className="relative group">
                        <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                        <select 
                            value={section} 
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-10 py-3 outline-none text-slate-800 dark:text-white transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select Section</option>
                            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-12 py-3 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20 animate-in slide-in-from-top-1">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-red hover:bg-brand-burgundy text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button
                onClick={onLoginClick}
                className="font-bold text-brand-red hover:text-brand-burgundy hover:underline transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignupView;
