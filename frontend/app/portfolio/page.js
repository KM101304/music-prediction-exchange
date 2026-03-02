"use client";

import { useEffect, useMemo, useState } from 'react';
import { getStoredToken, request } from '../../lib/api';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setError('Login on the homepage to view your portfolio.');
      setLoading(false);
      return;
    }

    Promise.all([request('/me/portfolio', { token }), request('/me/transactions', { token })])
      .then(([portfolioData, txData]) => {
        setPortfolio(portfolioData);
        setTransactions(txData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    if (!portfolio) {
      return { marks: 0, yes: 0, no: 0 };
    }
    return portfolio.positions.reduce(
      (acc, p) => {
        acc.marks += Number(p.markValue || 0);
        if (p.side === 'YES') {
          acc.yes += 1;
        } else {
          acc.no += 1;
        }
        return acc;
      },
      { marks: 0, yes: 0, no: 0 }
    );
  }, [portfolio]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Portfolio</h1>
      {loading && <p className="card p-4 text-sm text-muted">Loading...</p>}
      {error && <p className="card border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-200">{error}</p>}

      {portfolio && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Credits balance</p>
              <p className="mt-2 text-2xl font-semibold">{Number(portfolio.creditsBalance).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Marked value</p>
              <p className="mt-2 text-2xl font-semibold">{totals.marks.toFixed(2)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Positions</p>
              <p className="mt-2 text-2xl font-semibold">
                {portfolio.positions.length} <span className="text-base text-slate-400">({totals.yes} YES / {totals.no} NO)</span>
              </p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">Open Positions</h2>
            <div className="space-y-2 text-sm">
              {portfolio.positions.length === 0 && <p className="text-muted">No positions yet.</p>}
              {portfolio.positions.map((position) => (
                <div key={`${position.marketId}-${position.side}`} className="rounded border border-slate-800 bg-slate-900/50 p-3">
                  <p className="font-medium">{position.marketTitle}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {position.side} {Number(position.shares).toFixed(2)} shares
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Mark price {Number(position.markPrice).toFixed(4)} | Mark value {Number(position.markValue).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">Recent Transactions</h2>
            <div className="max-h-80 space-y-2 overflow-auto text-xs">
              {transactions.length === 0 && <p className="text-muted">No transactions yet.</p>}
              {transactions.map((tx) => (
                <div key={tx.id} className="rounded border border-slate-800 bg-slate-900/50 p-2">
                  <p>
                    {tx.entryType} | {Number(tx.amountCredits).toFixed(3)} credits | balance {Number(tx.balanceAfter).toFixed(3)}
                  </p>
                  <p className="text-muted">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
