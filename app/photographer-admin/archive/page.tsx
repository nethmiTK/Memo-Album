'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, ChevronDown, Folder, FileText, BookOpen, Trash2, Edit2, Search, Image as ImageIcon, Upload, X, Calendar, Zap } from 'lucide-react';
import { apiFetch, handleAuthError } from '@/lib/api';
import { FullscreenBook } from '@/app/Components/photographer-admin/FullscreenBook';

type CurateAlbum = {
  _id: string;
  albumName: string;
  weddingDate?: string;
  status?: string;
  coverPhoto?: string;
};

type ArchiveItem = {
  _id: string;
  albumId: CurateAlbum | string;
  archiveFolderName: string;
  archivedAt?: string;
  albumTitle?: string;
  albumCoverPhoto?: string;
};

type BookAlbum = {
  _id: string;
  albumName: string;
  templateName?: string;
  curateId?: CurateAlbum | string;
  templateId?: {
    _id: string;
    name?: string;
    description?: string;
    accent?: string;
    coverImage?: string;
    pages?: any[];
    slots?: any[];
  } | string;
};

type FullscreenBookData = {
  _id: string;
  albumName: string;
  coverPhoto?: string;
  coverPhotoName?: string;
  coverWeddingDate?: string;
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
};

const ARCHIVE_PAGE_CACHE_KEY = 'memo.archive.page.v3';
const ARCHIVE_BOOKS_CACHE_PREFIX = 'memo.archive.books.v1:';
const ARCHIVE_BOOK_PREVIEW_CACHE_PREFIX = 'memo.archive.preview.v1:';
const fallbackCover = 'https://images.unsplash.com/photo-1522673607200-164d1b6ce8d2?w=1200&q=80';

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

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <div className="fixed right-5 top-5 z-50 rounded-2xl bg-[#1f1a1b] px-4 py-3 text-sm text-white shadow-2xl">{message}</div>;
}

