'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers3,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch, handleAuthError } from '@/lib/api';

type CurateMediaItem = {
  id: string;
  order: number;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mediaKind?: 'image' | 'video' | 'other';
  dataUrl?: string;
};

type CurateAlbum = {
  _id: string;
  albumName: string;
  weddingDate?: string;
  coverPhoto?: string;
  status?: string;
  selectedTemplate?: string;
  selectedAlbumId?: string;
  mediaItems?: CurateMediaItem[];
};

type TemplateSlot = {
  id: string;
  label?: string;
  kind?: string;
  width?: number;
  height?: number;
  emphasis?: string;
};

type TemplatePage = {
  pageNumber: number;
  pageLabel?: string;
  slots?: TemplateSlot[];
};

type TemplateRecord = {
  _id: string;
  name: string;
  description?: string;
  accent?: string;
  coverImage?: string;
  coverUrl?: string;
  slots?: TemplateSlot[];
  pages?: TemplatePage[];
};

type PhotoAsset = {
  id: string;
  sourceId: string;
  src: string;
  label: string;
  order: number;
  mediaKind: 'image' | 'video' | 'other';
  fileType?: string;
};

type AssignedSlot = {
  slot: TemplateSlot;
  pageNumber: number;
  pageLabel: string;
};

const formatDate = (value?: string) => {
  if (!value) return 'Recently';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const isVideoType = (fileType?: string, mediaKind?: string) =>
  mediaKind === 'video' || Boolean(fileType && fileType.startsWith('video'));

const toPhotoAssets = (items: CurateMediaItem[] | undefined, coverPhoto?: string): PhotoAsset[] => {
  const normalized = (items || [])
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: item.id || `photo-${index + 1}`,
      sourceId: item.id || `photo-${index + 1}`,
      src: item.dataUrl || coverPhoto || '',
      label: item.fileName || `Image ${index + 1}`,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
      mediaKind: item.mediaKind || 'image',
      fileType: item.fileType || '',
    }))
    .filter((item) => item.src)
    .sort((a, b) => a.order - b.order);

  if (normalized.length === 0 && coverPhoto) {
    return [
      {
        id: 'cover-photo',
        sourceId: 'cover-photo',
        src: coverPhoto,
        label: 'Cover photo',
        order: 1,
        mediaKind: 'image',
      },
    ];
  }

  return normalized;
};

const toTemplatePages = (template?: TemplateRecord | null): AssignedSlot[] => {
  if (!template) return [];

  const pages = Array.isArray(template.pages) && template.pages.length > 0
    ? template.pages
    : [{ pageNumber: 1, pageLabel: 'Page 1', slots: template.slots || [] }];

  return pages.flatMap((page, pageIndex) =>
    (page.slots || []).map((slot) => ({
      slot,
      pageNumber: page.pageNumber || pageIndex + 1,
      pageLabel: page.pageLabel || `Page ${page.pageNumber || pageIndex + 1}`,
    }))
  );
};

const findFirstEmptySlot = (slotOrder: AssignedSlot[], assignments: Record<string, PhotoAsset>) =>
  slotOrder.find((entry) => !assignments[entry.slot.id])?.slot.id || slotOrder[0]?.slot.id || '';

