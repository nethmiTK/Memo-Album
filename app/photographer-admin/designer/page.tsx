'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, getUser, handleAuthError } from '@/lib/api';
import { Upload, Eye, Trash2, PenLine } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { TemplateBookFlip } from '@/app/Components/photographer-admin/template-book-flip';

interface Template {
  _id: string;
  name: string;
  description?: string;
  accent?: string;
  coverImage?: string;
  coverUrl?: string;
  pages?: Array<{
    pageNumber: number;
    pageLabel?: string;
    slots: Array<{
      id: string;
      label: string;
      kind: string;
    }>;
  }>;
  slots?: Array<{
    id: string;
    label: string;
    kind: string;
  }>;
}

interface Album {
  _id: string;
  albumName: string;
  mediaItems?: MediaItem[];
  status?: string;
}

/** Subsequence + substring fuzzy match (no extra deps). */
const fuzzyMatch = (query: string, ...targets: (string | undefined)[]): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return targets.some((raw) => {
    const target = (raw || '').toLowerCase();
    if (!target) return false;
    if (target.includes(q)) return true;

    let qi = 0;
    for (let i = 0; i < target.length && qi < q.length; i += 1) {
      if (target[i] === q[qi]) qi += 1;
    }
    return qi === q.length;
  });
};

const parseApiJson = async (response: Response) => {
  const rawText = await response.text();
  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    const htmlResponse = rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html');
    throw new Error(
      htmlResponse
        ? 'Server returned HTML instead of JSON. Check API URL/backend server and login session.'
        : 'Invalid API response format.'
    );
  }
};

interface MediaItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaKind: string;
  dataUrl?: string;
  order?: number;
}

