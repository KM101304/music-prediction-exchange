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
        <NavBar />
        <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
