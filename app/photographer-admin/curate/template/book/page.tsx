'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch } from '@/lib/api';

type TemplateSlot = {
  id: string;
  label: string;
  kind: string;
  width: number;
  height: number;
  emphasis: string;
};

type TemplatePage = {
  pageNumber: number;
  pageLabel?: string;
  slots: TemplateSlot[];
};

type CurateMediaItem = {
  id?: string;
  order?: number;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mediaKind?: 'image' | 'video' | 'other';
  dataUrl?: string;
};

type CurateDraft = {
  selectedAlbumId?: string;
  selectedTemplate?: string;
  albumName?: string;
  coverPhoto?: string;
  coverPhotoName?: string;
  mediaItems?: CurateMediaItem[];
};

type CurateAlbumOption = CurateDraft & {
  _id?: string;
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

type TemplateMediaAsset = {
  id: string;
  sourceId: string;
  src: string;
  label: string;
  order: number;
  mediaKind: 'image' | 'video' | 'other';
  fileType?: string;
};

const FlipBook = HTMLFlipBook as any;

const isVideoType = (fileType?: string, mediaKind?: string) =>
  mediaKind === 'video' || Boolean(fileType && fileType.startsWith('video'));

const toTemplateMedia = (
  items: CurateMediaItem[] | undefined,
  coverPhoto?: string,
  coverPhotoName?: string
): TemplateMediaAsset[] => {
  const normalized = (items || [])
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: item.id || `media-${index + 1}`,
      sourceId: item.id || `media-${index + 1}`,
      src: item.dataUrl || coverPhoto || '',
      label: item.fileName || `Media ${index + 1}`,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
      mediaKind: item.mediaKind || (item.fileType?.startsWith('video') ? 'video' : 'image'),
      fileType: item.fileType || '',
    }))
    .filter((item) => item.src);

  if (normalized.length === 0 && coverPhoto) {
    return [
      {
        id: 'cover-photo',
        sourceId: 'cover-photo',
        src: coverPhoto,
        label: coverPhotoName || 'Cover photo',
        order: 1,
        mediaKind: 'image',
        fileType: 'image/jpeg',
      },
    ];
  }

  return normalized;
};

const buildSlotMediaMap = (pages: TemplatePage[], mediaItems: TemplateMediaAsset[]) => {
  const orderedSlots = pages.flatMap((page, pageIndex) =>
    (page.slots || []).map((slot) => ({
      slot,
      pageNumber: page.pageNumber || pageIndex + 1,
      pageLabel: page.pageLabel || `Page ${page.pageNumber || pageIndex + 1}`,
    }))
  );

  return orderedSlots.reduce<Record<string, TemplateMediaAsset>>((accumulator, entry, index) => {
    const media = mediaItems[index];
    if (media) {
      accumulator[entry.slot.id] = media;
    }
    return accumulator;
  }, {});
};

