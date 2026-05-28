'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Image,
  Sparkles,
  Users,
  Settings,
  Archive,
  HelpCircle,
  LayoutTemplate,
  PenTool
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface PhotographerSidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function PhotographerSidebar({ isMobileOpen, onClose }: PhotographerSidebarProps) {
  const pathname = usePathname();

  const mainMenuItems: MenuItem[] = [
    { label: 'Gallery', href: '/photographer-admin/gallery', icon: <Image size={20} /> },
    { label: 'Curate', href: '/photographer-admin/curate', icon: <Sparkles size={20} /> },
    { label: 'Designer', href: '/photographer-admin/designer', icon: <PenTool size={20} /> },
    { label: 'Clients', href: '/photographer-admin/clients', icon: <Users size={20} /> },
    { label: 'Settings', href: '/photographer-admin/settings', icon: <Settings size={20} /> },
 
  ];

  

  const bottomMenuItems: MenuItem[] = [
    { label: 'Archive', href: '/photographer-admin/archive', icon: <Archive size={20} /> },
    { label: 'Support', href: '/photographer-admin/support', icon: <HelpCircle size={20} /> },
  ];

  const isActive = (href: string) => pathname === href;

  const SidebarContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
        <h1
          className="text-lg font-serif font-semibold italic mb-1"
          style={{ color: '#B11469' }}
        >
          MemoAlbum
        </h1>
        <p
          className="text-[11px] tracking-[0.28em] font-semibold uppercase"
          style={{ color: '#9B9095' }}
        >
          The Digital Curator
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-4 pr-2 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
              <div
                className={active ? 'text-[#D23284]' : 'text-[#6B7387]'}
                style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem' }}
              >
                {item.icon}
              </div>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}

        

        
      </nav>

      {/* New Collection Button */}
      <div className="px-3 py-4">
        <Link
          href="/photographer-admin/gallery/new-collection"
          onClick={onClose}
          className="w-full py-3 px-4 text-white font-semibold text-[15px] rounded-xl hover:shadow-lg transition-shadow duration-200 flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, #C41474 0%, #B50F69 100%)' }}
        >
          <span>New Collection</span>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 space-y-1">
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
              <div
                className={active ? 'text-[#D23284]' : 'text-[#6B7387]'}
                style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem' }}
              >
                {item.icon}
              </div>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex md:w-64 h-screen min-h-0 flex-col overflow-hidden"
        style={{ flexShrink: 0, backgroundColor: '#F3E5E6' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 transform transition-transform duration-200 flex flex-col overflow-hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ flexShrink: 0, backgroundColor: '#F3E5E6' }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

