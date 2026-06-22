'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import { useEffect, useState } from 'react';
import API_URL from '@/lib/api';
import Navbar from '../Components/website/navbar';
import Footer from '../Components/website/Footer';
import { FullscreenBook } from '@/app/Components/photographer-admin/FullscreenBook';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-newsreader',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const DEFAULT_FEATURED: any[] = [];

const collaborationSteps = [
  {
    number: '01',
    title: 'Connect',
    text: 'Share your mood, favorite frames, and timeline so the archive starts from your story.',
  },
  {
    number: '02',
    title: 'Curate',
    text: 'Your photographer arranges each spread with editorial rhythm and artful sequencing.',
  },
  {
    number: '03',
    title: 'Cherish',
    text: 'Approve your final album and receive a keepsake crafted for future generations.',
  },
];

const journalEntries: any[] = [];

export default function HomePage() {
  const [featuredPhotographers, setFeaturedPhotographers] = useState(DEFAULT_FEATURED);
  const [activePhotographerCount, setActivePhotographerCount] = useState<number | null>(null);
  const [publicBookAlbums, setPublicBookAlbums] = useState<any[]>([]);
  const [selectedPublicBook, setSelectedPublicBook] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFeatured = async () => {
      try {
        const res = await fetch(`${API_URL}/photographer/public-users?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        const data = await res.json();
        
        console.log('Home page Featured Photographers Response:', data);
        
        // Handle both data.users and data.data
        const users = data?.users || data?.data || [];
        
        if (!res.ok || !Array.isArray(users) || users.length === 0) {
          console.warn('No featured photographers available');
          return;
        }

        const mapped = users
          .map((u: any) => ({
            name: u.name || 'Photographer',
            role: u.role || u.roleName || (u.roleId?.roleName || 'photographer'),
            image: u.profileImage || u.image || u.profilePic || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
            social: {
              instagram: u.instagram || '',
              facebook: u.facebook || '',
              tiktok: u.tiktok || '',
              youtube: u.youtube || '',
              website: u.website || '',
            },
          }))
          .slice(0, 10);

        if (mounted && mapped.length > 0) setFeaturedPhotographers(mapped);

        // active photographer count
        try {
          const activeCount = Array.isArray(users) ? users.filter((u: any) => u.isActive || u.status === 'active').length : 0;
          if (mounted) setActivePhotographerCount(activeCount);
        } catch (e) {
          // ignore
        }
      } catch (err) {
        // silent fallback to default
        console.error('Failed to load featured photographers', err);
      }
    };

    loadFeatured();

    // load public book albums for Recent Journals
    const loadPublicBooks = async () => {
      try {
        const r = await fetch(`${API_URL}/book-albums/public`, { cache: 'no-store' });
        const j = await r.json();
        if (r.ok && j && Array.isArray(j.bookAlbums)) {
          if (mounted) setPublicBookAlbums(j.bookAlbums.slice(0, 10));
        }
      } catch (e) {
        console.error('Failed to load public book albums', e);
      }
    };

    loadPublicBooks();

    return () => {
      mounted = false;
    };
  }, []);
  const openPublicBookFullscreen = (book: any) => {
    // Build template and mediaItems for FullscreenBook
    const template = book.templateId || { pages: [], slots: [] };

    let mediaItems: any[] = [];
    if (book.curateId && Array.isArray(book.curateId.mediaItems) && book.curateId.mediaItems.length > 0) {
      mediaItems = book.curateId.mediaItems.map((m: any, idx: number) => ({
        id: m.id || `m-${idx}`,
        order: m.order || idx + 1,
        fileName: m.fileName || '',
        fileType: m.fileType || '',
        fileSize: m.fileSize || 0,
        dataUrl: m.dataUrl || m.src || '',
        mediaKind: m.mediaKind || 'image',
      }));
    } else if (Array.isArray(book.pageLayouts)) {
      const collected: any[] = [];
      book.pageLayouts.forEach((p: any) => {
        (p.slotAssignments || []).forEach((s: any, idx: number) => {
          if (s && (s.dataUrl || s.fileName)) {
            collected.push({
              id: s.mediaId || `pl-${p.pageNumber}-${idx}`,
              order: s.mediaOrder || collected.length + 1,
              fileName: s.fileName || '',
              fileType: '',
              fileSize: 0,
              dataUrl: s.dataUrl || '',
              mediaKind: s.mediaKind || 'image',
            });
          }
        });
      });
      mediaItems = collected;
    }

    setSelectedPublicBook({ template, mediaItems, coverPhoto: book.curateId?.coverPhoto || '', coverPhotoName: book.curateId?.coverPhotoName || book.albumName || '' });
  };

  const closePublicBook = () => setSelectedPublicBook(null);
  const getImageUrl = (url: string | undefined) => {
    if (!url) return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/images/')) return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800';
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const journalCards =
    publicBookAlbums.length > 0
      ? publicBookAlbums.map((book) => {
          let coverImg = book.curateId?.coverPhoto || book.curateId?.coverPhotoName;
          if (!coverImg && Array.isArray(book.curateId?.mediaItems) && book.curateId.mediaItems.length > 0) {
            coverImg = book.curateId.mediaItems[0].dataUrl || book.curateId.mediaItems[0].fileName;
          } else if (!coverImg && Array.isArray(book.pageLayouts) && book.pageLayouts.length > 0) {
            const firstSlot = book.pageLayouts[0].slotAssignments?.[0];
            if (firstSlot?.dataUrl) coverImg = firstSlot.dataUrl;
          }
          return {
            title: book.albumName || book.curateId?.albumName || 'Album',
            image: getImageUrl(coverImg),
            raw: book,
          };
        })
      : journalEntries;

  const socialLinks = (social: Record<string, string | undefined> = {}) => [
    {
      key: 'instagram',
      href: social.instagram,
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 1.9A3.9 3.9 0 0 0 3.9 7.8v8.4a3.9 3.9 0 0 0 3.9 3.9h8.4a3.9 3.9 0 0 0 3.9-3.9V7.8a3.9 3.9 0 0 0-3.9-3.9H7.8zm8.9 1.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9A3.1 3.1 0 1 0 12 15a3.1 3.1 0 0 0 0-6.2z" />
        </svg>
      ),
    },
    {
      key: 'facebook',
      href: social.facebook,
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H16.8V4.9c-.3 0-1.2-.1-2.3-.1-2.2 0-3.8 1.3-3.8 3.9V11H8v3h2.7v8h2.8z" />
        </svg>
      ),
    },
    {
      key: 'tiktok',
      href: social.tiktok,
      label: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M16.6 2c.4 1.9 1.5 3.5 3.4 4.1v2.6c-1.2 0-2.4-.3-3.4-.8v6.2c0 3.4-2.8 6.1-6.2 6.1S4.6 17.5 4.6 14.1c0-3.4 2.8-6.1 6.2-6.1.3 0 .6 0 .9.1v2.9c-.3-.1-.6-.2-.9-.2-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2 3.2-1.4 3.2-3.2V2h2.6z" />
        </svg>
      ),
    },
    {
      key: 'youtube',
      href: social.youtube,
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M23 12s0-3.2-.4-4.7a3 3 0 0 0-2.1-2.1C19 4.8 12 4.8 12 4.8s-7 0-8.5.4a3 3 0 0 0-2.1 2.1C1 8.8 1 12 1 12s0 3.2.4 4.7a3 3 0 0 0 2.1 2.1C5 19.2 12 19.2 12 19.2s7 0 8.5-.4a3 3 0 0 0 2.1-2.1c.4-1.5.4-4.7.4-4.7zM10 15.5V8.5l6 3.5-6 3.5z" />
        </svg>
      ),
    },
    {
      key: 'website',
      href: social.website,
      label: 'Website',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.9 9h-3.1a15.5 15.5 0 0 0-1.2-5A8.1 8.1 0 0 1 19.9 11zM12 4.1c.9 1.2 2.1 3.6 2.7 6.9H9.3C9.9 7.7 11.1 5.3 12 4.1zM8.4 6a15.5 15.5 0 0 0-1.2 5H4.1A8.1 8.1 0 0 1 8.4 6zM4.1 13h3.1a15.5 15.5 0 0 0 1.2 5A8.1 8.1 0 0 1 4.1 13zM12 19.9c-.9-1.2-2.1-3.6-2.7-6.9h5.4c-.6 3.3-1.8 5.7-2.7 6.9zM15.6 18a15.5 15.5 0 0 0 1.2-5h3.1a8.1 8.1 0 0 1-4.3 5z" />
        </svg>
      ),
    },
  ].filter((item) => item.href);

  return (
    <main
      className={`${newsreader.variable} ${plusJakarta.variable} bg-[#fff8f8] text-[#211a1b]`}
      style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
    >
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 sm:px-5 pb-16 sm:pb-24 pt-12 sm:pt-16 md:px-10 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="grid items-center gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[1.05fr_1fr]"
        >
          <div>
            <p className="mb-3 sm:mb-5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] sm:tracking-[0.28em] text-[#8c0053]">
              Archive Marketplace
            </p>
            <h1
              className="max-w-xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] sm:leading-[1.05] text-[#25181d]"
               style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              The Vow of Silence
            </h1>
            <p className="mt-4 sm:mt-6 max-w-lg text-xs sm:text-sm leading-6 sm:leading-7 text-[#534345] md:text-base">
              An editorial destination where couples and photographers co-create
              wedding archives with grace, depth, and timeless emotional detail.
            </p>
            <div className="mt-6 sm:mt-9 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link
                href="/album"
                className="rounded-xl bg-linear-to-r from-[#890051] to-[#d23284] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-[0_18px_40px_rgba(137,0,81,0.18)] transition hover:-translate-y-0.5 text-center"
              >
                Begin Archive
              </Link>
              <Link
                href="/about-us"
                className="rounded-xl bg-[#f3e5e6] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#8c0053] transition hover:bg-[#ecd4db] text-center"
              >
                Curator Notes
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-85 sm:max-w-95 md:max-w-120 mt-2 sm:mt-0">
            <div className="absolute left-0 top-4 z-20 h-28 w-24 rounded-xl border border-white/70 bg-[#fff8f8]/92 p-2 shadow-[0_24px_60px_rgba(33,26,27,0.18)] backdrop-blur-md sm:left-4 sm:top-4 sm:h-28 sm:w-24 md:-left-8 md:top-16 md:h-48 md:w-40 md:rounded-2xl md:p-3">
              <img
                src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80"
                alt="Ring details"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, rotate: -2, y: 30 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
              className="overflow-hidden rounded-[22px] sm:rounded-3xl bg-[#fff8f8] p-2 sm:p-3 shadow-[0_20px_50px_rgba(33,26,27,0.15)] sm:shadow-[0_38px_80px_rgba(33,26,27,0.15)] pt-14 sm:pt-3"
            >
              <img
                src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
                alt="Bride portrait"
                className="h-80 sm:h-95 md:h-127.5 w-full rounded-[18px] sm:rounded-2xl object-cover object-[center_35%]"
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

        {featuredPhotographers.length > 0 &&
          <section className="bg-[#fff8f7] py-12 sm:py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-10">
              <div className="mb-8 sm:mb-10 md:mb-12">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#8c0053]">
                  Featured Photographers
                </p>
                <h2
                  className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#25181d] leading-tight"
                  style={{ fontFamily: 'var(--font-newsreader)' }}
                >
                  Curated Visionaries
                </h2>
                <p className="mt-3 sm:mt-4 max-w-lg text-xs sm:text-sm text-[#534345]">
                  Discover artists whose work balances editorial elegance with candid
                  storytelling, crafted for modern wedding memory books.
                </p>
              </div>

              {/* Asymmetric Editorial Grid */}
              <div className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-12 auto-rows-max mt-8 sm:mt-10 md:mt-12">
                {/* Featured Large Card (Left) */}
                <motion.article
                  key={featuredPhotographers[0].name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: 0, duration: 0.45 }}
                  className="col-span-1 md:col-span-5 md:row-span-2 group rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="relative h-64 sm:h-80 md:h-full overflow-hidden bg-[#ebe0e1]">
                    <img
                      src={featuredPhotographers[0].image}
                      alt={featuredPhotographers[0].name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-0 group-hover:backdrop-blur-[2px] transition-all duration-300" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
                      <h3
                        className="text-lg sm:text-2xl md:text-3xl text-white leading-tight"
                        style={{ fontFamily: 'var(--font-newsreader)' }}
                      >
                        {featuredPhotographers[0].name}
                      </h3>
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/80 uppercase tracking-[0.14em] sm:tracking-[0.18em] font-semibold">
                        {featuredPhotographers[0].role}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {socialLinks(featuredPhotographers[0].social).map((item) => (
                          <a
                            key={item.key}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={item.label}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white hover:text-[#C92D7D]"
                          >
                            {item.icon}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.article>

                {/* Right Side Cards */}
                {featuredPhotographers.slice(1).map((item, index) => (
                  <motion.article
                    key={item.name}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: (index + 1) * 0.1, duration: 0.45 }}
                    className={`group rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      index === 0 ? 'col-span-1 md:col-span-7' : 'col-span-1 md:col-span-3'
                    } ${index === 0 ? 'h-48 sm:h-56 md:h-64' : 'h-40 sm:h-48 md:h-56'}`}
                  >
                    <div className="relative w-full h-full bg-[#ebe0e1] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/10 backdrop-blur-0 group-hover:backdrop-blur-[2px] transition-all duration-300" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/25 to-transparent flex flex-col justify-end p-3 sm:p-4 md:p-5">
                        <h3
                          className="text-base sm:text-lg md:text-2xl text-white leading-tight"
                          style={{ fontFamily: 'var(--font-newsreader)' }}
                        >
                          {item.name}
                        </h3>
                        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-white/80 uppercase tracking-[0.12em] sm:tracking-[0.16em] font-semibold">
                          {item.role}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          {socialLinks(item.social).map((social) => (
                            <a
                              key={social.key}
                              href={social.href}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={social.label}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white hover:text-[#C92D7D]"
                            >
                              {social.icon}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {/* See more button — outside grid so it renders full-width below */}
              <div className="mt-8 flex justify-center">
                <Link
                  href="/photographer"
                  className="rounded-xl bg-[#C92D7D] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b52670] transition-colors"
                >
                  See more
                </Link>
              </div>
            </div>
          </section>
        }

      <section className="bg-[#fff8f8] py-12 sm:py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-6 sm:gap-8 md:gap-10 px-4 sm:px-5 md:px-10 lg:grid-cols-[0.9fr_1fr]">
          <div>
            <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] md:tracking-[0.24em] text-[#8c0053]">
              Photographer Suite
            </p>
            <h2
              className="mt-2 sm:mt-3 max-w-md text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight text-[#25181d]"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              For the Visionaries
            </h2>
            <p className="mt-3 sm:mt-4 md:mt-5 max-w-md text-[10px] sm:text-xs md:text-sm leading-6 sm:leading-7 text-[#534345]">
              Elegant management tools built for calm focus, from moodboards and
              drafts to polished final delivery.
            </p>
            <ul className="mt-5 sm:mt-6 md:mt-7 space-y-2 sm:space-y-3 text-[10px] sm:text-xs md:text-sm text-[#534345]">
              <li>• Timeline presets for proposal-to-print workflows.</li>
              <li>• Gallery scrubber for rapid spread reviews.</li>
              <li>• Shared approvals between studio and couples.</li>
            </ul>
            <Link
              href="/photographer-admin"
              className="mt-6 sm:mt-8 inline-flex rounded-xl bg-[#211a1b] px-5 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs md:text-sm font-semibold text-[#ffecf1] transition hover:bg-[#3b2c31]"
            >
              Enter Suite
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl sm:rounded-3xl bg-[#f3e5e6] p-3 sm:p-5 shadow-[0_40px_80px_rgba(33,26,27,0.08)]"
          >
            <div className="rounded-2xl bg-[#211a1b] p-6 text-[#ffecf1]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[#ffb0cd] font-semibold">
                  Live Dashboard
                </p>
                <div className="h-2 w-2 rounded-full bg-[#00d084] animate-pulse"></div>
              </div>
              
              <div className="rounded-lg bg-linear-to-br from-white/10 to-white/5 p-6 border border-white/15 hover:border-white/25 transition-all duration-300 mb-5">
                <p className="text-[10px] text-[#ffb0cd] uppercase tracking-widest font-semibold">Active Photographers</p>
                <p
                  className="mt-5 text-5xl font-semibold tracking-tight"
                  style={{ fontFamily: 'var(--font-newsreader)' }}
                >
                  {activePhotographerCount ?? 0}
                </p>
                <div className="mt-5 pt-5 border-t border-white/10">
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">Status: All systems operational</p>
                </div>
              </div>

              {/* Google Reviews Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="rounded-lg bg-linear-to-br from-white/5 to-white/0 p-5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-[#ffb0cd] uppercase tracking-widest font-semibold">Reviews</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-xs text-[#ffd700]">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  "Exceptional service. The team truly understands the art of preservation."
                </p>
                <p className="mt-3 text-[9px] text-white/50 uppercase tracking-wide">— Google Reviews</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#fff8f7] py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-10">
          <p className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#8c0053]">
            The Method
          </p>
          <h2
            className="mt-2 sm:mt-3 text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#25181d]"
            style={{ fontFamily: 'var(--font-newsreader)' }}
          >
            Seamless Collaboration
          </h2>
          <div className="mt-10 sm:mt-12 md:mt-14 grid gap-6 sm:gap-8 md:gap-10 md:grid-cols-3">
            {collaborationSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.45 }}
              >
                <p className="text-3xl text-[#d23284]" style={{ fontFamily: 'var(--font-newsreader)' }}>
                  {step.number}
                </p>
                <h3
                  className="mt-2 text-3xl text-[#25181d]"
                  style={{ fontFamily: 'var(--font-newsreader)' }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#665c5d]">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5dce3] py-12 sm:py-18 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 px-5 md:px-10 lg:grid-cols-[0.9fr_1fr]">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#8c0053]">
            Seasonal Folders
            </p>
            <h2
              className="mt-3 max-w-md text-3xl sm:text-4xl md:text-5xl leading-tight text-[#25181d]"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Seasonal Archives
            </h2>
            <p className="mt-4 sm:mt-5 max-w-sm text-xs sm:text-sm leading-7 text-[#534345]">
              A seasonal collection arranged by mood and light, so each chapter
              of your wedding journey feels intentional.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_0.85fr_0.85fr]">
            <img
              src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=80"
              alt="Coastal archive"
              className="h-90 w-full rounded-2xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"
              alt="Bridal archive"
              className="mt-8 h-75 w-full rounded-2xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80"
              alt="Family archive"
              className="mt-16 h-65 w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#fff8f8] py-12 sm:py-18 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <img
            src="https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=1000&q=80"
            alt="Wedding flowers"
            className="h-80 w-full rounded-2xl object-cover"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c0053]">
              Curator’s Notes
            </p>
            <h2
              className="mt-3 text-5xl leading-tight text-[#25181d]"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              The Art of Stillness
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#534345]">
              Photography is not only capturing a moment, but preserving an
              emotional resonance that becomes richer over time.
            </p>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7079]">
              Maria Tellier · Lead Curator
            </p>
          </div>
        </div>
      </section>

      {journalCards.length > 0 && (
        <section className="bg-[#fff8f7] py-12 sm:py-18 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-10">
          <div className="mb-8 sm:mb-10 md:mb-12">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#8c0053]">
              Journal Shelf
            </p>
            <h2
              className="mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#25181d] leading-tight"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Recent Journals
            </h2>
            <p className="mt-3 sm:mt-4 max-w-lg text-xs sm:text-sm text-[#534345]">
              A curated selection of editorial moments and visual stories from our archive.
            </p>
          </div>

          {/* Asymmetric Editorial Grid */}
          <div className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-12 auto-rows-max">
            <motion.article
              key={journalCards[0]?.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: 0, duration: 0.4 }}
              className="col-span-1 md:col-span-6 md:row-span-2 group rounded-2xl overflow-hidden h-96 md:h-full transition-all duration-300 hover:shadow-2xl"
              role={journalCards[0]?.raw ? 'button' : undefined}
              tabIndex={journalCards[0]?.raw ? 0 : undefined}
              onClick={journalCards[0]?.raw ? () => openPublicBookFullscreen(journalCards[0].raw) : undefined}
            >
              <div className="relative w-full h-full overflow-hidden bg-[#ebe0e1]">
                <img
                  src={journalCards[0]?.image}
                  alt={journalCards[0]?.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-2xl md:text-3xl text-white font-light" style={{ fontFamily: 'var(--font-newsreader)' }}>
                    {journalCards[0]?.title}
                  </h3>
                  <p className="mt-2 text-xs text-white/80 uppercase tracking-[0.18em] font-semibold">
                    Personal Archive
                  </p>
                </div>
              </div>
            </motion.article>

            {journalCards.slice(1, 5).map((entry: any, index: number) => (
              <motion.article
                key={entry.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: (index + 1) * 0.06, duration: 0.4 }}
                className="col-span-1 md:col-span-3 group rounded-2xl overflow-hidden h-40 md:h-48 transition-all duration-300 hover:shadow-lg"
                role={entry.raw ? 'button' : undefined}
                tabIndex={entry.raw ? 0 : undefined}
                onClick={entry.raw ? () => openPublicBookFullscreen(entry.raw) : undefined}
              >
                <div className="relative w-full h-full overflow-hidden bg-[#ebe0e1]">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-base md:text-lg text-white font-light" style={{ fontFamily: 'var(--font-newsreader)' }}>
                      {entry.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-white/70 uppercase tracking-[0.16em] font-semibold">
                      Personal Archive
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Bottom Row - Remaining Cards */}
          <div className="grid gap-6 md:grid-cols-2 auto-rows-max mt-6">
            {journalCards.slice(5).map((entry: any, index: number) => (
              <motion.article
                key={entry.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: (index + 5) * 0.06, duration: 0.4 }}
                className="group rounded-2xl overflow-hidden h-48 md:h-56 transition-all duration-300 hover:shadow-lg"
                role={entry.raw ? 'button' : undefined}
                tabIndex={entry.raw ? 0 : undefined}
                onClick={entry.raw ? () => openPublicBookFullscreen(entry.raw) : undefined}
              >
                <div className="relative w-full h-full overflow-hidden bg-[#ebe0e1]">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-lg md:text-xl text-white font-light" style={{ fontFamily: 'var(--font-newsreader)' }}>
                      {entry.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-white/70 uppercase tracking-[0.16em] font-semibold">
                      Personal Archive
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-14 text-center">
            <Link
              href="/album"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-serif font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(135deg, #d23284 0%, #890051 100%)' }}
            >
              Explore Full Journal
            </Link>
          </div>
        </div>
        </section>
      )}

      <Footer />

      {selectedPublicBook ? (
        <FullscreenBook
          template={selectedPublicBook.template as any}
          mediaItems={selectedPublicBook.mediaItems}
          coverPhoto={selectedPublicBook.coverPhoto}
          coverPhotoName={selectedPublicBook.coverPhotoName}
          onClose={closePublicBook}
        />
      ) : null}

    </main>
  );
}