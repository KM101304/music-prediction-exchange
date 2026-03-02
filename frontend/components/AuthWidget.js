"use client";

import { useEffect, useState } from 'react';
import { getStoredToken, request, setStoredToken } from '../lib/api';

export function AuthWidget() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }
    request('/auth/me', { token })
      .then((me) => setUser(me))
      .catch(() => setStoredToken(null));
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { email, password, displayName: displayName || email.split('@')[0] };
      const result = await request(path, { method: 'POST', body: payload });
      setStoredToken(result.token);
      setUser(result.user);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setStoredToken(null);
    setUser(null);
  }

  if (user) {
    return (
      <div className="rounded-xl border border-slate-800 bg-panel p-4 text-sm shadow-lg shadow-slate-950/40">
        <p className="text-xs uppercase tracking-wide text-slate-400">Signed in</p>
        <p className="mt-1 font-semibold text-white">{user.displayName}</p>
        <p className="mt-0.5 text-slate-300">{Number(user.creditsBalance).toLocaleString()} credits</p>
        <button
          onClick={logout}
          className="mt-3 rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-panel p-4 text-sm shadow-lg shadow-slate-950/40">
      <p className="text-xs uppercase tracking-wide text-slate-400">Account</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded px-2 py-1 ${mode === 'login' ? 'bg-accent text-slate-900' : 'bg-slate-800 text-slate-300'}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`rounded px-2 py-1 ${mode === 'register' ? 'bg-accent text-slate-900' : 'bg-slate-800 text-slate-300'}`}
        >
          Register
        </button>
      </div>
      <form className="mt-3 space-y-2" onSubmit={onSubmit}>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
        {mode === 'register' && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        )}
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
        <button disabled={loading} className="w-full rounded bg-accent px-3 py-2 font-medium text-slate-900">
          {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      <p className="mt-3 text-xs text-muted">Play-money only. No cash value, withdrawals, or wallets.</p>
    </div>
  );
}
