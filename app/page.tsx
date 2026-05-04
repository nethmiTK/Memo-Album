'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from './Components/website/navbar';
import Footer from './Components/website/Footer';

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

const featuredPhotographers = [
  {
    name: 'Julianne V',
    role: 'Editorial Fine Arts',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Ava Claire',
    role: 'Portrait Narratives',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Elina K',
    role: 'Cinematic Elopements',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
];

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

const journalEntries = [
  {
    title: 'Moonlight JF',
    image:
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Silent Pathways',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Woodland Veins',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'The Last Study',
    image:
      'https://images.unsplash.com/photo-1469571486292-b53601020fcb?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Born Anew',
    image:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Velvet Archive',
    image:
      'https://images.unsplash.com/photo-1455885666463-9e00e42f95c3?auto=format&fit=crop&w=900&q=80',
  },
];

export default function HomePage() {
  return (
    <main
      className={`${newsreader.variable} ${plusJakarta.variable} bg-[#fff8f8] text-[#211a1b]`}
      style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
    >
      <Navbar />

      <section className="mx-auto max-w-6xl px-5 pb-24 pt-16 md:px-10 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]"
        >
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#8c0053]">
              Archive Marketplace
            </p>
            <h1
              className="max-w-xl text-5xl leading-[1.02] text-[#25181d] md:text-7xl"
               style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              The Vow of Silence
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-[#534345] md:text-base">
              An editorial destination where couples and photographers co-create
              wedding archives with grace, depth, and timeless emotional detail.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/album"
                className="rounded-xl bg-gradient-to-r from-[#890051] to-[#d23284] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(137,0,81,0.18)] transition hover:-translate-y-0.5"
              >
                Begin Archive
              </Link>
              <Link
                href="/about-us"
                className="rounded-xl bg-[#f3e5e6] px-6 py-3 text-sm font-semibold text-[#8c0053] transition hover:bg-[#ecd4db]"
              >
                Curator Notes
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="absolute -left-8 top-16 hidden h-48 w-40 rounded-2xl bg-[#fff8f8]/75 p-3 shadow-[0_30px_80px_rgba(33,26,27,0.12)] backdrop-blur-md md:block">
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
              className="overflow-hidden rounded-3xl bg-[#fff8f8] p-3 shadow-[0_38px_80px_rgba(33,26,27,0.15)]"
            >
              <img
                src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
                alt="Bride portrait"
                className="h-[510px] w-full rounded-2xl object-cover"
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="bg-[#ecd4db] py-12 sm:py-18 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c0053]">
              Featured Photographers
            </p>
            <h2
              className="mt-3 text-4xl md:text-5xl text-[#25181d] leading-tight"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Curated Visionaries
            </h2>
            <p className="mt-4 max-w-lg text-sm text-[#534345]">
              Discover artists whose work balances editorial elegance with candid
              storytelling, crafted for modern wedding memory books.
            </p>
          </div>

          {/* Asymmetric Editorial Grid */}
          <div className="grid gap-8 md:grid-cols-12 auto-rows-max mt-12">
            {/* Featured Large Card (Left) */}
            <motion.article
              key={featuredPhotographers[0].name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0, duration: 0.45 }}
              className="col-span-1 md:col-span-5 md:row-span-2 group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
            >
              <div className="relative h-96 md:h-full overflow-hidden bg-[#ebe0e1]">
                <img
                  src={featuredPhotographers[0].image}
                  alt={featuredPhotographers[0].name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex flex-col justify-end p-6">
                  <h3
                    className="text-2xl md:text-3xl text-white"
                    style={{ fontFamily: 'var(--font-newsreader)' }}
                  >
                    {featuredPhotographers[0].name}
                  </h3>
                  <p className="mt-2 text-sm text-white/80 uppercase tracking-[0.18em] font-semibold">
                    {featuredPhotographers[0].role}
                  </p>
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
                className={`group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  index === 0 ? 'col-span-1 md:col-span-7' : 'col-span-1 md:col-span-3'
                } ${index === 0 ? 'h-56 md:h-64' : 'h-48 md:h-56'}`}
              >
                <div className="relative w-full h-full bg-[#ebe0e1] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent flex flex-col justify-end p-4 md:p-5">
                    <h3
                      className="text-xl md:text-2xl text-white"
                      style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/80 uppercase tracking-[0.16em] font-semibold">
                      {item.role}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff8f8] py-12 sm:py-18 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 sm:gap-10 px-4 sm:px-5 md:px-10 lg:grid-cols-[0.9fr_1fr]">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#8c0053]">
              Photographer Suite
            </p>
            <h2
              className="mt-3 max-w-md text-3xl sm:text-4xl md:text-5xl leading-tight text-[#25181d]"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              For the Visionaries
            </h2>
            <p className="mt-4 sm:mt-5 max-w-md text-xs sm:text-sm leading-7 text-[#534345]">
              Elegant management tools built for calm focus, from moodboards and
              drafts to polished final delivery.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-[#534345]">
              <li>• Timeline presets for proposal-to-print workflows.</li>
              <li>• Gallery scrubber for rapid spread reviews.</li>
              <li>• Shared approvals between studio and couples.</li>
            </ul>
            <Link
              href="/photographer-admin"
              className="mt-8 inline-flex rounded-xl bg-[#211a1b] px-6 py-3 text-sm font-semibold text-[#ffecf1] transition hover:bg-[#3b2c31]"
            >
              Enter Suite
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-3xl bg-[#f3e5e6] p-5 shadow-[0_40px_80px_rgba(33,26,27,0.08)]"
          >
            <div className="rounded-2xl bg-[#211a1b] p-5 text-[#ffecf1]">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[#ffb0cd]">
                Live Dashboard
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs text-[#ffb0cd]">Albums in Progress</p>
                  <p
                    className="mt-3 text-3xl"
                    style={{ fontFamily: 'var(--font-newsreader)' }}
                  >
                    42
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs text-[#ffb0cd]">Photographer</p>
                  <p
                    className="mt-3 text-3xl"
                    style={{ fontFamily: 'var(--font-newsreader)' }}
                  >
                    17
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-white/10 p-4 text-sm">
                <p className="text-xs text-[#ffb0cd]">Today&rsquo;s Priority</p>
                <p className="mt-2">Final review: Silva x Monique archive</p>
              </div>
            </div>

            <div className="mx-auto mt-4 w-[88%] rounded-2xl bg-[#fff8f8] p-4 shadow-[0_16px_28px_rgba(33,26,27,0.07)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b7079]">Final Feedback</p>
              <p className="mt-2 text-sm text-[#534345]">
                "Please brighten spread 12 slightly before export."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#fff8f7] py-12 sm:py-18 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-[#8c0053]">
            The Method
          </p>
          <h2
            className="mt-3 text-center text-4xl text-[#25181d] md:text-5xl"
            style={{ fontFamily: 'var(--font-newsreader)' }}
          >
            Seamless Collaboration
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
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
              className="h-[360px] w-full rounded-2xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"
              alt="Bridal archive"
              className="mt-8 h-[300px] w-full rounded-2xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80"
              alt="Family archive"
              className="mt-16 h-[260px] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#fff8f8] py-12 sm:py-18 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <img
            src="https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=1000&q=80"
            alt="Wedding flowers"
            className="h-[320px] w-full rounded-2xl object-cover"
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
            {/* Featured Large Card (Left) */}
            <motion.article
              key={journalEntries[0].title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: 0, duration: 0.4 }}
              className="col-span-1 md:col-span-6 md:row-span-2 group rounded-2xl overflow-hidden h-96 md:h-full transition-all duration-300 hover:shadow-2xl"
            >
              <div className="relative w-full h-full overflow-hidden bg-[#ebe0e1]">
                <img
                  src={journalEntries[0].image}
                  alt={journalEntries[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <h3
                    className="text-2xl md:text-3xl text-white font-light"
                    style={{ fontFamily: 'var(--font-newsreader)' }}
                  >
                    {journalEntries[0].title}
                  </h3>
                  <p className="mt-2 text-xs text-white/80 uppercase tracking-[0.18em] font-semibold">
                    Personal Archive
                  </p>
                </div>
              </div>
            </motion.article>

            {/* Right Column - Grid of 4 Cards */}
            {journalEntries.slice(1, 5).map((entry, index) => (
              <motion.article
                key={entry.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: (index + 1) * 0.06, duration: 0.4 }}
                className="col-span-1 md:col-span-3 group rounded-2xl overflow-hidden h-40 md:h-48 transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative w-full h-full overflow-hidden bg-[#ebe0e1]">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent flex flex-col justify-end p-4">
                    <h3
                      className="text-base md:text-lg text-white font-light"
                      style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
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
            {journalEntries.slice(5).map((entry, index) => (
              <motion.article
                key={entry.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: (index + 5) * 0.06, duration: 0.4 }}
                className="group rounded-2xl overflow-hidden h-48 md:h-56 transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative w-full h-full overflow-hidden bg-[#ebe0e1]">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent flex flex-col justify-end p-4">
                    <h3
                      className="text-lg md:text-xl text-white font-light"
                      style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
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
            <button className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-serif font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95" style={{ background: 'linear-gradient(135deg, #d23284 0%, #890051 100%)' }}>
              Explore Full Journal
            </button>
          </div>
        </div>
      </section>

      <Footer />

    </main>
  );
}