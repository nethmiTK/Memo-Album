'use client';

import { useEffect, useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PhotographerNavbarProps {
  onMenuClick?: () => void;
}

export default function PhotographerNavbar({ onMenuClick }: PhotographerNavbarProps) {
  const pathname = usePathname();
  const [profileImage, setProfileImage] = useState('');

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

  const getNavTitle = () => {
    if (pathname.includes('/gallery/new-collection')) return 'New Collection';
    if (pathname.includes('/gallery')) return 'My Albums';
    if (pathname.includes('/curate')) return 'Curate';
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
        <div className="hidden md:block min-w-[220px]">
          <h2 className="font-serif text-2xl" style={{ color: '#C64D92' }}>{getNavTitle()}</h2>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center md:justify-end min-w-0">
          <div className="flex items-center rounded-full px-5 py-3 w-full max-w-[320px] md:max-w-[420px] transition-all" style={{ backgroundColor: '#FEF0F1' }}>
            <Search size={18} style={{ color: '#B8A7AF' }} className="flex-shrink-0" />
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

          {/* Profile Avatar */}
          <Link
            href="/photographer-admin/settings"
            className="hidden sm:block w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
            style={{ backgroundColor: '#FBE9EC', boxShadow: '0 0 0 2px rgba(177,14,107,0.18)' }}
            title="Profile Settings"
            aria-label="Open profile settings"
          >
            <img
              alt="Profile"
              src={profileImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4KLFCK9wqKiWSOk5TSLyUg02B0K0CEenwg6Rv_90EVvNDbQoemOaUU_MJ4kxRYyVf15xRJ2OaAM4lE5SGp5Bk9IKU9fiwmYwJ7HyoKBBYzkFokru3bqt7T8Rd_VtpACeJTq24TiZj9aGDiAcDfBmkS5ghKfD3J_GpZWslnEGivWp0V4VuWHCwAkKYS_fX5UJWM-hFGZTs5J73Cr-nv2IB2jgG-mC6YirLA0REw440DDoxnXeBkyacaC1yIXQe7ZeNklXTXu3FqVw'}
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      </nav>
    </header>
  );
}
