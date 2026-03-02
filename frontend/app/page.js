"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthWidget } from '../components/AuthWidget';
import { SongCover } from '../components/SongCover';
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
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMarketsWithRetry() {
      try {
        return await request('/markets');
      } catch (_firstError) {
        return request('/markets');
      }
    }

    Promise.allSettled([loadMarketsWithRetry(), request('/stats/public')])
      .then((results) => {
        const [marketsResult, statsResult] = results;

        if (marketsResult.status === 'fulfilled') {
          setMarkets(marketsResult.value);
        } else {
          setError(marketsResult.reason.message);
        }

        if (statsResult.status === 'fulfilled') {
          setUsageStats(statsResult.value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const topMovers = useMemo(
    () => [...markets].sort((a, b) => Math.abs(b.probabilityYes - 0.5) - Math.abs(a.probabilityYes - 0.5)).slice(0, 4),
    [markets]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
      <section className="order-1 space-y-4 lg:space-y-5">
        <div className="card overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="badge">Live board</p>
              <h1 className="mt-3 text-2xl font-semibold">Music Stream Prediction Markets</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Track crowd probability on stream milestones, open positions with play-money credits, and review settlement outcomes.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 text-xs sm:min-w-56 sm:w-auto">
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Total users</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {usageStats ? Number(usageStats.total_users).toLocaleString() : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Active traders (24h)</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {usageStats ? Number(usageStats.active_traders_24h).toLocaleString() : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Total trades</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {usageStats ? Number(usageStats.total_trades).toLocaleString() : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/70 p-3">
                <p className="text-slate-400">Trades (24h)</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {usageStats ? Number(usageStats.trades_24h).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {usageStats && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold">Live Platform Activity</h2>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-4">
              <div className="rounded bg-slate-900/60 p-2">
                <p className="text-slate-400">Open markets</p>
                <p className="mt-1 text-base font-semibold text-white">{Number(usageStats.open_markets)}</p>
              </div>
              <div className="rounded bg-slate-900/60 p-2">
                <p className="text-slate-400">Settled markets</p>
                <p className="mt-1 text-base font-semibold text-white">{Number(usageStats.settled_markets)}</p>
              </div>
              <div className="rounded bg-slate-900/60 p-2">
                <p className="text-slate-400">New users (24h)</p>
                <p className="mt-1 text-base font-semibold text-white">{Number(usageStats.new_users_24h)}</p>
              </div>
              <div className="rounded bg-slate-900/60 p-2">
                <p className="text-slate-400">Total shares traded</p>
                <p className="mt-1 text-base font-semibold text-white">{Number(usageStats.total_shares).toFixed(1)}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded bg-slate-900/50 p-2">
                <p className="mb-2 text-slate-400">Signups (last 14 days)</p>
                <div className="flex items-end gap-1">
                  {usageStats.signup_trend.map((row) => (
                    <div
                      key={row.day}
                      title={`${row.day}: ${row.value}`}
                      className="w-3 rounded-t bg-emerald-400/80"
                      style={{ height: `${Math.max(6, row.value * 14)}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded bg-slate-900/50 p-2">
                <p className="mb-2 text-slate-400">Trades (last 14 days)</p>
                <div className="flex items-end gap-1">
                  {usageStats.trade_trend.map((row) => (
                    <div
                      key={row.day}
                      title={`${row.day}: ${row.trades}`}
                      className="w-3 rounded-t bg-sky-400/80"
                      style={{ height: `${Math.max(6, row.trades * 12)}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <p className="card p-4 text-sm text-muted">Loading markets...</p>}
        {error && (
          <div className="card border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded bg-rose-400/20 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-400/30"
            >
              Reload
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {markets.map((market) => (
              <Link
                key={market.id}
                prefetch={false}
                href={`/market/${market.id}`}
                className="card block touch-manipulation p-4 hover:border-slate-700 active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <SongCover imageUrl={market.songImageUrl} label={market.songTitle || market.title} />
                    <div className="min-w-0">
                      <h2 className="text-base font-medium text-white">{market.title}</h2>
                      {market.songTitle && (
                        <p className="mt-1 text-xs text-slate-300">
                          {market.songTitle}
                          {market.songArtists?.length > 0 ? ` - ${market.songArtists.join(', ')}` : ''}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">{market.description}</p>
                    </div>
                  </div>
                  <span className="badge shrink-0">{market.status}</span>
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

      <aside className="order-2 space-y-4">
        <AuthWidget />

        <div className="card p-4">
          <h3 className="text-sm font-semibold">Top Movers</h3>
          <p className="mt-1 text-xs text-slate-400">Biggest moves away from 50/50</p>
          {loading && <p className="mt-2 text-xs text-muted">Computing...</p>}
          {!loading && topMovers.length === 0 && <p className="mt-2 text-xs text-muted">No market movement yet.</p>}
          <div className="mt-3 space-y-3 text-sm">
            {topMovers.map((m) => (
              <Link
                key={m.id}
                prefetch={false}
                href={`/market/${m.id}`}
                className="block touch-manipulation rounded-lg bg-slate-900/60 p-3 hover:bg-slate-900 active:scale-[0.995]"
              >
                <div className="flex items-center gap-2">
                  <SongCover imageUrl={m.songImageUrl} label={m.songTitle || m.title} compact />
                  <p className="line-clamp-2 text-xs text-slate-200">{m.title}</p>
                </div>
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
