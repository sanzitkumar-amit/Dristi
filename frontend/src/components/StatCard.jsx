import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, trend, color = 'blue' }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', iconBg: 'bg-indigo-100' },
    rose: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', iconBg: 'bg-cyan-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' }
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-5 rounded-xl bg-white border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 font-mono tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`h-12 w-12 rounded-xl ${c.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${c.text}`} />
          </div>
        )}
      </div>
      
      {subtext && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>{subtext}</span>
          {trend && <span className="font-semibold">{trend}</span>}
        </div>
      )}
    </div>
  );
}
