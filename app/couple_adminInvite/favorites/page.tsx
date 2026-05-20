'use client';

import Link from 'next/link';
import { ArrowRight, Heart as HeartIcon, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FavoritePhoto {
  id: string;
  url: string;
  albumName: string;
  date: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const showcaseCards = [
    {
      title: 'The Bridal Story',
      subtitle: 'Cinematic cover moment',
      size: 'h-[18rem] lg:h-[22rem]',
      background:
        'linear-gradient(135deg, rgba(33, 26, 27, 0.85) 0%, rgba(210, 50, 132, 0.65) 35%, rgba(255, 248, 247, 0.95) 100%)',
    },
    {
      title: 'City Light Walk',
      subtitle: 'Soft frame / editorial travel',
      size: 'h-52',
      background:
        'linear-gradient(135deg, rgba(243, 229, 230, 1) 0%, rgba(255, 248, 247, 0.95) 55%, rgba(221, 193, 202, 0.86) 100%)',
    },
    {
      title: 'Vogue Study',
      subtitle: 'High-contrast portrait crop',
      size: 'h-72',
      background:
        'linear-gradient(135deg, rgba(33, 26, 27, 0.9) 0%, rgba(95, 84, 88, 0.72) 48%, rgba(255, 248, 247, 0.96) 100%)',
    },
    {
      title: 'Ceremony Details',
      subtitle: 'Tablescape and florals',
      size: 'h-56',
      background:
        'linear-gradient(135deg, rgba(255, 248, 247, 1) 0%, rgba(245, 220, 227, 0.86) 50%, rgba(210, 50, 132, 0.42) 100%)',
    },
    {
      title: 'Archive Cut',
      subtitle: 'Lower frame / contact sheet',
      size: 'h-48',
      background:
        'linear-gradient(135deg, rgba(244, 236, 238, 1) 0%, rgba(255, 248, 247, 0.94) 52%, rgba(178, 14, 107, 0.28) 100%)',
    },
    {
      title: 'Golden Hour Reception',
      subtitle: 'The closing wide shot',
      size: 'h-[22rem]',
      background:
        'linear-gradient(135deg, rgba(33, 26, 27, 0.5) 0%, rgba(210, 50, 132, 0.2) 45%, rgba(255, 248, 247, 0.92) 100%)',
    },
  ];

  useEffect(() => {
    // TODO: Fetch favorite photos from API
    setLoading(false);
  }, []);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 md:pb-8">
      <div className="mb-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] mb-3" style={{ color: '#D23284' }}>
          Collection 04 / Favorites
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-none" style={{ color: '#2C1E26' }}>
              The Curated <span className="italic font-normal">Moments</span>
            </h1>
            <p className="text-lg md:text-xl italic max-w-2xl leading-relaxed" style={{ color: '#6B7387' }}>
              A selective anthology of your most cherished instances, captured with intentionality and preserved for eternity.
            </p>
          </div>

          <div className="flex items-center gap-6 rounded-full px-5 py-4 self-start lg:self-auto" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#9B9095' }}>Total Items</span>
              <span className="block text-3xl font-serif" style={{ color: '#2C1E26' }}>{favorites.length || 24}</span>
            </div>
            <div className="h-10 w-px" style={{ backgroundColor: '#E5CCD4' }}></div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#9B9095' }}>Curated On</span>
              <span className="block text-3xl font-serif" style={{ color: '#2C1E26' }}>Oct '23</span>
            </div>
          </div>
        </div>
      </div>

      {!loading && favorites.length === 0 ? (
        <div className="editorial-grid items-start">
          <div className="col-span-12 lg:col-span-5 rounded-2xl overflow-hidden relative min-h-[32rem]" style={{ backgroundColor: '#FFFFFF' }}>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 248, 247, 0.65) 0%, rgba(210, 50, 132, 0.1) 40%, rgba(33, 26, 27, 0.16) 100%)',
              }}
            ></div>
            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 px-4 py-2 shadow-sm">
                <Sparkles size={14} style={{ color: '#D23284' }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#9B9095' }}>
                  Curator's Choice
                </span>
              </div>
              <div className="rounded-2xl p-5 bg-white/90 backdrop-blur-sm shadow-xl max-w-[17rem]">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: '#D23284' }}>
                  Hero Selection
                </p>
                <h2 className="text-2xl font-serif font-bold mb-1" style={{ color: '#2C1E26' }}>
                  Editorial Portrait
                </h2>
                <p className="text-sm" style={{ color: '#6B7387' }}>
                  A cover-worthy frame reserved for the moments that lead the story.
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-5 rounded-2xl overflow-hidden relative h-[18rem]" style={{ background: showcaseCards[1].background }}>
              <div className="absolute inset-0 bg-[url('/images/logobg.png')] bg-no-repeat bg-[right_1rem_top_1rem] opacity-10"></div>
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-white/90 to-transparent">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#D23284' }}>{showcaseCards[1].title}</p>
                <p className="text-sm mt-1" style={{ color: '#6B7387' }}>{showcaseCards[1].subtitle}</p>
              </div>
            </div>

            <div className="col-span-12 md:col-span-7 rounded-2xl overflow-hidden relative h-[18rem]" style={{ background: showcaseCards[2].background }}>
              <div className="absolute inset-0 flex items-end justify-start p-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#D23284' }}>Favorites Selection</span>
                </div>
              </div>
              <div className="absolute top-5 left-5 text-white/80 text-[10px] font-bold uppercase tracking-[0.35em]">Vogue Study</div>
            </div>

            <div className="col-span-12 md:col-span-4 rounded-2xl overflow-hidden relative h-[15rem]" style={{ background: showcaseCards[3].background }}>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 to-transparent">
                <p className="font-serif text-lg" style={{ color: '#2C1E26' }}>{showcaseCards[3].title}</p>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 rounded-2xl overflow-hidden relative h-[15rem] mt-0 md:-mt-20" style={{ background: showcaseCards[4].background }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/90 px-4 py-3 shadow-lg">
                  <ImageIcon size={18} style={{ color: '#D23284' }} />
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 rounded-2xl overflow-hidden relative h-[20rem] md:h-[22rem] mt-0 md:-mt-8" style={{ background: showcaseCards[5].background }}>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white/90 to-transparent">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: '#9B9095' }}>Archive Cut</p>
                <p className="font-serif text-2xl" style={{ color: '#2C1E26' }}>{showcaseCards[5].title}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((photo) => (
            <div
              key={photo.id}
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="relative w-full h-72 overflow-hidden bg-[#FEF0F1]">
                <img
                  src={photo.url}
                  alt="Favorite photo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  className="absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-200"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  title="Remove from favorites"
                >
                  <HeartIcon size={18} style={{ color: '#E91E63', fill: '#E91E63' }} />
                </button>
              </div>

              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: '#9B9095' }}>
                  Favorite Selection
                </p>
                <p className="text-lg font-serif font-semibold" style={{ color: '#2C1E26' }}>
                  {photo.albumName}
                </p>
                <p className="text-sm mt-1" style={{ color: '#6B7387' }}>
                  {photo.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-20 py-16 text-center">
        <p className="max-w-xl mx-auto text-lg italic leading-relaxed" style={{ color: '#534345' }}>
          “Every curated moment is a step back into the light of that perfect day.”
        </p>
        <div className="mt-8">
          <Link
            href="/user-panel/albums"
            className="group inline-flex items-center gap-3 rounded-full border px-6 py-3 transition-colors"
            style={{ borderColor: 'rgba(33, 26, 27, 0.15)', backgroundColor: '#FFFFFF', color: '#2C1E26' }}
          >
            <span className="font-serif italic">View All Curations</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" style={{ color: '#D23284' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
