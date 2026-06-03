'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * @param {{ files?: File[], persistedMediaItems?: Array<{ id?: string, dataUrl?: string, mediaKind?: string }>, onRemoveUpload?: (index: number) => void, onRemovePersisted?: (id: string) => void }} props
 */
export default function LiveContentFeed(props) {
  const { files = [], persistedMediaItems = [], onRemoveUpload, onRemovePersisted } = props;
  const scrollRef = useRef(null);
  const lastPointerMoveRef = useRef(0);
  const [mediaItems, setMediaItems] = useState([]);
  const [isPointerInside, setIsPointerInside] = useState(false);

  useEffect(() => {
    const persistedItems = persistedMediaItems
      .filter((item) => item?.dataUrl)
      .map((item, index) => ({
        key: `persisted-${index + 1}`,
        id: item.id || `persisted-${index + 1}`,
        url: item.dataUrl,
        // Detect video by mediaKind OR fileType (with fallback)
        type: (item.mediaKind === 'video' || (item.fileType && item.fileType.startsWith('video'))) ? 'video' : 'image',
        persisted: true,
      }));

    const uploadedItems = files.map((file, index) => ({
      key: `upload-${index + 1}`,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      persisted: false,
    }));

    setMediaItems([...persistedItems, ...uploadedItems]);

    return () => {
      uploadedItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files, persistedMediaItems]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame;
    const speed = 0.35;
    const idleThresholdMs = 700;

    const autoScroll = () => {
      const isIdle = Date.now() - lastPointerMoveRef.current > idleThresholdMs;
      const shouldAutoScroll = !isPointerInside || isIdle;

      if (shouldAutoScroll) {
        container.scrollTop += speed;
      }

      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.scrollTop = 0;
      }

      frame = requestAnimationFrame(autoScroll);
    };

    frame = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(frame);
  }, [isPointerInside]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#b10e6b]/5 overflow-hidden">
      <div className="p-8 border-b">
        <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] font-bold">LIVE CONTENT FEED</h3>
        <p className="text-xs text-[#9a8a8e] mt-1">Saved and newly uploaded assets in one stream</p>
      </div>

      <div
        ref={scrollRef}
        className="p-6"
        style={{ height: '55vh', overflow: 'hidden' }}
        onMouseEnter={() => {
          lastPointerMoveRef.current = Date.now();
          setIsPointerInside(true);
        }}
        onMouseMove={() => {
          lastPointerMoveRef.current = Date.now();
        }}
        onMouseLeave={() => setIsPointerInside(false)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {mediaItems.map((media, index) => (
            <div key={`${media.key}-${index}`} className="relative rounded-2xl overflow-hidden bg-[#fdf1f3] border border-[#f3e4ea]">
              {media.type === 'video' ? (
                <video src={media.url} autoPlay muted loop playsInline style={{ height: '220px' }} className="w-full object-cover" />
              ) : (
                <img src={media.url} alt="Uploaded media" style={{ height: '220px' }} className="w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => {
                  if (media.persisted) {
                    onRemovePersisted?.(media.id);
                  } else {
                    onRemoveUpload?.(index);
                  }
                }}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                aria-label={media.persisted ? 'Remove saved media' : 'Remove uploaded media'}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {mediaItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#9a8a8e]">No media selected yet</div>
        ) : null}
      </div>
    </div>
  );
}