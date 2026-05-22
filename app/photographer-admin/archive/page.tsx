'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, Plus } from 'lucide-react';
import { apiFetch, handleAuthError } from '@/lib/api';

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

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <div className="fixed right-5 top-5 z-50 rounded-2xl bg-[#1f1a1b] px-4 py-3 text-sm text-white shadow-2xl">{message}</div>;
}

export default function ArchivePage() {
  const [albums, setAlbums] = useState<CurateAlbum[]>([]);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [archiveFolderName, setArchiveFolderName] = useState('');
  const [message, setMessage] = useState('');

  const selectedAlbum = useMemo(
    () => albums.find((album) => album._id === selectedAlbumId) || null,
    [albums, selectedAlbumId]
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
        if (!selectedAlbumId && nextAlbums.length) {
          setSelectedAlbumId(nextAlbums[0]._id);
        }
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

  const archiveCover = (archive: ArchiveItem) => {
    if (typeof archive.albumId === 'string') return archive.albumCoverPhoto || '';
    return archive.albumCoverPhoto || archive.albumId.coverPhoto || '';
  };

  const handleCreateArchive = async () => {
    if (!selectedAlbumId || !archiveFolderName.trim()) {
      setMessage('Select an album and enter an archive folder name.');
      return;
    }

    try {
      const response = await apiFetch('/archive', {
        method: 'POST',
        body: JSON.stringify({ albumId: selectedAlbumId, archiveFolderName }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create archive');
      }

      setArchiveFolderName('');
      setMessage('Archive saved successfully.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to archive album');
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
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#6b5d60]">Select Album</label>
                <select
                  value={selectedAlbumId}
                  onChange={(event) => setSelectedAlbumId(event.target.value)}
                  className="w-full rounded-[0.85rem] border border-[#e9dddd] bg-[#fff8f7] px-4 py-3 text-sm text-[#211a1b] outline-none"
                >
                  <option value="">Choose album</option>
                  {albums.map((album) => (
                    <option key={album._id} value={album._id}>{album.albumName}</option>
                  ))}
                </select>
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

              {selectedAlbum ? (
                <div className="rounded-[0.85rem] bg-[#f7ecef] px-4 py-3 text-xs text-[#6b5d60]">
                  Selected: {selectedAlbum.albumName}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCreateArchive}
                className="flex w-full items-center justify-center gap-2 rounded-[0.9rem] bg-[#b10e6b] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white"
              >
                <Plus size={16} /> Create Archive
              </button>
            </div>
          </section>

          <section className="rounded-[1.35rem] bg-white p-6 shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#efe7e4] pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#211a1b]">Saved Archive Records</h2>
                <p className="text-xs text-[#6b5d60]">These records also appear in Past Collections on Gallery.</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b10e6b]">{archives.length} Records</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {archives.map((archive) => (
                <article key={archive._id} className="overflow-hidden rounded-2xl border border-[#f0e8e6] bg-[#fffaf9]">
                  <div className="aspect-square overflow-hidden bg-[#f6f3f0]">
                    <img
                      src={archiveCover(archive) || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce8d2?w=900&q=80'}
                      alt={typeof archive.albumId === 'string' ? archive.albumTitle || archive.albumId : archive.albumId.albumName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl text-black" style={{ fontFamily: "'Newsreader', serif" }}>
                          {archive.albumTitle || (typeof archive.albumId === 'string' ? archive.albumId : archive.albumId.albumName)}
                        </h3>
                        <p className="mt-1 text-xs text-[#6b5d60]">Folder: {archive.archiveFolderName}</p>
                      </div>
                      <span className="rounded bg-[#eaddff] px-2 py-0.5 text-[9px] font-bold uppercase text-[#201b24]">Archived</span>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-[#efe7e4] pt-4">
                      <span className="text-[10px] uppercase tracking-widest text-[#6b5d60]">{archive.archivedAt ? new Date(archive.archivedAt).toLocaleDateString() : 'Recently'}</span>
                      <button className="text-[#b10e6b] transition-opacity hover:opacity-80">
                        <ArchiveRestore size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {archives.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d7ccc4] p-8 text-center text-sm text-[#6b5d60] md:col-span-2">
                  No archive records yet.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
