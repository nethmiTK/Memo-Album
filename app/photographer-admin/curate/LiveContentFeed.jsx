'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * @param {{ files?: File[] }} props
 */
export default function LiveContentFeed(props) {
  const { files = [] } = props;
  const scrollRef = useRef(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const nextItems = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }));

    setMediaItems(nextItems);

    return () => {
      nextItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame;
    const speed = 0.05;

    const autoScroll = () => {
      if (!isHovered) {
        container.scrollTop += speed;
      }

      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.scrollTop = 0;
      }

      frame = requestAnimationFrame(autoScroll);
    };

    frame = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(frame);
  }, [isHovered]);

  return (
    <div
      ref={scrollRef}
      style={{ height: '55vh', overflow: 'hidden' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {mediaItems.map((media, index) => (
          <div key={`${media.url}-${index}`} className="rounded-2xl overflow-hidden bg-[#fdf1f3]">
            {media.type === 'video' ? (
              <video src={media.url} autoPlay muted loop playsInline style={{ height: '220px' }} className="w-full object-cover" />
            ) : (
              <img src={media.url} alt="Uploaded media" style={{ height: '220px' }} className="w-full object-cover" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}