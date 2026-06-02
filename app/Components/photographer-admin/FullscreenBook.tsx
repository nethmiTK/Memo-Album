'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { TemplateRecord, TemplatePage, TemplateMediaAsset, getTemplatePages, buildSlotMediaMap, toTemplateMedia, CurateMediaInput } from '@/lib/template-book-media';
import HTMLFlipBook from 'react-pageflip';
import JSZip from 'jszip';

const FlipBook = HTMLFlipBook as any;

interface FullscreenBookProps {
  template: TemplateRecord;
  mediaItems: CurateMediaInput[];
  mediaTransforms?: Record<string, { zoom: number; x: number; y: number }>;
  pageLayouts?: Array<{
    pageNumber?: number;
    slotAssignments?: Array<{
      slotId?: string;
      slotLabel?: string;
      mediaId?: string | null;
      mediaOrder?: number | null;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      dataUrl?: string;
      mediaKind?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }>;
  }>;
  coverPhoto?: string;
  coverPhotoName?: string;
  coverWeddingDate?: string | Date;
  onClose: () => void;
}

type BookAlbumPageLayout = NonNullable<FullscreenBookProps['pageLayouts']>[number];

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(177,14,107,${alpha})`;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const pageLayoutsToTemplatePages = (pageLayouts: BookAlbumPageLayout[]): TemplatePage[] =>
  pageLayouts
    .map((layout, index) => ({
      pageNumber: Number.isFinite(Number(layout.pageNumber)) ? Number(layout.pageNumber) : index + 1,
      pageLabel: `Page ${Number.isFinite(Number(layout.pageNumber)) ? Number(layout.pageNumber) : index + 1}`,
      slots: (layout.slotAssignments || []).map((slot, slotIndex) => ({
        id: slot.slotId || `slot-${index + 1}-${slotIndex + 1}`,
        label: slot.slotLabel || slot.fileName || `Slot ${slotIndex + 1}`,
        kind: slot.mediaKind || 'image',
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
      })),
    }))
    .sort((left, right) => left.pageNumber - right.pageNumber);

const pageLayoutsToMediaMap = (
  pageLayouts: BookAlbumPageLayout[],
  draftedMedia: TemplateMediaAsset[] = []
): Record<string, TemplateMediaAsset> => {
  const mediaMap: Record<string, TemplateMediaAsset> = {};

  pageLayouts.forEach((layout, pageIndex) => {
    (layout.slotAssignments || []).forEach((slot, slotIndex) => {
      if (slot.dataUrl) {
        const mediaKind = slot.mediaKind === 'video' ? 'video' : slot.mediaKind === 'other' ? 'other' : 'image';
        mediaMap[slot.slotId || `slot-${pageIndex + 1}-${slotIndex + 1}`] = {
          id: slot.mediaId || slot.slotId || `slot-${pageIndex + 1}-${slotIndex + 1}`,
          sourceId: slot.mediaId || slot.slotId || `slot-${pageIndex + 1}-${slotIndex + 1}`,
          src: slot.dataUrl,
          label: slot.fileName || slot.slotLabel || `Page ${pageIndex + 1} Slot ${slotIndex + 1}`,
          order: Number.isFinite(Number(slot.mediaOrder)) ? Number(slot.mediaOrder) : pageIndex * 100 + slotIndex + 1,
          mediaKind,
          fileType: slot.fileType || '',
        };
        return;
      }

      if (slot.mediaId) {
        const found = draftedMedia.find((m) => m.sourceId === slot.mediaId || m.id === slot.mediaId);
        if (found) {
          mediaMap[slot.slotId || `slot-${pageIndex + 1}-${slotIndex + 1}`] = { ...found };
          return;
        }
      }

      if (slot.fileName) {
        const foundByName = draftedMedia.find((m) => m.label === slot.fileName || (m.fileType && slot.fileName?.includes(m.fileType)));
        if (foundByName) {
          mediaMap[slot.slotId || `slot-${pageIndex + 1}-${slotIndex + 1}`] = { ...foundByName };
          return;
        }
      }

      // otherwise leave unmapped and fallback will assign sequentially
    });
  });

  return mediaMap;
};

function CoverPage({ template, accent, coverPhoto, coverPhotoName, coverWeddingDate }: { template: TemplateRecord; accent: string; coverPhoto?: string; coverPhotoName?: string; coverWeddingDate?: string | Date }) {
  const coverImage = coverPhoto || template.coverImage;
  const coverTitle = coverPhotoName || template.name || 'Album Book';
  const weddingDate = coverWeddingDate ? new Date(coverWeddingDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className="h-full w-full p-2" style={{ background: `linear-gradient(180deg, ${hexToRgba(accent, 0.20)} 0%, ${hexToRgba(accent, 0.08)} 100%)` }}>
      <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] border bg-white shadow-[0_16px_38px_rgba(0,0,0,0.08)]" style={{ borderColor: hexToRgba(accent, 0.24) }}>
        {coverImage ? (
          <>
            <img src={coverImage} alt={coverTitle} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,12,0.08),rgba(15,10,12,0.58))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.26em] text-white/90 motion-safe:animate-pulse">
                Cover Story
              </div>
              <div className="mx-auto mt-4 w-fit rounded-[0.9rem] border border-white/45 bg-black/25 px-5 py-4 backdrop-blur-sm">
                <h1 className="font-['Libre_Caslon_Text'] text-[clamp(2.4rem,5.6vw,5rem)] leading-[0.94] tracking-[0.02em] text-white">{coverTitle}</h1>
                {weddingDate ? <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/90">{weddingDate}</p> : null}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#fff4f7] text-[10px] font-bold uppercase tracking-[0.28em] text-[#8f7b81]">
            Cover Photo
          </div>
        )}
      </div>
    </div>
  );
}

function BookPage({
  page,
  accent,
  pageLabel,
  variant,
  mediaMap,
  mediaTransforms,
  onMediaClick,
}: {
  page: TemplatePage;
  accent: string;
  pageLabel: string;
  variant: 'inline' | 'fullscreen';
  mediaMap: Record<string, TemplateMediaAsset>;
  mediaTransforms: Record<string, { zoom: number; x: number; y: number }>;
  onMediaClick: (media: TemplateMediaAsset) => void;
}) {
  const usesAbsoluteLayout = page.slots.some((slot) => Number.isFinite(Number(slot.x)) || Number.isFinite(Number(slot.y)));
  const pageSurface = `linear-gradient(180deg, ${hexToRgba(accent, 0.16)} 0%, #fffdfd 24%, #fff8fb 72%, ${hexToRgba(accent, 0.10)} 100%)`;

  return (
    <div className="h-full w-full p-2" style={{ background: pageSurface }}>
      <div className="flex h-full flex-col overflow-hidden rounded-[1.1rem] border bg-white p-4 shadow-[0_14px_35px_rgba(0,0,0,0.06)]" style={{ borderColor: hexToRgba(accent, 0.26) }}>
        <div className={`flex items-center justify-between border-b border-[#f2e8ec] pb-2 ${variant === 'fullscreen' ? 'hidden' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">{pageLabel}</p>
        </div>

        <div className={`relative mt-3 flex-1 ${usesAbsoluteLayout ? 'overflow-hidden' : 'grid auto-rows-[minmax(120px,1fr)] grid-cols-2 gap-3'}`}>
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(2, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));
            const media = mediaMap[slot.id];
            const mediaTransform = media ? mediaTransforms[media.sourceId || media.id] : undefined;
            const isAbsolute = usesAbsoluteLayout;
            const left = Number.isFinite(Number(slot.x)) ? Number(slot.x) : 0;
            const top = Number.isFinite(Number(slot.y)) ? Number(slot.y) : 0;
            const width = Math.max(1, Number.isFinite(Number(slot.width)) ? Number(slot.width) : 1);
            const height = Math.max(1, Number.isFinite(Number(slot.height)) ? Number(slot.height) : 1);

            return (
              <div
                key={`${page.pageNumber}-${slot.id}`}
                className={`overflow-hidden rounded-2xl border bg-[#faf8f9] cursor-pointer hover:border-[#b10e6b] transition-colors ${isAbsolute ? 'absolute' : 'relative'}`}
                style={{
                  borderColor: `${accent || '#9b0044'}33`,
                  gridColumn: isAbsolute ? undefined : `span ${colSpan}`,
                  gridRow: isAbsolute ? undefined : `span ${rowSpan}`,
                  left: isAbsolute ? `${left}%` : undefined,
                  top: isAbsolute ? `${top}%` : undefined,
                  width: isAbsolute ? `${width}%` : undefined,
                  height: isAbsolute ? `${height}%` : undefined,
                }}
                onClick={() => media && onMediaClick(media)}
              >
                {media?.src ? (
                  media.mediaKind === 'video' ? (
                    <video src={media.src} playsInline preload="metadata" controls className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <img
                      src={media.src}
                      alt={media.label}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        transform: mediaTransform ? `translate(${mediaTransform.x}px, ${mediaTransform.y}px) scale(${mediaTransform.zoom})` : undefined,
                      }}
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScrollFeedItem({
  media,
  mediaTransforms,
  onDownload,
  onMediaClick,
}: {
  media: TemplateMediaAsset;
  mediaTransforms: Record<string, { zoom: number; x: number; y: number }>;
  onDownload: (media: TemplateMediaAsset) => void;
  onMediaClick: (media: TemplateMediaAsset) => void;
}) {
  const mediaTransform = mediaTransforms[media.sourceId || media.id];
  return (
    <div className="group relative flex w-full items-stretch justify-center p-0 text-left">
      <button
        type="button"
        onClick={() => onMediaClick(media)}
        className="flex w-full items-stretch justify-center p-0 text-left"
      >
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
        style={{ minHeight: 'clamp(220px, 32vh, 300px)' }}
      >
        {media.mediaKind === 'video' ? (
          <video
            src={media.src}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <img
            src={media.src}
            alt={media.label}
            className="max-h-full max-w-full object-contain"
            style={{
              transform: mediaTransform ? `translate(${mediaTransform.x}px, ${mediaTransform.y}px) scale(${mediaTransform.zoom})` : undefined,
            }}
          />
        )}
      </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownload(media);
        }}
        className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Download media"
      >
        <Download size={14} />
      </button>
    </div>
  );
}

type FullscreenViewMode = 'book' | 'scroll';

export function FullscreenBook({
  template,
  mediaItems,
  mediaTransforms,
  coverPhoto,
  coverPhotoName,
  coverWeddingDate,
  onClose,
}: FullscreenBookProps) {
  const bookRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastPointerMoveRef = useRef(0);
  const bookHoverRef = useRef(false);
  const autoFlipTimerRef = useRef<number | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isPointerInsideScroll, setIsPointerInsideScroll] = useState(false);
  const [viewMode, setViewMode] = useState<FullscreenViewMode>('book');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<TemplateMediaAsset | null>(null);
  const [mediaZoom, setMediaZoom] = useState(100);
  const [bookSize, setBookSize] = useState({ width: 600, height: 800 });
  const [bookScale, setBookScale] = useState(80);
  const normalizedTransforms = useMemo(() => mediaTransforms || {}, [mediaTransforms]);
  const isMobileLayout = bookSize.width < 520;
  const isScrollMode = viewMode === 'scroll';

  const pages = useMemo(() => {
    if (Array.isArray((template as any).pages) && (template as any).pages.length > 0) return getTemplatePages(template);
    return getTemplatePages(template);
  }, [template]);

  const draftedMedia = useMemo(() => toTemplateMedia(mediaItems, coverPhoto, coverPhotoName), [mediaItems, coverPhoto, coverPhotoName]);

  const scrollMediaItems = useMemo(() => {
    const orderedDraftedMedia = [...draftedMedia].sort((left, right) => (left.order || 0) - (right.order || 0));
    const coverImage = coverPhoto || template.coverImage;
    const coverItem = coverImage
      ? [{
          id: 'cover-media',
          sourceId: 'cover-media',
          src: coverImage,
          label: coverPhotoName || template.name || 'Album Cover',
          order: -1,
          mediaKind: 'image' as const,
          fileType: 'image/jpeg',
        }]
      : [];

    return [...coverItem, ...orderedDraftedMedia].filter((item, index, array) => array.findIndex((entry) => entry.src === item.src) === index);
  }, [draftedMedia, coverPhoto, coverPhotoName, template.coverImage, template.name]);

  const mediaMap = useMemo(() => {
    const fallback = buildSlotMediaMap(pages, draftedMedia);
    // If parent passed pageLayouts via template.pages (from the BookAlbum), prefer explicit mapping
    const pageLayouts = (template as any).pageLayouts as BookAlbumPageLayout[] | undefined;
    if (Array.isArray(pageLayouts) && pageLayouts.length > 0) {
      const explicit = pageLayoutsToMediaMap(pageLayouts, draftedMedia);
      return { ...fallback, ...explicit };
    }
    return fallback;
  }, [pages, draftedMedia, template]);
  const accent = template.accent || '#b10e6b';
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const urlToBlob = async (url: string) => {
    if (url.startsWith('data:')) {
      const response = await fetch(url);
      return response.blob();
    }
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Failed to fetch media');
    return response.blob();
  };

  const extensionFromMedia = (media: TemplateMediaAsset, fallback = 'jpg') => {
    if (media.fileType?.includes('/')) return media.fileType.split('/')[1];
    const byUrl = media.src.split('.').pop()?.split('?')[0];
    return byUrl || fallback;
  };

  const handleDownloadMedia = async (media: TemplateMediaAsset) => {
    try {
      const blob = await urlToBlob(media.src);
      const ext = extensionFromMedia(media, media.mediaKind === 'video' ? 'mp4' : 'jpg');
      const fileName = `${(media.label || 'media').replace(/[^\w\-]+/g, '_')}.${ext}`;
      downloadBlob(blob, fileName);
    } catch (error) {
      console.error('Failed to download media:', error);
    }
  };

  const handleDownloadAlbum = async () => {
    try {
      const zip = new JSZip();
      const entries = scrollMediaItems.filter((item, index, arr) => arr.findIndex((x) => x.src === item.src) === index);
      for (let i = 0; i < entries.length; i += 1) {
        const media = entries[i];
        try {
          const blob = await urlToBlob(media.src);
          const ext = extensionFromMedia(media, media.mediaKind === 'video' ? 'mp4' : 'jpg');
          const name = `${String(i + 1).padStart(3, '0')}_${(media.label || 'media').replace(/[^\w\-]+/g, '_')}.${ext}`;
          zip.file(name, blob);
        } catch (error) {
          console.error('Skipping media in album zip:', media.src, error);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${(template.name || 'album').replace(/[^\w\-]+/g, '_')}_media.zip`);
    } catch (error) {
      console.error('Failed to download album:', error);
    }
  };

  const goToPreviousPage = () => bookRef.current?.pageFlip?.()?.flipPrev?.();
  const goToNextPage = () => bookRef.current?.pageFlip?.()?.flipNext?.();

  const playFlipSound = () => {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const notes = [392, 523.25, 659.25];

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startTime = audioContext.currentTime + index * 0.06;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.96, startTime + 0.12);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.045, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });

    window.setTimeout(() => audioContext.close().catch(() => undefined), 500);
  };

  const stopAutoFlip = () => {
    if (autoFlipTimerRef.current) {
      window.clearInterval(autoFlipTimerRef.current);
      autoFlipTimerRef.current = null;
    }
  };
  
  const startAutoFlip = () => {
    if (autoFlipTimerRef.current || pages.length <= 1 || isScrollMode) return;

    autoFlipTimerRef.current = window.setInterval(() => {
      if (bookHoverRef.current) return;

      const totalPages = pages.length + 1;
      if (currentPage >= totalPages - 1) {
        stopAutoFlip();
        return;
      }

      bookRef.current?.pageFlip?.()?.flipNext?.();
    }, 60000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (selectedMedia) return;
      if (isScrollMode) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousPage();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedMedia, isScrollMode]);

  useEffect(() => {
    if (!template) return;
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
  }, [template, pages.length]);

  useEffect(() => {
    if (isScrollMode) {
      stopAutoFlip();
      return;
    }

    startAutoFlip();
    return () => stopAutoFlip();
  }, [currentPage, pages.length, isScrollMode]);

  useEffect(() => {
    if (isScrollMode) {
      setIsHeaderVisible(true);
      setIsFooterVisible(false);
      bookHoverRef.current = false;
    }
  }, [isScrollMode]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isScrollMode) return;

    let frame = 0;
    const speed = 0.2;
    const idleThresholdMs = 700;

    const autoScroll = () => {
      const isIdle = Date.now() - lastPointerMoveRef.current > idleThresholdMs;
      const shouldAutoScroll = !isPointerInsideScroll || isIdle;

      if (shouldAutoScroll) {
        container.scrollTop += speed;
      }

      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.scrollTop = 0;
      }

      frame = window.requestAnimationFrame(autoScroll);
    };

    frame = window.requestAnimationFrame(autoScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [isPointerInsideScroll, isScrollMode]);

  useEffect(() => {
    const computeSize = () => {
      const isMobile = window.innerWidth < 768;
      const availableHeight = isMobile ? Math.max(420, window.innerHeight - 160) : Math.max(600, window.innerHeight - 200);
      const availableWidth = isMobile ? Math.max(320, window.innerWidth - 32) : Math.max(800, window.innerWidth - 100);
      const targetWidth = isMobile ? Math.min(availableWidth, 420) : Math.max(500, Math.floor((availableWidth - 24) / 2));
      setBookSize({ width: targetWidth, height: availableHeight });
    };

    computeSize();
    const onResize = () => computeSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isScrollMode) {
      setIsHeaderVisible(true);
      setIsFooterVisible(false);
      return;
    }

    const topTriggerHeight = 72;
    const bottomTriggerHeight = 72;
    const isTopZone = event.clientY <= topTriggerHeight;
    const isBottomZone = event.clientY >= window.innerHeight - bottomTriggerHeight;
    const isCenterZone = !isTopZone && !isBottomZone;

    setIsHeaderVisible(isTopZone);
    setIsFooterVisible(isBottomZone);
    bookHoverRef.current = isCenterZone;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FFF1F3] overflow-hidden"
      onMouseMove={handlePointerMove}
      onMouseLeave={() => {
        setIsHeaderVisible(false);
        setIsFooterVisible(false);
        bookHoverRef.current = false;
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
        {!isScrollMode && (
          <>
            <button
              type="button"
              aria-label="Previous page"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                try { bookRef.current?.pageFlip?.()?.flipPrev?.(); } catch (err) {}
                playFlipSound();
              }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto absolute left-0 top-0 h-full w-[22%] cursor-pointer bg-transparent"
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9b0044] shadow-lg">
                <ChevronLeft size={16} className="inline-block align-middle" /> Prev
              </span>
            </button>
            <button
              type="button"
              aria-label="Next page"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                try { bookRef.current?.pageFlip?.()?.flipNext?.(); } catch (err) {}
                playFlipSound();
              }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto absolute right-0 top-0 h-full w-[22%] cursor-pointer bg-transparent"
            >
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9b0044] shadow-lg">
                Next <ChevronRight size={16} className="inline-block align-middle" />
              </span>
            </button>
          </>
        )}
      </div>

      {!isScrollMode && (
        <div className="pointer-events-none absolute inset-0 z-10 md:hidden">
          <button
            type="button"
            aria-label="Previous page"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              try { bookRef.current?.pageFlip?.()?.flipPrev?.(); } catch (err) {}
              playFlipSound();
            }}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute left-0 top-0 h-full w-[22%] bg-transparent"
          />
          <button
            type="button"
            aria-label="Next page"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              try { bookRef.current?.pageFlip?.()?.flipNext?.(); } catch (err) {}
              playFlipSound();
            }}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute right-0 top-0 h-full w-[22%] bg-transparent"
          />
        </div>
      )}

      {/* Header */}
      <header className={`absolute inset-x-0 top-0 z-20 border-b border-[#ead5dc] bg-[#FFF1F3]/98 px-4 py-3 transition-all duration-200 md:px-6 ${isMobileLayout || isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full pointer-events-none opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Libre_Caslon_Text'] text-[26px] leading-none text-[#9b0044]">{template.name}</h1>
            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.24em] text-[#8d7d81]">{isScrollMode ? 'Fullscreen Scroll Preview' : 'Fullscreen Flip Preview'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadAlbum}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e1bec4] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b0044] transition-colors hover:bg-[#fff0f4]"
            >
              <Download size={14} />
              Download Album
            </button>

            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'book' ? 'scroll' : 'book'))}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e1bec4] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b0044] transition-colors hover:bg-[#fff0f4]"
            >
              {isScrollMode ? 'Book view' : 'Scroll view'}
            </button>

            {!isScrollMode && (
              <div className="hidden items-center gap-2 rounded-lg border border-[#e1bec4] bg-white px-3 py-1.5 md:flex">
                <button
                  onClick={() => setBookScale(prev => Math.max(50, prev - 10))}
                  className="rounded px-2 py-1 text-xs text-[#9b0044] transition-colors hover:bg-[#fff0f4]"
                >
                  -
                </button>
                <span className="min-w-11.25 text-center text-xs font-bold text-[#8d7d81]">{bookScale}%</span>
                <button
                  onClick={() => setBookScale(prev => Math.min(150, prev + 10))}
                  className="rounded px-2 py-1 text-xs text-[#9b0044] transition-colors hover:bg-[#fff0f4]"
                >
                  +
                </button>
                <button
                  onClick={() => setBookScale(100)}
                  className="rounded px-2 py-1 text-xs text-[#9b0044] transition-colors hover:bg-[#fff0f4]"
                >
                  Reset
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#fff0f4] transition-colors"
              aria-label="Close fullscreen"
            >
              <X size={24} className="text-[#9b0044]" />
            </button>
          </div>
        </div>
      </header>

      {/* Book View */}
      <main
        ref={scrollRef}
        className={`absolute inset-0 ${isScrollMode ? 'overflow-y-auto overscroll-contain scroll-smooth snap-y snap-mandatory' : 'flex items-center justify-center overflow-hidden'}`}
        onMouseEnter={() => {
          lastPointerMoveRef.current = Date.now();
          setIsPointerInsideScroll(true);
        }}
        onMouseMove={() => {
          lastPointerMoveRef.current = Date.now();
        }}
        onMouseLeave={() => setIsPointerInsideScroll(false)}
      >
        {isScrollMode ? (
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[#f0e1e7] bg-white px-6 py-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#9a8a8e]">Live Content Feed</h3>
              <p className="mt-1 text-xs text-[#9a8a8e]">Three media per row. Move cursor inside to pause; leave to resume auto scroll.</p>
            </div>

            <div className="grid grid-cols-1 gap-0.5 md:grid-cols-2 lg:grid-cols-3">
              {scrollMediaItems.map((media, index) => (
                <div key={`${media.id || media.sourceId || media.src}-${index}`} className="w-full snap-start">
                  <ScrollFeedItem media={media} mediaTransforms={normalizedTransforms} onDownload={handleDownloadMedia} onMediaClick={setSelectedMedia} />
                </div>
              ))}
            </div>

            {scrollMediaItems.length === 0 ? (
              <div className="flex min-h-[56vh] items-center justify-center rounded-3xl border border-dashed border-[#ecd8e0] bg-white text-sm text-[#9a8a8e]">
                No media selected yet
              </div>
            ) : null}
          </div>
        ) : (
          <div 
            className="flex h-full w-full items-center justify-center"
            style={{ transform: `scale(${bookScale / 100})`, transition: 'transform 0.3s ease' }}
          >
            <div style={{ width: '100%', maxWidth: '100%', height: '100%' }} className="mx-auto flex items-center justify-center">
              <FlipBook
                ref={bookRef}
                width={bookSize.width}
                height={bookSize.height}
                size="stretch"
                minWidth={400}
                maxWidth={1400}
                minHeight={600}
                maxHeight={1200}
                showCover
                mobileScrollSupport
                className="mx-auto"
                onFlip={(event: any) => {
                  setCurrentPage(event.data);
                  playFlipSound();
                }}
              >
                <div>
                  <CoverPage template={template} accent={accent} coverPhoto={coverPhoto} coverPhotoName={coverPhotoName} coverWeddingDate={coverWeddingDate} />
                </div>

                {pages.map((page) => (
                  <div key={`${page.pageNumber}-${page.pageLabel || 'page'}`}>
                    <BookPage 
                      page={page} 
                      accent={accent} 
                      pageLabel={page.pageLabel || `Page ${page.pageNumber}`}
                      variant="fullscreen"
                      mediaMap={mediaMap}
                      mediaTransforms={normalizedTransforms}
                      onMediaClick={setSelectedMedia}
                    />
                  </div>
                ))}
              </FlipBook>
            </div>
          </div>
        )}
      </main>

      {!isScrollMode && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex items-center justify-between px-4 md:hidden">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              try { bookRef.current?.pageFlip?.()?.flipPrev?.(); } catch (err) {}
              playFlipSound();
            }}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#9b0044] shadow-lg transition-colors active:scale-95"
            aria-label="Previous page"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              try { bookRef.current?.pageFlip?.()?.flipNext?.(); } catch (err) {}
              playFlipSound();
            }}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#9b0044] shadow-lg transition-colors active:scale-95"
            aria-label="Next page"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}

      {/* Footer */}
      {!isScrollMode && (
        <footer className={`absolute inset-x-0 bottom-0 z-20 border-t border-[#ead5dc] bg-[#FFF1F3] px-4 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81] transition-all duration-200 md:px-6 ${isMobileLayout || isFooterVisible ? 'translate-y-0 opacity-100' : 'translate-y-full pointer-events-none opacity-0'}`}>
          {isMobileLayout ? 'Tap left or right to flip pages' : 'Hover to show controls'}
        </footer>
      )}

      {/* Media Popup */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-8"
          onClick={() => {
            setSelectedMedia(null);
            setMediaZoom(100);
          }}
        >
          <button
            onClick={() => {
              setSelectedMedia(null);
              setMediaZoom(100);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            aria-label="Close popup"
          >
            <X size={32} className="text-white" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMediaZoom(prev => Math.max(50, prev - 10));
              }}
              className="px-3 py-1 text-sm text-white hover:bg-white/20 rounded transition-colors"
            >
              -
            </button>
            <span className="min-w-12.5 text-center text-sm font-bold text-white">{mediaZoom}%</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMediaZoom(prev => Math.min(200, prev + 10));
              }}
              className="px-3 py-1 text-sm text-white hover:bg-white/20 rounded transition-colors"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMediaZoom(100);
              }}
              className="px-3 py-1 text-sm text-white hover:bg-white/20 rounded transition-colors"
            >
              Reset
            </button>
          </div>
          
          <div 
            className="max-w-[90vw] max-h-[90vh] overflow-auto" 
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `scale(${mediaZoom / 100})`, transition: 'transform 0.3s ease' }}
          >
            {selectedMedia.mediaKind === 'video' ? (
              <video 
                src={selectedMedia.src} 
                controls 
                autoPlay
                playsInline 
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
            ) : (
              <img 
                src={selectedMedia.src} 
                alt={selectedMedia.label} 
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
