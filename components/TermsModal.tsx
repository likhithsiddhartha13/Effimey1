import React from 'react';
import { X, FileText, Shield } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Terms of Service</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed custom-scrollbar">
          <p className="text-xs text-slate-400">Last updated: October 24, 2023</p>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">1. Acceptance of Terms</h4>
            <p>
              By accessing and using Effimey, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">2. User Accounts</h4>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">3. User Content</h4>
            <p>
              Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. Effimey claims no intellectual property rights over the material you provide to the Service.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">4. Acceptable Use</h4>
            <p>
              You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, impairs, or renders the Service less efficient. You agree not to attempt to gain unauthorized access to our servers or user accounts. Academic integrity is paramount; using this tool to plagiarize or cheat is strictly prohibited.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">5. Intellectual Property</h4>
            <p>
              The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Effimey and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>
          </section>

          <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">6. Termination</h4>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination.
            </p>
          </section>

           <section>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">7. Changes</h4>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0 rounded-b-2xl">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm"
            >
                I Understand
            </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;