function CoverPage({ template, accent }: { template: TemplateRecord; accent: string }) {
  const coverTitle = template.name || 'Template Book';
  const coverImage = template.coverImage || template.coverUrl;

  return (
    <div className="h-full w-full bg-[#FEF6F6] p-4 md:p-6">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e9d8dd] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#f0e2e6] px-4 py-3 md:px-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">Cover</p>
        </div>

        <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[#fff8f7] p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,0,68,0.06),transparent_45%),linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.4))]" />

          <div className="relative z-10 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">
            <span>MemoAlbum</span>
            <span>{template.description || 'Fullscreen Book Preview'}</span>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-none flex-1 items-center justify-center py-2 md:py-4">
            <div className="grid w-full gap-4 md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative overflow-hidden rounded-[1.2rem] border border-[#ead5dc] bg-[#fbf6f7] p-4 shadow-[0_16px_32px_rgba(0,0,0,0.06)]">
                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.85),rgba(0,0,0,0.02))]" />
                <div className="relative z-10 flex h-full min-h-72 flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8d7d81]">Cover Photo</p>
                    <h1 className="mt-3 font-['Libre_Caslon_Text'] text-[30px] leading-[1.05] text-[#1a1c1d] md:text-[36px]">{coverTitle}</h1>
                    <p className="mt-3 max-w-sm text-[13px] leading-6 text-[#6b5d60]">
                      {template.description || 'Open the book to preview the full album flow in a clean page-turn format.'}
                    </p>
                  </div>

                  {coverImage ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-[#ead5dc] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                      <img src={coverImage} alt={coverTitle} className="h-64 w-full object-cover md:h-80" />
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">
                    <Sparkles className="h-4 w-4 text-[#9b0044]" />
                    First page cover
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.2rem] border border-[#ead5dc] bg-[#fdf8f9] p-4 shadow-[0_16px_32px_rgba(0,0,0,0.05)]">
                <div className="flex h-full min-h-72 flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8d7d81]">Preview</p>
                  </div>

                  <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
                    {(template.pages?.[0]?.slots || template.slots || []).slice(0, 4).map((slot, index) => (
                      <div
                        key={`${slot.id}-${index}`}
                        className="overflow-hidden rounded-[0.9rem] border border-[#ead5dc] bg-white p-3"
                        style={{ borderColor: `${accent}28` }}
                      >
                        <div className="h-full min-h-19.5 rounded-xl bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(155,0,68,0.03))]" />
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">{slot.label || slot.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-[#f0e2e6] pt-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">
            <span>Open like a book</span>
            <span>Hover or click to flip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookPage({
  page,
  accent,
  pageLabel,
  mediaMap,
}: {
  page: TemplatePage;
  accent: string;
  pageLabel: string;
  mediaMap: Record<string, TemplateMediaAsset>;
}) {
  return (
    <div className="h-full w-full bg-[#FFF8F7] p-1 md:p-2">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-[#ede5e8] bg-white p-3 md:p-4 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#f2e8ec] pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">{pageLabel}</p>
        </div>

        <div className="mt-3 grid flex-1 auto-rows-[minmax(90px,1fr)] grid-cols-2 gap-3 md:grid-cols-3">
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(3, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));

            return (
              <article
                key={`${page.pageNumber}-${slot.id}`}
                className="relative overflow-hidden rounded-2xl border bg-[#faf8f9]"
                style={{
                  borderColor: `${accent || '#9b0044'}33`,
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                }}
              >
                {mediaMap[slot.id] ? (
                  mediaMap[slot.id].mediaKind === 'video' || isVideoType(mediaMap[slot.id].fileType, mediaMap[slot.id].mediaKind) ? (
                    <video
                      src={mediaMap[slot.id].src}
                      controls
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaMap[slot.id].src}
                      alt={mediaMap[slot.id].label}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.85),rgba(0,0,0,0.02))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.52))]" />
                <div className="absolute inset-0 flex items-end justify-between p-4 text-white">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/78">{slot.kind}</p>
                    <p className="mt-1 truncate text-[13px] font-semibold text-white md:text-[14px]">{slot.label || slot.id}</p>
                    {mediaMap[slot.id] ? (
                      <p className="mt-1 truncate text-[9px] font-medium uppercase tracking-[0.14em] text-white/72">
                        {mediaMap[slot.id].label}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-full border border-white/25 bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                    {mediaMap[slot.id]?.mediaKind || 'empty'}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TemplateBookViewPage() {
  const bookRef = useRef<any>(null);
  const bookHoverRef = useRef(false);
  const autoFlipTimerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [bookSize, setBookSize] = useState({ width: 560, height: 760 });

  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [curates, setCurates] = useState<CurateAlbumOption[]>([]);
  const [selectedAlbumKey, setSelectedAlbumKey] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item._id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  );

  const selectedCurate = useMemo(() => {
    if (!curates.length) return null;

    return (
      curates.find((item) => getCurateKey(item) === selectedAlbumKey) ||
      curates.find((item) => item.selectedTemplate === selectedTemplateId) ||
      curates[0] ||
      null
    );
  }, [curates, selectedAlbumKey, selectedTemplateId]);

  const pages = useMemo(() => {
    if (!selectedTemplate) return [];
    if (Array.isArray(selectedTemplate.pages) && selectedTemplate.pages.length > 0) return selectedTemplate.pages;
    return [{ pageNumber: 1, pageLabel: 'Page 1', slots: selectedTemplate.slots || [] }];
  }, [selectedTemplate]);

  const albumTitle = selectedCurate?.albumName || selectedTemplate?.name || 'Template Book View';

  const draftedMedia = useMemo(
    () => toTemplateMedia(selectedCurate?.mediaItems, selectedCurate?.coverPhoto, selectedCurate?.coverPhotoName),
    [selectedCurate]
  );

  const mediaMap = useMemo(() => buildSlotMediaMap(pages, draftedMedia), [pages, draftedMedia]);

  const albumOptions = useMemo(() => curates.map((item) => ({ key: getCurateKey(item), label: item.albumName || 'Untitled album' })), [curates]);

  const playFlipSound = () => {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(640, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.16);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    oscillator.onended = () => audioContext.close().catch(() => undefined);
  };

  const stopAutoFlip = () => {
    if (autoFlipTimerRef.current) {
      window.clearInterval(autoFlipTimerRef.current);
      autoFlipTimerRef.current = null;
    }
  };

  const startAutoFlip = () => {
    if (autoFlipTimerRef.current || pages.length <= 1) return;

    autoFlipTimerRef.current = window.setInterval(() => {
      if (bookHoverRef.current) return;

      const totalPages = pages.length + 1;
      if (currentPage >= totalPages - 1) {
        stopAutoFlip();
        return;
      }

      bookRef.current?.pageFlip?.().flipNext?.();
    }, 2600);
  };

  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      setMessage('');

      try {
        const [templateResponse, curatesResponse, currentResponse] = await Promise.all([
          apiFetch('/admin/templates'),
          apiFetch('/curate'),
          apiFetch('/curate/current'),
        ]);

        const templateData = (await templateResponse.json()) as { templates?: TemplateRecord[] };
        const templates = Array.isArray(templateData.templates) ? templateData.templates : [];
        const curatesData = (await curatesResponse.json()) as { curates?: CurateAlbumOption[] };
        const currentData = currentResponse.ok ? ((await currentResponse.json()) as { curate?: CurateAlbumOption | null }) : { curate: null };

        const nextCurates = Array.isArray(curatesData.curates) ? curatesData.curates : [];
        const currentCurate = currentData.curate || null;

        setTemplates(templates);
        setCurates(nextCurates);

        const initialTemplateId = currentCurate?.selectedTemplate || templates[0]?._id || '';
        const initialAlbumKey = getCurateKey(currentCurate || nextCurates[0] || null) || '';

        setSelectedTemplateId(initialTemplateId);
        setSelectedAlbumKey(initialAlbumKey);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load template';
        setMessage(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedAlbumKey, selectedTemplateId]);

  useEffect(() => {
    if (!selectedTemplate) return;

    const id = window.setTimeout(() => {
      try {
        const instance = bookRef.current?.pageFlip?.();
        if (instance && pages.length > 0) {
          instance.flip?.(1);
        }
      } catch (e) {
        // ignore
      }
    }, 320);

    return () => window.clearTimeout(id);
  }, [selectedTemplate, pages.length]);

  useEffect(() => {
    startAutoFlip();

    return () => stopAutoFlip();
  }, [currentPage, pages.length]);

  useEffect(() => {
    const computeSize = () => {
      const headerH = headerRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      const availableHeight = Math.max(420, window.innerHeight - headerH - footerH - 120);
      const availableWidth = Math.max(720, window.innerWidth - 48);

      const targetWidth = Math.max(360, Math.floor((availableWidth - 24) / 2));
      setBookSize({ width: targetWidth, height: availableHeight });
    };

    computeSize();
    const onResize = () => computeSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#FFF1F3] text-[#1a1c1d]">
      <header ref={headerRef} className="border-b border-[#ead5dc] bg-[#FFF1F3]/95 px-4 py-2 backdrop-blur md:px-6 md:py-2">
        <div className="mx-auto flex w-full max-w-400 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/template"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e1bec4] text-[#7a6268] transition-colors hover:border-[#9b0044] hover:text-[#9b0044]"
              aria-label="Back to templates"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="font-['Libre_Caslon_Text'] text-[22px] leading-none text-[#9b0044] md:text-[26px]">{albumTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="rounded-full border border-[#e1bec4] bg-white px-2 py-1">
              <select
                value={selectedAlbumKey}
                onChange={(event) => setSelectedAlbumKey(event.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a6268] outline-none"
              >
                {albumOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-full border border-[#e1bec4] bg-white px-2 py-1">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a6268] outline-none"
              >
                {templates.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

          <main className="flex flex-1 items-center justify-center p-0">
        {isLoading ? (
          <div className="text-center">
            <p className="text-[14px] uppercase tracking-[0.2em] text-[#7a6268]">Loading Book...</p>
          </div>
        ) : message ? (
          <div className="rounded-2xl border border-[#e1bec4] bg-white px-6 py-6 text-center text-[13px] text-[#594045]">{message}</div>
        ) : pages.length === 0 ? (
          <div className="rounded-2xl border border-[#e1bec4] bg-white px-6 py-6 text-center text-[13px] text-[#594045]">No pages to preview.</div>
        ) : (
          <div className="flex h-full w-full flex-1 items-center justify-center">
            <div
              className="flex h-full w-full items-center justify-center"
              onMouseEnter={() => {
                bookHoverRef.current = true;
              }}
              onMouseLeave={() => {
                bookHoverRef.current = false;
              }}
            >
            <div style={{ width: '100%', maxWidth: '100%', height: '100%' }} className="mx-auto flex items-center justify-center">
            <FlipBook
              ref={bookRef}
              width={bookSize.width}
              height={bookSize.height}
              size="stretch"
              minWidth={320}
              maxWidth={1300}
              minHeight={520}
              maxHeight={1200}
              showCover
              mobileScrollSupport
              className="mx-auto"
              style={{}}
              onFlip={(event: any) => {
                setCurrentPage(event.data);
                playFlipSound();
              }}
            >
              <div>
                <CoverPage template={selectedTemplate as TemplateRecord} accent={selectedTemplate?.accent || '#9b0044'} />
              </div>
              {pages.map((page, index) => (
                <div
                  key={`${page.pageNumber}-${page.pageLabel || 'page'}`}
                >
                  <BookPage
                    page={page}
                    accent={selectedTemplate?.accent || '#9b0044'}
                    pageLabel={page.pageLabel || `Page ${page.pageNumber}`}
                    mediaMap={mediaMap}
                  />
                </div>
              ))}
            </FlipBook>
            </div>
            </div>
          </div>
        )}
      </main>

      <footer ref={footerRef} className="border-t border-[#ead5dc] bg-[#FFF1F3] px-4 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81] md:px-6" />
    </div>
  );
}

const getCurateKey = (item: CurateAlbumOption | null) => item?.selectedAlbumId || item?.albumName || '';
