import React from 'react';
export default function CustomInput({ label, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{label}</label>}
      <input 
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none" 
        {...props} 
      />
    </div>
  );
}