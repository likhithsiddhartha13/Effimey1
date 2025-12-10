
import React from 'react';
import { CheckCircle2, ArrowRight, HelpCircle, ChevronDown, ChevronUp, Instagram } from 'lucide-react';

interface PricingPageProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onLoginClick, onHomeClick }) => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Can I switch plans later?",
      a: "Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately."
    },
    {
      q: "Is there a student discount for the Pro plan?",
      a: "The Pro Student plan is already discounted heavily for students! We also offer campus-wide licenses for universities."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay."
    },
    {
      q: "Can I cancel my subscription?",
      a: "Absolutely. You can cancel your subscription at any time. You will retain access until the end of your billing period."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-red selection:text-white overflow-x-hidden flex flex-col">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          <button onClick={onHomeClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-red to-brand-burgundy rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
              <span className="font-bold text-xl leading-none">E</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Effimey</span>
          </button>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button onClick={onHomeClick} className="hover:text-brand-red transition-colors">Features</button>
            <button className="text-brand-red font-bold">Pricing</button>
            <button onClick={onHomeClick} className="hover:text-brand-red transition-colors">About</button>
            <button onClick={onHomeClick} className="hover:text-brand-red transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="text-sm font-bold text-slate-700 dark:text-white hover:text-brand-red transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={onLoginClick}
              className="hidden sm:flex px-5 py-2.5 bg-brand-red text-white text-sm font-bold rounded-full hover:bg-brand-burgundy shadow-lg shadow-brand-red/20 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-20 px-6">
        
        {/* Header */}
        <div className="max-w-7xl mx-auto text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6">
                Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-purple-600">Future</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Simple, transparent pricing. No hidden fees. Start for free and upgrade as you grow.
            </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {/* Free Plan */}
            <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 relative flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Basic</h3>
              <p className="text-sm text-slate-500 mb-6 h-10">Essential tools for organized students.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Task Management', 'Basic Schedule', '3 Study Groups', '100MB Storage', 'Community Access'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-slate-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onLoginClick} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-[32px] bg-slate-900 dark:bg-black border border-brand-red relative shadow-2xl shadow-brand-red/10 scale-105 z-10 flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-red text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-black shadow-lg">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro Student</h3>
              <p className="text-sm text-slate-400 mb-6 h-10">AI superpowers for top performers.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$4</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Basic', 'Unlimited AI Chat (Gemini 2.5)', 'Unlimited Study Groups', '10GB Storage', 'Advanced Analytics & Insights', 'Priority Support'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-brand-red shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onLoginClick} className="w-full py-3 rounded-xl bg-brand-red text-white font-bold hover:bg-brand-burgundy transition-colors shadow-lg shadow-brand-red/25">
                Start Free Trial
              </button>
            </div>

             {/* Team Plan */}
             <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 relative flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Campus</h3>
              <p className="text-sm text-slate-500 mb-6 h-10">For clubs, organizations, and schools.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">$12</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Pro', 'Club Management Tools', 'Event Planning Dashboard', 'Shared Team Drives', 'Admin Controls', 'Custom Onboarding'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-slate-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onLoginClick} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                Contact Sales
              </button>
            </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center flex items-center justify-center gap-2">
                <HelpCircle className="text-brand-red" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            {faq.q}
                            {openFaq === index ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </button>
                        {openFaq === index && (
                            <div className="px-6 pb-4 pt-0 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-black pt-20 pb-10 px-6 border-t border-slate-200 dark:border-white/10 mt-auto">
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
                <button className="p-2 text-slate-400 hover:text-brand-red transition-colors"><Instagram size={20} /></button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><button onClick={onHomeClick} className="hover:text-brand-red transition-colors">Features</button></li>
                <li><button className="text-brand-red cursor-default">Pricing</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li><button onClick={onHomeClick} className="hover:text-brand-red transition-colors">About Us</button></li>
                <li><button className="hover:text-brand-red transition-colors">Careers</button></li>
                <li><button className="hover:text-brand-red transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-brand-red transition-colors">Terms of Service</button></li>
                <li><a href="mailto:support@effimey.app" className="hover:text-brand-red transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">© 2024 Effimey Inc. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-slate-500">
                <button className="hover:text-slate-900 dark:hover:text-white">Privacy</button>
                <button className="hover:text-slate-900 dark:hover:text-white">Terms</button>
                <button className="hover:text-slate-900 dark:hover:text-white">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
