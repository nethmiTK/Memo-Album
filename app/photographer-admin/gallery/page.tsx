'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Edit2,
  Eye,
  Folder,
  Plus,
  Search,
} from 'lucide-react';
import { apiFetch, handleAuthError } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { FullscreenBook } from '@/app/Components/photographer-admin/FullscreenBook';

type CurateAlbum = {
  _id: string;
  albumName: string;
  weddingDate?: string;
  status?: string;
  coverPhoto?: string;
  selectedTemplate?: string;
};

type BookAlbum = {
  _id: string;
  albumName: string;
  curateId?: CurateAlbum | string;
  templateId?: { _id: string; name?: string } | string;
  templateName?: string;
  status?: string;
};

type ArchiveItem = {
  _id: string;
  albumId: CurateAlbum | string;
  archiveFolderName: string;
  archivedAt?: string;
  albumTitle?: string;
  albumCoverPhoto?: string;
};

type FullscreenBookData = {
  _id: string;
  albumName: string;
  coverPhoto?: string;
  coverPhotoName?: string;
  coverWeddingDate?: string;
  endPhoto?: string;
  endPhotoName?: string;
  template: {
    _id?: string;
    name?: string;
    description?: string;
    accent?: string;
    coverImage?: string;
    pages?: any[];
    slots?: any[];
  };
  mediaItems: any[];
  pageLayouts?: Array<{
    pageNumber?: number;
    slotAssignments?: Array<{
      slotId?: string;
      mediaId?: string;
      dataUrl?: string;
      mediaKind?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      mediaOrder?: number;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }>;
  }>;
};

const fallbackCover = 'https://images.unsplash.com/photo-1522673607200-164d1b6ce8d2?w=1200&q=80';
const GALLERY_PAGE_CACHE_KEY = 'memo.gallery.page.v3';

function readSessionCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeSessionCache(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore cache write errors
  }
}

