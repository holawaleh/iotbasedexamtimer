import React from 'react';

const StatCard = ({ title, value, subtext, icon, color }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5">
      {/* Icon Circle */}
      <div className={`w-14 h-14 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {subtext}
        </p>
      </div>
    </div>
  );
};

export default StatCard;