'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Download, Sparkles } from 'lucide-react';
import { TemplateRecord, TemplatePage, TemplateMediaAsset, getTemplatePages, buildSlotMediaMap, toTemplateMedia, CurateMediaInput } from '@/lib/template-book-media';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HTMLFlipBook from 'react-pageflip';

const FlipBook = HTMLFlipBook as any;

interface FullscreenBookProps {
  template: TemplateRecord;
  mediaItems: CurateMediaInput[];
  coverPhoto?: string;
  coverPhotoName?: string;
  onClose: () => void;
}

function CoverPage({ template, accent, coverPhoto, coverPhotoName }: { template: TemplateRecord; accent: string; coverPhoto?: string; coverPhotoName?: string }) {
  const coverTitle = coverPhotoName || template.name || 'Album Book';
  const coverImage = coverPhoto || template.coverImage;

  return (
    <div className="h-full w-full bg-[#FEF6F6] p-6">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e9d8dd] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#f0e2e6] px-5 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8d7d81]">Cover</p>
        </div>

        <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[#fff8f7] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,0,68,0.06),transparent_45%),linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.4))]" />

          <div className="relative z-10 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">
            <span>MemoAlbum</span>
            <span>Fullscreen Book Preview</span>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-none flex-1 items-center justify-center py-4">
            <div className="relative overflow-hidden rounded-[1.2rem] border border-[#ead5dc] bg-[#fbf6f7] p-6 shadow-[0_16px_32px_rgba(0,0,0,0.06)] w-full">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.85),rgba(0,0,0,0.02))]" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8d7d81]">Cover Photo</p>
                  <h1 className="mt-3 font-['Libre_Caslon_Text'] text-[36px] leading-[1.05] text-[#1a1c1d]">{coverTitle}</h1>
                </div>

                {coverImage && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#ead5dc] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                    <img src={coverImage} alt={coverTitle} className="h-96 w-full object-cover" />
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">
                  <Sparkles className="h-4 w-4 text-[#9b0044]" />
                  First page cover
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-[#f0e2e6] pt-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#8d7d81]">
            <span>Open like a book</span>
            <span>Auto-flip enabled</span>
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
  onMediaClick,
}: {
  page: TemplatePage;
  accent: string;
  pageLabel: string;
  mediaMap: Record<string, TemplateMediaAsset>;
  onMediaClick: (media: TemplateMediaAsset) => void;
}) {
  return (
    <div className="h-full w-full bg-[#FFF8F7] p-2">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-[#ede5e8] bg-white p-4 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#f2e8ec] pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">{pageLabel}</p>
        </div>

        <div className="mt-3 grid flex-1 auto-rows-[minmax(120px,1fr)] grid-cols-2 gap-3">
          {page.slots.map((slot) => {
            const colSpan = Math.max(1, Math.min(2, slot.width || 1));
            const rowSpan = Math.max(1, Math.min(3, slot.height || 1));
            const media = mediaMap[slot.id];

            return (
              <div
                key={`${page.pageNumber}-${slot.id}`}
                className="relative overflow-hidden rounded-2xl border bg-[#faf8f9] cursor-pointer hover:border-[#b10e6b] transition-colors"
                style={{
                  borderColor: `${accent || '#9b0044'}33`,
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
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

export function FullscreenBook({ template, mediaItems, coverPhoto, coverPhotoName, onClose }: FullscreenBookProps) {
  const bookRef = useRef<any>(null);
  const bookHoverRef = useRef(false);
  const autoFlipTimerRef = useRef<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<TemplateMediaAsset | null>(null);
  const [mediaZoom, setMediaZoom] = useState(100);
  const [bookSize, setBookSize] = useState({ width: 600, height: 800 });
  const [bookScale, setBookScale] = useState(100);

  const pages = useMemo(() => getTemplatePages(template), [template]);
  const draftedMedia = useMemo(() => toTemplateMedia(mediaItems, coverPhoto, coverPhotoName), [mediaItems, coverPhoto, coverPhotoName]);
  const mediaMap = useMemo(() => buildSlotMediaMap(pages, draftedMedia), [pages, draftedMedia]);

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

  const exportToPDF = async () => {
    if (!bookRef.current) return;
    
    setIsExporting(true);
    stopAutoFlip();
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const totalPages = pages.length + 1;
      for (let i = 0; i < totalPages; i++) {
        bookRef.current?.pageFlip?.().flip?.(i);
        await new Promise(resolve => setTimeout(resolve, 800));

        const flipBookElement = bookRef.current?.getElement?.();
        const pageElement = flipBookElement?.querySelector('.stf__item.--active');
        
        if (pageElement) {
          const canvas = await html2canvas(pageElement as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        }
      }

      pdf.save(`${template.name || 'book'}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
      startAutoFlip();
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-[#FFF1F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#ead5dc] bg-[#FFF1F3]/95 px-6 py-3 backdrop-blur">
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
              onClick={exportToPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-[#b10e6b] text-white rounded-lg hover:bg-[#9b0044] transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              <Download size={16} />
              {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}
            </button>
            
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
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        <div 
          className="flex h-full w-full items-center justify-center"
          style={{ transform: `scale(${bookScale / 100})`, transition: 'transform 0.3s ease' }}
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
                <CoverPage template={template} accent={accent} coverPhoto={coverPhoto} coverPhotoName={coverPhotoName} />
              </div>
              {pages.map((page) => (
                <div key={`${page.pageNumber}-${page.pageLabel || 'page'}`}>
                  <BookPage 
                    page={page} 
                    accent={accent} 
                    pageLabel={page.pageLabel || `Page ${page.pageNumber}`}
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
      <footer className="border-t border-[#ead5dc] bg-[#FFF1F3] px-6 py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d7d81]">
        Page {Math.min(currentPage + 1, pages.length + 1)} of {pages.length + 1}
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
