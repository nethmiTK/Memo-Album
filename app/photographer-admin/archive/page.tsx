'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { ArchiveRestore, Plus, ChevronDown, Folder, FileText, BookOpen } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedAlbums = useMemo(
    () => albums.filter((album) => selectedAlbumIds.includes(album._id)),
    [albums, selectedAlbumIds]
  );

  const loadData = async () => {
    try {
      const [albumResponse, archiveResponse] = await Promise.all([apiFetch('/curate'), apiFetch('/archive')]);
      if (albumResponse.status === 401 || archiveResponse.status === 401) {
        handleAuthError(albumResponse.status === 401 ? albumResponse : archiveResponse);
        return;
      }

      const [albumResult, archiveResult] = await Promise.all([albumResponse.json(), archiveResponse.json()]);
      if (albumResponse.ok && albumResult.success) {
        const nextAlbums = Array.isArray(albumResult.curates) ? albumResult.curates : [];
        setAlbums(nextAlbums);
      }
      if (archiveResponse.ok && archiveResult.success) {
        setArchives(Array.isArray(archiveResult.archives) ? archiveResult.archives : []);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load archive data');
    }
  };

  useEffect(() => {
    loadData();
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
        setIsLoadingArchiveBooks(false);
        return;
      }

      setIsLoadingArchiveBooks(true);
      try {
        const selectedArchive = archives.find((archive) => archive._id === expandedArchiveId);
        const archiveAlbumId = selectedArchive
          ? typeof selectedArchive.albumId === 'string'
            ? selectedArchive.albumId
            : selectedArchive.albumId._id
          : '';

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
            return bookCurateId === archiveAlbumId;
          });
          setArchiveBooks(matchedBooks);
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

      setSelectedFullscreenBook({
        _id: bookAlbum._id,
        albumName: bookAlbum.albumName || curateSource.albumName || 'Album Book',
        coverPhoto: curateSource.coverPhoto || '',
        coverPhotoName: curateSource.coverPhotoName || curateSource.albumName || bookAlbum.albumName || '',
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
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to open book preview');
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

        <div className="mt-6 space-y-4">
          {archives.map((archive) => {
            const isExpanded = expandedArchiveId === archive._id;
            const archiveName = archive.albumTitle || (typeof archive.albumId === 'string' ? archive.albumId : archive.albumId.albumName);

            return (
              <article key={archive._id} className="overflow-hidden rounded-2xl border border-[#e9dddd] bg-[#fffaf9] shadow-sm transition-shadow hover:shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedArchiveId(isExpanded ? null : archive._id);
                    setSelectedFullscreenBook(null);
                  }}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7e3ec] text-[#9b0044]">
                      <Folder size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                        {archive.archiveFolderName}
                      </h3>
                      <p className="text-xs text-[#6b5d60]">{archiveName}</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-[#9b0044] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded ? (
                  <div className="border-t border-[#efe7e4] bg-white px-5 py-5">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">
                      <FileText size={14} />
                      Books in Folder
                    </div>

                    {isLoadingArchiveBooks ? (
                      <div className="rounded-2xl border border-dashed border-[#d7ccc4] py-8 text-center text-sm text-[#6b5d60]">
                        Loading books...
                      </div>
                    ) : archiveBooks.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {archiveBooks.map((book) => {
                          const bookTemplateName = typeof book.templateId === 'string' ? book.templateName || 'Book' : book.templateId?.name || book.templateName || 'Book';

                          return (
                            <button
                              key={book._id}
                              type="button"
                              onClick={() => void openFullscreenBook(book._id)}
                              className="group rounded-2xl border border-[#e1bec4] bg-[#fffdfd] p-4 text-left transition-all hover:border-[#b10e6b] hover:shadow-md"
                            >
                              <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f4] text-[#b10e6b] group-hover:bg-[#fde5ee]">
                                  <BookOpen size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#211a1b]">{book.albumName}</p>
                                  <p className="truncate text-[9px] uppercase tracking-[0.18em] text-[#6b5d60]">{bookTemplateName}</p>
                                </div>
                              </div>
                              <div className="text-[10px] text-[#6b5d60]">Click to open fullscreen view</div>
                            </button>
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
          onClose={() => setSelectedFullscreenBook(null)}
        />
      ) : null}
    </div>
  );
}
