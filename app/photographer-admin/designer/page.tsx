'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { apiFetch, getUser, handleAuthError } from '@/lib/api';
import { Eye, Trash2, Upload, Maximize2, X, Edit3, ImagePlus } from 'lucide-react';
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
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }>;
    pageColor?: string;
    accent?: string;
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
  if (response.status === 401) {
    return {
      success: false,
      message: 'Unauthorized access. Please log in again.',
    };
  }

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    const htmlResponse = rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html');
    return {
      success: false,
      message: htmlResponse
        ? 'Server returned HTML instead of JSON. Check API URL/backend server and login session.'
        : rawText || 'Invalid API response format.',
    };
  }
};

const hasMediaSrc = (value?: string) => Boolean(value && value.trim());

type SlotMediaArray = Array<MediaItem | null>;

const getSlotMediaItem = (items: SlotMediaArray, slotIndex: number): MediaItem | null => {
  const item = items[slotIndex];
  return item && hasMediaSrc(item.dataUrl) ? item : null;
};

const padSlotMediaArray = (items: SlotMediaArray, slotCount: number): SlotMediaArray => {
  const next = items.map((item) => item ?? null);
  while (next.length < slotCount) next.push(null);
  return next.length > slotCount ? next.slice(0, slotCount) : next;
};

const countFilledSlots = (items: SlotMediaArray, slots: SlotConfig[]) =>
  slots.filter((slot) => Boolean(getSlotMediaItem(items, slot.index))).length;

const compactMediaItems = (items: SlotMediaArray): MediaItem[] =>
  items.filter((item): item is MediaItem => Boolean(item && hasMediaSrc(item.dataUrl)));

