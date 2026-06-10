'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, X, Home, Images, Camera, Mail } from 'lucide-react';
import { logout } from '@/lib/useAuth';

const navLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Album', href: '/album', icon: Images },
  { label: 'Photographer', href: '/photographer', icon: Camera },
  { label: 'Contact', href: '/contact', icon: Mail },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveUser = () => {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const userDataRaw = localStorage.getItem('userData');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const user = userRaw ? JSON.parse(userRaw) : {};
        const userData = userDataRaw ? JSON.parse(userDataRaw) : {};
        setUser({ ...user, ...userData });
      } catch (e) {
        console.error('Failed to parse user data');
        setUser(null);
      }
      setLoading(false);
    };

    resolveUser();
    window.addEventListener('storage', resolveUser);
    window.addEventListener('profile-updated', resolveUser as EventListener);
    return () => {
      window.removeEventListener('storage', resolveUser);
      window.removeEventListener('profile-updated', resolveUser as EventListener);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setProfileOpen(false);
    router.push('/');
  };

  const profileHref = user?.role?.toLowerCase() === 'photographer'
    ? '/photographer-admin/settings'
    : '/user-panel/profile';

  const profileImageSrc = user?.profileImage || user?.profilePic || '';

  return (
    <header className="sticky top-0 z-50 border-b border-[#211a1b]/10 bg-[#fff8f8]">
      <div className="mx-auto flex h-16 sm:h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg sm:text-xl font-serif font-semibold tracking-tight text-[#8c0053]">
          Memo Album
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium uppercase tracking-widest transition hover:text-[#890051] ${pathname === link.href ? 'text-[#890051]' : 'text-[#534345]'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Profile */}
        <div className="flex items-center gap-3">
          {!loading && !user ? (
            <Link
              href="/login"
              className="hidden sm:block rounded-full bg-gradient-to-r from-[#890051] to-[#d23284] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Sign In
            </Link>
          ) : (
            <div className="hidden sm:block relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/70 transition-all"
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#890051] to-[#d23284] flex items-center justify-center text-white font-bold overflow-hidden border border-white/30">
                  {profileImageSrc ? (
                    <img src={profileImageSrc} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start text-sm">
                  <span className="font-semibold text-[#534345]">{user?.name?.split(' ')[0] || 'User'}</span>
                  <span className="text-xs text-[#9B9095] -mt-0.5">{user?.role}</span>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-16 right-0 z-40 w-56 bg-white rounded-2xl shadow-xl border border-[#8c0053]/10 py-2"
                    >
                      <Link href={profileHref} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-[#fff8f8]">
                        <User size={18} /> My Profile
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={18} /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-xl hover:bg-black/5 transition-colors"
          >
            <div className="space-y-1.5">
              <motion.div animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0 }} className="w-6 h-0.5 bg-[#8c0053] rounded" />
              <motion.div animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }} className="w-6 h-0.5 bg-[#8c0053] rounded" />
              <motion.div animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0 }} className="w-6 h-0.5 bg-[#8c0053] rounded" />
            </div>
          </button>
        </div>
      </div>

      {/* ====================== MOBILE MENU ====================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-80 md:hidden z-50 bg-gradient-to-b from-[#fff8f8] to-[#ffe8f0] shadow-2xl flex flex-col overflow-y-auto"
            >
              {/* Profile Header */}
              {user && (
                <div className="bg-gradient-to-br from-[#890051] to-[#d23284] p-6 text-white relative">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30">
                      {profileImageSrc ? (
                        <img src={profileImageSrc} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                          <span className="text-3xl font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{user.name || 'User'}</h3>
                      <p className="text-white/80 text-sm">{user.role || 'Member'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X size={26} />
                  </button>
                </div>
              )}

              {!user && (
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="text-2xl font-serif font-semibold text-[#8c0053]">Memo Album</div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                    <X size={28} className="text-[#8c0053]" />
                  </button>
                </div>
              )}

              {/* Navigation Links + My Profile */}
              <nav className="flex-1 px-6 py-8 space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-base font-semibold transition-all ${pathname === link.href
                        ? 'text-[#d23284] font-bold bg-white/70'
                        : 'text-[#534345] hover:text-[#d23284] hover:bg-white/50'
                        }`}
                    >
                      <link.icon size={24} />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* My Profile */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Link
                      href={profileHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-base font-semibold transition-all ${pathname === profileHref
                        ? 'text-[#d23284] font-bold bg-white/70'
                        : 'text-[#534345] hover:text-[#d23284] hover:bg-white/50'
                        }`}
                    >
                      <User size={24} />
                      My Profile
                    </Link>
                  </motion.div>
                )}
              </nav>

              {/* Logout / Sign In */}
              {user ? (
                <div className="p-6 border-t mt-auto">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-3 w-full py-4 text-white font-semibold rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg transition-all"
                  >
                    <LogOut size={22} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="p-6 border-t mt-auto">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-4 text-center bg-gradient-to-r from-[#890051] to-[#d23284] text-white font-semibold rounded-2xl shadow-lg"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}