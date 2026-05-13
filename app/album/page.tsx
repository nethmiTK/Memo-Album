 'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValue, useSpring, Variants, MotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../Components/website/navbar';
import Footer from '../Components/website/Footer';

interface Album {
  _id: string;
  vendor_id: string;
  album_title: string;
  description: string;
  images: string;
  cover_image?: string;
  price: number;
  category: string;
  template_id?: string;
  template_data?: {
    background?: { type: string; value: string };
    colors?: { primary: string; secondary: string; accent: string; text?: string };
    photosPerPage?: number;
    slots?: any[];
    decorations?: { type: string; positions?: any[] };
    layoutType?: string;
  };
  template?: {
    name?: string;
    category?: string;
    colors?: { primary: string; secondary: string; accent: string; text?: string };
    layoutType?: string;
  };
  availability_status: string;
  publish_status: string;
  createdAt?: string;
}

interface Video {
  _id: string;
  vendor_id: string;
  video_url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  availability: boolean;
}

const MOCK_ALBUMS: Album[] = [
  {
    _id: 'mock-1',
    vendor_id: 'vendor-demo',
    album_title: 'Sunset Wedding Story',
    description: 'Golden-hour wedding moments with warm tones and elegant portraits.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=1200&q=80'
    ]),
    cover_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    price: 25000,
    category: 'Wedding',
    availability_status: 'available',
    publish_status: 'published',
  },
  {
    _id: 'mock-2',
    vendor_id: 'vendor-demo',
    album_title: 'Garden Engagement',
    description: 'Natural light portraits from a fresh outdoor engagement session.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80'
    ]),
    cover_image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    price: 18000,
    category: 'Engagement',
    availability_status: 'available',
    publish_status: 'published',
  },
  {
    _id: 'mock-3',
    vendor_id: 'vendor-demo',
    album_title: 'Beach Promise',
    description: 'Soft coastal colors, candid smiles, and dreamy wedding frames.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80'
    ]),
    cover_image: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1200&q=80',
    price: 32000,
    category: 'Beach Wedding',
    availability_status: 'available',
    publish_status: 'published',
  },
];

const MOCK_VIDEOS: Video[] = [
  {
    _id: 'video-1',
    vendor_id: 'vendor-demo',
    video_url: 'https://www.youtube.com/watch?v=R5Sx5vU6A2Q',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
    title: 'Wedding Highlights Reel',
    description: 'A cinematic 2-minute recap of a full wedding day.',
    availability: true,
  },
  {
    _id: 'video-2',
    vendor_id: 'vendor-demo',
    video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=900&q=80',
    title: 'Engagement Story Film',
    description: 'A romantic short film from a garden engagement shoot.',
    availability: true,
  },
  {
    _id: 'video-3',
    vendor_id: 'vendor-demo',
    video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    title: 'Pre-Wedding Teaser',
    description: 'A visual preview designed for social sharing.',
    availability: true,
  },
  {
    _id: 'video-4',
    vendor_id: 'vendor-demo',
    video_url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    thumbnail: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80',
    title: 'Reception Aftermovie',
    description: 'Energy, dance, and emotional highlights from reception night.',
    availability: true,
  },
];

// Helpers

const getImageUrl = (img: string) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return img;
  return `/uploads/${img}`;
};

const getImageArray = (images: string): string[] => {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return images.split(',').map(s => s.trim()).filter(Boolean);
  }
};

const getAlbumColors = (album: Album) => {
  const defaultColors = { primary: '#8B4513', secondary: '#D2691E', accent: '#DEB887', text: '#4A3728' };
  return album.template_data?.colors || album.template?.colors || defaultColors;
};

const getCategoryEmoji = (cat: string) => {
  const map: Record<string, string> = {
    'Wedding': '💒', 'Homecoming': '🏠', 'Reception': '🎊',
    'Engagement': '💍', 'Pre-Wedding': '💑', 'Birthday': '🎂',
    'Baby Shower': '👶', 'Beach Wedding': '🏖️', 'Garden Wedding': '🌿',
  };
  return map[cat] || '📸';
};

// Extract YouTube/Vimeo embed URL
const getEmbedUrl = (url: string): string => {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return url;
};

