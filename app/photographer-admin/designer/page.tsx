'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { apiFetch, getUser, handleAuthError } from '@/lib/api';
import { Eye, Trash2, Upload, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { TemplateBookFlip } from '@/app/Components/photographer-admin/template-book-flip';
import { FullscreenBook } from '@/app/Components/photographer-admin/FullscreenBook';

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
  weddingDate?: string | Date;
  mediaItems?: MediaItem[];
  status?: string;
  coverPhoto?: string;
  coverPhotoName?: string;
}

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

const hasMediaSrc = (value?: string) => Boolean(value && value.trim());

interface MediaItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaKind: string;
  dataUrl?: string;
  order?: number;
}

const albumTypeOptions = ['Wedding', 'Engagement'] as const;

const CreateAlbum: React.FC = () => {
  const searchParams = useSearchParams();
  const requestedCurateId = searchParams.get('curateId') || '';
  const requestedTemplateId = searchParams.get('templateId') || '';
  const shouldOpenFullscreenBook = searchParams.get('openBook') === '1';

  const [isSaving, setIsSaving] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedAlbumData, setSelectedAlbumData] = useState<Album | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<Template | null>(null);
  const [albumType, setAlbumType] = useState<(typeof albumTypeOptions)[number]>('Wedding');
  const [albumSearch, setAlbumSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [albumSuggestions, setAlbumSuggestions] = useState<Album[]>([]);
  const [templateSuggestions, setTemplateSuggestions] = useState<Template[]>([]);
  const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const albumRef = useRef<HTMLDivElement | null>(null);
  const templateRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (albumRef.current && !albumRef.current.contains(e.target as Node)) {
        setIsAlbumDropdownOpen(false);
      }
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bookAlbumId, setBookAlbumId] = useState<string | null>(null);
  const [isSyncingBook, setIsSyncingBook] = useState(false);
  const [currentMediaPage, setCurrentMediaPage] = useState(0);
  const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const lastAlbumNoMatchToastRef = useRef('');
  const lastTemplateNoMatchToastRef = useRef('');
  const routeSelectionAppliedRef = useRef('');
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

  useEffect(() => {
    if (!requestedCurateId && !requestedTemplateId) {
      routeSelectionAppliedRef.current = '';
      return;
    }

    if (!albums.length && !templates.length) {
      return;
    }

    const routeKey = `${requestedCurateId}:${requestedTemplateId}`;
    if (routeSelectionAppliedRef.current === routeKey) {
      return;
    }

    const nextAlbum = requestedCurateId ? albums.find((album) => album._id === requestedCurateId) : null;
    const nextTemplate = requestedTemplateId ? templates.find((template) => template._id === requestedTemplateId) : null;

    if (nextAlbum) {
      handleSelectAlbum(nextAlbum);
    }

    if (nextTemplate) {
      handleSelectTemplate(nextTemplate);
    }

    if (nextAlbum || nextTemplate) {
      routeSelectionAppliedRef.current = routeKey;
    }
  }, [albums, templates, requestedCurateId, requestedTemplateId]);

  useEffect(() => {
    if (!shouldOpenFullscreenBook || !selectedTemplateData || !selectedAlbum) {
      return;
    }

    setIsBookModalOpen(true);
  }, [shouldOpenFullscreenBook, selectedTemplateData, selectedAlbum]);

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
              setAlbumSuggestions(filtered.slice(0, 20));
              setIsAlbumDropdownOpen(filtered.length > 0);
      if (filtered.length === 1) {
        handleSelectAlbum(filtered[0]);
      } else {
        setSelectedAlbum('');
        setSelectedAlbumData(null);
        setSelectedTemplate('');
        setSelectedTemplateData(null);
        setMediaItems([]);
        setCurrentMediaPage(0);
        if (filtered.length === 0 && lastAlbumNoMatchToastRef.current !== value) {
          lastAlbumNoMatchToastRef.current = value;
          toast.error(`No curates found matching "${value}"`, toastStyle);
        }
      }
    } else {
      setSelectedAlbum('');
      setSelectedAlbumData(null);
      setSelectedTemplate('');
      setSelectedTemplateData(null);
      setMediaItems([]);
      setCurrentMediaPage(0);
      setAlbumSuggestions([]);
      setIsAlbumDropdownOpen(false);
      lastAlbumNoMatchToastRef.current = '';
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
      // show suggestions when typing
      setTemplateSuggestions(filtered.slice(0, 20));
      setIsTemplateDropdownOpen(filtered.length > 0);
      if (filtered.length === 1) {
        handleSelectTemplate(filtered[0]);
      } else {
        setSelectedTemplate('');
        setSelectedTemplateData(null);
        if (filtered.length === 0 && lastTemplateNoMatchToastRef.current !== value) {
          lastTemplateNoMatchToastRef.current = value;
          toast.error(`No templates found matching "${value}"`, toastStyle);
        }
      }
    } else {
      setSelectedTemplate('');
      setSelectedTemplateData(null);
      // when cleared, reset suggestions and keep dropdown closed until focus
      setTemplateSuggestions([]);
      setIsTemplateDropdownOpen(false);
      lastTemplateNoMatchToastRef.current = '';
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
    setSelectedAlbumData(album);
    setAlbumSearch(album.albumName);
    lastAlbumNoMatchToastRef.current = '';
    setAlbumSuggestions([]);
    setIsAlbumDropdownOpen(false);
    const loaded = applyCurateMedia(album);
    if (selectedTemplate && loaded.length > 0) {
      void syncBookAlbum(album._id, selectedTemplate);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template._id);
    setTemplateSearch(template.name);
    lastTemplateNoMatchToastRef.current = '';
    setSelectedTemplateData(template);
    setIsTemplateDropdownOpen(false);
    if (selectedAlbum && mediaItems.length > 0) {
      void syncBookAlbum(selectedAlbum, template._id);
    }
  };
  
  const templatePages = selectedTemplateData?.pages || [];
  
  const pageConfigs = useMemo(() => {
    if (templatePages.length > 0) {
      let startIndex = 0;
  
      return templatePages.map((page, index) => {
        const slotCount = Math.max(1, page.slots?.length || 1);
        const isLastPage = index === templatePages.length - 1;
        const endIndex = isLastPage ? Math.max(startIndex + slotCount, mediaItems.length) : startIndex + slotCount;
  
        const config = {
          pageNumber: index + 1,
          label: page.pageLabel || `Page ${page.pageNumber}`,
          slots: slotCount,
          startIndex,
          endIndex,
          items: mediaItems.slice(startIndex, endIndex),
        };
  
        startIndex += slotCount;
        return config;
      });
    }
  
    const itemsPerPage = 12;
    const totalPages = Math.max(1, Math.ceil(mediaItems.length / itemsPerPage));
  
    return Array.from({ length: totalPages }, (_, index) => ({
      pageNumber: index + 1,
      label: `Page ${index + 1}`,
      slots: itemsPerPage,
      startIndex: index * itemsPerPage,
      endIndex: (index + 1) * itemsPerPage,
      items: mediaItems.slice(index * itemsPerPage, (index + 1) * itemsPerPage),
    }));
  }, [templatePages, mediaItems]);
  
  const currentPageConfig = pageConfigs[currentMediaPage] || pageConfigs[0] || null;
  const totalMediaPages = pageConfigs.length || 1;
  const currentPageItems = currentPageConfig?.items || [];
  
  useEffect(() => {
    if (currentMediaPage > totalMediaPages - 1) {
      setCurrentMediaPage(Math.max(0, totalMediaPages - 1));
    }
  }, [currentMediaPage, totalMediaPages]);
  
  const moveMediaToPage = (targetPageIndex: number, mediaId: string) => {
    if (targetPageIndex < 0 || targetPageIndex >= pageConfigs.length) return;
  
    const sourceIndex = mediaItems.findIndex((item) => item.id === mediaId);
    if (sourceIndex === -1) return;
  
    const sourceItem = mediaItems[sourceIndex];
    const updated = [...mediaItems];
    updated.splice(sourceIndex, 1);
  
    const targetStart = pageConfigs[targetPageIndex]?.startIndex ?? 0;
    const insertionIndex = sourceIndex < targetStart ? Math.max(0, targetStart - 1) : targetStart;
  
    updated.splice(insertionIndex, 0, sourceItem);
  
    const reordered = updated.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
  
    setMediaItems(reordered);
    setCurrentMediaPage(targetPageIndex);
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
    setSelectedAlbumData(null);
    setSelectedTemplate('');
    setSelectedTemplateData(null);
    setAlbumType('Wedding');
    setAlbumSearch('');
    setTemplateSearch('');
    setMediaItems([]);
    setCurrentMediaPage(0);
    setBookAlbumId(null);
    setAlbumSuggestions([]);
    setTemplateSuggestions([]);
    setIsAlbumDropdownOpen(false);
    setIsTemplateDropdownOpen(false);
    setIsBookModalOpen(false);
    setPreviewMedia(null);
    sessionStorage.removeItem('bookAlbumId');
  };

  const saveCurateDraft = async (showOnMainSite = false) => {
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
          albumType,
          mainSiteShowStatus: showOnMainSite,
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
    const saved = await saveCurateDraft(true);
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,5fr)_minmax(0,7fr)] gap-8 h-full">
           <div className="space-y-1 overflow-y-auto lg:pr-2">
  
