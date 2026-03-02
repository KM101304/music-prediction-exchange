"use client";

import { useState } from 'react';
import { getStoredToken, request } from '../../lib/api';

const defaultForm = {
  title: '',
  description: '',
  resolutionCriteria: '',
  closeAt: '',
  settleBy: '',
  lmsrB: '100',
};

export default function CreateMarketPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const token = getStoredToken();
    if (!token) {
      setError('Login first on the homepage to create a market.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        resolutionCriteria: form.resolutionCriteria,
        closeAt: new Date(form.closeAt).toISOString(),
        settleBy: new Date(form.settleBy).toISOString(),
        lmsrB: Number(form.lmsrB) || 100,
      };

      const created = await request('/markets', { method: 'POST', token, body: payload });
      setMessage(`Market created: #${created.id}`);
      setForm(defaultForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="card p-5">
        <p className="badge">Create Market</p>
        <h1 className="mt-3 text-xl font-semibold">Start a New Prediction Market</h1>
        <p className="mt-2 text-sm text-slate-300">
          Create a YES/NO market for a song milestone. You must include clear resolution criteria and dates.
        </p>
      </section>

      {message && <p className="card border-emerald-500/40 bg-emerald-900/20 p-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="card border-rose-500/40 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p>}

      <form onSubmit={onSubmit} className="card space-y-3 p-5">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="h-24 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="Resolution criteria"
          value={form.resolutionCriteria}
          onChange={(e) => setForm({ ...form, resolutionCriteria: e.target.value })}
          className="h-24 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            type="datetime-local"
            value={form.closeAt}
            onChange={(e) => setForm({ ...form, closeAt: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            required
            type="datetime-local"
            value={form.settleBy}
            onChange={(e) => setForm({ ...form, settleBy: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
        </div>
        <input
          type="number"
          min="1"
          step="1"
          value={form.lmsrB}
          onChange={(e) => setForm({ ...form, lmsrB: e.target.value })}
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="LMSR liquidity parameter (default 100)"
        />
        <button disabled={loading} className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-slate-900">
          {loading ? 'Creating...' : 'Create Market'}
        </button>
      </form>
    </div>
  );
}
