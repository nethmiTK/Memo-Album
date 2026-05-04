'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Image,
  Heart,
  User,
  Settings,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { label: 'Home', href: '/user-panel', icon: <LayoutGrid size={20} /> },
    { label: 'Albums', href: '/user-panel/albums', icon: <Image size={20} /> },
    { label: 'Favorites', href: '/user-panel/favorites', icon: <Heart size={20} /> },
    { label: 'Profile', href: '/user-panel/profile', icon: <User size={20} /> },
    { label: 'Settings', href: '/user-panel/settings', icon: <Settings size={20} /> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-20 border-t"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(229, 204, 212, 0.2)',
      }}
    >
      {menuItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-2 py-2 transition-colors duration-200"
          >
            <div
              className={`w-6 h-6 ${
                active ? 'text-[#D23284]' : 'text-[#6B7387]'
              }`}
            >
              {item.icon}
            </div>
            <span
              className={`text-[10px] font-medium ${
                active ? 'text-[#D23284]' : 'text-[#6B7387]'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