const getVideoThumbnail = (video: Video): string => {
  if (video.thumbnail) return video.thumbnail;
  const ytMatch = video.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  // Return a beautiful wedding placeholder instead of an empty string
  return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=500';
};

// ===================== 3D PERSPECTIVE HERO =====================
function UniqueHero3D({ albums, videos, categories, heroOpacity, heroScale }: { albums: Album[], videos: Video[], categories: string[], heroOpacity: number | MotionValue<number>, heroScale: number | MotionValue<number> }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const tiltX = useTransform(mouseYSpring, [-0.5, 0.5], ["5%", "-5%"]);
  const tiltY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5%", "5%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ opacity: heroOpacity, scale: heroScale, perspective: '1200px' }}
      className="relative min-h-[60vh] sm:min-h-[65vh] md:min-h-[75vh] overflow-hidden flex flex-col"
    >
      {/* Spacer for Fixed Navbar */}
      <div className="h-16 md:h-20 shrink-0" />
      {/* Premium Romantic Background */}
      <div className="absolute inset-0 romantic-bg">
        {/* Large Heart Shapes */}
        <div className="romantic-shape heart-shape" />
        <div className="romantic-shape heart-shape opacity-20 scale-75 -left-20 top-1/2 rotate-[165deg]" />

        {/* Floating Organic Blobs */}
        <div className="romantic-shape floating-blob top-[20%] left-[10%] opacity-20" />
        <div className="romantic-shape floating-blob top-[60%] right-[15%] opacity-10 scale-150" />

        {/* Waves at bottom */}
        <div className="wave-transition" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4 max-w-6xl mx-auto w-full">

          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full md:w-1/2 space-y-3 text-center md:text-left"
          >
            <div className="space-y-1">
 <h1
              className="max-w-xl text-5xl leading-[1.02] text-[#25181d] md:text-7xl"
               style={{ fontFamily: 'var(--font-newsreader)' }}
            >                Capturing <br />
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-[#920857] via-[#b43c8f] to-[#920857] bg-clip-text text-transparent">Forever</span>
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1, duration: 1.5 }}
                    viewBox="0 0 200 20"
                    className="absolute -bottom-1 left-0 w-full h-2 text-[#e7c5df] -z-10"
                  >
                    <path d="M5 15 Q 100 5 195 15" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  </motion.svg>
                </span>
                <br /> Moments
              </h1>
            </div>

            <p className="text-gray-500 text-sm md:text-base font-medium max-w-xl md:max-w-md mx-auto md:mx-0 leading-relaxed opacity-80">
              Experience wedding storytelling through unique 3D perspectives.
            </p>

            <div className="pt-4 flex flex-row gap-3 items-center justify-center md:justify-start">
              <button
                onClick={() => document.getElementById('album-gallery')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 md:px-8 py-2.5 md:py-4 bg-gray-900 text-white rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg hover:bg-[#920857] transition-all flex items-center justify-center gap-1.5"
              >
                Albums
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={() => document.getElementById('video-stories')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 md:px-8 py-2.5 md:py-4 bg-white/50 backdrop-blur-md text-gray-900 border border-gray-200 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-md hover:bg-white transition-all flex items-center justify-center"
              >
                Videos
              </button>
            </div>
          </motion.div>

          {/* Right: 3D Perspective Card Stack */}
          <div className="w-full md:w-1/2 relative mt-2 md:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative w-full aspect-[4/5] max-w-[240px] sm:max-w-[300px] md:max-w-[350px] mx-auto"
            >
              {/* Main Card */}
              <motion.div
                style={{ transform: "translateZ(50px)" }}
                className="absolute inset-0 bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-[#edd9e6] overflow-hidden"
              >
                <img
                  src={(albums.length > 0 && getImageArray(albums[0]?.images).length > 0) ? getImageUrl(getImageArray(albums[0].images)[0]) : "/images/album.png"}
                  className="w-full h-full object-cover"
                  alt="Featured wedding album"
                  onError={(e) => { e.currentTarget.src = "/images/album.png"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>

              {/* Secondary Floating Card */}
              <motion.div
                style={{ transform: "translateZ(100px)", x: tiltY, y: tiltX }}
                className="absolute -top-5 -right-5 md:-top-10 md:-right-10 w-32 h-44 md:w-48 md:h-64 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-[#edd9e6] overflow-hidden rotate-6"
              >
                <img
                  src={(albums.length > 1 && getImageArray(albums[1]?.images).length > 0) ? getImageUrl(getImageArray(albums[1].images)[0]) : "/images/album-stack-1.jpg"}
                  className="w-full h-full object-cover"
                  alt="Wedding moments preview"
                  onError={(e) => { e.currentTarget.src = "/images/album-stack-1.jpg"; }}
                />
              </motion.div>


            </motion.div>
          </div>

        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 hidden sm:flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Scroll to Explore</span>
          <div className="w-0.5 h-10 bg-gradient-to-b from-[#c15aa4] to-transparent rounded-full" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ===================== FULLSCREEN BOOK VIEWER =====================
function FullScreenBookViewer({ album, images, onClose }: { album: Album; images: string[]; onClose: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);

  const colors = getAlbumColors(album);
  const bg = album.template_data?.background || { type: 'solid', value: '#FFF8F0' };
  const pageBg = bg.type === 'gradient' ? bg.value : bg.value || '#FFF8F0';

  const getPagePairs = () => {
    const pairs: { left: string | 'cover' | 'end' | null; right: string | 'cover' | 'end' | null }[] = [];
    pairs.push({ left: null, right: 'cover' });
    for (let i = 0; i < images.length; i += 2) {
      pairs.push({ left: images[i] || null, right: images[i + 1] || null });
    }
    pairs.push({ left: 'end', right: null });
    return pairs;
  };

  const pagePairs = getPagePairs();
  const totalSpreads = pagePairs.length;

  const nextPage = useCallback(() => {
    if (currentPage < totalSpreads - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => { setCurrentPage(p => p + 1); setIsFlipping(false); }, 500);
    }
  }, [currentPage, totalSpreads, isFlipping]);

  const prevPage = useCallback(() => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => { setCurrentPage(p => p - 1); setIsFlipping(false); }, 500);
    }
  }, [currentPage, isFlipping]);

  const goToPage = useCallback((idx: number) => {
    if (!isFlipping && idx !== currentPage) {
      setIsFlipping(true);
      setTimeout(() => { setCurrentPage(idx); setIsFlipping(false); }, 300);
    }
  }, [isFlipping, currentPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextPage(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevPage(); }
      else if (e.key === 'Escape') { if (isBookOpen) setIsBookOpen(false); else onClose(); }
      else if (e.key === 'Enter' || e.key === ' ') { if (!isBookOpen) { e.preventDefault(); setIsBookOpen(true); } }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextPage, prevPage, isBookOpen, onClose]);

  const renderPageContent = (content: string | 'cover' | 'end' | null) => {
    if (content === null) return (
      <div className="h-full flex items-center justify-center opacity-40">
        <div className="text-center"><div className="text-6xl mb-3">🌸</div><p className="font-serif italic text-sm">Your story continues...</p></div>
      </div>
    );
    if (content === 'cover') return (
      <div className="h-full flex items-center justify-center p-8 md:p-12">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">{getCategoryEmoji(album.category)}</div>
          <h2 className="text-3xl md:text-4xl font-serif mb-4" style={{ color: colors.primary }}>{album.album_title}</h2>
          <div className="w-32 h-1 mx-auto mb-4" style={{ background: colors.accent }}></div>
          <p className="text-lg mb-2" style={{ color: colors.text || colors.primary }}>{album.category}</p>
          <p className="italic text-sm mt-4 max-w-xs mx-auto opacity-70" style={{ color: colors.text || '#666' }}>{album.description}</p>
          <div className="mt-8 flex items-center justify-center gap-2 opacity-60" style={{ color: colors.primary }}>
            <span>📸</span><span className="text-sm">{images.length} Beautiful Moments</span>
          </div>
        </div>
      </div>
    );
    if (content === 'end') return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6">💝</div>
          <h3 className="text-3xl font-serif mb-4" style={{ color: colors.primary }}>The End</h3>
          <p className="italic text-sm mb-8 opacity-70" style={{ color: colors.text || '#888' }}>Forever & Always</p>
          <button onClick={onClose} className="px-8 py-3 text-white rounded-full hover:opacity-90 transition-all shadow-lg" style={{ background: colors.primary }}>Close Album</button>
        </div>
      </div>
    );
    // Photo
    return (
      <div className="h-full p-5 md:p-8 flex items-center justify-center">
        <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl relative" style={{ border: `4px solid ${colors.accent}` }}>
          <img src={content} alt="Album photo" className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 w-8 h-8" style={{ borderWidth: '3px 0 0 3px', borderStyle: 'solid', borderColor: colors.accent }}></div>
          <div className="absolute top-2 right-2 w-8 h-8" style={{ borderWidth: '3px 3px 0 0', borderStyle: 'solid', borderColor: colors.accent }}></div>
          <div className="absolute bottom-2 left-2 w-8 h-8" style={{ borderWidth: '0 0 3px 3px', borderStyle: 'solid', borderColor: colors.accent }}></div>
          <div className="absolute bottom-2 right-2 w-8 h-8" style={{ borderWidth: '0 3px 3px 0', borderStyle: 'solid', borderColor: colors.accent }}></div>
        </div>
      </div>
    );
  };

  // CLOSED BOOK
  if (!isBookOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${colors.primary}F0 0%, ${colors.secondary}E0 50%, ${colors.accent}D0 100%)` }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl transition-colors z-10">✕</button>
        <div onClick={() => setIsBookOpen(true)} className="cursor-pointer transform hover:scale-105 transition-all duration-500 group" style={{ perspective: '2000px' }}>
          <div className="relative w-72 md:w-96 h-[420px] md:h-[550px] rounded-r-lg shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, boxShadow: '15px 15px 40px rgba(0,0,0,0.5), -3px 0 15px rgba(0,0,0,0.2) inset' }}>
            <div className="absolute left-0 top-0 bottom-0 w-10 rounded-l-lg" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)' }}></div>
            <div className="absolute inset-4 border-2 rounded-lg" style={{ borderColor: `${colors.accent}50` }}></div>
            <div className="absolute inset-6 border rounded-lg" style={{ borderColor: `${colors.accent}30` }}></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10">
              <div className="text-7xl mb-6 drop-shadow-lg">{getCategoryEmoji(album.category)}</div>
              <h2 className="text-3xl md:text-4xl font-serif text-center mb-4 drop-shadow-lg">{album.album_title}</h2>
              <div className="w-20 h-0.5 my-3" style={{ background: `${colors.accent}80` }}></div>
              <p className="text-white/90 text-center text-lg">{album.category}</p>
              <p className="text-white/60 text-sm mt-2">{images.length} Photos</p>
              <div className="mt-auto text-white/80 animate-pulse">✨ Click to Open ✨</div>
            </div>
            <div className="absolute right-0 top-6 bottom-6 w-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-amber-100" style={{ position: 'absolute', right: `${i * 0.5}px`, top: 0, bottom: 0, width: '1px', opacity: 0.5 - i * 0.04 }}></div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/30 blur-xl rounded-full"></div>
        </div>
        <p className="absolute bottom-8 text-white/60 text-center text-sm">
          Press <span className="px-2 py-1 bg-white/20 rounded text-xs">ENTER</span> to open • <span className="px-2 py-1 bg-white/20 rounded text-xs">ESC</span> to close
        </p>
      </div>
    );
  }

  // OPEN BOOK
  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${colors.primary}F5 0%, ${colors.secondary}EE 50%, ${colors.accent}E5 100%)` }}>
      <div className="flex justify-between items-center px-6 py-3 text-white/80">
        <button onClick={() => setIsBookOpen(false)} className="flex items-center gap-2 hover:text-white transition-colors text-sm">← Back to Cover</button>
        <h2 className="font-serif text-lg hidden md:block">{album.album_title}</h2>
        <button onClick={onClose} className="hover:text-white transition-colors text-2xl">✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 relative" style={{ perspective: '3000px' }}>
        <button onClick={prevPage} disabled={currentPage === 0 || isFlipping}
          className={`absolute left-2 md:left-6 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${currentPage === 0 || isFlipping ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-white/90 text-gray-800 hover:bg-white hover:scale-110'
            }`}><span className="text-2xl">◀</span></button>
        <div className="flex max-w-7xl w-full h-full max-h-[78vh]" style={{ transformStyle: 'preserve-3d' }}>
          <div className="flex-1 relative overflow-hidden" style={{ background: pageBg, boxShadow: 'inset -20px 0 50px rgba(0,0,0,0.12), -10px 10px 30px rgba(0,0,0,0.3)', borderRadius: '12px 0 0 12px', maxWidth: '50%' }}>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/12 to-transparent pointer-events-none"></div>
            <div className="relative h-full">{renderPageContent(pagePairs[currentPage]?.left)}</div>
            {currentPage > 0 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-serif text-sm opacity-40" style={{ color: colors.text || '#888' }}>{currentPage * 2}</div>}
          </div>
          <div className="w-6 md:w-8 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${colors.secondary} 0%, ${colors.primary} 50%, ${colors.secondary} 100%)`, boxShadow: '0 0 25px rgba(0,0,0,0.4)' }}></div>
          <div className="flex-1 relative overflow-hidden" style={{ background: pageBg, boxShadow: 'inset 20px 0 50px rgba(0,0,0,0.12), 10px 10px 30px rgba(0,0,0,0.3)', borderRadius: '0 12px 12px 0', maxWidth: '50%' }}>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/12 to-transparent pointer-events-none"></div>
            <div className="relative h-full">{renderPageContent(pagePairs[currentPage]?.right)}</div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-serif text-sm opacity-40" style={{ color: colors.text || '#888' }}>{currentPage * 2 + 1}</div>
            {isFlipping && <div className="absolute inset-0 origin-left animate-page-turn pointer-events-none" style={{ background: pageBg, boxShadow: 'inset 20px 0 50px rgba(0,0,0,0.15)' }}></div>}
          </div>
        </div>
        <button onClick={nextPage} disabled={currentPage === totalSpreads - 1 || isFlipping}
          className={`absolute right-2 md:right-6 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${currentPage === totalSpreads - 1 || isFlipping ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-white/90 text-gray-800 hover:bg-white hover:scale-110'
            }`}><span className="text-2xl">▶</span></button>
      </div>
      <div className="py-3 flex flex-col items-center gap-2">
        <div className="flex gap-1.5 max-w-md overflow-x-auto px-4">
          {pagePairs.map((_, idx) => (
            <button key={idx} onClick={() => goToPage(idx)} className="w-2.5 h-2.5 rounded-full transition-all flex-shrink-0"
              style={{ background: currentPage === idx ? '#fff' : 'rgba(255,255,255,0.35)', transform: currentPage === idx ? 'scale(1.4)' : 'scale(1)' }}></button>
          ))}
        </div>
        <div className="text-white/50 text-xs">Page {currentPage + 1} of {totalSpreads} • Use ← → arrow keys</div>
      </div>
      <style jsx>{`
        @keyframes page-turn { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(-180deg); } }
        .animate-page-turn { animation: page-turn 0.5s ease-in-out forwards; }
      `}</style>
    </div>
  );
}

