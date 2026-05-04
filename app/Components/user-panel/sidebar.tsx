'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Image,
  Heart,
  User,
  Settings,
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
    { label: 'Overview', href: '/user-panel', icon: <LayoutGrid size={20} /> },
    { label: 'My Albums', href: '/user-panel/albums', icon: <Image size={20} /> },
    { label: 'Favorites', href: '/user-panel/favorites', icon: <Heart size={20} /> },
    { label: 'Profile', href: '/user-panel/profile', icon: <User size={20} /> },
  ];

  const bottomMenuItems: MenuItem[] = [
    { label: 'Settings', href: '/user-panel/settings', icon: <Settings size={20} /> },
    { label: 'Support', href: '/user-panel/support', icon: <HelpCircle size={20} /> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                active
                  ? 'font-semibold text-[#D23284]'
                  : 'text-[#6B7387] hover:text-[#D23284]'
              }`}
            >
              {active && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-[#D23284]"></div>}
              <div className={`flex-shrink-0 w-5 h-5 ${active ? 'text-[#D23284]' : 'text-[#6B7387]'}`}>{item.icon}</div>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
        <div className="space-y-1">
          {bottomMenuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  active
                    ? 'font-semibold text-[#D23284]'
                    : 'text-[#6B7387] hover:text-[#D23284]'
                }`}
              >
                {active && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-[#D23284]"></div>}
                <div className={`flex-shrink-0 w-5 h-5 ${active ? 'text-[#D23284]' : 'text-[#6B7387]'}`}>{item.icon}</div>
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
        className="hidden md:flex w-64 flex-col flex-shrink-0 overflow-y-auto"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              backgroundColor: '#FFFFFF',
              boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
