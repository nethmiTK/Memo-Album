'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Image,
  Sparkles,
  Users,
  Settings,
  Archive,
  HelpCircle,
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
  const liveFeedRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  const liveAssets = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=700&fit=crop',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=900&h=700&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=700&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=700&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&h=700&fit=crop',
    'https://images.unsplash.com/photo-1523438097201-512ae7d59d4b?w=900&h=700&fit=crop',
  ];

  useEffect(() => {
    const el = liveFeedRef.current;
    if (!el) return;

    let lastTs = performance.now();
    const speed = 0.03;

    const tick = (ts: number) => {
      if (!el) return;
      const delta = ts - lastTs;
      lastTs = ts;

      if (!pausedRef.current) {
        el.scrollTop += delta * speed;
        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = el.scrollTop - el.scrollHeight / 2;
        }
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const mainMenuItems: MenuItem[] = [
    { label: 'Gallery', href: '/photographer-admin/gallery', icon: <Image size={20} /> },
    { label: 'Curate', href: '/photographer-admin/curate', icon: <Sparkles size={20} /> },
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
      <div className="px-5 py-6">
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
          The Digital Curator
        </p>
      </div>

      {/* Live Content Feed */}
      <div className="px-3 pb-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#534345]">Live Content Feed</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b11469]">Streaming</span>
        </div>

        <div
          ref={liveFeedRef}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
          className="live-feed-scroll h-[220px] overflow-y-auto rounded-xl bg-[#efe0e2] p-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="grid grid-cols-3 gap-2">
            {[...liveAssets, ...liveAssets].map((src, index) => {
              const pattern = index % 6;
              const sizeClass =
                pattern === 0
                  ? 'col-span-1 row-span-1 h-16'
                  : pattern === 1
                    ? 'col-span-1 row-span-1 h-20'
                    : pattern === 2
                      ? 'col-span-1 row-span-1 h-24'
                      : pattern === 3
                        ? 'col-span-1 row-span-1 h-20'
                        : pattern === 4
                          ? 'col-span-1 row-span-1 h-24'
                          : 'col-span-1 row-span-1 h-18';

              return (
                <article
                  key={`${src}-${index}`}
                  className={`overflow-hidden rounded-lg shadow-[0_10px_18px_-10px_rgba(33,26,27,0.35)] ${sizeClass}`}
                >
                  <img src={src} alt={`Live content ${index + 1}`} className="h-full w-full object-cover" />
                </article>
              );
            })}
          </div>
        </div>
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
              <div className={`flex-shrink-0 w-5 h-5 ${active ? 'text-[#D23284]' : 'text-[#6B7387]'}`}>{item.icon}</div>
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
        className="hidden md:flex md:w-64 h-screen min-h-0 flex-col overflow-hidden flex-shrink-0"
        style={{ backgroundColor: '#F3E5E6' }}
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
        className={`md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 transform transition-transform duration-200 flex flex-col overflow-hidden flex-shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#F3E5E6' }}
      >
        <SidebarContent />
      </aside>

      <style jsx global>{`
        .live-feed-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}

