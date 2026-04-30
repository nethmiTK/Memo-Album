'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Footer from '../Components/website/Footer';

const ReturnPolicy = () => {
    return (
        <>
            <main className="min-h-screen bg-[#fff8f8] text-[#211a1b]">
                <div className="bg-[#f2e7ec] py-12">
                    <div className="container mx-auto px-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-[#920857] hover:text-[#7d064a] mb-6 transition-colors">
                            <FiArrowLeft size={18} />
                            <span className="text-sm font-semibold">Back to Home</span>
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-[#211a1b] mb-3">
                            Return & Refund Policy
                        </h1>
                        <p className="text-[#5f5257]">Last Updated: April 9, 2026</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 max-w-4xl">
                    <div className="prose prose-lg max-w-none">
                        <div className="mb-8 p-6 bg-[#f6edf1] rounded-2xl border border-[#ead8e2]">
                            <p className="text-[#42373b] m-0">
                                Welcome to <strong>MemoAlbum</strong>. This Return & Refund Policy explains when refunds may or may not be issued for subscriptions and related services.
                            </p>
                        </div>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">1</span>
                                No Refund After Activation
                            </h2>
                            <p className="text-gray-600">
                                Once the subscription is activated and services are accessible, payments are non-refundable.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">2</span>
                                Free Trial Clause
                            </h2>
                            <p className="text-gray-600">
                                If a free trial is offered, users can cancel before the trial ends to avoid being charged.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">3</span>
                                Cancellation Policy
                            </h2>
                            <p className="text-gray-600">
                                Users can cancel their subscription at any time, but the service will continue until the end of the current billing cycle.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">4</span>
                                No Partial Refunds
                            </h2>
                            <p className="text-gray-600">
                                No refunds or credits will be provided for partially used subscription periods.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">5</span>
                                Automatic Renewal
                            </h2>
                            <p className="text-gray-600">
                                Subscriptions automatically renew unless canceled before the renewal date.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">6</span>
                                Billing Errors
                            </h2>
                            <p className="text-gray-600">
                                If a user is charged incorrectly, they must report it within 7 days for review and possible refund.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">7</span>
                                Service Issues
                            </h2>
                            <p className="text-gray-600">
                                Refunds may be considered only if there is a proven technical issue that prevents access to the service.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">8</span>
                                Account Responsibility
                            </h2>
                            <p className="text-gray-600">
                                Users are responsible for managing their subscriptions and cancellations.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">9</span>
                                Payment Methods
                            </h2>
                            <p className="text-gray-600">
                                Refunds, if approved, will be issued using the original payment method.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">10</span>
                                Policy Changes
                            </h2>
                            <p className="text-gray-600">
                                The company reserves the right to update or modify this return and refund policy at any time.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#920857] text-white text-sm font-bold">11</span>
                                Contact Us
                            </h2>
                            <p className="text-gray-600 mb-6">
                                If you have questions about this policy or need help with a billing issue, contact us at:
                            </p>
                            <div className="space-y-3 text-gray-600">
                                <p><strong>Email:</strong> <a href="mailto:ifo@memoalbum.com" className="text-[#920857] hover:text-[#7d064a] transition-colors">ifo@memoalbum.com</a></p>
                                <p><strong>Website:</strong> <a href="https://memoalbum.com" className="text-[#920857] hover:text-[#7d064a] transition-colors">https://memoalbum.com</a></p>
                            </div>
                        </section>

                        <div className="mt-16 pt-12 border-t border-gray-200">
                            <p className="text-center text-gray-700 text-lg font-semibold">
                                By using our services, you agree to this Return & Refund Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default ReturnPolicy;