<div
  className="w-full max-w-xl p-6 rounded-2xl shadow-lg bg-white space-y-6 border-l-4 border-[#b10e6b]"
>

   <h3 className="text-[11px] tracking-widest uppercase text-[#b10e6b] font-bold">
    SELECTION PANEL
  </h3>

  {/* ALBUM SELECT */}
  <div>
    <label className="block text-[11px] font-bold uppercase mb-3 text-[#54474d]">
      SELECT ALBUM
    </label>

    <div className="relative" ref={albumRef}>
      <input
        type="text"
        name="album-search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search by name, status (draft/saved)..."
        value={albumSearch}
        onChange={(e) => handleAlbumSearch(e.target.value)}
        onFocus={() => {
          setAlbumSuggestions(albums.slice(0, 8));
          setIsAlbumDropdownOpen(albums.length > 0);
        }}
        className="w-full bg-[#fff0f4] border-2 border-[#f3d6df] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#b10e6b]/40 focus:border-[#b10e6b] transition-all"
      />

      {isAlbumDropdownOpen && albumSuggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-2 max-h-56 overflow-auto rounded-lg border border-[#eee] bg-white shadow-lg">
          {albumSuggestions.map((album) => (
            <li
              key={album._id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectAlbum(album);
              }}
              className="cursor-pointer px-3 py-2 hover:bg-[#fff0f4]"
            >
              <div className="text-sm font-medium text-[#211A1B]">{album.albumName}</div>
              <div className="text-xs text-[#54474d]">
                {album.status || 'draft'}
                {album.mediaItems?.length ? ` · ${album.mediaItems.length} items` : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>

  {/* TEMPLATE SELECT */}
  <div>
    <label className="block text-[11px] font-bold uppercase mb-3 text-[#54474d]">
      SELECT TEMPLATE
    </label>

    <div className="relative" ref={templateRef}>
      <input
        type="text"
        name="template-search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search all templates..."
        value={templateSearch}
        onChange={(e) => handleTemplateSearch(e.target.value)}
        onFocus={() => {
          // open a basic suggestion list on focus
          setTemplateSuggestions(templates.slice(0, 8));
          setIsTemplateDropdownOpen(templates.length > 0);
        }}
        className="w-full bg-[#fff0f4] border-2 border-[#f3d6df] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#b10e6b]/40 focus:border-[#b10e6b] transition-all"
      />

      {isTemplateDropdownOpen && templateSuggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-2 bg-white border border-[#eee] rounded-lg shadow-lg max-h-48 overflow-auto">
          {templateSuggestions.map((t) => (
            <li
              key={t._id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectTemplate(t);
                setIsTemplateDropdownOpen(false);
              }}
              className="px-3 py-2 hover:bg-[#fff0f4] cursor-pointer"
            >
              <div className="text-sm font-medium text-[#211A1B]">{t.name}</div>
              {t.description && <div className="text-xs text-[#54474d]">{t.description}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>

  <div>
    <label className="block text-[11px] font-bold uppercase mb-3 text-[#54474d]">
      ALBUM TYPE
    </label>
    <div className="grid grid-cols-2 gap-2">
      {albumTypeOptions.map((type) => {
        const isActive = albumType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => setAlbumType(type)}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
              isActive
                ? 'border-[#b10e6b] bg-[#fff0f4] text-[#b10e6b] shadow-sm'
                : 'border-[#f3d6df] bg-white text-[#54474d] hover:border-[#e0a7c0] hover:bg-[#fff8fb]'
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
    <p className="mt-2 text-[11px] text-[#7a6268]">
      Choose the album story style before saving.
    </p>
  </div>

</div>
          </div>

        {/* RIGHT COLUMN - MEDIA UPLOAD & PREVIEW */}
<div className="space-y-6 overflow-y-auto lg:min-w-0">
  {/* Narrative Flow - Media Upload */}
  <div className="bg-white min-h-48 rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
    <div className="p-4 border-b flex justify-between items-center gap-3">
      <div>
        <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#211A1B] font-bold">NARRATIVE FLOW</h3>
        <p className="text-xs text-[#211A1B] mt-0.5">
          {selectedAlbum
            ? `Images and videos from "${albumSearch}"`
            : 'Select a curate album to load images'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] shrink-0 cursor-pointer">
          <Upload size={14} />
          Upload Media
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {mediaItems.length > 0 && (
          <button
            onClick={clearAllMedia}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-red-500 text-red-500 rounded-lg hover:bg-red-50 shrink-0"
            title="Clear all images"
          >
            Clear All
          </button>
        )}
      </div>
    </div>

    <div className="flex-1 p-4 flex flex-col items-center justify-center bg-white">
      {mediaItems.length === 0 ? (
        <div className="text-center space-y-2">
          {selectedAlbum ? (
            <>
              <p className="text-sm text-[#211A1B] font-medium">No images or videos in this curate yet</p>
              <label className="inline-flex items-center gap-1 text-xs text-[#b10e6b] underline font-semibold cursor-pointer">
                <Upload size={12} />
                Upload media here
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <>
              <p className="text-sm text-[#211A1B] font-medium">Select a curate album first</p>
              <p className="text-xs text-[#211A1B]/70 mb-2">
                Images and videos from your curate table will appear here
              </p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-dashed border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] cursor-pointer transition-all">
                <Upload size={14} />
                Or Upload Media Directly
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      ) : (
        <div className="w-full">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0e2e6] bg-[#fff8f7] p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">Page Flow</p>
                <p className="text-sm font-semibold text-[#211A1B]">
                  {currentPageConfig?.label || `Page ${currentMediaPage + 1}`}
                  <span className="text-[#7a6268]"> · {currentPageItems.length} item{currentPageItems.length !== 1 ? 's' : ''}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMediaPageChange('prev')}
                  disabled={currentMediaPage === 0}
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#e1bec4] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#7a6268] transition-all hover:border-[#b10e6b] hover:text-[#b10e6b] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Prev
                </button>
                <button
                  onClick={() => handleMediaPageChange('next')}
                  disabled={currentMediaPage >= totalMediaPages - 1}
                  className="group inline-flex items-center gap-2 rounded-xl border border-[#e1bec4] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#7a6268] transition-all hover:border-[#b10e6b] hover:text-[#b10e6b] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {pageConfigs.map((page, index) => {
                const isActive = index === currentMediaPage;
                return (
                  <button
                    key={`${page.pageNumber}-${page.label}`}
                    onClick={() => setCurrentMediaPage(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedItem) {
                        moveMediaToPage(index, draggedItem.id);
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-all ${
                      isActive
                        ? 'border-[#b10e6b] bg-[#fff0f4] text-[#b10e6b] shadow-sm'
                        : 'border-[#e1bec4] bg-white text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b]'
                    }`}
                    title={`Move dragged item to ${page.label}`}
                  >
                    {page.label}
                    <span className="ml-2 text-[9px] font-semibold normal-case tracking-normal text-current/70">
                      {page.items.length}/{page.slots}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[#f0e2e6] bg-linear-to-br from-[#fff8f7] to-[#fef6f6] p-6 shadow-inner">
              {currentPageItems.length === 0 ? (
                <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-[#e1bec4] bg-white/60 text-center text-sm text-[#594045]">
                  No media on this page yet.
                </div>
              ) : (
                <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {currentPageItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative cursor-move overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragOver={(e) => handleDragOver(e, item)}
                      onDragEnd={handleDragEnd}
                    >
                      {item.mediaKind === 'image' && hasMediaSrc(item.dataUrl) ? (
                        <div className="relative h-32 bg-[#f7ecef]">
                          <img src={item.dataUrl} alt={item.fileName} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      ) : (
                        <div className="relative h-32 bg-black">
                          {hasMediaSrc(item.dataUrl) ? (
                            <video
                              src={item.dataUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              controls={false}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-300">
                              <span className="text-[10px] font-bold tracking-widest text-gray-600">VIDEO</span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#211A1B] shadow-lg">
                              <Eye size={16} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewMedia(item);
                          }}
                          className="rounded-full bg-white/90 p-2 shadow-lg transition-all hover:scale-110 hover:bg-white"
                          title="View"
                        >
                          <Eye size={14} className="text-[#211A1B]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedia(item.id);
                          }}
                          className="rounded-full bg-red-500/90 p-2 shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                          title="Remove"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
                        <p className="truncate text-[9px] font-medium text-white">{item.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-[#f0e2e6] bg-white px-5 py-3 shadow-sm">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">Page</p>
                  <p className="text-xl font-bold text-[#b10e6b]">{currentMediaPage + 1}</p>
                </div>
                <div className="h-10 w-px bg-[#e1bec4]"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">of {totalMediaPages}</p>
                  <p className="text-xs font-semibold text-[#54474d]">{mediaItems.length} images</p>
                </div>
              </div>
            </div>
          </div>
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 min-h-88">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#211A1B]">TEMPLATE BOOK</h3>
          <p className="text-xs text-[#211A1B]/70 mt-0.5">
            {selectedTemplateData.name}
            {isSyncingBook ? ' · Saving to album book…' : bookAlbumId ? ' · Saved' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsBookModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#b10e6b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#b10e6b] transition hover:bg-[#BE126F] hover:text-white"
        >
          <Maximize2 size={14} />
          Fullscreen Book
        </button>
      </div>

      <div className="p-3 bg-[#fff8f7]">
        {mediaItems.length > 0 || selectedAlbumData?.coverPhoto ? (
          <div className="w-full max-h-92 overflow-hidden rounded-xl">
            <TemplateBookFlip
              template={selectedTemplateData}
              mediaItems={mediaItems}
              coverPhoto={selectedAlbumData?.coverPhoto}
              coverPhotoName={selectedAlbumData?.albumName}
              coverWeddingDate={selectedAlbumData?.weddingDate}
              variant="inline"
            />
          </div>
        ) : (
          <div className="min-h-32 py-4 px-4 text-left text-sm text-[#594045] flex flex-col items-start justify-center">
            <p>Select a curate with images to fill this template book.</p>
            <Link href="/photographer-admin/curate" className="mt-2 inline-block text-[#b10e6b] underline text-xs font-semibold">
              Go to Curate
            </Link>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-6 py-5 min-h-32 flex flex-col items-start justify-center text-left">
      <p className="text-sm font-medium text-gray-500">Select a template to open the book view</p>
      <p className="text-xs text-gray-400 mt-1">Curate images will map into template slots from the database</p>
    </div>
  )}

  {isBookModalOpen && selectedTemplateData && (
    <FullscreenBook
      template={selectedTemplateData}
      mediaItems={mediaItems}
      coverPhoto={selectedAlbumData?.coverPhoto}
      coverPhotoName={selectedAlbumData?.albumName}
      coverWeddingDate={selectedAlbumData?.weddingDate}
      onClose={() => setIsBookModalOpen(false)}
    />
  )}

  {previewMedia && (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ead5dc] px-4 py-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#211A1B]">Media Preview</p>
            <p className="text-xs text-[#7a6268] truncate max-w-[70vw]">{previewMedia.fileName}</p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewMedia(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e1bec4] text-[#7a6268] transition hover:border-[#b10e6b] hover:text-[#b10e6b]"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-[#111]">
          {hasMediaSrc(previewMedia.dataUrl) ? (
            previewMedia.mediaKind === 'video' ? (
              <video src={previewMedia.dataUrl} className="max-h-[80vh] w-full object-contain" controls autoPlay playsInline />
            ) : (
              <img src={previewMedia.dataUrl} alt={previewMedia.fileName} className="max-h-[80vh] w-full object-contain" />
            )
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center bg-[#111] text-center text-sm text-white/70">
              Preview unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 md:px-12 py-4 flex flex-wrap gap-3 justify-end border-t border-[#f3d6df] #f3d6df" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
        <button
          onClick={handleDiscard}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#54474d] hover:text-[#211A1B] hover:bg-gray-50 rounded-lg transition-colors"
        >
          Discard
        </button>

        <button
          onClick={() => saveCurateDraft(false)}
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
          className="px-8 py-3 text-xs font-bold uppercase tracking-wider bg-linear-to-r from-[#b10e6b] to-[#d23284] text-white rounded-lg hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default CreateAlbum;