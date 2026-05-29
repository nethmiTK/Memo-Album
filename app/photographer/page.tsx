'use client';

import { motion } from 'framer-motion';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '../Components/website/navbar';
import Footer from '../Components/website/Footer';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import API_URL from '@/lib/api';

interface PhotographerCard {
  name: string;
  phone: string;
  email: string;
  desc: string;
  image: string;
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

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
  const [visibleCount, setVisibleCount] = useState(25);
  const [photographersData, setPhotographersData] = useState<PhotographerCard[]>([]);

  // 25 Photographers Array
  const photographers = [
    {
      name: "Sarah Mitchell",
      phone: "+1 (555) 123-4567",
      email: "sarah@memoalbum.com",
      desc: "Editorial wedding specialist with a focus on timeless moments and golden-hour magic.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Jessica Chen",
      phone: "+1 (555) 234-5678",
      email: "jessica@memoalbum.com",
      desc: "Contemporary cinematography meets fine art photography with cinematic storytelling.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Amanda Rodriguez",
      phone: "+1 (555) 345-6789",
      email: "amanda@memoalbum.com",
      desc: "Luxury brand photography with an artistic vision and attention to detail.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Emily Watson",
      phone: "+1 (555) 456-7890",
      email: "emily@memoalbum.com",
      desc: "Storyteller first, photographer second. Capturing real emotions and candid moments.",
      image: "https://images.unsplash.com/photo-1516534775068-bb6c4e8b9f73?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Michelle Park",
      phone: "+1 (555) 567-8901",
      email: "michelle@memoalbum.com",
      desc: "Golden hour specialist with eye for detail and professional composition skills.",
      image: "https://images.unsplash.com/photo-1502933691298-84fc14542831?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Victoria Hayes",
      phone: "+1 (555) 678-9012",
      email: "victoria@memoalbum.com",
      desc: "Minimalist approach with maximalist emotional impact in every frame.",
      image: "https://images.unsplash.com/photo-1488426862026-56bde64955e0?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Lauren Davies",
      phone: "+1 (555) 789-0123",
      email: "lauren@memoalbum.com",
      desc: "Fine art photographer specializing in romantic and editorial wedding narratives.",
      image: "https://images.unsplash.com/photo-1533195671163-e31e5c1f3c0f?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Sophia Martinez",
      phone: "+1 (555) 890-1234",
      email: "sophia@memoalbum.com",
      desc: "Capturing authentic connections with a documentary-style artistic flair.",
      image: "https://images.unsplash.com/photo-1520854721936-1aa58fa8e434?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Rachel Thompson",
      phone: "+1 (555) 901-2345",
      email: "rachel@memoalbum.com",
      desc: "Natural light photographer with passion for intimate wedding moments.",
      image: "https://images.unsplash.com/photo-1524634126442-357e0eac6b14?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Olivia Bennett",
      phone: "+1 (555) 012-3456",
      email: "olivia@memoalbum.com",
      desc: "Luxury lifestyle photographer bringing elegance to every celebration.",
      image: "https://images.unsplash.com/photo-1517841905240-74dec2e4eb42?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Grace Kim",
      phone: "+1 (555) 123-0987",
      email: "grace@memoalbum.com",
      desc: "Artistic storyteller specializing in cinematic wedding films and photography.",
      image: "https://images.unsplash.com/photo-1529900748604-07564826fba7?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Nina Patel",
      phone: "+1 (555) 234-0987",
      email: "nina@memoalbum.com",
      desc: "Vibrant colors and dynamic compositions in every wedding moment captured.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Claire Anderson",
      phone: "+1 (555) 345-0987",
      email: "claire@memoalbum.com",
      desc: "Classic elegance with modern editorial touches in every wedding portfolio.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Maya Gupta",
      phone: "+1 (555) 456-0987",
      email: "maya@memoalbum.com",
      desc: "Fusion of traditional and contemporary styles in wedding photography.",
      image: "https://images.unsplash.com/photo-1520854721936-1aa58fa8e434?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Isabelle Leclerc",
      phone: "+1 (555) 567-0987",
      email: "isabelle@memoalbum.com",
      desc: "European editorial photography style with artistic depth and sophistication.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Fiona Walsh",
      phone: "+1 (555) 678-0987",
      email: "fiona@memoalbum.com",
      desc: "Moody atmospheric photography capturing intimate wedding day moments.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Harper Sterling",
      phone: "+1 (555) 789-0987",
      email: "harper@memoalbum.com",
      desc: "Bold colors and artistic vision transforming wedding narratives beautifully.",
      image: "https://images.unsplash.com/photo-1516534775068-bb6c4e8b9f73?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Audrey James",
      phone: "+1 (555) 890-0987",
      email: "audrey@memoalbum.com",
      desc: "Timeless compositions with a modern sensibility in wedding photography.",
      image: "https://images.unsplash.com/photo-1502933691298-84fc14542831?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Sienna Turner",
      phone: "+1 (555) 901-0987",
      email: "sienna@memoalbum.com",
      desc: "Romantic and dreamy wedding photography with ethereal light work.",
      image: "https://images.unsplash.com/photo-1488426862026-56bde64955e0?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Juliet Foster",
      phone: "+1 (555) 012-0987",
      email: "juliet@memoalbum.com",
      desc: "Storytelling through photography with emotional depth and artistry.",
      image: "https://images.unsplash.com/photo-1533195671163-e31e5c1f3c0f?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Piper Sullivan",
      phone: "+1 (555) 123-1098",
      email: "piper@memoalbum.com",
      desc: "Contemporary wedding photography with artistic editorial sensibility.",
      image: "https://images.unsplash.com/photo-1520854721936-1aa58fa8e434?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Violet Crawford",
      phone: "+1 (555) 234-1098",
      email: "violet@memoalbum.com",
      desc: "Luxury wedding photography capturing opulence and intimate moments.",
      image: "https://images.unsplash.com/photo-1524634126442-357e0eac6b14?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Chloe Morgan",
      phone: "+1 (555) 345-1098",
      email: "chloe@memoalbum.com",
      desc: "Documentary-style photography preserving authentic wedding day emotions.",
      image: "https://images.unsplash.com/photo-1517841905240-74dec2e4eb42?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    },
    {
      name: "Evelyn Pierce",
      phone: "+1 (555) 456-1098",
      email: "evelyn@memoalbum.com",
      desc: "Vintage-inspired aesthetics combined with contemporary wedding photography.",
      image: "https://images.unsplash.com/photo-1529900748604-07564826fba7?auto=format&fit=crop&w=400&q=80",
      social: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", website: "https://example.com" }
    }
  ];

  useEffect(() => {
    const loadPhotographers = async () => {
      try {
        const response = await fetch(`${API_URL}/photographer/public-users`, { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.users)) {
          setPhotographersData([]);
          setVisibleCount(0);
          return;
        }

        const mapped: PhotographerCard[] = result.users.map((user: any) => ({
          name: user.name || 'Photographer',
          phone: user.phoneNumber || user.phone || '',
          email: user.email || '',
          desc: user.bio || 'Editorial photographer with a refined visual style.',
          image: user.profileImage || user.image || '/images/album.png',
          social: {
            instagram: user.instagram || '',
            facebook: user.facebook || '',
            tiktok: user.tiktok || '',
            youtube: user.youtube || '',
            website: user.website || '',
          },
        }));

        setPhotographersData(mapped);
        setVisibleCount(mapped.length);
      } catch (error) {
        console.error('Failed to load photographers:', error);
        setPhotographersData([]);
        setVisibleCount(0);
      }
    };

    loadPhotographers();
  }, []);

  const displayedPhotographers = photographersData.length > 0 ? photographersData : photographers;
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

      {/* Feature Section - Virtual Atelier Experience */}
      <section className="bg-[#f3e5e6] mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-10">
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

          {/* Photographers Grid with Groups */}
          <div className="space-y-12">
            {/* Display cards in groups of 5 */}
            {Array.from({ length: Math.ceil(Math.min(visibleCount, displayedPhotographers.length) / 5) }).map((_, groupIdx) => {
              const startIdx = groupIdx * 5;
              const endIdx = startIdx + 5;
              const groupPhotographers = displayedPhotographers.slice(startIdx, Math.min(endIdx, visibleCount));

              return (
                <div key={groupIdx}>
                  {/* Card Grid for this group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {groupPhotographers.map((photographer, idx) => (
                      <motion.div
                        key={photographer.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white rounded-[20px] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
                      >
                        {/* Image Section */}
                        <div className="aspect-[3/4] overflow-hidden flex-shrink-0">
                          <img 
                            src={photographer.image} 
                            alt={photographer.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                        </div>
                        
                        {/* Content Section */}
                        <div className="p-4 flex flex-col flex-grow">
                          {/* Name */}
                          <h3 className="text-[15px] font-semibold mb-2 text-[#211a1b] line-clamp-1" style={{ fontFamily: 'var(--font-newsreader)' }}>
                            {photographer.name}
                          </h3>
                          
                          {/* Phone & Email on one line */}
                          <div className="text-[11px] text-[#534345] mb-3 font-medium flex flex-wrap items-center gap-1">
                            <a href={`tel:${photographer.phone}`} className="hover:text-[#8c0053] transition-colors">
                              {photographer.phone}
                            </a>
                            <span className="text-[#d5d5d5]">|</span>
                            <a href={`mailto:${photographer.email}`} className="text-[#8c0053] hover:text-[#890051] transition-colors">
                              {photographer.email}
                            </a>
                          </div>
                          
                          {/* Description */}
                          <p className="text-[11px] text-[#534345] leading-relaxed mb-4 flex-grow line-clamp-2">
                            {photographer.desc}
                          </p>
                          
                          {/* Social Media Icons */}
                          <div className="border-t border-[#e5d5d8] pt-3 mt-auto">
                            <p className="text-[8px] uppercase tracking-[0.2em] font-semibold text-[#8c0053] mb-2.5">Follow</p>
                            <div className="flex gap-2.5 justify-start flex-wrap">
                              {photographer.social.instagram ? (
                                <a
                                  href={photographer.social.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-gradient-to-r hover:from-[#fd5949] hover:to-[#d6249f] text-[#8c0053] hover:text-white transition-all duration-300"
                                  title="Instagram"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.646.069 4.85 0 3.204-.012 3.584-.069 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.646-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 100-8 4 4 0 000 8zm4.965-10.322a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                                  </svg>
                                </a>
                              ) : null}

                              {photographer.social.facebook ? (
                                <a
                                  href={photographer.social.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-[#1877F2] text-[#8c0053] hover:text-white transition-all duration-300"
                                  title="Facebook"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                </a>
                              ) : null}

                              {photographer.social.tiktok ? (
                                <a
                                  href={photographer.social.tiktok}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-black text-[#8c0053] hover:text-white transition-all duration-300"
                                  title="TikTok"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.68v12.7a2.85 2.85 0 11-5.7-2.84c.3-.78 1-1.49 2.1-1.66V9a6.53 6.53 0 00-5.07 2.86A6.81 6.81 0 0020.1 12.52v-3.66a4.85 4.85 0 01-2.51-.67z"/>
                                  </svg>
                                </a>
                              ) : null}

                              {photographer.social.youtube ? (
                                <a
                                  href={photographer.social.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-[#FF0000] text-[#8c0053] hover:text-white transition-all duration-300"
                                  title="YouTube"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                </a>
                              ) : null}

                              {photographer.social.website ? (
                                <a
                                  href={photographer.social.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-[#8c0053] text-[#8c0053] hover:text-white transition-all duration-300"
                                  title="Website"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                 
                </div>
                
              );
            })}
            
          </div>
        </div>
      </section>

     

      <Footer />
    </main>
  );
}