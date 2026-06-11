'use client';

import React, { useState, useRef, useEffect, use } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function GuestUploadPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ previewUrl: string; type: 'photo' | 'video'; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [guestFolderId, setGuestFolderId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the guest folder ID to use when uploading
    const fetchGuestFolder = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/gallery/guest-folders/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const folder = data?.data;
          if (folder) {
            setGuestFolderId(folder.id || folder._id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch guest folder', err);
      }
    };
    if (userId) {
      fetchGuestFolder();
    }
  }, [userId]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length) {
      setSelectedFiles((prev) => [...prev, ...files]);
      setFilePreviews((prev) => [
        ...prev,
        ...files.map((file) => ({
          previewUrl: URL.createObjectURL(file),
          type: (file.type.startsWith('video') ? 'video' : 'photo') as 'photo' | 'video',
          name: file.name,
        })),
      ]);
      setError(null);
      setShowSuccess(false);
    }
  };

  const removePreview = (index: number) => {
    setSelectedFiles((current) => current.filter((_, i) => i !== index));
    setFilePreviews((current) => current.filter((_, i) => i !== index));
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadMedia = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const targetFolderId = guestFolderId || 'guest-folder';

      const items = await Promise.all(
        selectedFiles.map(async (file) => ({
          folderId: targetFolderId,
          title: file.name,
          mediaType: file.type.startsWith('video') ? 'video' : 'photo',
          dataUrl: await fileToDataUrl(file),
          fileType: file.type,
          fileName: file.name,
        }))
      );

      const response = await fetch(`${API_BASE}/api/gallery/guest-media/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Upload failed.');
      }

      setShowSuccess(true);
      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (uploadError) {
      console.warn('Upload failed:', uploadError);
      setError((uploadError as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F7] flex flex-col items-center py-12 px-4 md:px-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#f0d7db] overflow-hidden">
        <div className="bg-gradient-to-r from-[#890051] to-[#C82B7D] p-8 text-white text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight">Guest Contributions</h1>
          <p className="mt-2 opacity-90 text-sm md:text-base">Share your favorite moments with us</p>
        </div>

        <div className="p-8 md:p-12">
          {showSuccess && (
            <div className="mb-8 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-center flex flex-col items-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-medium">Thank you!</h3>
              <p className="text-sm mt-1">Your memories have been successfully added to our collection.</p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="mt-4 px-6 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-full text-sm font-semibold transition-colors"
              >
                Upload More
              </button>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {!showSuccess && (
            <>
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length) {
                    setSelectedFiles((prev) => [...prev, ...files]);
                    setFilePreviews((prev) => [
                      ...prev,
                      ...files.map((file) => ({
                        previewUrl: URL.createObjectURL(file),
                        type: (file.type.startsWith('video') ? 'video' : 'photo') as 'photo' | 'video',
                        name: file.name,
                      })),
                    ]);
                    setError(null);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-[#C82B7D] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center bg-[#fff1f4] hover:bg-[#ffeef2] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl text-[#C82B7D] shadow-sm">
                  📸
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#211a1b]">Tap to select photos/videos</h3>
                  <p className="text-sm text-[#7f5a67] mt-1">Or drag and drop them here</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelection} />
              </div>

              {filePreviews.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-[#211a1b]">{filePreviews.length} file(s) ready</h3>
                    <button onClick={() => { setSelectedFiles([]); setFilePreviews([]); }} className="text-sm text-[#7f1940] hover:underline">Clear all</button>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                    {filePreviews.map((preview, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden bg-[#f3e6eb] aspect-square group">
                        {preview.type === 'video' ? (
                          <video src={preview.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={preview.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removePreview(i); }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black">✕</button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={uploadMedia}
                    disabled={uploading}
                    className="mt-8 w-full rounded-full bg-gradient-to-r from-[#890051] to-[#C82B7D] py-4 text-lg font-semibold text-white hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {uploading ? '⏳ Uploading...' : '✨ Upload Memories'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
