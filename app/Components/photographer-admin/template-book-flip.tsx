'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildSlotMediaMap,
  getTemplatePages,
  isVideoMedia,
  TemplateMediaAsset,
  TemplatePage,
  TemplateRecord,
  toTemplateMedia,
  CurateMediaInput,
} from '@/lib/template-book-media';

const FlipBook = HTMLFlipBook as unknown as React.ComponentType<Record<string, unknown>>;

type TemplateBookFlipProps = {
  template: TemplateRecord;
  mediaItems?: CurateMediaInput[];
  coverPhoto?: string;
  coverPhotoName?: string;
  coverWeddingDate?: string | Date;
  /** inline = designer panel, fullscreen = dedicated book route */
  variant?: 'inline' | 'fullscreen';
  className?: string;
};

function CoverPage({ template, accent, coverPhoto, coverPhotoName, coverWeddingDate, variant }: { template: TemplateRecord; accent: string; coverPhoto?: string; coverPhotoName?: string; coverWeddingDate?: string | Date; variant: 'inline' | 'fullscreen' }) {
  const coverImage = coverPhoto || template.coverImage || template.coverUrl;
  const coverTitle = coverPhotoName || template.name || 'Template Book';
  const weddingDate = coverWeddingDate ? new Date(coverWeddingDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className={`h-full w-full ${variant === 'fullscreen' ? 'bg-[#FFF6F5] p-2' : 'bg-[#FEF6F6] p-2 md:p-3'}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] border border-[#ead7dc] bg-white shadow-[0_16px_38px_rgba(0,0,0,0.08)]">
        {coverImage ? (
          <>
            <img src={coverImage} alt={coverTitle} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,12,0.08),rgba(15,10,12,0.58))]" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.24em] text-white/90 motion-safe:animate-pulse">
                Cover Story
              </div>
              <div className="mx-auto mt-3 w-fit rounded-[0.9rem] border border-white/45 bg-black/25 px-4 py-3 backdrop-blur-sm">
                <h1 className="font-['Libre_Caslon_Text'] text-[clamp(1.7rem,4.8vw,4.2rem)] leading-[0.95] tracking-[0.02em] text-white">{coverTitle}</h1>
                {weddingDate ? <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/90">{weddingDate}</p> : null}
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
  mediaMap,
  variant,
  overrideMediaMap,
  setOverrideMediaMap,
}: {
  page: TemplatePage;
  accent: string;
  variant: 'inline' | 'fullscreen';
  mediaMap: Record<string, TemplateMediaAsset>;
  overrideMediaMap: Record<string, TemplateMediaAsset>;
  setOverrideMediaMap: (fn: (prev: Record<string, TemplateMediaAsset>) => Record<string, TemplateMediaAsset>) => void;
}) {
  const showChrome = variant !== 'fullscreen';
  const usesAbsoluteLayout = page.slots.some((slot) => Number.isFinite(Number(slot.x)) || Number.isFinite(Number(slot.y)));

  return (
    <div className={`h-full w-full ${variant === 'fullscreen' ? 'bg-[#FFF8F7]' : 'bg-[#FFF8F7] p-1'}`}>
      <div className={`flex h-full flex-col overflow-hidden ${showChrome ? 'rounded-2xl border border-[#ede5e8] bg-white p-2 shadow-[0_10px_28px_rgba(0,0,0,0.06)]' : 'rounded-[1.1rem] border border-[#ede5e8] bg-white p-0 shadow-[0_10px_28px_rgba(0,0,0,0.06)]'}`}>
        <div className={`relative flex-1 ${usesAbsoluteLayout ? 'mt-2 overflow-hidden' : `grid gap-0 ${variant === 'fullscreen' ? 'auto-rows-[minmax(80px,1fr)] grid-cols-2' : 'auto-rows-[minmax(64px,1fr)] grid-cols-2 gap-2 md:grid-cols-3'}`}`}>
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(3, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));
            const media = overrideMediaMap[slot.id] || mediaMap[slot.id];
            const isAbsolute = usesAbsoluteLayout;
            const left = Number.isFinite(Number(slot.x)) ? Number(slot.x) : 0;
            const top = Number.isFinite(Number(slot.y)) ? Number(slot.y) : 0;
            const width = Math.max(1, Number.isFinite(Number(slot.width)) ? Number(slot.width) : 1);
            const height = Math.max(1, Number.isFinite(Number(slot.height)) ? Number(slot.height) : 1);

            const handleDragOver = (e: React.DragEvent) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            };

            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              const dt = e.dataTransfer;
              if (dt.files && dt.files.length > 0) {
                const file = dt.files[0];
                const src = URL.createObjectURL(file);
                const now = Date.now();
                const newMedia: TemplateMediaAsset = {
                  id: `dropped-${now}`,
                  sourceId: `dropped-${now}`,
                  src,
                  label: file.name,
                  order: 9999,
                  mediaKind: file.type && file.type.startsWith('video') ? 'video' : 'image',
                  fileType: file.type || '',
                };
                setOverrideMediaMap((prev) => ({ ...prev, [slot.id]: newMedia }));
                return;
              }

              const url = dt.getData('text/uri-list') || dt.getData('text/plain');
              if (url) {
                const now = Date.now();
                const newMedia: TemplateMediaAsset = {
                  id: `dropped-${now}`,
                  sourceId: `dropped-${now}`,
                  src: url,
                  label: `Dropped ${now}`,
                  order: 9999,
                  mediaKind: 'image',
                  fileType: '',
                };
                setOverrideMediaMap((prev) => ({ ...prev, [slot.id]: newMedia }));
              }
            };

            return (
              <article
                key={`${page.pageNumber}-${slot.id}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`overflow-hidden border bg-[#faf8f9] ${isAbsolute ? 'absolute min-h-0 rounded-xl border-[#f3d6df]' : variant === 'fullscreen' ? 'min-h-0 rounded-none border-[#f3d6df]' : 'relative min-h-16 rounded-xl border-[#f3d6df]'}`}
                style={{
                  borderColor: `${accent || '#9b0044'}33`,
                  gridColumn: isAbsolute ? undefined : `span ${colSpan}`,
                  gridRow: isAbsolute ? undefined : `span ${rowSpan}`,
                  left: isAbsolute ? `${left}%` : undefined,
                  top: isAbsolute ? `${top}%` : undefined,
                  width: isAbsolute ? `${width}%` : undefined,
                  height: isAbsolute ? `${height}%` : undefined,
                }}
              >
                {media ? (
                  isVideoMedia(media.fileType, media.mediaKind) ? (
                    <video src={media.src} controls playsInline className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <img src={media.src} alt={media.label} className="absolute inset-0 h-full w-full object-cover" />
                  )
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.9),rgba(0,0,0,0.02))]" />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TemplateBookFlip({
  template,
  mediaItems = [],
  coverPhoto,
  coverPhotoName,
  coverWeddingDate,
  variant = 'inline',
  className = '',
}: TemplateBookFlipProps) {
  const bookRef = useRef<{ pageFlip?: () => { flipNext?: () => void; flipPrev?: () => void } } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookSize, setBookSize] = useState(
    variant === 'fullscreen' ? { width: 560, height: 760 } : { width: 260, height: 360 }
  );

  const pages = useMemo(() => getTemplatePages(template), [template]);

  const draftedMedia = useMemo(
    () => toTemplateMedia(mediaItems, coverPhoto, coverPhotoName),
    [mediaItems, coverPhoto, coverPhotoName]
  );

  const mediaMap = useMemo(() => buildSlotMediaMap(pages, draftedMedia), [pages, draftedMedia]);

  // Allow local override of slot -> media mapping when user drops an image
  const [overrideMediaMap, setOverrideMediaMap] = useState<Record<string, TemplateMediaAsset>>({});

  const accent = template.accent || '#b10e6b';
  const totalFlipPages = pages.length + 1;

  useEffect(() => {
    const computeSize = () => {
      if (variant === 'inline') {
        setBookSize({ width: 400, height: 540 });
        return;
      }

      const availableHeight = Math.max(520, window.innerHeight - 24);
      const availableWidth = Math.max(900, window.innerWidth - 24);
      const targetWidth = Math.max(420, Math.floor((availableWidth - 16) / 2));
      setBookSize({ width: targetWidth, height: availableHeight });
    };

    computeSize();
    window.addEventListener('resize', computeSize);
    return () => window.removeEventListener('resize', computeSize);
  }, [variant]);

  useEffect(() => {
    setCurrentPage(0);
    const id = window.setTimeout(() => {
      try {
        bookRef.current?.pageFlip?.()?.flipNext?.();
      } catch {
        // ignore flip init errors
      }
    }, 280);
    return () => window.clearTimeout(id);
  }, [template._id, mediaItems.length]);

  const flipNext = () => bookRef.current?.pageFlip?.()?.flipNext?.();
  const flipPrev = () => bookRef.current?.pageFlip?.()?.flipPrev?.();

  if (!pages.length) {
    return (
      <div className={`rounded-xl border border-dashed border-[#e1bec4] bg-[#fff8f7] p-6 text-center text-sm text-[#594045] ${className}`}>
        No template pages to preview.
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`flex w-full justify-center ${variant === 'fullscreen' ? 'overflow-hidden' : 'overflow-x-auto'}`}>
        <div style={{ width: bookSize.width, height: bookSize.height }}>
          <FlipBook
            ref={bookRef}
            width={bookSize.width}
            height={bookSize.height}
            minWidth={variant === 'inline' ? 260 : 320}
            minHeight={variant === 'inline' ? 360 : 520}
            maxWidth={variant === 'inline' ? 360 : 1300}
            maxHeight={variant === 'inline' ? 480 : 1200}
            showCover
            mobileScrollSupport
            className="mx-auto"
            onFlip={(event: { data: number }) => setCurrentPage(event.data)}
          >
            <div>
              <CoverPage template={template} accent={accent} coverPhoto={coverPhoto} coverPhotoName={coverPhotoName} coverWeddingDate={coverWeddingDate} variant={variant} />
            </div>

            {pages.map((page) => (
              <div key={`${page.pageNumber}-${page.pageLabel || 'page'}`} className="h-full w-full">
                <BookPage
                  page={page}
                  accent={accent}
                  variant={variant}
                  mediaMap={mediaMap}
                  overrideMediaMap={overrideMediaMap}
                  setOverrideMediaMap={setOverrideMediaMap}
                />
              </div>
            ))}
          </FlipBook>
        </div>
      </div>

      <div className={`flex items-center justify-center gap-3 ${variant === 'fullscreen' ? 'hidden' : ''}`}>
        <button
          type="button"
          onClick={flipPrev}
          className="p-2 rounded-full bg-[#f0e2e6] hover:bg-[#e5d4db] transition"
          title="Previous page"
        >
          <ChevronLeft size={18} className="text-[#211A1B]" />
        </button>
        <span className="text-xs font-semibold text-[#211A1B]">
          Page {Math.min(currentPage + 1, totalFlipPages)} of {totalFlipPages}
          {draftedMedia.length > 0 ? ` · ${draftedMedia.length} photos` : ''}
        </span>
        <button
          type="button"
          onClick={flipNext}
          className="p-2 rounded-full bg-[#f0e2e6] hover:bg-[#e5d4db] transition"
          title="Next page"
        >
          <ChevronRight size={18} className="text-[#211A1B]" />
        </button>
      </div>
    </div>
  );
}
