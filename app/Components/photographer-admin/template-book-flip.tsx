'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

function CoverPage({ template, accent, coverPhoto, variant }: { template: TemplateRecord; accent: string; coverPhoto?: string; variant: 'inline' | 'fullscreen' }) {
  const coverTitle = template.name || 'Template Book';
  const coverImage = coverPhoto || template.coverImage || template.coverUrl;
  const previewSlots = (template.pages?.[0]?.slots || template.slots || []).slice(0, 4);
  const showChrome = variant !== 'fullscreen';

  return (
    <div className={`h-full w-full ${variant === 'fullscreen' ? 'bg-[#FFF8F7]' : 'bg-[#FEF6F6] p-3 md:p-4'}`}>
      <div className={`flex h-full flex-col overflow-hidden ${showChrome ? 'rounded-[1.2rem] border border-[#e9d8dd] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]' : 'rounded-[1.1rem] border border-[#ead5dc] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)]'}`}>
        {showChrome ? (
          <div className="flex items-center justify-between border-b border-[#f0e2e6] px-3 py-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">Cover</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">{template.pages?.length || 1} pages</p>
          </div>
        ) : null}

        <div className={`relative flex flex-1 flex-col overflow-hidden ${showChrome ? 'justify-center bg-[#fff8f7] p-4' : 'justify-center bg-white p-0'}`}>
          {showChrome ? (
            <>
              <h1 className="font-['Libre_Caslon_Text'] text-xl leading-tight text-[#1a1c1d] md:text-2xl">{coverTitle}</h1>
              {template.description ? (
                <p className="mt-2 text-[11px] leading-5 text-[#6b5d60] line-clamp-3">{template.description}</p>
              ) : null}
            </>
          ) : null}

          {coverImage ? (
            <div className={`${showChrome ? 'mt-3' : 'h-full w-full'} overflow-hidden ${showChrome ? 'rounded-xl border border-[#ead5dc] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.06)]' : ''}`}>
              <img src={coverImage} alt={coverTitle} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className={`grid h-full w-full grid-cols-2 gap-2 ${showChrome ? 'mt-3' : ''}`}>
              {previewSlots.map((slot, index) => (
                <div
                  key={`${slot.id}-${index}`}
                  className="rounded-lg border border-[#ead5dc] bg-white p-2"
                  style={{ borderColor: `${accent}28` }}
                >
                  <div className="h-10 rounded-md bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(155,0,68,0.03))]" />
                </div>
              ))}
            </div>
          )}

          {showChrome ? (
            <div className="mt-3 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">
              <Sparkles className="h-3.5 w-3.5 text-[#9b0044]" />
              Open like a book
            </div>
          ) : null}
        </div>
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

  return (
    <div className={`h-full w-full ${variant === 'fullscreen' ? 'bg-[#FFF8F7]' : 'bg-[#FFF8F7] p-1'}`}>
      <div className={`flex h-full flex-col overflow-hidden ${showChrome ? 'rounded-2xl border border-[#ede5e8] bg-white p-2 shadow-[0_10px_28px_rgba(0,0,0,0.06)]' : 'rounded-[1.1rem] border border-[#ede5e8] bg-white p-0 shadow-[0_10px_28px_rgba(0,0,0,0.06)]'}`}>
        <div className={`grid flex-1 gap-0 ${variant === 'fullscreen' ? 'auto-rows-[minmax(80px,1fr)] grid-cols-2' : 'mt-2 auto-rows-[minmax(64px,1fr)] grid-cols-2 gap-2 md:grid-cols-3'}`}>
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(3, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));
            const media = overrideMediaMap[slot.id] || mediaMap[slot.id];

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
                className={`relative overflow-hidden border bg-[#faf8f9] ${variant === 'fullscreen' ? 'min-h-0 rounded-none border-[#f3d6df]' : 'min-h-16 rounded-xl border-[#f3d6df]'}`}
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

  // Allow local override of slot -> media mapping when user drops an image
  const [overrideMediaMap, setOverrideMediaMap] = useState<Record<string, TemplateMediaAsset>>({});

  // For fullscreen variant show two-page spreads (pairs)
  const spreads = useMemo(() => {
    if (variant !== 'fullscreen') return pages.map((p) => [p]);
    const out: TemplatePage[][] = [];
    for (let i = 0; i < pages.length; i += 2) {
      out.push([pages[i], pages[i + 1]].filter(Boolean) as TemplatePage[]);
    }
    return out;
  }, [pages, variant]);

  const accent = template.accent || '#b10e6b';
  const totalFlipPages = (variant === 'fullscreen' ? spreads.length : pages.length) + 1;

  useEffect(() => {
    const computeSize = () => {
      if (variant === 'inline') {
        setBookSize({ width: 300, height: 400 });
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
              <CoverPage template={template} accent={accent} coverPhoto={coverPhoto} variant={variant} />
            </div>

            {variant === 'fullscreen'
              ? spreads.map((pair, idx) => (
                  <div key={`spread-${idx}`} className="flex h-full w-full">
                    {pair.map((page) => (
                      <div key={`${page.pageNumber}-${page.pageLabel || 'page'}`} className="w-1/2 h-full p-2">
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
                    {pair.length === 1 ? <div className="w-1/2 h-full p-2" /> : null}
                  </div>
                ))
              : pages.map((page) => (
                    <div key={`${page.pageNumber}-${page.pageLabel || 'page'}`}>
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