function PhotoTile({
  photo,
  onPick,
}: {
  photo: PhotoAsset;
  onPick: (photo: PhotoAsset) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/json', JSON.stringify(photo));
        event.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onPick(photo)}
      className="group overflow-hidden rounded-2xl border border-[#ead8de] bg-white text-left shadow-[0_10px_24px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-[#f6eef0]">
        {photo.mediaKind === 'video' || isVideoType(photo.fileType, photo.mediaKind) ? (
          <video
            src={photo.src}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            muted
            playsInline
          />
        ) : (
          <img src={photo.src} alt={photo.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
          Drag to frame
        </div>
      </div>
      <div className="px-3 py-3">
        <p className="truncate text-[12px] font-semibold text-[#1c1718]">{photo.label}</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8f7880]">{photo.mediaKind}</p>
      </div>
    </button>
  );
}

function TemplateFrame({
  slotEntry,
  assignment,
  accent,
  onDropPhoto,
  onClear,
}: {
  slotEntry: AssignedSlot;
  assignment?: PhotoAsset;
  accent: string;
  onDropPhoto: (slotId: string, photo: PhotoAsset) => void;
  onClear: (slotId: string) => void;
}) {
  const slot = slotEntry.slot;
  const columnSpan = Math.max(1, Math.min(3, Number(slot.width) || 1));
  const rowSpan = Math.max(1, Math.min(3, Number(slot.height) || 1));

  return (
    <article
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/json');
        if (!raw) return;

        try {
          const photo = JSON.parse(raw) as PhotoAsset;
          onDropPhoto(slot.id, photo);
        } catch {
          toast.error('Could not place the photo');
        }
      }}
      className="relative overflow-hidden rounded-[1.15rem] border bg-[#fffafb]"
      style={{
        borderColor: `${accent}26`,
        gridColumn: `span ${columnSpan}`,
        gridRow: `span ${rowSpan}`,
        minHeight: '130px',
      }}
    >
      {assignment ? (
        assignment.mediaKind === 'video' || isVideoType(assignment.fileType, assignment.mediaKind) ? (
          <video src={assignment.src} className="absolute inset-0 h-full w-full object-cover" controls playsInline />
        ) : (
          <img src={assignment.src} alt={assignment.label} className="absolute inset-0 h-full w-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(155,0,68,0.04))]" />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/8 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-white/80">{slotEntry.pageLabel}</p>
            <p className="mt-1 text-[13px] font-semibold leading-tight">{slot.label || slot.id}</p>
          </div>
          {assignment ? (
            <button
              type="button"
              onClick={() => onClear(slot.id)}
              className="rounded-full bg-black/45 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-black/60"
            >
              Clear
            </button>
          ) : (
            <span className="rounded-full bg-white/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
              Drop here
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/75">{slot.kind || 'frame'}</p>
            <p className="mt-1 text-[12px] leading-tight text-white/90">
              {assignment ? assignment.label : 'Frame waiting for an image'}
            </p>
          </div>
          <div className="rounded-full bg-white/15 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white/85">
            {slot.width || 1} x {slot.height || 1}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CurateTemplatePage() {
  const [albums, setAlbums] = useState<CurateAlbum[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [albumQuery, setAlbumQuery] = useState('');
  const [templateQuery, setTemplateQuery] = useState('');
  const [assignments, setAssignments] = useState<Record<string, PhotoAsset>>({});
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const hasHydratedSelectionRef = useRef(false);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album._id === selectedAlbumId) || albums[0] || null,
    [albums, selectedAlbumId]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template._id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  );

  const templatePages = useMemo(() => {
    if (!selectedTemplate) return [];

    return Array.isArray(selectedTemplate.pages) && selectedTemplate.pages.length > 0
      ? selectedTemplate.pages.map((page, index) => ({
          pageNumber: page.pageNumber || index + 1,
          pageLabel: page.pageLabel || `Page ${page.pageNumber || index + 1}`,
          slots: page.slots || [],
        }))
      : [{ pageNumber: 1, pageLabel: 'Page 1', slots: selectedTemplate.slots || [] }];
  }, [selectedTemplate]);

  const slotOrder = useMemo(
    () =>
      templatePages.flatMap((page, pageIndex) =>
        (page.slots || []).map((slot) => ({
          slot,
          pageNumber: page.pageNumber,
          pageLabel: page.pageLabel || `Page ${pageIndex + 1}`,
        }))
      ),
    [templatePages]
  );

  const currentPage = templatePages[activePageIndex] || templatePages[0] || null;

  const sourcePhotos = useMemo(() => toPhotoAssets(selectedAlbum?.mediaItems, selectedAlbum?.coverPhoto), [selectedAlbum]);
  const filteredAlbums = useMemo(() => {
    const query = albumQuery.trim().toLowerCase();
    if (!query) return albums;

    return albums.filter((album) => {
      const searchable = [album.albumName, album.status, album.weddingDate, album.selectedTemplate].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }, [albums, albumQuery]);

  const filteredTemplates = useMemo(() => {
    const query = templateQuery.trim().toLowerCase();
    if (!query) return templates;

    return templates.filter((template) => {
      const searchable = [template.name, template.description, template.accent].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }, [templates, templateQuery]);

  const assignedCount = Object.keys(assignments).length;
  const emptySlotCount = Math.max(0, slotOrder.length - assignedCount);

  useEffect(() => {
    const loadWorkspace = async () => {
      setIsLoading(true);
      setMessage('');

      try {
        const [albumsResponse, templatesResponse, draftResponse] = await Promise.all([
          apiFetch('/curate'),
          apiFetch('/curate/templates'),
          apiFetch('/curate/current'),
        ]);

        if (albumsResponse.status === 401) {
          handleAuthError(albumsResponse);
          return;
        }

        if (templatesResponse.status === 401) {
          handleAuthError(templatesResponse);
          return;
        }

        if (draftResponse.status === 401) {
          handleAuthError(draftResponse);
          return;
        }

        const [albumsData, templatesData, draftData] = await Promise.all([
          albumsResponse.json(),
          templatesResponse.json(),
          draftResponse.json(),
        ]);

        const nextAlbums = Array.isArray(albumsData.curates) ? albumsData.curates : [];
        const nextTemplates = Array.isArray(templatesData.templates) ? templatesData.templates : [];
        const draft = draftData?.curate || null;

        setAlbums(nextAlbums);
        setTemplates(nextTemplates);

        const resolvedAlbum = draft?.selectedAlbumId
          ? nextAlbums.find((album: CurateAlbum) => album._id === draft.selectedAlbumId)
          : draft?.albumName
            ? nextAlbums.find((album: CurateAlbum) => album.albumName === draft.albumName)
            : nextAlbums[0] || null;

        const resolvedTemplate = draft?.selectedTemplate
          ? nextTemplates.find((template: TemplateRecord) => template._id === draft.selectedTemplate)
          : nextTemplates[0] || null;

        setSelectedAlbumId(resolvedAlbum?._id || nextAlbums[0]?._id || '');
        setSelectedTemplateId(resolvedTemplate?._id || nextTemplates[0]?._id || '');

        const initialTemplate = resolvedTemplate || nextTemplates[0] || null;
        const initialSlots = toTemplatePages(initialTemplate);
        const draftPhotos = toPhotoAssets(
          Array.isArray(draft?.mediaItems) ? draft.mediaItems : resolvedAlbum?.mediaItems,
          resolvedAlbum?.coverPhoto
        );

        const nextAssignments: Record<string, PhotoAsset> = {};
        initialSlots.forEach((entry, index) => {
          const photo = draftPhotos[index];
          if (photo) {
            nextAssignments[entry.slot.id] = photo;
          }
        });
        setAssignments(nextAssignments);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load book view';
        setMessage(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!hasHydratedSelectionRef.current) {
      hasHydratedSelectionRef.current = true;
      return;
    }

    setActivePageIndex(0);
    setAssignments({});
  }, [selectedAlbumId, selectedTemplateId]);

  const placePhoto = (slotId: string, photo: PhotoAsset) => {
    setAssignments((current) => ({
      ...current,
      [slotId]: photo,
    }));
  };

  const clearSlot = (slotId: string) => {
    setAssignments((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
  };

  const placePhotoInFirstEmptySlot = (photo: PhotoAsset) => {
    const slotId = findFirstEmptySlot(slotOrder, assignments);
    if (!slotId) return;
    placePhoto(slotId, photo);
  };

  const resetAssignments = () => {
    setAssignments({});
    toast.success('Layout cleared');
  };

  const saveLayout = async () => {
    if (!selectedAlbum || !selectedTemplate) {
      toast.error('Pick an album and a template first');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const orderedSlots = templatePages.flatMap((page) => page.slots || []);
      const orderedAssigned = orderedSlots
        .map((slot) => assignments[slot.id])
        .filter((photo): photo is PhotoAsset => Boolean(photo));

      const usedIds = new Set(orderedAssigned.map((photo) => photo.sourceId));
      const remainingPhotos = sourcePhotos.filter((photo) => !usedIds.has(photo.sourceId));

      const mediaItems = [...orderedAssigned, ...remainingPhotos].map((photo, index) => ({
        id: `media-${index + 1}`,
        order: index + 1,
        fileName: photo.label,
        fileType: photo.fileType || (photo.mediaKind === 'video' ? 'video/mp4' : 'image/jpeg'),
        fileSize: 0,
        mediaKind: photo.mediaKind,
        dataUrl: photo.src,
      }));

      const response = await apiFetch('/curate', {
        method: 'POST',
        body: JSON.stringify({
          albumName: selectedAlbum.albumName,
          weddingDate: selectedAlbum.weddingDate || '',
          accessControl: 'private',
          coverPhoto: selectedAlbum.coverPhoto || sourcePhotos[0]?.src || '',
          coverPhotoName: sourcePhotos[0]?.label || '',
          selectedAlbumId: selectedAlbum._id,
          selectedTemplate: selectedTemplate._id,
          mediaItems,
          progress: Math.min(100, Math.round((assignedCount / Math.max(1, slotOrder.length)) * 100)),
          status: 'saved',
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save book layout');
      }

      toast.success('Book layout saved');
      setMessage('Book layout saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save book layout';
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7eef1] text-[#1b1718]">
      <header className="border-b border-[#e8d6dd] bg-[#fff7f8]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/photographer-admin/curate"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e1bec4] text-[#7f656c] transition-colors hover:border-[#9b0044] hover:text-[#9b0044]"
              aria-label="Back to curate"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8b7178]">Curate Template Book View</p>
              <h1 className="font-['Libre_Caslon_Text'] text-[24px] leading-none text-[#9b0044] md:text-[30px]">
                Album, template and frame assignment
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f656c]">
            <span className="rounded-full border border-[#e1bec4] px-3 py-1">Albums {albums.length}</span>
            <span className="rounded-full border border-[#e1bec4] px-3 py-1">Templates {templates.length}</span>
            <span className="rounded-full border border-[#e1bec4] px-3 py-1">Frames {slotOrder.length}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {message ? (
          <div className="mb-5 rounded-[0.9rem] border border-[#e1bec4] bg-white px-4 py-3 text-[13px] text-[#61464e] shadow-sm">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.3rem] border border-[#e1bec4] bg-white px-6 py-16 text-center text-[13px] text-[#7a6268] shadow-sm">
            Loading album and template workspace...
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
              <aside className="space-y-5 rounded-[1.4rem] border border-[#e4ced6] bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b7178]">Customer Album</p>
                  <p className="mt-1 text-[13px] text-[#7f656c]">Choose the album that will feed the frames.</p>
                </div>

                <div className="rounded-2xl border border-[#ead8de] bg-[#fff8f9] px-3 py-2">
                  <input
                    value={albumQuery}
                    onChange={(event) => setAlbumQuery(event.target.value)}
                    placeholder="Search album by name, date, status"
                    className="w-full bg-transparent text-[13px] text-[#1c1718] outline-none placeholder:text-[#a88e96]"
                  />
                </div>

                <div className="space-y-3">
                  {filteredAlbums.length > 0 ? (
                    filteredAlbums.map((album) => {
                      const active = album._id === selectedAlbumId;
                      return (
                        <button
                          key={album._id}
                          type="button"
                          onClick={() => setSelectedAlbumId(album._id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-[#9b0044] bg-[#fff3f6]' : 'border-[#ead8de] bg-[#fffefe] hover:border-[#c898a8]'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[0.8rem] bg-[#f5e8ec] text-[9px] font-bold uppercase tracking-[0.18em] text-[#9b0044]">
                              {String(album.albumName || 'AL').slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-[#1c1718]">{album.albumName}</p>
                              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8b7178]">{formatDate(album.weddingDate)}</p>
                              <p className="mt-1 text-[11px] text-[#6f5b61]">{album.status || 'draft'}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#e1bec4] px-4 py-6 text-center text-[13px] text-[#7f656c]">
                      No albums match the search.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#ead8de] bg-[#fff8f9] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b7178]">Selected Album</p>
                  <p className="mt-2 font-['Libre_Caslon_Text'] text-[22px] leading-tight text-[#1b1718]">
                    {selectedAlbum?.albumName || 'No album selected'}
                  </p>
                  <p className="mt-2 text-[12px] leading-6 text-[#6f5b61]">
                    {selectedAlbum?.status || 'draft'} · {sourcePhotos.length} photos available
                  </p>
                </div>
              </aside>

              <section className="rounded-3xl border border-[#e4ced6] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)] md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b7178]">Book Preview</p>
                    <p className="mt-1 text-[13px] text-[#7f656c]">Drag photos from the tray into the template frames.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePageIndex((index) => Math.max(0, index - 1))}
                      disabled={activePageIndex <= 0}
                      className="inline-flex items-center gap-1 rounded-full border border-[#ead8de] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f656c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePageIndex((index) => Math.min(templatePages.length - 1, index + 1))}
                      disabled={activePageIndex >= templatePages.length - 1}
                      className="inline-flex items-center gap-1 rounded-full border border-[#ead8de] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f656c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-[#eddbe1] bg-[linear-gradient(180deg,#fff9fa,#fff)] p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1e2e7] pb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b7178]">{currentPage?.pageLabel || 'Page'}</p>
                      <p className="mt-1 text-[12px] text-[#7f656c]">
                        {selectedTemplate?.description || 'Choose a frame and drop images into the empty areas.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-[#e7cdd6] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9b0044]">
                      {currentPage?.slots?.length || 0} frames
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {(currentPage?.slots || []).length > 0 ? (
                      currentPage!.slots!.map((slot) => {
                        const slotEntry = slotOrder.find((entry) => entry.slot.id === slot.id) || {
                          slot,
                          pageNumber: currentPage?.pageNumber || 1,
                          pageLabel: currentPage?.pageLabel || 'Page 1',
                        };

                        return (
                          <TemplateFrame
                            key={slot.id}
                            slotEntry={slotEntry}
                            assignment={assignments[slot.id]}
                            accent={selectedTemplate?.accent || '#9b0044'}
                            onDropPhoto={placePhoto}
                            onClear={clearSlot}
                          />
                        );
                      })
                    ) : (
                      <div className="col-span-full rounded-2xl border border-dashed border-[#e4ced6] px-6 py-10 text-center text-[13px] text-[#7f656c]">
                        This template has no frames yet.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <aside className="space-y-5 rounded-[1.4rem] border border-[#e4ced6] bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b7178]">Template Choice</p>
                  <p className="mt-1 text-[13px] text-[#7f656c]">Pick a template and the frame grid updates live.</p>
                </div>

                <div className="rounded-2xl border border-[#ead8de] bg-[#fff8f9] px-3 py-2">
                  <input
                    value={templateQuery}
                    onChange={(event) => setTemplateQuery(event.target.value)}
                    placeholder="Search template by name or description"
                    className="w-full bg-transparent text-[13px] text-[#1c1718] outline-none placeholder:text-[#a88e96]"
                  />
                </div>

                <div className="space-y-3">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => {
                      const active = template._id === selectedTemplateId;
                      const pageCount = Array.isArray(template.pages) && template.pages.length > 0 ? template.pages.length : 1;

                      return (
                        <button
                          key={template._id}
                          type="button"
                          onClick={() => setSelectedTemplateId(template._id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-[#9b0044] bg-[#fff3f6]' : 'border-[#ead8de] bg-[#fffefe] hover:border-[#c898a8]'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-[#1c1718]">{template.name}</p>
                              <p className="mt-1 text-[12px] leading-5 text-[#6f5b61]">{template.description || 'No description'}</p>
                            </div>
                            <span className="rounded-full border border-[#e7cdd6] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[#9b0044]">
                              {pageCount} pages
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#e1bec4] px-4 py-6 text-center text-[13px] text-[#7f656c]">
                      No templates match the search.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#ead8de] bg-[#fff8f9] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b7178]">
                    <Sparkles className="h-4 w-4 text-[#9b0044]" />
                    Layout Summary
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-[0.9rem] border border-[#eedbe1] bg-white px-3 py-4">
                      <p className="text-[24px] font-semibold text-[#1c1718]">{assignedCount}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8b7178]">Placed</p>
                    </div>
                    <div className="rounded-[0.9rem] border border-[#eedbe1] bg-white px-3 py-4">
                      <p className="text-[24px] font-semibold text-[#1c1718]">{emptySlotCount}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8b7178]">Empty</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-[12px] leading-5 text-[#6f5b61]">
                    <p>Album: {selectedAlbum?.albumName || 'None selected'}</p>
                    <p>Template: {selectedTemplate?.name || 'None selected'}</p>
                    <p>Page: {currentPage?.pageLabel || 'Page 1'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetAssignments}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[0.9rem] border border-[#e5cfd7] bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f656c] transition hover:border-[#9b0044] hover:text-[#9b0044]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={saveLayout}
                    disabled={isSaving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[0.9rem] bg-[#9b0044] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(155,0,68,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving' : 'Save'}
                  </button>
                </div>
              </aside>
            </section>

            <section className="rounded-3xl border border-[#e4ced6] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)] md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b7178]">Album Photos</p>
                  <p className="mt-1 text-[13px] text-[#7f656c]">Drag these images into the book frames above.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f656c]">
                  <Layers3 className="h-4 w-4 text-[#9b0044]" />
                  {sourcePhotos.length} photos ready
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {sourcePhotos.length > 0 ? (
                  sourcePhotos.map((photo) => (
                    <PhotoTile key={photo.id} photo={photo} onPick={placePhotoInFirstEmptySlot} />
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl border border-dashed border-[#e4ced6] px-6 py-10 text-center text-[13px] text-[#7f656c]">
                    No images are available in the selected album yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
} 