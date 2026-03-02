"use client";

import { useEffect, useState } from 'react';
import { request } from '../../lib/api';

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/leaderboard')
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="badge">Rankings</p>
        <h1 className="mt-3 text-xl font-semibold">Leaderboard</h1>
        <p className="mt-2 text-sm text-slate-300">Top accounts by credits balance.</p>
      </div>

      {loading && <p className="card p-4 text-sm text-muted">Loading leaderboard...</p>}
      {error && <p className="card border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-200">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-panel shadow-lg shadow-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Credits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    {row.rank <= 3 ? <span className="badge">#{row.rank}</span> : `#${row.rank}`}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-100">{row.displayName}</td>
                  <td className="px-4 py-3">{Number(row.creditsBalance).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
