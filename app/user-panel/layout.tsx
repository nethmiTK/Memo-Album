'use client';

import { useState } from 'react';
import UserSidebar from '../Components/user-panel/sidebar';
import UserNavbar from '../Components/user-panel/navbar';
import MobileBottomNav from '../Components/user-panel/mobile-nav';

export default function UserPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ backgroundColor: '#FFF8F7' }}>
      <UserSidebar
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <UserNavbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ backgroundColor: '#FFF8F7' }}>
          <div className="py-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
