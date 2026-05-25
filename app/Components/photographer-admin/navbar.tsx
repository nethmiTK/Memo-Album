'use client';

import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Globe, LogOut, Menu, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutPhotographer } from '@/app/photographer-admin/auth';

interface PhotographerNavbarProps {
  onMenuClick?: () => void;
}

export default function PhotographerNavbar({ onMenuClick }: PhotographerNavbarProps) {
  const pathname = usePathname();
  const [profileImage, setProfileImage] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const resolveAvatar = () => {
      const userRaw = localStorage.getItem('user');
      const userDataRaw = localStorage.getItem('userData');
      let user: any = {};
      let userData: any = {};
      try {
        user = userRaw ? JSON.parse(userRaw) : {};
        userData = userDataRaw ? JSON.parse(userDataRaw) : {};
      } catch {
        user = {};
        userData = {};
      }
      const value = user.profileImage || user.profilePic || userData.profileImage || userData.profilePic || '';

      if (!value) {
        setProfileImage('');
        return;
      }

      if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) {
        setProfileImage(value);
        return;
      }

      // Use the value directly if it's a local path
      setProfileImage(value);
    };

    resolveAvatar();
    window.addEventListener('storage', resolveAvatar);
    window.addEventListener('profile-updated', resolveAvatar as EventListener);
    return () => {
      window.removeEventListener('storage', resolveAvatar);
      window.removeEventListener('profile-updated', resolveAvatar as EventListener);
    };
  }, [pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const getNavTitle = () => {
    if (pathname.includes('/gallery/new-collection')) return 'New Collection';
    if (pathname.includes('/gallery')) return 'My Albums';
    if (pathname.includes('/curate')) return 'Curate';
    if (pathname.includes('/designer')) return 'Designer';
    if (pathname.includes('/clients')) return 'Clients';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/archive')) return 'Archive';
    if (pathname.includes('/support')) return 'Support';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md" style={{ backgroundColor: 'rgba(254, 245, 246, 0.8)' }}>
      <nav className="flex h-20 items-center gap-3 px-4 md:px-6 lg:px-8 border-b" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
        {/* Mobile Hamburger Menu */}
        <button
          className="md:hidden p-2 transition-opacity hover:opacity-70"
          title="Menu"
          onClick={onMenuClick}
        >
          <Menu size={24} style={{ color: '#b10e6b' }} />
        </button>

        {/* Title - Hidden on mobile */}
        <div className="hidden md:block min-w-55">
          <h2 className="font-serif text-2xl" style={{ color: '#C64D92' }}>{getNavTitle()}</h2>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center md:justify-end min-w-0">
          <div className="flex items-center rounded-full px-5 py-3 w-full max-w-[320px] md:max-w-105 transition-all" style={{ backgroundColor: '#FEF0F1' }}>
            <Search size={18} style={{ color: '#B8A7AF' }} className="shrink-0" />
            <input
              type="text"
              placeholder="Search archive..."
              className="bg-transparent border-none outline-none appearance-none focus:outline-none focus-visible:outline-none focus:ring-0 text-[14px] md:text-[15px] w-full pl-3 placeholder:text-[#B8A7AF] truncate"
              style={{ color: '#4A2E39', boxShadow: 'none', outline: 'none' }}
            />
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3 md:gap-4 justify-end shrink-0">
          <button
            className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-80"
            title="Notifications"
          >
            <Bell size={22} strokeWidth={1.8} style={{ color: '#7B5B69' }} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B10E6B]/30"
              title="Profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div
                className="h-10 w-10 rounded-full overflow-hidden shrink-0"
                style={{ backgroundColor: '#FBE9EC', boxShadow: '0 0 0 2px rgba(177,14,107,0.18)' }}
              >
                {profileImage ? (
                  <img alt="Profile" src={profileImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#B10E6B]">
                    <User size={18} />
                  </div>
                )}
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-[#4A2E39]">Photographer</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#8D7980]">Account</span>
              </div>
              <ChevronDown size={16} style={{ color: '#7B5B69' }} className="hidden sm:block" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-20"
                    onClick={() => setProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-14 z-30 w-64 overflow-hidden rounded-2xl border border-[#8c0053]/10 bg-white shadow-[0_18px_50px_rgba(33,26,27,0.14)]"
                  >
                     

                    <div className="p-2">
                      
                      <Link
                        href="/"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#534345] transition-colors hover:bg-[#fff6f8] hover:text-[#B10E6B]"
                      >
                        <Globe size={16} />
                        Main Site
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          logoutPhotographer();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#D11A5A] transition-colors hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
