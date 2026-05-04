'use client';

import { motion } from 'framer-motion';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '../Components/website/navbar';
import Footer from '../Components/website/Footer';
import Link from 'next/link';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

export default function PhotographerPage() {
  return (
    <main className={`${newsreader.variable} ${plusJakarta.variable} min-h-screen bg-[#fff8f8] text-[#211a1b] font-sans`}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="z-10"
            >
              <span className="mb-6 block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8c0053]">
                Exclusive Membership
              </span>
              <h1 
                className="mb-8 text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                Join the <span className="italic text-[#890051]">Editorial Collective</span>
              </h1>
              <p className="mb-12 max-w-lg text-lg leading-relaxed text-[#534345] italic">
                Transforming high-end photography into digital monographs. A workspace designed for the intentional curator, focusing on grace and editorial precision.
              </p>
              <div className="flex flex-wrap gap-5">
                <Link
                  href="/contact"
                  className="rounded-2xl bg-gradient-to-r from-[#890051] to-[#d23284] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(137,0,81,0.25)] transition-all hover:shadow-3xl hover:-translate-y-1"
                >
                  Apply to Join
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl bg-[#f3e5e6] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8c0053] transition-all hover:bg-[#ebe0e1]"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[40px] shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1200" 
                  alt="Editorial Photography" 
                  className="h-full w-full object-cover brightness-95 transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 h-64 w-48 overflow-hidden rounded-3xl bg-white p-2 shadow-2xl hidden md:block rotate-3">
                 <img 
                    src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80" 
                    className="h-full w-full object-cover rounded-2xl"
                    alt="Small portrait"
                 />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-[#f3e5e6] mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-10">
          <div className="mb-20 flex flex-col items-end justify-between gap-8 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-6 text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-newsreader)' }}>
                Virtual <span className="italic">Atelier</span> Experience
              </h2>
              <p className="text-sm text-[#534345] leading-relaxed max-w-lg">
                Our digital workspace is more than a management tool—it is a sanctuary for your visual storytelling. Experience a platform where every pixel respects the integrity of your craft.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[#8c0053]">
               <div className="h-px w-12 bg-[#8c0053]/30"></div>
               <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">Curated Management</span>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Monograph Organization",
                desc: "Organize your sessions into digital monographs that feel like physical keepsakes.",
                image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80"
              },
              {
                title: "The Designer's Eye",
                desc: "Automated layout suggestions that prioritize golden-ratio proportions and breathability.",
                image: "https://images.unsplash.com/photo-1473691955023-da1c49c95c78?auto=format&fit=crop&w=800&q=80",
                shift: true
              },
              {
                title: "Seamless Deliveries",
                desc: "Invite clients into a bespoke viewing experience that reflects your premium price point.",
                image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80"
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group bg-white p-4 pb-10 rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 ${feature.shift ? 'lg:translate-y-12' : ''}`}
              >
                <div className="aspect-[4/5] overflow-hidden rounded-[24px] mb-8">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="px-4">
                  <h3 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-newsreader)' }}>{feature.title}</h3>
                  <p className="text-xs text-[#534345] leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative h-[600px] overflow-hidden rounded-[48px]">
               <img 
                src="https://images.unsplash.com/photo-1455885666463-9e00e42f95c3?auto=format&fit=crop&w=1200&q=80" 
                className="h-full w-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-1000"
                alt="Archive Visual"
               />
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-12">
                  <h3 className="text-white text-4xl mb-4" style={{ fontFamily: 'var(--font-newsreader)' }}>Studio Access</h3>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-[#211a1b] text-[#ffecf1] p-12 rounded-[48px]">
                  <div className="mb-12">
                     <span className="text-6xl md:text-8xl block mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>420+</span>
                     <span className="text-[10px] uppercase tracking-[0.3em] opacity-60">Active Archivists</span>
                  </div>
                  <div className="h-px w-16 bg-white/20 mb-12"></div>
                  <div>
                     <span className="text-6xl md:text-8xl block mb-2" style={{ fontFamily: 'var(--font-newsreader)' }}>12.5k</span>
                     <span className="text-[10px] uppercase tracking-[0.3em] opacity-60">Monographs Created</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}