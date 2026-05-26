'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import Image from 'next/image';

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

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => setIsHolding(true);
  const handleMouseUp = () => setIsHolding(false);

  const handleTouchStart = () => setIsHolding(true);
  const handleTouchEnd = () => setIsHolding(false);

  useEffect(() => {
    if (isHolding) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + 1.1, 100);
          if (newProgress >= 100) {
            clearInterval(intervalRef.current!);
            setTimeout(() => router.push('/home'), 400);
            return 100;
          }
          return newProgress;
        });
      }, 16);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.max(prev - 4.5, 0);
          if (newProgress <= 0) clearInterval(intervalRef.current!);
          return newProgress;
        });
      }, 16);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHolding, router]);

  return (
    <main
      className={`${newsreader.variable} ${plusJakarta.variable} bg-[#fff8f8] text-[#211a1b] min-h-screen flex items-center justify-center overflow-hidden`}
      style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
    >
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 bg-[radial-gradient(#e8d5da_0.8px,transparent_1px)] bg-[length:24px_24px] opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="relative flex flex-col items-center cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Progress Container */}
          <motion.div
            animate={{
              scale: isHolding ? 1.03 : 1,
            }}
            transition={{ duration: 0.4 }}
            className="relative w-80 h-80 md:w-[380px] md:h-[380px]"
          >
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background Circle */}
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke="#f3e5e6"
                strokeWidth="9"
              />
              {/* Progress Circle with animation */}
              <motion.circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke="#890051"
                strokeWidth="9"
                strokeDasharray="578"
                strokeDashoffset={578 - (progress / 100) * 578}
                strokeLinecap="round"
                animate={{
                  strokeDashoffset: 578 - (progress / 100) * 578,
                }}
                transition={{ ease: "linear", duration: 0.05 }}
              />
            </svg>

            {/* Logo with animations */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: isHolding ? [1, 1.08, 1] : 1,
                rotate: isHolding ? [0, 1, -1, 0] : 0,
              }}
              transition={{
                scale: { duration: 2.2, repeat: Infinity },
                rotate: { duration: 3, repeat: Infinity },
              }}
            >
              <div className="relative w-40 h-40 md:w-48 md:h-48">
                <Image
                  src="/images/logobg.png"
                  alt="The Vow of Silence"
                  fill
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>
            </motion.div>

            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: isHolding
                  ? "0 0 60px 20px rgba(137, 0, 81, 0.25)"
                  : "0 0 30px 8px rgba(137, 0, 81, 0.1)",
              }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>

          {/* Percentage with bounce animation */}
          <motion.p
            className="mt-8 text-4xl font-semibold tabular-nums tracking-tight text-[#8c0053]"
            style={{ fontFamily: 'var(--font-newsreader)' }}
            animate={{
              scale: progress > 0 ? [1, 1.12, 1] : 1,
            }}
            transition={{ duration: 0.4 }}
            key={Math.floor(progress)}
          >
            {Math.floor(progress)}%
          </motion.p>

          <motion.p
            className="mt-4 text-sm text-[#534345]"
            animate={{ opacity: isHolding ? 0.9 : 0.5 }}
          >
            {isHolding ? "Releasing the archive..." : "Hold the logo to enter the archive"}
          </motion.p>
        </motion.div>
      </div>

      {/* Instruction Text */}
      <AnimatePresence>
        {progress < 12 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-12 text-xs uppercase tracking-widest text-[#8c0053]/70"
          >
            Press &amp; hold the logo
          </motion.p>
        )}
      </AnimatePresence>
    </main>
  );
}