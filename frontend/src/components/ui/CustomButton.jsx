import React from 'react';
export default function CustomButton({ children, onClick, className = "" }) {
  return (
    <button 
      onClick={onClick}
      className={`bg-purple-700 text-white font-bold py-4 px-8 rounded-2xl hover:bg-purple-800 transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}