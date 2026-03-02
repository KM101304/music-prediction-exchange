"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthWidget } from '../components/AuthWidget';
import { request } from '../lib/api';

function timeLabel(dateStr) {
  const ms = new Date(dateStr).getTime() - Date.now();
  if (!Number.isFinite(ms)) {
    return 'TBD';
  }
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    return 'Closing soon';
  }
  return `${days}d left`;
}

export default function HomePage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/markets')
      .then((data) => setMarkets(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const topMovers = useMemo(
    () => [...markets].sort((a, b) => Math.abs(b.probabilityYes - 0.5) - Math.abs(a.probabilityYes - 0.5)).slice(0, 4),
    [markets]
  );

  const stats = useMemo(() => {
    const open = markets.filter((m) => m.status === 'OPEN').length;
    const totalVolume = markets.reduce((sum, m) => sum + Number(m.volumeShares || 0), 0);
    const avgYes = markets.length ? markets.reduce((sum, m) => sum + Number(m.probabilityYes || 0), 0) / markets.length : 0;
    return { open, totalVolume, avgYes };
  }, [markets]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-5">
        <div className="card overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="badge">Live board</p>
              <h1 className="mt-3 text-2xl font-semibold">Music Stream Prediction Markets</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Track crowd probability on stream milestones, open positions with play-money credits, and review settlement outcomes.
              </p>
            </div>
            <div className="grid min-w-56 grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Open markets</p>
                <p className="mt-1 text-lg font-semibold text-white">{stats.open}</p>
              </div>
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Total shares</p>
                <p className="mt-1 text-lg font-semibold text-white">{stats.totalVolume.toFixed(0)}</p>
              </div>
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Avg YES</p>
                <p className="mt-1 text-lg font-semibold text-white">{(stats.avgYes * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Settlement mode</p>
                <p className="mt-1 text-lg font-semibold text-white">Manual</p>
              </div>
            </div>
          </div>
        </div>

        {loading && <p className="card p-4 text-sm text-muted">Loading markets...</p>}
        {error && <p className="card border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-200">{error}</p>}

        {!loading && !error && (
          <div className="space-y-3">
            {markets.map((market) => (
              <Link key={market.id} href={`/market/${market.id}`} className="card block p-4 hover:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-medium text-white">{market.title}</h2>
                    <p className="mt-1 text-xs text-muted">{market.description}</p>
                  </div>
                  <span className="badge">{market.status}</span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-emerald-400" style={{ width: `${Math.max(1, market.probabilityYes * 100)}%` }} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-slate-300 sm:grid-cols-4">
                  <span>YES {(market.probabilityYes * 100).toFixed(1)}%</span>
                  <span>NO {(market.probabilityNo * 100).toFixed(1)}%</span>
                  <span>{Number(market.volumeShares).toFixed(2)} shares</span>
                  <span>{timeLabel(market.closeAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <AuthWidget />

        <div className="card p-4">
          <h3 className="text-sm font-semibold">Top Movers</h3>
          <p className="mt-1 text-xs text-slate-400">Biggest moves away from 50/50</p>
          {loading && <p className="mt-2 text-xs text-muted">Computing...</p>}
          {!loading && topMovers.length === 0 && <p className="mt-2 text-xs text-muted">No market movement yet.</p>}
          <div className="mt-3 space-y-3 text-sm">
            {topMovers.map((m) => (
              <Link key={m.id} href={`/market/${m.id}`} className="block rounded-lg bg-slate-900/60 p-3 hover:bg-slate-900">
                <p className="line-clamp-2 text-xs text-slate-200">{m.title}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <p className="text-emerald-300">YES {(m.probabilityYes * 100).toFixed(2)}%</p>
                  <p className="text-slate-400">{Number(m.volumeShares).toFixed(0)} shares</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4 text-xs text-slate-300">
          <p className="font-semibold text-white">How this works</p>
          <p className="mt-2">Buy YES/NO shares with credits. Prices update by LMSR based on demand.</p>
          <p className="mt-2">Market outcomes are settled manually with documented source evidence.</p>
        </div>
      </aside>
    </div>
  );
}
