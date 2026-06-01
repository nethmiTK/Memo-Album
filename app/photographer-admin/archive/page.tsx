'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, ChevronDown, Folder, FileText, BookOpen, Trash2, Edit2 } from 'lucide-react';
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

    return Array.from(groups.entries())
      .map(([folderName, folderArchives]) => ({
        folderName,
        folderArchives,
        latestAt: folderArchives.reduce((latest, archive) => {
          const time = archive.archivedAt ? new Date(archive.archivedAt).getTime() : 0;
          return Math.max(latest, time);
        }, 0),
      }))
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [archives]);

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
    <div className="min-h-screen bg-[#fff8f7] px-4 py-8 md:px-8 lg:px-12">
      <Toast message={message} />

      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">Archive Studio</span>
          <h1 className="text-4xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>Create Archive</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5a4c4f]">
            Pick a curate album, group it into a named archive folder, and save it to the archive collection.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <section className="rounded-[1.35rem] bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="text-xl font-semibold text-[#211a1b]">New Archive Card</h2>
            <p className="mt-2 text-sm text-[#6b5d60]">Select an album and define the archive folder name.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">Select Albums (Multiple)</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full rounded-[0.85rem] border border-[#e9dddd] bg-[#fff8f7] px-4 py-3 text-sm text-[#211a1b] outline-none flex items-center justify-between hover:border-[#b10e6b] transition-colors"
                  >
                    <span>{selectedAlbumIds.length > 0 ? `${selectedAlbumIds.length} selected` : 'Choose albums'}</span>
                    <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 rounded-lg border border-[#e9dddd] bg-white shadow-lg max-h-60 overflow-y-auto">
                      {albums.length > 0 ? (
                        albums.map((album) => (
                          <label
                            key={album._id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-[#f7ecef] cursor-pointer border-b border-[#f0e8e6] last:border-b-0"
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
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#211a1b]">{album.albumName}</p>
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

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">Archive Folder Name</label>
                <input
                  value={archiveFolderName}
                  onChange={(event) => setArchiveFolderName(event.target.value)}
                  placeholder="Past Collections / 2023 / Wedding"
                  className="w-full rounded-[0.85rem] border border-[#e9dddd] bg-[#fff8f7] px-4 py-3 text-sm text-[#211a1b] outline-none"
                />
              </div>

              {selectedAlbums.length > 0 ? (
                <div className="rounded-[0.85rem] bg-[#f7ecef] px-4 py-3 text-xs text-[#6b5d60] space-y-1">
                  <p className="font-semibold">Selected: {selectedAlbums.length} album(s)</p>
                  <ul className="text-[10px] space-y-0.5">
                    {selectedAlbums.map((album) => (
                      <li key={album._id}>• {album.albumName}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCreateArchive}
                disabled={selectedAlbumIds.length === 0 || !archiveFolderName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-[0.9rem] bg-[#b10e6b] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Create Archive
              </button>
            </div>
          </section>

          <section className="rounded-[1.35rem] bg-white p-6 shadow-sm lg:col-span-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#efe7e4] pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#211a1b]">Saved Archive Records</h2>
            <p className="text-xs text-[#6b5d60]">Open a folder to reveal the books inside, like a file explorer.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">{archives.length} Records</span>
        </div>

        <div className="mt-6 space-y-5">
          {groupedArchives.map((group) => {
            const isExpanded = expandedArchiveId === group.folderName;
            const representativeArchive = group.folderArchives[0];

            return (
              <article key={group.folderName} className="overflow-hidden rounded-3xl border border-[#e9dddd] bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex w-full items-center justify-between gap-4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedArchiveId(isExpanded ? null : group.folderName);
                      setSelectedFullscreenBook(null);
                      setEditingFolderName('');
                    }}
                    className="flex flex-1 items-center gap-4 text-left"
                  >
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#f7e3ec] text-[#9b0044]">
                      <img src={archiveCover(representativeArchive)} alt={group.folderName} className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/15" />
                      <Folder size={22} className="relative z-10" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                          {group.folderName}
                        </h3>
                        <span className="rounded-full bg-[#f7ecef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">
                          {group.folderArchives.length} albums
                        </span>
                      </div>
                      <p className="text-xs text-[#6b5d60]">File folder · {new Date(group.latestAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <ChevronDown size={18} className={`text-[#9b0044] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingFolderName(group.folderName);
                        setExpandedArchiveId(group.folderName);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-[#edd6df] bg-[#fff5f8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#b10e6b] transition-colors hover:bg-[#ffe7ef]"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteFolder(group.folderName);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-[#edd6df] bg-[#fff5f8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#b10e6b] transition-colors hover:bg-[#ffe7ef]"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-[#efe7e4] bg-[#fcfbfb] px-5 py-5">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">
                      <FileText size={14} />
                      Books in Folder
                    </div>

                    {editingFolderName === group.folderName ? (
                      <div className="mb-5 rounded-2xl border border-[#f0e2e6] bg-white p-4 shadow-sm">
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">Rename folder</label>
                        <div className="flex flex-col gap-3 md:flex-row">
                          <input
                            value={editingFolderName}
                            onChange={(event) => setEditingFolderName(event.target.value)}
                            className="flex-1 rounded-[0.85rem] border border-[#e9dddd] bg-[#fff8f7] px-4 py-3 text-sm text-[#211a1b] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void handleRenameFolder(group.folderName)}
                            className="rounded-[0.85rem] bg-[#b10e6b] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#951254]"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFolderName('')}
                            className="rounded-[0.85rem] border border-[#e9dddd] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#6b5d60] transition-colors hover:bg-[#faf6f7]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="mb-5 rounded-2xl border border-[#f0e2e6] bg-[#fff8f7] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">Add album to this folder</label>
                          <select
                            value={addAlbumId}
                            onChange={(event) => setAddAlbumId(event.target.value)}
                            className="w-full rounded-[0.85rem] border border-[#e9dddd] bg-white px-4 py-3 text-sm text-[#211a1b] outline-none"
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
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleAddAlbumToFolder(group.folderName)}
                          className="rounded-[0.85rem] bg-[#b10e6b] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#951254]"
                        >
                          Add Album
                        </button>
                      </div>
                    </div>

                    {isLoadingArchiveBooks ? (
                      <div className="rounded-2xl border border-dashed border-[#d7ccc4] py-8 text-center text-sm text-[#6b5d60]">
                        Loading books...
                      </div>
                    ) : archiveBooks.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {archiveBooks.map((book) => {
                          const bookTemplateName = typeof book.templateId === 'string' ? book.templateName || 'Book' : book.templateId?.name || book.templateName || 'Book';
                          const matchedArchive = group.folderArchives.find((archive) => {
                            const archiveAlbumId = typeof archive.albumId === 'string' ? archive.albumId : archive.albumId._id;
                            const bookCurateId = typeof book.curateId === 'string' ? book.curateId : book.curateId?._id;
                            return archiveAlbumId === bookCurateId;
                          }) || representativeArchive;

                          return (
                            <article
                              key={book._id}
                              className="group overflow-hidden rounded-[1.1rem] border border-[#e1bec4] bg-white text-left transition-all hover:border-[#b10e6b] hover:shadow-md"
                            >
                              <button
                                type="button"
                                onClick={() => void openFullscreenBook(book._id)}
                                className="block w-full text-left"
                              >
                                <div className="relative overflow-hidden bg-[#f7ecef]">
                                  <img
                                    src={archiveCover(matchedArchive)}
                                    alt={group.folderName}
                                    className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                                    {bookTemplateName}
                                  </div>
                                </div>
                                <div className="p-4">
                                  <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f4] text-[#b10e6b] group-hover:bg-[#fde5ee]">
                                      <BookOpen size={18} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-[#211a1b]">{book.albumName}</p>
                                      <p className="truncate text-[9px] uppercase tracking-[0.18em] text-[#6b5d60]">{bookTemplateName}</p>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-[#6b5d60]">Click to open fullscreen view</p>
                                </div>
                              </button>
                              <div className="flex items-center justify-between border-t border-[#f0e8e6] px-4 py-3">
                                <span className="text-[10px] font-medium text-[#6b5d60]">{matchedArchive.archiveFolderName}</span>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteArchive(matchedArchive._id)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#edd6df] bg-[#fff5f8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#b10e6b] transition-colors hover:bg-[#ffe7ef]"
                                >
                                  <Trash2 size={12} />
                                  Remove
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#d7ccc4] py-8 text-center text-sm text-[#6b5d60]">
                        No books found in this folder.
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}

          {archives.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d7ccc4] p-8 text-center text-sm text-[#6b5d60]">
              No archive records yet.
            </div>
          ) : null}
        </div>
      </section>

        </div>
      </div>

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