export default function ArchivePage() {
  const [albums, setAlbums] = useState<CurateAlbum[]>([]);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
  const [archiveFolderName, setArchiveFolderName] = useState('');
  const [message, setMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [archiveBooks, setArchiveBooks] = useState<BookAlbum[]>([]);
  const [selectedFullscreenBook, setSelectedFullscreenBook] = useState<FullscreenBookData | null>(null);
  const [isLoadingArchiveBooks, setIsLoadingArchiveBooks] = useState(false);
  const [addAlbumId, setAddAlbumId] = useState('');
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderSearch, setFolderSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedAlbums = useMemo(
    () => albums.filter((album) => selectedAlbumIds.includes(album._id)),
    [albums, selectedAlbumIds]
  );

  const groupedArchives = useMemo(() => {
    const groups = new Map<string, ArchiveItem[]>();
    archives.forEach((archive) => {
      const key = archive.archiveFolderName || 'Untitled Folder';
      const next = groups.get(key) || [];
      next.push(archive);
      groups.set(key, next);
    });

    const allGroups = Array.from(groups.entries())
      .map(([folderName, folderArchives]) => ({
        folderName,
        folderArchives,
        latestAt: folderArchives.reduce((latest, archive) => {
          const time = archive.archivedAt ? new Date(archive.archivedAt).getTime() : 0;
          return Math.max(latest, time);
        }, 0),
      }))
      .sort((a, b) => b.latestAt - a.latestAt);
    const query = folderSearch.trim().toLowerCase();
    if (!query) return allGroups;
    return allGroups.filter((group) =>
      group.folderName.toLowerCase().includes(query) ||
      group.folderArchives.some((archive) => (archive.albumTitle || '').toLowerCase().includes(query))
    );
  }, [archives, folderSearch]);

  const persistArchiveCache = (nextAlbums: CurateAlbum[], nextArchives: ArchiveItem[]) => {
    writeSessionCache(ARCHIVE_PAGE_CACHE_KEY, {
      albums: nextAlbums,
      archives: nextArchives,
    });
  };

  const archiveCover = (archive: ArchiveItem) => {
    if (typeof archive.albumId === 'string') return archive.albumCoverPhoto || fallbackCover;
    return archive.albumCoverPhoto || archive.albumId.coverPhoto || fallbackCover;
  };

  const loadData = async () => {
    try {
      const [albumResponse, archiveResponse] = await Promise.all([apiFetch('/curate'), apiFetch('/archive')]);
      if (albumResponse.status === 401 || archiveResponse.status === 401) {
        handleAuthError(albumResponse.status === 401 ? albumResponse : archiveResponse);
        return;
      }

      const [albumResult, archiveResult] = await Promise.all([albumResponse.json(), archiveResponse.json()]);
      let nextAlbums: CurateAlbum[] = [];
      let nextArchives: ArchiveItem[] = [];

      if (albumResponse.ok && albumResult.success) {
        nextAlbums = Array.isArray(albumResult.curates) ? albumResult.curates : [];
        setAlbums(nextAlbums);
      }
      if (archiveResponse.ok && archiveResult.success) {
        nextArchives = Array.isArray(archiveResult.archives) ? archiveResult.archives : [];
        setArchives(nextArchives);
      }

      persistArchiveCache(nextAlbums, nextArchives);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load archive data');
    }
  };

  useEffect(() => {
    const cached = readSessionCache<{ albums: CurateAlbum[]; archives: ArchiveItem[] }>(ARCHIVE_PAGE_CACHE_KEY);
    if (cached) {
      if (Array.isArray(cached.albums)) setAlbums(cached.albums);
      if (Array.isArray(cached.archives)) setArchives(cached.archives);
    }

    void loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const loadArchiveBooks = async () => {
      if (!expandedArchiveId) {
        setArchiveBooks([]);
        setSelectedFullscreenBook(null);
        setAddAlbumId('');
        setIsLoadingArchiveBooks(false);
        return;
      }

      setIsLoadingArchiveBooks(true);
      try {
        const folderArchives = archives.filter((archive) => archive.archiveFolderName === expandedArchiveId);
        const folderAlbumIds = folderArchives
          .map((archive) => (typeof archive.albumId === 'string' ? archive.albumId : archive.albumId._id))
          .filter(Boolean);

        const booksCacheKey = `${ARCHIVE_BOOKS_CACHE_PREFIX}${expandedArchiveId}`;
        const cachedBooks = readSessionCache<BookAlbum[]>(booksCacheKey);
        if (cachedBooks && cachedBooks.length > 0) {
          setArchiveBooks(cachedBooks);
        }

        const candidateAlbumId = albums.find((album) => {
          const alreadyArchived = archives.some((archive) => {
            const archiveAlbumId = typeof archive.albumId === 'string' ? archive.albumId : archive.albumId._id;
            return archiveAlbumId === album._id;
          });
          return !alreadyArchived;
        })?._id || '';
        setAddAlbumId((current) => current || candidateAlbumId);

        const response = await apiFetch('/book-albums');
        if (response.status === 401) {
          handleAuthError(response);
          return;
        }

        const result = await response.json();
        if (response.ok && result.success) {
          const nextBooks = Array.isArray(result.bookAlbums) ? result.bookAlbums : [];
          const matchedBooks = nextBooks.filter((book: BookAlbum) => {
            const bookCurateId = typeof book.curateId === 'string' ? book.curateId : book.curateId?._id;
            return folderAlbumIds.includes(bookCurateId || '');
          });
          setArchiveBooks(matchedBooks);
          writeSessionCache(booksCacheKey, matchedBooks);
        } else {
          setArchiveBooks([]);
        }
      } catch (error) {
        console.error('Failed to load archive books:', error);
        setArchiveBooks([]);
      } finally {
        setIsLoadingArchiveBooks(false);
      }
    };

    loadArchiveBooks();
  }, [expandedArchiveId, archives]);

  const openFullscreenBook = async (bookId: string) => {
    const previewCacheKey = `${ARCHIVE_BOOK_PREVIEW_CACHE_PREFIX}${bookId}`;
    const cachedPreview = readSessionCache<FullscreenBookData>(previewCacheKey);
    if (cachedPreview) {
      setSelectedFullscreenBook(cachedPreview);
      return;
    }

    try {
      const response = await apiFetch(`/book-albums/${bookId}`);
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success || !result.bookAlbum) {
        throw new Error(result.message || 'Failed to load book preview');
      }

      const bookAlbum = result.bookAlbum;
      const templateSource = bookAlbum.templateId && typeof bookAlbum.templateId === 'object' ? bookAlbum.templateId : {};
      const curateSource = bookAlbum.curateId && typeof bookAlbum.curateId === 'object' ? bookAlbum.curateId : {};

      const previewData: FullscreenBookData = {
        _id: bookAlbum._id,
        albumName: bookAlbum.albumName || curateSource.albumName || 'Album Book',
        coverPhoto: curateSource.coverPhoto || '',
        coverPhotoName: curateSource.coverPhotoName || curateSource.albumName || bookAlbum.albumName || '',
        coverWeddingDate: curateSource.weddingDate || '',
        template: {
          _id: templateSource._id || '',
          name: templateSource.name || bookAlbum.templateName || bookAlbum.albumName || 'Album Book',
          description: templateSource.description || '',
          accent: templateSource.accent || '#b10e6b',
          coverImage: templateSource.coverImage || '',
          pages: templateSource.pages || [],
          slots: templateSource.slots || [],
        },
        mediaItems: Array.isArray(curateSource.mediaItems) ? curateSource.mediaItems : [],
      };

      setSelectedFullscreenBook(previewData);
      writeSessionCache(previewCacheKey, previewData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to open book preview');
    }
  };

  const handleAddAlbumToFolder = async (folderName: string) => {
    if (!addAlbumId) {
      setMessage('Choose an album to add to this folder.');
      return;
    }

    try {
      const response = await apiFetch('/archive', {
        method: 'POST',
        body: JSON.stringify({ albumId: addAlbumId, archiveFolderName: folderName }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to add album to folder');
      }

      setMessage('Album added to folder successfully');
      setAddAlbumId('');
      await loadData();
      setExpandedArchiveId((current) => current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add album to folder');
    }
  };

  const handleCreateArchive = async () => {
    if (selectedAlbumIds.length === 0 || !archiveFolderName.trim()) {
      setMessage('Select at least one album and enter an archive folder name.');
      return;
    }

    try {
      const createPromises = selectedAlbumIds.map((albumId) =>
        apiFetch('/archive', {
          method: 'POST',
          body: JSON.stringify({ albumId, archiveFolderName }),
        })
      );

      const responses = await Promise.all(createPromises);
      
      for (const response of responses) {
        if (response.status === 401) {
          handleAuthError(response);
          return;
        }
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to create archive');
        }
      }

      setArchiveFolderName('');
      setSelectedAlbumIds([]);
      setMessage(`${selectedAlbumIds.length} album(s) archived successfully.`);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to archive albums');
    }
  };

  const handleDeleteArchive = async (archiveId: string) => {
    try {
      const response = await apiFetch(`/archive/${archiveId}`, { method: 'DELETE' });
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete archive');
      }

      const nextArchives = archives.filter((archive) => archive._id !== archiveId);
      setArchives(nextArchives);
      persistArchiveCache(albums, nextArchives);
      setExpandedArchiveId((current) => (current === archiveId ? null : current));
      setSelectedFullscreenBook((current) => (current && current._id === archiveId ? null : current));
      setMessage('Archive removed successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete archive');
    }
  };

  const handleRenameFolder = async (oldFolderName: string) => {
    if (!editingFolderName.trim()) {
      setMessage('Enter a new folder name.');
      return;
    }

    try {
      const response = await apiFetch(`/archive/folder/${encodeURIComponent(oldFolderName)}`, {
        method: 'PATCH',
        body: JSON.stringify({ archiveFolderName: editingFolderName.trim() }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to rename folder');
      }

      setEditingFolderName('');
      await loadData();
      setMessage('Folder renamed successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    try {
      const response = await apiFetch(`/archive/folder/${encodeURIComponent(folderName)}`, { method: 'DELETE' });
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete folder');
      }

      setExpandedArchiveId((current) => (current === folderName ? null : current));
      await loadData();
      setMessage('Folder deleted successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff8f7] via-white to-[#fff0f4]">
      <Toast message={message} />

      {/* Header Section */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/30 border-b border-white/20">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">✨ Wedding Gallery</span>
              <h1 className="text-3xl md:text-4xl text-black font-serif font-semibold">Archive Studio</h1>
              <p className="mt-2 text-sm text-[#6b5d60]">Organize and preserve your wedding memories in elegant collections</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur border border-white/50">
              <Zap size={16} className="text-[#b10e6b]" />
              <span className="text-sm font-medium text-[#211a1b]">{groupedArchives.length} Collections</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-12">
        {/* Create Archive Section */}
        <div className="mb-16">
          <div className="p-0">
            <div className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-[#211a1b] mb-2">Create New Collection</h2>
              <p className="text-sm text-[#6b5d60]">Select albums and organize them into named archive folders</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Album Selector */}
              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">📸 Select Albums</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full rounded-2xl border border-[#e9dddd] bg-white/50 backdrop-blur px-4 py-3 text-sm text-[#211a1b] outline-none flex items-center justify-between hover:border-[#b10e6b] hover:bg-white/70 transition-all"
                  >
                    <span className="font-medium">{selectedAlbumIds.length > 0 ? `${selectedAlbumIds.length} selected` : 'Choose albums'}</span>
                    <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-[#e9dddd] bg-white shadow-2xl max-h-60 overflow-y-auto">
                      {albums.length > 0 ? (
                        albums.map((album) => (
                          <label
                            key={album._id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f7ecef] cursor-pointer border-b border-[#f0e8e6] last:border-b-0 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAlbumIds.includes(album._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAlbumIds([...selectedAlbumIds, album._id]);
                                } else {
                                  setSelectedAlbumIds(selectedAlbumIds.filter((id) => id !== album._id));
                                }
                              }}
                              className="w-4 h-4 rounded cursor-pointer accent-[#b10e6b]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#211a1b] truncate">{album.albumName}</p>
                              <p className="text-xs text-[#6b5d60]">{album.status || 'draft'}</p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-[#6b5d60] text-center">No albums available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Folder Name Input */}
              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">📁 Folder Name</label>
                <input
                  value={archiveFolderName}
                  onChange={(event) => setArchiveFolderName(event.target.value)}
                  placeholder="e.g., 2024 Summer Weddings"
                  className="w-full rounded-2xl border border-[#e9dddd] bg-white/50 backdrop-blur px-4 py-3 text-sm text-[#211a1b] outline-none focus:border-[#b10e6b] focus:bg-white/70 transition-all placeholder:text-[#b10e6b]/30"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleCreateArchive}
                  disabled={selectedAlbumIds.length === 0 || !archiveFolderName.trim()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#b10e6b] to-[#951254] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Plus size={18} /> Create
                </button>
              </div>
            </div>

            {selectedAlbums.length > 0 ? (
              <div className="mt-6 rounded-2xl bg-white/40 backdrop-blur px-4 py-3 text-sm text-[#6b5d60]">
                <p className="font-semibold text-[#211a1b]">✓ {selectedAlbums.length} album(s) selected</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Collections Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-[#211a1b] mb-1">Collections</h2>
              <p className="text-sm text-[#6b5d60]">Your archived wedding galleries</p>
            </div>
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b10e6b]/70" />
              <input
                value={folderSearch}
                onChange={(event) => setFolderSearch(event.target.value)}
                placeholder="Search collections..."
                className="w-full rounded-full border border-[#e9dddd] bg-white/50 backdrop-blur py-3 pl-12 pr-4 text-sm text-[#211a1b] outline-none transition-all focus:border-[#b10e6b] focus:bg-white/70"
              />
            </div>
          </div>

          {/* Folder Cards Grid */}
          {groupedArchives.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupedArchives.map((group) => {
                const representativeArchive = group.folderArchives[0];
                const isExpanded = expandedArchiveId === group.folderName;

                return (
                  <div
                    key={group.folderName}
                    onClick={() => {
                      setExpandedArchiveId(isExpanded ? null : group.folderName);
                      setSelectedFullscreenBook(null);
                    }}
                    className="group cursor-pointer"
                  >
                    <div className="relative h-80 rounded-3xl overflow-hidden bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-[#b10e6b]/30">
                      {/* Cover Image */}
                      <img
                        src={archiveCover(representativeArchive)}
                        alt={group.folderName}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* Content */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        {/* Top Section */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 bg-white/30 backdrop-blur-md rounded-full px-4 py-2 border border-white/50">
                            <Folder size={18} className="text-[#b10e6b]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-white">Collection</span>
                          </div>
                        </div>

                        {/* Bottom Section */}
                        <div>
                          <h3 className="text-2xl font-serif font-semibold text-white mb-2 line-clamp-2">
                            {group.folderName}
                          </h3>
                          
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/50">
                              <ImageIcon size={14} className="text-white" />
                              <span className="text-xs font-semibold text-white">{group.folderArchives.length} Albums</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/50">
                              <Calendar size={14} className="text-white" />
                              <span className="text-xs font-semibold text-white">{new Date(group.latestAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hover Indicator */}
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedArchiveId(group.folderName);
                        setEditingFolderName(group.folderName);
                      }}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/70 text-[#211a1b] shadow-sm border border-white/70 hover:bg-[#fff] transition-all"
                      title="Edit folder"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteFolder(group.folderName);
                      }}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/70 text-[#b10e6b] shadow-sm border border-white/70 hover:bg-[#ffe7f1] transition-all"
                      title="Delete folder"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center group-hover:bg-[#b10e6b]/30 transition-all">
                        <ChevronDown size={20} className="text-white group-hover:rotate-180 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-[#e9dddd] py-16 text-center">
              <Folder size={48} className="mx-auto text-[#b10e6b]/20 mb-4" />
              <p className="text-lg text-[#6b5d60] font-medium">No collections yet</p>
              <p className="text-sm text-[#b10e6b]/60">Create your first collection above</p>
            </div>
          )}
        </div>

      </div>

      {/* Folder Details Modal */}
      {expandedArchiveId && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setExpandedArchiveId(null);
            setSelectedFullscreenBook(null);
          }}
        >
          <div
            className="min-h-screen flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/50 shadow-2xl flex flex-col">
              {/* Modal Header with Cover Image */}
              <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#fff8f7] to-[#fff0f4] overflow-hidden group">
                {groupedArchives.find(g => g.folderName === expandedArchiveId)?.folderArchives[0] && (
                  <img
                    src={archiveCover(groupedArchives.find(g => g.folderName === expandedArchiveId)!.folderArchives[0])}
                    alt={expandedArchiveId}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                {/* Close Button */}
                <button
                  onClick={() => {
                    setExpandedArchiveId(null);
                    setSelectedFullscreenBook(null);
                  }}
                  className="absolute top-6 right-6 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/50 text-white hover:bg-white/50 transition-all"
                >
                  <X size={24} />
                </button>

                {/* Cover Actions */}
                <div className="absolute bottom-6 left-6 right-6 flex gap-3 flex-wrap">
                  <label className="flex items-center gap-2 rounded-full bg-white/30 backdrop-blur-md border border-white/50 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/50 transition-all cursor-pointer group/upload">
                    <Upload size={16} className="group-hover/upload:scale-110 transition-transform" />
                    Change Cover
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                  
                  <button className="flex items-center gap-2 rounded-full bg-white/30 backdrop-blur-md border border-white/50 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/50 transition-all">
                    <Edit2 size={16} />
                    Rename
                  </button>

                  <button
                    onClick={() => void handleDeleteFolder(expandedArchiveId)}
                    className="flex items-center gap-2 rounded-full bg-red-500/30 backdrop-blur-md border border-red-300/50 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-500/50 transition-all ml-auto"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-20 left-6 right-6">
                  <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white drop-shadow-lg mb-2">
                    {expandedArchiveId}
                  </h2>
                  <p className="text-white/90 text-sm drop-shadow">
                    {groupedArchives.find(g => g.folderName === expandedArchiveId)?.folderArchives.length || 0} albums · {
                      new Date(groupedArchives.find(g => g.folderName === expandedArchiveId)?.latestAt || Date.now()).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-10 space-y-8">
                  {/* Add Album Section */}
                  <div className="rounded-2xl bg-gradient-to-r from-white/60 to-white/40 backdrop-blur border border-white/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Plus size={20} className="text-[#b10e6b]" />
                      <h3 className="text-lg font-semibold text-[#211a1b]">Add Album to Collection</h3>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <select
                        value={addAlbumId}
                        onChange={(event) => setAddAlbumId(event.target.value)}
                        className="flex-1 rounded-xl border border-[#e9dddd] bg-white px-4 py-3 text-sm text-[#211a1b] outline-none focus:border-[#b10e6b] focus:ring-2 focus:ring-[#b10e6b]/20"
                      >
                        <option value="">Choose an album</option>
                        {albums
                          .filter((album) => {
                            const alreadyArchived = archives.some((archive) => {
                              const archiveAlbumId = typeof archive.albumId === 'string' ? archive.albumId : archive.albumId._id;
                              return archiveAlbumId === album._id;
                            });
                            return !alreadyArchived;
                          })
                          .map((album) => (
                            <option key={album._id} value={album._id}>
                              {album.albumName}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleAddAlbumToFolder(expandedArchiveId)}
                        className="rounded-xl bg-gradient-to-r from-[#b10e6b] to-[#951254] px-6 py-3 text-sm font-bold uppercase text-white hover:shadow-lg transition-all"
                      >
                        Add Album
                      </button>
                    </div>
                  </div>

                  {/* Albums/Books Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <BookOpen size={22} className="text-[#b10e6b]" />
                      <h3 className="text-lg font-semibold text-[#211a1b]">Albums in Collection</h3>
                      <span className="ml-auto text-sm font-bold text-[#b10e6b] bg-[#f7ecef] px-3 py-1 rounded-full">
                        {archiveBooks.length} Albums
                      </span>
                    </div>

                    {isLoadingArchiveBooks ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center gap-2 text-[#6b5d60]">
                          <div className="w-2 h-2 rounded-full bg-[#b10e6b] animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-[#b10e6b] animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 rounded-full bg-[#b10e6b] animate-bounce" style={{ animationDelay: '0.4s' }} />
                          <span className="ml-2">Loading albums...</span>
                        </div>
                      </div>
                    ) : archiveBooks.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {archiveBooks.map((book) => {
                          const bookTemplateName = typeof book.templateId === 'string' ? book.templateName || 'Book' : book.templateId?.name || book.templateName || 'Book';
                          const group = groupedArchives.find(g => g.folderName === expandedArchiveId);
                          const matchedArchive = (group?.folderArchives || []).find((archive) => {
                            const archiveAlbumId = typeof archive.albumId === 'string' ? archive.albumId : archive.albumId._id;
                            const bookCurateId = typeof book.curateId === 'string' ? book.curateId : book.curateId?._id;
                            return archiveAlbumId === bookCurateId;
                          }) || group?.folderArchives[0];

                          if (!matchedArchive) return null;

                          return (
                            <div
                              key={book._id}
                              className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl hover:border-[#b10e6b]/30 transition-all duration-500 hover:scale-105 cursor-pointer"
                              onClick={() => void openFullscreenBook(book._id)}
                            >
                              <div className="relative h-56">
                                <img
                                  src={archiveCover(matchedArchive)}
                                  alt={book.albumName}
                                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                
                                <div className="absolute left-4 top-4 rounded-full bg-black/50 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/30">
                                  {bookTemplateName}
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <p className="text-sm font-semibold text-[#211a1b] mb-1 line-clamp-2">{book.albumName}</p>
                                <p className="text-xs text-[#6b5d60] mb-4">Click to view fullscreen</p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-[#6b5d60]">{bookTemplateName}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleDeleteArchive(matchedArchive._id);
                                    }}
                                    className="rounded-full border border-[#edd6df] bg-[#fff5f8] p-2 text-[#b10e6b] hover:bg-[#ffe7ef] transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-[#e9dddd] py-12 text-center">
                        <BookOpen size={32} className="mx-auto text-[#b10e6b]/20 mb-4" />
                        <p className="text-sm text-[#6b5d60]">No albums in this collection yet</p>
                        <p className="text-xs text-[#b10e6b]/60 mt-2">Add one using the form above</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Book Viewer */}

      {selectedFullscreenBook ? (
        <FullscreenBook
          template={selectedFullscreenBook.template as any}
          mediaItems={selectedFullscreenBook.mediaItems}
          coverPhoto={selectedFullscreenBook.coverPhoto}
          coverPhotoName={selectedFullscreenBook.coverPhotoName}
          coverWeddingDate={selectedFullscreenBook.coverWeddingDate}
          onClose={() => setSelectedFullscreenBook(null)}
        />
      ) : null}
    </div>
  );
}
