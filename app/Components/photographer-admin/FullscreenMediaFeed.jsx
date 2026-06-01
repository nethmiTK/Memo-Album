'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * @param {{ mediaItems?: Array<{ id?: string, dataUrl?: string, mediaKind?: string, fileName?: string }>, onClose?: () => void }} props
 */
export default function FullscreenMediaFeed(props) {
  const { mediaItems = [], onClose } = props;
  const scrollRef = useRef(null);
  const [isPointerInside, setIsPointerInside] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame;
    const speed = 0.5;

    const autoScroll = () => {
      if (!isPointerInside) {
        container.scrollTop += speed;

        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          container.scrollTop = 0;
        }
      }

      frame = requestAnimationFrame(autoScroll);
    };

    frame = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(frame);
  }, [isPointerInside]);

  const displayItems = mediaItems.filter((item) => item?.dataUrl);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur">
        <div>
          <h2 className="font-['Newsreader'] text-2xl text-white">Media Gallery</h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/60">
            {displayItems.length} {displayItems.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          aria-label="Close gallery"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8"
        onMouseEnter={() => setIsPointerInside(true)}
        onMouseLeave={() => setIsPointerInside(false)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item, index) => {
            const isVideo = item.mediaKind === 'video';
            return (
              <div
                key={item.id || `media-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-transform hover:scale-[1.02]"
              >
                {isVideo ? (
                  <video
                    src={item.dataUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-80 w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.dataUrl}
                    alt={item.fileName || 'Media'}
                    className="h-80 w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform group-hover:translate-y-0">
                  <p className="truncate text-xs font-medium text-white">
                    {item.fileName || `Media ${index + 1}`}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-white/60">
                    {isVideo ? 'Video' : 'Image'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {displayItems.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/40">
            No media items available
          </div>
        ) : null}
      </div>
    </div>
  );
}
