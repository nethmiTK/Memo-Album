'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Image,
  Sparkles,
  Users,
  Settings,
  PenTool,
  Plus,
} from 'lucide-react';

const navItems = [
  { href: '/photographer-admin/gallery', icon: <Image size={22} />, label: 'Gallery' },
  { href: '/photographer-admin/curate', icon: <Sparkles size={22} />, label: 'Curate' },
  { href: '/photographer-admin/designer', icon: <PenTool size={22} />, label: 'Designer' },
  { href: '/photographer-admin/clients', icon: <Users size={22} />, label: 'Clients' },
  { href: '/photographer-admin/settings', icon: <Settings size={22} />, label: 'Tools' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Fragment key={item.href}>
              {index === 2 && (
                <Link href="/photographer-admin/gallery/new-collection">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white -mt-12"
                    style={{ background: 'linear-gradient(135deg, #b10e6b 0%, #d23284 100%)' }}
                  >
                    <Plus size={32} />
                  </div>
                </Link>
              )}
              <Link href={item.href} key={item.href}>
                <div className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#b10e6b]' : 'text-gray-400'}`}>
                  {item.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
              </Link>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
