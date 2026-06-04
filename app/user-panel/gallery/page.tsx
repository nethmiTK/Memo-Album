'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const QRCode = dynamic<any>(() =>
  import('qrcode.react').then((mod) => {
    const Comp = (mod as any)?.QRCodeSVG || (mod as any)?.QRCodeCanvas || (mod as any)?.QRCode || (mod as any)?.default || mod;
    return Comp;
  }),
  { ssr: false }
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface GalleryFolder {
  id: string;
  name: string;
  category: string;
  imageCount: number;
  coverImages: string[];
}

interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  uploadedAt: string;
  isFavorite: boolean;
}

const INITIAL_GALLERY_FOLDERS: GalleryFolder[] = [
  {
    id: '1',
    name: 'Ceremony Highlights',
    category: 'Ceremony',
    imageCount: 48,
    coverImages: ['/images/ceremony1.jpg', '/images/ceremony2.jpg'],
  },
  {
    id: '2',
    name: 'The Reception',
    category: 'Reception',
    imageCount: 0,
    coverImages: [],
  },
  {
    id: '3',
    name: 'Behind the Scenes',
    category: 'Empty',
    imageCount: 0,
    coverImages: [],
  },
];

const INITIAL_RECENT_MEDIA: MediaItem[] = [
  { id: '1', url: '/images/media1.jpg', type: 'photo', uploadedAt: '2024-01-15', isFavorite: false },
  { id: '2', url: '/images/media2.jpg', type: 'photo', uploadedAt: '2024-01-14', isFavorite: false },
  { id: '3', url: '/images/media3.jpg', type: 'photo', uploadedAt: '2024-01-14', isFavorite: false },
  { id: '4', url: '/images/media4.jpg', type: 'photo', uploadedAt: '2024-01-13', isFavorite: false },
  { id: '5', url: '/images/media5.jpg', type: 'video', uploadedAt: '2024-01-13', isFavorite: false },
  { id: '6', url: '/images/media6.jpg', type: 'photo', uploadedAt: '2024-01-12', isFavorite: false },
];

