'use client';

import { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Filter,
  Menu,
  Plus,
  Search,
  Settings2,
  Upload,
} from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import PhotographerSidebar from '../../../Components/photographer-admin/sidebar';

const FlipBook = HTMLFlipBook as any;

const liveAssets = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=700&fit=crop',
];

const narrativeAssets = [
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1523438097201-512ae7d59d4b?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=800&fit=crop',
];

const spreadPages = [
  {
    title: 'Minimal Layout',
    layout: 'minimal',
    images: ['https://images.unsplash.com/photo-1523438097201-512ae7d59d4b?w=1200&h=1400&fit=crop'],
  },
  {
    title: 'Editorial Layout',
    layout: 'editorial',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=1400&fit=crop'],
  },
  {
    title: 'Mosaic Layout',
    layout: 'mosaic',
    images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=1400&fit=crop'],
  },
  {
    title: 'Portrait Layout',
    layout: 'portrait',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=1400&fit=crop'],
  },
];

export default function TemplateWorkspacePage() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [narrative, setNarrative] = useState(narrativeAssets);
  const bookRef = useRef<any>(null);
  const visibleAssets = useMemo(() => {
    if (!filter.trim()) return narrativeAssets;
    return narrative.filter((asset) => asset.includes(filter.trim().toLowerCase()));
  }, [filter, narrative]);

  const flipNext = () => bookRef.current?.pageFlip?.().flipNext?.();
  const flipPrev = () => bookRef.current?.pageFlip?.().flipPrev?.();

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const nextNarrative = [...narrative];
    const [moved] = nextNarrative.splice(draggedIndex, 1);
    nextNarrative.splice(index, 0, moved);
    setNarrative(nextNarrative);
    setDraggedIndex(null);
  };

  return (
    <div className="flex min-h-screen bg-[#fff8f8] text-[#211a1b]">
 
      <div className="min-w-0 flex-1">
         

        <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
          <section className="mb-12 max-w-3xl">
            <h2 className="font-[Newsreader] text-4xl italic text-[#211a1b] md:text-5xl">Template Workspace</h2>
            <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[#534345]">
              Curate high-end photography monographs with precise editorial control and asymmetric rhythm.
            </p>
          </section>

          <section className="mb-12 rounded-[1.5rem] bg-white/80 p-5 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#534345]">Live Content Feed</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b10e6b]">Streaming assets</span>
            </div>
            <div className="overflow-x-auto pb-2 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
              <div className="inline-flex gap-4 pr-3">
                {liveAssets.map((src, index) => (
                  <article
                    key={index}
                    className="w-[280px] flex-shrink-0 overflow-hidden rounded-[1rem] bg-[#fff8f7] shadow-[0_20px_40px_-18px_rgba(33,26,27,0.22)]"
                  >
                    <img alt="Live content preview" className="h-[300px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0" src={src} />
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#534345]">Active Monograph</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b10e6b]">Cover upload</span>
                </div>
                <label className="group relative block aspect-[4/5] cursor-pointer overflow-hidden rounded-[1.25rem] border border-[rgba(33,26,27,0.08)] bg-[#fff8f7] shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)]">
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  {coverPreview ? (
                    <img alt="Cover preview" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={coverPreview} />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,rgba(210,50,132,0.08),transparent_55%)] px-6 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(33,26,27,0.08)]">
                        <Upload className="h-9 w-9 text-[#b10e6b]" />
                      </div>
                      <div>
                        <p className="font-[Newsreader] text-2xl italic text-[#211a1b]">Drop cover photo</p>
                        <p className="mt-2 text-sm text-[#534345]">Upload a cover image for the active monograph.</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#ebe0e1] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">
                        <Plus className="h-3.5 w-3.5" />
                        Add cover
                      </span>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-3 rounded-[1.25rem] bg-white/80 p-4 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#534345]">Layout Auto-Filter</span>
                  <Filter className="h-4 w-4 text-[#534345]" />
                </div>
                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="w-full rounded-[0.75rem] border-0 bg-[#ebe0e1] py-4 px-4 text-sm text-[#211a1b] outline-none placeholder:text-[#534345]/50 focus:ring-2 focus:ring-[#b10e6b]/20"
                  placeholder="Type to filter templates..."
                />
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[rgba(177,14,107,0.2)] bg-[rgba(177,14,107,0.1)] px-3 py-1 text-[10px] font-semibold text-[#b10e6b]">Minimal (12)</span>
                  <span className="rounded-full border border-[rgba(33,26,27,0.08)] bg-[#f3e5e6] px-3 py-1 text-[10px] text-[#534345]">Editorial (8)</span>
                  <span className="rounded-full border border-[rgba(33,26,27,0.08)] bg-[#f3e5e6] px-3 py-1 text-[10px] text-[#534345]">Mosaic (5)</span>
                </div>
              </div>
            </aside>

            <div className="space-y-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-[Newsreader] text-xl italic text-[#211a1b] md:text-2xl">Spread Editorial</h3>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#534345]">Pages 12 &amp; 13 • 0.5&quot; Inner Margin</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={flipPrev} className="rounded-full bg-[#ebe0e1] p-3 text-[#534345] transition-colors hover:bg-[#f3e5e6]" aria-label="Previous spread">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={flipNext} className="rounded-full bg-[#b10e6b] p-3 text-white shadow-[0_16px_36px_rgba(177,14,107,0.24)] transition-transform hover:scale-105" aria-label="Next spread">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative rounded-[1.5rem] bg-[#fff8f7] p-4 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)] md:p-6">
                <div className="absolute right-6 top-6 z-10 hidden items-center gap-2 text-[10px] italic text-[#b10e6b]/50 md:flex">
                  <span className="h-2 w-2 rounded-full bg-[#b10e6b]" />
                  Dynamic Asset Rotation
                </div>

                <div className="overflow-hidden rounded-[1rem] bg-[#fff8f7]">
                  <FlipBook
                    ref={bookRef}
                    width={560}
                    height={760}
                    size="stretch"
                    minWidth={320}
                    maxWidth={1100}
                    minHeight={420}
                    maxHeight={900}
                    showCover={false}
                    mobileScrollSupport
                    className="mx-auto"
                    style={{}}
                  >
                    {spreadPages.map((page, index) => (
                      <article key={page.title} className="flex h-full w-full items-stretch justify-stretch bg-white p-4 md:p-6">
                        <div className="grid h-full w-full grid-cols-5 gap-4">
                          <div className="col-span-3 overflow-hidden rounded-[1rem] bg-[#f3e5e6]">
                            <img alt={page.title} className="h-full w-full object-cover" src={page.images[0]} />
                          </div>
                          <div className="col-span-2 flex flex-col justify-between rounded-[1rem] bg-[#fdfcfc] p-5">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b10e6b]">Page {index + 1}</p>
                              <h4 className="mt-2 font-[Newsreader] text-3xl italic text-[#211a1b]">{page.title}</h4>
                              <p className="mt-3 text-sm leading-6 text-[#534345]">
                                {page.layout === 'minimal' && 'Clean and spacious layout with maximum whitespace.'}
                                {page.layout === 'editorial' && 'Editorial spread with text and image harmony.'}
                                {page.layout === 'mosaic' && 'Multi-image mosaic grid layout.'}
                                {page.layout === 'portrait' && 'Full-page portrait layout for single hero images.'}
                              </p>
                            </div>
                            <div className="flex items-center justify-between rounded-[1rem] bg-[#ebe0e1] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#534345]">
                              <span>{page.layout}</span>
                              <span className="inline-flex items-center gap-2 text-[#b10e6b]"><ChevronDown className="h-3.5 w-3.5" />Flip</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </FlipBook>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 rounded-[1rem] bg-[#b10e6b] px-6 py-4 font-[Newsreader] text-white shadow-[0_16px_36px_rgba(177,14,107,0.24)] transition-transform hover:-translate-y-0.5">
                  Save Narrative Spread
                </button>
                <button className="rounded-[1rem] bg-[#ebe0e1] px-8 py-4 font-[Newsreader] text-[#534345] transition-colors hover:bg-[#f3e5e6]">
                  Discard
                </button>
              </div>
            </div>
          </section>

          <section className="mt-20 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-[Newsreader] text-2xl italic text-[#211a1b]">Narrative Flow</h3>
                <span className="rounded-full bg-[#ecd4db] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">Drag to Reorder</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#534345]">24 Assets Selected</span>
            </div>

            <div className="overflow-x-auto rounded-[1.5rem] bg-[#fff8f7] p-6 shadow-[0_24px_48px_-12px_rgba(33,26,27,0.08)] md:p-8">
              <div className="inline-flex items-center gap-4 md:gap-6">
                {visibleAssets.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    className={`group relative h-48 w-36 cursor-grab flex-shrink-0 overflow-hidden rounded-[0.75rem] transition-transform hover:scale-105 active:cursor-grabbing ${
                      index === 0 ? 'ring-2 ring-[#b10e6b] ring-offset-4 ring-offset-[#fff8f7]' : ''
                    } ${draggedIndex === index ? 'opacity-60 scale-95' : ''}`}
                  >
                    <img alt={`Narrative asset ${index + 1}`} className="h-full w-full object-cover" src={src} />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 text-white">
                      <span className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold">{index + 1}</span>
                      <GripVertical className="h-4 w-4 opacity-80" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </button>
                ))}

                <button className="flex h-48 w-36 flex-shrink-0 items-center justify-center rounded-[0.75rem] border-2 border-dashed border-[rgba(33,26,27,0.15)] bg-white/40 text-[#534345] transition-colors hover:border-[#b10e6b] hover:text-[#b10e6b]" aria-label="Append asset">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ebe0e1] text-xl font-bold">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Append</span>
                  </div>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}