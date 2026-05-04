'use client';

import Link from 'next/link';
import { Plus, Image as ImageIcon, ArrowRight } from 'lucide-react';
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

  const totalPhotos = albums.reduce((sum, album) => sum + album.photoCount, 0);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Editorial Header Section */}
      <section className="px-4 md:px-8 lg:px-12 pt-12 md:pt-20 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] mb-4" style={{ color: '#D23284' }}>
              Your Collection / Albums
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight" style={{ color: '#2C1E26' }}>
              Your Wedding{' '}
              <span className="italic font-light" style={{ color: '#D23284' }}>
                Albums
              </span>
            </h1>
            <p className="text-base md:text-lg font-serif italic" style={{ color: '#534345' }}>
              A complete collection of your most treasured moments, organized and preserved with care.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-6 md:gap-8 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2" style={{ color: '#6B7387' }}>
                TOTAL ALBUMS
              </p>
              <p className="text-3xl md:text-4xl font-serif font-light leading-none" style={{ color: '#2C1E26' }}>
                {albums.length}
              </p>
            </div>
            <div className="h-12 w-px" style={{ backgroundColor: '#E5CCD4', opacity: 0.5 }}></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2" style={{ color: '#6B7387' }}>
                TOTAL PHOTOS
              </p>
              <p className="text-3xl md:text-4xl font-serif font-light leading-none" style={{ color: '#2C1E26' }}>
                {totalPhotos}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Empty State with Placeholder Grid */}
      {!loading && albums.length === 0 ? (
        <section className="px-4 md:px-8 lg:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
            {/* Large Placeholder Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div
                className="rounded-lg h-96 md:h-full flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#FEF0F1' }}
              >
                <div className="text-center z-10">
                  <ImageIcon size={56} className="mx-auto mb-3" style={{ color: '#D23284', opacity: 0.4 }} />
                  <p className="font-serif text-lg italic" style={{ color: '#9B9095' }}>
                    First Album Awaits
                  </p>
                </div>
              </div>

              {/* Grid of Placeholder Cards */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg h-24 md:h-32 flex items-center justify-center transition-all duration-300 hover:shadow-md"
                    style={{ backgroundColor: '#FEF0F1' }}
                  >
                    <ImageIcon size={24} style={{ color: '#D23284', opacity: 0.3 }} />
                  </div>
                ))}
              </div>
            </div>
 
          </div>
        </section>
      ) : (
        /* Asymmetric Editorial Gallery Grid */
        <section className="px-4 md:px-8 lg:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-max">
              {/* Feature Large Vertical (LHS) */}
              {albums.length > 0 && (
                <Link
                  href={`/user-panel/albums/${albums[0].id}`}
                  className="col-span-1 md:col-span-5 md:row-span-2 group relative overflow-hidden rounded-lg h-96 md:h-full transition-all duration-300 hover:shadow-lg"
                >
                  {albums[0].coverImage ? (
                    <img
                      src={albums[0].coverImage}
                      alt={albums[0].name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: '#FEF0F1' }}
                    >
                      <ImageIcon size={56} style={{ color: '#D23284', opacity: 0.3 }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex flex-col justify-end p-6">
                    <h3 className="font-serif text-xl md:text-2xl font-light text-white mb-1">
                      {albums[0].name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      {albums[0].photoCount} Photos
                    </p>
                  </div>
                </Link>
              )}

              {/* Top Right Landscape Card */}
              {albums.length > 1 && (
                <Link
                  href={`/user-panel/albums/${albums[1].id}`}
                  className="col-span-1 md:col-span-7 group relative overflow-hidden rounded-lg h-48 md:h-64 transition-all duration-300 hover:shadow-lg"
                >
                  {albums[1].coverImage ? (
                    <img
                      src={albums[1].coverImage}
                      alt={albums[1].name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: '#FEF0F1' }}
                    >
                      <ImageIcon size={48} style={{ color: '#D23284', opacity: 0.3 }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex flex-col justify-end p-4 md:p-6">
                    <h3 className="font-serif text-lg md:text-xl font-light text-white">
                      {albums[1].name}
                    </h3>
                  </div>
                </Link>
              )}

              {/* Bottom Grid - 2 to 4 Albums */}
              {albums.slice(2, 5).map((album, idx) => (
                <Link
                  key={album.id}
                  href={`/user-panel/albums/${album.id}`}
                  className={`group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg ${
                    idx === 0 ? 'col-span-1 md:col-span-3' : 'col-span-1 md:col-span-2'
                  } h-48 md:h-56`}
                >
                  {album.coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: '#FEF0F1' }}
                    >
                      <ImageIcon size={40} style={{ color: '#D23284', opacity: 0.3 }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-end p-3 md:p-4">
                    <div>
                      <h3 className="font-serif text-sm md:text-base font-light text-white">
                        {album.name}
                      </h3>
                      <p className="text-xs text-white/70">{album.photoCount} photos</p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* View More Card if more albums exist */}
              {albums.length > 5 && (
                <Link
                  href="#"
                  className="col-span-1 md:col-span-2 h-48 md:h-56 rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-lg group"
                  style={{ backgroundColor: '#FEF0F1' }}
                >
                  <div className="text-center">
                    <p
                      className="text-3xl md:text-4xl font-serif font-light mb-2"
                      style={{ color: '#D23284' }}
                    >
                      +{albums.length - 5}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9B9095' }}>
                      More Albums
                    </p>
                  </div>
                </Link>
              )}
            </div>

            {/* Create New Album CTA */}
            <div className="mt-12 pt-12 text-center border-t" style={{ borderColor: '#E5CCD4' }}>
              <Link
                href="/user-panel/albums/new"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-serif font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D23284 0%, #B50F69 100%)',
                }}
              >
                <Plus size={20} />
                Create New Album
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
