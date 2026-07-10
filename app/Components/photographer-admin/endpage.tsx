'use client';

import React from 'react';
import { FaInstagram, FaFacebookF, FaGlobe, FaTwitter, FaYoutube, FaLinkedinIn } from 'react-icons/fa';

interface PhotographerSocials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
}

interface EndPageProps {
  endPhoto?: string;
  endPhotoName?: string;
  photographerName?: string;
  photographerPhoto?: string;
  photographerStudio?: string;
  photographerWebsite?: string;
  accent?: string;
  albumName?: string;
  weddingDate?: string | Date;
  photographerSocials?: PhotographerSocials;
}

export function EndPage({
  endPhoto,
  endPhotoName,
  photographerName,
  photographerPhoto,
  photographerStudio,
  photographerWebsite,
  accent = '#b10e6b',
  albumName,
  weddingDate,
  photographerSocials,
}: EndPageProps) {
  const getAbsoluteUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="h-full w-full p-2" style={{ background: '#fafafa' }}>
      <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] bg-white shadow-[0_14px_35px_rgba(0,0,0,0.06)] flex flex-col">
        
        {/* ─── TOP 70%: Couple Large Image ─── */}
        <div className="relative w-full" style={{ height: '72%' }}>
          {endPhoto ? (
            <>
              <img
                src={endPhoto}
                alt={endPhotoName || albumName || 'End Photo'}
                className="h-full w-full object-cover"
              />
              {/* Dark gradient at bottom of photo for separation */}
              <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/25 to-transparent" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f8f4f5] to-[#efe5e8]">
              <p className="text-sm text-[#a89a9e] italic" style={{ fontFamily: 'Libre Caslon Text, serif' }}>
                {albumName || 'Thank You'}
              </p>
            </div>
          )}
        </div>

        {/* ─── Thin Divider Line ─── */}
        <div className="w-full h-px bg-[#e8e0e2]" />

        {/* ─── BOTTOM 28%: Photographer + CodeBuilder/MemoAlbum ─── */}
        <div className="flex-1 flex flex-col justify-center px-4 md:px-6 py-3" style={{ minHeight: 0 }}>
          <div className="flex items-center justify-between w-full">
            
            {/* ── Bottom Left: Photographer ── */}
            <div className="flex items-center gap-2.5">
              {/* Circular Photographer Photo */}
              <div className="w-[42px] h-[42px] md:w-[52px] md:h-[52px] rounded-full overflow-hidden border-2 border-[#f0e8eb] shadow-sm flex-shrink-0 bg-[#f5eff1]">
                {photographerPhoto ? (
                  <img
                    src={photographerPhoto}
                    alt={photographerName || 'Photographer'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#b8a4ab]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.18em] text-[#a89a9e] font-medium leading-tight">
                  Captured by
                </p>
                <p
                  className="text-[11px] md:text-[13px] font-semibold text-[#2a2325] leading-tight mt-0.5 truncate"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {photographerName || 'Photographer'}
                </p>
                {photographerStudio && (
                  <p className="text-[8px] md:text-[9px] text-[#8a7e80] leading-tight mt-0.5 truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {photographerStudio}
                  </p>
                )}
                {photographerSocials && (
                  <div className="mt-2 flex items-center gap-1">
                    {photographerSocials.instagram && (
                      <a href={getAbsoluteUrl(photographerSocials.instagram)} target="_blank" rel="noopener noreferrer" 
                         className="relative z-50 inline-flex items-center justify-center w-8 h-8 text-[#a89a9e] hover:text-[#b10e6b] hover:bg-[#b10e6b]/15 transition-all duration-300 transform hover:scale-[1.3] rounded-full cursor-pointer"
                         onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                         onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <FaInstagram size={14} />
                      </a>
                    )}
                    {photographerSocials.facebook && (
                      <a href={getAbsoluteUrl(photographerSocials.facebook)} target="_blank" rel="noopener noreferrer" 
                         className="relative z-50 inline-flex items-center justify-center w-8 h-8 text-[#a89a9e] hover:text-[#b10e6b] hover:bg-[#b10e6b]/15 transition-all duration-300 transform hover:scale-[1.3] rounded-full cursor-pointer"
                         onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                         onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <FaFacebookF size={14} />
                      </a>
                    )}
                    {photographerSocials.x && (
                      <a href={getAbsoluteUrl(photographerSocials.x)} target="_blank" rel="noopener noreferrer" 
                         className="relative z-50 inline-flex items-center justify-center w-8 h-8 text-[#a89a9e] hover:text-[#b10e6b] hover:bg-[#b10e6b]/15 transition-all duration-300 transform hover:scale-[1.3] rounded-full cursor-pointer"
                         onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                         onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <FaTwitter size={14} />
                      </a>
                    )}
                    {photographerSocials.youtube && (
                      <a href={getAbsoluteUrl(photographerSocials.youtube)} target="_blank" rel="noopener noreferrer" 
                         className="relative z-50 inline-flex items-center justify-center w-8 h-8 text-[#a89a9e] hover:text-[#b10e6b] hover:bg-[#b10e6b]/15 transition-all duration-300 transform hover:scale-[1.3] rounded-full cursor-pointer"
                         onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                         onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <FaYoutube size={14} />
                      </a>
                    )}
                    {photographerSocials.linkedin && (
                      <a href={getAbsoluteUrl(photographerSocials.linkedin)} target="_blank" rel="noopener noreferrer" 
                         className="relative z-50 inline-flex items-center justify-center w-8 h-8 text-[#a89a9e] hover:text-[#b10e6b] hover:bg-[#b10e6b]/15 transition-all duration-300 transform hover:scale-[1.3] rounded-full cursor-pointer"
                         onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                         onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <FaLinkedinIn size={14} />
                      </a>
                    )}
                    {photographerSocials.website && (
                      <a href={getAbsoluteUrl(photographerSocials.website)} target="_blank" rel="noopener noreferrer" 
                         className="relative z-50 inline-flex items-center justify-center w-8 h-8 text-[#a89a9e] hover:text-[#b10e6b] hover:bg-[#b10e6b]/15 transition-all duration-300 transform hover:scale-[1.3] rounded-full cursor-pointer"
                         onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
                         onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <FaGlobe size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Bottom Right: CodeBuilder / MemoAlbum ── */}
            <div className="text-right flex-shrink-0">
              <p className="text-[8px] md:text-[9px] text-[#a89a9e] tracking-[0.12em] leading-tight">
                Designed with
              </p>
              <p
                className="text-[11px] md:text-[13px] font-bold text-[#2a2325] leading-tight mt-0.5"
                style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.02em' }}
              >
                MemoAlbum
              </p>
              <p className="text-[8px] md:text-[9px] text-[#a89a9e] leading-tight mt-0.5 flex items-center justify-end gap-1">
                Powered by 
                <img src="/images/CodeBuilder.png" alt="CodeBuilder" className="h-3 w-auto" />
                <span className="font-semibold text-[#6b5d60]">CodeBuilder</span>
              </p>
            </div>
          </div>

          {/* ── Footer Message ── */}
          <div className="mt-2 pt-2 border-t border-[#f0e8eb]">
            <p
              className="text-center text-[8px] md:text-[9px] italic text-[#a89a9e] leading-relaxed"
              style={{ fontFamily: 'Libre Caslon Text, serif' }}
            >
              Every picture tells a story. Thank you for letting us preserve yours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
