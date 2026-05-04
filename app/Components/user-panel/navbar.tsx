'use client';

import { useEffect, useState } from 'react';
import { Bell, Menu, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface UserNavbarProps {
  onMenuClick?: () => void;
}

export default function UserNavbar({ onMenuClick }: UserNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const resolveUserInfo = () => {
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
      const name = user.name || user.fullName || userData.name || userData.fullName || 'User';
      const profilePic = user.profileImage || user.profilePic || userData.profileImage || userData.profilePic || '';

      setUserName(name);
      setProfileImage(profilePic);
    };

    resolveUserInfo();
    window.addEventListener('storage', resolveUserInfo);
    window.addEventListener('profile-updated', resolveUserInfo as EventListener);
    return () => {
      window.removeEventListener('storage', resolveUserInfo);
      window.removeEventListener('profile-updated', resolveUserInfo as EventListener);
    };
  }, [pathname]);

  const getNavTitle = () => {
    if (pathname === '/user-panel') return 'Overview';
    if (pathname.includes('/albums')) return 'My Albums';
    if (pathname.includes('/favorites')) return 'Favorites';
    if (pathname.includes('/profile')) return 'Profile';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/support')) return 'Support';
    return 'Dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    router.push('/login');
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

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3 md:gap-4 justify-end shrink-0">
          {/* Notifications */}
          <button
            className="h-10 w-10 flex items-center justify-center rounded-full transition-all hover:bg-gray-100"
            title="Notifications"
          >
            <Bell size={20} style={{ color: '#6B7387' }} />
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 h-10 px-3 rounded-full transition-all hover:bg-gray-100"
              title="Profile"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FEF0F1' }}
                >
                  <UserIcon size={16} style={{ color: '#D23284' }} />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[150px] truncate">
                {userName}
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
              >
                <Link
                  href="/user-panel/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <UserIcon size={16} />
                  View Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t"
                  style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
