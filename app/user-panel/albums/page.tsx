'use client';

import Link from 'next/link';
import { Image as ImageIcon, ArrowRight, Share2, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/lib/useAuth';
import { apiFetch, handleAuthError } from '@/lib/api';

interface Album {
  id: string;
  bookAlbumId?: string;
  name: string;
  photographerName?: string;
  coverImage?: string;
  photoCount: number;
  date: string;
}

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed right-5 top-5 z-50 rounded-2xl bg-[#2C1E26] px-4 py-3 text-sm text-white shadow-2xl">
      {message}
    </div>
  );
}

export default function AlbumsPage() {
  const { user, loading: authLoading } = useProtectedRoute(['client', 'couple']);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareFeedback, setShareFeedback] = useState('');

  const buildBookShareSlug = (albumName: string, photographerName: string, albumId: string) => {
    const base = [albumName || 'album', photographerName].filter(Boolean).join(' ');
    const normalized = base
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const shortId = (albumId || '').slice(0, 8);
    return normalized ? `${normalized}${shortId ? `-${shortId}` : ''}` : `album${shortId ? `-${shortId}` : ''}`;
  };

  const shareAlbum = async (album: Album, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const shareSlug = buildBookShareSlug(album.name, album.photographerName || '', album.bookAlbumId || album.id);
    const shareUrl = `${window.location.origin}/album?slug=${encodeURIComponent(shareSlug)}`;
    const shareData = {
      title: `Share ${album.name}`,
      text: `Check out ${album.name}`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback(`Link copied for ${album.name}`);
        window.setTimeout(() => setShareFeedback(''), 1800);
      } else {
        setShareFeedback('Sharing is unavailable on this device');
        window.setTimeout(() => setShareFeedback(''), 1800);
      }
    } catch {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareFeedback(`Link copied for ${album.name}`);
        } catch {
          setShareFeedback('Sharing is unavailable on this device');
        }
      } else {
        setShareFeedback('Sharing is unavailable on this device');
      }
      window.setTimeout(() => setShareFeedback(''), 1800);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      const loadAssignedAlbums = async () => {
        try {
          const response = await apiFetch('/client-invites/assigned-albums');
          if (response.status === 401) {
            handleAuthError(response);
            return;
          }

          const result = await response.json();
          if (!response.ok || !result.success || !Array.isArray(result.albums)) {
            setAlbums([]);
            return;
          }

          const mapped: Album[] = result.albums.map((item: any) => ({
            id: item.id,
            bookAlbumId: item.bookAlbumId || item.id,
            name: item.name || 'Album',
            photographerName: item.photographerName || '',
            coverImage: item.coverImage || '',
            photoCount: Number(item.photoCount || 0),
            date: item.date ? new Date(item.date).toLocaleDateString() : '-',
          }));

          setAlbums(mapped);
        } catch (error) {
          console.error('Failed to load assigned albums:', error);
          setAlbums([]);
        } finally {
          setLoading(false);
        }
      };

      loadAssignedAlbums();
    }
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totalPhotos = albums.reduce((sum, album) => sum + album.photoCount, 0);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Toast message={shareFeedback} />
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
              <div className="max-w-4xl mx-auto py-24 text-center">
            <ImageIcon size={64} className="mx-auto mb-6 text-[#D23284] opacity-50" />
            <h2 className="text-3xl font-semibold text-[#2C1E26] mb-3">No albums found</h2>
            <p className="text-base text-[#534345]">
              Your album list is empty right now. Refresh the page or check back once albums are assigned.
            </p>
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
                  <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => shareAlbum(albums[0], e)}
                      className="rounded-full bg-white/90 p-2 text-[#D23284] shadow-sm transition hover:bg-white"
                      title="Share album"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`/user-panel/albums/${albums[0].id}/book?source=session`, '_blank');
                      }}
                      className="rounded-full bg-white/90 p-2 text-[#D23284] shadow-sm transition hover:bg-white"
                      title="Open Book"
                    >
                      <BookOpen size={16} />
                    </button>
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
                  <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => shareAlbum(albums[1], e)}
                      className="rounded-full bg-white/90 p-2 text-[#D23284] shadow-sm transition hover:bg-white"
                      title="Share album"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`/user-panel/albums/${albums[1].id}/book?source=session`, '_blank');
                      }}
                      className="rounded-full bg-white/90 p-2 text-[#D23284] shadow-sm transition hover:bg-white"
                      title="Open Book"
                    >
                      <BookOpen size={16} />
                    </button>
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
                  <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => shareAlbum(album, e)}
                      className="rounded-full bg-white/90 p-2 text-[#D23284] shadow-sm transition hover:bg-white"
                      title="Share album"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`/user-panel/albums/${album.id}/book?source=session`, '_blank');
                      }}
                      className="rounded-full bg-white/90 p-2 text-[#D23284] shadow-sm transition hover:bg-white"
                      title="Open Book"
                    >
                      <BookOpen size={16} />
                    </button>
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
          </div>
        </section>
      )}
    </div>
  );
}
