'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import LiveContentFeed from './LiveContentFeed';

interface FormData {
  albumName: string;
  weddingDate: string;
  accessControl: 'public' | 'private';
}

export default function NewCollectionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    albumName: 'The Everly-Brooks Nuptials',
    weddingDate: '',
    accessControl: 'public',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccessControlChange = (type: 'public' | 'private') => {
    setFormData((prev) => ({ ...prev, accessControl: type }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) setFiles(Array.from(e.currentTarget.files));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-12 py-6 md:py-8 bg-[#fdf9f8]">
      {/* Header */}
      <section className="mb-12">
        <span className="label-sm tracking-widest uppercase text-[#b10e6b] font-semibold text-xs mb-2 block">
          Workflow Step 01
        </span>
        <h2 className="serif text-5xl md:text-6xl text-[#211a1b] leading-tight mb-4">
          Curating the <br />
          <span className="italic" style={{ color: '#d23284' }}>Next Masterpiece</span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-md">
          Every love story is unique. Begin by defining the atmosphere and accessibility of this digital archive.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN - ACCESS CONTROLS ON TOP */}
        <div className="lg:col-span-4 space-y-6">
          

          {/* Album Identity */}
          <div className="p-8 rounded-xl shadow-sm bg-white" style={{ borderLeft: '4px solid rgba(177, 14, 107, 0.2)' }}>
            <h3 className="label-sm tracking-widest uppercase text-[10px] text-zinc-400 mb-6 font-bold">
              ALBUM IDENTITY
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-[#54474d]">
                  ALBUM NAME
                </label>
                <input
                  type="text"
                  name="albumName"
                  value={formData.albumName}
                  onChange={handleInputChange}
                  className="w-full bg-[#fdf1f3] border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#b10e6b]/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-[#54474d]">
                  WEDDING DATE
                </label>
                <input
                  type="date"
                  name="weddingDate"
                  value={formData.weddingDate}
                  onChange={handleInputChange}
                  className="w-full bg-[#fdf1f3] border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#b10e6b]/40 text-sm"
                />
              </div>
            </div>
          </div>
          {/* Access Controls - First (as requested) */}
          <div className="p-8 rounded-xl shadow-sm bg-white">
            <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] mb-6 font-bold">
              ACCESS CONTROLS
            </h3>
            <div className="space-y-3">
              <label className="flex items-center p-4 bg-[#fdf1f3] rounded-xl cursor-pointer">
                <input type="radio" checked={formData.accessControl === 'public'} onChange={() => handleAccessControlChange('public')} className="accent-[#b10e6b]" />
                <div className="ml-4">
                  <p className="font-semibold">Public Gallery</p>
                  <p className="text-xs text-[#9a8a8e]">Discoverable via search and SEO</p>
                </div>
              </label>

              <label className="flex items-center p-4 bg-[#fdf1f3] rounded-xl cursor-pointer">
                <input type="radio" checked={formData.accessControl === 'private'} onChange={() => handleAccessControlChange('private')} className="accent-[#b10e6b]" />
                <div className="ml-4">
                  <p className="font-semibold">Private Link</p>
                  <p className="text-xs text-[#9a8a8e]">Accessible only via unique URL</p>
                </div>
              </label>
            </div>
          </div>
            {/* Active Monograph Cover Upload */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] font-bold">COVER UPLOAD </h3>
             </div>
            <label className="block aspect-[16/9] rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-[#b10e6b]/30 hover:border-[#b10e6b]">
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-[#fff8f7]">
                  <Upload size={48} className="text-[#b10e6b] mb-4" />
                  <p className="text-lg font-medium">Drop Cover Photo Here</p>
                  <p className="text-sm text-gray-500">Recommended 1920×1080px</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
         

          {/* Media Repository */}
          <div className="bg-white min-h-[52px] rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5">
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] font-bold">MEDIA REPOSITORY</h3>
                <p className="text-xs text-[#9a8a8e] mt-1">Accepting RAW, JPG, and 4K MOV</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#b10e6b] uppercase">STORAGE USED</p>
                <p className="text-xs">4.2 GB / 50 GB</p>
              </div>
            </div>

            <div
              className={`flex-1 p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'bg-[#fcf1f6]' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*,.raw" />

              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#f7ecef' }}>
                  <Upload size={48} style={{ color: '#b10e6b' }} />
                </div>
                <p className="serif text-3xl text-[#211a1b]">Drag your memories here</p>
                <p className="text-sm text-[#9a8a8e]">
                  or <span className="text-[#b10e6b] underline">browse files</span> from your workstation
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-8 w-96 p-4 rounded-lg bg-[#FEF5F6]">
                  <div className="flex justify-between mb-2">
                    <span className="truncate">{files[0]?.name}</span>
                    <span className="text-[#b10e6b] font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-[#b10e6b] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Content Feed */}
<LiveContentFeed files={files || []} />    </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex flex-wrap gap-4 justify-end">
        <button className="px-8 py-4 text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600">
          Discard Draft
        </button>
        <button className="px-8 py-4 text-sm font-bold uppercase tracking-wider bg-[#EADFE2] text-[#B10E6B] rounded-lg">
          Save Draft
        </button>
        <button 
          onClick={() => router.push('/photographer-admin/curate/template')}
          className="px-8 py-4 text-sm font-bold uppercase tracking-wider bg-[#b10e6b] text-white rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
}