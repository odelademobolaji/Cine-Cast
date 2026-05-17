/**
 * Root layout — server-rendered shell.
 */
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'CineCast',
  description: 'Next.js streaming architecture demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="logo">Cine<span className="dot">.</span>cast</div>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/movies">Movies</Link>
            <Link href="/tv">TV</Link>
          </div>
        </nav>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
