'use client';

import React from 'react';

interface EndPageProps {
  endPhoto?: string;
  endPhotoName?: string;
  photographerName?: string;
  photographerStudio?: string;
  photographerWebsite?: string;
  accent?: string;
  albumName?: string;
  weddingDate?: string | Date;
}

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(177,14,107,${alpha})`;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export function EndPage({
  endPhoto,
  endPhotoName,
  photographerName,
  photographerStudio,
  photographerWebsite,
  accent = '#b10e6b',
  albumName,
  weddingDate,
}: EndPageProps) {
  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div
      className="h-full w-full p-2"
      style={{
        background: `linear-gradient(180deg, ${hexToRgba(accent, 0.15)} 0%, ${hexToRgba(accent, 0.06)} 100%)`,
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[1.1rem] shadow-[0_14px_35px_rgba(0,0,0,0.06)]"
        style={{
          borderColor: hexToRgba(accent, 0.26),
          backgroundColor: '#ffffff',
        }}
      >
        {/* Background Image */}
        {endPhoto && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${endPhoto}')`,
              opacity: 0.85,
            }}
          />
        )}

        {/* Overlay gradient for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.4)} 0%, ${hexToRgba(accent, 0.25)} 50%, rgba(0,0,0,0.2) 100%)`,
          }}
        />

        {/* Content Container */}
        <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-8 text-center">
          {/* Main Section */}
          <div className="max-w-md space-y-6">
            {/* Header Text */}
            {albumName && (
              <div className="space-y-2">
                <h1
                  className="text-4xl md:text-5xl font-light italic text-white drop-shadow-lg"
                  style={{ fontFamily: 'Libre Caslon Text, serif' }}
                >
                  {albumName}
                </h1>
                {formattedDate && (
                  <p className="text-sm md:text-base text-white/90 tracking-wider font-light drop-shadow">
                    {formattedDate}
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center justify-center gap-3 py-4">
              <div
                className="h-px flex-1"
                style={{
                  backgroundColor: hexToRgba('#ffffff', 0.5),
                }}
              />
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: hexToRgba('#ffffff', 0.7) }}
              />
              <div
                className="h-px flex-1"
                style={{
                  backgroundColor: hexToRgba('#ffffff', 0.5),
                }}
              />
            </div>

            {/* Created With Section */}
            <div className="space-y-3">
              <p
                className="text-xs md:text-sm uppercase tracking-[0.15em] text-white/80 font-semibold drop-shadow"
                style={{ letterSpacing: '0.2em' }}
              >
                Created with
              </p>

              {/* Photographer Details */}
              <div className="space-y-1">
                {photographerName && (
                  <p
                    className="text-xl md:text-2xl font-semibold text-white drop-shadow-lg"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {photographerName}
                  </p>
                )}

                {photographerStudio && (
                  <p
                    className="text-sm md:text-base text-white/90 drop-shadow"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {photographerStudio}
                  </p>
                )}

                {photographerWebsite && (
                  <p
                    className="text-xs md:text-sm text-white/85 tracking-wide drop-shadow mt-2"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {photographerWebsite}
                  </p>
                )}
              </div>
            </div>

            {/* Accent accent dot */}
            {endPhotoName && (
              <p
                className="text-xs text-white/60 italic drop-shadow mt-6"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {endPhotoName}
              </p>
            )}
          </div>

          {/* Bottom accent element */}
          <div
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full drop-shadow"
            style={{
              backgroundColor: hexToRgba('#ffffff', 0.6),
            }}
          />
        </div>
      </div>
    </div>
  );
}
