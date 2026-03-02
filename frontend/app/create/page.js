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
  sourceType: 'MANUAL',
  spotifyTrackId: '',
  targetMetricValue: '',
};

export default function CreateMarketPage() {
  const [form, setForm] = useState(defaultForm);
  const [songQuery, setSongQuery] = useState('');
  const [songResults, setSongResults] = useState([]);
  const [songSearchLoading, setSongSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function searchSongs() {
    setSongSearchLoading(true);
    setError('');
    try {
      const token = getStoredToken();
      if (!token) {
        setError('Login first on the homepage to search Spotify songs.');
        return;
      }
      const data = await request(`/markets/spotify/search?q=${encodeURIComponent(songQuery)}&limit=8`, { token });
      setSongResults(data.tracks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSongSearchLoading(false);
    }
  }

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
        sourceType: form.sourceType,
        spotifyTrackId: form.spotifyTrackId || undefined,
        targetMetricValue: form.targetMetricValue ? Number(form.targetMetricValue) : undefined,
      };

      const created = await request('/markets', { method: 'POST', token, body: payload });
      setMessage(`Market created: #${created.id}`);
      setForm(defaultForm);
      setSongQuery('');
      setSongResults([]);
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
        <select
          value={form.sourceType}
          onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="MANUAL">Manual market</option>
          <option value="SPOTIFY_TRACK_POPULARITY">Spotify popularity market</option>
        </select>
        {form.sourceType === 'SPOTIFY_TRACK_POPULARITY' && (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex gap-2">
              <input
                value={songQuery}
                onChange={(e) => setSongQuery(e.target.value)}
                placeholder="Search Spotify song (title or artist)"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={searchSongs}
                disabled={songSearchLoading || songQuery.trim().length < 2}
                className="rounded bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
              >
                {songSearchLoading ? '...' : 'Search'}
              </button>
            </div>
            {songResults.length > 0 && (
              <div className="max-h-52 space-y-2 overflow-auto">
                {songResults.map((track) => (
                  <button
                    key={track.trackId}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        spotifyTrackId: track.trackId,
                        title:
                          form.title ||
                          `Will "${track.name}" reach Spotify popularity ${Math.max(
                            60,
                            Math.min(95, Math.round((track.popularity || 50) + 5))
                          )}+ by settlement?`,
                      })
                    }
                    className={`flex w-full items-center gap-3 rounded border p-2 text-left ${
                      form.spotifyTrackId === track.trackId
                        ? 'border-emerald-400/60 bg-emerald-900/20'
                        : 'border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded bg-slate-800">
                      {track.imageUrl ? (
                        <img src={track.imageUrl} alt={track.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{track.name}</p>
                      <p className="truncate text-xs text-slate-400">{(track.artists || []).join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <input
              required={form.sourceType === 'SPOTIFY_TRACK_POPULARITY'}
              value={form.spotifyTrackId}
              onChange={(e) => setForm({ ...form, spotifyTrackId: e.target.value })}
              placeholder="Selected Spotify Track ID"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              required={form.sourceType === 'SPOTIFY_TRACK_POPULARITY'}
              type="number"
              min="1"
              max="100"
              step="1"
              value={form.targetMetricValue}
              onChange={(e) => setForm({ ...form, targetMetricValue: e.target.value })}
              placeholder="Target popularity value (1-100)"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
        )}
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
