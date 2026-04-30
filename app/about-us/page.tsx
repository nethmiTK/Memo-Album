'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiShield, FiSmile, FiGlobe, FiHeart, FiStar } from 'react-icons/fi';
import Footer from '../Components/website/Footer';

const AboutUs = () => {
    const craftItems = [
        { title: 'Create & Organize', desc: 'Create and organize digital albums effortlessly', icon: <FiSmile size={18} /> },
        { title: 'Secure Storage', desc: 'Store your photos, videos, and special moments safely', icon: <FiShield size={18} /> },
        { title: 'Share Memories', desc: 'Share memories with friends and family instantly', icon: <FiStar size={18} /> },
        { title: 'Relive Anytime', desc: 'Relive your favorite experiences anytime, anywhere', icon: <FiGlobe size={18} /> },
    ];

    const whyItems = [
        { title: 'User-Friendly', desc: 'Easy to use for everyone, regardless of technical skill', icon: <FiSmile size={16} /> },
        { title: 'Secure Storage', desc: 'Your memories are safe with us, protected by modern security', icon: <FiShield size={16} /> },
        { title: 'Beautiful Design', desc: 'Showcase your moments in style with elegant layouts', icon: <FiStar size={16} /> },
        { title: 'Accessible Anywhere', desc: 'View your albums anytime, on any device', icon: <FiGlobe size={16} /> },
    ];

    return (
        <>
            <main className="min-h-screen bg-[#fff8f8] text-[#211a1b]">
                <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-[11px] text-[#920857] hover:text-[#7d064a]">
                        <FiArrowLeft size={14} />
                        Back to Home
                    </Link>

                    <h1 className="mt-5 text-5xl text-[#211a1b] md:text-6xl" style={{ fontFamily: 'Newsreader, serif' }}>
                        About MemoAlbum
                    </h1>
                    <p className="mt-2 text-3xl italic text-[#6f5f64]" style={{ fontFamily: 'Newsreader, serif' }}>
                        Where your memories come to life
                    </p>
                </div>

                <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 md:grid-cols-2 md:px-8">
                    <div>
                        <p className="text-5xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                            Our Mission to Preserve
                        </p>
                        <p className="mt-5 text-lg leading-8 text-[#5e5257]">
                            Welcome to <strong className="text-[#920857]">MemoAlbum</strong> – where your memories come to life.
                        </p>
                        <p className="mt-4 text-base leading-8 text-[#5e5257]">
                            At MemoAlbum, we believe that every moment tells a story. Whether it's a joyful celebration, a quiet milestone, or a once-in-a-lifetime experience, our mission is to help you preserve those memories in a meaningful and beautiful way.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl bg-[#0d1e2c] shadow-[0_22px_55px_rgba(33,26,27,0.2)]">
                        <img
                            src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80"
                            alt="MemoAlbum vision"
                            className="h-[420px] w-full object-cover"
                        />
                    </div>
                </section>

                <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 md:grid-cols-[1.1fr_0.9fr] md:px-8">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#9d8a92]">Our Story</p>
                        <h2 className="mt-3 text-5xl italic leading-tight text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                            The simple idea that grew into a digital atelier for souls.
                        </h2>
                        <p className="mt-6 text-base leading-8 text-[#5e5257]">
                            MemoAlbum was created with a simple idea: to make it easy for people to collect, organize, and relive their most valuable moments. In today's fast-moving digital world, memories can easily get lost. We're here to make sure they stay with you forever.
                        </p>
                    </div>

                    <div className="flex items-center">
                        <div className="w-full rounded-2xl bg-[#eddbe3] p-8 text-center text-sm italic text-[#786a70]" style={{ fontFamily: 'Newsreader, serif' }}>
                            "Memory is the story of the soul."
                        </div>
                    </div>
                </section>

                <section className="bg-[#f0dfe6] py-16">
                    <div className="mx-auto max-w-6xl px-4 md:px-8">
                        <h2 className="text-center text-5xl italic text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                            Crafting the Digital Archive
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#6a5d62]">We provide a platform where you can:</p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {craftItems.map((item) => (
                                <article key={item.title} className="rounded-xl bg-white p-5 shadow-[0_10px_24px_rgba(33,26,27,0.06)]">
                                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f4e6ee] text-[#920857]">{item.icon}</div>
                                    <h3 className="mt-3 text-xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>{item.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[#615458]">{item.desc}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
                    <div className="rounded-2xl bg-gradient-to-r from-[#920857] to-[#bc4e96] px-6 py-10 text-center text-white md:px-12">
                        <FiHeart className="mx-auto" size={26} />
                        <h2 className="mt-3 text-5xl italic" style={{ fontFamily: 'Newsreader, serif' }}>
                            Turning Memories into Treasures
                        </h2>
                        <p className="mx-auto mt-4 max-w-3xl text-base text-[#f5e7ef]">
                            Our mission is to turn everyday memories into lasting treasures. We aim to provide a simple, secure, and enjoyable experience for everyone who wants to keep their life stories alive.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1.2fr]">
                        <div className="space-y-5">
                            {whyItems.slice(0, 2).map((item) => (
                                <article key={item.title}>
                                    <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2e5ec] text-[#920857]">{item.icon}</div>
                                    <h3 className="text-2xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>{item.title}</h3>
                                    <p className="mt-1 text-sm text-[#615458]">{item.desc}</p>
                                </article>
                            ))}
                        </div>

                        <div className="space-y-5">
                            {whyItems.slice(2).map((item) => (
                                <article key={item.title}>
                                    <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f2e5ec] text-[#920857]">{item.icon}</div>
                                    <h3 className="text-2xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>{item.title}</h3>
                                    <p className="mt-1 text-sm text-[#615458]">{item.desc}</p>
                                </article>
                            ))}
                        </div>

                        <article className="rounded-2xl bg-[#fbf4f7] p-6">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#920857]">Excellence</p>
                            <h3 className="mt-3 text-5xl leading-tight text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                                Why the world's collectors choose MemoAlbum.
                            </h3>
                            <p className="mt-4 text-sm italic leading-7 text-[#625459]" style={{ fontFamily: 'Newsreader, serif' }}>
                                We focus on the small details-the weight of typography, the breath of whitespace, and the rhythm of your narrative.
                            </p>
                        </article>
                    </div>
                </section>

                <section className="mx-auto max-w-4xl px-4 pb-16 text-center md:px-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#a38f97]">The Future</p>
                    <h2 className="mt-2 text-6xl italic text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                        A Legacy Beyond Pixels
                    </h2>
                    <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#625459]">
                        To become a trusted digital space for humanity's memories where people around the world can preserve, share, and celebrate their memories for generations to come.
                    </p>
                    <div className="mx-auto mt-8 h-[2px] w-20 bg-[#ddc1d0]" />
                </section>

                <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
                    <div className="rounded-xl bg-gradient-to-r from-[#920857] to-[#c74e98] px-6 py-10 md:flex md:items-center md:justify-between md:px-10">
                        <div>
                            <h3 className="text-4xl text-white" style={{ fontFamily: 'Newsreader, serif' }}>Ready to Preserve Your Memories?</h3>
                            <p className="mt-2 text-sm text-[#f4e4ed]">Join thousands of people who trust MemoAlbum to keep their stories alive.</p>
                        </div>
                        <Link
                            href="/"
                            className="mt-5 inline-block rounded-lg bg-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#920857] md:mt-0"
                        >
                            Get Started Today
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default AboutUs;
