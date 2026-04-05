import React, { useState } from 'react';

const AuthSection = ({ onLoginSuccess }) => {
  const [showForm, setShowForm] = useState(false);

  // This handles the "Sign In" click
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, we'd check credentials here. 
    // For your demo, we just trigger the success function!
    onLoginSuccess();
  };

  if (!showForm) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6 text-brand-navy">Welcome Back</h2>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-brand-button border border-brand-accent text-white px-10 py-3 rounded-lg flex items-center gap-3 hover:brightness-110 transition-all cursor-pointer font-semibold shadow-lg"
          >
            <span>➜</span> Login to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Start?</h2>
        <p className="text-slate-500 mb-8">Click below to enter the Exam Timer Control Panel.</p>
        
        <form onSubmit={handleSubmit}>
          <button 
            type="submit" 
            className="w-full bg-brand-purple text-white font-bold py-4 rounded-lg hover:bg-opacity-90 transform active:scale-[0.98] transition-all shadow-md text-lg"
          >
            Go to Dashboard 🚀
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthSection;