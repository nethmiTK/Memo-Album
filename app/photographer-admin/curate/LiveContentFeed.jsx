'use client';

import { useRef, useEffect } from 'react';

export default function LiveContentFeed({ files = [] }) {
  const scrollRef = useRef(null);

  const mediaItems = files.map((file) => ({
    url: URL.createObjectURL(file),
    type: file.type.startsWith('video') ? 'video' : 'image',
  }));

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame;
    const speed = 0.4;

    const autoScroll = () => {
      container.scrollTop += speed;

      if (container.scrollTop >= container.scrollHeight / 2) {
        container.scrollTop = 0;
      }

      frame = requestAnimationFrame(autoScroll);
    };

    frame = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={scrollRef} style={{ height: '55vh', overflow: 'hidden' }}>
      <div className="space-y-4">
        {[...mediaItems, ...mediaItems].map((item, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 mb-4">
            {[0, 1, 2].map((j) => {
              const media = mediaItems[(i + j) % mediaItems.length];
              if (!media) return null;

              return (
                <div key={j} className="rounded-2xl overflow-hidden">
                  {media.type === 'video' ? (
                    <video src={media.url} autoPlay muted loop className="h-[220px] w-full object-cover" />
                  ) : (
                    <img src={media.url} className="h-[220px] w-full object-cover" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}