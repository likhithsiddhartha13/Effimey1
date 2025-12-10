
import React, { useState } from 'react';
import { ArrowLeft, Mail, MapPin, Send, Loader2 } from 'lucide-react';

interface ContactPageProps {
  onHomeClick: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onHomeClick }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    // Mock send
    setTimeout(() => {
        setIsSending(false);
        setIsSent(true);
        setFormData({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-dark text-slate-900 dark:text-slate-100 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          <button onClick={onHomeClick} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-brand-red transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-brand-red to-brand-burgundy rounded-lg flex items-center justify-center text-white shadow-lg">
               <span className="font-bold text-lg leading-none">E</span>
             </div>
             <span className="font-bold text-lg">Effimey</span>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left Content */}
            <div className="space-y-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                        Get in touch with us
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-lg">
                        Have a question, feedback, or just want to say hi? We'd love to hear from you.
                    </p>
                </div>
            </div>

            {/* Right Form */}
            <div className="bg-white dark:bg-surface-dark p-8 md:p-10 rounded-[32px] shadow-xl border border-slate-200 dark:border-white/5">
                <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Send us a message</h3>
                
                {isSent ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                            <Send size={32} />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Message Sent!</h4>
                        <p className="text-slate-600 dark:text-slate-300">We'll get back to you as soon as possible.</p>
                        <button 
                            onClick={() => setIsSent(false)} 
                            className="mt-4 text-brand-red font-bold hover:underline"
                        >
                            Send another message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Your Name</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="John Doe"
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-red/50 dark:text-white transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="you@example.com"
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-red/50 dark:text-white transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Message</label>
                            <textarea 
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                className="w-full h-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-red/50 dark:text-white transition-all resize-none"
                                placeholder="How can we help?"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSending}
                            className="w-full py-4 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-burgundy disabled:opacity-70 transition-all shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Message'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
