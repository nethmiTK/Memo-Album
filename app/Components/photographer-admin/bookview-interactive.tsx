'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { apiFetch, handleAuthError } from '@/lib/api';
import { toast } from 'react-toastify';

type MediaItem = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaKind: string;
  dataUrl?: string;
  order?: number;
};

type SlotAssignment = {
  slotId: string;
  slotLabel: string;
  mediaId: string | null;
  mediaOrder: number | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  mediaKind: string;
};

type PageLayout = {
  pageNumber: number;
  slotAssignments: SlotAssignment[];
};

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

type BookViewProps = {
  template: TemplateRecord;
  mediaItems?: MediaItem[];
  bookAlbumId?: string;
  isEditable?: boolean;
  onMediaUpdate?: (pageNumber: number, slotId: string, media: MediaItem | null) => void;
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

function InteractiveBookPage({
  page,
  template,
  isEditable,
  availableMedia,
  onSlotUpdate,
}: {
  page: PageLayout;
  template: TemplateRecord;
  isEditable: boolean;
  availableMedia: MediaItem[];
  onSlotUpdate?: (pageNumber: number, slotId: string, media: MediaItem | null) => void;
}) {
  const pageLabel = `Page ${page.pageNumber}`;
  const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, media: SlotAssignment) => {
    if (!isEditable) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('slotData', JSON.stringify(media));
    setDraggedItem(media as any);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSlot: SlotAssignment) => {
    if (!isEditable) return;
    e.preventDefault();

    const sourceData = e.dataTransfer.getData('mediaItem');
    if (!sourceData) return;

    try {
      const sourceMedia: MediaItem = JSON.parse(sourceData);
      onSlotUpdate?.(page.pageNumber, targetSlot.slotId, sourceMedia);
      setDraggedItem(null);
      setDragOverSlot(null);
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const handleRemoveMedia = (slotId: string) => {
    onSlotUpdate?.(page.pageNumber, slotId, null);
  };

  return (
    <div className="h-full w-full bg-[#FEF6F6] p-4 md:p-6">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e9d8dd] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#f0e2e6] px-4 py-3 md:px-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">{pageLabel}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">{page.slotAssignments?.length || 0} slots</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid auto-rows-max grid-cols-2 gap-3">
            {page.slotAssignments?.map((slot) => (
              <div
                key={slot.slotId}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slot)}
                onDragLeave={() => setDragOverSlot(null)}
                className={`aspect-video rounded-[0.65rem] border-2 transition overflow-hidden relative group ${
                  slot.dataUrl
                    ? 'border-[#b10e6b]/30 bg-gray-100'
                    : dragOverSlot === slot.slotId
                    ? 'border-[#b10e6b] border-solid bg-[#fff0f4]'
                    : 'border-dashed border-[#d4c5ca] bg-[#f9eef3]/40 hover:border-[#b10e6b]'
                }`}
              >
                {slot.dataUrl ? (
                  <>
                    {slot.mediaKind === 'image' && slot.dataUrl ? (
                      <img src={slot.dataUrl} alt={slot.fileName} className="w-full h-full object-cover" />
                    ) : slot.dataUrl ? (
                      <video src={slot.dataUrl} className="w-full h-full object-cover" controls playsInline preload="metadata" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-300">
                        <span className="text-[10px] font-bold tracking-widest text-gray-600">MEDIA</span>
                      </div>
                    )}
                    {isEditable && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRemoveMedia(slot.slotId)}
                          className="p-2 bg-red-500 rounded-full hover:bg-red-600"
                          title="Remove media"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-[8px] p-1 truncate">
                      {slot.fileName}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase text-[#8d7d81]">{slot.slotLabel}</p>
                      <p className="text-[8px] text-[#8d7d81]/60 mt-1">{isEditable ? 'Drop here' : slot.slotId}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

export function BookViewInteractive({
  template,
  mediaItems = [],
  bookAlbumId,
  isEditable = false,
  onMediaUpdate,
}: BookViewProps) {
  const bookRef = useRef<any>(null);
  const bookHoverRef = useRef(false);
  const autoFlipTimerRef = useRef<number | null>(null);
  const [bookSize, setBookSize] = useState({ width: 560, height: 760 });
  const [currentPage, setCurrentPage] = useState(0);
  const [pageLayouts, setPageLayouts] = useState<PageLayout[]>([]);

  const pages = useMemo(() => {
    if (Array.isArray(template.pages) && template.pages.length > 0) return template.pages;
    return [{ pageNumber: 1, pageLabel: 'Page 1', slots: template.slots || [] }];
  }, [template]);

  useEffect(() => {
    // Initialize page layouts from media if we have a bookAlbumId
    if (bookAlbumId && isEditable) {
      fetchBookAlbum();
    } else if (mediaItems.length > 0) {
      // Generate initial layouts from media
      initializeLayouts();
    }
  }, [bookAlbumId, mediaItems]);

  const fetchBookAlbum = async () => {
    try {
      const response = await apiFetch(`/book-albums/${bookAlbumId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPageLayouts(result.bookAlbum.pageLayouts || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch book album:', error);
    }
  };

  const initializeLayouts = () => {
    // Build layouts from available media and template
    const tempLayouts = buildPageLayouts(mediaItems);
    setPageLayouts(tempLayouts);
  };

  const buildPageLayouts = (media: MediaItem[]): PageLayout[] => {
    // Build page layouts with slot assignments from media
    const slotMap: { [key: string]: string[] } = {
      'template-1': ['leftHero', 'leftWide', 'leftBottom', 'leftTall', 'rightHero', 'rightBottomMain', 'rightBottomSide'],
      'template-2': ['leftTop', 'leftMain', 'leftBottom', 'leftSide', 'rightTop', 'rightMain', 'rightBottom'],
      'template-3': ['leftMain', 'leftInset', 'leftBottom', 'leftTall', 'rightHero', 'rightInset', 'rightFooter'],
      'template-4': ['leftHero', 'leftInsetA', 'leftInsetB', 'leftBottom', 'rightMain', 'rightBottomA', 'rightBottomB'],
      'template-5': ['leftWide', 'leftCard', 'leftBottom', 'leftTall', 'rightHero', 'rightCard', 'rightBottom'],
    };

    // Try to match template ID to slot map
    let slots: string[] = [];
    const templateId = template._id.toString();
    
    // Check if template._id contains any template pattern
    if (templateId.includes('template')) {
      const key = Object.keys(slotMap).find(k => templateId.includes(k.replace('template-', '')));
      if (key) slots = slotMap[key];
    }
    
    // Fallback to first available slots if no match
    if (!slots.length) {
      slots = Object.values(slotMap)[0];
    }

    const slotsPerPage = slots.length;
    const layouts: PageLayout[] = [];

    const pageCount = Math.max(1, Math.ceil(media.length / slotsPerPage));

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const slotAssignments: SlotAssignment[] = slots.map((slotId: string, slotIdx: number) => {
        const mediaIndex = (pageNum - 1) * slotsPerPage + slotIdx;
        const m = media[mediaIndex];

        return {
          slotId,
          slotLabel: slotId,
          mediaId: m?.id || null,
          mediaOrder: m?.order || null,
          fileName: m?.fileName || '',
          fileType: m?.fileType || '',
          fileSize: m?.fileSize || 0,
          dataUrl: m?.dataUrl || '',
          mediaKind: m?.mediaKind || 'image',
        };
      });

      layouts.push({
        pageNumber: pageNum,
        slotAssignments,
      });
    }

    return layouts;
  };

  const handleSlotUpdate = async (pageNumber: number, slotId: string, media: MediaItem | null) => {
    if (!pageLayouts.length) return;

    const updatedLayouts = pageLayouts.map((layout) => {
      if (layout.pageNumber === pageNumber) {
        return {
          ...layout,
          slotAssignments: layout.slotAssignments.map((slot) => {
            if (slot.slotId === slotId) {
              return media
                ? {
                    ...slot,
                    mediaId: media.id,
                    fileName: media.fileName,
                    fileType: media.fileType,
                    fileSize: media.fileSize,
                    dataUrl: media.dataUrl || '',
                    mediaKind: media.mediaKind,
                  }
                : {
                    ...slot,
                    mediaId: null,
                    fileName: '',
                    fileType: '',
                    fileSize: 0,
                    dataUrl: '',
                    mediaKind: 'image',
                  };
            }
            return slot;
          }),
        };
      }
      return layout;
    });

    setPageLayouts(updatedLayouts);
    onMediaUpdate?.(pageNumber, slotId, media || null);

    // Update backend if bookAlbumId exists
    if (bookAlbumId && isEditable) {
      try {
        await apiFetch(`/book-albums/${bookAlbumId}/slot`, {
          method: 'PATCH',
          body: JSON.stringify({
            pageNumber,
            slotId,
            mediaItem: media || null,
          }),
        });
      } catch (error) {
        console.error('Failed to update slot:', error);
      }
    }
  };

  const flipNext = () => bookRef.current?.pageFlip?.().flipNext?.();
  const flipPrev = () => bookRef.current?.pageFlip?.().flipPrev?.();

  const stopAutoFlip = () => {
    if (autoFlipTimerRef.current) {
      window.clearInterval(autoFlipTimerRef.current);
      autoFlipTimerRef.current = null;
    }
  };

  const startAutoFlip = () => {
    if (autoFlipTimerRef.current || pages.length <= 1 || isEditable) return;

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
  }, [pages.length, currentPage, isEditable]);

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

            {pageLayouts.length > 0
              ? pageLayouts.map((layout) => (
                  <InteractiveBookPage
                    key={layout.pageNumber}
                    page={layout}
                    template={template}
                    isEditable={isEditable}
                    availableMedia={mediaItems}
                    onSlotUpdate={handleSlotUpdate}
                  />
                ))
              : pages.map((page) => (
                  <InteractiveBookPage
                    key={page.pageNumber}
                    page={{
                      pageNumber: page.pageNumber,
                      slotAssignments: (page.slots || []).map((slot) => ({
                        slotId: slot.id,
                        slotLabel: slot.label,
                        mediaId: null,
                        mediaOrder: null,
                        fileName: '',
                        fileType: '',
                        fileSize: 0,
                        dataUrl: '',
                        mediaKind: 'image',
                      })),
                    }}
                    template={template}
                    isEditable={isEditable}
                    availableMedia={mediaItems}
                    onSlotUpdate={handleSlotUpdate}
                  />
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