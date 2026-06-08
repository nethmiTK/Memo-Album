 'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Heart, Image as ImageIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch, handleAuthError } from '@/lib/api';
import { useProtectedRoute } from '@/lib/useAuth';

const favoritesCacheKey = 'memoalbum:user-panel:favorites';

interface FavoritePhoto {
  id: string;
  url: string;
  albumName: string;
  fileName?: string;
  mediaKind?: string;
  sourceType?: 'gallery' | 'album';
  createdAt?: string;
}

export default function FavoritesPage() {
  const { loading: authLoading } = useProtectedRoute(['client', 'couple']);
  const [favorites, setFavorites] = useState<FavoritePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<FavoritePhoto | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem(favoritesCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { items?: FavoritePhoto[] };
          if (Array.isArray(parsed.items)) {
            setFavorites(parsed.items);
          }
        }
      } catch {
        // Ignore cache parse failures.
      }
    }

    const loadFavorites = async () => {
      try {
        const [favoritesResponse, galleryResponse] = await Promise.all([
          apiFetch('/favorites'),
          apiFetch('/gallery/media'),
        ]);

        if (favoritesResponse.status === 401 || galleryResponse.status === 401) {
          handleAuthError(favoritesResponse.status === 401 ? favoritesResponse : galleryResponse);
          return;
        }

        const favoritesResult = await favoritesResponse.json();
        const galleryResult = await galleryResponse.json();

        const rawFavorites = Array.isArray(favoritesResult.favorites) ? favoritesResult.favorites : [];
        const galleryFavorites = Array.isArray(galleryResult.data)
          ? galleryResult.data
              .filter((item: any) => item.isFavorite)
              .map((item: any) => ({
                id: String(item._id),
                url: item.url,
                albumName: item.albumName || 'Gallery',
                fileName: item.title,
                mediaKind: item.mediaType,
                sourceType: 'gallery' as const,
                createdAt: item.createdAt || item.uploadedAt,
              }))
          : [];

        const mergedFavorites = [...rawFavorites, ...galleryFavorites].reduce<FavoritePhoto[]>((acc, favorite) => {
          if (!favorite?.id) return acc;
          if (acc.some((item) => item.id === favorite.id)) return acc;
          return [...acc, favorite];
        }, []);

        setFavorites(mergedFavorites);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(favoritesCacheKey, JSON.stringify({ items: mergedFavorites, timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [authLoading]);

  const removeFavorite = async (id: string) => {
    try {
      setRemovingId(id);
      const sourceItem = favorites.find((photo) => photo.id === id);
      let response;

      if (sourceItem?.sourceType === 'gallery') {
        response = await apiFetch(`/gallery/media/${id}/favorite`, { method: 'PATCH' });
      } else {
        response = await apiFetch(`/favorites/${id}`, { method: 'DELETE' });
      }

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      if (sourceItem?.sourceType === 'gallery') {
        if (!response.ok) {
          throw new Error('Unable to remove gallery favorite');
        }
      } else {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to remove favorite');
        }
      }

      setFavorites((current) => current.filter((photo) => photo.id !== id));
      setMessage('Removed from favorites');
      window.setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      setMessage('Could not remove favorite');
      window.setTimeout(() => setMessage(''), 2000);
    } finally {
      setRemovingId(null);
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm('Delete this media permanently? This cannot be undone.')) return;

    try {
      setRemovingId(id);
      const sourceItem = favorites.find((photo) => photo.id === id);

      if (sourceItem?.sourceType === 'gallery') {
        const response = await apiFetch(`/gallery/media/${id}`, { method: 'DELETE' });

        if (response.status === 401) {
          handleAuthError(response);
          return;
        }

        if (!response.ok) {
          throw new Error('Unable to delete gallery media');
        }
      } else {
        const response = await apiFetch(`/favorites/${id}`, { method: 'DELETE' });

        if (response.status === 401) {
          handleAuthError(response);
          return;
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to delete media');
        }
      }

      setFavorites((current) => current.filter((photo) => photo.id !== id));
      setSelectedPhoto(null);
      setMessage('Media deleted successfully');
      window.setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to delete media:', error);
      setMessage('Could not delete media');
      window.setTimeout(() => setMessage(''), 2000);
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f8] px-4">
        <p className="text-sm font-medium text-[#6B7387]">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-[#2C1E26]">Favorites</h1>
        </div>

        {message ? (
          <div className="mt-2 rounded-2xl border border-[#E5CCD4] bg-white px-4 py-3 text-sm font-medium text-[#2C1E26] shadow-sm">
            {message}
          </div>
        ) : null}

        <section className="mt-6">
          {favorites.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((photo) => (
                <motion.article
                  key={photo.id}
                  initial={{ y: 0 }}
                  whileHover={{ y: -6 }}
                  className="group overflow-hidden rounded-3xl border border-[#E5CCD4] bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative block aspect-4/5 w-full overflow-hidden bg-[#FEF0F1] text-left"
                    aria-label="Open favorite item"
                  >
                    {photo.mediaKind?.includes('video') ? (
                      <video
                        src={photo.url}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={photo.url} alt="Favorite item" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="absolute right-4 top-4 z-20 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(photo.id);
                        }}
                        disabled={removingId === photo.id}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#D23284] shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Remove from favorites"
                      >
                        <Heart size={16} fill="#D23284" />
                      </button>
                    </div>

                  </button>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#E5CCD4] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF0F1] text-[#D23284]">
                <ImageIcon size={28} />
              </div>
              <h2 className="mt-6 text-2xl font-serif text-[#2C1E26]">No favorites yet</h2>
              <p className="mt-3 text-sm leading-7 text-[#6B7387]">
                Open one of your assigned albums and click an image to save it as a favorite.
              </p>
              <Link
                href="/user-panel/albums"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D23284] px-5 py-3 text-sm font-semibold text-white"
              >
                Browse Albums <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {selectedPhoto ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 10, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-[#140d10] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>

              <div className="grid gap-0 lg:grid-cols-[1.5fr_0.9fr]">
                <div className="flex items-center justify-center bg-black">
                  {selectedPhoto.mediaKind?.includes('video') ? (
                    <motion.video
                      key={selectedPhoto.id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={selectedPhoto.url}
                      controls
                      className="max-h-[82vh] w-full object-contain"
                    />
                  ) : (
                    <motion.img
                      key={selectedPhoto.id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={selectedPhoto.url}
                      alt="Favorite image"
                      className="max-h-[82vh] w-full object-contain"
                    />
                  )}
                </div>
                <div className="hidden lg:flex flex-col bg-black p-6 text-white gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{selectedPhoto.fileName || 'Untitled'}</h3>
                    <p className="text-sm text-gray-400">{selectedPhoto.albumName}</p>
                    {selectedPhoto.mediaKind && (
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedPhoto.mediaKind.includes('video') ? '🎬 Video' : '🖼️ Photo'}
                      </p>
                    )}
                  </div>
                  <div className="flex-1" />
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        removeFavorite(selectedPhoto.id);
                      }}
                      disabled={removingId === selectedPhoto.id}
                      className="w-full rounded-lg bg-[#D23284]/80 hover:bg-[#D23284] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Heart size={16} fill="white" /> Remove Favorite
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteMedia(selectedPhoto.id);
                      }}
                      disabled={removingId === selectedPhoto.id}
                      className="w-full rounded-lg bg-red-600/80 hover:bg-red-700 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Delete Permanently
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      className="w-full rounded-lg bg-gray-700/50 hover:bg-gray-600/50 px-4 py-3 text-sm font-semibold text-white transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile action bar at bottom */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    removeFavorite(selectedPhoto.id);
                  }}
                  disabled={removingId === selectedPhoto.id}
                  className="rounded-lg bg-[#D23284]/80 hover:bg-[#D23284] px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                >
                  ♥ Remove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteMedia(selectedPhoto.id);
                  }}
                  disabled={removingId === selectedPhoto.id}
                  className="rounded-lg bg-red-600/80 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                >
                  🗑️ Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
