import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  colorClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendUp, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-5 rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default group">
      <div className="flex justify-between items-start mb-4">
         <div className={`p-3 rounded-xl bg-slate-50 dark:bg-white/5 group-hover:scale-110 transition-transform duration-300 ${colorClass}`}>
            <Icon size={24} strokeWidth={2.5} />
         </div>
         {trend && (
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>
                {trend}
            </div>
         )}
      </div>
      <div>
        <h3 className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">{value}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
};

export default StatsCard;