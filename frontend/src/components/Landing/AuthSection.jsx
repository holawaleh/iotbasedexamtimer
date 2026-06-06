import React, { useEffect, useState } from 'react';
import { API_BASE_URL, healthCheck, login, signup } from '../../api/client';

const AuthSection = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Checking backend...');
  const [backendIsReachable, setBackendIsReachable] = useState(false);

  const isSignup = mode === 'signup';

  useEffect(() => {
    let isMounted = true;

    healthCheck()
      .then(() => {
        if (isMounted) {
          setBackendStatus('Backend connected');
          setBackendIsReachable(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus('Backend not confirmed');
          setBackendIsReachable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup({ username, email, password, passwordConfirm });
        setSuccess('Account created. Signing you in now...');
      }

      const tokens = await login(username, password);
      onLoginSuccess(tokens);
    } catch (err) {
      setError(err.message || (isSignup ? 'Signup failed' : 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500 text-center">
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            API Connection
          </p>
          <p
            className={`text-sm font-bold ${
              backendIsReachable ? 'text-emerald-700' : 'text-orange-600'
            }`}
          >
            {backendStatus}
          </p>
          <p className="text-xs text-slate-500 mt-1 break-all">{API_BASE_URL}</p>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isSignup ? 'Create Account' : 'Administrator Login'}
        </h2>
        <p className="text-slate-500 mb-6">
          {isSignup
            ? 'Create a dashboard account using the Django API.'
            : 'Sign in with a backend account before entering the dashboard.'}
        </p>

        <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccess('');
            }}
            className={`py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${
              !isSignup ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccess('');
            }}
            className={`py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${
              isSignup ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign up
          </button>
        </div>

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

          {isSignup && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-purple font-semibold text-slate-700"
                required
              />
            </div>
          )}

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

          {isSignup && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-purple font-semibold text-slate-700"
                required
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-purple text-white font-bold py-4 rounded-lg hover:bg-opacity-90 transform active:scale-[0.98] transition-all shadow-md text-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthSection;
