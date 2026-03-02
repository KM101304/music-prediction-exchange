"use client";

import { useEffect, useState } from 'react';
import { request } from '../../lib/api';

function getStoredAdminKey() {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem('mpx_admin_api_key') || '';
}

function setStoredAdminKey(value) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('mpx_admin_api_key', value);
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [markets, setMarkets] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    resolutionCriteria: '',
    closeAt: '',
    settleBy: '',
    lmsrB: '100',
    sourceType: 'MANUAL',
    spotifyTrackId: '',
    targetMetricValue: '',
  });

  const [settleForm, setSettleForm] = useState({ marketId: '', outcome: 'YES', notes: '', sourceUrl: '' });

  useEffect(() => {
    setAdminKey(getStoredAdminKey());
    request('/markets').then(setMarkets).catch(() => null);
  }, []);

  async function createMarket(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        title: createForm.title,
        description: createForm.description,
        resolutionCriteria: createForm.resolutionCriteria,
        closeAt: new Date(createForm.closeAt).toISOString(),
        settleBy: new Date(createForm.settleBy).toISOString(),
        lmsrB: Number(createForm.lmsrB),
        sourceType: createForm.sourceType,
        spotifyTrackId: createForm.spotifyTrackId || undefined,
        targetMetricValue: createForm.targetMetricValue ? Number(createForm.targetMetricValue) : undefined,
      };

      const data = await request('/admin/markets', {
        method: 'POST',
        headers: {
          ADMIN_API_KEY: adminKey,
        },
        body: payload,
      });

      setMessage(`Market created: ${data.title}`);
      setCreateForm({
        title: '',
        description: '',
        resolutionCriteria: '',
        closeAt: '',
        settleBy: '',
        lmsrB: '100',
        sourceType: 'MANUAL',
        spotifyTrackId: '',
        targetMetricValue: '',
      });
      const refreshed = await request('/markets');
      setMarkets(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runSpotifyIngest() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const data = await request('/admin/ingest/spotify', {
        method: 'POST',
        headers: {
          ADMIN_API_KEY: adminKey,
        },
      });
      setMessage(`Spotify ingest complete: ${data.ingested}/${data.totalCandidates} markets updated`);
      const refreshed = await request('/markets');
      setMarkets(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function settleMarket(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const data = await request(`/admin/markets/${settleForm.marketId}/settle`, {
        method: 'POST',
        headers: {
          ADMIN_API_KEY: adminKey,
        },
        body: {
          outcome: settleForm.outcome,
          notes: settleForm.notes || undefined,
          sourceUrl: settleForm.sourceUrl || undefined,
        },
      });

      setMessage(`Market #${data.marketId} settled as ${data.outcome}`);
      const refreshed = await request('/markets');
      setMarkets(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="badge">Operations</p>
        <h1 className="mt-3 text-xl font-semibold">Admin Console</h1>
        <p className="mt-2 text-sm text-slate-300">Create markets, ingest source data, and settle outcomes.</p>
      </div>

      <div className="card p-4">
        <label className="text-xs uppercase tracking-wide text-muted">ADMIN_API_KEY (stored locally)</label>
        <input
          value={adminKey}
          onChange={(e) => {
            setAdminKey(e.target.value);
            setStoredAdminKey(e.target.value);
          }}
          type="password"
          className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={runSpotifyIngest}
          disabled={loading}
          className="mt-3 rounded bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
        >
          {loading ? 'Working...' : 'Ingest Spotify Data'}
        </button>
      </div>

      {message && <p className="card border-emerald-500/40 bg-emerald-900/20 p-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="card border-rose-500/40 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createMarket} className="card space-y-2 p-4">
          <h2 className="text-sm font-semibold">Create Market</h2>
          <input
            required
            placeholder="Title"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <textarea
            required
            placeholder="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            className="h-20 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <textarea
            required
            placeholder="Resolution criteria"
            value={createForm.resolutionCriteria}
            onChange={(e) => setCreateForm({ ...createForm, resolutionCriteria: e.target.value })}
            className="h-20 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              required
              type="datetime-local"
              value={createForm.closeAt}
              onChange={(e) => setCreateForm({ ...createForm, closeAt: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              required
              type="datetime-local"
              value={createForm.settleBy}
              onChange={(e) => setCreateForm({ ...createForm, settleBy: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              min="1"
              step="1"
              value={createForm.lmsrB}
              onChange={(e) => setCreateForm({ ...createForm, lmsrB: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="LMSR b"
            />
            <select
              value={createForm.sourceType}
              onChange={(e) => setCreateForm({ ...createForm, sourceType: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="MANUAL">MANUAL</option>
              <option value="SPOTIFY_TRACK_POPULARITY">SPOTIFY_TRACK_POPULARITY</option>
            </select>
          </div>
          <input
            placeholder="Spotify Track ID (for Spotify source)"
            value={createForm.spotifyTrackId}
            onChange={(e) => setCreateForm({ ...createForm, spotifyTrackId: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Target source metric value (optional)"
            value={createForm.targetMetricValue}
            onChange={(e) => setCreateForm({ ...createForm, targetMetricValue: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button disabled={loading} className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-slate-900">
            {loading ? 'Submitting...' : 'Create Market'}
          </button>
        </form>

        <form onSubmit={settleMarket} className="card space-y-2 p-4">
          <h2 className="text-sm font-semibold">Settle Market</h2>
          <select
            required
            value={settleForm.marketId}
            onChange={(e) => setSettleForm({ ...settleForm, marketId: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Select market</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                #{m.id} {m.title}
              </option>
            ))}
          </select>
          <select
            value={settleForm.outcome}
            onChange={(e) => setSettleForm({ ...settleForm, outcome: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <textarea
            placeholder="Notes"
            value={settleForm.notes}
            onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
            className="h-24 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            type="url"
            placeholder="Source URL"
            value={settleForm.sourceUrl}
            onChange={(e) => setSettleForm({ ...settleForm, sourceUrl: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button disabled={loading} className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-slate-900">
            {loading ? 'Submitting...' : 'Settle Market'}
          </button>
        </form>
      </div>
    </div>
  );
}
