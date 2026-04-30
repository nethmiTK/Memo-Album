 'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Album', href: '/album' },
  // { label: 'About', href: '/about-us' },
  // { label: 'Photographer', href: '/photographer-admin' },
  // { label: 'User Panel', href: '/user-panel' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#211a1b]/10 bg-[#fff8f8]/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 md:px-10">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8c0053]"
        >
          Memo Album
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[11px] uppercase tracking-[0.2em] transition hover:text-[#890051] ${
                pathname === link.href ? 'text-[#890051]' : 'text-[#534345]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-[#890051] to-[#d23284] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(137,0,81,0.22)]"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
