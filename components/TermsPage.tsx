
import React from 'react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface TermsPageProps {
  onHomeClick: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onHomeClick }) => {
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

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 dark:text-purple-400">
                <FileText size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
        </div>
        
        <div className="bg-white dark:bg-surface-dark rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-200 dark:border-white/5 space-y-8 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="text-sm text-slate-400 font-mono">Last updated: October 24, 2023</p>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Effimey, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">2. User Accounts</h2>
                <p>
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">3. User Content</h2>
                <p>
                    Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. Effimey claims no intellectual property rights over the material you provide to the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">4. Acceptable Use</h2>
                <p className="mb-4">
                    You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, impairs, or renders the Service less efficient. You agree not to attempt to gain unauthorized access to our servers or user accounts.
                </p>
                <div className="bg-brand-red/5 border border-brand-red/10 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="text-brand-red mt-1 shrink-0" size={20} />
                    <p className="text-base">
                        <strong>Academic Integrity:</strong> Using this tool to plagiarize, cheat, or misrepresent your work is strictly prohibited and may result in immediate account termination.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">5. Intellectual Property</h2>
                <p>
                    The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Effimey and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">6. Termination</h2>
                <p>
                    We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination.
                </p>
            </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
