'use client';

import { motion } from 'framer-motion';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '../Components/website/navbar';
import Footer from '../Components/website/Footer';

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

export default function ContactPage() {
  return (
    <main className={`${newsreader.variable} ${plusJakarta.variable} min-h-screen bg-[#fff8f8] text-[#211a1b] font-sans`}>
      <Navbar />
      
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10 py-16 md:py-24">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-10 inline-flex items-center gap-3">
              <span className="h-px w-8 bg-[#8c0053]/40"></span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#890051]">
                Connect With Us
              </p>
            </div>
            
            <h1 
              className="text-6xl md:text-8xl leading-[0.95] mb-10 tracking-tighter"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Contact <span className="italic block md:inline text-[#890051]">Concierge</span>
            </h1>
            
            <p className="text-[#534345] text-lg md:text-xl leading-relaxed mb-12 max-w-lg font-light italic">
              "Every great archive begins with a conversation. We are here to guide your story from first frame to final print."
            </p>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
              <div className="group transition-all">
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#8b7079] mb-3 group-hover:text-[#8c0053]">General Inquiries</h3>
                <a href="mailto:info@memoalbum.com" className="text-2xl md:text-3xl hover:italic transition-all" style={{ fontFamily: 'var(--font-newsreader)' }}>
           info@memoalbum.com
                </a>
              </div>
              
                
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Background decorative element */}
            <div className="absolute -inset-4 bg-[#f3e5e6]/50 rounded-[60px] blur-3xl -z-10"></div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-[48px] p-8 md:p-14 shadow-[0_40px_100px_rgba(33,26,27,0.06)] border border-white/40">
              <h2 className="text-3xl mb-8" style={{ fontFamily: 'var(--font-newsreader)' }}>Send a Message</h2>
              
              <form className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="relative group">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8b7079] mb-2 ml-1 group-focus-within:text-[#890051] transition-colors">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      className="w-full bg-transparent border-b border-[#211a1b]/10 py-3 focus:border-[#890051] outline-none transition-all placeholder:text-[#8b7079]/30 text-lg" 
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8b7079] mb-2 ml-1 group-focus-within:text-[#890051] transition-colors">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="Your Email"
                      className="w-full bg-transparent border-b border-[#211a1b]/10 py-3 focus:border-[#890051] outline-none transition-all placeholder:text-[#8b7079]/30 text-lg" 
                    />
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                   
                  <div className="relative group">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8b7079] mb-2 ml-1 group-focus-within:text-[#890051] transition-colors">Location</label>
                    <input 
                      type="text" 
                      placeholder="Your Location"
                      className="w-full bg-transparent border-b border-[#211a1b]/10 py-3 focus:border-[#890051] outline-none transition-all placeholder:text-[#8b7079]/30 text-lg" 
                    />
                  </div>
                </div>
                
                <div className="relative group">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8b7079] mb-2 ml-1 group-focus-within:text-[#890051] transition-colors">Tell us about your story</label>
                  <textarea 
                    rows={4}
                    placeholder="Briefly describe your vision..."
                    className="w-full bg-transparent border-b border-[#211a1b]/10 py-3 focus:border-[#890051] outline-none transition-all resize-none placeholder:text-[#8b7079]/30 text-lg"
                  ></textarea>
                </div>

                <button className="group flex items-center gap-4 text-[#890051] hover:gap-6 transition-all duration-300">
                  <span className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#890051] to-[#d23284] flex items-center justify-center text-white shadow-xl group-hover:shadow-[#890051]/30">
                    →
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.3em]">Submit Application</span>
                </button>
              </form>
            </div>

            {/* Floating Image Decoration */}
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -top-12 -right-12 h-48 w-40 rounded-3xl overflow-hidden shadow-2xl hidden xl:block"
            >
              <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80" alt="Floral detail" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Grid of Editorial Images */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[300px]">
          <div className="rounded-3xl overflow-hidden bg-stone-100">
            <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Gallery" />
          </div>
          <div className="rounded-3xl overflow-hidden bg-stone-100 translate-y-8">
            <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Gallery" />
          </div>
          <div className="rounded-3xl overflow-hidden bg-stone-100">
            <img src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Gallery" />
          </div>
          <div className="rounded-3xl overflow-hidden bg-stone-100 translate-y-8">
            <img src="https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=600&q=80" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Gallery" />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}