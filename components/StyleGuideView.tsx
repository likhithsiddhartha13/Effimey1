import React from 'react';
import { Palette, Type, MousePointerClick, Layout, Box, Check, ChevronDown, Activity, Clock } from 'lucide-react';
import StatsCard from './StatsCard';
import StudyFocus from './StudyFocus';
import Schedule from './Schedule';
import TaskList from './TaskList';

const StyleGuideView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Design System</h1>
        <p className="text-slate-500 dark:text-slate-400">The building blocks and visual language of Emifey.</p>
      </div>

      {/* Colors Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
          <Palette className="text-brand-red" size={24} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Color Palette</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Colors */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-brand-red shadow-lg shadow-brand-red/20"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Brand Red</p>
                  <p className="text-xs text-slate-500 font-mono">#ef4444</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-brand-burgundy shadow-lg"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Burgundy</p>
                  <p className="text-xs text-slate-500 font-mono">#b91c1c</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-brand-light border border-slate-200"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Light Bg</p>
                  <p className="text-xs text-slate-500 font-mono">#F8FAFC</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-brand-dark border border-slate-700"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Dark Bg</p>
                  <p className="text-xs text-slate-500 font-mono">#09090b</p>
                </div>
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Semantic Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-surface-dark shadow-lg shadow-blue-900/20"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Surface</p>
                  <p className="text-xs text-slate-500 font-mono">#18181b</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Success</p>
                  <p className="text-xs text-slate-500 font-mono">Emerald 500</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/20"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Warning</p>
                  <p className="text-xs text-slate-500 font-mono">Amber 500</p>
                </div>
              </div>
               <div className="space-y-2">
                <div className="h-20 rounded-xl bg-purple-500 shadow-lg shadow-purple-500/20"></div>
                <div className="px-1">
                  <p className="font-medium text-slate-800 dark:text-white">Accent</p>
                  <p className="text-xs text-slate-500 font-mono">Purple 500</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
          <Type className="text-brand-red" size={24} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Typography</h2>
        </div>
        
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="text-slate-400 text-sm font-mono">H1 / 3xl / Bold</div>
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">The quick brown fox jumps over the lazy dog</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="text-slate-400 text-sm font-mono">H2 / 2xl / Bold</div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">The quick brown fox jumps over the lazy dog</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="text-slate-400 text-sm font-mono">H3 / xl / Bold</div>
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">The quick brown fox jumps over the lazy dog</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="text-slate-400 text-sm font-mono">Body / Base / Regular</div>
            <div className="lg:col-span-2">
              <p className="text-base text-slate-600 dark:text-slate-300">
                Emifey is designed with readability in mind. Our typography scale ensures a clear hierarchy, making it easy to scan through tasks, notes, and schedules. We use the Inter font family for a clean, modern aesthetic.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="text-slate-400 text-sm font-mono">Small / sm / Medium</div>
            <div className="lg:col-span-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                This text style is used for secondary information, metadata, and UI labels.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default StyleGuideView;