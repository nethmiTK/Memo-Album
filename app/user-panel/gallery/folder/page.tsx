'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
 
const QRCode = dynamic<any>(() =>
  import('qrcode.react').then((mod) => {
    const Comp = (mod as any)?.QRCodeSVG || (mod as any)?.QRCodeCanvas || (mod as any)?.QRCode || (mod as any)?.default || mod;
    return Comp;
  }),
  { ssr: false }
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function FolderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folderId = searchParams.get('folderId') || '';

  const [folder, setFolder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ previewUrl: string; type: 'photo' | 'video'; name: string }[]>([]);
  const [previewImage, setPreviewImage] = useState<any | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingMeta, setPendingMeta] = useState<Record<number, { title?: string }>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    // prevent background scroll when modal open
    if (typeof document !== 'undefined') {
      if (showUploadModal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    };
  }, [showUploadModal]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, [filePreviews]);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const loadFolder = async () => {
      if (!folderId) {
        setError('Folder not selected.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let response;
        let data;

        if (folderId === 'all-photos') {
          response = await fetch(`${API_BASE}/api/gallery/media`, {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to load media.');
          }
          data = await response.json();
          const images = (data?.data || []).map((image: any) => ({
            id: String(image.id),
            title: image.title || 'Untitled',
            url: image.url,
            mediaType: image.mediaType === 'video' ? 'video' : 'photo',
            uploadedAt: image.uploadedAt ? new Date(image.uploadedAt).toISOString().split('T')[0] : '',
            isFavorite: image.isFavorite ?? false,
          }));

          setFolder({
            id: 'all-photos',
            name: 'All Photos',
            category: 'All Media',
            images,
            createdAt: '',
          });
          return;
        }

        if (folderId === 'guest-folder') {
          response = await fetch(`${API_BASE}/api/gallery/folders`, {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to load guest media.');
          }
          data = await response.json();
          const guestFolder = (data?.data || []).find((item: any) =>
            /guest|interactive/i.test(String(item.name)) || /guest|interactive/i.test(String(item.category))
          );
          const images = (guestFolder?.images || []).map((image: any) => ({
            id: String(image.id),
            title: image.title || 'Untitled',
            url: image.url,
            mediaType: image.mediaType === 'video' ? 'video' : 'photo',
            uploadedAt: image.uploadedAt ? new Date(image.uploadedAt).toISOString().split('T')[0] : '',
            isFavorite: image.isFavorite ?? false,
          }));

          setFolder({
            id: 'guest-folder',
            name: 'Guest Contributions',
            category: 'Guest Uploads',
            images,
            createdAt: '',
          });
          return;
        }

        if (folderId === 'album') {
          response = await fetch(`${API_BASE}/api/gallery/folders`, {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to load album section.');
          }
          data = await response.json();
          const albumFolders = (data?.data || []).filter((item: any) =>
            String(item.name).toLowerCase().includes('album') || String(item.category).toLowerCase().includes('album')
          );
          const images = albumFolders.flatMap((folder: any) =>
            (folder.images || []).map((image: any) => ({
              id: String(image.id),
              title: image.title || 'Untitled',
              url: image.url,
              mediaType: image.mediaType === 'video' ? 'video' : 'photo',
              uploadedAt: image.uploadedAt ? new Date(image.uploadedAt).toISOString().split('T')[0] : '',
              isFavorite: image.isFavorite ?? false,
            }))
          );

          setFolder({
            id: 'album',
            name: 'Album',
            category: 'Album',
            images,
            createdAt: '',
          });
          return;
        }

        response = await fetch(`${API_BASE}/api/gallery/folders`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Failed to load folder.');
        }

        data = await response.json();
        const foundFolder = (data?.data || []).find((item: any) => String(item.id) === folderId);
        if (!foundFolder) {
          throw new Error('Folder not found.');
        }

        setFolder({
          id: String(foundFolder.id),
          name: foundFolder.name,
          category: foundFolder.category || 'Custom',
          images: (foundFolder.images || []).map((image: any) => ({
            id: String(image.id),
            title: image.title || 'Untitled',
            url: image.url,
            mediaType: image.mediaType === 'video' ? 'video' : 'photo',
            uploadedAt: image.uploadedAt ? new Date(image.uploadedAt).toISOString().split('T')[0] : '',
            isFavorite: image.isFavorite ?? false,
          })),
          createdAt: foundFolder.createdAt || '',
        });
      } catch (fetchError) {
        console.warn('Folder load failed:', fetchError);
        setError((fetchError as Error).message || 'Could not load folder.');
      } finally {
        setLoading(false);
      }
    };

    loadFolder();
  }, [folderId]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    setFilePreviews((prev) => [
      ...prev,
      ...files.map((file) => ({
        previewUrl: URL.createObjectURL(file),
        type: (file.type.startsWith('video') ? 'video' : 'photo') as 'photo' | 'video',
        name: file.name,
      })),
    ]);
  };

  const removePreview = (index: number) => {
    setSelectedFiles((current) => {
      const next = current.filter((_, i) => i !== index);
      return next;
    });
    setFilePreviews((current) => {
      const next = current.filter((_, i) => i !== index);
      return next;
    });
    setPendingMeta((current) => {
      const newMeta: Record<number, { title?: string }> = {};
      let ni = 0;
      for (let i = 0; i < Object.keys(current).length + 10; i++) {
        if (current[i]) {
          if (i === index) continue;
          newMeta[ni] = current[i];
          ni++;
        }
      }
      // fallback: also handle when keys are sparse by rebuilding from arrays
      if (Object.keys(newMeta).length === 0) {
        const entries = Object.entries(current).map(([k, v]) => ({ k: Number(k), v }));
        entries.sort((a, b) => a.k - b.k);
        let m: Record<number, { title?: string }> = {};
        let j = 0;
        for (const e of entries) {
          if (e.k === index) continue;
          m[j++] = e.v;
        }
        return m;
      }
      return newMeta;
    });
    setEditingIndex((cur) => {
      if (cur === null) return null;
      if (cur === index) return null;
      if (cur > index) return cur - 1;
      return cur;
    });
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/gallery/media/${mediaId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null as any);
        throw new Error(err?.message || 'Failed to delete media.');
      }
      setFolder((prev: any) => {
        if (!prev) return prev;
        return { ...prev, images: prev.images.filter((image: any) => image.id !== mediaId) };
      });
    } catch (deleteError) {
      console.warn('Delete media failed:', deleteError);
    }
  };

  const uploadMedia = async () => {
    if (!folder || selectedFiles.length === 0) {
      return false;
    }

    setUploading(true);
    try {
      const items = await Promise.all(
        selectedFiles.map(async (file, idx) => ({
          folderId: folder.id,
          title: pendingMeta[idx]?.title || file.name,
          mediaType: file.type.startsWith('video') ? 'video' : 'photo',
          dataUrl: await fileToDataUrl(file),
          fileType: file.type,
          fileName: file.name,
        }))
      );

      const response = await fetch(`${API_BASE}/api/gallery/media`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Upload failed.');
      }

      const uploaded = Array.isArray(result.data) ? result.data : [result.data];
      setFolder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: [
            ...uploaded.map((item: any) => ({
              id: String(item.id),
              title: item.title || item.fileName || 'Untitled',
              url: item.url,
              mediaType: item.mediaType === 'video' ? 'video' : 'photo',
              uploadedAt: item.uploadedAt ? new Date(item.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              isFavorite: item.isFavorite ?? false,
            })),
            ...prev.images,
          ],
        };
      });

      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (uploadError) {
      console.warn('Folder upload failed:', uploadError);
      setError((uploadError as Error).message || 'Upload failed.');
      return false;
    } finally {
      setUploading(false);
    }
    return true;
  };

  const uploadSingle = async (index: number) => {
    if (!folder) {
      alert('Please open a folder before uploading.');
      return;
    }
    const file = selectedFiles[index];
    if (!file) return;
    setUploading(true);
    try {
      const item = {
        folderId: folder.id,
        title: pendingMeta[index]?.title || file.name,
        mediaType: file.type.startsWith('video') ? 'video' : 'photo',
        dataUrl: await fileToDataUrl(file),
        fileType: file.type,
        fileName: file.name,
      };

      const response = await fetch(`${API_BASE}/api/gallery/media`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: [item] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'Upload failed.');

      const uploaded = Array.isArray(result.data) ? result.data : [result.data];
      setFolder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: [
            ...uploaded.map((it: any) => ({
              id: String(it.id),
              title: it.title || it.fileName || 'Untitled',
              url: it.url,
              mediaType: it.mediaType === 'video' ? 'video' : 'photo',
              uploadedAt: it.uploadedAt ? new Date(it.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              isFavorite: it.isFavorite ?? false,
            })),
            ...(prev.images || []),
          ],
        };
      });

      // remove uploaded file from pending lists
      setSelectedFiles((cur) => cur.filter((_, i) => i !== index));
      setFilePreviews((cur) => cur.filter((_, i) => i !== index));
      setPendingMeta((cur) => {
        const copy = { ...cur };
        delete copy[index];
        return copy;
      });
      if (editingIndex === index) setEditingIndex(null);
    } catch (err) {
      console.warn('Upload single failed', err);
      alert((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // previewImage state already exists; render full-screen viewer when set

  const toggleFavorite = async (mediaId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/gallery/media/${mediaId}/favorite`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      const result = await response.json().catch(() => null as any);
      if (!response.ok) {
        throw new Error(result?.message || 'Failed to update favorite.');
      }
      const serverState = result?.data?.isFavorite;
      setFolder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: prev.images.map((image: any) =>
            image.id === mediaId ? { ...image, isFavorite: typeof serverState === 'boolean' ? serverState : !image.isFavorite } : image
          ),
        };
      });
    } catch (err) {
      console.warn('Favorite toggle failed:', err);
    }
  };

  const createNewFolder = async () => {
    // kept as a noop to avoid breaking references; folder creation modal removed
    return;
  };

  const openPreview = (item: any, idx: number) => {
    setPreviewImage(item);
    setPreviewIndex(idx);
    setZoomed(false);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewIndex(null);
    setZoomed(false);
  };

  const showPrev = () => {
    if (previewIndex === null || !folder) return;
    const len = (folder.images || []).length;
    if (len === 0) return;
    const nextIndex = ((previewIndex - 1) + len) % len;
    const nextItem = folder.images[nextIndex];
    setPreviewIndex(nextIndex);
    setPreviewImage(nextItem);
    setZoomed(false);
  };

  const showNext = () => {
    if (previewIndex === null || !folder) return;
    const len = (folder.images || []).length;
    if (len === 0) return;
    const nextIndex = (previewIndex + 1) % len;
    const nextItem = folder.images[nextIndex];
    setPreviewIndex(nextIndex);
    setPreviewImage(nextItem);
    setZoomed(false);
  };

  const toggleZoom = () => setZoomed((z) => !z);

  return (
    <div className="min-h-screen bg-[#FFE8EE] text-[#211a1b]">
      <div className="max-w-400 mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden xl:flex w-72 flex-col rounded-3xl border border-[#e7d5db] bg-white p-6 shadow-sm">
            <div className="mb-8">
              <h1 className="text-xl font-semibold text-[#7f1940]">Gallery</h1>
              <p className="text-sm uppercase text-[#8b6a75] tracking-[0.18em] mt-1">Media Manager</p>
            </div>
            <nav className="flex-1 space-y-3 text-sm text-[#5c4a53]">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f7e6ea] px-4 py-3 text-[#7f1940] font-semibold">
                <span className="material-symbols-outlined">photo_library</span>
                Gallery
              </div>
            </nav>
            <button
              onClick={() => router.push('/user-panel/albums')}
              className="mt-6 rounded-full border border-[#FFE8EE] bg-[#FFE8EE] px-4 py-3 text-sm font-semibold text-[#C82B7D] hover:bg-[#C82B7D] hover:text-white active:bg-[#C82B7D] active:text-white transition-colors"
            >
              Wedding Album
            </button>
            <button
              onClick={() => router.push('/user-panel/gallery')}
              className="mt-3 rounded-full border border-[#d8c1cb] bg-[#f8f2f5] px-4 py-3 text-[#5f3d4a] font-semibold hover:bg-[#f1e5ea]"
            >
              Back to Gallery
            </button>
          </aside>

          <main className="flex-1 space-y-8">
            <header className="flex flex-col gap-6 rounded-none px-0 py-0">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.push('/user-panel/gallery')}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d8c1cb] bg-white px-3 py-2 text-sm font-medium text-[#5f3d4a] hover:bg-[#f6edee] transition-colors"
                    >
                      ← Back
                    </button>
                    <div className="uppercase text-xs tracking-[0.4em] text-[#9f7a88] font-light">Library / Collections</div>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-light tracking-tight text-[#211a1b]">{folder?.name || 'Gallery Folder'}</h1>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-[#e7d5db]">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-[#d8c1cb] bg-white px-5 py-2 text-xs font-medium text-[#5f3d4a] hover:bg-[#f6edee] transition-colors">
                      🔒 Private
                    </button>
                    <button className="rounded-full border border-[#d8c1cb] bg-white px-5 py-2 text-xs font-medium text-[#5f3d4a] hover:bg-[#f6edee] transition-colors">
                      🌐 Public
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => window.alert('Share link copied')}
                      className="rounded-full border border-[#d8c1cb] bg-white px-5 py-2 text-xs font-medium text-[#5f3d4a] hover:bg-[#f6edee] transition-colors flex items-center gap-2"
                    >
                      🔗 Share Link
                    </button>
                    <button className="rounded-full border border-[#d8c1cb] bg-white px-5 py-2 text-xs font-medium text-[#5f3d4a] hover:bg-[#f6edee] transition-colors flex items-center gap-2">
                      📱 QR Code
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="rounded-full bg-[#C82B7D] px-6 py-2 text-xs font-semibold text-white hover:bg-[#a02063] transition-colors flex items-center gap-2 ml-2"
                    >
                      <span>✨</span> New Assets
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <section className="py-8">
              <div className="flex flex-col gap-6 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#9f7a88] font-light">{folder?.category || 'Custom'} collection</p>
                  <p className="text-3xl font-light text-[#211a1b] mt-3">{folder?.images?.length ?? 0} <span className="text-lg text-[#9f7a88]">assets</span></p>
                </div>
              </div>

              {loading ? (
                <div className="py-32 text-center text-[#7f1940] text-lg">Loading folder...</div>
              ) : error ? (
                <div className="py-32 text-center text-red-600 text-lg">{error}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {folder?.images?.map((image: any, imgIdx: number) => (
                      <div
                        key={image.id ? String(image.id) : `image-${imgIdx + 1}`}
                        onClick={() => openPreview(image, imgIdx)}
                      role="button"
                      tabIndex={0}
                      className="group relative overflow-hidden rounded-2xl bg-[#f3e6eb] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C82B7D]"
                    >
                      <div className="relative overflow-hidden bg-[#faf5f7]">
                        {image.mediaType === 'photo' ? (
                          image.url ? (
                            <img 
                              src={image.url} 
                              alt={image.title} 
                              onError={(e) => {
                                const t = e.currentTarget as HTMLImageElement;
                                t.onerror = null;
                                t.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23e2e8f0" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239f7a88" font-size="20">No preview</text></svg>';
                              }}
                              className="w-full aspect-3/4 object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full aspect-3/4 flex items-center justify-center bg-[#e9e5e7] text-[#9f7a88]">
                              <svg className="w-12 h-12 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#e2e8f0"/><path d="M8 12l2 2 4-4" stroke="#9f7a88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span className="text-sm">No preview</span>
                            </div>
                          )
                        ) : (
                          <div className="w-full aspect-3/4 flex items-center justify-center text-[#7f1940] bg-linear-to-br from-[#FFE8EE] to-[#f3e6eb']">
                            <span className="text-4xl">🎬</span>
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Center favorite on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(image.id); }}
                            type="button"
                            className={`pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors ${image.isFavorite ? 'bg-[#C82B7D] text-white' : 'bg-white text-[#C82B7D]'}`}
                            aria-label="Toggle favorite"
                          >
                            ♥
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 justify-between items-end bg-linear-to-t from-black/60 to-transparent pt-6">
                        <div className="flex-1">
                          <p className="text-white text-xs font-medium truncate">{image.title}</p>
                          <p className="text-white/70 text-xs">{image.uploadedAt}</p>
                        </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteMedia(image.id);
                              }}
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white transition-all"
                              aria-label="Remove media"
                            >
                              ✕
                            </button>
                          </div>
                      </div>
                    </div>
                  ))}

                  {folderId !== 'all-photos' && (
                    <label className="flex aspect-3/4 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[#d8c1cb] bg-white px-6 py-8 text-center text-[#7f1940] cursor-pointer hover:border-[#C82B7D] hover:bg-[#fff1f4] transition-all group">
                      <div className="text-5xl group-hover:scale-110 transition-transform">+</div>
                      <div>
                        <p className="font-semibold text-lg">Add More</p>
                        <p className="text-xs text-[#8b6a75] mt-1">Upload new photos or videos</p>
                      </div>
                        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelection} />
                    </label>
                  )}
                </div>
              )}
            </section>

            {folderId === 'guest-folder' && (
              <section className="py-12">
                <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                  <div className="flex flex-col justify-center">
                    <p className="text-xs uppercase tracking-[0.4em] text-[#9f7a88] font-light">Interactive Experience</p>
                    <h3 className="mt-4 text-4xl font-light text-[#211a1b]">Guest Contributions</h3>
                    <p className="mt-4 text-sm leading-7 text-[#7f5a67] max-w-md">
                      Invite guests to share their moments from the celebration. Scan the QR code to open the live guest archive on mobile and collect beautiful memories from your loved ones.
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 border border-[#e7d5db]">
                    {shareUrl ? (
                      <div className="bg-white p-4 rounded-xl">
                        <QRCode value={shareUrl} size={180} level="M" />
                      </div>
                    ) : (
                      <div className="h-56 w-56 rounded-2xl bg-linear-to-br from-[#FFE8EE] to-[#f3e6eb] flex items-center justify-center text-[#C82B7D] text-4xl">
                        📱
                      </div>
                    )}
                    <p className="mt-6 text-center text-sm text-[#7f5a67] font-medium">Scan to share & collect</p>
                  </div>
                </div>
              </section>
            )}

            {filePreviews.length > 0 && (
              <section className="py-12">
                <div className="bg-white rounded-2xl p-8 border border-[#e7d5db]">
                  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-light text-[#211a1b]">Ready to Upload</h3>
                      <p className="text-sm text-[#7f5a67] mt-2">Preview your selected images before adding them to the collection.</p>
                    </div>
                    <button
                      onClick={async () => { const ok = await uploadMedia(); if (ok) { setShowSaveConfirmation(true); } else { alert('Save failed'); } }}
                      disabled={uploading}
                      className="rounded-full bg-[#C82B7D] px-8 py-3 text-sm font-semibold text-white hover:bg-[#a02063] disabled:cursor-not-allowed disabled:opacity-60 transition-all whitespace-nowrap"
                    >
                      {uploading ? '⏳ Uploading...' : '✨ Save Files'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {filePreviews.map((preview, index) => (
                      <div key={`preview-${index}`} className="group relative overflow-hidden rounded-2xl bg-[#f3e6eb]">
                        {preview.type === 'video' ? (
                          <video src={preview.previewUrl} controls className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <img src={preview.previewUrl} alt="preview" className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                        <button
                          onClick={() => removePreview(index)}
                          type="button"
                          className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#C82B7D] shadow-md hover:bg-white transition-all text-lg"
                          aria-label="Remove preview"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-3xl mx-4 rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-[#211a1b]">Add New Assets</h2>
              <div className="flex items-center gap-3">
                {selectedFiles.length > 0 && (
                  <button
                    onClick={async () => { const ok = await uploadMedia(); if (ok) { setShowSaveConfirmation(true); } else { alert('Save failed'); } }}
                    disabled={uploading}
                    className="rounded-full bg-[#C82B7D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02063] disabled:opacity-60"
                  >
                    {uploading ? '⏳ Saving...' : 'Save'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                    setFilePreviews([]);
                    setShowSaveConfirmation(false);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f3e6eb] transition-colors text-[#7f1940] text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files || [] as File[]);
                if (files.length) {
                  setSelectedFiles((prev) => [...prev, ...files]);
                  setFilePreviews((prev) => [
                    ...prev,
                    ...files.map((file) => ({
                      previewUrl: URL.createObjectURL(file),
                      type: (file.type.startsWith('video') ? 'video' : 'photo') as 'photo' | 'video',
                      name: file.name,
                    })),
                  ]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-[#C82B7D] rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center bg-[#FFF8F7]"
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-[#fff1f4] flex items-center justify-center text-4xl text-[#C82B7D] cursor-pointer"
              >⬆️</div>
              <h3 className="text-2xl font-medium text-[#211a1b]">Drag your memories here</h3>
              <p className="text-sm text-[#7f5a67]">or <label className="text-[#C82B7D] underline cursor-pointer">browse files
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelection} />
              </label> from your workstation</p>
            </div>

            {filePreviews.length > 0 && (
              <div className="mt-6 bg-white rounded-lg p-4 border border-[#e7d5db] relative">
                {showSaveConfirmation && (
                  <div className="mb-4 flex items-center justify-between rounded-md bg-green-50 border border-green-200 p-3">
                    <div className="text-sm text-green-800">Saved successfully.</div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedFiles([]); setFilePreviews([]); setShowSaveConfirmation(false); }} className="text-sm text-[#7f1940]">Add more</button>
                      <button onClick={() => { setShowUploadModal(false); setShowSaveConfirmation(false); setSelectedFiles([]); setFilePreviews([]); }} className="ml-2 rounded-full bg-[#C82B7D] px-3 py-1 text-sm text-white">Done</button>
                    </div>
                  </div>
                )}
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-[#7f5a67]">{filePreviews.length} file(s) selected</div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedFiles([]); setFilePreviews([]); }} className="text-sm text-[#7f1940]">Clear</button>
                    <button onClick={async () => { const ok = await uploadMedia(); if (ok) { alert('Saved successfully'); setShowUploadModal(false); } else { alert('Save failed'); } }} className="ml-2 rounded-full bg-[#C82B7D] px-4 py-2 text-sm text-white">{uploading ? '⏳ Uploading...' : 'Save'}</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {filePreviews.map((preview, i) => (
                    <div key={`modal-preview-${i}`} className="relative rounded-lg overflow-hidden bg-[#f3e6eb] cursor-pointer" onClick={() => setEditingIndex(i)}>
                      {preview.type === 'video' ? (
                        <video src={preview.previewUrl} className="w-full h-28 object-cover" controls playsInline />
                      ) : (
                        <img src={preview.previewUrl} alt={`preview-${i}`} className="w-full h-28 object-cover" />
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removePreview(i); }} className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#C82B7D]">✕</button>
                      <div className="absolute left-2 bottom-2 bg-white/80 rounded-md px-2 py-1 text-xs text-[#7f1940]">{preview.name}</div>
                    </div>
                  ))}
                </div>

                {/* Editing panel */}
                {typeof editingIndex === 'number' && editingIndex >= 0 && filePreviews[editingIndex] && (
                  <div className="md:absolute md:right-4 md:top-4 md:w-80 w-full bg-[#FFF8F7] border border-[#f0d7db] rounded-lg p-4 shadow-lg flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-medium text-[#211a1b]">Edit selected</div>
                      <button onClick={() => setEditingIndex(null)} className="text-sm text-[#7f1940]">Close</button>
                    </div>
                    <div className="mt-4 flex-1 overflow-auto">
                      <div className="mb-3">
                        <label className="block text-xs text-[#5f3d4a] mb-1">Title</label>
                        <input type="text" value={pendingMeta[editingIndex]?.title || filePreviews[editingIndex].name} onChange={(e) => setPendingMeta((p) => ({ ...p, [editingIndex]: { title: e.target.value } }))} className="w-full rounded-md border border-[#e7d5db] px-3 py-2 bg-white" />
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs text-[#5f3d4a] mb-1">Preview</label>
                        <div className="rounded-md overflow-hidden bg-[#f3e6eb]">
                          {filePreviews[editingIndex].type === 'video' ? (
                            <video src={filePreviews[editingIndex].previewUrl} controls className="w-full h-40 object-cover" />
                          ) : (
                            <img src={filePreviews[editingIndex].previewUrl} alt="selected" className="w-full h-40 object-cover" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sticky bottom-0 left-0 right-0 bg-[#FFF8F7] pt-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setPendingMeta((p) => ({ ...p, [editingIndex]: { title: filePreviews[editingIndex].name } })); }} className="text-sm px-3 py-2 border rounded-md">Reset</button>
                        <button onClick={async () => { await uploadSingle(editingIndex); }} className="ml-auto rounded-full bg-[#C82B7D] px-4 py-2 text-sm text-white">Save to library</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Full-screen media viewer */}
      {previewImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
            <div className="relative max-w-[90vw] max-h-[90vh] w-full">
              <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
                <button onClick={showPrev} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7f1940]" aria-label="Previous">◀</button>
                <button onClick={showNext} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7f1940]" aria-label="Next">▶</button>
              </div>
              <button
                onClick={closePreview}
                className="absolute top-3 right-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7f1940]"
                aria-label="Close preview"
              >
                ✕
              </button>
              {previewImage.url ? (
                <a
                  href={previewImage.url}
                  download
                  className="absolute top-3 right-16 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7f1940]"
                  aria-label="Download media"
                >
                  ⬇️
                </a>
              ) : null}
              <button onClick={toggleZoom} className="absolute top-3 right-28 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7f1940]" aria-label="Toggle zoom">🔍</button>
              <div className="flex items-center justify-center w-full h-full overflow-hidden">
                {previewImage.mediaType === 'video' ? (
                  <video src={previewImage.url} controls className={`max-w-full ${zoomed ? 'scale-125' : 'scale-100'} max-h-[90vh] rounded transition-transform`} />
                ) : (
                  <img src={previewImage.url} alt={previewImage.title} className={`max-w-full ${zoomed ? 'scale-125' : 'scale-100'} max-h-[90vh] rounded transition-transform`} />
                )}
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
