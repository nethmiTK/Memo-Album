'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Lock,
  Globe,
  
  Link as LinkIcon,
} from 'lucide-react';

interface FormData {
  albumName: string;
  weddingDate: string;
  accessControl: 'public' | 'private' | 'password';
}

export default function NewCollectionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    albumName: '',
    weddingDate: '',
    accessControl: 'public',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (files.length > 0) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [files]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccessControlChange = (type: 'public' | 'private' | 'password') => {
    setFormData((prev) => ({
      ...prev,
      accessControl: type,
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files) {
      setFiles(Array.from(files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      setFiles(Array.from(files));
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-12 py-6 md:py-8">
      {/* Editorial Header Section */}
      <section className="mb-12">
        <span className="label-sm tracking-widest uppercase text-[#b10e6b] font-semibold text-xs mb-2 block">
          Workflow Step 01
        </span>
        <h2 className="serif text-5xl md:text-6xl text-[#211a1b] leading-tight mb-4">
          Curating the <br />
          <span className="italic" style={{ color: '#d23284' }}>
            Next Masterpiece
          </span>
        </h2>
        <p className="text-on-surface-variant mt-4 max-w-md font-light leading-relaxed text-gray-600">
          Every love story is unique. Begin by defining the atmosphere and accessibility of this digital archive.
        </p>
      </section>

      {/* Multi-Step Form Layout (Bento Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Album Identity Section */}
          <div className="p-8 rounded-xl shadow-sm" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid rgba(177, 14, 107, 0.2)' }}>
            <h3 className="label-sm tracking-widest uppercase text-[10px] text-zinc-400 mb-6 font-bold">
              Album Identity
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#54474d' }}>
                  Album Name
                </label>
                <input
                  type="text"
                  name="albumName"
                  value={formData.albumName}
                  onChange={handleInputChange}
                  placeholder="The Everly-Brooks Nuptials"
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#b10e6b]/40 placeholder:text-[#c8bcc1] transition-all text-sm"
                  style={{ backgroundColor: '#fdf1f3', color: '#211a1b' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#54474d' }}>
                  Wedding Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="weddingDate"
                    value={formData.weddingDate}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#b10e6b]/40 text-sm"
                    style={{ backgroundColor: '#fdf1f3', color: '#211a1b' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Access Controls Section */}
          <div className="p-8 rounded-xl shadow-sm min-h-[352px]" style={{ backgroundColor: '#ffffff' }}>
            <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] mb-6 font-bold">
              Access Controls
            </h3>
            <div className="space-y-3">
              {/* Public Gallery */}
              <label className="flex items-center p-4 min-h-[104px] bg-surface-container-low rounded-xl cursor-pointer group transition-colors hover:bg-surface-container" style={{ backgroundColor: '#fdf1f3' }}>
                <input
                  type="radio"
                  name="accessControl"
                  value="public"
                  checked={formData.accessControl === 'public'}
                  onChange={() => handleAccessControlChange('public')}
                  className="h-4 w-4"
                  style={{ accentColor: '#b10e6b' }}
                />
                <div className="ml-4">
                  <p className="text-sm font-semibold text-[#211a1b]">Public Gallery</p>
                  <p className="text-[11px] text-[#9a8a8e]">Discoverable via search and SEO</p>
                </div>
              </label>

              {/* Private Link */}
              <label className="flex items-center p-4 min-h-[104px] bg-surface-container-low rounded-xl cursor-pointer group transition-colors hover:bg-surface-container" style={{ backgroundColor: '#fdf1f3' }}>
                <input
                  type="radio"
                  name="accessControl"
                  value="private"
                  checked={formData.accessControl === 'private'}
                  onChange={() => handleAccessControlChange('private')}
                  className="h-4 w-4"
                  style={{ accentColor: '#b10e6b' }}
                />
                <div className="ml-4">
                  <p className="text-sm font-semibold text-[#211a1b]">Private Link</p>
                  <p className="text-[11px] text-[#9a8a8e]">Accessible only via unique URL</p>
                </div>
              </label>

              {/* Password Protected */}
              <label className="flex items-center p-4 min-h-[104px] bg-surface-container-low rounded-xl cursor-pointer group transition-colors hover:bg-surface-container" style={{ backgroundColor: '#fdf1f3' }}>
                <input
                  type="radio"
                  name="accessControl"
                  value="password"
                  checked={formData.accessControl === 'password'}
                  onChange={() => handleAccessControlChange('password')}
                  className="h-4 w-4"
                  style={{ accentColor: '#b10e6b' }}
                />
                <div className="ml-4">
                  <p className="text-sm font-semibold text-[#211a1b]">Password Protected</p>
                  <p className="text-[11px] text-[#9a8a8e]">Secure PIN required for viewing</p>
                </div>
              </label>

            </div>
          </div>
        </div>

        {/* Right Column: Media Upload */}
        <div className="lg:col-span-8 h-full">
          <div className="bg-surface-container-lowest h-full min-h-[600px] rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5" style={{ backgroundColor: '#ffffff' }}>
            {/* Header */}
            <div className="p-8 border-b border-surface-container-high flex justify-between items-center">
              <div>
                <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] font-bold">
                  Media Repository
                </h3>
                <p className="text-xs text-[#9a8a8e] mt-1">Accepting RAW, JPG, and 4K MOV</p>
              </div>
              <div className="flex gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#b10e6b] uppercase">Storage Used</p>
                  <p className="text-xs text-on-surface">4.2 GB / 50 GB</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-[#b10e6b]/10 flex items-center justify-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-[#b10e6b] border-t-transparent animate-spin"
                    style={{ borderTopColor: 'transparent' }}
                  />
                </div>
              </div>
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`flex-1 p-12 flex flex-col items-center justify-center group relative overflow-hidden cursor-pointer transition-colors ${
                isDragging ? 'bg-[#fcf1f6]' : ''
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#b10e6b 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10 text-center space-y-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-500"
                  style={{ backgroundColor: '#f7ecef' }}
                >
                  <Upload size={32} style={{ color: '#b10e6b' }} />
                </div>
                <div>
                  <p className="serif text-2xl text-[#211a1b]">Drag your memories here</p>
                  <p className="text-sm text-[#9a8a8e] mt-2">
                    or{' '}
                    <span className="text-[#b10e6b] font-medium underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      browse files
                    </span>
                    {' '}from your workstation
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <div className="flex flex-col items-center gap-1 opacity-50">
                    <span className="material-symbols-outlined text-xl" style={{ color: '#9a8a8e' }}>image</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#9a8a8e]">Photos</span>
                  </div>
                  <div className="w-px h-8" style={{ backgroundColor: '#d4c4c7' }} />
                  <div className="flex flex-col items-center gap-1 opacity-50">
                    <span className="material-symbols-outlined text-xl" style={{ color: '#9a8a8e' }}>movie</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#9a8a8e]">Videos</span>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleChange}
                className="hidden"
                accept="image/*,video/*,.raw"
              />

              {/* File Upload Progress */}
              {files.length > 0 && (
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF5F6' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[80%]">{files[0].name}</span>
                    <span className="text-[10px] font-bold text-[#b10e6b]">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-linear"
                      style={{ width: `${uploadProgress}%`, backgroundColor: '#b10e6b' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="px-8 lg:px-10 py-6 flex justify-between items-center" style={{ backgroundColor: '#FEF0F1' }}>
              <button className="text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors">
                Discard Draft
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/photographer-admin/curate/template')}
                  className="px-6 py-3 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-all hover:opacity-90"
                  style={{ backgroundColor: '#EADFE2', color: '#B10E6B' }}
                >
                  Open Template
                </button>
                <button
                  className="text-white px-8 py-3 rounded-lg text-[13px] font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #b10e6b 0%, #d23284 100%)',
                    boxShadow: '0 4px 20px rgba(177, 14, 107, 0.35)',
                  }}
                >
                  Create Album
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Benchmarks Section */}
      <section className="mt-24 mb-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12">
          <div>
            <h3 className="serif text-4xl md:text-5xl text-[#211a1b] leading-tight">
              Visual <br />
              <span className="italic" style={{ color: '#d23284' }}>
                Benchmarks
              </span>
            </h3>
          </div>
          <p className="text-zinc-400 text-sm max-w-xs mt-4 md:mt-0 leading-relaxed">
            Draw inspiration from our featured curators to set the tone for your new collection.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Minimalism Card */}
          <div className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer">
            <img
              alt="Minimalist wedding details"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=400&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#b10e6b]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-[10px] uppercase tracking-widest font-bold">Minimalism</span>
            </div>
          </div>

          {/* Grandeur Card */}
          <div className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer translate-y-8">
            <img
              alt="Grand wedding reception"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=300&h=400&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#b10e6b]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-[10px] uppercase tracking-widest font-bold">Grandeur</span>
            </div>
          </div>

          {/* Romantic Card */}
          <div className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer">
            <img
              alt="Romantic bridal portrait"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=400&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#b10e6b]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-[10px] uppercase tracking-widest font-bold">Romantic</span>
            </div>
          </div>

          {/* Classic Card */}
          <div className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer translate-y-8">
            <img
              alt="Classic black and white wedding"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=400&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#b10e6b]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-[10px] uppercase tracking-widest font-bold">Classic</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 