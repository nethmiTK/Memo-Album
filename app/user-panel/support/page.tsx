'use client';

import { useState } from 'react';
import { Send, MessageCircle, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I download my photos?',
    answer:
      'You can download your photos individually or in bulk from the Albums section. Select the photos you want and click the download button.',
  },
  {
    question: 'How do I share my album with others?',
    answer:
      'Navigate to your album and click the Share button. You can generate a shareable link or invite specific people via email.',
  },
  {
    question: 'Can I request the photographer to edit certain photos?',
    answer:
      'Yes! You can leave requests on individual photos. The photographer will see your requests in their dashboard.',
  },
  {
    question: 'How do I delete photos?',
    answer:
      'Contact our support team or your photographer to delete photos. This prevents accidental deletion of important memories.',
  },
  {
    question: 'How long will my photos be stored?',
    answer:
      'Your photos are stored as long as your account is active. If you close your account, photos will be retained for 30 days before deletion.',
  },
];

export default function SupportPage() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitMessage = async () => {
    if (!email || !message) {
      alert('Please fill in all fields');
      return;
    }
    // TODO: Send message to support API
    setSubmitted(true);
    setEmail('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#2C1E26' }}>
          Support & Help
        </h1>
        <p className="text-gray-600 mt-2" style={{ color: '#6B7387' }}>
          We're here to help. Find answers to common questions or contact us.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-serif font-bold mb-6" style={{ color: '#2C1E26' }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden transition-all duration-300"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
              >
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === index ? null : index)
                  }
                  className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className="font-semibold"
                    style={{ color: '#2C1E26' }}
                  >
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`}
                    style={{ color: '#D23284' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {expandedFAQ === index && (
                  <div
                    className="px-4 pb-4 border-t pt-4"
                    style={{ borderColor: 'rgba(229, 204, 212, 0.2)', color: '#6B7387' }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <div
            className="rounded-2xl p-6 sticky top-24"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FEF0F1' }}
              >
                <MessageCircle size={24} style={{ color: '#D23284' }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#2C1E26' }}>
                Contact Us
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6" style={{ color: '#6B7387' }}>
              Have a question? Send us a message and we'll get back to you soon.
            </p>

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2C1E26' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors text-sm"
                  style={{ borderColor: '#E5CCD4' }}
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2C1E26' }}>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors text-sm resize-none"
                  style={{ borderColor: '#E5CCD4' }}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitMessage}
                disabled={submitted}
                className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-all hover:shadow-md flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(180deg, #C41474 0%, #B50F69 100%)' }}
              >
                <Send size={16} />
                Send Message
              </button>

              {submitted && (
                <div
                  className="text-center text-sm font-medium p-3 rounded-lg"
                  style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                >
                  Message sent! We'll be in touch soon.
                </div>
              )}
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t space-y-3" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
              <div className="flex items-start gap-3">
                <HelpCircle size={18} style={{ color: '#D23284', marginTop: '2px' }} />
                <div className="text-sm" style={{ color: '#6B7387' }}>
                  <p className="font-medium">Response time</p>
                  <p>We typically respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
