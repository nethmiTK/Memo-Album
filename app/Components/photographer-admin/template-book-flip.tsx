'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

const FlipBook = HTMLFlipBook as React.ComponentType<Record<string, unknown>>;

type TemplateBookFlipProps = {
  template: TemplateRecord;
  mediaItems?: CurateMediaInput[];
  coverPhoto?: string;
  coverPhotoName?: string;
  /** inline = designer panel, fullscreen = dedicated book route */
  variant?: 'inline' | 'fullscreen';
  className?: string;
};

function CoverPage({ template, accent }: { template: TemplateRecord; accent: string }) {
  const coverTitle = template.name || 'Template Book';
  const coverImage = template.coverImage || template.coverUrl;
  const previewSlots = (template.pages?.[0]?.slots || template.slots || []).slice(0, 4);

  return (
    <div className="h-full w-full bg-[#FEF6F6] p-3 md:p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.2rem] border border-[#e9d8dd] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#f0e2e6] px-3 py-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">Cover</p>
          <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">{template.pages?.length || 1} pages</p>
        </div>

        <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-[#fff8f7] p-4">
          <h1 className="font-['Libre_Caslon_Text'] text-xl leading-tight text-[#1a1c1d] md:text-2xl">{coverTitle}</h1>
          {template.description ? (
            <p className="mt-2 text-[11px] leading-5 text-[#6b5d60] line-clamp-3">{template.description}</p>
          ) : null}

          {coverImage ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#ead5dc]">
              <img src={coverImage} alt={coverTitle} className="h-28 w-full object-cover md:h-36" />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {previewSlots.map((slot, index) => (
                <div
                  key={`${slot.id}-${index}`}
                  className="rounded-lg border border-[#ead5dc] bg-white p-2"
                  style={{ borderColor: `${accent}28` }}
                >
                  <div className="h-10 rounded-md bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(155,0,68,0.03))]" />
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-[#8d7d81] truncate">
                    {slot.label || slot.id}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">
            <Sparkles className="h-3.5 w-3.5 text-[#9b0044]" />
            Open like a book
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
    <div className="h-full w-full bg-[#FFF8F7] p-1">
      <div className="flex h-full flex-col overflow-hidden rounded-[1rem] border border-[#ede5e8] bg-white p-2 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#f2e8ec] pb-1.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">{pageLabel}</p>
          <span className="text-[8px] uppercase tracking-[0.14em] text-[#8d7d81]">{page.slots.length} slots</span>
        </div>

        <div className="mt-2 grid flex-1 auto-rows-[minmax(64px,1fr)] grid-cols-2 gap-2 md:grid-cols-3">
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(3, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));
            const media = mediaMap[slot.id];

            return (
              <article
                key={`${page.pageNumber}-${slot.id}`}
                className="relative overflow-hidden rounded-xl border bg-[#faf8f9] min-h-[64px]"
                style={{
                  borderColor: `${accent || '#9b0044'}33`,
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                }}
              >
                {media ? (
                  isVideoMedia(media.fileType, media.mediaKind) ? (
                    <video src={media.src} controls playsInline className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <img src={media.src} alt={media.label} className="absolute inset-0 h-full w-full object-cover" />
                  )
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.85),rgba(0,0,0,0.02))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.45))]" />
                <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/75">{slot.kind}</p>
                  <p className="truncate text-[10px] font-semibold">{slot.label || slot.id}</p>
                </div>
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
  variant = 'inline',
  className = '',
}: TemplateBookFlipProps) {
  const bookRef = useRef<{ pageFlip?: () => { flipNext?: () => void; flipPrev?: () => void } } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookSize, setBookSize] = useState(
    variant === 'fullscreen' ? { width: 560, height: 760 } : { width: 300, height: 400 }
  );

  const pages = useMemo(() => getTemplatePages(template), [template]);

  const draftedMedia = useMemo(
    () => toTemplateMedia(mediaItems, coverPhoto, coverPhotoName),
    [mediaItems, coverPhoto, coverPhotoName]
  );

  const mediaMap = useMemo(() => buildSlotMediaMap(pages, draftedMedia), [pages, draftedMedia]);

  const accent = template.accent || '#b10e6b';
  const totalFlipPages = pages.length + 1;

  useEffect(() => {
    const computeSize = () => {
      if (variant === 'inline') {
        setBookSize({ width: 300, height: 400 });
        return;
      }
      const availableHeight = Math.max(420, window.innerHeight - 160);
      const availableWidth = Math.max(720, window.innerWidth - 48);
      const targetWidth = Math.max(360, Math.floor((availableWidth - 24) / 2));
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
      <div className="flex w-full justify-center overflow-x-auto">
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
              <CoverPage template={template} accent={accent} />
            </div>
            {pages.map((page) => (
              <div key={`${page.pageNumber}-${page.pageLabel || 'page'}`}>
                <BookPage
                  page={page}
                  accent={accent}
                  pageLabel={page.pageLabel || `Page ${page.pageNumber}`}
                  mediaMap={mediaMap}
                />
              </div>
            ))}
          </FlipBook>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
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
