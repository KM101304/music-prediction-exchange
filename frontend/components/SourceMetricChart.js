"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function SourceMetricChart({ points, label }) {
  const data = points && points.length > 0 ? points : [{ index: 0, metricValue: 0 }];

  return (
    <div className="h-56 w-full rounded-xl border border-slate-800 bg-panel p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="index" tick={{ fill: '#8ca3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8ca3b8', fontSize: 11 }} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(2)} ${label || ''}`} />
          <Line type="monotone" dataKey="metricValue" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
