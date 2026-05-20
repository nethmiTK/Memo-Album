'use client';

import { useState } from 'react';
import Link from 'next/link';

const footerExploreLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Albums', href: '/album' },
    { label: 'Login', href: '/login' },
];

const footerLegalLinks = [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
];

const Footer = () => {
    const [activeLink, setActiveLink] = useState<string | null>(null);

    const handleClick = (label: string) => {
        setActiveLink(label);
    };

    return (
        <footer className="relative bg-[#A11462]/20 backdrop-blur-2xl border-t border-[#A11462]/30 py-12 sm:py-14 md:py-16">
            {/* Glassmorphic background effect */}
            <div className="absolute inset-0 bg-linear-to-b from-[#A11462]/10 to-[#A11462]/5 pointer-events-none" />
            
            <div className="relative z-10 mx-auto grid max-w-6xl gap-8 sm:gap-10 px-4 sm:px-5 md:grid-cols-4 md:px-10">
                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white font-semibold">Editorial House</p>
                    <h3
                        className="mt-2 text-xl sm:text-2xl text-white font-semibold"
                        style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
                        Memo Album
                    </h3>
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/85">
                        A digital archive studio for wedding storytellers and thoughtful couples.
                    </p>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white font-semibold">Explore</p>
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/85">
                        {footerExploreLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => handleClick(link.label)}
                                className={`block cursor-pointer transition-colors duration-300 ${activeLink === link.label ? 'text-[#97095A] font-medium' : 'hover:text-white hover:font-medium text-white/85'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white font-semibold">Legal</p>
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/85">
                        {footerLegalLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => handleClick(link.label)}
                                className={`block cursor-pointer transition-colors duration-300 ${activeLink === link.label ? 'text-[#97095A] font-medium' : 'hover:text-white hover:font-medium text-white/85'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white font-semibold">Contact</p>
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/85">
                        <a
                            href="mailto:hello@memoalbum.com"
                            onClick={() => handleClick('Contact')}
                            className={`block cursor-pointer transition-colors duration-300 ${activeLink === 'Contact' ? 'text-[#97095A] font-medium' : 'hover:text-white hover:font-medium text-white/85'}`}
                        >
                            memoalbum.com
                        </a>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-5 md:px-10 mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-[#A11462]/20">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[8px] sm:text-[9px] text-white/75 text-center sm:text-left font-medium">
                        © 2026 Memo Album. All rights reserved. Made with ❤️ in world wide.
                    </p>
                  
                </div>
            </div>
        </footer>
    );
};

export default Footer;
