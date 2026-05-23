'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, GripVertical, ImagePlus, Plus } from 'lucide-react';
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

function renderFrame(slot: SpreadSlot | null, emptyLabel: string) {
  if (!slot?.dataUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#8d7d81]">{emptyLabel}</span>
      </div>
    );
  }

  if (slot.mediaKind === 'video') {
    return <video src={slot.dataUrl} className="h-full w-full object-cover" muted loop autoPlay playsInline />;
  }

  return <img src={slot.dataUrl} alt={slot.fileName || slot.mediaId} className="h-full w-full object-cover" />;
}

function SpreadPage({ spread }: { spread: TemplateSpread }) {
  const leftSlots = spread.slots.filter((slot) => slot.slot.startsWith('left'));
  const rightSlots = spread.slots.filter((slot) => slot.slot.startsWith('right'));
  const leftPrimary = leftSlots[0] || null;
  const leftSecondary = leftSlots[1] || null;
  const leftTertiary = leftSlots[2] || null;
  const rightPrimary = rightSlots[0] || null;

  return (
    <article
      className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden bg-white shadow-[0_24px_55px_rgba(0,0,0,0.14)] md:flex-row"
      style={{ borderRadius: 2 }}
    >
      <div className="absolute inset-y-0 left-1/2 z-20 hidden w-px -translate-x-1/2 bg-[#f2eded] md:block" />
      <div
        className="absolute inset-y-0 left-1/2 z-10 hidden w-10 -translate-x-1/2 md:block"
        style={{ backgroundImage: 'linear-gradient(to right, transparent, #ece5e4, transparent)' }}
      />

      <section className="relative w-full p-8 md:w-1/2 md:p-10">
        <div className="flex h-full flex-col gap-6" style={{ minHeight: 580 }}>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">PAGE {spread.pageLeft}</span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4">
            <div className="row-span-2 overflow-hidden rounded-sm border border-[#e4dbd8] bg-[#efe7e5]">{renderFrame(leftPrimary, 'No preview')}</div>

            <div className="flex h-full flex-col gap-4">
              <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-[#e4dbd8] bg-[#f5efec]">
                {renderFrame(leftSecondary, 'No preview')}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#e8bdca] bg-[#fff7f8] text-center" style={{ minHeight: 150 }}>
                {leftTertiary?.dataUrl ? (
                  <div className="h-full w-full overflow-hidden rounded-sm">{renderFrame(leftTertiary, 'No preview')}</div>
                ) : (
                  <>
                    <ImagePlus className="mb-2 h-5 w-5 text-[#b10e6b]/45" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c05a88]">Add Asset</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full p-8 md:w-1/2 md:p-10">
        <div className="flex h-full flex-col gap-6" style={{ minHeight: 580 }}>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">PAGE {spread.pageRight}</span>
          </div>

          <div className="flex flex-1 overflow-hidden rounded-sm border border-[#e4dbd8] bg-[#efe7e5]">{renderFrame(rightPrimary, 'No preview')}</div>
        </div>
      </section>
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
  const [isPreviewFlipping, setIsPreviewFlipping] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [draftAlbums, setDraftAlbums] = useState<CurateDraftListResponse['curates']>([]);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const flipBookKey = `${selectedDraftId || 'draft'}-${selectedTemplate}-${spreads.length}-${previewRevision}`;

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

  const featuredAssetId = orderedAssets.find((asset) => Boolean(asset.dataUrl))?.id || orderedAssets[0]?.id || '';
  const selectedTemplateName = getTemplateName(selectedTemplate);

  const storageSummary = useMemo(() => {
    const totalBytes = orderedAssets.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0);
    const totalGigabytes = totalBytes > 0 ? totalBytes / (1024 * 1024 * 1024) : Math.max(orderedAssets.length * 0.24, 0.4);
    const usedPercent = Math.min(100, Math.max(4, (totalGigabytes / 5) * 100));

    return {
      totalGigabytes,
      usedPercent,
    };
  }, [orderedAssets]);

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
    const saved = await saveTemplateState(templateId, orderedAssets, 'save_draft');
    if (saved) {
      setIsPreviewFlipping(true);
      setPreviewRevision((current) => current + 1);
      setSelectedTemplate(templateId);
      setSaveMessage('Template selected and synced');
      toast.success('Template selected', toastStyle);
      window.setTimeout(() => setIsPreviewFlipping(false), 650);
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
    <div className="min-h-screen text-[#1a1c1d]" style={{ backgroundColor: '#FFF8F7' }}>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-36 pt-6 md:px-8 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b5d60]">Select Saved Album</label>
            <div className="relative">
              <select
                value={selectedDraftId}
                onChange={(event) => setSelectedDraftId(event.target.value)}
                className="h-13 w-full appearance-none rounded-[0.65rem] border border-[#e1bec4] bg-white px-4 py-3 pr-11 text-[15px] text-[#1a1c1d] outline-none transition-shadow focus:border-[#9b0044] focus:shadow-[0_0_0_3px_rgba(155,0,68,0.12)]"
              >
                <option value="">Current working draft</option>
                {draftAlbums.map((draft) => (
                  <option key={draft._id} value={draft._id}>
                    {draft.albumName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a6268]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b5d60]">Select Template</label>
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(event) => handleTemplateSelect(event.target.value as TemplateId)}
                className="h-13 w-full appearance-none rounded-[0.65rem] border border-[#e1bec4] bg-white px-4 py-3 pr-11 text-[15px] text-[#1a1c1d] outline-none transition-shadow focus:border-[#9b0044] focus:shadow-[0_0_0_3px_rgba(155,0,68,0.12)]"
              >
                {TEMPLATE_CHOICES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a6268]" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-['Libre_Caslon_Text'] text-[24px] leading-none text-[#1a1c1d] md:text-[28px]">Narrative Flow</h2>
              <span className="rounded-full bg-[#f6dfe7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">Drop images to reorder</span>
            </div>

            <div className="flex items-end gap-6">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#8d7d81]">
                  <span>Storage</span>
                  <span className="text-[11px] font-bold tracking-[0.06em] text-[#1a1c1d]">{storageSummary.totalGigabytes.toFixed(1)}GB of 5GB used</span>
                </div>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#eee5e3]">
                  <div className="h-full rounded-full bg-[#b10e6b]" style={{ width: `${storageSummary.usedPercent}%` }} />
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b5d60]">{orderedAssets.length} Assets</span>
            </div>
          </div>

          <div className="rounded-[0.7rem] border border-dashed border-[#e4aebb] bg-[#fffdfd] p-3 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
            <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-1">
              {orderedAssets.map((asset, index) => {
                const isFeatured = featuredAssetId === asset.id;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    draggable
                    onDragStart={() => handleDragStart(asset.id)}
                    onDragEnd={() => setDraggedMediaId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(asset.id)}
                    className={`relative shrink-0 overflow-hidden border bg-[#f3f1f2] text-left transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(0,0,0,0.08)] ${
                      draggedMediaId === asset.id ? 'opacity-60' : ''
                    } ${isFeatured ? 'border-[#b10e6b] shadow-[0_0_0_1px_rgba(177,14,107,0.55)]' : 'border-[#ece2e4]'}`}
                    style={{ width: 122, height: 160, borderRadius: 3 }}
                  >
                    {asset.dataUrl ? (
                      <img src={asset.dataUrl} alt={asset.fileName || asset.id} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f2f0f1] text-[10px] text-[#8d7d81]">No preview</div>
                    )}

                    <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d8d4d5] text-[10px] font-bold text-[#4b3d42]">{index + 1}</span>
                      <GripVertical className="h-4 w-4 text-[#8d7d81]" />
                    </div>

                    {isFeatured ? (
                      <div className="absolute right-2 top-2 rounded-full bg-white text-[#b10e6b] shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : null}
                  </button>
                );
              })}

              <button
                type="button"
                className="flex shrink-0 flex-col items-center justify-center border-2 border-dashed border-[#e4b6c2] bg-[#fff7fa] text-center text-[#b10e6b] transition-colors hover:bg-[#fff1f6]"
                style={{ width: 122, height: 160, borderRadius: 3 }}
              >
                <Plus className="mb-1 h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Append Asset</span>
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[0.7rem] border border-[#eee1e4] bg-[#FFF8F7] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.05)] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-['Libre_Caslon_Text'] text-[22px] leading-none text-[#1a1c1d] md:text-[26px]">Spread Editorial</h3>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b5d60]">
                Pages {spreads[0]?.pageLeft || 12} &amp; {spreads[0]?.pageRight || 13} • 0.5" Inner Margin • {selectedTemplateName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={flipPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eee8e8] text-[#7f6b70] transition-colors hover:bg-[#e8dcdc]"
                aria-label="Previous spread"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={flipNext}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9b0044] text-white transition-opacity hover:opacity-90"
                aria-label="Next spread"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#FFF8F7] p-3 md:p-4" style={{ borderRadius: 8 }}>
            <div
              key={flipBookKey}
              className="overflow-hidden"
              style={{
                borderRadius: 8,
                transform: isPreviewFlipping ? 'perspective(1400px) rotateY(-8deg) translateY(8px) scale(0.985)' : 'none',
                opacity: isPreviewFlipping ? 0.75 : 1,
                transition: 'transform 650ms ease, opacity 650ms ease',
              }}
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
                <article className="flex w-full items-center justify-center bg-white p-8" style={{ minHeight: 520, borderRadius: 8 }}>
                  <div className="text-center">
                    <h4 className="font-['Libre_Caslon_Text'] text-[30px] italic text-[#1a1c1d]">No assets yet</h4>
                    <p className="mt-2 text-sm text-[#6b5d60]">Upload images in curate step, then template pages will auto-loop.</p>
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>
      </main>

         <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 py-4 md:px-8 lg:px-10">
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
            className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a6268] transition-opacity hover:opacity-90"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={async () => {
              const saved = await saveTemplateState(selectedTemplate, orderedAssets, 'save_draft');
              if (saved) {
                setSaveMessage('Draft saved');
              }
            }}
            className="rounded-[0.65rem] bg-[#f0e0e6] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b10e6b] transition-opacity hover:opacity-90"
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
            className="flex items-center gap-2 rounded-[0.65rem] bg-[#9b0044] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_20px_rgba(155,0,68,0.2)] transition-opacity hover:opacity-95"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
     </div>
  );
}
