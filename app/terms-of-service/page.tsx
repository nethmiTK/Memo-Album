'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Footer from '../Components/website/Footer';

const TermsOfService = () => {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <main className="min-h-screen bg-[#fff8f8] text-[#211a1b]">
                {/* Header */}
                <div className="bg-[#f2e7ec] py-12">
                    <div className="container mx-auto px-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-[#920857] hover:text-[#7d064a] mb-6 transition-colors">
                            <FiArrowLeft size={18} />
                            <span className="text-sm font-semibold">Back to Home</span>
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-[#211a1b] mb-3">
                            Terms and Conditions
                        </h1>
                        <p className="text-[#5f5257]">Last Updated: March 19, 2026</p>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="prose prose-lg max-w-none">
                    <div className="mb-8 p-6 bg-[#f6edf1] rounded-2xl border border-[#ead8e2]">
                        <p className="text-[#42373b] m-0">
                            Welcome to <strong>MemoAlbum</strong>. By accessing or using our website (https://memoalbum.com), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.
                        </p>
                    </div>

                    {/* Section 1 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">1</span>
                            Acceptance of Terms
                        </h2>
                        <p className="text-gray-600">
                            By using this website, you agree to be legally bound by these Terms and Conditions, our Privacy Policy, and any other policies posted on the site. If you do not agree, please do not use our services.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">2</span>
                            Use of the Website
                        </h2>
                        <p className="text-gray-600 mb-6">You agree to use MemoAlbum only for lawful purposes. You must not:</p>
                        <ul className="space-y-3 list-none">
                            {[
                                'Upload or share harmful, illegal, or offensive content',
                                'Attempt to hack, disrupt, or damage the website',
                                'Use the platform for fraudulent or misleading activities'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">3</span>
                            User Accounts
                        </h2>
                        <p className="text-gray-600 mb-6">To access certain features, you may need to create an account.</p>
                        <ul className="space-y-3 list-none">
                            {[
                                'You are responsible for maintaining the confidentiality of your account',
                                'You must provide accurate and complete information',
                                'We reserve the right to suspend or terminate accounts that violate our terms'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">4</span>
                            Content Ownership
                        </h2>
                        <ul className="space-y-3 list-none">
                            {[
                                'Users retain ownership of the content they upload (photos, albums, etc.)',
                                'By uploading content, you grant MemoAlbum a non-exclusive license to store, display, and process your content for service functionality',
                                'You must ensure you have the rights to upload and share your content'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">5</span>
                            Intellectual Property
                        </h2>
                        <p className="text-gray-600 mb-6">
                            All website content including logos, design, text, and software is owned by MemoAlbum or its licensors and is protected by copyright laws.
                        </p>
                        <p className="text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            You may not copy, reproduce, or distribute any content without permission.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">6</span>
                            Payments and Services
                        </h2>
                        <p className="text-gray-600 mb-6">If MemoAlbum offers paid services:</p>
                        <ul className="space-y-3 list-none">
                            {[
                                'All payments must be made in full before service delivery',
                                'Prices may change at any time without prior notice',
                                'Refund policies will be clearly stated where applicable'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">7</span>
                            Limitation of Liability
                        </h2>
                        <p className="text-gray-600 mb-6">MemoAlbum is not responsible for:</p>
                        <ul className="space-y-3 list-none mb-6">
                            {[
                                'Loss of data or content',
                                'Service interruptions or technical issues',
                                'Any damages arising from use of the website'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            Use of the site is at your own risk.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">8</span>
                            Privacy
                        </h2>
                        <p className="text-gray-600">
                            Your use of the website is also governed by our <Link href="/privacy-policy" className="text-[#920857] hover:text-[#7d064a] font-semibold transition-colors">Privacy Policy</Link>, which explains how we collect and use your data.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">9</span>
                            Termination
                        </h2>
                        <p className="text-gray-600">
                            We reserve the right to suspend or terminate access to our website at any time without notice if you violate these Terms.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">10</span>
                            Third-Party Links
                        </h2>
                        <p className="text-gray-600">
                            Our website may contain links to third-party websites. We are not responsible for the content or practices of these external sites.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">11</span>
                            Changes to Terms
                        </h2>
                        <p className="text-gray-600">
                            We may update these Terms and Conditions at any time. Changes will be posted on this page with the updated date.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">12</span>
                            Governing Law
                        </h2>
                        <p className="text-gray-600">
                            These Terms shall be governed by and interpreted in accordance with the laws of Sri Lanka.
                        </p>
                    </section>

                    {/* Section 13 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">13</span>
                            Contact Us
                        </h2>
                        <p className="text-gray-600 mb-6">If you have any questions about these Terms and Conditions, you can contact us:</p>
                        <div className="space-y-3 text-gray-600">
                            <p><strong>Email:</strong> <a href="mailto:ifo@memoalbum.com" className="text-[#920857] hover:text-[#7d064a] transition-colors">ifo@memoalbum.com</a></p>
                            <p><strong>Website:</strong> <a href="https://memoalbum.com" className="text-[#920857] hover:text-[#7d064a] transition-colors">https://memoalbum.com</a></p>
                        </div>
                    </section>

                    {/* Consent Footer */}
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <p className="text-center text-gray-700 text-lg font-semibold">
                            By using our website, you agree to these Terms and Conditions.
                        </p>
                    </div>
                </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default TermsOfService;
