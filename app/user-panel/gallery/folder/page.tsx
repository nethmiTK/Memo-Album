'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface FolderImage {
  id: string;
  title: string;
  url: string;
  mediaType: 'photo' | 'video';
  uploadedAt: string;
  isFavorite: boolean;
}

interface GalleryFolder {
  id: string;
  name: string;
  category: string;
  images: FolderImage[];
  createdAt: string;
}

export default function FolderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folderId = searchParams.get('folderId') || '';

  const [folder, setFolder] = useState<GalleryFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);

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
        const response = await fetch(`${API_BASE}/api/gallery/folders`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Failed to load folder.');
        }

        const data = await response.json();
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
    setSelectedFiles(files);
    setFilePreviews(
      files.map((file) => ({
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      }))
    );
  };

  const uploadMedia = async () => {
    if (!folder || selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    try {
      const items = await Promise.all(
        selectedFiles.map(async (file) => ({
          folderId: folder.id,
          title: file.name,
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
      setFolder((prev) => {
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
    } finally {
      setUploading(false);
    }
  };

  const toggleFavorite = async (mediaId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/gallery/media/${mediaId}/favorite`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to update favorite.');
      }
      const result = await response.json();
      setFolder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          images: prev.images.map((image) =>
            image.id === mediaId ? { ...image, isFavorite: !image.isFavorite } : image
          ),
        };
      });
    } catch (err) {
      console.warn('Favorite toggle failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f0f3] text-[#211a1b]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden xl:flex w-72 flex-col rounded-3xl border border-[#e7d5db] bg-white p-6 shadow-sm">
            <div className="mb-8">
              <h1 className="text-xl font-semibold text-[#7f1940]">Project Alpha</h1>
              <p className="text-sm uppercase text-[#8b6a75] tracking-[0.18em] mt-1">Editorial Album</p>
            </div>
            <nav className="flex-1 space-y-3 text-sm text-[#5c4a53]">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f7e6ea] px-4 py-3 text-[#7f1940] font-semibold">
                <span className="material-symbols-outlined">photo_library</span>
                Assets
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-[#f7e6ea] cursor-pointer">
                <span className="material-symbols-outlined">dashboard</span>
                Layouts
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-[#f7e6ea] cursor-pointer">
                <span className="material-symbols-outlined">title</span>
                Typography
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-[#f7e6ea] cursor-pointer">
                <span className="material-symbols-outlined">settings</span>
                Settings
              </div>
            </nav>
            <button
              onClick={() => router.push('/user-panel/gallery')}
              className="mt-6 rounded-full bg-[#7f1940] px-4 py-3 text-white font-semibold hover:opacity-95"
            >
              Back to Gallery
            </button>
          </aside>

          <main className="flex-1 space-y-8">
            <header className="flex flex-col gap-4 rounded-[32px] bg-white px-8 py-8 shadow-sm border border-[#e7d5db]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="uppercase text-xs tracking-[0.3em] text-[#9f7a88]">Library / Collections</div>
                  <h2 className="text-4xl font-semibold mt-2">{folder?.name || 'Gallery Folder'}</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full border border-[#d8c1cb] bg-[#f6edee] px-4 py-2 text-sm font-semibold text-[#5f3d4a]">
                    Private
                  </button>
                  <button className="rounded-full border border-[#d8c1cb] px-4 py-2 text-sm font-semibold text-[#5f3d4a] hover:bg-[#f6edee]">
                    Public
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full border border-[#d8c1cb] bg-[#f8f2f5] px-4 py-2 text-sm text-[#5f3d4a] hover:bg-[#f1e5ea]">
                  Share Link
                </button>
                <button className="rounded-full border border-[#d8c1cb] bg-[#f8f2f5] px-4 py-2 text-sm text-[#5f3d4a] hover:bg-[#f1e5ea]">
                  QR Code
                </button>
                <button className="rounded-full bg-[#7f1940] px-5 py-2 text-sm font-semibold text-white hover:opacity-95">
                  New Assets
                </button>
              </div>
            </header>

            <section className="rounded-[32px] bg-white p-6 shadow-sm border border-[#e7d5db]">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#9f7a88]">{folder?.category || 'Custom'} collection</p>
                  <p className="text-2xl font-semibold mt-2">{folder?.images?.length ?? 0} assets</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.alert('Share link copied')}
                    className="rounded-full border border-[#d8c1cb] bg-[#f8f2f5] px-5 py-2 text-sm text-[#5f3d4a] hover:bg-[#f1e5ea]"
                  >
                    Copy Share Link
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-[#7f1940]">Loading folder...</div>
              ) : error ? (
                <div className="py-16 text-center text-red-600">{error}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {folder?.images?.map((image) => (
                    <div key={image.id} className="group overflow-hidden rounded-3xl border border-[#e7d5db] bg-[#faf5f7] shadow-sm transition hover:shadow-md">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#f3e6eb]">
                        {image.mediaType === 'photo' ? (
                          <img src={image.url} alt={image.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-[#7f1940]">Video preview</div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#2f1622] truncate">{image.title}</p>
                            <p className="text-xs text-[#7f5a67] mt-1">{image.uploadedAt}</p>
                          </div>
                          <button
                            onClick={() => toggleFavorite(image.id)}
                            className={`rounded-full p-2 transition ${image.isFavorite ? 'bg-[#7f1940] text-white' : 'bg-white text-[#7f1940] border border-[#d8c1cb]'}`}
                            aria-label="Toggle favorite"
                          >
                            <span className="material-symbols-outlined">favorite</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <label className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#d8c1cb] bg-[#fff7f9] px-6 py-8 text-center text-[#7f1940] cursor-pointer hover:border-[#7f1940]">
                    <span className="material-symbols-outlined text-4xl">add</span>
                    <div>
                      <p className="font-semibold">Add More</p>
                      <p className="text-sm text-[#8b6a75]">Upload new photos or videos</p>
                    </div>
                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelection} />
                  </label>
                </div>
              )}
            </section>

            {filePreviews.length > 0 && (
              <section className="rounded-[32px] bg-white p-6 shadow-sm border border-[#e7d5db]">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Selected files</h3>
                    <p className="text-sm text-[#7f5a67]">Choose files to upload to this folder.</p>
                  </div>
                  <button
                    onClick={uploadMedia}
                    disabled={uploading}
                    className="rounded-full bg-[#7f1940] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filePreviews.map((preview) => (
                    <div key={preview.previewUrl} className="rounded-3xl border border-[#e7d5db] bg-[#faf5f7] p-4">
                      <div className="mb-3 h-36 overflow-hidden rounded-2xl bg-[#f3e6eb]">
                        <img src={preview.previewUrl} alt={preview.name} className="h-full w-full object-cover" />
                      </div>
                      <p className="text-sm font-semibold text-[#2f1622] truncate">{preview.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
