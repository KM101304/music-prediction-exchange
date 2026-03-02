"use client";

import { useEffect, useMemo, useState } from 'react';
import { ProbabilityChart } from '../../../components/ProbabilityChart';
import { SourceMetricChart } from '../../../components/SourceMetricChart';
import { getStoredToken, request } from '../../../lib/api';

function niceDate(value) {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
}

function SongArt({ url, alt }) {
  if (url) {
    return (
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-slate-700 bg-slate-800">
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded border border-slate-700 bg-[linear-gradient(145deg,#0f172a,#1e293b_45%,#2563eb)]">
      <span className="text-[9px] uppercase tracking-wide text-slate-200">Track</span>
    </div>
  );
}

export default function MarketDetailPage({ params }) {
  const [market, setMarket] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [side, setSide] = useState('YES');
  const [shares, setShares] = useState('10');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradeMessage, setTradeMessage] = useState('');

  const marketId = params.id;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const marketData = await request(`/markets/${marketId}`);
        if (!cancelled) {
          setMarket(marketData);
        }

        const token = getStoredToken();
        if (token) {
          const portfolioData = await request('/me/portfolio', { token });
          if (!cancelled) {
            setPortfolio(portfolioData);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  const myPosition = useMemo(() => {
    if (!portfolio) {
      return [];
    }
    return portfolio.positions.filter((position) => Number(position.marketId) === Number(marketId));
  }, [portfolio, marketId]);

  async function onTrade(event) {
    event.preventDefault();
    setTradeLoading(true);
    setTradeMessage('');
    setError('');
    const token = getStoredToken();
    if (!token) {
      setTradeLoading(false);
      setError('Please login first on the homepage.');
      return;
    }

    try {
      const payload = { side, shares: Number(shares) };
      const result = await request(`/markets/${marketId}/trade`, { method: 'POST', token, body: payload });
      setTradeMessage(`Trade executed. Cost ${result.cost.toFixed(3)} credits.`);
      const [updatedMarket, updatedPortfolio] = await Promise.all([
        request(`/markets/${marketId}`),
        request('/me/portfolio', { token }),
      ]);
      setMarket(updatedMarket);
      setPortfolio(updatedPortfolio);
    } catch (err) {
      setError(err.message);
    } finally {
      setTradeLoading(false);
    }
  }

  if (loading) {
    return <p className="card p-4 text-sm text-muted">Loading market...</p>;
  }

  if (error && !market) {
    return <p className="card border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-200">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="badge">Market #{market.id}</p>
            <h1 className="mt-3 text-xl font-semibold">{market.title}</h1>
            <p className="mt-2 text-sm text-muted">{market.description}</p>
            {(market.songTitle || market.songArtists?.length > 0 || market.songUrl || market.songImageUrl) && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <SongArt url={market.songImageUrl} alt={market.songTitle || market.title} />
                <div className="min-w-0 text-xs">
                  {market.songTitle && <p className="truncate font-medium text-white">{market.songTitle}</p>}
                  {market.songArtists?.length > 0 && (
                    <p className="mt-1 truncate text-slate-300">{market.songArtists.join(', ')}</p>
                  )}
                  {market.songUrl && (
                    <a
                      href={market.songUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-emerald-300 hover:text-emerald-200"
                    >
                      Open on Spotify
                    </a>
                  )}
                </div>
              </div>
            )}
            {!market.songTitle && !market.songImageUrl && market.spotifyTrackId && (
              <p className="mt-2 text-xs text-slate-400">Song metadata is queued. Run Spotify ingest to populate visuals.</p>
            )}
          </div>
          <div className="rounded-lg bg-slate-900/70 p-3 text-xs text-slate-300">
            <p>Closes: {niceDate(market.closeAt)}</p>
            <p className="mt-1">Settle by: {niceDate(market.settleBy)}</p>
            <p className="mt-1">Status: {market.status}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-300">Resolution criteria: {market.resolutionCriteria}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <ProbabilityChart points={market.tradeHistory} />
          {market.sourceDataPoints && market.sourceDataPoints.length > 0 && (
            <SourceMetricChart
              points={market.sourceDataPoints.map((point, idx) => ({ index: idx + 1, metricValue: point.metricValue }))}
              label={market.sourceDataPoints[0].metricName}
            />
          )}

          <div className="card p-4 text-sm">
            <h2 className="text-sm font-semibold">Market Metrics</h2>
            <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-slate-300 sm:grid-cols-3">
              <p>YES probability: {(market.probabilityYes * 100).toFixed(2)}%</p>
              <p>NO probability: {(market.probabilityNo * 100).toFixed(2)}%</p>
              <p>Volume: {Number(market.volumeShares).toFixed(2)} shares</p>
              <p>Source: {market.sourceType}</p>
              <p>Latest source value: {market.latestSourceValue == null ? 'N/A' : Number(market.latestSourceValue).toFixed(2)}</p>
              <p>Latest source at: {niceDate(market.latestSourceAt)}</p>
            </div>
          </div>

          {market.sourceDataPoints && market.sourceDataPoints.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-slate-800 px-4 py-3">
                <h3 className="text-sm font-semibold">Source Snapshots</h3>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/70 text-slate-300">
                    <tr>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Metric</th>
                      <th className="px-4 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...market.sourceDataPoints].reverse().map((point) => (
                      <tr key={point.id} className="border-t border-slate-800">
                        <td className="px-4 py-2">{niceDate(point.recordedAt)}</td>
                        <td className="px-4 py-2">{point.metricName}</td>
                        <td className="px-4 py-2">{Number(point.metricValue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <form onSubmit={onTrade} className="card p-4">
            <h2 className="text-sm font-semibold">Place Position</h2>
            <p className="mt-1 text-xs text-slate-400">Choose side and share quantity.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSide('YES')}
                className={`rounded px-3 py-2 ${side === 'YES' ? 'bg-accent text-slate-900' : 'bg-slate-800 text-slate-200'}`}
              >
                Buy YES
              </button>
              <button
                type="button"
                onClick={() => setSide('NO')}
                className={`rounded px-3 py-2 ${side === 'NO' ? 'bg-accent text-slate-900' : 'bg-slate-800 text-slate-200'}`}
              >
                Buy NO
              </button>
            </div>
            <input
              className="mt-3 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="number"
              min="0.1"
              step="0.1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
            />
            <button disabled={tradeLoading} className="mt-3 w-full rounded bg-accent px-3 py-2 font-medium text-slate-900">
              {tradeLoading ? 'Executing...' : `Submit ${side}`}
            </button>
            {tradeMessage && <p className="mt-2 text-xs text-emerald-300">{tradeMessage}</p>}
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          </form>

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Your Position</h3>
            {!portfolio && <p className="mt-2 text-xs text-muted">Login to view your market position.</p>}
            {portfolio && myPosition.length === 0 && <p className="mt-2 text-xs text-muted">No shares in this market yet.</p>}
            <div className="mt-2 space-y-2 text-xs">
              {myPosition.map((position) => (
                <div key={`${position.marketId}-${position.side}`} className="rounded bg-slate-900/60 p-2">
                  <p>
                    {position.side}: {Number(position.shares).toFixed(2)} shares
                  </p>
                  <p>Mark value: {Number(position.markValue).toFixed(2)} credits</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
