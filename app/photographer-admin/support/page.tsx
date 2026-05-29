'use client';

import {
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiGrid,
  FiLifeBuoy,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiShield,
  FiUsers,
} from 'react-icons/fi';

const supportChannels = [
  {
    icon: <FiMessageCircle size={16} />,
    title: 'Live Chat',
    subtitle: 'Immediate help for workflow, gallery, and archive questions.',
    action: 'Open Chat',
  },
  {
    icon: <FiPhone size={16} />,
    title: 'Priority Phone',
    subtitle: 'Talk to an admin specialist for urgent publishing issues.',
    action: 'Call Support',
  },
  {
    icon: <FiMail size={16} />,
    title: 'Email Desk',
    subtitle: 'Best for account, billing, and delivery follow-ups.',
    action: 'Send Email',
  },
];

const adminContacts = [
  {
    label: 'Admin Contact',
    value: 'admin@memoalbum.com',
    note: 'Account, access, and approvals',
  },
  {
    label: 'Template Desk',
    value: 'templates@memoalbum.com',
    note: 'Layouts, design sync, and book setup',
  },
  {
    label: 'Emergency Line',
    value: '+1 (555) 018-2400',
    note: 'Priority support for active client work',
  },
];

const templateGuides = [
  {
    icon: <FiBookOpen size={16} />,
    title: 'Album Templates',
    subtitle: 'Browse layout presets and production-ready book styles.',
  },
  {
    icon: <FiGrid size={16} />,
    title: 'Support Library',
    subtitle: 'Step-by-step articles for gallery, archive, and designer flows.',
  },
  {
    icon: <FiShield size={16} />,
    title: 'Admin Policies',
    subtitle: 'Access rules, publishing checks, and safe content handling.',
  },
  {
    icon: <FiLifeBuoy size={16} />,
    title: 'System Status',
    subtitle: 'Track service health and release notes before reporting issues.',
  },
];

export default function SupportPage() {
  return (
    <section className="min-h-screen bg-[#fbf4f5] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-[#ead7df] bg-[#171314] shadow-[0_28px_70px_rgba(23,19,20,0.18)]">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(177,14,107,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />
              <div className="relative z-10 max-w-3xl">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#f5c7db]">Support Center</p>
                <h1 className="mt-4 text-4xl leading-tight text-white md:text-6xl" style={{ fontFamily: 'Newsreader, serif' }}>
                  Admin contact and template support in one place.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#e9dbe0] md:text-base">
                  Use this space to reach the right team fast, review template resources, and keep every client workflow on track.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80 backdrop-blur-sm">
                    Search help articles, templates, or admin guidance
                  </div>
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#b10e6b] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#951254]">
                    Search
                    <FiArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/8 bg-[#201a1d] px-6 py-8 md:px-8 lg:border-l lg:border-t-0">
              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#f4c1d7]">Need help now</p>
                <div className="mt-4 space-y-3 text-sm text-[#f1e8eb]">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
                    <span className="flex items-center gap-2"><FiClock /> Response window</span>
                    <span className="font-semibold text-white">Under 2 hours</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
                    <span className="flex items-center gap-2"><FiUsers /> Admin team</span>
                    <span className="font-semibold text-white">Available daily</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
                    <span className="flex items-center gap-2"><FiShield /> Secure channel</span>
                    <span className="font-semibold text-white">Protected access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {supportChannels.map((card) => (
            <article key={card.title} className="rounded-[1.35rem] border border-[#ead7df] bg-white p-6 shadow-[0_16px_40px_rgba(33,26,27,0.06)]">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5e8ed] text-[#b10e6b]">
                {card.icon}
              </div>
              <h2 className="mt-4 text-xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5d4f54]">{card.subtitle}</p>
              <button className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10e6b]">
                {card.action}
                <FiArrowRight size={12} />
              </button>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[1.6rem] border border-[#ead7df] bg-white p-6 shadow-[0_16px_40px_rgba(33,26,27,0.06)] md:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#f0e5ea] pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#920857]">Admin Contact</p>
                <h3 className="mt-2 text-3xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                  Reach the right desk
                </h3>
              </div>
              <FiMail className="text-[#b10e6b]" size={22} />
            </div>

            <div className="mt-6 space-y-3">
              {adminContacts.map((contact) => (
                <div key={contact.label} className="rounded-2xl border border-[#f0e5ea] bg-[#fbf7f8] px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b6c71]">{contact.label}</p>
                      <p className="mt-1 text-lg text-[#211a1b]">{contact.value}</p>
                    </div>
                    <FiArrowRight className="mt-1 text-[#b10e6b]" size={16} />
                  </div>
                  <p className="mt-2 text-sm text-[#5d4f54]">{contact.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#ead7df] bg-[#fffafb] p-6 shadow-[0_16px_40px_rgba(33,26,27,0.06)] md:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#f0e5ea] pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#920857]">Template UI</p>
                <h3 className="mt-2 text-3xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>
                  Quick guides and resources
                </h3>
              </div>
              <FiBookOpen className="text-[#b10e6b]" size={22} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {templateGuides.map((guide) => (
                <article key={guide.title} className="rounded-2xl border border-[#f1e3ea] bg-white p-5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5e8ed] text-[#b10e6b]">
                    {guide.icon}
                  </div>
                  <h4 className="mt-4 text-lg text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>{guide.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#5d4f54]">{guide.subtitle}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] border border-[#ead7df] bg-linear-to-r from-[#181214] via-[#2a1f25] to-[#8d5a73] p-6 text-white md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#f2c6d7]">Concierge note</p>
              <h4 className="mt-3 text-3xl md:text-4xl" style={{ fontFamily: 'Newsreader, serif' }}>
                Keep your gallery, archive, and designer workflow aligned.
              </h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#efe4ea]">
                If you need help matching albums to templates, moving archive folders, or handling admin approvals, this support space is built to send you to the correct resource quickly.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#211a1b]">
              Open Guide Library
              <FiArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
