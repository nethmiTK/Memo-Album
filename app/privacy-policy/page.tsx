'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Footer from '../Components/website/Footer';

const PrivacyPolicy = () => {
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
                            Privacy Policy
                        </h1>
                        <p className="text-[#5f5257]">Last Updated: March 18, 2026</p>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="prose prose-lg max-w-none">
                    <div className="mb-8 p-6 bg-[#f6edf1] rounded-2xl border border-[#ead8e2]">
                        <p className="text-[#42373b] m-0">
                            Welcome to <strong>MemoAlbum</strong> (https://memoalbum.com). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                        </p>
                    </div>

                    {/* Section 1 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">1</span>
                            Information We Collect
                        </h2>
                        <p className="text-gray-600 mb-6">We may collect the following types of information:</p>
                        
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">a. Personal Data</h3>
                            <ul className="space-y-3 list-none">
                                {['Name', 'Email address', 'Phone number (if provided)', 'Any information you voluntarily submit through forms'].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-gray-600">
                                        <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">b. Non-Personal Data</h3>
                            <ul className="space-y-3 list-none">
                                {['Browser type', 'IP address', 'Device information', 'Pages visited and time spent on the website'].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-gray-600">
                                        <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">2</span>
                            How We Use Your Information
                        </h2>
                        <p className="text-gray-600 mb-6">We use the collected information to:</p>
                        <ul className="space-y-3 list-none">
                            {[
                                'Provide and maintain our services',
                                'Improve user experience',
                                'Respond to inquiries and customer support requests',
                                'Send updates or promotional content (only if you opt-in)',
                                'Monitor website usage and performance'
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
                            Cookies and Tracking Technologies
                        </h2>
                        <p className="text-gray-600 mb-6">We may use cookies and similar tracking technologies to:</p>
                        <ul className="space-y-3 list-none mb-6">
                            {['Enhance user experience', 'Analyze website traffic', 'Remember user preferences'].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            You can choose to disable cookies through your browser settings.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">4</span>
                            Sharing Your Information
                        </h2>
                        <p className="text-gray-600 mb-6">We do not sell, trade, or rent your personal information. We may share information with:</p>
                        <ul className="space-y-3 list-none">
                            {['Service providers assisting in website operation', 'Legal authorities if required by law'].map((item, idx) => (
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
                            Data Security
                        </h2>
                        <p className="text-gray-600">
                            We implement appropriate security measures to protect your personal data. However, no method of transmission over the internet is 100% secure.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">6</span>
                            Third-Party Services
                        </h2>
                        <p className="text-gray-600">
                            Our website may contain links to third-party websites. We are not responsible for their privacy practices.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">7</span>
                            Your Privacy Rights
                        </h2>
                        <p className="text-gray-600 mb-6">Depending on your location, you may have the right to:</p>
                        <ul className="space-y-3 list-none">
                            {[
                                'Access your personal data',
                                'Request correction or deletion',
                                'Withdraw consent at any time'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#b43c8f] mt-2 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">8</span>
                            Children's Information
                        </h2>
                        <p className="text-gray-600">
                            We do not knowingly collect personal information from children under 13 years old.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">9</span>
                            Changes to This Privacy Policy
                        </h2>
                        <p className="text-gray-600">
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">10</span>
                            Contact Us
                        </h2>
                        <p className="text-gray-600 mb-6">If you have any questions about this Privacy Policy, please contact us:</p>
                        <div className="space-y-3 text-gray-600">
                            <p><strong>Website:</strong> <a href="https://memoalbum.com" className="text-[#920857] hover:text-[#7d064a] transition-colors">https://memoalbum.com</a></p>
                            <p><strong>Email:</strong> <a href="mailto:ifo@memoalbum.com" className="text-[#920857] hover:text-[#7d064a] transition-colors">ifo@memoalbum.com</a></p>
                        </div>
                    </section>

                    {/* Consent Footer */}
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <p className="text-center text-gray-700 text-lg font-semibold">
                            By using our website, you consent to this Privacy Policy.
                        </p>
                    </div>
                </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default PrivacyPolicy;