const fuzzyMatch = (query: string, ...targets: (string | undefined)[]): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return targets.some((raw) => {
    const target = (raw || '').toLowerCase();
    if (!target) return false;
    if (target.includes(q)) return true;

    let qi = 0;
    for (let i = 0; i < target.length && qi < q.length; i += 1) {
      if (target[i] === q[qi]) qi += 1;
    }
    return qi === q.length;
  });
};

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
  const router = useRouter();
  const [albums, setAlbums] = useState<CurateAlbum[]>([]);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [bookAlbums, setBookAlbums] = useState<BookAlbum[]>([]);
  const [albumSearch, setAlbumSearch] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFullscreenBook, setSelectedFullscreenBook] = useState<FullscreenBookData | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const bookByCurateId = useMemo(() => {
    const map = new Map<string, BookAlbum>();
    bookAlbums.forEach((bookAlbum) => {
      const curateId = typeof bookAlbum.curateId === 'string' ? bookAlbum.curateId : bookAlbum.curateId?._id;
      if (curateId) {
        map.set(curateId, bookAlbum);
      }
    });
    return map;
  }, [bookAlbums]);

  const openBookView = async (album: CurateAlbum) => {
    const bookAlbum = bookByCurateId.get(album._id);
    if (!bookAlbum) {
      setMessage('No album book found for this album yet.');
      return;
    }

    try {
      const response = await apiFetch(`/book-albums/${bookAlbum._id}`);
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success || !result.bookAlbum) {
        throw new Error(result.message || 'Failed to load book preview');
      }

      const book = result.bookAlbum;
      const templateSource = book.templateId && typeof book.templateId === 'object' ? book.templateId : {};
      const curateSource = book.curateId && typeof book.curateId === 'object' ? book.curateId : {};

      setSelectedFullscreenBook({
        _id: book._id,
        albumName: book.albumName || curateSource.albumName || album.albumName,
        coverPhoto: curateSource.coverPhoto || album.coverPhoto || '',
        coverPhotoName: curateSource.coverPhotoName || curateSource.albumName || album.albumName || '',
        coverWeddingDate: curateSource.weddingDate || album.weddingDate || '',
        endPhoto: book.endPhoto || '',
        endPhotoName: book.endPhotoName || '',
        template: {
          _id: templateSource._id || '',
          name: templateSource.name || book.templateName || book.albumName || 'Album Book',
          description: templateSource.description || '',
          accent: templateSource.accent || '#b10e6b',
          coverImage: templateSource.coverImage || '',
          pages: templateSource.pages || [],
          slots: templateSource.slots || [],
          pageLayouts: Array.isArray(book.pageLayouts) ? book.pageLayouts : undefined,
        },
        mediaItems: Array.isArray(curateSource.mediaItems) ? curateSource.mediaItems : [],
        pageLayouts: Array.isArray(book.pageLayouts) ? book.pageLayouts : undefined,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to open book preview');
    }
  };

  const openDesignerView = (album: CurateAlbum) => {
    const linkedBook = bookByCurateId.get(album._id);
    const templateId = typeof linkedBook?.templateId === 'string' ? linkedBook.templateId : linkedBook?.templateId?._id || '';

    if (!templateId) {
      setMessage('No template linked to this album yet.');
      return;
    }

    router.push(`/photographer-admin/designer?curateId=${encodeURIComponent(album._id)}&templateId=${encodeURIComponent(templateId)}&openBook=1`);
  };

  const albumOptions = useMemo(() => {
    const query = albumSearch.trim();
    return albums
      .map((album) => {
        const bookAlbum = bookByCurateId.get(album._id);
        const templateName =
          typeof bookAlbum?.templateId === 'string'
            ? bookAlbum.templateName || bookAlbum.templateId
            : bookAlbum?.templateId?.name || bookAlbum?.templateName || album.selectedTemplate || 'template-1';

        return { album, bookAlbum, templateName };
      })
      .filter(({ album, bookAlbum, templateName }) => {
        if (!query) return true;
        return fuzzyMatch(query, album.albumName, album.status, bookAlbum?.templateName, templateName);
      })
      .slice(0, 8);
  }, [albumSearch, albums, bookByCurateId]);

  const filteredAlbums = useMemo(() => {
    const query = albumSearch.trim();
    if (!query) return albums;
    return albums.filter((album) => {
      const bookAlbum = bookByCurateId.get(album._id);
      const templateName =
        typeof bookAlbum?.templateId === 'string'
          ? bookAlbum.templateName || bookAlbum.templateId
          : bookAlbum?.templateId?.name || bookAlbum?.templateName || album.selectedTemplate || 'template-1';
      return fuzzyMatch(query, album.albumName, album.status, templateName);
    });
  }, [albumSearch, albums, bookByCurateId]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const [albumResponse, archiveResponse, bookAlbumResponse] = await Promise.all([
        apiFetch('/curate'),
        apiFetch('/archive'),
        apiFetch('/book-albums'),
      ]);

      if (albumResponse.status === 401 || archiveResponse.status === 401 || bookAlbumResponse.status === 401) {
        handleAuthError(albumResponse.status === 401 ? albumResponse : archiveResponse.status === 401 ? archiveResponse : bookAlbumResponse);
        return;
      }

      const [albumResult, archiveResult, bookAlbumResult] = await Promise.all([
        albumResponse.json(),
        archiveResponse.json(),
        bookAlbumResponse.json(),
      ]);

      let nextAlbums: CurateAlbum[] = [];
      let nextArchives: ArchiveItem[] = [];
      let nextBookAlbums: BookAlbum[] = [];

      if (albumResponse.ok && albumResult.success) {
        nextAlbums = Array.isArray(albumResult.curates) ? albumResult.curates : [];
        setAlbums(nextAlbums);
      }

      if (archiveResponse.ok && archiveResult.success) {
        nextArchives = Array.isArray(archiveResult.archives) ? archiveResult.archives : [];
        setArchives(nextArchives);
      }

      if (bookAlbumResponse.ok && bookAlbumResult.success) {
        nextBookAlbums = Array.isArray(bookAlbumResult.bookAlbums) ? bookAlbumResult.bookAlbums : [];
        setBookAlbums(nextBookAlbums);
      }

      writeSessionCache(GALLERY_PAGE_CACHE_KEY, {
        albums: nextAlbums,
        archives: nextArchives,
        bookAlbums: nextBookAlbums,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cachedGallery = readSessionCache<{ albums: CurateAlbum[]; archives: ArchiveItem[]; bookAlbums: BookAlbum[] }>(GALLERY_PAGE_CACHE_KEY);

    if (cachedGallery) {
      if (Array.isArray(cachedGallery.albums)) setAlbums(cachedGallery.albums);
      if (Array.isArray(cachedGallery.archives)) setArchives(cachedGallery.archives);
      if (Array.isArray(cachedGallery.bookAlbums)) setBookAlbums(cachedGallery.bookAlbums);
    }

    void loadGallery();
  }, []);

  const featuredAlbum = filteredAlbums[0] || null;
  const visibleAlbums = filteredAlbums;

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

          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e8dede] bg-white px-4 py-3 shadow-sm focus-within:border-[#b10e6b]">
              <Search className="h-4 w-4 text-[#b10e6b]" />
              <input
                value={albumSearch}
                onChange={(event) => {
                  setAlbumSearch(event.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="Search album or album book names"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#907f77]"
              />
              <ChevronDown className={`h-4 w-4 text-[#8a7670] transition-transform ${isSearchDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isSearchDropdownOpen ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#e8dede] bg-white shadow-xl">
                <div className="border-b border-[#f1e6e1] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9f8d89]">
                  Suggested Albums
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {albumOptions.length > 0 ? (
                    albumOptions.map(({ album, bookAlbum, templateName }) => (
                      <button
                        key={album._id}
                        type="button"
                        onClick={() => {
                          setAlbumSearch(album.albumName);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 border-b border-[#faf2ef] px-4 py-3 text-left transition-colors hover:bg-[#fff5f8] last:border-b-0"
                      >
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#f5e8ed] text-[#b10e6b]">
                          {album.coverPhoto ? (
                            <img src={album.coverPhoto} alt={album.albumName} className="h-full w-full object-cover" />
                          ) : (
                            <Folder size={18} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-black">{album.albumName}</p>
                          <p className="truncate text-[10px] uppercase tracking-[0.18em] text-[#8a7670]">{bookAlbum?.templateName || templateName}</p>
                        </div>
                        <BookOpen size={14} className="text-[#b10e6b]" />
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-[#7e6d67]">No matching albums found.</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {visibleAlbums.map((album) => (
              <article
                key={album._id}
                role="button"
                tabIndex={0}
                onClick={() => void openBookView(album)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    void openBookView(album);
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-[#efe7e5]">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={album.coverPhoto || fallbackCover}
                    alt={album.albumName}
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-[#e8def8] px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-[#1f1a24]">
                    {bookByCurateId.get(album._id) ? album.status || 'saved' : 'Not Assigned Template'}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#4f4539]">
                        {formatDate(album.weddingDate)}
                      </p>
                      <h4 className="mt-2 text-xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                        {album.albumName}
                      </h4>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {filteredAlbums.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d7ccc4] bg-white px-6 py-10 text-center text-sm text-[#6b5d60] shadow-sm md:col-span-2 xl:col-span-3">
                No albums match your search.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedFullscreenBook ? (
        <FullscreenBook
          template={selectedFullscreenBook.template as any}
          mediaItems={selectedFullscreenBook.mediaItems}
          coverPhoto={selectedFullscreenBook.coverPhoto}
          coverPhotoName={selectedFullscreenBook.coverPhotoName}
          coverWeddingDate={selectedFullscreenBook.coverWeddingDate}
          endPhoto={selectedFullscreenBook.endPhoto}
          endPhotoName={selectedFullscreenBook.endPhotoName}
          photographerName="Lumina Editorial"
          photographerStudio="Lumina Editorial"
          photographerWebsite="luminaeditorial.com"
          onClose={() => setSelectedFullscreenBook(null)}
        />
      ) : null}
    </div>
  );
}
