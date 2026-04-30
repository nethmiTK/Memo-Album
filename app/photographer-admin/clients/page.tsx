'use client';

import { useRef } from 'react';
import { Plus, Calendar, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react';

interface Album {
  title: string;
  created: string;
  status: 'new' | 'finalized' | 'draft';
  image: string;
}

const mockAlbums: Album[] = [
  {
    title: 'Velvet Dusk',
    created: 'Oct 24, 2023',
    status: 'new',
    image: 'https://images.unsplash.com/photo-1527799825842-f8569885a523?w=400&q=80',
  },
  {
    title: 'Morning Mist',
    created: 'Oct 20, 2023',
    status: 'finalized',
    image: 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?w=400&q=80',
  },
  {
    title: 'Urban Solitude',
    created: 'Oct 18, 2023',
    status: 'draft',
    image: 'https://images.unsplash.com/photo-1504829857139-b8a283319a12?w=400&q=80',
  },
];

const StatCard = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <p className="text-[9px] uppercase tracking-widest font-semibold mb-2 text-gray-400">{title}</p>
    <p className="text-4xl font-bold" style={{ color: '#b10e6b', fontFamily: "'Newsreader', serif" }}>
      {value}
    </p>
  </div>
);

const getStatusBadge = (status: Album['status']) => {
  switch (status) {
    case 'new':
      return <span className="bg-red-100 text-red-700 text-[9px] font-bold uppercase px-2 py-1 rounded">NEW EDIT</span>;
    case 'finalized':
      return <span className="bg-green-100 text-green-700 text-[9px] font-bold uppercase px-2 py-1 rounded">FINALIZED</span>;
    case 'draft':
      return <span className="bg-gray-200 text-gray-600 text-[9px] font-bold uppercase px-2 py-1 rounded">DRAFT</span>;
  }
};

export default function CuratePage() {
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleInviteCollaborator = () => {
    emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => emailInputRef.current?.focus(), 250);
  };

  return (
    <div className="min-h-full bg-[#FFF8F7] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="max-w-xl">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-4 text-[#b10e6b]">
                ALBUM PERMISSION CONSOLE
              </p>
              <h1 className="text-5xl md:text-6xl leading-tight text-[#211a1b]" style={{ fontFamily: "'Newsreader', serif", fontWeight: 500 }}>
                The Ethereal Vows Collection
              </h1>
              <p className="mt-6 text-gray-500 leading-relaxed">
                Curate your collaborative experience. Invite clients, editors, and second shooters to view or contribute to this specific editorial archive.
              </p>
            </div>
            <button
              onClick={handleInviteCollaborator}
              className="mt-6 md:mt-0 flex items-center gap-2 bg-white text-[#b10e6b] font-semibold py-2 pl-2 pr-4 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#b10e6b] to-[#d23284] text-white">
                <Plus size={18} />
              </div>
              <span>Invite Collaborator</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: New Access Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold text-[#211a1b] mb-2">New Access</h2>
              <p className="text-sm text-gray-500 mb-6">Invite via email to grant instant access.</p>
              
              <form>
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="email">Email Address</label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="email"
                    placeholder="curator@example.com"
                    className="w-full mt-2 p-3 bg-[#F7F2F3] rounded-lg border border-transparent focus:ring-2 focus:ring-[#b10e6b] focus:border-[#b10e6b] transition text-sm"
                    style={{ color: '#211a1b' }}
                  />
                </div>
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="collection">Select Album</label>
                  <select
                    id="collection"
                    className="w-full mt-2 p-3 bg-[#F7F2F3] rounded-lg border border-transparent focus:ring-2 focus:ring-[#b10e6b] focus:border-[#b10e6b] transition text-sm appearance-none"
                    style={{ color: '#211a1b' }}
                  >
                    <option>The Ethereal Vows Collection</option>
                    <option>Another Collection</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-gradient-to-br from-[#b10e6b] to-[#d23284] text-white font-bold py-3 rounded-lg hover:shadow-xl transition-shadow">
                  Send Invitation
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
                Collaborators will receive an editorial-themed email invite with a secure access link.
              </p>
            </div>
          </div>

          {/* Right Column: Newly Created Albums */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#211a1b]">Newly Created Albums</h2>
              <button className="flex items-center gap-2 text-xs font-bold text-[#b10e6b] uppercase tracking-wider">
                <Calendar size={14} />
                <span>All Recent</span>
              </button>
            </div>

            <div className="space-y-4">
              {mockAlbums.map((album) => (
                <div key={album.title} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <img src={album.image} alt={album.title} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-[#211a1b]">{album.title}</h3>
                    <p className="text-xs text-gray-400">Created {album.created}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    {getStatusBadge(album.status)}
                    <button className="text-gray-400 hover:text-[#b10e6b] mt-4">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end items-center mt-6">
                <p className="text-xs text-gray-400 mr-4">Viewing latest editorial drafts</p>
                <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-50">
                        <ChevronLeft size={18} />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-50">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
          </div>
        </main>

        {/* Stats Footer */}
        <footer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 pt-8">
          <StatCard title="Total Invites" value="24" />
          <StatCard title="Active Now" value="02" />
          <StatCard title="Pending Links" value="05" />
          <StatCard title="Storage Usage" value="62%" />
        </footer>
      </div>
    </div>
  );
}