// ===================== IMAGE LIGHTBOX =====================
function ImageLightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
      else if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl z-10"
      >
        ✕
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1, x: -5 }}
        onClick={(e) => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length); }}
        className="absolute left-4 md:left-8 w-14 h-14 bg-[#920857]/80 hover:bg-[#920857] rounded-full flex items-center justify-center text-white text-2xl z-10 shadow-lg"
      >
        ◀
      </motion.button>
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl max-h-[85vh] px-16"
        onClick={e => e.stopPropagation()}
      >
        <img src={images[current]} alt={`Photo ${current + 1}`} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
      </motion.div>
      <motion.button
        whileHover={{ scale: 1.1, x: 5 }}
        onClick={(e) => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length); }}
        className="absolute right-4 md:right-8 w-14 h-14 bg-[#920857]/80 hover:bg-[#920857] rounded-full flex items-center justify-center text-white text-2xl z-10 shadow-lg"
      >
        ▶
      </motion.button>
      <div className="absolute bottom-6 text-white/60 text-sm">{current + 1} / {images.length} • Use ← → keys</div>
    </motion.div>
  );
}

// ===================== ALBUM DETAIL (NORMAL BROWSE) =====================
function AlbumDetailView({ album, images, onClose, onOpenBook }: { album: Album; images: string[]; onClose: () => void; onOpenBook: () => void }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const colors = getAlbumColors(album);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen py-8 px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#920857] via-[#b43c8f] to-[#920857]">
            {images[0] && <img src={images[0]} alt={album.album_title} className="w-full h-full object-cover opacity-30" />}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-4"
                >
                  {getCategoryEmoji(album.category)}
                </motion.div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3 drop-shadow-lg">{album.album_title}</h1>
                <p className="text-white/80 text-lg">{album.category} • {images.length} Photos</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl backdrop-blur-sm"
            >
              ✕
            </motion.button>
          </div>

          {/* Info Bar */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#f8ebf5] to-[#f4ddec] border-b flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-gray-600 text-sm max-w-xl">{album.description}</p>
              {album.price > 0 && <p className="text-[#920857] font-bold text-2xl mt-2">Rs. {Number(album.price).toLocaleString()}</p>}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenBook}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium shadow-lg bg-gradient-to-r from-[#920857] to-[#b43c8f] hover:from-[#7f064c] hover:to-[#920857] transition-all"
            >
              <span className="text-xl">📖</span> Open as Book
            </motion.button>
          </div>

          {/* Image Gallery Grid */}
          <div className="p-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {images.map((img, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 }
                  }}
                  whileHover={{ y: -5 }}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                >
                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-[#920857]/30 transition-all flex items-center justify-center">
                    <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-[#920857]/80 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx + 1}/{images.length}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <ImageLightbox images={images} startIndex={lightboxIndex as number} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===================== VIDEO CARD =====================
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const thumbnail = getVideoThumbnail(video);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group cursor-pointer"
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
        {/* Thumbnail */}
        <div className="relative h-56 overflow-hidden">
          <motion.img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:bg-[#920857] transition-colors"
            >
              <span className="text-[#920857] text-2xl ml-1 group-hover:text-white transition-colors">▶</span>
            </motion.div>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-lg font-semibold drop-shadow-lg line-clamp-1">{video.title}</h3>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{video.description}</p>
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${video.availability
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-600'
              }`}>
              {video.availability ? '✓ Available' : 'Unavailable'}
            </span>
            <motion.span
              whileHover={{ x: 5 }}
              className="text-[#920857] text-sm font-medium flex items-center gap-1"
            >
              Watch Video <span>→</span>
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===================== MAIN PAGE =====================
export default function AlbumPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'book'>('browse');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'albums' | 'videos' | 'all'>('all');
  const router = useRouter();

  // Parallax and scroll effects
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);

  useEffect(() => {
    setAlbums(MOCK_ALBUMS);
    setVideos(MOCK_VIDEOS);
    setLoading(false);
  }, []);

  const categories = ['All', 'Wedding', 'Engagement'];
  const filteredAlbums = activeCategory === 'All' ? albums : albums.filter(a => a.category === activeCategory);

  const handleAlbumClick = (album: Album) => {
    router.push(`/v_album_admin/view-album/${album._id}?mode=scroll`);
  };

  const getProcessedImages = (album: Album) => {
    const albumImages = getImageArray(album.images).map(img => getImageUrl(img));
    // Include cover_image at the start if it exists and not already in images
    if (album.cover_image) {
      const coverUrl = getImageUrl(album.cover_image);
      if (!albumImages.includes(coverUrl)) {
        return [coverUrl, ...albumImages];
      }
    }
    return albumImages;
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const floatingAnimation: any = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  const scaleUpVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fff8f8] relative">
        <div className="flex flex-col">
          {/* ═══ 3D Perspective Hero ═══ */}
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <UniqueHero3D
              albums={albums}
              videos={videos}
              categories={categories}
              heroOpacity={1}
              heroScale={1}
            />
          </motion.div>

          <div className="flex flex-col">

            {/* ═══ SECTION 1: Ethereal Albums (Top 8) ═══ */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scaleUpVariants}
              className="py-12 sm:py-18 md:py-24 relative"
            >
              <div className="absolute top-0 right-0 floating-premium-text opacity-[0.02] select-none">ALBUMS</div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8 sm:mb-10 md:mb-12 text-center px-4"
                id="album-gallery"
              >
                <span className="text-[#920857] font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.4em] mb-2 block">Our Work</span>
 <h2
              className="max-w-xl text-5xl leading-[1.02] text-[#25181d] md:text-7xl"
               style={{ fontFamily: 'var(--font-newsreader)' }}
            >                  Curated <span className="text-[#920857] italic">Masterpieces</span>
                </h2>
                <div className="w-8 sm:w-16 md:w-24 h-0.5 md:h-1 bg-[#e7c5df] mx-auto mt-3 sm:mt-4 rounded-full" />
              </motion.div>

              {/* Category selection */}
              <div className="relative mb-8 sm:mb-10 md:mb-12 group">
                <div className="flex overflow-x-auto no-scrollbar items-center md:justify-center gap-2 sm:gap-3 px-4 sm:px-6 pb-3 sm:pb-4 -mx-4 sm:-mx-6 md:mx-0 snap-x snap-mandatory">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 snap-center px-6 md:px-8 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 border ${activeCategory === cat
                        ? 'bg-[#920857] text-white border-[#920857] shadow-xl shadow-[#d8b3cc] scale-105'
                        : 'bg-white/70 text-gray-600 border-[#ead5e4] hover:border-[#c98eb8] hover:bg-white backdrop-blur-md'
                        }`}
                    >
                      {getCategoryEmoji(cat)} {cat}
                    </motion.button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#920857] border-t-transparent" /></div>
              ) : (
                <div className="px-6 md:px-12">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-5 mb-8"
                  >
                    {filteredAlbums.slice(0, 25).map((album, idx) => {
                      const imageArray = getImageArray(album.images);
                      const firstImage = imageArray[0] ? getImageUrl(imageArray[0]) : '/images/placeholder-album.jpg';
                      return (
                        <motion.div
                          key={album._id}
                          variants={itemVariants}
                          whileHover={{ y: -10 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative cursor-pointer rounded-xl sm:rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 aspect-square md:aspect-[3/4]"
                          onClick={() => handleAlbumClick(album)}
                        >
                          {firstImage && <img src={firstImage} alt={album.album_title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" onError={(e) => { e.currentTarget.src = '/images/placeholder-album.jpg'; }} />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 text-white">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#e6c8de] mb-1">{album.category}</p>
                            <h3 className="text-xs md:text-2xl font-serif font-bold leading-tight uppercase tracking-tight">{album.album_title}</h3>
                            <div className="mt-4 flex items-center justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                              <span className="text-[10px] font-bold tracking-widest uppercase">View</span>
                              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm">→</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-3 bg-gradient-to-r from-[#920857] to-[#b43c8f] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all uppercase text-sm tracking-widest"
                      onClick={() => document.getElementById('album-gallery')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      View All Albums
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.section>

            {/* ═══ SECTION 2: The Full Experience (Masonry) ═══ */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scaleUpVariants}
              className="py-12 sm:py-18 md:py-24 relative"
            >
              <div className="container mx-auto px-4 sm:px-6 md:px-12">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-10 sm:mb-12 md:mb-14 grid gap-4 sm:gap-6 md:grid-cols-[0.9fr_1fr] md:items-end"
                >
                  <div>
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.45em] text-[#920857] mb-2 block">Seasonal Folders</span>
<h1
              className="max-w-xl text-5xl leading-[1.02] text-[#25181d] md:text-7xl"
               style={{ fontFamily: 'var(--font-newsreader)' }}
            >  The Collections</h1>
                  </div>
                  <p className="max-w-md text-sm leading-7 text-[#5d4f54] md:justify-self-end">
                    Curating each chapter with asymmetrical rhythm, soft atmosphere, and the timeless elegance of editorial albums.
                  </p>
                </motion.div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#920857] border-t-transparent" />
                  </div>
                ) : (
                  <div>
                    <div className="grid gap-5 md:grid-cols-2">
                      {filteredAlbums.length > 0 ? (
                        filteredAlbums.slice(0, 8).map((album, idx) => (
                          <motion.div
                            key={album._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden group cursor-pointer bg-[#fdf8fa] shadow-[0_24px_44px_rgba(33,26,27,0.12)] transition-all duration-500 rounded-2xl h-[280px] md:h-[320px]"
                            onClick={() => handleAlbumClick(album)}
                          >
                            <img
                              src={album.cover_image ? getImageUrl(album.cover_image) : (getImageArray(album.images)[0] ? getImageUrl(getImageArray(album.images)[0]) : '/images/placeholder-album.jpg')}
                              alt={album.album_title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder-album.jpg'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col items-start justify-end p-4 md:p-6">
                              <span className="text-[#f0dce8] text-[9px] font-black uppercase tracking-[0.22em] mb-1">
                                Collection {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h3 className="text-sm md:text-lg font-serif font-bold text-white leading-tight">
                                {album.album_title}
                              </h3>
                              <p className="mt-1 text-[10px] md:text-xs text-white/80">{album.category}</p>
                              <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-white">View</span>
                                <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs">→</div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center text-gray-500 font-serif italic">No albums found in this category.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>

            {/* ═══ SECTION 3: Cinematic Stories (Videos) ═══ */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scaleUpVariants}
              className="py-12 sm:py-18 md:py-24 relative"
              id="video-stories"
            >
              <div className="container mx-auto px-4 sm:px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 md:gap-12 items-center">
                  <motion.div className="lg:col-span-12 text-center mb-8 sm:mb-10 md:mb-12">
                    <span className="text-[#920857] font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.4em] mb-2 block">Cinematic Films</span>
                    <h1
              className="max-w-xl text-5xl leading-[1.02] text-[#25181d] md:text-7xl"
               style={{ fontFamily: 'var(--font-newsreader)' }}
            >  Captured <span className="text-[#920857] italic">Stories</span></h1>
                  </motion.div>

                  <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {videos.slice(0, 4).map((video, idx) => (
                      <motion.div
                        key={video._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative aspect-video rounded-[2rem] overflow-hidden shadow-xl cursor-pointer group"
                        onClick={() => window.open(video.video_url, '_blank')}
                      >
                        <img src={getVideoThumbnail(video)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30">▶</div>
                        </div>
                        <div className="absolute bottom-2 left-4 text-white font-serif font-bold text-xs md:text-lg drop-shadow-md">
                          {video.title}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ═══ SECTION 4: Join The Atelier ═══ */}
            <section className="bg-[#efe5e8] py-12 sm:py-16 md:py-20 lg:py-24">
              <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2 md:px-10">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#920857]/70">Join The Atelier</p>
                  <h3 className="mt-3 text-4xl leading-tight text-[#211a1b] md:text-6xl" style={{ fontFamily: 'var(--font-newsreader)' }}>
                    Curate Your Legacy
                  </h3>
                  <p className="mt-5 max-w-md text-sm leading-7 text-[#534345]">
                    We are seeking photographers who view weddings not as an event, but as curated narrative.
                    Join our collective and grow with intentional storytelling.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button className="rounded-xl bg-gradient-to-r from-[#920857] to-[#b43c8f] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_14px_32px_rgba(146,8,87,0.22)]">
                      Apply to Join
                    </button>
                    <button className="rounded-xl bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d5b61]">
                      Photographer Login
                    </button>
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-[460px]">
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
                    alt="Camera desk"
                    className="h-[260px] w-full rounded-2xl object-cover shadow-[0_30px_60px_rgba(33,26,27,0.18)]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1473691955023-da1c49c95c78?auto=format&fit=crop&w=700&q=80"
                    alt="Archive cards"
                    className="absolute -bottom-6 right-4 h-40 w-28 rounded-xl object-cover shadow-[0_18px_40px_rgba(33,26,27,0.2)]"
                  />
                </div>
              </div>
            </section>
 
           <Footer />
          </div>
        </div>
      </main>
    </>
  );
}