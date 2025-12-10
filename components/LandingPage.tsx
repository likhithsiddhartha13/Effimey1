
import React from 'react';
import { ArrowRight, CheckCircle2, Sparkles, Calendar, BookOpen, Users, Shield, Instagram } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onContactClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onPrivacyClick, onTermsClick, onContactClick }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-red selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-red to-brand-burgundy rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
              <span className="font-bold text-xl leading-none">E</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Effimey</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-brand-red transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-brand-red transition-colors">About</button>
            <button onClick={onContactClick} className="hover:text-brand-red transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="text-sm font-bold text-slate-700 dark:text-white hover:text-brand-red transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={onSignupClick}
              className="hidden sm:flex px-5 py-2.5 bg-brand-red text-white text-sm font-bold rounded-full hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 transition-all hover:-translate-y-0.5"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
     <section className="relative min-h-[100vh] flex items-center pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
            <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
            <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-red-300 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>
        </div>

        {/* Added w-full here to ensure text stays centered in flex container */}
        <div className="max-w-5xl mx-auto text-center relative z-10 w-full"> 
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
            Master your studies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-purple-600">Intelligent Focus.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Effimey combines task management, AI assistance, and social accountability into one clean workspace designed for students.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onSignupClick}
              className="px-10 py-5 bg-brand-red text-white text-xl font-bold rounded-full hover:bg-brand-burgundy shadow-xl shadow-brand-red/30 transition-all hover:scale-105 flex items-center gap-2 group"
            >
              Join Waitlist <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollToSection('features')} className="px-10 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xl font-bold rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 lg:py-48 px-6 bg-white dark:bg-brand-dark border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24"> {/* Increased margin bottom */}
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Everything you need to excel</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">Stop juggling five different apps. Effimey brings your entire academic life into one cohesive dashboard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"> {/* Increased gap from 8 to 10 */}
            {[
              { icon: CheckCircle2, title: 'Smart Tasks', desc: 'Kanban-style task management tailored for assignments and exams.', color: 'text-emerald-500' },
              { icon: Calendar, title: 'Dynamic Schedule', desc: 'Visualize your week with color-coded classes, study blocks, and exams.', color: 'text-blue-500' },
              { icon: Sparkles, title: 'AI Assistant', desc: 'Get instant help with concepts, summaries, and planning from Gemini AI.', color: 'text-purple-500' },
              { icon: BookOpen, title: 'Resource Hub', desc: 'Upload and organize your notes, PDFs, and study materials in one place.', color: 'text-orange-500' },
              { icon: Users, title: 'Study Groups', desc: 'Collaborate with peers, share resources, and chat in real-time.', color: 'text-brand-red' },
              { icon: Shield, title: 'Focus Mode', desc: 'Track study hours, visualize streaks, and stay accountable.', color: 'text-pink-500' },
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand-red/20 dark:hover:border-brand-red/20 transition-all hover:-translate-y-1 group flex flex-col justify-center min-h-[300px]"> {/* Added min-h and flex to stretch cards */}
                <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center mb-8 shadow-sm ${feature.color}`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-slate-50 dark:bg-brand-dark">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">Built by students, for students.</h2>
            <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                We started Effimey because we were tired of switching between a calendar app, a to-do list, a chat app, and ChatGPT just to get through a single homework assignment.
              </p>
              <p>
                Our mission is to simplify the academic workflow, allowing you to focus on what actually matters: learning and growing.
              </p>
            </div>
          </div>
          <div className="flex-1 w-full relative">
             <div className="aspect-video rounded-[32px] bg-gradient-to-br from-brand-red to-purple-900 shadow-2xl overflow-hidden relative flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="text-center text-white relative z-10 p-8">
                    <div className="text-6xl font-bold mb-2">10k+</div>
                    <div className="text-lg opacity-80">Assignments Completed</div>
                </div>
             </div>
             {/* Decorative Elements */}
             <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-brand-red rounded-2xl -z-10 opacity-20 rotate-12"></div>
             <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500 rounded-full -z-10 opacity-20 blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white dark:bg-black pt-20 pb-10 px-6 border-t border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center text-white shadow-lg">
                  <span className="font-bold text-lg leading-none">E</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">Effimey</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                The intelligent workspace helping students organize, focus, and collaborate better.
              </p>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/effimey.in/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-brand-red transition-colors">
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-brand-red transition-colors">Features</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-brand-red transition-colors">About Us</button></li>
                <li><button className="hover:text-brand-red transition-colors">Careers</button></li>
                <li><button onClick={onPrivacyClick} className="hover:text-brand-red transition-colors">Privacy Policy</button></li>
                <li><button onClick={onTermsClick} className="hover:text-brand-red transition-colors">Terms of Service</button></li>
                <li><button onClick={onContactClick} className="hover:text-brand-red transition-colors">Contact Us</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">© 2024 Effimey Inc. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-slate-500">
                <button onClick={onPrivacyClick} className="hover:text-slate-900 dark:hover:text-white">Privacy</button>
                <button onClick={onTermsClick} className="hover:text-slate-900 dark:hover:text-white">Terms</button>
                <button className="hover:text-slate-900 dark:hover:text-white">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
