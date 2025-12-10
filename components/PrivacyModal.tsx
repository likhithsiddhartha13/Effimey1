import React from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                <Lock size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Privacy Policy</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed custom-scrollbar">
          <p className="text-xs text-slate-400">Last updated: October 24, 2023</p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-3">
             <ShieldCheck className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
             <div>
                <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">Your Privacy Matters</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    At Effimey, we are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, please contact us.
                </p>
             </div>
          </div>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">1. Information We Collect</h4>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website (such as posting notes or tasks) or otherwise when you contact us.
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                <li>Personal Data: Name, email address, school information.</li>
                <li>Derivative Data: Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
            </ul>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">2. How We Use Your Information</h4>
            <p>
              We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
             <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                <li>To facilitate account creation and logon process.</li>
                <li>To send you administrative information.</li>
                <li>To fulfill and manage your orders and services.</li>
                <li>To improve your study experience through AI personalization.</li>
            </ul>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">3. Sharing Your Information</h4>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, or Legal Obligations.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">4. Data Security</h4>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">5. Cookies and Tracking</h4>
            <p>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0 rounded-b-2xl">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;