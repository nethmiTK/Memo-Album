'use client';

import { useEffect, useState } from 'react';

export default function PhotographerAdminDashboard() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#fff8f8] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-1 gap-6 rounded-[1.6rem] bg-[#f8eff3] p-5 md:p-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-2xl bg-[#f6edf1] p-6 text-[#7c6d72] lg:block">
          <p className="text-2xl italic font-serif text-[#32282c]">Atelier</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em]">Premium Admin</p>

          <div className="mt-10 space-y-5 text-[11px] uppercase tracking-[0.2em]">
            <div className="text-[#920857]">Curate</div>
            <div>Archives</div>
            <div>Client Portals</div>
            <div>Financials</div>
            <div>Studio</div>
          </div>
        </aside>

        <div className="relative rounded-[1.2rem] bg-[#fcf7f9] p-6 md:p-10">
          <div className="absolute -left-6 top-20 hidden h-48 w-36 rotate-[-5deg] rounded-xl bg-[#ece2e6] lg:block" />
          <div className="absolute -right-8 bottom-10 hidden h-64 w-44 rotate-[8deg] rounded-xl bg-[#eee5e8] lg:block" />

          <div className="relative z-10 text-center">
            <p className="text-sm text-[#4e4145]">Welcome back, Curator</p>
            <p className="mt-1 text-sm text-[#7e6d73]">Finalizing your editorial archive...</p>

            <p className="mt-12 text-7xl italic text-[#d15f9e] md:text-9xl" style={{ fontFamily: 'Newsreader, serif' }}>
              {progress}%
            </p>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#75666c]">
              ... syncing studio assets
            </p>

            <div className="mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#eadde3]">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#920857] to-[#c54792] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 opacity-70">
              <div className="h-20 rounded-xl bg-[#efe3e8]" />
              <div className="h-24 rounded-xl bg-[#eadde3]" />
              <div className="h-20 rounded-xl bg-[#efe3e8]" />
            </div>

            <div className="mt-8 inline-flex rounded-full bg-[#f2e7ec] px-5 py-2 text-xs text-[#7a6b71]">
              Estimated time: {progress < 100 ? '2s' : 'Completed'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