const CreateAlbum: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<Template | null>(null);
  const [albumSearch, setAlbumSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [albumSuggestions, setAlbumSuggestions] = useState<Album[]>([]);
  const [templateSuggestions, setTemplateSuggestions] = useState<Template[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bookAlbumId, setBookAlbumId] = useState<string | null>(null);
  const [isSyncingBook, setIsSyncingBook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loggedInPhotographer = getUser();
  const photographerLabel =
    loggedInPhotographer?.name || loggedInPhotographer?.email || 'Photographer';

  const toastStyle = {
    style: {
      background: '#FDF3F2',
      color: '#000',
    },
  } as const;

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await apiFetch('/curate');
        if (response.status === 401) {
          handleAuthError(response);
          return;
        }
        const result = await parseApiJson(response);
        if (!response.ok) {
          throw new Error(result.message || 'Failed to load curates');
        }
        if (result.success && Array.isArray(result.curates)) {
          setAlbums(result.curates);
        }
      } catch (error) {
        console.error('Failed to fetch albums:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load albums', toastStyle);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await apiFetch('/curate/templates');
        if (response.status === 401) {
          handleAuthError(response);
          return;
        }
        const result = await parseApiJson(response);
        if (!response.ok) {
          throw new Error(result.message || 'Failed to load templates');
        }
        if (result.success && Array.isArray(result.templates)) {
          setTemplates(result.templates);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load templates', toastStyle);
      }
    };

    fetchAlbums();
    fetchTemplates();
  }, []);

  const handleAlbumSearch = (value: string) => {
    setAlbumSearch(value);
    setSelectedAlbum('');
    if (value.trim()) {
      const filtered = albums.filter((album) =>
        fuzzyMatch(value, album.albumName, album.status, photographerLabel)
      );
      setAlbumSuggestions(filtered);
    } else {
      setAlbumSuggestions([]);
    }
  };

  const handleTemplateSearch = (value: string) => {
    setTemplateSearch(value);
    setSelectedTemplate('');
    setSelectedTemplateData(null);
    if (value.trim()) {
      const filtered = templates.filter((template) =>
        fuzzyMatch(
          value,
          template.name,
          template.description,
          template.accent,
          template._id,
          ...(template.pages || []).flatMap((page) => [
            page.pageLabel,
            ...(page.slots || []).map((slot) => slot.label),
          ])
        )
      );
      setTemplateSuggestions(filtered);
    } else {
      setTemplateSuggestions([]);
    }
  };

  const applyCurateMedia = (album: Album): MediaItem[] => {
    if (!Array.isArray(album.mediaItems) || album.mediaItems.length === 0) {
      setMediaItems([]);
      return [];
    }

    const normalizedMedia = album.mediaItems.map((item, index) => ({
      id: item.id || `media-${index + 1}`,
      fileName: item.fileName || '',
      fileType: item.fileType || '',
      fileSize: item.fileSize || 0,
      mediaKind: item.mediaKind || 'image',
      dataUrl: item.dataUrl || '',
      order: item.order ?? index + 1,
    }));

    setMediaItems(normalizedMedia);
    toast.success('Media loaded from curate', toastStyle);
    return normalizedMedia;
  };

  const syncBookAlbum = async (curateId: string, templateId: string) => {
    if (!curateId || !templateId || mediaItems.length === 0) return;

    setIsSyncingBook(true);
    try {
      const response = await apiFetch('/book-albums', {
        method: 'POST',
        body: JSON.stringify({ curateId, templateId }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await parseApiJson(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save book album');
      }

      const id = result.bookAlbum?._id;
      if (id) {
        setBookAlbumId(id);
        sessionStorage.setItem('bookAlbumId', id);
      }
    } catch (error) {
      console.error('Book album sync error:', error);
    } finally {
      setIsSyncingBook(false);
    }
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album._id);
    setAlbumSearch(album.albumName);
    setAlbumSuggestions([]);
    const loaded = applyCurateMedia(album);
    if (selectedTemplate && loaded.length > 0) {
      void syncBookAlbum(album._id, selectedTemplate);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template._id);
    setTemplateSearch(template.name);
    setTemplateSuggestions([]);
    setSelectedTemplateData(template);
    if (selectedAlbum && mediaItems.length > 0) {
      void syncBookAlbum(selectedAlbum, template._id);
    }
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
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newMedia: MediaItem = {
          id: `media-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          mediaKind: file.type.startsWith('video') ? 'video' : 'image',
          dataUrl: e.target?.result as string,
          order: mediaItems.length + 1,
        };
        setMediaItems((prev) => [...prev, newMedia]);
      };
      reader.readAsDataURL(file);
    }
    toast.success('Images added', toastStyle);
  };

  const removeMedia = (mediaId: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== mediaId));
    toast.success('Image removed', toastStyle);
  };

  const handleDiscard = () => {
    setSelectedAlbum('');
    setSelectedTemplate('');
    setSelectedTemplateData(null);
    setAlbumSearch('');
    setTemplateSearch('');
    setMediaItems([]);
    setBookAlbumId(null);
    sessionStorage.removeItem('bookAlbumId');
  };

  const saveCurateDraft = async () => {
    if (!selectedAlbum || !selectedTemplate || mediaItems.length === 0) {
      toast.error('Please select album, template and add media', toastStyle);
      return;
    }

    setIsSaving(true);
    try {
      // Create BookAlbum record
      const response = await apiFetch('/book-albums', {
        method: 'POST',
        body: JSON.stringify({
          curateId: selectedAlbum,
          templateId: selectedTemplate,
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        setIsSaving(false);
        return;
      }

      const result = await parseApiJson(response);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save');
      }

      if (result.success) {
        toast.success('Album book saved with your curate images!', toastStyle);
        const id = result.bookAlbum?._id;
        if (id) {
          setBookAlbumId(id);
          sessionStorage.setItem('bookAlbumId', id);
        }
      } else {
        throw new Error(result.message || 'Failed to save');
      }

      setIsSaving(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save', toastStyle);
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    const bookAlbumId = sessionStorage.getItem('bookAlbumId');
    if (bookAlbumId) {
      // Navigate to book editing page
      window.location.href = `/photographer-admin/designer/edit/${bookAlbumId}`;
    } else {
      toast.error('Please save draft first', toastStyle);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFF8F8', fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div className="px-4 md:px-12 py-6 md:py-8">
        <span className="label-sm tracking-widest uppercase text-[#b10e6b] font-semibold text-xs mb-2 block">
          Workflow Step 02
        </span>
        <h2 className="text-[60px] text-[#211A1B] mb-4" style={{ lineHeight: '75px', fontWeight: 400, letterSpacing: 'normal', fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
          Designing the <br />
          <span style={{ color: '#BE126F' }}>Perfect Template</span>
        </h2>
        <p className="text-[#211A1B] mt-4 max-w-md" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
          Select an album and template, then upload media to fill your design.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-9 py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
           <div className="space-y-1 overflow-y-auto">
  
<div
  className="w-full max-w-xs p-5 rounded-xl shadow-sm bg-white space-y-5"
  style={{ borderLeft: '4px solid #b10e6b' }}
>

   <h3 className="text-[10px] tracking-widest uppercase text-[#b10e6b] font-bold">
    SELECTION PANEL
  </h3>

  {/* ALBUM SELECT */}
  <div>
    <label className="block text-[11px] font-bold uppercase mb-2 text-[#54474d]">
      SELECT ALBUM
    </label>

    <div className="relative">
      <input
        type="text"
        placeholder="Search curate album..."
        value={albumSearch}
        onChange={(e) => handleAlbumSearch(e.target.value)}
        onFocus={() => {
          if (albumSearch.trim()) handleAlbumSearch(albumSearch);
          else setAlbumSuggestions(albums);
        }}
        className="w-full bg-[#fff0f4] border border-[#f3d6df] rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#b10e6b]/40"
      />

      {albumSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#f3d6df] rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
          {albumSuggestions.map((album) => (
            <button
              key={album._id}
              type="button"
              onClick={() => handleSelectAlbum(album)}
              className="w-full text-left px-4 py-3 hover:bg-[#fff0f4] text-sm border-b border-[#f3d6df]/40 last:border-0"
            >
              <p className="font-semibold text-[#211A1B]">{album.albumName}</p>
              <p className="text-[10px] text-[#54474d] mt-0.5">
                {photographerLabel}
                {Array.isArray(album.mediaItems) && album.mediaItems.length > 0
                  ? ` · ${album.mediaItems.length} image${album.mediaItems.length !== 1 ? 's' : ''}`
                  : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>

    {selectedAlbum && (
      <p className="mt-2 text-xs text-[#b10e6b]">
        ✓ {albumSearch} · {photographerLabel}
      </p>
    )}
  </div>

  {/* TEMPLATE SELECT */}
  <div>
    <label className="block text-[11px] font-bold uppercase mb-2 text-[#54474d]">
      SELECT TEMPLATE
    </label>

    <div className="relative">
      <input
        type="text"
        placeholder="Search all templates..."
        value={templateSearch}
        onChange={(e) => handleTemplateSearch(e.target.value)}
        onFocus={() => {
          if (templateSearch.trim()) handleTemplateSearch(templateSearch);
          else setTemplateSuggestions(templates);
        }}
        className="w-full bg-[#fff0f4] border border-[#f3d6df] rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#b10e6b]/40"
      />

      {templateSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#f3d6df] rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
          {templateSuggestions.map((template) => (
            <button
              key={template._id}
              type="button"
              onClick={() => handleSelectTemplate(template)}
              className="w-full text-left px-4 py-3 hover:bg-[#fff0f4] text-sm border-b border-[#f3d6df]/40 last:border-0"
            >
              <p className="font-semibold text-[#211A1B]">{template.name}</p>
              {template.description && (
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                  {template.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>

    {selectedTemplate && (
      <p className="mt-2 text-xs text-[#b10e6b]">
        ✓ {templateSearch}
      </p>
    )}
  </div>

</div>
          </div>

        {/* RIGHT COLUMN - MEDIA UPLOAD & PREVIEW */}
<div className="space-y-6 overflow-y-auto">
  {/* Narrative Flow - Media Upload */}
  <div className="bg-white min-h-[192px] rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
    <div className="p-4 border-b flex justify-between items-center gap-3">
      <div>
        <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#211A1B] font-bold">NARRATIVE FLOW</h3>
        <p className="text-xs text-[#211A1B] mt-0.5">
          {selectedAlbum
            ? `Images from "${albumSearch}" — edit in Curate`
            : 'Select a curate album to load images'}
        </p>
      </div>
      {selectedAlbum && (
        <Link
          href="/photographer-admin/curate"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] shrink-0"
          title="Edit curate images"
        >
          <PenLine size={14} />
          Edit
        </Link>
      )}
    </div>

    <div
      className={`flex-1 p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'bg-[#fcf1f6]' : 'bg-white'}`}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*" />

      {mediaItems.length === 0 ? (
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#f7ecef' }}>
            <Upload size={24} style={{ color: '#b10e6b' }} />
          </div>
          {selectedAlbum ? (
            <>
              <p className="text-sm text-[#211A1B] font-medium">No images in this curate yet</p>
              <Link
                href="/photographer-admin/curate"
                className="inline-flex items-center gap-1 text-xs text-[#b10e6b] underline font-semibold"
              >
                <PenLine size={12} />
                Add images in Curate
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[#211A1B] font-medium">Select a curate album first</p>
              <p className="text-xs text-[#211A1B]/70">
                Images from your curate table will appear here
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 w-full">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-move"
              draggable
              onDragStart={(e) => {
                e.dataTransfer!.effectAllowed = 'move';
                e.dataTransfer!.setData('mediaItem', JSON.stringify(item));
              }}
            >
              {item.mediaKind === 'image' && item.dataUrl ? (
                <img src={item.dataUrl} alt={item.fileName} className="w-full h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">Video</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.dataUrl || '', '_blank');
                  }}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100"
                  title="View"
                >
                  <Eye size={12} className="text-[#211A1B]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMedia(item.id);
                  }}
                  className="p-1.5 bg-red-500 rounded-full hover:bg-red-600"
                  title="Remove"
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
              <p className="text-[10px] text-[#211A1B] mt-0.5 truncate">{item.fileName}</p>
            </div>
          ))}
        </div>
      )}
    </div>

    {mediaItems.length > 0 && (
      <div className="p-3 border-t bg-gray-50 text-xs text-[#211A1B]">
        {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''} uploaded
      </div>
    )}
  </div>

  {/* Template Book Preview (flip book with curate images in slots) */}
  {selectedTemplateData ? (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#211A1B]">TEMPLATE BOOK</h3>
          <p className="text-xs text-[#211A1B]/70 mt-0.5">
            {selectedTemplateData.name}
            {isSyncingBook ? ' · Saving to album book…' : bookAlbumId ? ' · Saved' : ''}
          </p>
        </div>
        <a
          href={`/photographer-admin/designer/book/${selectedTemplateData._id}${selectedAlbum ? `?curateId=${selectedAlbum}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] transition"
        >
          Fullscreen Book
        </a>
      </div>

      <div className="p-4 bg-[#fff8f7]">
        {mediaItems.length > 0 ? (
          <TemplateBookFlip
            template={selectedTemplateData}
            mediaItems={mediaItems}
            variant="inline"
          />
        ) : (
          <div className="py-8 text-center text-sm text-[#594045]">
            <p>Select a curate with images to fill this template book.</p>
            <Link href="/photographer-admin/curate" className="mt-2 inline-block text-[#b10e6b] underline text-xs font-semibold">
              Go to Curate
            </Link>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
      <p className="text-sm font-medium text-gray-500">Select a template to open the book view</p>
      <p className="text-xs text-gray-400 mt-1">Curate images will map into template slots from the database</p>
    </div>
  )}
</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 md:px-12 py-4 flex flex-wrap gap-3 justify-end" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
        <button
          onClick={handleDiscard}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600"
        >
          Discard
        </button>

        <button
          onClick={saveCurateDraft}
          disabled={isSaving || !selectedAlbum || !selectedTemplate || mediaItems.length === 0}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-[#EADFE2] text-[#B10E6B] rounded-lg disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>

        <button
          onClick={handleNext}
          disabled={isSaving || !selectedAlbum || !selectedTemplate || mediaItems.length === 0}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-[#b10e6b] text-white rounded-lg disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CreateAlbum;