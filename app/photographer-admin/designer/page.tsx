'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, getUser, handleAuthError } from '@/lib/api';
import { Upload, Eye, Trash2, PenLine, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentMediaPage, setCurrentMediaPage] = useState(0);
  const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);
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
    if (value.trim()) {
      const filtered = albums.filter((album) => {
        const lowerValue = value.toLowerCase();
        const isDraftSearch = lowerValue.includes('draft');
        const isSavedSearch = lowerValue.includes('saved') || lowerValue.includes('publish');
        
        if (isDraftSearch && album.status !== 'saved' && album.status !== 'published') {
          return true;
        }
        if (isSavedSearch && (album.status === 'saved' || album.status === 'published')) {
          return true;
        }
        
        return fuzzyMatch(value, album.albumName, album.status, photographerLabel);
      });
      setAlbumSuggestions(filtered);
      
      if (filtered.length === 1) {
        handleSelectAlbum(filtered[0]);
      } else {
        setSelectedAlbum('');
      }
    } else {
      setAlbumSuggestions([]);
      setSelectedAlbum('');
    }
  };

  const handleTemplateSearch = (value: string) => {
    setTemplateSearch(value);
    if (value.trim()) {
      const filtered = templates.filter((template) => {
        const lowerValue = value.toLowerCase();
        
        return fuzzyMatch(
          value,
          template.name,
          template.description,
          template.accent,
          template._id
        );
      });
      setTemplateSuggestions(filtered);
      
      if (filtered.length === 1) {
        handleSelectTemplate(filtered[0]);
      } else {
        setSelectedTemplate('');
        setSelectedTemplateData(null);
      }
    } else {
      setTemplateSuggestions([]);
      setSelectedTemplate('');
      setSelectedTemplateData(null);
    }
  };

  const applyCurateMedia = (album: Album): MediaItem[] => {
    if (!Array.isArray(album.mediaItems) || album.mediaItems.length === 0) {
      setMediaItems([]);
      setCurrentMediaPage(0);
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
    setCurrentMediaPage(0);
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

  const clearAllMedia = () => {
    setMediaItems([]);
    setCurrentMediaPage(0);
    toast.success('All images cleared', toastStyle);
  };

  const ITEMS_PER_PAGE = 12;
  const totalMediaPages = Math.ceil(mediaItems.length / ITEMS_PER_PAGE);
  const paginatedMediaItems = mediaItems.slice(
    currentMediaPage * ITEMS_PER_PAGE,
    (currentMediaPage + 1) * ITEMS_PER_PAGE
  );

  const handleMediaPageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentMediaPage > 0) {
      setCurrentMediaPage(currentMediaPage - 1);
    } else if (direction === 'next' && currentMediaPage < totalMediaPages - 1) {
      setCurrentMediaPage(currentMediaPage + 1);
    }
  };

  const handleDragStart = (item: MediaItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, targetItem: MediaItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = mediaItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = mediaItems.findIndex(item => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newMediaItems = [...mediaItems];
    newMediaItems.splice(draggedIndex, 1);
    newMediaItems.splice(targetIndex, 0, draggedItem);

    // Update order property
    const reordered = newMediaItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setMediaItems(reordered);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDiscard = () => {
    setSelectedAlbum('');
    setSelectedTemplate('');
    setSelectedTemplateData(null);
    setAlbumSearch('');
    setTemplateSearch('');
    setMediaItems([]);
    setCurrentMediaPage(0);
    setBookAlbumId(null);
    sessionStorage.removeItem('bookAlbumId');
  };

  const saveCurateDraft = async () => {
    if (!selectedAlbum || !selectedTemplate || mediaItems.length === 0) {
      toast.error('Please select album, template and add media', toastStyle);
      return false;
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
        return false;
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
        return true;
      } else {
        throw new Error(result.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save', toastStyle);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveCurateDraft();
    if (saved) {
      window.location.href = '/photographer-admin/clients';
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
           <div className="lg:col-span-3 space-y-1 overflow-y-auto">
  
<div
  className="w-full max-w-xs p-6 rounded-2xl shadow-lg bg-white space-y-6 border-l-4 border-[#b10e6b]"
>

   <h3 className="text-[11px] tracking-widest uppercase text-[#b10e6b] font-bold">
    SELECTION PANEL
  </h3>

  {/* ALBUM SELECT */}
  <div>
    <label className="block text-[11px] font-bold uppercase mb-3 text-[#54474d] flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#b10e6b]"></span>
      SELECT ALBUM
    </label>

    <div className="relative">
      <input
        type="text"
        placeholder="Search by name, status (draft/saved)..."
        value={albumSearch}
        onChange={(e) => handleAlbumSearch(e.target.value)}
        onFocus={() => {
          if (albumSearch.trim()) handleAlbumSearch(albumSearch);
          else setAlbumSuggestions(albums);
        }}
        className="w-full bg-[#fff0f4] border-2 border-[#f3d6df] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#b10e6b]/40 focus:border-[#b10e6b] transition-all"
      />

      {albumSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#f3d6df] rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto">
          {albumSuggestions.map((album) => (
            <button
              key={album._id}
              type="button"
              onClick={() => handleSelectAlbum(album)}
              className="w-full text-left px-4 py-3 hover:bg-[#fff0f4] text-sm border-b border-[#f3d6df]/40 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#211A1B] truncate">{album.albumName}</p>
                  <p className="text-[10px] text-[#54474d] mt-0.5">
                    {photographerLabel}
                    {Array.isArray(album.mediaItems) && album.mediaItems.length > 0
                      ? ` · ${album.mediaItems.length} image${album.mediaItems.length !== 1 ? 's' : ''}`
                      : ''}
                  </p>
                </div>
                {album.status && (
                  <span
                    className={`shrink-0 px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                      album.status === 'saved' || album.status === 'published'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}
                  >
                    {album.status === 'saved' || album.status === 'published' ? 'Saved' : 'Draft'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {albumSearch.trim() && albumSuggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#f3d6df] rounded-xl shadow-2xl z-20 px-4 py-4">
          <p className="text-sm text-[#54474d] text-center font-medium">No curates found matching "{albumSearch}"</p>
          <p className="text-[10px] text-[#54474d]/70 text-center mt-1">Try searching by name or status (draft/saved)</p>
        </div>
      )}
    </div>
  </div>

  {/* TEMPLATE SELECT */}
  <div>
    <label className="block text-[11px] font-bold uppercase mb-3 text-[#54474d] flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#b10e6b]"></span>
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
        className="w-full bg-[#fff0f4] border-2 border-[#f3d6df] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#b10e6b]/40 focus:border-[#b10e6b] transition-all"
      />

      {templateSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#f3d6df] rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto">
          {templateSuggestions.map((template) => (
            <button
              key={template._id}
              type="button"
              onClick={() => handleSelectTemplate(template)}
              className="w-full text-left px-4 py-3 hover:bg-[#fff0f4] text-sm border-b border-[#f3d6df]/40 last:border-0 transition-colors"
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

      {templateSearch.trim() && templateSuggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#f3d6df] rounded-xl shadow-2xl z-20 px-4 py-4">
          <p className="text-sm text-[#54474d] text-center font-medium">No templates found matching "{templateSearch}"</p>
          <p className="text-[10px] text-[#54474d]/70 text-center mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  </div>

</div>
          </div>

        {/* RIGHT COLUMN - MEDIA UPLOAD & PREVIEW */}
<div className="lg:col-span-9 space-y-6 overflow-y-auto">
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
      <div className="flex items-center gap-2">
        {mediaItems.length > 0 && (
          <button
            onClick={clearAllMedia}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-red-500 text-red-500 rounded-lg hover:bg-red-50 shrink-0"
            title="Clear all images"
          >
            Clear All
          </button>
        )}
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
        <div className="w-full">
          {/* Book-style page view */}
          <div className="bg-gradient-to-br from-[#fff8f7] to-[#fef6f6] rounded-2xl p-6 border border-[#f0e2e6] shadow-inner">
            <div className="grid grid-cols-4 gap-4 w-full min-h-[320px]">
              {paginatedMediaItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group cursor-move bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragEnd={handleDragEnd}
                >
                  {item.mediaKind === 'image' && item.dataUrl ? (
                    <img src={item.dataUrl} alt={item.fileName} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-semibold">VIDEO</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.dataUrl || '', '_blank');
                      }}
                      className="p-2 bg-white/90 rounded-full hover:bg-white shadow-lg transform hover:scale-110 transition-all"
                      title="View"
                    >
                      <Eye size={14} className="text-[#211A1B]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(item.id);
                      }}
                      className="p-2 bg-red-500/90 rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all"
                      title="Remove"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-[9px] text-white font-medium truncate">{item.fileName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book-style pagination controls */}
          {totalMediaPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => handleMediaPageChange('prev')}
                disabled={currentMediaPage === 0}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-[#e1bec4] text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b] hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#e1bec4] disabled:hover:text-[#7a6268] transition-all"
                title="Previous page"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Previous</span>
              </button>
              
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-br from-[#fff0f4] to-[#fef6f6] border border-[#f0e2e6] shadow-sm">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">Page</p>
                  <p className="text-xl font-bold text-[#b10e6b]">{currentMediaPage + 1}</p>
                </div>
                <div className="w-px h-10 bg-[#e1bec4]"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">of {totalMediaPages}</p>
                  <p className="text-xs text-[#54474d] font-semibold">{mediaItems.length} images</p>
                </div>
              </div>

              <button
                onClick={() => handleMediaPageChange('next')}
                disabled={currentMediaPage >= totalMediaPages - 1}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-[#e1bec4] text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b] hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#e1bec4] disabled:hover:text-[#7a6268] transition-all"
                title="Next page"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Next</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    {mediaItems.length > 0 && (
      <div className="p-3 border-t bg-[#fef6f6] text-xs text-[#211A1B] flex items-center justify-between">
        <span className="font-semibold">{mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''} total</span>
        {totalMediaPages > 1 && (
          <span className="text-[10px] text-[#54474d]">Showing page {currentMediaPage + 1} of {totalMediaPages}</span>
        )}
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
      <div className="px-4 md:px-12 py-4 flex flex-wrap gap-3 justify-end border-t border-[#f3d6df] bg-white" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
        <button
          onClick={handleDiscard}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#54474d] hover:text-[#211A1B] hover:bg-gray-50 rounded-lg transition-colors"
        >
          Discard
        </button>

        <button
          onClick={saveCurateDraft}
          disabled={isSaving || !selectedAlbum || !selectedTemplate || mediaItems.length === 0}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-white border-2 border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Draft'
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={isSaving || !selectedAlbum || !selectedTemplate || mediaItems.length === 0}
          className="px-8 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#b10e6b] to-[#d23284] text-white rounded-lg hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default CreateAlbum;