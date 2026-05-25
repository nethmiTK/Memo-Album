'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type TemplateSlot = {
  id: string;
  label: string;
  kind: string;
  width?: number;
  height?: number;
  emphasis?: string;
};

type TemplatePage = {
  pageNumber: number;
  pageLabel?: string;
  slots: TemplateSlot[];
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

const FlipBook = HTMLFlipBook as any;

function CoverPage({ template, accent }: { template: TemplateRecord; accent: string }) {
  const coverTitle = template.name || 'Template Book';
  const coverImage = template.coverImage || template.coverUrl;

  return (
    <div className="h-full w-full bg-[#FEF6F6] p-4 md:p-6">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e9d8dd] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#f0e2e6] px-4 py-3 md:px-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">Cover</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">{template.pages?.length || 0} pages</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8">
          {coverImage && (
            <img src={coverImage} alt={coverTitle} className="mb-6 max-h-32 max-w-full rounded-lg object-contain" />
          )}

          <h1 className="text-center text-2xl font-bold text-[#211A1B] md:text-3xl">{coverTitle}</h1>

          {template.description && <p className="mt-3 text-center text-sm text-[#211A1B]/70">{template.description}</p>}

          <div className="mt-auto flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#b10e6b]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookPage({ page, template }: { page: TemplatePage; template: TemplateRecord }) {
  const pageLabel = page.pageLabel || `Page ${page.pageNumber}`;

  return (
    <div className="h-full w-full bg-[#FEF6F6] p-4 md:p-6">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e9d8dd] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#f0e2e6] px-4 py-3 md:px-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">{pageLabel}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">{page.slots?.length || 0} slots</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid auto-rows-max grid-cols-2 gap-3">
            {page.slots?.map((slot) => (
              <div
                key={slot.id}
                className="aspect-video rounded-[0.65rem] border-2 border-dashed border-[#d4c5ca] bg-[#f9eef3]/40 flex items-center justify-center p-3 text-center hover:border-[#b10e6b] transition"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#8d7d81]">{slot.label}</p>
                  <p className="text-[8px] text-[#8d7d81]/60 mt-1">{slot.kind}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

type BookViewProps = {
  template: TemplateRecord;
};

export function BookView({ template }: BookViewProps) {
  const bookRef = useRef<any>(null);
  const bookHoverRef = useRef(false);
  const autoFlipTimerRef = useRef<number | null>(null);
  const [bookSize, setBookSize] = useState({ width: 560, height: 760 });
  const [currentPage, setCurrentPage] = useState(0);

  const pages = useMemo(() => {
    if (Array.isArray(template.pages) && template.pages.length > 0) return template.pages;
    return [{ pageNumber: 1, pageLabel: 'Page 1', slots: template.slots || [] }];
  }, [template]);

  const flipNext = () => bookRef.current?.pageFlip?.().flipNext?.();
  const flipPrev = () => bookRef.current?.pageFlip?.().flipPrev?.();

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
    startAutoFlip();

    return () => stopAutoFlip();
  }, [pages.length, currentPage]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 w-full"
      onMouseEnter={() => (bookHoverRef.current = true)}
      onMouseLeave={() => (bookHoverRef.current = false)}
    >
      <div className="flex h-auto w-full justify-center overflow-x-auto">
        <div style={{ width: bookSize.width, height: bookSize.height }}>
          <FlipBook
            ref={bookRef}
            width={bookSize.width}
            height={bookSize.height}
            minWidth={300}
            minHeight={400}
            maxWidth={700}
            maxHeight={900}
            showCover
            onPageChange={(e: any) => setCurrentPage(e.data)}
          >
            <CoverPage template={template} accent={template.accent || '#b10e6b'} />

            {pages.map((page) => (
              <BookPage key={page.pageNumber} page={page} template={template} />
            ))}
          </FlipBook>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={flipPrev}
          className="p-3 rounded-full bg-[#f0e2e6] hover:bg-[#e5d4db] transition flex items-center justify-center"
          title="Previous page"
        >
          <ChevronLeft size={20} className="text-[#211A1B]" />
        </button>

        <span className="text-sm font-semibold text-[#211A1B]">
          Page {currentPage + 1} of {pages.length + 1}
        </span>

        <button
          onClick={flipNext}
          className="p-3 rounded-full bg-[#f0e2e6] hover:bg-[#e5d4db] transition flex items-center justify-center"
          title="Next page"
        >
          <ChevronRight size={20} className="text-[#211A1B]" />
        </button>
      </div>
    </div>
  );
}
