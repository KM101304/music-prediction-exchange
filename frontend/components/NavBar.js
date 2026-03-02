import Link from 'next/link';

const navItems = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/admin', label: 'Admin' },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-3 text-sm">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-emerald-400/20 text-emerald-300">M</span>
          <div>
            <p className="font-semibold text-white">Music Prediction Exchange</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Play-money simulation</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-sm text-slate-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
