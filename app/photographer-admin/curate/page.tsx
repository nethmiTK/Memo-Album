'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import LiveContentFeed from './LiveContentFeed';
import { apiFetch, handleAuthError } from '@/lib/api';

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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const mergeFiles = (incomingFiles: File[]) => {
    setFiles((previousFiles) => {
      const existingKeys = new Set(previousFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const mergedFiles = [...previousFiles];

      incomingFiles.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          mergedFiles.push(file);
        }
      });

      return mergedFiles;
    });
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });

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
    if (e.dataTransfer.files) mergeFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) mergeFiles(Array.from(e.currentTarget.files));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveCurateDraft = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const mediaItems = await Promise.all(
        files.map(async (file, index) => ({
          id: `media-${index + 1}`,
          order: index + 1,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          mediaKind: file.type.startsWith('video') ? 'video' : 'image',
          dataUrl: file.type.startsWith('image') ? await fileToDataUrl(file) : '',
        }))
      );

      const payload = {
        albumName: formData.albumName,
        weddingDate: formData.weddingDate,
        accessControl: formData.accessControl,
        coverPhoto: coverPreview || '',
        coverPhotoName: coverFile?.name || '',
        mediaItems,
        progress: uploadProgress,
      };

      const response = await apiFetch('/curate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return false;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save curate draft');
      }

      setSaveMessage('Draft saved');
      return true;
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save draft');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveCurateDraft();
    if (saved) {
      router.push('/photographer-admin/curate/template');
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
            <label className="block aspect-video rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-[#b10e6b]/30 hover:border-[#b10e6b]">
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-[#fff8f7] px-6 text-center">
                  <Upload size={64} className="text-[#b10e6b] mb-3" />
                  <p className="text-sm md:text-base font-medium text-[#211a1b]">Drop cover photo here</p>
                  <p className="mt-1 text-xs md:text-sm text-gray-500">Recommended 1920×1080px</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
         

          {/* Media Repository */}
          <div className="bg-white min-h-13 rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5">
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
                  <Upload size={56} style={{ color: '#b10e6b' }} />
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
          <LiveContentFeed files={files || []} />
          {saveMessage ? <p className="text-sm text-[#b10e6b] px-1">{saveMessage}</p> : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex flex-wrap gap-4 justify-end">
        <button className="px-8 py-4 text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600">
          Discard Draft
        </button>
        <button
          onClick={saveCurateDraft}
          disabled={isSaving}
          className="px-8 py-4 text-sm font-bold uppercase tracking-wider bg-[#EADFE2] text-[#B10E6B] rounded-lg disabled:opacity-60"
        >
          Save Draft
        </button>
        <button 
          onClick={handleNext}
          disabled={isSaving}
          className="px-8 py-4 text-sm font-bold uppercase tracking-wider bg-[#b10e6b] text-white rounded-lg disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}