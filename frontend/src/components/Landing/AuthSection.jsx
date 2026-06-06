import React, { useState } from 'react';
import { login } from '../../api/client';

const AuthSection = ({ onLoginSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const tokens = await login(username, password);
      onLoginSuccess(tokens);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
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
            <span aria-hidden="true">-&gt;</span> Login to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Administrator Login</h2>
        <p className="text-slate-500 mb-8">Use your Django admin account to enter the control panel.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-purple font-semibold text-slate-700"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-purple font-semibold text-slate-700"
              required
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-purple text-white font-bold py-4 rounded-lg hover:bg-opacity-90 transform active:scale-[0.98] transition-all shadow-md text-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthSection;
