'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { toast } from 'react-toastify';
import { apiFetch, handleAuthError } from '@/lib/api';
import { TEMPLATE_CHOICES, type TemplateId } from './templates';

type CurateMedia = {
  id: string;
  order: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  mediaKind: 'image' | 'video' | 'other';
};

type SpreadSlot = {
  slot: string;
  mediaId: string;
  mediaOrder: number;
  mediaKind: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
};

type TemplateSpread = {
  spreadNumber: number;
  pageLeft: number;
  pageRight: number;
  templateId: TemplateId;
  slots: SpreadSlot[];
};

type CurateDraftResponse = {
  success: boolean;
  curate: {
    _id?: string;
    albumName: string;
    weddingDate?: string;
    accessControl?: 'public' | 'private';
    coverPhoto?: string;
    coverPhotoName?: string;
    mediaItems: CurateMedia[];
    selectedTemplate?: TemplateId;
  } | null;
};

type CurateDraftListResponse = {
  success: boolean;
  curates: Array<{
    _id: string;
    albumName: string;
    weddingDate?: string;
    selectedTemplate?: TemplateId;
    mediaItems?: CurateMedia[];
  }>;
};

type TemplatePreviewResponse = {
  success: boolean;
  spreads: TemplateSpread[];
  templateId: TemplateId;
};

const FlipBook = HTMLFlipBook as any;

const SLOT_STYLE_MAP: Record<string, string> = {
  leftHero: 'col-span-2 row-span-2',
  leftWide: 'col-span-2 row-span-1',
  leftTop: 'col-span-2 row-span-1',
  leftMain: 'col-span-2 row-span-2',
  leftInset: 'col-span-1 row-span-1',
  leftInsetA: 'col-span-1 row-span-1',
  leftInsetB: 'col-span-1 row-span-1',
  leftBottom: 'col-span-2 row-span-1',
  leftCard: 'col-span-1 row-span-1',
  leftTall: 'col-span-1 row-span-3',
  rightHero: 'col-span-2 row-span-3',
  rightTop: 'col-span-2 row-span-1',
  rightMain: 'col-span-2 row-span-2',
  rightInset: 'col-span-1 row-span-1',
  rightBottomMain: 'col-span-1 row-span-2',
  rightBottomSide: 'col-span-1 row-span-2',
  rightBottomA: 'col-span-1 row-span-1',
  rightBottomB: 'col-span-1 row-span-1',
  rightBottom: 'col-span-2 row-span-1',
  rightCard: 'col-span-1 row-span-1',
  rightFooter: 'col-span-2 row-span-1',
};

function getTemplateName(templateId: TemplateId) {
  return TEMPLATE_CHOICES.find((template) => template.id === templateId)?.name || 'Template';
}

function BookSlot({ slot }: { slot: SpreadSlot }) {
  const slotClass = SLOT_STYLE_MAP[slot.slot] || 'col-span-1 row-span-1';

  return (
    <div className={`relative overflow-hidden rounded-[0.85rem] bg-[#efe7e5] ${slotClass}`}>
      {slot.dataUrl ? (
        slot.mediaKind === 'video' ? (
          <video src={slot.dataUrl} className="h-full w-full object-cover" muted loop autoPlay playsInline />
        ) : (
          <img src={slot.dataUrl} alt={slot.fileName || slot.mediaId} className="h-full w-full object-cover" />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d7d81]">
          Empty slot
        </div>
      )}
      <div className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold text-white">
        #{slot.mediaOrder}
      </div>
    </div>
  );
}

