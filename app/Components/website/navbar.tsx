 'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Album', href: '/album' },
  { label: 'Photographer', href: '/photographer' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#211a1b]/10 bg-[#fff8f8]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 sm:h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-5 md:px-10">
        <Link
          href="/"
          className="text-[11px] sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#8c0053]"
        >
          Memo Album
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:gap-7 md:flex">
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

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop Sign In Button */}
          <Link
            href="/login"
            className="hidden sm:block rounded-full bg-gradient-to-r from-[#890051] to-[#d23284] px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_16px_rgba(137,0,81,0.15)] sm:shadow-[0_14px_30px_rgba(137,0,81,0.22)] transition-all hover:shadow-lg"
          >
            Sign In
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
              className="w-5 h-0.5 bg-[#8c0053] block"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-5 h-0.5 bg-[#8c0053] block"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
              className="w-5 h-0.5 bg-[#8c0053] block"
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu - Side Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 md:hidden z-40 bg-black/30 backdrop-blur-sm"
            />

            {/* Side Panel - 50% width, full height */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-screen w-1/2 md:hidden z-50 bg-gradient-to-br from-[#fff8f8] via-[#ffe8f0] to-[#ffd4e0] flex flex-col justify-start pt-20 px-4 overflow-y-auto"
            >
              {/* Navigation Links */}
              <nav className="flex flex-col gap-4 w-full">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="w-full"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block w-full px-5 py-3 rounded-xl text-base font-bold uppercase tracking-wide transition-all text-center cursor-pointer ${
                        pathname === link.href
                          ? 'bg-gradient-to-r from-[#890051] to-[#d23284] text-white shadow-lg'
                          : 'bg-white/70 text-[#534345] hover:bg-white/90 hover:shadow-lg'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Divider */}
              <div className="w-full h-1 bg-gradient-to-r from-[#8c0053]/40 via-[#A11462]/40 to-transparent rounded-full my-4" />

              {/* Mobile Sign In Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32 }}
                className="w-full"
              >
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#890051] to-[#d23284] text-white text-base font-bold uppercase tracking-wide text-center shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
