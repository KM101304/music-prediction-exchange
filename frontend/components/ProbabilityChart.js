"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ProbabilityChart({ points }) {
  const data = points && points.length > 0 ? points : [{ index: 0, probabilityYes: 0.5 }];

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-slate-800 bg-panel p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 6 }}>
          <XAxis dataKey="index" tick={{ fill: '#8ca3b8', fontSize: 11 }} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: '#8ca3b8', fontSize: 11 }}
          />
          <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
          <Line type="monotone" dataKey="probabilityYes" stroke="#34d399" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
