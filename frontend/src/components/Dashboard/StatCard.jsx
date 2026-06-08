import React from 'react';

const StatCard = ({ title, value, subtext, icon, color }) => {
  return (
    <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${color} bg-opacity-10 text-xl`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-xs font-bold uppercase text-slate-500">{title}</p>
        <h3 className="mt-1 break-words text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{value}</h3>
        {subtext && (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="min-w-0 break-words">{subtext}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
