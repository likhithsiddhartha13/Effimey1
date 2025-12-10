
import React from 'react';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onHomeClick: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onHomeClick }) => {
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
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                <Shield size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        </div>
        
        <div className="bg-white dark:bg-surface-dark rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-200 dark:border-white/5 space-y-8 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="text-sm text-slate-400 font-mono">Last updated: October 24, 2023</p>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Eye size={24} className="text-brand-red" />
                    1. Information We Collect
                </h2>
                <p>
                    We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website (such as posting notes or tasks) or otherwise when you contact us.
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                    <li><strong className="text-slate-700 dark:text-slate-200">Personal Data:</strong> Name, email address, school information, and profile pictures.</li>
                    <li><strong className="text-slate-700 dark:text-slate-200">Usage Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, and operating system.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">2. How We Use Your Information</h2>
                <p>
                    We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                        To facilitate account creation and logon process.
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                        To send you administrative information.
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                        To improve your study experience through AI personalization.
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                        To protect our services and user data.
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">3. Sharing Your Information</h2>
                <p>
                    We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, or Legal Obligations.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Lock size={24} className="text-brand-red" />
                    4. Data Security
                </h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">5. Cookies and Tracking</h2>
                <p>
                    We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
                </p>
            </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
