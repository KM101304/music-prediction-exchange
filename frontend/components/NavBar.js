import Link from 'next/link';

const navItems = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/admin', label: 'Admin' },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/90 pt-[max(env(safe-area-inset-top),0px)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-2 text-sm sm:gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-400/20 text-emerald-300">M</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">Music Prediction Exchange</p>
            <p className="truncate text-[10px] uppercase tracking-wide text-slate-400">Play-money simulation</p>
          </div>
        </Link>

        <nav className="flex w-full items-center gap-1 overflow-x-auto pb-1 text-sm text-slate-300 sm:w-auto sm:overflow-visible sm:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
