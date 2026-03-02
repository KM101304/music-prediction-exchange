import './globals.css';
import { NavBar } from '../components/NavBar';

export const metadata = {
  title: 'Music Prediction Exchange',
  description: 'Play-money exchange for music stream milestone predictions',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,.13),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(59,130,246,.12),transparent_35%)]" />
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
