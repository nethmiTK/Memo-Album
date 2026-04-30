import { FiCamera, FiCloud, FiCode, FiMail, FiMessageCircle, FiPhone, FiUsers } from 'react-icons/fi';

const toolCards = [
  {
    icon: <FiCamera size={16} />,
    title: 'Curation Tools & Workflow',
    subtitle: 'Master presets, editorial layout tools, and delivery speed.',
  },
  {
    icon: <FiUsers size={16} />,
    title: 'Client Access',
    subtitle: 'Manage password-protected galleries and private portals.',
  },
  {
    icon: <FiMail size={16} />,
    title: 'Billing & Licensing',
    subtitle: 'Streamline invoicing, usage rights, and print-on-demand.',
  },
  {
    icon: <FiCloud size={16} />,
    title: 'Storage & Archives',
    subtitle: 'Optimize RAW storage and preserve your archive integrity.',
  },
  {
    icon: <FiCode size={16} />,
    title: 'API & Integrations',
    subtitle: 'Connect Adobe, Pixieset, and CRM tools in one flow.',
  },
];

export default function SupportPage() {
  return (
    <section className="bg-[#fff8f8] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl rounded-[1.4rem] bg-[#fcf7f9] p-4 md:p-8">
        <div className="rounded-[1.3rem] bg-[#f7edf1] p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#920857]">Concierge & Support</p>
              <h1 className="mt-3 text-4xl leading-tight text-[#211a1b] md:text-6xl" style={{ fontFamily: 'Newsreader, serif' }}>
                How may we refine your <span className="italic">experience</span> today?
              </h1>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Search for tools, guides, or assistance..."
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm text-[#4b3f43] outline-none ring-1 ring-[#e3d0d9] focus:ring-2 focus:ring-[#920857]/35"
                />
                <button className="rounded-xl bg-gradient-to-r from-[#920857] to-[#b83f8f] px-7 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                  Search
                </button>
              </div>
            </div>

            <div className="mx-auto h-44 w-36 rotate-2 rounded-2xl bg-gradient-to-br from-[#2a1f25] via-[#f4ecf0] to-[#2a1f25] shadow-[0_24px_50px_rgba(33,26,27,0.24)] md:h-56 md:w-44" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolCards.map((card) => (
            <article key={card.title} className="rounded-2xl bg-white p-5 shadow-[0_12px_28px_rgba(33,26,27,0.08)]">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f4e7ee] text-[#920857]">
                {card.icon}
              </div>
              <h2 className="mt-4 text-xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5c4f53]">{card.subtitle}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-[0_14px_32px_rgba(33,26,27,0.08)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#7e6f74]">Direct Inquiry</p>
            <h3 className="mt-3 text-4xl text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>Send a Request</h3>
            <p className="mt-3 text-sm text-[#5d4f54]">Our concierge team responds within two business hours to premium members.</p>

            <div className="mt-6 space-y-3">
              <select className="w-full rounded-xl bg-[#faf3f6] px-4 py-3 text-sm text-[#4b3f43] outline-none ring-1 ring-[#ead8e2] focus:ring-2 focus:ring-[#920857]/35">
                <option>Technical Assistance</option>
                <option>Billing Help</option>
                <option>Client Portal Setup</option>
              </select>
              <textarea
                rows={5}
                placeholder="How may we assist you?"
                className="w-full rounded-xl bg-[#faf3f6] px-4 py-3 text-sm text-[#4b3f43] outline-none ring-1 ring-[#ead8e2] focus:ring-2 focus:ring-[#920857]/35"
              />
              <button className="w-full rounded-xl bg-gradient-to-r from-[#920857] to-[#c54895] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(146,8,87,0.25)]">
                Send Inquiry
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-[0_14px_32px_rgba(33,26,27,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#920857]">Real-time Assistance</p>
              <h3 className="mt-2 text-4xl italic text-[#211a1b]" style={{ fontFamily: 'Newsreader, serif' }}>The Concierge Desk</h3>
              <p className="mt-3 text-sm leading-7 text-[#5d4f54]">
                For immediate needs, our curators are available for live consultation and complex archive guidance.
              </p>
            </div>

            <button className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(33,26,27,0.07)]">
              <span className="flex items-center gap-3 text-[#211a1b]"><FiMessageCircle /> Live Chat</span>
              <span className="text-[#7f7075]">&gt;</span>
            </button>
            <button className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(33,26,27,0.07)]">
              <span className="flex items-center gap-3 text-[#211a1b]"><FiPhone /> Priority Phone</span>
              <span className="text-[#7f7075]">&gt;</span>
            </button>
            <button className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(33,26,27,0.07)]">
              <span className="flex items-center gap-3 text-[#211a1b]"><FiMail /> Schedule Consultation</span>
              <span className="text-[#7f7075]">&gt;</span>
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#151113] via-[#24121f] to-[#8e8a8d] p-8 text-white md:p-10">
          <div className="max-w-md">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#e8c5d8]">Masterclass</p>
            <h4 className="mt-3 text-5xl leading-tight" style={{ fontFamily: 'Newsreader, serif' }}>
              Optimizing your <span className="italic text-[#d46aa7]">Digital Atelier</span>
            </h4>
            <p className="mt-4 text-sm text-[#efe3e9]">Watch our curator explain advanced gallery delivery and luxury client workflow strategy.</p>
            <button className="mt-6 rounded-full bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#211a1b]">
              Watch the Guide
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
