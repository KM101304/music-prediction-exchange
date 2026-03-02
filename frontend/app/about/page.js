export const metadata = {
  title: 'About | Music Prediction Exchange',
  description: 'What the Music Prediction Exchange is, how it works, and what data it tracks.',
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <p className="badge">About</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Music Prediction Exchange</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Music Prediction Exchange is a play-money forecasting platform where users take YES/NO positions on music
          milestones, such as whether a track reaches a stream target by a deadline.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-sm font-semibold text-white">How Trading Works</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Each account starts with 10,000 credits.</li>
            <li>Users buy YES or NO shares on open markets.</li>
            <li>Pricing updates automatically using an LMSR market maker.</li>
            <li>No deposits, withdrawals, crypto wallets, or cash value.</li>
          </ul>
        </article>

        <article className="card p-5">
          <h2 className="text-sm font-semibold text-white">Settlement Model</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Markets include explicit close and settlement dates.</li>
            <li>Admins settle outcomes manually with source notes.</li>
            <li>Winning shares resolve to 1 credit per share.</li>
            <li>All balance changes are recorded in the ledger.</li>
          </ul>
        </article>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-white">Why This Exists</h2>
        <p className="mt-3 text-sm text-slate-300">
          The product demonstrates that community forecasts can surface market sentiment around song momentum. It is
          designed as an analytics-driven simulation, not a real-money product.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-white">Live Metrics Tracked</h2>
        <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded bg-slate-900/60 p-3">Total users and new user growth</div>
          <div className="rounded bg-slate-900/60 p-3">Daily and total trading activity</div>
          <div className="rounded bg-slate-900/60 p-3">Open/settled market counts</div>
          <div className="rounded bg-slate-900/60 p-3">Leaderboard performance and portfolio value</div>
        </div>
      </section>
    </div>
  );
}
