'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { apiFetch, getUser, handleAuthError } from '@/lib/api';
import { Eye, Trash2, Upload, Maximize2, X } from 'lucide-react';
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

interface MediaTransform {
  zoom: number;
  x: number;
  y: number;
}

interface SlotConfig {
  index: number;
  pageIndex: number;
  pageNumber: number;
  pageLabel: string;
  slotId: string;
  slotLabel: string;
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
  const slotUploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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
  const [bookAlbumId, setBookAlbumId] = useState<string | null>(null);
  const [isSyncingBook, setIsSyncingBook] = useState(false);
  const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [mediaTransforms, setMediaTransforms] = useState<Record<string, MediaTransform>>({});
  const [cropMedia, setCropMedia] = useState<MediaItem | null>(null);
  const [cropDraft, setCropDraft] = useState<MediaTransform>({ zoom: 1, x: 0, y: 0 });
  const [selectedPreviewPage, setSelectedPreviewPage] = useState(0);
  const [isCropPanning, setIsCropPanning] = useState(false);
  const [cropPanStart, setCropPanStart] = useState({ x: 0, y: 0, baseX: 0, baseY: 0 });
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
        body: JSON.stringify({
          curateId,
          templateId,
          mediaTransforms,
        }),
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
    setSelectedPreviewPage(0);
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
    setSelectedPreviewPage(0);
    if (selectedAlbum && mediaItems.length > 0) {
      void syncBookAlbum(selectedAlbum, template._id);
    }
  };
  
  const templatePages = selectedTemplateData?.pages || [];

  const slotConfigs = useMemo<SlotConfig[]>(() => {
    if (templatePages.length > 0) {
      return templatePages
        .flatMap((page, pageIndex) =>
          (page.slots || []).map((slot, slotIndex) => ({
            pageIndex,
            pageNumber: Number(page.pageNumber) || pageIndex + 1,
            pageLabel: page.pageLabel || `Spread ${pageIndex + 1}`,
            slotId: slot.id || `slot-${pageIndex + 1}-${slotIndex + 1}`,
            slotLabel: slot.label || `Slot ${slotIndex + 1}`,
          }))
        )
        .map((slot, index) => ({
          ...slot,
          index,
        }));
    }

    const fallbackSlots = Math.max(12, mediaItems.length);
    return Array.from({ length: fallbackSlots }, (_, index) => ({
      index,
      pageIndex: Math.floor(index / 6),
      pageNumber: Math.floor(index / 6) + 1,
      pageLabel: 'Auto Layout',
      slotId: `auto-slot-${index + 1}`,
      slotLabel: `Slot ${index + 1}`,
    }));
  }, [templatePages, mediaItems.length]);

  const pagePreviewConfigs = useMemo(() => {
    const pageMap = new Map<number, { pageIndex: number; pageLabel: string; slots: SlotConfig[] }>();
    slotConfigs.forEach((slot) => {
      if (!pageMap.has(slot.pageIndex)) {
        pageMap.set(slot.pageIndex, { pageIndex: slot.pageIndex, pageLabel: slot.pageLabel, slots: [] });
      }
      pageMap.get(slot.pageIndex)?.slots.push(slot);
    });

    return Array.from(pageMap.values()).sort((a, b) => a.pageIndex - b.pageIndex);
  }, [slotConfigs]);

  const pageSlotBounds = useMemo(() => {
    const map = new Map<number, { usesAbsoluteLayout: boolean; minX: number; maxX: number; minY: number; maxY: number }>();
    pagePreviewConfigs.forEach((page) => {
      const rawSlots = (templatePages[page.pageIndex]?.slots || []) as Array<{ x?: number; y?: number; width?: number; height?: number }>;
      const usesAbsoluteLayout = rawSlots.some((slot) => Number.isFinite(Number(slot.x)) || Number.isFinite(Number(slot.y)));
      if (!usesAbsoluteLayout) {
        map.set(page.pageIndex, { usesAbsoluteLayout: false, minX: 0, maxX: 100, minY: 0, maxY: 100 });
        return;
      }
      const xValues = rawSlots.map((slot) => Number(slot.x) || 0);
      const yValues = rawSlots.map((slot) => Number(slot.y) || 0);
      const rightValues = rawSlots.map((slot) => (Number(slot.x) || 0) + Math.max(1, Number(slot.width) || 20));
      const bottomValues = rawSlots.map((slot) => (Number(slot.y) || 0) + Math.max(1, Number(slot.height) || 20));
      map.set(page.pageIndex, {
        usesAbsoluteLayout: true,
        minX: Math.min(...xValues, 0),
        maxX: Math.max(...rightValues, 100),
        minY: Math.min(...yValues, 0),
        maxY: Math.max(...bottomValues, 100),
      });
    });
    return map;
  }, [pagePreviewConfigs, templatePages]);

  const activePreviewPage =
    pagePreviewConfigs.find((page) => page.pageIndex === selectedPreviewPage) || pagePreviewConfigs[0];

  useEffect(() => {
    if (!pagePreviewConfigs.some((page) => page.pageIndex === selectedPreviewPage)) {
      setSelectedPreviewPage(0);
    }
  }, [selectedPreviewPage, pagePreviewConfigs]);

  const persistSlotMedia = async (slot: SlotConfig, item: MediaItem | null) => {
    if (!bookAlbumId) return;
    try {
      await apiFetch(`/book-albums/${bookAlbumId}/slot`, {
        method: 'PATCH',
        body: JSON.stringify({
          pageNumber: slot.pageNumber,
          slotId: slot.slotId,
          mediaItem: item
            ? {
                ...item,
                cropTransform: mediaTransforms[item.id] || { zoom: 1, x: 0, y: 0 },
              }
            : null,
        }),
      });
    } catch (error) {
      console.error('Failed to persist slot media:', error);
    }
  };

  const moveMediaToSlot = (targetSlotIndex: number, mediaId: string) => {
    if (targetSlotIndex < 0) return;

    const sourceIndex = mediaItems.findIndex((item) => item.id === mediaId);
    if (sourceIndex === -1) return;

    const reordered = [...mediaItems];
    const [moved] = reordered.splice(sourceIndex, 1);
    const insertionIndex = sourceIndex < targetSlotIndex ? Math.max(0, targetSlotIndex - 1) : targetSlotIndex;
    reordered.splice(insertionIndex, 0, moved);

    const normalized = reordered.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
    setMediaItems(normalized);
    const slot = slotConfigs[targetSlotIndex];
    const mediaAtTarget = normalized[targetSlotIndex] || null;
    if (slot) {
      void persistSlotMedia(slot, mediaAtTarget);
    }
  };

  const moveMediaToPage = (targetPageIndex: number, mediaId: string) => {
    const targetPage = pagePreviewConfigs.find((page) => page.pageIndex === targetPageIndex);
    if (!targetPage || targetPage.slots.length === 0) return;
    moveMediaToSlot(targetPage.slots[0].index, mediaId);
    setSelectedPreviewPage(targetPageIndex);
  };

  const handleUploadToSlot = (slotIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;

      setMediaItems((prev) => {
        const next = [...prev];
        const newMedia: MediaItem = {
          id: `media-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          mediaKind: file.type.startsWith('video') ? 'video' : 'image',
          dataUrl,
          order: slotIndex + 1,
        };

        if (slotIndex >= next.length) {
          next.push(newMedia);
        } else {
          next.splice(slotIndex, 0, newMedia);
        }

        return next.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
      toast.success('Media uploaded to slot', toastStyle);
    };
    reader.readAsDataURL(file);
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
    toast.success('All images cleared', toastStyle);
  };

  const handleDragStart = (item: MediaItem) => {
    setDraggedItem(item);
    try {
      window.sessionStorage.setItem('designerDraggedMediaId', item.id);
    } catch {
      // ignore
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    try {
      window.sessionStorage.removeItem('designerDraggedMediaId');
    } catch {
      // ignore
    }
  };

  const openCropEditor = (item: MediaItem) => {
    const current = mediaTransforms[item.id] || { zoom: 1, x: 0, y: 0 };
    setCropMedia(item);
    setCropDraft(current);
  };

  const applyCropChanges = () => {
    if (!cropMedia) return;
    const nextTransforms = {
      ...mediaTransforms,
      [cropMedia.id]: cropDraft,
    };
    setMediaTransforms((prev) => ({
      ...prev,
      [cropMedia.id]: cropDraft,
    }));
    const slotIndex = mediaItems.findIndex((item) => item.id === cropMedia.id);
    const slot = slotIndex >= 0 ? slotConfigs[slotIndex] : null;
    if (slot && bookAlbumId) {
      void apiFetch(`/book-albums/${bookAlbumId}/slot`, {
        method: 'PATCH',
        body: JSON.stringify({
          pageNumber: slot.pageNumber,
          slotId: slot.slotId,
          mediaItem: {
            ...cropMedia,
            cropTransform: nextTransforms[cropMedia.id],
          },
        }),
      }).catch((error) => {
        console.error('Failed to persist crop:', error);
      });
    }
    setCropMedia(null);
  };

  const handleCropPointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsCropPanning(true);
    setCropPanStart({
      x: e.clientX,
      y: e.clientY,
      baseX: cropDraft.x,
      baseY: cropDraft.y,
    });
  };

  const handleCropPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropPanning) return;
    const dx = e.clientX - cropPanStart.x;
    const dy = e.clientY - cropPanStart.y;
    setCropDraft((prev) => ({
      ...prev,
      x: cropPanStart.baseX + dx,
      y: cropPanStart.baseY + dy,
    }));
  };

  const stopCropPanning = () => {
    setIsCropPanning(false);
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
    setBookAlbumId(null);
    setAlbumSuggestions([]);
    setTemplateSuggestions([]);
    setIsAlbumDropdownOpen(false);
    setIsTemplateDropdownOpen(false);
    setIsBookModalOpen(false);
    setPreviewMedia(null);
    setSelectedPreviewPage(0);
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
          mediaTransforms,
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
        <div className="flex flex-col gap-6">
          {/* Top Row - Selection Panel and Book Panel side by side */}
          <div className="flex gap-6">
          {/* SELECTION PANEL - Left Side */}
          <div className="w-72 shrink-0">
            <div className="w-full p-5 rounded-2xl shadow-lg bg-white border-l-4 border-[#b10e6b] h-fit sticky top-6">
              <h3 className="text-[11px] tracking-widest uppercase text-[#b10e6b] font-bold mb-4">SELECTION PANEL</h3>
              
              <div className="space-y-4">
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
          </div>

        {/* BOOK PANEL - Right Side */}
        <div className="min-w-104 flex-1">
  {/* Template Book Preview (flip book with curate images in slots) */}
  {selectedTemplateData ? (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 h-fit">
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
          <div className="w-full h-64 rounded-xl overflow-hidden">
            <div className="scale-[0.6] origin-top-left" style={{ width: '166.67%', height: '166.67%' }}>
            <TemplateBookFlip
              template={selectedTemplateData}
              mediaItems={mediaItems}
              activeContentPage={activePreviewPage?.pageIndex || 0}
              coverPhoto={selectedAlbumData?.coverPhoto}
              coverPhotoName={selectedAlbumData?.albumName}
              coverWeddingDate={selectedAlbumData?.weddingDate}
              variant="inline"
            />
            </div>
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
        </div>
        </div>

        {/* NARRATIVE FLOW - Full Width Below */}
        <div className="w-full">
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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
              <div className="rounded-2xl border border-[#f0e2e6] bg-linear-to-br from-[#fff8f7] to-[#fef6f6] p-4 shadow-inner">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">Template</p>
                  <p className="text-xs font-semibold text-[#54474d]">
                    {Math.min(mediaItems.length, slotConfigs.length)} / {slotConfigs.length} filled
                  </p>
                </div>
                <div
                  className={`relative min-h-96 rounded-2xl border border-[#e9d8df] bg-white p-3 ${
                    pageSlotBounds.get(activePreviewPage?.pageIndex || 0)?.usesAbsoluteLayout
                      ? 'overflow-hidden'
                      : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {(activePreviewPage?.slots || []).map((slot) => {
                    const item = mediaItems[slot.index];
                    const transform = item ? mediaTransforms[item.id] || { zoom: 1, x: 0, y: 0 } : { zoom: 1, x: 0, y: 0 };
                    const rawSlot = templatePages[slot.pageIndex]?.slots?.find((candidate) => (candidate.id || '') === slot.slotId);
                    const rawPage = templatePages[slot.pageIndex] as { accent?: string; pageColor?: string } | undefined;
                    const bounds = pageSlotBounds.get(slot.pageIndex);
                    const usesAbsolute = Boolean(bounds?.usesAbsoluteLayout && rawSlot);
                    const leftPct = usesAbsolute
                      ? (((Number(rawSlot?.x) || 0) - (bounds?.minX || 0)) / Math.max(1, (bounds?.maxX || 100) - (bounds?.minX || 0))) * 100
                      : 0;
                    const topPct = usesAbsolute
                      ? (((Number(rawSlot?.y) || 0) - (bounds?.minY || 0)) / Math.max(1, (bounds?.maxY || 100) - (bounds?.minY || 0))) * 100
                      : 0;
                    const widthPct = usesAbsolute
                      ? (Math.max(1, Number(rawSlot?.width) || 10) / Math.max(1, (bounds?.maxX || 100) - (bounds?.minX || 0))) * 100
                      : undefined;
                    const heightPct = usesAbsolute
                      ? (Math.max(1, Number(rawSlot?.height) || 10) / Math.max(1, (bounds?.maxY || 100) - (bounds?.minY || 0))) * 100
                      : undefined;

                    return (
                      <div
                        key={`${slot.pageLabel}-${slot.slotLabel}-${slot.index}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const transferId =
                            e.dataTransfer.getData('text/plain') ||
                            e.dataTransfer.getData('application/x-media-id') ||
                            draggedItem?.id ||
                            (() => {
                              try {
                                return window.sessionStorage.getItem('designerDraggedMediaId') || '';
                              } catch {
                                return '';
                              }
                            })();
                          if (transferId) {
                            moveMediaToSlot(slot.index, transferId);
                          }
                        }}
                        className={`group overflow-hidden rounded-xl border border-[#e1bec4] bg-white ${
                          usesAbsolute ? 'absolute' : 'relative'
                        }`}
                        title={`${slot.pageLabel} · ${slot.slotLabel}`}
                        style={
                          usesAbsolute
                            ? {
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                width: `${Math.max(8, widthPct || 20)}%`,
                                height: `${Math.max(12, heightPct || 20)}%`,
                              }
                            : undefined
                        }
                      >
                        {!item ? (
                          <div className="m-2 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#e1bec4] text-[10px] font-semibold uppercase tracking-wider text-[#9f8a90]" style={{ backgroundColor: rawPage?.pageColor || rawPage?.accent || '#fff8fb' }}>
                            <button
                              type="button"
                              onClick={() => slotUploadInputRefs.current[slot.slotId]?.click()}
                              className="inline-flex items-center gap-1 rounded-full border border-[#e1bec4] bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b]"
                            >
                              <Upload size={12} />
                              Upload
                            </button>
                            <input
                              ref={(el) => {
                                slotUploadInputRefs.current[slot.slotId] = el;
                              }}
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(e) => {
                                handleUploadToSlot(slot.index, e.target.files);
                                e.target.value = '';
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="relative m-2 h-32 cursor-move overflow-hidden rounded-lg bg-[#f7ecef]"
                            draggable
                            onDragStart={(e) => {
                              handleDragStart(item);
                              e.dataTransfer.setData('text/plain', item.id);
                              e.dataTransfer.setData('application/x-media-id', item.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={handleDragEnd}
                          >
                            {item.mediaKind === 'image' && hasMediaSrc(item.dataUrl) ? (
                              <img
                                src={item.dataUrl}
                                alt={item.fileName}
                                className="h-full w-full object-contain transition-transform duration-200"
                                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})` }}
                              />
                            ) : hasMediaSrc(item.dataUrl) ? (
                              <video src={item.dataUrl} className="h-full w-full object-contain" muted playsInline preload="metadata" controls={false} />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-300">
                                <span className="text-[10px] font-bold tracking-widest text-gray-600">VIDEO</span>
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMedia(item);
                                }}
                                className="rounded-full bg-white/90 p-2 shadow-lg transition hover:scale-105"
                                title="View"
                              >
                                <Eye size={14} className="text-[#211A1B]" />
                              </button>
                              {item.mediaKind === 'image' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCropEditor(item);
                                  }}
                                  className="rounded-full bg-white/90 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#211A1B] shadow-lg transition hover:scale-105"
                                  title="Crop"
                                >
                                  Crop
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMedia(item.id);
                                }}
                                className="rounded-full bg-red-500/90 p-2 shadow-lg transition hover:scale-105 hover:bg-red-600"
                                title="Remove"
                              >
                                <Trash2 size={14} className="text-white" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#f0e2e6] bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">Pages</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pagePreviewConfigs.map((page) => (
                    <button
                      key={`preview-page-${page.pageIndex}`}
                      type="button"
                      onClick={() => setSelectedPreviewPage(page.pageIndex)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-all ${
                        selectedPreviewPage === page.pageIndex
                          ? 'border-[#b10e6b] bg-[#fff0f4] text-[#b10e6b] shadow-sm'
                          : 'border-[#e1bec4] bg-white text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b]'
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const transferId =
                          e.dataTransfer.getData('text/plain') ||
                          e.dataTransfer.getData('application/x-media-id') ||
                          draggedItem?.id ||
                          (() => {
                            try {
                              return window.sessionStorage.getItem('designerDraggedMediaId') || '';
                            } catch {
                              return '';
                            }
                          })();
                        if (transferId) {
                          moveMediaToPage(page.pageIndex, transferId);
                        }
                      }}
                    >{page.pageLabel}</button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {pagePreviewConfigs.map((page) => (
                    <div key={`page-row-${page.pageIndex}`} className="rounded-xl border border-[#ecdbe2] bg-[#fff8f9] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8d7d81]">{page.pageLabel}</p>
                        <p className="text-[9px] text-[#9f8a90]">{page.slots.filter((slot) => Boolean(mediaItems[slot.index])).length}/{page.slots.length}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {page.slots.slice(0, 8).map((slot) => {
                          const item = mediaItems[slot.index];
                          return (
                            <div key={`preview-${page.pageIndex}-${slot.slotId}`} className="aspect-square overflow-hidden rounded-md border border-[#ecdbe2] bg-white">
                              {item?.dataUrl ? (
                                item.mediaKind === 'video' ? (
                                  <video src={item.dataUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                ) : (
                                  <img src={item.dataUrl} alt={item.fileName} className="h-full w-full object-cover" />
                                )
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[8px] font-bold uppercase tracking-[0.12em] text-[#c1aeb3]">Empty</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
        <span className="text-[10px] text-[#54474d]"></span>
      </div>
    )}
  </div>
        </div>

  {/* Modals */}
  {isBookModalOpen && selectedTemplateData && (
    <FullscreenBook
      template={selectedTemplateData}
      mediaItems={mediaItems}
      mediaTransforms={mediaTransforms}
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

  {cropMedia && cropMedia.mediaKind === 'image' && hasMediaSrc(cropMedia.dataUrl) && (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ead5dc] px-4 py-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#211A1B]">Adjust Crop</p>
            <p className="max-w-[70vw] truncate text-xs text-[#7a6268]">{cropMedia.fileName}</p>
          </div>
          <button
            type="button"
            onClick={() => setCropMedia(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e1bec4] text-[#7a6268] transition hover:border-[#b10e6b] hover:text-[#b10e6b]"
            aria-label="Close crop editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-hidden rounded-xl border border-[#ead5dc] bg-[#111]">
            <div
              className={`relative h-88 overflow-hidden ${isCropPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleCropPointerDown}
              onMouseMove={handleCropPointerMove}
              onMouseUp={stopCropPanning}
              onMouseLeave={stopCropPanning}
            >
              <img
                src={cropMedia.dataUrl}
                alt={cropMedia.fileName}
                className="h-full w-full object-contain select-none"
                draggable={false}
                style={{ transform: `translate(${cropDraft.x}px, ${cropDraft.y}px) scale(${cropDraft.zoom})` }}
              />
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-[#54474d]">
              Zoom
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={cropDraft.zoom}
                onChange={(e) => setCropDraft((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs font-semibold text-[#54474d]">
              Horizontal (drag image too)
              <input
                type="range"
                min="-140"
                max="140"
                step="1"
                value={cropDraft.x}
                onChange={(e) => setCropDraft((prev) => ({ ...prev, x: Number(e.target.value) }))}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs font-semibold text-[#54474d]">
              Vertical
              <input
                type="range"
                min="-140"
                max="140"
                step="1"
                value={cropDraft.y}
                onChange={(e) => setCropDraft((prev) => ({ ...prev, y: Number(e.target.value) }))}
                className="mt-1 w-full"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCropDraft({ zoom: 1, x: 0, y: 0 })}
                className="rounded-lg border border-[#e1bec4] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#7a6268]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyCropChanges}
                className="rounded-lg bg-[#b10e6b] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
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