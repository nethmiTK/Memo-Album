'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, Image as ImageIcon, Upload } from 'lucide-react';
import { apiFetch, handleAuthError } from '@/lib/api';
import { useProtectedRoute } from '@/lib/useAuth';

const albumCacheKey = 'memoalbum:user-panel:assigned-albums';
const favoritesCacheKey = 'memoalbum:user-panel:favorites';

interface AssignedAlbumItem {
  id: string;
  kind: 'album' | 'curate';
  name: string;
  coverImage?: string;
  coverPhotoName?: string;
  photoCount: number;
  date?: string;
  description?: string;
  mediaItems?: Array<{
    id: string;
    order: number;
    fileName?: string;
    fileType?: string;
    dataUrl?: string;
    mediaKind?: string;
  }>;
}

interface GalleryImage {
  url: string;
  fileName: string;
  mediaKind: string;
}

export default function UserPanelAlbumDetailPage() {
  const params = useParams<{ albumId: string }>();
  const router = useRouter();
  const { loading: authLoading } = useProtectedRoute(['client', 'couple']);
  const [albums, setAlbums] = useState<AssignedAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [savingUrl, setSavingUrl] = useState<string | null>(null);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const albumId = params?.albumId?.toString?.() || '';

  useEffect(() => {
    if (authLoading) return;

    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem(albumCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { items?: AssignedAlbumItem[] };
          if (Array.isArray(parsed.items)) {
            setAlbums(parsed.items);
          }
        }
      } catch {
        // Ignore stale cache.
      }
    }

    const loadAlbums = async () => {
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

        setAlbums(result.albums);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(albumCacheKey, JSON.stringify({ items: result.albums, timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Failed to load album detail:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlbums();
  }, [authLoading]);

  const selectedAlbum = useMemo(
    () => albums.find((item) => item.id === albumId) || null,
    [albums, albumId]
  );

  const images = useMemo<GalleryImage[]>(() => {
    if (!selectedAlbum) return [];

    const mediaUrls = (selectedAlbum.mediaItems || [])
      .map((item) => ({
        id: item.id,
        url: item.dataUrl || '',
        fileName: item.fileName || selectedAlbum.name,
        mediaKind: item.mediaKind || 'image',
      }))
      .filter((item) => Boolean(item.url));

    if (mediaUrls.length > 0) return mediaUrls;
    if (selectedAlbum.coverImage) return [{ url: selectedAlbum.coverImage, fileName: selectedAlbum.name, mediaKind: 'image' }];
    return [];
  }, [selectedAlbum]);

  useEffect(() => {
    if (!selectedAlbum) {
      setSavedUrls([]);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem(favoritesCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { items?: Array<{ albumId?: string; url?: string }> };
          if (Array.isArray(parsed.items)) {
            setSavedUrls(
              parsed.items
                .filter((item) => item.albumId?.toString() === selectedAlbum.id)
                .map((item) => item.url || '')
                .filter(Boolean)
            );
          }
        }
      } catch {
        // Ignore cache parse failures.
      }
    }

    const loadFavorites = async () => {
      try {
        const response = await apiFetch('/favorites');
        if (response.status === 401) {
          handleAuthError(response);
          return;
        }

        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.favorites)) {
          setSavedUrls([]);
          return;
        }

        setSavedUrls(
          result.favorites
            .filter((favorite: { albumId?: string }) => favorite.albumId?.toString() === selectedAlbum.id)
            .map((favorite: { url: string }) => favorite.url)
        );

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(favoritesCacheKey, JSON.stringify({ items: result.favorites, timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setSavedUrls([]);
      }
    };

    loadFavorites();
  }, [selectedAlbum]);

  const saveFavorite = async (image: GalleryImage) => {
    if (!selectedAlbum || !image.url) return;

    try {
      setSavingUrl(image.url);
      const response = await apiFetch('/favorites', {
        method: 'POST',
        body: JSON.stringify({
          albumId: selectedAlbum.id,
          mediaId: (image as any).id || undefined,
          url: image.url,
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to save favorite');
      }

      setSavedUrls((current) => (current.includes(image.url) ? current : [...current, image.url]));
      if (typeof window !== 'undefined') {
        try {
          const cached = window.localStorage.getItem(favoritesCacheKey);
          const parsed = cached ? JSON.parse(cached) : { items: [] };
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          const nextItems = items.some((item: { albumId?: string; url?: string }) => item.albumId?.toString() === selectedAlbum.id && item.url === image.url)
            ? items
            : [
                ...items,
                {
                  id: result.favorite?.id || `${selectedAlbum.id}-${image.url}`,
                  albumId: selectedAlbum.id,
                  url: image.url,
                },
              ];
          window.localStorage.setItem(favoritesCacheKey, JSON.stringify({ items: nextItems, timestamp: Date.now() }));
        } catch {
          // Ignore cache write failures.
        }
      }
      setStatusMessage('Saved to favorites');
      window.setTimeout(() => setStatusMessage(''), 2000);
    } catch (error) {
      console.error('Failed to save favorite:', error);
      setStatusMessage('Could not save that image');
      window.setTimeout(() => setStatusMessage(''), 2000);
    } finally {
      setSavingUrl(null);
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum || !event.target.files?.length) return;

    const files = Array.from(event.target.files);
    event.target.value = '';

    try {
      setUploading(true);

      const addedItems: Array<{ id: string; dataUrl: string; fileName?: string; mediaKind?: string }>= [];

      for (const file of files) {
        const url = await fileToDataUrl(file);
        if (!url) continue;

        const payload = {
          url,
          fileName: file.name,
          fileType: file.type,
          mediaKind: file.type.startsWith('video') ? 'video' : 'image',
        };

        const response = await apiFetch(`/client-invites/${selectedAlbum.id}/media`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          handleAuthError(response);
          return;
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to upload media');
        }

        // server returns `added` array and updated `curate`
        const added = Array.isArray(result.added) ? result.added : [];
        for (const a of added) {
          addedItems.push({ id: a.id, dataUrl: a.dataUrl || a.url || '', fileName: a.fileName, mediaKind: a.mediaKind });
        }
      }

      // update local state for albums cache and display
      if (addedItems.length > 0) {
        setAlbums((current) => {
          const next = current.map((al) => {
            if (al.id !== selectedAlbum.id) return al;
            const nextMedia = Array.isArray(al.mediaItems) ? [...al.mediaItems] : [];
            let nextOrder = nextMedia.length + 1;
            for (const it of addedItems) {
              nextMedia.push({ id: it.id, order: nextOrder++, fileName: it.fileName || '', fileType: '', dataUrl: it.dataUrl, mediaKind: it.mediaKind || 'image' });
            }
            return { ...al, mediaItems: nextMedia, photoCount: nextMedia.length };
          });

          try {
            if (typeof window !== 'undefined') window.localStorage.setItem(albumCacheKey, JSON.stringify({ items: next, timestamp: Date.now() }));
          } catch {}

          return next;
        });

        setStatusMessage('Media uploaded to album');
        window.setTimeout(() => setStatusMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
      setStatusMessage('Upload failed');
      window.setTimeout(() => setStatusMessage(''), 2000);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (event.key === 'Escape') {
        setLightboxIndex(null);
      } else if (event.key === 'ArrowLeft') {
        setLightboxIndex((current) => (current === null || images.length === 0 ? null : (current - 1 + images.length) % images.length));
      } else if (event.key === 'ArrowRight') {
        setLightboxIndex((current) => (current === null || images.length === 0 ? null : (current + 1) % images.length));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, lightboxIndex]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f8]">
        <p className="text-[#6B7387]">Loading...</p>
      </div>
    );
  }

  if (!selectedAlbum) {
    return (
      <div className="min-h-screen bg-[#fff8f8] px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#E5CCD4] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D23284]">Album not found</p>
          <h1 className="mt-4 text-3xl font-serif text-[#2C1E26]">This album is not assigned to your account.</h1>
          <Link href="/user-panel/albums" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D23284] px-5 py-3 text-sm font-semibold text-white">
            <ArrowLeft size={16} /> Back to Albums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/user-panel/albums')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#D23284]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <Link href="/user-panel/profile" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7387]">
            Profile
          </Link>
        </div>

        <input ref={uploadRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUploadFiles} />

        <section className="overflow-hidden rounded-4xl border border-[#E5CCD4] bg-white shadow-[0_24px_60px_rgba(44,30,38,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-80 bg-[#FEF0F1] p-6 md:p-10">
              {selectedAlbum.coverImage ? (
                <img src={selectedAlbum.coverImage} alt={selectedAlbum.name} className="h-full w-full rounded-3xl object-cover" />
              ) : (
                <div className="flex h-full min-h-70 items-center justify-center rounded-3xl bg-[#FEF0F1] text-[#D23284]">
                  <ImageIcon size={64} />
                </div>
              )}
              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-black/35 p-4 text-white backdrop-blur-md md:inset-x-10">
                <h1 className="text-2xl font-serif md:text-4xl">{selectedAlbum.name}</h1>
                <p className="mt-2 text-sm text-white/80">
                  {selectedAlbum.date ? new Date(selectedAlbum.date).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 md:p-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D23284]">
                  {selectedAlbum.kind === 'curate' ? 'Curated Story' : 'Album Access'}
                </p>
                <h2 className="mt-3 font-serif text-3xl text-[#2C1E26] md:text-5xl">
                  Open your album in fullscreen
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#6B7387]">
                  Click any image below to view it in a fullscreen lightbox. This page loads the album assigned to your email invite.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => uploadRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-full bg-[#D23284] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Upload Media'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem(`userpanel:album:${selectedAlbum.id}:media`, JSON.stringify(images));
                        }
                      } catch {}
                      window.open(`/user-panel/albums/${selectedAlbum.id}/book?source=session`, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E5CCD4] bg-white px-5 py-3 text-sm font-semibold text-[#2C1E26] transition hover:border-[#D23284] hover:text-[#D23284]"
                  >
                    Open Fullscreen
                  </button>
                  {statusMessage ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#E5CCD4] bg-[#FEF0F1] px-4 py-3 text-sm font-medium text-[#2C1E26]">
                      <Check size={16} className="text-[#D23284]" />
                      {statusMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E5CCD4] bg-[#FEF0F1] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B9095]">Photos</p>
                  <p className="mt-2 text-3xl font-serif text-[#2C1E26]">{selectedAlbum.photoCount}</p>
                </div>
                <div className="rounded-2xl border border-[#E5CCD4] bg-[#FEF0F1] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B9095]">Date</p>
                  <p className="mt-2 text-base font-semibold text-[#2C1E26]">
                    {selectedAlbum.date ? new Date(selectedAlbum.date).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-4xl border border-[#E5CCD4] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-serif text-[#2C1E26]">Album Gallery</h3>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D23284]">Fullscreen ready</p>
          </div>

          {images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {images.map((image, index) => (
                  <div
                    key={`${selectedAlbum.id}-${index}`}
                    className="group relative overflow-hidden rounded-2xl border border-[#E5CCD4] bg-[#FEF0F1] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // toggle favorite on single click
                        saveFavorite(image);
                      }}
                      aria-label="Toggle favorite"
                      className="absolute inset-0 z-10 flex items-center justify-center bg-transparent"
                    >
                      {/* invisible button overlay to capture clicks for favorite */}
                    </button>

                    {image.mediaKind === 'video' ? (
                      <video src={image.url} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" muted playsInline />
                    ) : (
                      <img src={image.url} alt={`${selectedAlbum.name} ${index + 1}`} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}

                    <div className="absolute top-3 right-3 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(index);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#2C1E26] shadow-md"
                        aria-label="Open"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="absolute top-3 left-3 z-20 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveFavorite(image);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#D23284] shadow-md"
                        aria-label="Favorite"
                      >
                        <Heart size={16} fill={savedUrls.includes(image.url) ? '#D23284' : 'none'} />
                      </button>
                    </div>

                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
                  </div>
                ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E5CCD4] bg-[#FEF0F1] p-10 text-center text-[#6B7387]">
              No media was attached to this invite yet.
            </div>
          )}
        </section>
      </div>

      {lightboxIndex !== null && images[lightboxIndex] ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-8" onClick={() => setLightboxIndex(null)}>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md"
          >
            Close
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              saveFavorite(images[lightboxIndex]);
            }}
            disabled={savingUrl === images[lightboxIndex].url}
            className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md disabled:opacity-60"
          >
            <Heart size={16} fill={savedUrls.includes(images[lightboxIndex].url) ? '#ffffff' : 'none'} />
            {savedUrls.includes(images[lightboxIndex].url) ? 'Saved' : 'Favorite'}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((current) => (current === null ? null : (current - 1 + images.length) % images.length));
            }}
            className="absolute left-4 md:left-8 rounded-full bg-white/10 p-3 text-white backdrop-blur-md"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="max-h-[90vh] max-w-[92vw]" onClick={(event) => event.stopPropagation()}>
            {images[lightboxIndex].mediaKind === 'video' ? (
              <video src={images[lightboxIndex].url} className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" controls autoPlay playsInline />
            ) : (
              <img src={images[lightboxIndex].url} alt="Fullscreen album" className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
            )}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((current) => (current === null ? null : (current + 1) % images.length));
            }}
            className="absolute right-4 md:right-8 rounded-full bg-white/10 p-3 text-white backdrop-blur-md"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
