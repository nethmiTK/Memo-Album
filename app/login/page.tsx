"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Components/website/navbar";
import { FaEnvelope, FaLock, FaArrowRight, FaHome } from "react-icons/fa";

const STAR_POSITIONS = [
  { left: 15, top: 20 }, { left: 85, top: 35 }, { left: 45, top: 10 },
  { left: 25, top: 75 }, { left: 70, top: 60 }, { left: 10, top: 45 },
  { left: 55, top: 85 }, { left: 35, top: 30 }, { left: 90, top: 15 },
  { left: 5, top: 90 }, { left: 60, top: 50 }, { left: 80, top: 80 },
  { left: 20, top: 55 }, { left: 75, top: 25 }, { left: 40, top: 70 },
  { left: 95, top: 45 }, { left: 30, top: 95 }, { left: 65, top: 5 },
  { left: 50, top: 40 }, { left: 12, top: 65 },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      const { token, user } = data;

      // Store auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Role-based redirection
      if (user.role === "customer") {
        window.location.href = "/my-albums";
      } 
      else if (user.role === "photographer") {
        window.location.href = "/photographer-admin";     // ← Updated
      } 
      else if (user.role === "superadmin") {
        setError("Super Admin should use the Admin Portal.");
        setLoading(false);
        return;
      } 
      else {
        setError("Unknown user role. Please contact support.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col #FFFFF8 bg-gradient-to-t from-[#B69392] to-[#fff0f0] overflow-hidden">
      <Navbar />

      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 z-10" />
        <img
          src="/images/login.png"
          alt="Wedding Background"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none opacity-30">
        {STAR_POSITIONS.map((pos, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -100, 0], opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 5 + (i % 5), repeat: Infinity, delay: i * 0.5 }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 px-4 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <motion.h1 className="text-4xl font-serif text-white mb-1 drop-shadow-2xl">
              Memo<span className="text-pink-400">Album</span>
            </motion.h1>
            <p className="text-gray-300 font-light tracking-widest uppercase text-[10px]">
              Elegance in Every Moment
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-serif text-white mb-6 text-center">Welcome Back</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5 group">
                <label className="text-pink-100 text-[10px] font-bold uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center text-BLACK/50">
                    <FaEnvelope className="text-base" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all placeholder:text-white/30"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-pink-100 text-[10px] font-bold uppercase tracking-wider">Password</label>
                  <Link href="/auth/forgot-password" className="text-pink-400/70 hover:text-pink-400 text-[9px] font-bold uppercase tracking-widest transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center text-black/50">
                    <FaLock className="text-base" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all placeholder:text-white/30"
                    disabled={loading}
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <FaArrowRight className="text-xs" />
                  </>
                )}
              </motion.button>
            </form>

             
          </div>
        </motion.div>
      </div>
    </main>
  );
}