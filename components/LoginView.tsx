
import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { auth } from '../services/firebase';
import { getEmailFromUsername } from '../services/userService';

interface LoginViewProps {
  onLogin: () => void;
  onBack?: () => void;
  onSignupClick?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBack, onSignupClick }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let loginEmail = identifier.trim();

      // If input doesn't look like an email, assume it's a username
      if (!loginEmail.includes('@')) {
          const resolvedEmail = await getEmailFromUsername(loginEmail.toLowerCase());
          if (resolvedEmail) {
              loginEmail = resolvedEmail;
          } else {
              // Throw specific error to trigger catch block
              const err: any = new Error('User not found');
              err.code = 'auth/user-not-found';
              throw err;
          }
      }

      await auth.signInWithEmailAndPassword(loginEmail, password);
      onLogin(); 
    } catch (err: any) {
      console.error("Authentication Error:", err);
      
      const errorCode = err.code;

      // Handle specific Firebase error codes
      if (
        errorCode === 'auth/invalid-credential' || 
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-email' ||
        errorCode === 'auth/invalid-login-credentials'
      ) {
        setError("Password or username/email incorrect");
      } else if (errorCode === 'auth/email-already-in-use') {
        setError("Email is already in use.");
      } else if (errorCode === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (errorCode === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-brand-burgundy rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-red/20 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
               <span className="font-bold text-3xl leading-none font-sans">E</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
                Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
                Enter your credentials to access Effimey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email or Username</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email or username"
                  className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-black/20 border-transparent focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 rounded-2xl pl-12 pr-12 py-3.5 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all font-medium"
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
              className="w-full bg-brand-red hover:bg-brand-burgundy text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={onSignupClick}
                className="font-bold text-brand-red hover:text-brand-burgundy hover:underline transition-colors"
              >
                Join Waitlist
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginView;
