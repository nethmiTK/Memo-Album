"use client";

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#FFEAF0] via-[#FFF3F6] to-[#FFF8F7]">
      <div className="w-full max-w-md px-8 py-10 rounded-2xl text-center" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-white/60 shadow-sm flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#FFEAF0"/>
            <path d="M7 13l3 3 7-7" stroke="#D23284" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-[#7f1940]">Loading…</h3>
        <p className="mt-2 text-sm text-[#7f5a67]">Please wait while we prepare your memories.</p>

        <div className="mt-6">
          <div className="relative h-3 w-full rounded-full bg-white/50 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FDE8EF] via-[#F7C6DA] to-[#FDE8EF]"
              style={{ width: '30%', transform: 'translateX(-120%)', animation: 'loadingMove 1.6s linear infinite' }}
            />
          </div>
        </div>
      </div>

      <style>{`@keyframes loadingMove{0%{transform:translateX(-120%)}50%{transform:translateX(30%)}100%{transform:translateX(220%)}}`}</style>
    </div>
  );
}
