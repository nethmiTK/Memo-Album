'use client';

import Link from 'next/link';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Album {
  id: string;
  name: string;
  coverImage?: string;
  photoCount: number;
  date: string;
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch albums from API
    setLoading(false);
  }, []);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#2C1E26' }}>
            My Albums
          </h1>
          <p className="text-gray-600 mt-2" style={{ color: '#6B7387' }}>
            {albums.length} album{albums.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {!loading && albums.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#FEF0F1' }}
          >
            <ImageIcon size={40} style={{ color: '#D23284' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#2C1E26' }}>
            No Albums Yet
          </h3>
          <p className="text-gray-600 mb-6" style={{ color: '#6B7387' }}>
            Your wedding albums will appear here
          </p>
        </div>
      ) : (
        /* Albums Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/user-panel/albums/${album.id}`}
              className="group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
            >
              {/* Cover Image */}
              <div
                className="relative w-full h-48 overflow-hidden bg-gray-200 group-hover:scale-105 transition-transform duration-300"
                style={{ backgroundColor: '#FEF0F1' }}
              >
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} style={{ color: '#D23284', opacity: 0.3 }} />
                  </div>
                )}
              </div>

              {/* Album Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1" style={{ color: '#2C1E26' }}>
                  {album.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ color: '#6B7387' }}>
                  {album.photoCount} photo{album.photoCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500" style={{ color: '#9B9095' }}>
                  {album.date}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
