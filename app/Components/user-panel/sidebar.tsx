'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Image,
  Heart,
  User,
  HelpCircle,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface UserSidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function UserSidebar({ isMobileOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname();

  const mainMenuItems: MenuItem[] = [
    { label: 'My Albums', href: '/user-panel/albums', icon: <Image size={20} /> },
    { label: 'Favorites', href: '/user-panel/favorites', icon: <Heart size={20} /> },
    { label: 'Profile', href: '/user-panel/profile', icon: <User size={20} /> },
  ];

  const bottomMenuItems: MenuItem[] = [
    { label: 'Support', href: '/user-panel/support', icon: <HelpCircle size={20} /> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="px-5 py-6" style={{ borderBottom: 'none' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <img
            src="/images/logobg.png"
            alt="MemoAlbum Logo"
            className="h-9 w-auto"
          />
          <h1
            className="text-[0.95rem] font-serif font-semibold italic"
            style={{ color: '#B11469' }}
          >
            MemoAlbum
          </h1>
        </div>
        <p
          className="text-[11px] tracking-[0.28em] font-semibold uppercase"
          style={{ color: '#9B9095' }}
        >
          Wedding Memories
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-4 pr-2 space-y-1 overflow-y-auto sidebar-scrollbar">
        {mainMenuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 relative ${
                active
                  ? 'font-semibold text-[#D23284]'
                  : 'text-[#6B7387] hover:text-[#D23284]'
              }`}
            >
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-[#D23284]"></div>}
              <div className={`shrink-0 w-5 h-5 ${active ? 'text-[#D23284]' : 'text-[#6B7387]'}`}>{item.icon}</div>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}

        {/* Overview Button (Positioned between Profile and Settings/Bottom Nav) */}
        <div className="px-3 py-6">
          <Link
            href="/user-panel"
            onClick={onClose}
            className="flex items-center justify-center w-full py-4 bg-[#B11469] text-white rounded-xl font-semibold tracking-wide shadow-lg hover:bg-[#8c0053] transition-all duration-300"
          >
            Overview
          </Link>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4" style={{ borderTop: 'none' }}>
        <div className="space-y-1">
          {bottomMenuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 relative ${
                  active
                    ? 'font-semibold text-[#D23284]'
                    : 'text-[#6B7387] hover:text-[#D23284]'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-[#D23284]"></div>}
                <div className={`shrink-0 w-5 h-5 ${active ? 'text-[#D23284]' : 'text-[#6B7387]'}`}>{item.icon}</div>
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col shrink-0 overflow-y-auto"
        style={{
          backgroundColor: '#F3E5E6',
          boxShadow: 'none',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={onClose}
          ></div>
          <aside
            className="fixed left-0 top-0 z-50 h-screen w-64 overflow-y-auto md:hidden flex flex-col"
            style={{
              backgroundColor: '#F3E5E6',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
