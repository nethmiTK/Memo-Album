'use client';

import { useState } from 'react';
import PhotographerSidebar from '../Components/photographer-admin/sidebar';
import PhotographerNavbar from '../Components/photographer-admin/navbar';
import MobileBottomNav from '../Components/photographer-admin/MobileBottomNav';

export default function PhotographerAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ backgroundColor: '#FFF8F7' }}>
      <PhotographerSidebar
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <PhotographerNavbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ backgroundColor: '#FFF8F7' }}>
          <div className="py-2">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