interface MediaItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaKind: string;
  dataUrl?: string;
  order?: number;
  finalized?: boolean;
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
  const [mediaItems, setMediaItems] = useState<SlotMediaArray>([]);
  const [bookAlbumId, setBookAlbumId] = useState<string | null>(null);
  const [isSyncingBook, setIsSyncingBook] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [mediaTransforms, setMediaTransforms] = useState<Record<string, MediaTransform>>({});
  const [cropMedia, setCropMedia] = useState<MediaItem | null>(null);
  const [cropDraft, setCropDraft] = useState<MediaTransform>({ zoom: 1, x: 0, y: 0 });
  const [selectedPreviewPage, setSelectedPreviewPage] = useState(0);
  const [isCropPanning, setIsCropPanning] = useState(false);
  const [cropPanStart, setCropPanStart] = useState({ x: 0, y: 0, baseX: 0, baseY: 0 });
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [endPhotoPreview, setEndPhotoPreview] = useState<string | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const endPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [coverPageMedia, setCoverPageMedia] = useState<MediaItem | null>(null);
  const [endPageMedia, setEndPageMedia] = useState<MediaItem | null>(null);
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
    setCoverPhotoPreview(selectedAlbumData?.coverPhoto || null);
  }, [selectedAlbumData?.coverPhoto]);

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setCoverPhotoPreview(dataUrl);
      if (selectedAlbumData) {
        setSelectedAlbumData({ ...selectedAlbumData, coverPhoto: dataUrl });
      }

      if (selectedAlbum && selectedTemplate) {
        setTimeout(() => {
          void autoSaveCurateData(mediaItems, { coverPhoto: dataUrl });
        }, 100);
      }

      toast.success('Cover photo changed (auto-saving...)', toastStyle);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearCoverPhoto = () => {
    setCoverPhotoPreview(null);
    if (selectedAlbumData) {
      setSelectedAlbumData({ ...selectedAlbumData, coverPhoto: '' });
    }

    if (selectedAlbum && selectedTemplate) {
      setTimeout(() => {
        void autoSaveCurateData(mediaItems, { coverPhoto: '' });
      }, 100);
    }

    toast.success('Cover photo removed (auto-saving...)', toastStyle);
  };

  const handleEndPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setEndPhotoPreview(dataUrl);
      setEndPageMedia({
        id: `end-photo-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        mediaKind: 'image',
        dataUrl,
      });

      if (selectedAlbum && selectedTemplate) {
        setTimeout(() => {
          void autoSaveCurateData(mediaItems, {
            endPhoto: dataUrl,
            endPhotoName: file.name,
          });
        }, 100);
      }

      toast.success('End photo uploaded (auto-saving...)', toastStyle);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearEndPhoto = () => {
    setEndPhotoPreview(null);
    setEndPageMedia(null);

    if (selectedAlbum && selectedTemplate) {
      setTimeout(() => {
        void autoSaveCurateData(mediaItems, {
          endPhoto: '',
          endPhotoName: '',
        });
      }, 100);
    }

    toast.success('End photo removed (auto-saving...)', toastStyle);
  };

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
        // toast.error(error instanceof Error ? error.message : 'Failed to load albums', toastStyle);
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

    // Load from session storage if available
    try {
      const savedState = sessionStorage.getItem('designerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.selectedAlbum) setSelectedAlbum(state.selectedAlbum);
        if (state.selectedTemplate) setSelectedTemplate(state.selectedTemplate);
        if (state.albumSearch) setAlbumSearch(state.albumSearch);
        if (state.templateSearch) setTemplateSearch(state.templateSearch);
        if (state.mediaItems) setMediaItems(state.mediaItems);
        if (state.coverPhotoPreview) setCoverPhotoPreview(state.coverPhotoPreview);
        if (state.endPhotoPreview) setEndPhotoPreview(state.endPhotoPreview);
        if (state.mediaTransforms) setMediaTransforms(state.mediaTransforms);
        if (state.albumType) setAlbumType(state.albumType);
      }
    } catch (e) {
      console.debug('Failed to restore designer state:', e);
    }

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

  // Save designer state to sessionStorage
  useEffect(() => {
    try {
      const state = {
        selectedAlbum,
        selectedTemplate,
        albumSearch,
        templateSearch,
        mediaItems,
        coverPhotoPreview,
        endPhotoPreview,
        mediaTransforms,
        albumType,
      };
      sessionStorage.setItem('designerState', JSON.stringify(state));
    } catch (e) {
      console.debug('Failed to save designer state:', e);
    }
  }, [selectedAlbum, selectedTemplate, albumSearch, templateSearch, mediaItems, coverPhotoPreview, endPhotoPreview, mediaTransforms, albumType]);

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
      // Detect video by mediaKind OR fileType as fallback
      mediaKind: item.mediaKind === 'video' 
        ? 'video' 
        : (item.fileType?.startsWith('video') ? 'video' : (item.mediaKind || 'image')),
      dataUrl: item.dataUrl || '',
      order: item.order ?? index + 1,
    }));

    setMediaItems(normalizedMedia);
    toast.success('Media loaded from curate', toastStyle);
    return normalizedMedia;
  };

  const syncBookAlbum = async (curateId: string, templateId: string) => {
    if (!curateId || !templateId || compactMediaItems(mediaItems).length === 0) return;

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
    
    // Show which album was selected
    const statusBadge = album.status === 'saved' || album.status === 'published' ? '✓ Saved' : '◆ Draft';
    toast.info(`${statusBadge} "${album.albumName}" loaded (${album.mediaItems?.length || 0} items)`, toastStyle);
    
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
    
    // Show template selected with slot info
    const slotCount = (template.pages || []).reduce((sum, page) => sum + (page.slots?.length || 0), 0) + (template.slots?.length || 0);
    toast.info(`✓ Template "${template.name}" selected (${slotCount} slots)`, toastStyle);
    
    if (selectedAlbum && compactMediaItems(mediaItems).length > 0) {
      void syncBookAlbum(selectedAlbum, template._id);
      // Auto-save on template change
      void autoSaveCurateData(mediaItems);
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

    const fallbackSlots = Math.max(12, compactMediaItems(mediaItems).length);
    return Array.from({ length: fallbackSlots }, (_, index) => ({
      index,
      pageIndex: Math.floor(index / 6),
      pageNumber: Math.floor(index / 6) + 1,
      pageLabel: 'Auto Layout',
      slotId: `auto-slot-${index + 1}`,
      slotLabel: `Slot ${index + 1}`,
    }));
  }, [templatePages, mediaItems]);

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

  const filledSlotCount = useMemo(
    () => countFilledSlots(mediaItems, slotConfigs),
    [mediaItems, slotConfigs]
  );

  const slotAlignedBookMedia = useMemo(
    () =>
      slotConfigs.map((slot, index) => {
        const item = getSlotMediaItem(mediaItems, slot.index);
        if (item) return item;
        return {
          id: `empty-${slot.slotId}`,
          fileName: '',
          fileType: '',
          fileSize: 0,
          mediaKind: 'image',
          dataUrl: '',
          order: index + 1,
        };
      }),
    [slotConfigs, mediaItems]
  );

  const templateAccent = selectedTemplateData?.accent || '#b10e6b';

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

    setMediaItems((prev) => {
      const next = padSlotMediaArray(prev, slotConfigs.length);
      const sourceIndex = next.findIndex((item) => item?.id === mediaId);
      if (sourceIndex === -1) return prev;

      const moved = next[sourceIndex];
      if (!moved) return prev;

      const displaced = next[targetSlotIndex];
      next[sourceIndex] = displaced ?? null;
      next[targetSlotIndex] = moved;

      const normalized = next.map((item, index) => (item ? { ...item, order: index + 1 } : null));
      const slot = slotConfigs[targetSlotIndex];
      if (slot) {
        void persistSlotMedia(slot, getSlotMediaItem(normalized, targetSlotIndex));
      }
      
      // Auto-save to DB on drag/drop
      if (selectedAlbum && selectedTemplate) {
        void autoSaveCurateData(normalized);
      }
      
      return normalized;
    });
    toast.success('✓ Media rearranged (auto-saving...)', toastStyle);
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

    const newMedia: MediaItem = {
      id: `media-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      mediaKind: file.type.startsWith('video') ? 'video' : 'image',
      dataUrl,
      order: slotIndex + 1,
    };

    setMediaItems((prev) => {
      const next = padSlotMediaArray(prev, slotConfigs.length);
      next[slotIndex] = newMedia;

      const normalized = next.map((item, index) => (item ? { ...item, order: index + 1 } : null));
      const slot = slotConfigs[slotIndex];
      if (slot) {
        void persistSlotMedia(slot, newMedia);
      }

      if (selectedAlbum && selectedTemplate) {
        setTimeout(() => {
          void autoSaveCurateData(normalized);
        }, 100);
      }

      return normalized;
    });

    toast.success('✓ Slot image added (auto-saving...)', toastStyle);
  };

  reader.readAsDataURL(file);
};
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
  let hasNewMedia = false;

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
        order: compactMediaItems(mediaItems).length + 1,
      };

      setMediaItems((prev) => {
        const next = padSlotMediaArray(prev, slotConfigs.length);
        const firstEmpty = next.findIndex((entry) => !entry || !hasMediaSrc(entry.dataUrl));
        const targetIndex = firstEmpty >= 0 ? firstEmpty : next.length;
        
        const padded = padSlotMediaArray(next, targetIndex + 1);
        padded[targetIndex] = newMedia;

        const normalized = padded.map((item, index) => 
          item ? { ...item, order: index + 1 } : null
        );

        if (selectedAlbum && selectedTemplate) {
          setTimeout(() => void autoSaveCurateData(normalized), 150);
        }

        return normalized;
      });

      hasNewMedia = true;
    };
    reader.readAsDataURL(file);
  }

  toast.success('Images added (Auto Saving...)', toastStyle);
};

 const clearSlotMedia = (slotIndex: number) => {
  setMediaItems((prev) => {
    const next = padSlotMediaArray(prev, slotConfigs.length);
    if (slotIndex < 0 || slotIndex >= next.length) return prev;

    next[slotIndex] = null;
    const normalized = next.map((item, index) => (item ? { ...item, order: index + 1 } : null));

    const slot = slotConfigs[slotIndex];
    if (slot) {
      void persistSlotMedia(slot, null);
    }

    if (selectedAlbum && selectedTemplate) {
      setTimeout(() => {
        void autoSaveCurateData(normalized);
      }, 100);
    }

    return normalized;
  });

  toast.success('✓ Slot cleared (auto-saving...)', toastStyle);
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
    setMediaTransforms(nextTransforms);

    const slotIndex = mediaItems.findIndex((item) => item?.id === cropMedia.id);
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

    if (selectedAlbum && selectedTemplate) {
      setTimeout(() => {
        void autoSaveCurateData(mediaItems, { transforms: nextTransforms });
      }, 100);
    }

    setCropMedia(null);
    toast.success('✓ Crop applied (auto-saving...)', toastStyle);
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
    // Check if there's any data to discard
    const hasData = selectedAlbum || selectedTemplate || mediaItems.length > 0 || coverPhotoPreview;
    
    if (!hasData) {
      toast.info('No data to discard', toastStyle);
      return;
    }

    // Clear all designer state but preserve draft status in DB
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
    setCoverPhotoPreview(null);
    setEndPhotoPreview(null);
    setEndPageMedia(null);
    setCropMedia(null);
    setMediaTransforms({});
    sessionStorage.removeItem('bookAlbumId');
    sessionStorage.removeItem('designerState');
    
    // Show confirmation
    toast.success('✓ Designer cleared (your curate draft is safe)', toastStyle);
  };

  const saveCurateDraft = async (
    showOnMainSite = false,
    saveStatus: 'save_draft' | 'saved' = 'saved'
  ) => {
    if (!selectedAlbum || !selectedTemplate) {
      toast.error('Please select album and template before saving', toastStyle);
      return false;
    }

    if (filledSlotCount === 0 && saveStatus === 'saved') {
      toast.error('Please add media before saving', toastStyle);
      return false;
    }

    setIsSaving(true);
    try {
      const compactMedia = compactMediaItems(mediaItems);
      const curatePayload = {
        curateId: selectedAlbum,
        albumName: selectedAlbumData?.albumName || `Album - ${new Date().toLocaleDateString()}`,
        weddingDate: selectedAlbumData?.weddingDate || null,
        coverPhoto: coverPhotoPreview || '',
        coverPhotoName: selectedAlbumData?.albumName || '',
        mediaItems: compactMedia.map((item, index) => ({
          id: item.id,
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
          mediaKind: item.mediaKind,
          dataUrl: item.dataUrl || '',
          order: index + 1,
        })),
        status: saveStatus,
        selectedTemplate: selectedTemplate,
        selectedAlbumId: selectedAlbum,
        mediaTransforms,
        endPhoto: endPhotoPreview || '',
        endPhotoName: endPageMedia?.fileName || '',
        albumType,
      };

      try {
        const curateRes = await apiFetch('/curate', {
          method: 'POST',
          body: JSON.stringify(curatePayload),
        });

        if (curateRes.status === 401) {
          handleAuthError(curateRes);
          return false;
        }

        const curateResult = await parseApiJson(curateRes);
        if (!curateRes.ok || !curateResult.success) {
          console.warn('Curate update warning:', curateResult.message);
        } else {
          toast.success(`✓ Curate album ${saveStatus === 'saved' ? 'saved' : 'draft saved'}`, toastStyle);
        }
      } catch (error) {
        console.error('Failed to update curate album:', error);
        toast.warn('Curate update skipped, saving book album...', toastStyle);
      }

      const response = await apiFetch('/book-albums', {
        method: 'POST',
        body: JSON.stringify({
          curateId: selectedAlbum,
          templateId: selectedTemplate,
          albumType,
          mainSiteShowStatus: showOnMainSite,
          mediaTransforms,
          endPhoto: endPhotoPreview || '',
          endPhotoName: endPageMedia?.fileName || '',
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return false;
      }

      const result = await parseApiJson(response);
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save design');
      }

      if (result.success) {
        toast.success('✓ Book album saved with your design!', toastStyle);
        const id = result.bookAlbum?._id;
        if (id) {
          setBookAlbumId(id);
          sessionStorage.setItem('bookAlbumId', id);
        }
        sessionStorage.removeItem('designerState');
        return true;
      }

      throw new Error(result.message || 'Failed to save design');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save', toastStyle);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save curate data on media changes
  const autoSaveCurateData = async (
    currentMediaItems: SlotMediaArray,
    options: {
      coverPhoto?: string;
      transforms?: Record<string, MediaTransform>;
      endPhoto?: string;
      endPhotoName?: string;
      status?: 'save_draft' | 'saved';
    } = {}
  ) => {
    if (!selectedAlbum || !selectedTemplate) return;

    setIsAutoSaving(true);
    try {
      const compactMedia = compactMediaItems(currentMediaItems);
      const coverPhoto = options.coverPhoto ?? coverPhotoPreview ?? '';
      const endPhoto = options.endPhoto ?? endPhotoPreview ?? '';
      const endPhotoName = options.endPhotoName ?? endPageMedia?.fileName ?? '';
      const transforms = options.transforms ?? mediaTransforms;
      const shouldSave =
        compactMedia.length > 0 ||
        options.coverPhoto !== undefined ||
        options.endPhoto !== undefined ||
        Boolean(coverPhoto) ||
        Boolean(endPhoto);

      if (!shouldSave) {
        return;
      }

      const payload = {
        curateId: selectedAlbum,
        albumName: selectedAlbumData?.albumName || 'Album',
        weddingDate: selectedAlbumData?.weddingDate || null,
        coverPhoto,
        coverPhotoName: selectedAlbumData?.albumName || '',
        mediaItems: compactMedia.map((item, index) => ({
          id: item.id,
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
          mediaKind: item.mediaKind,
          dataUrl: item.dataUrl || '',
          order: index + 1,
        })),
        status: options.status ?? 'save_draft',
        selectedTemplate: selectedTemplate,
        selectedAlbumId: selectedAlbum,
        mediaTransforms: transforms,
        endPhoto,
        endPhotoName,
        albumType,
      };

      const response = await apiFetch('/curate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await parseApiJson(response);
      if (!response.ok || !result.success) {
        console.debug('Auto-save draft warning:', result.message);
      }
    } catch (error) {
      console.debug('Auto-save error (non-critical):', error);
    } finally {
      setIsAutoSaving(false);
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
      <div className="px-4 md:px-12 py-6 md:py-8 bg-gradient-to-r from-[#FFF1F3] to-[#FFF8F8]">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
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
          {/* Workflow Progress */}
          {(selectedAlbum || selectedTemplate || filledSlotCount > 0) && (
            <div className="p-4 bg-white rounded-xl border border-[#f3d6df] shadow-sm text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#b10e6b] mb-2">Progress</p>
              <div className="space-y-1.5 text-xs">
                <div className={`flex items-center gap-1.5 ${selectedAlbum ? 'text-green-600 font-semibold' : 'text-[#8d7d81]'}`}>
                  {selectedAlbum ? '✓' : '○'} Album Selected
                </div>
                <div className={`flex items-center gap-1.5 ${selectedTemplate ? 'text-green-600 font-semibold' : 'text-[#8d7d81]'}`}>
                  {selectedTemplate ? '✓' : '○'} Template Selected
                </div>
                <div className={`flex items-center gap-1.5 ${filledSlotCount > 0 ? 'text-green-600 font-semibold' : 'text-[#8d7d81]'}`}>
                  {filledSlotCount > 0 ? '✓' : '○'} Media Added ({filledSlotCount})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-9 py-6 overflow-hidden">
        <div className="flex flex-col gap-6">
          {/* Top Row - Selection Panel and Book Panel side by side */}
          <div className="flex gap-6">
          {/* SELECTION PANEL - Left Side */}
          <div className="w-72 shrink-0">
            <div className="w-full p-5 rounded-2xl shadow-lg bg-white border-l-4 border-[#b10e6b] h-full">
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 h-full">
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

      <div className="p-3 bg-[#FFF8F8]">
        {filledSlotCount > 0 || selectedAlbumData?.coverPhoto ? (
          <div className="w-full max-w-md h-64 rounded-xl overflow-hidden mx-auto">
            <div className="scale-50 origin-top-left" style={{ width: '200%', height: '200%' }}>
            <TemplateBookFlip
              template={selectedTemplateData}
              mediaItems={slotAlignedBookMedia}
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
  <div className="bg-white min-h-44 rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
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
        {filledSlotCount > 0 && (
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
      {filledSlotCount === 0 ? (
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
        <div className="w-full space-y-4">
            <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex w-full shrink-0 flex-col rounded-2xl border border-[#f0e2e6] bg-white p-3 xl:w-56">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8d7d81]">Cover Photo</div>
                <div className="overflow-hidden rounded-3xl border-2 border-dashed border-[#e5c5d4] bg-[#fff8fb] p-1">
                  <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-[#fbf3f7]">
                    {coverPhotoPreview || selectedAlbumData?.coverPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <>
                        <img
                          src={coverPhotoPreview || selectedAlbumData?.coverPhoto || ''}
                          alt="Cover"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => coverPhotoInputRef.current?.click()}
                            className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#5f4c56] shadow-sm hover:bg-white"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={clearCoverPhoto}
                            className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#b10e6b] shadow-sm hover:bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => coverPhotoInputRef.current?.click()}
                          className="rounded-full border-2 border-dashed border-[#e5c5d4] bg-white px-4 py-2 text-[10px] font-semibold text-[#b10e6b] hover:border-[#b10e6b] hover:bg-[#fff0f4]"
                        >
                          Upload Cover
                        </button>
                        <p className="text-[9px] text-[#8d7d81]">Click to select photo</p>
                      </div>
                    )}
                    <input
                      ref={(el) => {
                        coverPhotoInputRef.current = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverPhotoChange}
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-[#7a6268]">
                  <p className="font-semibold text-[#211A1B] truncate">{selectedAlbumData?.albumName || 'No album'}</p>
                  <p className="text-[10px]" title={selectedAlbumData?._id}>ID: {selectedAlbumData?._id?.substring(0, 12) || compactMediaItems(mediaItems)[0]?.id?.substring(0, 12) || '-'}...</p>
                </div>
              </div>

              {/* End Photo Section */}
              <div className="flex w-full shrink-0 flex-col rounded-2xl border border-[#f0e2e6] bg-white p-3 xl:w-56">
                <div className="mb-3 flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8d7d81]">End Photo</span>
                  <span className="text-[8px] font-semibold text-[#b10e6b]">(Optional)</span>
                </div>
                <div className="overflow-hidden rounded-3xl border-2 border-dashed border-[#e5c5d4] bg-[#fff8fb] p-1">
                  <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-[#fbf3f7]">
                    {endPhotoPreview ? (
                      <>
                        <img
                          src={endPhotoPreview}
                          alt="End Photo"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => endPhotoInputRef.current?.click()}
                            className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#5f4c56] shadow-sm hover:bg-white"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={clearEndPhoto}
                            className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#b10e6b] shadow-sm hover:bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => endPhotoInputRef.current?.click()}
                          className="rounded-full border-2 border-dashed border-[#e5c5d4] bg-white px-4 py-2 text-[10px] font-semibold text-[#b10e6b] hover:border-[#b10e6b] hover:bg-[#fff0f4]"
                        >
                          Upload End Photo
                        </button>
                        <p className="text-[9px] text-[#8d7d81]">Click to select photo (optional)</p>
                      </div>
                    )}
                    <input
                      ref={(el) => {
                        endPhotoInputRef.current = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEndPhotoChange}
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-[#7a6268]">
                  <p className="font-semibold text-[#211A1B]">End Page</p>
                  <p className="text-[10px]">Photographer details will appear here</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#ebe7e8] bg-[#fffdfd] p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#7f6f74]">Template</p>
                  <p className="text-[11px] font-medium text-[#7a6d72]">
                    {filledSlotCount} / {slotConfigs.length} filled
                  </p>
                </div>
                <div
                  className="mx-auto w-full max-w-sm rounded-2xl border border-[#ece8e9] bg-white p-3 shadow-sm"
                  style={{
                    background: `linear-gradient(180deg, ${templateAccent}29 0%, #fffdfd 24%, #fff8fb 72%, ${templateAccent}1a 100%)`,
                  }}
                >
                  <div
                    className={`relative w-full rounded-[1.1rem] border border-[#f2e8ec] bg-white ${
                      pageSlotBounds.get(activePreviewPage?.pageIndex || 0)?.usesAbsoluteLayout
                        ? 'aspect-3/4 overflow-hidden'
                        : 'min-h-48 grid auto-rows-[minmax(80px,1fr)] grid-cols-2 gap-2 p-2'
                    }`}
                    style={{ backgroundColor: templatePages[activePreviewPage?.pageIndex]?.pageColor || undefined }}
                  >
                    {(activePreviewPage?.slots || []).map((slot) => {
                      const item = getSlotMediaItem(mediaItems, slot.index);
                      const transform = item ? mediaTransforms[item.id] || { zoom: 1, x: 0, y: 0 } : { zoom: 1, x: 0, y: 0 };
                      const rawSlot = templatePages[slot.pageIndex]?.slots?.find((candidate) => (candidate.id || '') === slot.slotId);
                      const rawPage = templatePages[slot.pageIndex] as { accent?: string; pageColor?: string } | undefined;
                      const bounds = pageSlotBounds.get(slot.pageIndex);
                      const usesAbsolute = Boolean(bounds?.usesAbsoluteLayout && rawSlot);
                      const colSpan = Math.max(1, Math.min(2, Number(rawSlot?.width) || 1));
                      const rowSpan = Math.max(1, Math.min(3, Number(rawSlot?.height) || 1));
                      const left = Number.isFinite(Number(rawSlot?.x)) ? Number(rawSlot?.x) : 0;
                      const top = Number.isFinite(Number(rawSlot?.y)) ? Number(rawSlot?.y) : 0;
                      const width = Math.max(1, Number.isFinite(Number(rawSlot?.width)) ? Number(rawSlot?.width) : 1);
                      const height = Math.max(1, Number.isFinite(Number(rawSlot?.height)) ? Number(rawSlot?.height) : 1);

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
                          className={`group overflow-hidden rounded-2xl border bg-[#faf8f9] ${
                            usesAbsolute ? 'absolute cursor-pointer' : 'relative min-h-28'
                          }`}
                          title={`${slot.pageLabel} · ${slot.slotLabel}`}
                          style={{
                            borderColor: `${templateAccent}33`,
                            gridColumn: usesAbsolute ? undefined : `span ${colSpan}`,
                            gridRow: usesAbsolute ? undefined : `span ${rowSpan}`,
                            left: usesAbsolute ? `${left}%` : undefined,
                            top: usesAbsolute ? `${top}%` : undefined,
                            width: usesAbsolute ? `${width}%` : undefined,
                            height: usesAbsolute ? `${height}%` : undefined,
                            backgroundColor: rawPage?.pageColor || undefined,
                          }}
                        >
                          {!item ? (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-[#e1bec4]/80 bg-[#fff8fb]"
                              style={{ backgroundColor: rawPage?.pageColor || '#fff8fb' }}
                            >
                              <ImagePlus size={22} className="text-[#c1aeb3]" />
                              <button
                                type="button"
                                onClick={() => slotUploadInputRefs.current[slot.slotId]?.click()}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#e1bec4] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b]"
                              >
                                <Upload size={14} />
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
                              className="absolute inset-0 cursor-move overflow-hidden"
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
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-200"
                                  style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})` }}
                                />
                              ) : hasMediaSrc(item.dataUrl) ? (
                                <video src={item.dataUrl} className="absolute inset-0 h-full w-full object-cover" muted playsInline preload="metadata" controls={false} />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-300">
                                  <span className="text-[10px] font-bold tracking-widest text-gray-600">VIDEO</span>
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewMedia(item);
                                  }}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105"
                                  title="View"
                                >
                                  <Eye size={16} className="text-[#211A1B]" />
                                </button>
                                {item.mediaKind === 'image' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCropEditor(item);
                                    }}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105"
                                    title="Crop"
                                  >
                                    <Edit3 size={16} className="text-[#211A1B]" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearSlotMedia(slot.index);
                                  }}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500 shadow-lg transition hover:scale-105 hover:bg-red-600"
                                  title="Remove"
                                >
                                  <Trash2 size={16} className="text-white" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#f0e2e6] bg-white p-3">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#8d7d81]">Page templates</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {pagePreviewConfigs.map((page) => {
                  const pageUsesAbsolute = pageSlotBounds.get(page.pageIndex)?.usesAbsoluteLayout;
                  const isActive = selectedPreviewPage === page.pageIndex;
                  return (
                    <button
                      key={`filmstrip-${page.pageIndex}`}
                      type="button"
                      onClick={() => setSelectedPreviewPage(page.pageIndex)}
                      className={`shrink-0 rounded-xl border p-2 transition-all ${
                        isActive ? 'border-[#b10e6b] bg-[#fff0f4] shadow-sm' : 'border-[#ecdbe2] bg-[#fff8f9] hover:border-[#b10e6b]/50'
                      }`}
                    >
                      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[#8d7d81]">
                        {page.pageLabel}
                      </p>
                      <div
                        className={`relative h-16 w-14 overflow-hidden rounded-lg border border-[#ecdbe2] bg-white ${
                          pageUsesAbsolute ? '' : 'grid grid-cols-2 gap-0.5 p-0.5'
                        }`}
                      >
                        {page.slots.map((slot) => {
                          const item = getSlotMediaItem(mediaItems, slot.index);
                          const miniSlot = templatePages[slot.pageIndex]?.slots?.find((candidate) => candidate.id === slot.slotId);
                          const miniAbsolute = pageUsesAbsolute && miniSlot;
                          return (
                            <div
                              key={`mini-${page.pageIndex}-${slot.slotId}`}
                              className={`overflow-hidden bg-[#f3e8ec] ${miniAbsolute ? 'absolute' : 'min-h-3'}`}
                              style={
                                miniAbsolute
                                  ? {
                                      left: `${Number(miniSlot?.x) || 0}%`,
                                      top: `${Number(miniSlot?.y) || 0}%`,
                                      width: `${Math.max(8, Number(miniSlot?.width) || 20)}%`,
                                      height: `${Math.max(8, Number(miniSlot?.height) || 20)}%`,
                                    }
                                  : undefined
                              }
                            >
                              {item?.dataUrl ? (
                                item.mediaKind === 'video' ? (
                                  <video src={item.dataUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                ) : (
                                  <img src={item.dataUrl} alt="" className="h-full w-full object-cover" />
                                )
                              ) : null}
                              {item?.finalized && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
      )}
    </div>

    {filledSlotCount > 0 && (
      <div className="p-3 border-t bg-[#fef6f6] text-xs text-[#211A1B] flex items-center justify-between">
        <span className="font-semibold">{filledSlotCount} item{filledSlotCount !== 1 ? 's' : ''} in slots</span>
        <span className="text-[10px] text-[#54474d]"></span>
      </div>
    )}
  </div>
        </div>

  {/* Modals */}
  {isBookModalOpen && selectedTemplateData && (
    <FullscreenBook
      template={selectedTemplateData}
      mediaItems={slotAlignedBookMedia}
      mediaTransforms={mediaTransforms}
      coverPhoto={selectedAlbumData?.coverPhoto}
      coverPhotoName={selectedAlbumData?.albumName}
      coverWeddingDate={selectedAlbumData?.weddingDate}
      endPhoto={endPhotoPreview || undefined}
      endPhotoName={endPageMedia?.fileName}
      photographerName={photographerLabel}
      photographerStudio="Lumina Editorial"
      photographerWebsite={photographerLabel}
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

      {/* Action Buttons - Narrative Flow */}
      <div className="px-4 md:px-12 py-5 flex flex-col gap-3 border-t border-[#f3d6df]" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b10e6b]">Workflow Status</p>
            <p className="text-sm text-[#211A1B]">
              {!selectedAlbum ? (
                <span className="text-[#7a6268]">Select an album to begin</span>
              ) : !selectedTemplate ? (
                <span className="text-[#7a6268]">Select a template design</span>
              ) : filledSlotCount === 0 ? (
                <span className="text-[#7a6268]">Add images to fill slots ({filledSlotCount} / {slotConfigs.length})</span>
              ) : (
                <span className="text-green-600 font-semibold">✓ Ready to save ({filledSlotCount} / {slotConfigs.length} filled)</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={handleDiscard}
              title="Clear designer (data stays in curate album)"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#54474d] border border-[#e1bec4] rounded-lg hover:border-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all whitespace-nowrap"
            >
              ✕ Discard
            </button>

            <button
              onClick={() => saveCurateDraft(false, 'save_draft')}
              disabled={isSaving || !selectedAlbum || !selectedTemplate}
              title="Save as draft and create book album"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border-2 border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] disabled:opacity-40 disabled:cursor-not-allowed disabled:border-[#ccc] transition-all whitespace-nowrap"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                '💾 Draft Save'
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={isSaving || !selectedAlbum || !selectedTemplate || filledSlotCount === 0}
              title="Save and proceed to next step"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#b10e6b] to-[#d23284] text-white rounded-lg hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all whitespace-nowrap"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Auto-Save Indicator */}
        {(bookAlbumId || isAutoSaving) && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-semibold">
              {isAutoSaving ? '⌛ Auto-saving changes...' : '✓ Saved to album • Ready for next step'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAlbum;