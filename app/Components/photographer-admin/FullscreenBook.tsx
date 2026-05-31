'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { TemplateRecord, TemplatePage, TemplateMediaAsset, getTemplatePages, buildSlotMediaMap, toTemplateMedia, CurateMediaInput } from '@/lib/template-book-media';
import HTMLFlipBook from 'react-pageflip';

const FlipBook = HTMLFlipBook as any;

interface FullscreenBookProps {
  template: TemplateRecord;
  mediaItems: CurateMediaInput[];
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
    <div className="h-full w-full bg-[#FFF6F5] p-2">
      <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] border border-[#ead7dc] bg-white shadow-[0_16px_38px_rgba(0,0,0,0.08)]">
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
  onMediaClick,
}: {
  page: TemplatePage;
  accent: string;
  pageLabel: string;
  variant: 'inline' | 'fullscreen';
  mediaMap: Record<string, TemplateMediaAsset>;
  onMediaClick: (media: TemplateMediaAsset) => void;
}) {
  const usesAbsoluteLayout = page.slots.some((slot) => Number.isFinite(Number(slot.x)) || Number.isFinite(Number(slot.y)));

  return (
    <div className="h-full w-full bg-[#FFF8F7] p-2">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-[#ede5e8] bg-white p-4 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
        <div className={`flex items-center justify-between border-b border-[#f2e8ec] pb-2 ${variant === 'fullscreen' ? 'hidden' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">{pageLabel}</p>
        </div>

        <div className={`relative mt-3 flex-1 ${usesAbsoluteLayout ? 'overflow-hidden' : 'grid auto-rows-[minmax(120px,1fr)] grid-cols-2 gap-3'}`}>
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(2, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));
            const media = mediaMap[slot.id];
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
                {media ? (
                  media.mediaKind === 'video' ? (
                    <video src={media.src} playsInline className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <img src={media.src} alt={media.label} className="absolute inset-0 h-full w-full object-cover" />
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

export function FullscreenBook({ template, mediaItems, coverPhoto, coverPhotoName, coverWeddingDate, onClose }: FullscreenBookProps) {
  const bookRef = useRef<any>(null);
  const bookHoverRef = useRef(false);
  const autoFlipTimerRef = useRef<number | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<TemplateMediaAsset | null>(null);
  const [mediaZoom, setMediaZoom] = useState(100);
  const [bookSize, setBookSize] = useState({ width: 600, height: 800 });
  const [bookScale, setBookScale] = useState(80);

  const pages = useMemo(() => {
    if (Array.isArray((template as any).pages) && (template as any).pages.length > 0) return getTemplatePages(template);
    return getTemplatePages(template);
  }, [template]);

  const draftedMedia = useMemo(() => toTemplateMedia(mediaItems, coverPhoto, coverPhotoName), [mediaItems, coverPhoto, coverPhotoName]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    startAutoFlip();
    return () => stopAutoFlip();
  }, [currentPage, pages.length]);

  useEffect(() => {
    const computeSize = () => {
      const availableHeight = Math.max(600, window.innerHeight - 200);
      const availableWidth = Math.max(800, window.innerWidth - 100);
      const targetWidth = Math.max(500, Math.floor((availableWidth - 24) / 2));
      setBookSize({ width: targetWidth, height: availableHeight });
    };

    computeSize();
    const onResize = () => computeSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
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
      {/* Header */}
      <header className={`absolute inset-x-0 top-0 z-20 border-b border-[#ead5dc] bg-[#FFF1F3]/95 px-6 py-3 backdrop-blur transition-all duration-200 ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full pointer-events-none opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Libre_Caslon_Text'] text-[26px] leading-none text-[#9b0044]">{template.name}</h1>
            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.24em] text-[#8d7d81]">Fullscreen Flip Preview</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Book Zoom Controls */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e1bec4] bg-white">
              <button
                onClick={() => setBookScale(prev => Math.max(50, prev - 10))}
                className="px-2 py-1 text-xs hover:bg-[#fff0f4] rounded transition-colors text-[#9b0044]"
              >
                -
              </button>
              <span className="min-w-11.25 text-center text-xs font-bold text-[#8d7d81]">{bookScale}%</span>
              <button
                onClick={() => setBookScale(prev => Math.min(150, prev + 10))}
                className="px-2 py-1 text-xs hover:bg-[#fff0f4] rounded transition-colors text-[#9b0044]"
              >
                +
              </button>
              <button
                onClick={() => setBookScale(100)}
                className="px-2 py-1 text-xs hover:bg-[#fff0f4] rounded transition-colors text-[#9b0044]"
              >
                Reset
              </button>
            </div>

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
      <main className="absolute inset-0 flex items-center justify-center overflow-hidden">
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
                    onMediaClick={setSelectedMedia}
                  />
                </div>
              ))}
            </FlipBook>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`absolute inset-x-0 bottom-0 z-20 border-t border-[#ead5dc] bg-[#FFF1F3] px-6 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81] transition-all duration-200 ${isFooterVisible ? 'translate-y-0 opacity-100' : 'translate-y-full pointer-events-none opacity-0'}`}>
        Hover to show controls
      </footer>

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