export default function GalleryPage() {
  const router = useRouter();
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [showGuestQR, setShowGuestQR] = useState(false);
  const [galleryFolders, setGalleryFolders] = useState<GalleryFolder[]>(INITIAL_GALLERY_FOLDERS);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(INITIAL_RECENT_MEDIA);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<GalleryFolder | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; type: 'photo' | 'video'; previewUrl: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getMediaTypeFromFile = (file: File) => (file.type.startsWith('video') ? 'video' : 'photo');

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const openFolderPage = (folder: GalleryFolder) => {
    router.push(`/user-panel/gallery/folder?folderId=${encodeURIComponent(folder.id)}`);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFolder(null);
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadError(null);
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setFilePreviews(
      files.map((file) => ({
        name: file.name,
        type: getMediaTypeFromFile(file),
        previewUrl: URL.createObjectURL(file),
      }))
    );
  };

  const uploadFolderMedia = async () => {
    if (!selectedFolder || selectedFiles.length === 0) {
      setUploadError('Please choose at least one file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const items = await Promise.all(
        selectedFiles.map(async (file) => ({
          folderId: selectedFolder.id,
          title: file.name,
          mediaType: getMediaTypeFromFile(file),
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
        throw new Error(result?.message || 'Upload failed');
      }

      const uploadedItems = Array.isArray(result.data) ? result.data : [result.data];
      setMediaItems((prev) => [
        ...uploadedItems.map((item: any) => ({
          id: String(item._id || item.id || Date.now()),
          url: item.url || '/images/media1.jpg',
          type: item.mediaType === 'video' ? 'video' : 'photo',
          uploadedAt: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isFavorite: item.isFavorite ?? false,
        })),
        ...prev,
      ]);

      closeUploadModal();
    } catch (uploadErr) {
      console.warn('Upload failed:', uploadErr);
      setUploadError((uploadErr as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, [filePreviews]);

  useEffect(() => {
    const fetchGalleryData = async () => {
      setLoading(true);
      try {
        const [folderResponse, mediaResponse] = await Promise.all([
          fetch(`${API_BASE}/api/gallery/folders`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE}/api/gallery/media`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (folderResponse.ok) {
          const folderData = await folderResponse.json();
          if (folderData?.data) {
            setGalleryFolders(
              folderData.data.map((folder: any) => ({
                id: String(folder.id ?? folder._id ?? Date.now()),
                name: folder.name,
                category: folder.category || 'Custom',
                imageCount: folder.images?.length ?? 0,
                coverImages: folder.images?.filter((image: any) => image.url).map((image: any) => image.url) ?? [],
              }))
            );
          }
        }

        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          if (mediaData?.data) {
            setMediaItems(
              mediaData.data.map((item: any) => ({
                id: String(item._id),
                url: item.url || '/images/media1.jpg',
                type: item.mediaType === 'video' ? 'video' : 'photo',
                uploadedAt: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : item.uploadedAt || '2024-01-01',
                isFavorite: item.isFavorite ?? false,
              }))
            );
          }
        }
      } catch (fetchError) {
        console.warn('Gallery load failed:', fetchError);
        setError('Could not load gallery data.');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    setMediaItems((prev) => prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item)));

    try {
      const response = await fetch(`${API_BASE}/api/gallery/media/${id}/favorite`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite.');
      }
    } catch (toggleError) {
      console.warn('Failed to sync favorite:', toggleError);
    }
  };

  // Create folder handler - posts to backend or falls back to local state
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const payload = { name: newFolderName.trim(), category: 'Custom' };

    try {
      const response = await fetch(`${API_BASE}/api/gallery/folders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const folderResult = await response.json();
        const folder = folderResult?.data;
        setGalleryFolders((prev) => [
          {
            id: String(folder?.id || Date.now()),
            name: folder?.name || payload.name,
            category: folder?.category || payload.category,
            imageCount: folder?.images?.length ?? 0,
            coverImages: folder?.images?.filter((image: any) => image.url).map((image: any) => image.url) ?? [],
          },
          ...prev,
        ]);
      } else {
        setGalleryFolders((prev) => [
          {
            id: String(Date.now()),
            name: payload.name,
            category: payload.category,
            imageCount: 0,
            coverImages: [],
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.warn('Failed to save folder:', error);
      setGalleryFolders((prev) => [
        {
          id: String(Date.now()),
          name: payload.name,
          category: payload.category,
          imageCount: 0,
          coverImages: [],
        },
        ...prev,
      ]);
    }

    setNewFolderName('');
    setShowCreateModal(false);
  };

  const filteredMedia =
    mediaFilter === 'all' ? mediaItems : mediaItems.filter((item) => item.type === mediaFilter.slice(0, -1));

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: '#fff8f7' }}>
      {/* Header */}
      <div className="px-8 py-12" style={{ backgroundColor: '#fff8f7' }}>
        <h1
          className="text-5xl font-normal mb-2"
          style={{
            fontFamily: 'Newsreader',
            color: '#211a1b',
          }}
        >
          The Living Archive
        </h1>
      </div>

      {/* Gallery Folders Section */}
      <section className="px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl font-normal"
            style={{
              fontFamily: 'Newsreader',
              color: '#211a1b',
            }}
          >
            Gallery Folders
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 rounded-full font-semibold text-white transition-all"
              style={{
                backgroundColor: '#890051',
                background: 'linear-gradient(135deg, #890051 0%, #d23284 100%)',
              }}
            >
              Create New Folder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {galleryFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => openFolderPage(folder)}
              className="cursor-pointer rounded-lg overflow-hidden transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
              }}
            >
              {/* Folder Preview */}
              <div
                className="relative h-48 bg-gray-200 flex items-center justify-center"
                style={{
                  backgroundColor: '#ffe8ee',
                }}
              >
                {folder.coverImages.length > 0 ? (
                  <div className="w-full h-full relative">
                    <Image
                      src={folder.coverImages[0]}
                      alt={folder.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto"
                      style={{ color: '#d23284' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Folder Info */}
              <div className="p-4">
                <h3
                  className="font-semibold mb-1"
                  style={{
                    fontFamily: 'Plus Jakarta Sans',
                    color: '#211a1b',
                    fontSize: '16px',
                  }}
                >
                  {folder.name}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: 'Plus Jakarta Sans',
                    color: '#534345',
                    fontSize: '12px',
                  }}
                >
                  {folder.category}
                </p>
                {folder.imageCount > 0 && (
                  <p
                    className="text-xs mt-2"
                    style={{
                      fontFamily: 'Plus Jakarta Sans',
                      color: '#8b7079',
                    }}
                  >
                    {folder.imageCount} items
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2C1E26' }}>
              Create New Folder
            </h3>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-3 rounded border mb-4"
              style={{ borderColor: '#E5CCD4' }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 rounded text-white"
                style={{ background: 'linear-gradient(135deg, #890051 0%, #d23284 100%)' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && selectedFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#2C1E26' }}>
                  Upload media to {selectedFolder.name}
                </h3>
                <p className="text-sm text-gray-600">Select images or videos to add to this folder.</p>
              </div>
              <button
                onClick={closeUploadModal}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelection}
              className="w-full mb-4"
            />

            {filePreviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {filePreviews.map((preview) => (
                  <div key={preview.previewUrl} className="border rounded p-2">
                    <div className="text-xs font-semibold mb-1" style={{ color: '#211a1b' }}>
                      {preview.name}
                    </div>
                    {preview.type === 'photo' ? (
                      <img src={preview.previewUrl} alt={preview.name} className="h-32 w-full object-cover rounded" />
                    ) : (
                      <div className="h-32 w-full rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                        Video selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadError && <div className="text-sm text-red-600 mb-4">{uploadError}</div>}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={uploadFolderMedia}
                disabled={uploading}
                className="px-4 py-2 rounded text-white"
                style={{ background: 'linear-gradient(135deg, #890051 0%, #d23284 100%)' }}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Contribution Section */}
      <section className="px-8 py-16" style={{ backgroundColor: '#ffe8ee' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl">
          <div>
            <p
              className="text-sm font-semibold mb-4"
              style={{
                fontFamily: 'Plus Jakarta Sans',
                color: '#534345',
                letterSpacing: '0.1em',
              }}
            >
              INTERACTIVE ARCHIVE
            </p>
            <h2
              className="text-5xl font-normal mb-6"
              style={{
                fontFamily: 'Newsreader',
                color: '#211a1b',
              }}
            >
              Invite Your Guests to{' '}
              <span style={{ color: '#890051', fontStyle: 'italic' }}>Contribute</span>
            </h2>
            <p
              className="mb-8 leading-relaxed"
              style={{
                fontFamily: 'Plus Jakarta Sans',
                color: '#211a1b',
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              Every perspective tells a part of the story. Let your guests upload their photos and
              videos directly to this curated archive.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowGuestQR(!showGuestQR)}
                className="px-6 py-3 rounded-full font-semibold text-white transition-all"
                style={{
                  backgroundColor: '#890051',
                  background: 'linear-gradient(135deg, #890051 0%, #d23284 100%)',
                }}
              >
                Copy Guest Link
              </button>
              <button
                className="px-6 py-3 rounded-full font-semibold transition-all"
                style={{
                  backgroundColor: '#f3e5e6',
                  color: '#211a1b',
                  border: '1px solid #8b7079',
                }}
              >
                Print Signage
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div
              className="p-8 rounded-lg"
              style={{
                backgroundColor: '#ffffff',
              }}
            >
              <QRCode value="https://memo-album.com/contribute" size={200} level="H" />
              <p
                className="text-center text-xs mt-4"
                style={{
                  fontFamily: 'Plus Jakarta Sans',
                  color: '#8b7079',
                  letterSpacing: '0.1em',
                }}
              >
                SCAN TO CONTRIBUTE
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Media Section */}
      <section className="px-8 py-16" style={{ backgroundColor: '#fff8f7' }}>
        <div className="mb-8 flex items-center justify-between">
          <h2
            className="text-3xl font-normal"
            style={{
              fontFamily: 'Newsreader',
              color: '#211a1b',
            }}
          >
            Recent Media
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search archive..."
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ecd4db',
                fontFamily: 'Plus Jakarta Sans',
              }}
            />
            <button
              className="p-3 rounded-full text-white transition-all"
              style={{
                backgroundColor: '#d23284',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.9 14.32a8 8 0 111.414-1.414l5.387 5.387a1 1 0 01-1.414 1.414l-5.387-5.387zM8 14a6 6 0 100-12 6 6 0 000 12z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-6 mb-8 border-b" style={{ borderColor: '#ecd4db' }}>
          {['all', 'photos', 'videos'].map((filter) => (
            <button
              key={filter}
              onClick={() => setMediaFilter(filter as typeof mediaFilter)}
              className="pb-4 font-medium text-sm capitalize transition-all"
              style={{
                color: mediaFilter === filter ? '#890051' : '#8b7079',
                fontFamily: 'Plus Jakarta Sans',
                borderBottom: mediaFilter === filter ? '2px solid #890051' : 'none',
              }}
            >
              {filter === 'all' ? 'All' : filter} ({filteredMedia.length})
            </button>
          ))}
        </div>

        {loading && <div className="text-center text-sm mb-6">Loading gallery data...</div>}
        {error && <div className="text-center text-sm text-red-600 mb-6">{error}</div>}

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="relative h-64 rounded-lg overflow-hidden cursor-pointer group"
              style={{
                backgroundColor: '#ffe8ee',
              }}
            >
              <div className="w-full h-full relative bg-gray-300">
                {item.type === 'photo' ? (
                  <Image
                    src={item.url}
                    alt="Gallery item"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                )}
                {/* Favorite toggle */}
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="absolute top-3 right-3 bg-white/80 p-2 rounded-full"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill={// eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      item['isFavorite'] ? '#E91E63' : 'none'
                    }
                    stroke="#E91E63"
                  >
                    <path strokeWidth="1.5" d="M12 21s-7-4.35-9-7.2A5.5 5.5 0 014.5 5.5 5.5 5.5 0 0112 8.5a5.5 5.5 0 017.5-3 5.5 5.5 0 01-1.5 8.3C19 16.65 12 21 12 21z" />
                  </svg>
                </button>

                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}

        
        </div>

        
      </section>
    </div>
  );
}