function SpreadPage({ spread }: { spread: TemplateSpread }) {
  const leftSlots = spread.slots.filter((slot) => slot.slot.startsWith('left'));
  const rightSlots = spread.slots.filter((slot) => slot.slot.startsWith('right'));
  const leftHero = leftSlots[0] || null;
  const rightHero = rightSlots[0] || null;

  return (
    <article className="h-full w-full bg-white p-4 md:p-6">
      <div className="grid h-full w-full grid-cols-2 gap-4">
        <section className="relative overflow-hidden rounded-2xl border border-[#f0e8e6] bg-[#efe7e5]">
          {leftHero?.dataUrl ? (
            leftHero.mediaKind === 'video' ? (
              <video src={leftHero.dataUrl} className="h-full min-h-145 w-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={leftHero.dataUrl} alt={leftHero.fileName || leftHero.mediaId} className="h-full min-h-145 w-full object-cover" />
            )
          ) : (
            <div className="flex h-full min-h-145 items-center justify-center text-[11px] text-[#8d7d81]">Left page empty</div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-[#f0e8e6] bg-[#efe7e5]">
          {rightHero?.dataUrl ? (
            rightHero.mediaKind === 'video' ? (
              <video src={rightHero.dataUrl} className="h-full min-h-145 w-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={rightHero.dataUrl} alt={rightHero.fileName || rightHero.mediaId} className="h-full min-h-145 w-full object-cover" />
            )
          ) : (
            <div className="flex h-full min-h-145 items-center justify-center text-[11px] text-[#8d7d81]">Right page empty</div>
          )}
        </section>
      </div>
    </article>
  );
}

export default function TemplateWorkspacePage() {
  const router = useRouter();
  const bookRef = useRef<any>(null);
  const previewHoverRef = useRef(false);
  const lastPreviewMoveRef = useRef(0);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('template-1');
  const [spreads, setSpreads] = useState<TemplateSpread[]>([]);
  const [mediaItems, setMediaItems] = useState<CurateMedia[]>([]);
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [albumName, setAlbumName] = useState('Untitled Curate Draft');
  const [weddingDate, setWeddingDate] = useState('');
  const [accessControl, setAccessControl] = useState<'public' | 'private'>('public');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [coverPhotoName, setCoverPhotoName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [draftAlbums, setDraftAlbums] = useState<CurateDraftListResponse['curates']>([]);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const flipBookKey = `${selectedDraftId || 'draft'}-${selectedTemplate}-${spreads.length}`;

  const flipNext = () => bookRef.current?.pageFlip?.().flipNext?.();
  const flipPrev = () => bookRef.current?.pageFlip?.().flipPrev?.();

  const toastStyle = {
    style: {
      background: '#FDF3F2',
      color: '#000',
    },
  } as const;

  const orderedAssets = useMemo(
    () => [...mediaItems].sort((a, b) => a.order - b.order),
    [mediaItems]
  );

  const loadDraft = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/curate/current');
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result: CurateDraftResponse = await response.json();
      if (!response.ok || !result.success || !result.curate) {
        throw new Error('Curate draft not found');
      }

      setAlbumName(result.curate.albumName || 'Untitled Curate Draft');
      setWeddingDate(result.curate.weddingDate ? result.curate.weddingDate.slice(0, 10) : '');
      setAccessControl(result.curate.accessControl || 'public');
      setCoverPhoto(result.curate.coverPhoto || '');
      setCoverPhotoName(result.curate.coverPhotoName || '');
      setMediaItems(Array.isArray(result.curate.mediaItems) ? result.curate.mediaItems : []);
      setSelectedTemplate(result.curate.selectedTemplate || 'template-1');
      setSelectedDraftId(result.curate._id || '');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to load curate draft');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraftAlbums = async () => {
    try {
      const response = await apiFetch('/curate');
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result: CurateDraftListResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error('Failed to load saved albums');
      }

      setDraftAlbums(Array.isArray(result.curates) ? result.curates : []);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to load saved albums');
    }
  };

  const loadTemplatePreview = async (templateId: TemplateId) => {
    try {
      const response = await apiFetch(`/curate/current/template-preview?template=${templateId}`);
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result: TemplatePreviewResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error('Failed to generate template preview');
      }

      setSpreads(Array.isArray(result.spreads) ? result.spreads : []);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to load template preview');
    }
  };

  const saveTemplateState = async (templateId: TemplateId, nextMediaItems: CurateMedia[], status: 'save_draft' | 'saved' = 'save_draft') => {
    try {
      const payload = {
        albumName,
        weddingDate: weddingDate || new Date().toISOString().split('T')[0],
        accessControl,
        coverPhoto,
        coverPhotoName,
        status,
        selectedTemplate: templateId,
        mediaItems: nextMediaItems.map((item, index) => ({
          ...item,
          order: index + 1,
          id: item.id || `media-${index + 1}`,
        })),
      };

      const response = await apiFetch('/curate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return false;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Save failed');
      }

      toast.success(status === 'saved' ? 'Template saved' : 'Draft saved', toastStyle);
      return true;
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save');
      toast.error(error instanceof Error ? error.message : 'Failed to save', toastStyle);
      return false;
    }
  };

  const handleTemplateSelect = async (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    const saved = await saveTemplateState(templateId, orderedAssets, 'save_draft');
    if (saved) {
      setSaveMessage('Template selected and synced');
      toast.success('Template selected', toastStyle);
      await loadTemplatePreview(templateId);
    }
  };

  const handleDragStart = (mediaId: string) => setDraggedMediaId(mediaId);

  const handleDrop = async (targetMediaId: string) => {
    if (!draggedMediaId || draggedMediaId === targetMediaId) return;

    const next = [...orderedAssets];
    const from = next.findIndex((item) => item.id === draggedMediaId);
    const to = next.findIndex((item) => item.id === targetMediaId);
    if (from < 0 || to < 0) return;

    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const normalized = next.map((item, index) => ({ ...item, order: index + 1 }));
    setMediaItems(normalized);
    setDraggedMediaId(null);

    const saved = await saveTemplateState(selectedTemplate, normalized, 'save_draft');
    if (saved) {
      setSaveMessage('Narrative order saved');
      toast.success('Order saved', toastStyle);
      await loadTemplatePreview(selectedTemplate);
    }
  };

  useEffect(() => {
    loadDraft();
    loadDraftAlbums();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const isIdle = Date.now() - lastPreviewMoveRef.current > 2500;
      if (!previewHoverRef.current && isIdle && spreads.length > 0) {
        flipNext();
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [spreads.length]);

  useEffect(() => {
    if (!isLoading) {
      loadTemplatePreview(selectedTemplate);
    }
  }, [selectedTemplate, isLoading]);

  useEffect(() => {
    if (!selectedDraftId) return;

    const selectedAlbum = draftAlbums.find((draft) => draft._id === selectedDraftId);
    if (!selectedAlbum) return;

    setAlbumName(selectedAlbum.albumName || albumName);
    setMediaItems(Array.isArray(selectedAlbum.mediaItems) ? selectedAlbum.mediaItems : []);
    const nextTemplate = selectedAlbum.selectedTemplate || selectedTemplate;
    if (selectedAlbum.selectedTemplate) {
      setSelectedTemplate(selectedAlbum.selectedTemplate);
    }
    loadTemplatePreview(nextTemplate);
  }, [selectedDraftId, draftAlbums]);

  return (
    <div className="min-h-screen bg-[#fff8f8] px-4 py-8 text-[#211a1b] md:px-6 lg:px-8">
      <main className="mx-auto max-w-400 space-y-10">
        <section className="space-y-3">
          <h2 className="font-[Newsreader] text-4xl italic md:text-5xl">Template Workspace</h2>
          <p className="text-[15px] text-[#5a4c4f]">First select a template, then the book preview auto-builds from curate media IDs in saved order.</p>
          {saveMessage ? <p className="text-sm font-semibold text-[#b10e6b]">{saveMessage}</p> : null}
        </section>

        <section className="rounded-[1.35rem] bg-white/90 p-6 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)]">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-65 flex-1">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b5d60]">Select Saved Album</label>
              <select
                value={selectedDraftId}
                onChange={(event) => setSelectedDraftId(event.target.value)}
                className="w-full rounded-[0.85rem] border border-[#e9dddd] bg-[#fff8f7] px-4 py-3 text-sm text-[#211a1b] outline-none"
              >
                <option value="">Current working draft</option>
                {draftAlbums.map((draft) => (
                  <option key={draft._id} value={draft._id}>
                    {draft.albumName}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[0.85rem] bg-[#f7ecef] px-4 py-3 text-xs text-[#6b5d60]">
              Selected album controls the media order shown in the template preview.
            </div>
          </div>
        </section>

        <section className="rounded-[1.35rem] bg-white/90 p-6 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h3 className="font-[Newsreader] text-2xl italic">Narrative Flow</h3>
              <span className="rounded-full bg-[#ecd4db] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">Drag to Reorder</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b5d60]">{orderedAssets.length} Assets</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-flex items-center gap-4">
              {orderedAssets.map((asset, index) => (
                <button
                  key={asset.id}
                  type="button"
                  draggable
                  onDragStart={() => handleDragStart(asset.id)}
                  onDragEnd={() => setDraggedMediaId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(asset.id)}
                  className={`group relative h-48 w-36 shrink-0 overflow-hidden rounded-[0.85rem] border border-[#ecdfe2] bg-[#f7ecef] text-left transition-transform hover:scale-[1.02] ${draggedMediaId === asset.id ? 'opacity-60' : ''}`}
                >
                  {asset.dataUrl ? (
                    <img src={asset.dataUrl} alt={asset.fileName || asset.id} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-[#8d7d81]">No preview</div>
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 text-white">
                    <span className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold">{index + 1}</span>
                    <GripVertical className="h-4 w-4 opacity-80" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-[1.35rem] bg-white/90 p-6 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b5d60]">Select Template</span>
            {TEMPLATE_CHOICES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  selectedTemplate === template.id
                    ? 'bg-[#b10e6b] text-white'
                    : 'bg-[#efe4e6] text-[#5a4c4f] hover:bg-[#e5d6d9]'
                }`}
              >
                {template.name}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {TEMPLATE_CHOICES.map((template) => (
              <article
                key={template.id}
                className={`rounded-[0.85rem] border p-4 ${
                  selectedTemplate === template.id ? 'border-[#b10e6b] bg-[#fff1f8]' : 'border-[#f0e8e6] bg-[#fbf7f8]'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">{template.id.toUpperCase()}</p>
                <h4 className="mt-2 font-[Newsreader] text-xl italic">{template.name}</h4>
                <p className="mt-2 text-xs leading-5 text-[#6b5d60]">{template.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.35rem] bg-white/90 p-6 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-[Newsreader] text-2xl italic">Spread Editorial</h3>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#6b5d60]">
                {`Pages 12 & 13 • 0.5" Inner Margin • ${getTemplateName(selectedTemplate)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={flipPrev} className="rounded-full bg-[#ebe0e1] p-3 text-[#534345] hover:bg-[#f0e6e8]" aria-label="Previous spread">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={flipNext} className="rounded-full bg-[#b10e6b] p-3 text-white hover:opacity-90" aria-label="Next spread">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#fff8f7] p-4 md:p-6">
            <div className="mb-3 flex items-center justify-end text-[10px] italic text-[#b10e6b]/70">
              <span className="mr-2 h-2 w-2 rounded-full bg-[#b10e6b]" />
              Dynamic Asset Rotation
            </div>

            <div
              className="overflow-hidden rounded-2xl bg-[#fff8f7]"
              onMouseEnter={() => {
                previewHoverRef.current = true;
                lastPreviewMoveRef.current = Date.now();
              }}
              onMouseMove={() => {
                lastPreviewMoveRef.current = Date.now();
              }}
              onMouseLeave={() => {
                previewHoverRef.current = false;
              }}
            >
              {spreads.length > 0 ? (
                <FlipBook
                  key={flipBookKey}
                  ref={bookRef}
                  width={560}
                  height={760}
                  size="stretch"
                  minWidth={320}
                  maxWidth={1100}
                  minHeight={420}
                  maxHeight={900}
                  showCover={false}
                  mobileScrollSupport
                  className="mx-auto"
                  style={{}}
                >
                  {spreads.map((spread) => (
                    <SpreadPage key={`${selectedDraftId || 'draft'}-${spread.templateId}-${spread.spreadNumber}`} spread={spread} />
                  ))}
                </FlipBook>
              ) : (
                <article className="flex h-190 w-full items-center justify-center bg-white p-8">
                  <div className="text-center">
                    <h4 className="font-[Newsreader] text-3xl italic text-[#211a1b]">No assets yet</h4>
                    <p className="mt-2 text-sm text-[#6b5d60]">Upload images in curate step, then template pages will auto-loop.</p>
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-4 justify-end">
          <button
            type="button"
            onClick={async () => {
              const saved = await saveTemplateState(selectedTemplate, orderedAssets, 'save_draft');
              if (saved) {
                setSaveMessage('Draft saved');
              }
            }}
            className="rounded-[0.9rem] bg-[#ebe0e1] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#534345]"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={async () => {
              const saved = await saveTemplateState(selectedTemplate, orderedAssets, 'saved');
              if (saved) {
                toast.success('Saved and moving to clients', toastStyle);
                router.push('/photographer-admin/clients');
              }
            }}
            className="rounded-[0.9rem] bg-[#b10e6b] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white"
          >
            Next
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await apiFetch('/curate/current', { method: 'DELETE' });
                if (response.status === 401) {
                  handleAuthError(response);
                  return;
                }
                if (!response.ok) throw new Error('Failed to discard draft');
                toast.success('Draft discarded', toastStyle);
                router.push('/photographer-admin/curate');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to discard draft', toastStyle);
              }
            }}
            className="rounded-[0.9rem] bg-[#ebe0e1] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#534345]"
          >
            Discard
          </button>
        </section>
      </main>
    </div>
  );
}
