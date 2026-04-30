'use client';

import { Edit, Share2, MoreHorizontal, Image as ImageIcon, Link as LinkIcon, Minimize2, ArchiveRestore, Trash2 } from 'lucide-react';

export default function GalleryPage() {
  const mainAlbum = {
    id: 1,
    title: 'The Sterling & Vane Gala',
    category: 'WEDDING NARRATIVE',
    date: 'OCT 17, 2023',
    status: 'SHARED',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=600&fit=crop',
  };

  const sideAlbums = [
    {
      id: 2,
      title: 'Flora & Stone Editorial',
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
      date: 'Sept 28',
      sharedWith: 2,
    },
    {
      id: 3,
      title: 'Portrait Studies 04',
      status: 'DRAFT',
      image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=500&h=500&fit=crop',
      date: 'Just Now',
      photoCount: 64,
    }
  ];

  const pastCollections = [
    {
      id: 1,
      title: 'Modernist Echoes',
      date: 'AUG 15, 2023',
      status: 'ARCHIVED',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
      action: 'VIEW HISTORY'
    },
    {
      id: 2,
      title: "Amalfi Summer '23",
      date: 'JULY 02, 2023',
      status: 'SHARED',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&h=500&fit=crop',
      action: 'REVIEW STATS'
    }
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'SHARED':
        return { backgroundColor: '#FDE5E8', color: '#b10e6b' };
      case 'ACTIVE':
        return { backgroundColor: '#E8F0F8', color: '#0D47A1' };
      case 'DRAFT':
        return { backgroundColor: '#F0F0F0', color: '#6B7387' };
      case 'ARCHIVED':
        return { backgroundColor: '#E8EEF5', color: '#0D47A1' };
      default:
        return { backgroundColor: '#F0F0F0', color: '#6B7387' };
    }
  };

  return (
    <div style={{ backgroundColor: '#FFF8F7' }}>
      {/* Portfolio Overview Section */}
      <div className="px-6 md:px-12 py-12" style={{ backgroundColor: '#FFF8F7' }}>
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#B10E6B] font-bold block mb-2">Portfolio Overview</span>
              <h1 className="text-3xl md:text-5xl font-serif text-black leading-tight">Curated Memories</h1>
              <p className="mt-4 leading-relaxed max-w-md" style={{ color: '#4F4539' }}>Every album is a narrative. Review, refine, and distribute your visual stories with editorial precision.</p>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col min-w-[140px]">
                <span className="text-3xl font-serif" style={{ color: '#B10E6B' }}>24</span>
                <span className="text-[10px] tracking-widest uppercase text-[#4F4539] mt-2">Active Albums</span>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col min-w-[140px]">
                <span className="text-3xl font-serif" style={{ color: '#605D7E' }}>52</span>
                <span className="text-[10px] tracking-widest uppercase text-[#4F4539] mt-2">Shared Links</span>
              </div>
            </div>
          </div>

          {/* Albums Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Large Featured Album */}
            <article className="lg:col-span-8 group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-[16/9] overflow-hidden relative">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBou40m12GtCVThrKlUSdz2eXodZ_EGTsxLXXAKASC_BaHXUI0kywlzpmulx8rbr7asYZQieiAU_yG4rxs-a1ZMGvCyrZVGGNQXioaFYCc_-9rv0CgeH0WNjCs7k5gpM3UhniMWv75KLJuMO6jLsPc1RsdQ63UVnzJmNiNmoHpl5PMldX0MrHuZxYLiHH4uSeFHttKHgLNi5pPlN-cO9bTcw3KlS0E1LCJ6W4dGns_iU1vQEbUPJKXrgY_fghM5e8cjbGodsfdGPn8"
                  alt="exquisite wedding reception setup"
                />
                <div className="absolute top-6 left-6 flex space-x-2">
                  <span className="bg-[#E8DEF8] text-[#1F1A24] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Shared</span>
                </div>
              </div>
              <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#4F4539]">Wedding Narrative • Oct 12, 2023</p>
                  <h4 className="text-3xl font-serif text-black mt-2">The Sterling &amp; Vane Gala</h4>
                </div>
                <div className="flex items-center gap-3 self-end md:self-center">
                  <button className="w-14 h-14 rounded-full bg-[#F3E7EB] text-[#B10E6B] flex items-center justify-center hover:bg-[#edd6df] transition-colors" title="Edit">
                    <Edit size={20} />
                  </button>
                  <button className="w-14 h-14 rounded-full bg-[#F3E7EB] text-[#B10E6B] flex items-center justify-center hover:bg-[#edd6df] transition-colors" title="Share">
                    <Share2 size={20} />
                  </button>
                  <button className="w-14 h-14 rounded-full bg-[#F3E7EB] text-[#B10E6B] flex items-center justify-center hover:bg-[#edd6df] transition-colors" title="Archive">
                    <ArchiveRestore size={20} />
                  </button>
                </div>
              </div>
            </article>

            {/* Sidebar List / Side-cards */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <article className="bg-white rounded-xl shadow-sm overflow-hidden group">
                <div className="h-40 overflow-hidden relative">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGt4KC1C_7l_zVfGcUPG9aeiNjkbXYDZKLjwJYshmj-Gb04pUJk0xT5eEUHKgw-A2_G-5yc-AEMUcxZmonEv1DNjnnLWGGOTVejvSirEjz8qOjO15jD--c8DE3UurwEuEQgJ7TH2m5ZFLM18JzgdUIyQI31F_qXJwwiFv3T8L7cXaOWs0i6nfM8n5qKYLUOwJS_5K-U3mevsUVQrUdrd2vdd8oaWZcUg30gWQxlU8MZMcm_UDX0OguOBj7PYg8QtHtYNtHc20DqDQ"
                    alt="bride and groom in a botanical garden"
                  />
                  {/* Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#B10E6B] border border-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-all">
                      <Edit size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#B10E6B] border border-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-all">
                      <Share2 size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#B10E6B] border border-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-all">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#F6F3F0] text-[#B10E6B] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter">Active</span>
                    <span className="text-[10px] text-[#4F4539] font-medium">Sept 28</span>
                  </div>
                  <h4 className="text-xl mt-3 text-black" style={{ fontFamily: "'Newsreader', serif" }}>Flora &amp; Stone Editorial</h4>
                </div>
              </article>
              <article className="bg-white rounded-xl shadow-sm overflow-hidden group border-l-4 border-[#B10E6B]">
                <div className="h-40 overflow-hidden relative">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCovkD0ouqQZQ-HE4rlEV4Q3YsDgCZXcsqF18_6E31M7xNSB7vhzxC5Xh6ziZJECEJyVbypNSuUcoO5c6N0HdfLH0O7i81pKMEGnqqSfGILBMOkNSk6jZJpC-QBFnQoXfmlKsx_mr3bTLfBw7VVqLhrwDBnJEAS8WIvv5GAjp0lVym41Lov7-hZme6YfFpkeNsgr6Tbx6EmsgoyQjCuVyxwjJGAzvnIRIDkCLK4TubACBWVKjCLyjQX-ECiakkXr_I_vPX47TpBlHU"
                    alt="high-fashion portrait"
                  />
                  {/* Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#B10E6B] border border-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-all">
                      <Edit size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#B10E6B] border border-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-all">
                      <Share2 size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#B10E6B] border border-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-all">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#B10E6B] text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter">Newest</span>
                    <span className="text-[10px] text-[#4F4539] font-medium">Just Now</span>
                  </div>
                  <h4 className="text-xl mt-3 text-black" style={{ fontFamily: "'Newsreader', serif" }}>Portrait Studies 04</h4>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex items-center text-xs text-[#4F4539]">
                      <ImageIcon size={12} className="mr-1" /> 84 Photos
                    </div>
                    <a href="#" className="text-[#B10E6B] text-[10px] font-bold uppercase tracking-widest hover:underline">Manage</a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      {/* Past Collections Section */}
      <div className="px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="border-b border-[#EAE3D9] pb-4 mb-8">
            <h5 className="text-3xl font-serif text-black">Past Collections</h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Album Item 3 */}
            <article className="bg-white rounded-xl shadow-sm overflow-hidden group cursor-pointer">
              <div className="aspect-square rounded-lg overflow-hidden mb-6 bg-[#F6F3F0] relative">
                <img
                  className="w-full h-full object-cover grayscale"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDZngdz3HQ1La-J-oQJYINl3fy7jQ7cx4bGfADrtskIQP3XBoi_SrZVhyS-Oj3KbQJA55-CDpyIXiB6PSbfCx6ihmaAq5OnCE5n2870NCSN5z1Hb0afSi_83nSPZJ-LhQScDDf4XUX3jhCxZ21mcB8bgIfIrdmnGpuS8IF5wQqyNycR422bLswjrWY0hcPguV95wIMSYhInuSwonosLj1YQjzqhQ_IafvI_ItjrLMvO2IiNieNw6Y8bluAY94MrvAI76BRGzUZxNE"
                  alt="architectural interior photography"
                />
              </div>
              <div className="px-6 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4F4539]/60">Aug 15, 2023</span>
                  <span className="bg-[#EADDFF] text-[#201B24] px-2 py-0.5 rounded text-[9px] font-bold uppercase">Archived</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-2xl font-serif text-black">Modernist Echoes</h4>
                </div>
                <div className="mt-8 pt-6 border-t border-[#EFE7E4] flex items-center justify-between">
                  <div className="flex items-center gap-5 text-[#6A5D62]">
                    <button className="hover:text-[#B10E6B] transition-colors" title="Archive" aria-label="Archive collection">
                      <ArchiveRestore size={15} />
                    </button>
                    <button className="hover:text-[#B10E6B] transition-colors" title="Delete" aria-label="Delete collection">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <a href="#" className="text-[#B10E6B] text-[10px] font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity">
                    VIEW HISTORY
                  </a>
                </div>
              </div>
            </article>
            {/* Album Item 4 */}
            <article className="bg-white rounded-xl shadow-sm overflow-hidden group cursor-pointer">
              <div className="aspect-square rounded-lg overflow-hidden mb-6 bg-[#F6F3F0] relative">
                <img
                  className="w-full h-full object-cover grayscale"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWPFCCyEgQHf-bv0WFFkG8r2n-YtYraqy3LJ4V2JymQOTGZUGcHe2peLZEYLjyvlWC_J2KmFPxKKE62Yf8lHn7QA63DELgfpalaT-93hg7CjDW_GWH5LzpdyBLVN2bjb1X73wOOzIbT6vOc9C0csxYEMlujfEDms_3czYZykvkJMg7BFBKafjCvCX9XN5D_o1lpK0jcPhvQwGmaau4N9-sJcWhfbov5TcsAj54jYj4Rq-4X13ULm2ScotNM1WZoyeHB6HfWO0iT6Q"
                  alt="street fashion photograph"
                />
              </div>
              <div className="px-6 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#4F4539]/60">July 02, 2023</span>
                  <span className="bg-[#E8DEF8] text-[#1F1A24] px-2 py-0.5 rounded text-[9px] font-bold uppercase">Shared</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-2xl font-serif text-black">Amalfi Summer '23</h4>
                </div>
                <div className="mt-8 pt-6 border-t border-[#EFE7E4] flex items-center justify-between">
                  <div className="flex items-center gap-5 text-[#6A5D62]">
                    <button className="hover:text-[#B10E6B] transition-colors" title="Edit" aria-label="Edit collection">
                      <Edit size={15} />
                    </button>
                    <button className="hover:text-[#B10E6B] transition-colors" title="Share" aria-label="Share collection">
                      <Share2 size={15} />
                    </button>
                  </div>
                  <a href="#" className="text-[#B10E6B] text-[10px] font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity">
                    REVIEW STATS
                  </a>
                </div>
              </div>
            </article>
            {/* Empty State / New Album Card */}
            <button className="border-2 border-dashed border-[#CFC4B8] bg-transparent p-6 rounded-xl flex flex-col items-center justify-center text-[#4F4539]/40 hover:border-[#B10E6B] hover:text-[#B10E6B] transition-all group">
              <div className="w-16 h-16 rounded-full border border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">+</span>
              </div>
              <span className="text-sm tracking-widest uppercase font-medium">Create New Archive</span>
              <span className="text-[10px] mt-2 opacity-60">Drag images or select folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
