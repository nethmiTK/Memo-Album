'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, Edit, Image as ImageIcon, MoreHorizontal, Plus, Share2 } from 'lucide-react';
import { apiFetch, handleAuthError } from '@/lib/api';

type CurateAlbum = {
  _id: string;
  albumName: string;
  weddingDate?: string;
  status?: string;
  coverPhoto?: string;
  selectedTemplate?: string;
};

type ArchiveItem = {
  _id: string;
  albumId: CurateAlbum | string;
  archiveFolderName: string;
  archivedAt?: string;
  albumTitle?: string;
  albumCoverPhoto?: string;
};

const fallbackCover = 'https://images.unsplash.com/photo-1522673607200-164d1b6ce8d2?w=1200&q=80';

function formatDate(value?: string) {
  if (!value) return 'Recently';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function Toast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed right-5 top-5 z-50 rounded-2xl bg-[#1f1a1b] px-4 py-3 text-sm text-white shadow-2xl">
      {message}
    </div>
  );
}

export default function GalleryPage() {
  const [albums, setAlbums] = useState<CurateAlbum[]>([]);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const [albumResponse, archiveResponse] = await Promise.all([apiFetch('/curate'), apiFetch('/archive')]);

      if (albumResponse.status === 401 || archiveResponse.status === 401) {
        handleAuthError(albumResponse.status === 401 ? albumResponse : archiveResponse);
        return;
      }

      const [albumResult, archiveResult] = await Promise.all([albumResponse.json(), archiveResponse.json()]);

      if (albumResponse.ok && albumResult.success) {
        setAlbums(Array.isArray(albumResult.curates) ? albumResult.curates : []);
      }

      if (archiveResponse.ok && archiveResult.success) {
        setArchives(Array.isArray(archiveResult.archives) ? archiveResult.archives : []);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const featuredAlbum = albums[0] || null;
  const sideAlbums = albums.slice(1, 3);
  const remainingAlbums = albums.slice(3);

  const archivedCount = archives.length;

  const featuredCover = featuredAlbum?.coverPhoto || fallbackCover;

  const archiveCover = (archive: ArchiveItem) => {
    if (typeof archive.albumId === 'string') return archive.albumCoverPhoto || fallbackCover;
    return archive.albumCoverPhoto || archive.albumId.coverPhoto || fallbackCover;
  };

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      <Toast message={message} />

      <div className="px-6 md:px-12 py-12">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">Portfolio Overview</span>
              <h1 className="text-3xl leading-tight text-black md:text-5xl" style={{ fontFamily: "'Newsreader', serif" }}>
                Curated Memories
              </h1>
              <p className="mt-4 max-w-md leading-relaxed text-[#4f4539]">
                Every album is a narrative. Review live curate albums, archive them, and keep past collections available in one place.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="min-w-35 rounded-xl bg-white p-6 shadow-sm">
                <span className="block text-3xl text-[#b10e6b]" style={{ fontFamily: "'Newsreader', serif" }}>{albums.length}</span>
                <span className="mt-2 block text-[10px] uppercase tracking-widest text-[#4f4539]">Active Albums</span>
              </div>
              <div className="min-w-35 rounded-xl bg-white p-6 shadow-sm">
                <span className="block text-3xl text-[#605d7e]" style={{ fontFamily: "'Newsreader', serif" }}>{archivedCount}</span>
                <span className="mt-2 block text-[10px] uppercase tracking-widest text-[#4f4539]">Archived</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-8">
              <div className="relative aspect-video overflow-hidden bg-[#efe7e5]">
                <img
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={featuredCover}
                  alt={featuredAlbum?.albumName || 'Featured album'}
                />
                <div className="absolute left-6 top-6 flex space-x-2">
                  <span className="rounded-full bg-[#e8def8] px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-[#1f1a24]">
                    {featuredAlbum?.status || 'saved'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#4f4539]">
                    {featuredAlbum ? formatDate(featuredAlbum.weddingDate) : 'No album loaded'}
                  </p>
                  <h4 className="mt-2 text-3xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                    {featuredAlbum?.albumName || 'No Albums Yet'}
                  </h4>
                </div>
                <div className="flex items-center gap-3 self-end md:self-center">
                  <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e7eb] text-[#b10e6b] transition-colors hover:bg-[#edd6df]" title="Edit">
                    <Edit size={20} />
                  </button>
                  <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e7eb] text-[#b10e6b] transition-colors hover:bg-[#edd6df]" title="Share">
                    <Share2 size={20} />
                  </button>
                  <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e7eb] text-[#b10e6b] transition-colors hover:bg-[#edd6df]" title="Archive">
                    <ArchiveRestore size={20} />
                  </button>
                </div>
              </div>
            </article>

            <div className="flex flex-col gap-8 lg:col-span-4">
              {sideAlbums.map((album) => (
                <article key={album._id} className="group overflow-hidden rounded-xl bg-white shadow-sm">
                  <div className="relative h-40 overflow-hidden bg-[#efe7e5]">
                    <img
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={album.coverPhoto || fallbackCover}
                      alt={album.albumName}
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="flex h-7 w-7 items-center justify-center rounded-full border border-[#b10e6b] bg-white text-[#b10e6b] transition-all hover:bg-[#b10e6b] hover:text-white">
                        <Edit size={14} />
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-full border border-[#b10e6b] bg-white text-[#b10e6b] transition-all hover:bg-[#b10e6b] hover:text-white">
                        <Share2 size={14} />
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-full border border-[#b10e6b] bg-white text-[#b10e6b] transition-all hover:bg-[#b10e6b] hover:text-white">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <span className="rounded bg-[#f6f3f0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-[#b10e6b]">
                        {album.status || 'saved'}
                      </span>
                      <span className="text-[10px] font-medium text-[#4f4539]">{formatDate(album.weddingDate)}</span>
                    </div>
                    <h4 className="mt-3 text-xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                      {album.albumName}
                    </h4>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center text-xs text-[#4f4539]">
                        <ImageIcon size={12} className="mr-1" /> Cover photo
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#b10e6b]">Template: {album.selectedTemplate || 'template-1'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 border-b border-[#eae3d9] pb-4">
            <h5 className="text-3xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>Past Collections</h5>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {archives.map((archive) => (
              <article key={archive._id} className="group overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="relative aspect-square overflow-hidden bg-[#f6f3f0]">
                  <img
                    className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
                    src={archiveCover(archive)}
                    alt={typeof archive.albumId === 'string' ? archive.albumTitle || archive.albumId : archive.albumId.albumName}
                  />
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#4f4539]/60">{formatDate(archive.archivedAt)}</span>
                    <span className="rounded bg-[#eaddff] px-2 py-0.5 text-[9px] font-bold uppercase text-[#201b24]">Archived</span>
                  </div>
                  <h4 className="text-2xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                    {archive.albumTitle || (typeof archive.albumId === 'string' ? archive.albumId : archive.albumId.albumName)}
                  </h4>
                  <p className="mt-2 text-xs text-[#4f4539]">Folder: {archive.archiveFolderName}</p>
                </div>
              </article>
            ))}

            {!isLoading && archives.length === 0 ? (
              <button className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cfc4b8] bg-transparent p-6 text-[#4f4539]/40 transition-all hover:border-[#b10e6b] hover:text-[#b10e6b]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-current transition-transform group-hover:scale-110">
                  <span className="text-3xl">+</span>
                </div>
                <span className="text-sm font-medium uppercase tracking-widest">No archives yet</span>
                <span className="mt-2 text-[10px] opacity-60">Create an archive from the archive page</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
