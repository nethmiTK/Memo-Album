'use client';

import Link from 'next/link';
import { Image, Heart, Settings, HelpCircle } from 'lucide-react';

export default function UserPanelPage() {
  const menuItems = [
    {
      title: 'My Albums',
      description: 'View and manage your wedding albums',
      icon: <Image size={32} />,
      href: '/user-panel/albums',
      color: '#D23284',
    },
    {
      title: 'Favorites',
      description: 'Access your favorite photos',
      icon: <Heart size={32} />,
      href: '/user-panel/favorites',
      color: '#E91E63',
    },
    {
      title: 'Settings',
      description: 'Manage your account settings',
      icon: <Settings size={32} />,
      href: '/user-panel/settings',
      color: '#9B7D8A',
    },
    {
      title: 'Support',
      description: 'Get help and support',
      icon: <HelpCircle size={32} />,
      href: '/user-panel/support',
      color: '#B8A7AF',
    },
  ];

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8">
      {/* Welcome Section */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2" style={{ color: '#2C1E26' }}>
          Welcome Back
        </h1>
        <p className="text-lg text-gray-600" style={{ color: '#6B7387' }}>
          Explore your memories and manage your wedding album
        </p>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative p-8 rounded-2xl transition-all duration-300 hover:shadow-xl overflow-hidden"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
          >
            {/* Hover Background */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
              style={{ backgroundColor: item.color }}
            ></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-4 inline-block p-3 rounded-lg transition-colors duration-300" style={{ backgroundColor: '#FEF0F1' }}>
                <div style={{ color: item.color }}>{item.icon}</div>
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-semibold mb-2 transition-colors duration-300" style={{ color: '#2C1E26' }}>
                {item.title}
              </h3>
              <p className="text-gray-600" style={{ color: '#6B7387' }}>
                {item.description}
              </p>
            </div>

            {/* Arrow */}
            <div className="absolute bottom-6 right-6 text-gray-400 transform group-hover:translate-x-1 transition-transform duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}>
          <p className="text-sm text-gray-600 mb-2" style={{ color: '#6B7387' }}>Total Albums</p>
          <p className="text-3xl font-bold" style={{ color: '#D23284' }}>0</p>
        </div>
        <div className="p-6 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}>
          <p className="text-sm text-gray-600 mb-2" style={{ color: '#6B7387' }}>Total Photos</p>
          <p className="text-3xl font-bold" style={{ color: '#D23284' }}>0</p>
        </div>
        <div className="p-6 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}>
          <p className="text-sm text-gray-600 mb-2" style={{ color: '#6B7387' }}>Favorites</p>
          <p className="text-3xl font-bold" style={{ color: '#D23284' }}>0</p>
        </div>
      </div>
    </div>
  );
}
