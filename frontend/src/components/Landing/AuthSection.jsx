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
    const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [NetworkStatus, setNetworkStatus] = useState('Checking connectivity...');
  const [NetworkIsReachable, setNetworkIsReachable] = useState(false);

  const isSignup = mode === 'signup';

  useEffect(() => {
    let isMounted = true;

    healthCheck()
      .then(() => {
        if (isMounted) {
          setNetworkStatus('Network connected');
          setNetworkIsReachable(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNetworkStatus('Network not confirmed');
          setNetworkIsReachable(false);
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
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const tokens = await signup({ username, email, password, passwordConfirm });
        setSuccess('Account created.');
        // If backend returned tokens, auto-login. Otherwise guide user to sign in.
        if (tokens && tokens.access) {
          onLoginSuccess(tokens);
          return;
        }
        // No tokens returned: prefill sign-in and switch mode
        setMode('signin');
        setPassword('');
        setPasswordConfirm('');
        return;
      }

      const tokens = await login(username, password);
      onLoginSuccess(tokens);
    } catch (err) {
      setError(err.message || (isSignup ? 'Signup failed' : 'Login failed'));
      console.error(err);
      // If server returned structured field errors, show them under inputs
      if (err && err.data && typeof err.data === 'object') {
        setFieldErrors(err.data);
        // Prefer top-level non-field errors for the main error box
        const nonField = err.data.detail || err.data.non_field_errors || null;
        if (nonField) {
          setError(Array.isArray(nonField) ? nonField.join(' ') : String(nonField));
        } else {
          setError(err.message || (isSignup ? 'Signup failed' : 'Login failed'));
        }
      } else {
        setError(err.message || (isSignup ? 'Signup failed' : 'Login failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500 text-center">
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Connectivity
          </p>
          <p
            className={`text-sm font-bold ${
              NetworkIsReachable ? 'text-emerald-700' : 'text-orange-600'
            }`}
          >
            {NetworkStatus}
          </p>
          {/* <p className="text-xs text-slate-500 mt-1 break-all">{API_BASE_URL}</p> */}
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isSignup ? 'Create Account' : 'Administrator Login'}
        </h2>
        <p className="text-slate-500 mb-6">
          {isSignup
            ? 'Create a dashboard account using the Django API.'
            : 'Sign in to continue or signup to create an account'}
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
            {fieldErrors.username && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{Array.isArray(fieldErrors.username) ? fieldErrors.username.join(' ') : String(fieldErrors.username)}</p>
            )}
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
              {fieldErrors.email && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{Array.isArray(fieldErrors.email) ? fieldErrors.email.join(' ') : String(fieldErrors.email)}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              Password
            </label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-purple font-semibold text-slate-700"
              required
            />
            {fieldErrors.password && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{Array.isArray(fieldErrors.password) ? fieldErrors.password.join(' ') : String(fieldErrors.password)}</p>
            )}
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-purple font-semibold text-slate-700"
                required
              />
              {(fieldErrors.password_confirm || fieldErrors.passwordConfirm) && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{Array.isArray(fieldErrors.password_confirm || fieldErrors.passwordConfirm) ? (fieldErrors.password_confirm || fieldErrors.passwordConfirm).join(' ') : String(fieldErrors.password_confirm || fieldErrors.passwordConfirm)}</p>
              )}
            </div>
          )}

          {isSignup && (
            <p className="text-xs font-semibold leading-relaxed text-slate-500">
              Password must be at least 8 characters and should not be too common.
            </p>
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
