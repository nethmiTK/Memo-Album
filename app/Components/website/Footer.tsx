'use client';

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
    return (
        <footer className="bg-[#ebe0e1] py-10 sm:py-12 md:py-14">
            <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 px-4 sm:px-5 md:grid-cols-4 md:px-10">
                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#8b7079]">Editorial House</p>
                    <h3
                        className="mt-2 text-xl sm:text-2xl text-[#211a1b]"
                        style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
                        Memo Album
                    </h3>
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[#534345]">
                        A digital archive studio for wedding storytellers and thoughtful couples.
                    </p>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#8b7079]">Explore</p>
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[#534345]">
                        {footerExploreLinks.map((link) => (
                            <Link key={link.label} href={link.href} className="block hover:text-[#890051]">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#8b7079]">Legal</p>
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[#534345]">
                        {footerLegalLinks.map((link) => (
                            <Link key={link.label} href={link.href} className="block hover:text-[#890051]">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#8b7079]">Contact</p>
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[#534345]">
                        <a href="mailto:hello@memoalbum.com" className="block hover:text-[#890051]">
                            memoalbum.com
                        </a>
                        
                         
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
