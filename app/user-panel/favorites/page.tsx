'use client';

import { Heart as HeartIcon, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface FavoritePhoto {
  id: string;
  url: string;
  albumName: string;
  date: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch favorite photos from API
    setLoading(false);
  }, []);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#2C1E26' }}>
          Favorite Photos
        </h1>
        <p className="text-gray-600 mt-2" style={{ color: '#6B7387' }}>
          {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty State */}
      {!loading && favorites.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#FEF0F1' }}
          >
            <HeartIcon size={40} style={{ color: '#E91E63' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#2C1E26' }}>
            No Favorites Yet
          </h3>
          <p className="text-gray-600 mb-6" style={{ color: '#6B7387' }}>
            Heart your favorite photos to save them here
          </p>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
            >
              {/* Photo */}
              <div className="relative w-full h-64 overflow-hidden bg-gray-200">
                <img
                  src={photo.url}
                  alt="Favorite photo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  className="absolute top-3 right-3 p-2 rounded-full transition-all duration-200"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  title="Remove from favorites"
                >
                  <HeartIcon size={20} style={{ color: '#E91E63', fill: '#E91E63' }} />
                </button>
              </div>

              {/* Photo Info */}
              <div className="p-4">
                <p className="text-sm font-medium" style={{ color: '#2C1E26' }}>
                  {photo.albumName}
                </p>
                <p className="text-xs text-gray-500 mt-1" style={{ color: '#9B9095' }}>
                  {photo.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
