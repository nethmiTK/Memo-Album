'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { apiFetch, getUser, handleAuthError } from '@/lib/api';
import { Eye, Trash2, Upload, Maximize2, X, Edit3, ImagePlus, Clipboard } from 'lucide-react';
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
    const statusInfo = `${response.status} ${response.statusText}`;
    const requestUrl = response.url || 'unknown URL';
    return {
      success: false,
      message: htmlResponse
        ? `Server returned HTML instead of JSON at ${requestUrl} (${statusInfo}). Check API URL/backend server and login session.`
        : `Invalid API response format from ${requestUrl} (${statusInfo}).`,
    };
  }
};

const hasMediaSrc = (value?: string) => Boolean(value && value.trim());

type SlotMediaArray = Array<MediaItem | null>;

const getMediaSrc = (item?: MediaItem | null) => item?.dataUrl || (item as any)?.src || (item as any)?.url || '';

const getSlotMediaItem = (items: SlotMediaArray, slotIndex: number): MediaItem | null => {
  const item = items[slotIndex];
  return item && hasMediaSrc(getMediaSrc(item)) ? item : null;
};

const padSlotMediaArray = (items: SlotMediaArray, slotCount: number): SlotMediaArray => {
  const next = items.map((item) => item ?? null);
  while (next.length < slotCount) next.push(null);
  return next.length > slotCount ? next.slice(0, slotCount) : next;
};

const countFilledSlots = (items: SlotMediaArray, slots: SlotConfig[]) =>
  slots.filter((slot) => Boolean(getSlotMediaItem(items, slot.index))).length;

const compactMediaItems = (items: SlotMediaArray): MediaItem[] =>
  items.filter((item): item is MediaItem => Boolean(item && hasMediaSrc(getMediaSrc(item))));

interface MediaItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaKind: string;
  dataUrl?: string;
  order?: number;
  caption?: string;
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
  const [cropSlot, setCropSlot] = useState<SlotConfig | null>(null);
  const [cropDraft, setCropDraft] = useState<MediaTransform>({ zoom: 1, x: 0, y: 0 });
  const [selectedPreviewPage, setSelectedPreviewPage] = useState(0);
  const [pageCarouselIndex, setPageCarouselIndex] = useState(0);
  const [isCropPanning, setIsCropPanning] = useState(false);
  const [cropPanStart, setCropPanStart] = useState({ x: 0, y: 0, baseX: 0, baseY: 0 });
  const [pasteSlotIndex, setPasteSlotIndex] = useState<number | null>(null);
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

  // Prevent background page scrolling when fullscreen book modal is open
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isBookModalOpen) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const top = document.body.style.top;
      if (top) {
        const restored = -parseInt(top || '0', 10) || 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, restored);
      } else {
        document.body.style.overflow = '';
      }
    }

    return () => {
      const top = document.body.style.top;
      if (top) {
        const restored = -parseInt(top || '0', 10) || 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, restored);
      } else {
        document.body.style.overflow = '';
      }
    };
  }, [isBookModalOpen]);

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
      mediaKind: item.mediaKind === 'video'
        ? 'video'
        : (item.fileType?.startsWith('video') ? 'video' : (item.mediaKind || 'image')),
      dataUrl: item.dataUrl || (item as any).src || (item as any).url || '',
      caption: (item as any).caption || '',
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
  const activeCropSlotSpec = cropSlot
    ? templatePages[cropSlot.pageIndex]?.slots?.find((slot) => (slot.id || '') === cropSlot.slotId) || null
    : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resolveTargetSlot = () => {
      if (pasteSlotIndex !== null && pasteSlotIndex >= 0 && pasteSlotIndex < slotConfigs.length) {
        return pasteSlotIndex;
      }
      const emptySlot = slotConfigs.find((slot) => !getSlotMediaItem(mediaItems, slot.index));
      return emptySlot ? emptySlot.index : slotConfigs[0]?.index ?? 0;
    };

    const handlePaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const items = Array.from(event.clipboardData.items || []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      let file: File | null = null;

      if (imageItem) {
        const blob = imageItem.getAsFile();
        if (blob) {
          file = new File([blob], `clipboard-${Date.now()}.${blob.type.split('/')[1] || 'png'}`, {
            type: blob.type,
          });
        }
      } else {
        const text = event.clipboardData.getData('text/plain') || '';
        if (text.startsWith('data:image/')) {
          try {
            const blob = await (await fetch(text)).blob();
            file = new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type || 'image/png' });
          } catch {
            // ignore unsupported clipboard format
          }
        }
      }

      if (!file) return;
      event.preventDefault();

      const targetSlot = resolveTargetSlot();
      await uploadFileToSlot(targetSlot, file);
      setPasteSlotIndex(null);
      toast.success('✓ Pasted image into slot', toastStyle);
    };

    window.addEventListener('paste', handlePaste as any);
    return () => window.removeEventListener('paste', handlePaste as any);
  }, [pasteSlotIndex, mediaItems, slotConfigs, selectedAlbum, selectedTemplate]);

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

  const uploadFileToSlot = async (slotIndex: number, file: File) => {
    if (!file) return;
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

  const handleUploadToSlot = (slotIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFileToSlot(slotIndex, files[0]);
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
    const slotIndex = mediaItems.findIndex((entry) => entry?.id === item.id);
    setCropSlot(slotIndex >= 0 ? slotConfigs[slotIndex] : null);
  };

  const applyCropChanges = () => {
    if (!cropMedia) return;

    const nextTransforms = {
      ...mediaTransforms,
      [cropMedia.id]: cropDraft,
    };
    setMediaTransforms(nextTransforms);
    setMediaItems((prev) => prev.map((item) => {
      if (!item || item.id !== cropMedia.id) return item;
      return { ...item, finalized: true };
    }));

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
            finalized: true,
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
    setCropSlot(null);
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
        status: options.status ?? selectedAlbumData?.status ?? 'save_draft',
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
      <div className="px-4 md:px-12 py-4 md:py-8 bg-gradient-to-r from-[#FFF1F3] to-[#FFF8F8]">
        <div className="flex items-start justify-between gap-4 mb-2 md:mb-4">
          <div>
            <span className="label-sm tracking-widest uppercase text-[#b10e6b] font-semibold text-xs mb-1 md:mb-2 block">
              Workflow Step 02
            </span>
            <h2 className="text-[32px] md:text-[60px] text-[#211A1B] mb-2 md:mb-4" style={{ lineHeight: '1.2', fontWeight: 400, letterSpacing: 'normal', fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
              Designing the{' '}
              <span style={{ color: '#BE126F' }}>Perfect Template</span>
            </h2>
            <p className="text-sm text-[#211A1B] max-w-md hidden md:block" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
              Select an album and template, then upload media to fill your design.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-3 md:px-9 py-4 md:py-6">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Top Row - Selection Panel and Book Panel side by side */}
          <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
            {/* SELECTION PANEL - Left Side */}
            <div className="w-full xl:w-72 shrink-0">
              <div className="w-full p-4 md:p-5 rounded-2xl shadow-lg bg-white border-l-4 border-[#b10e6b] xl:max-h-[760px] xl:overflow-y-auto">
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
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${isActive
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

                  {/* COVER + END PHOTO (compact controls placed in selection panel) */}
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold uppercase mb-3 text-[#54474d]">COVER & END</label>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#e5c5d4] bg-[#fff8fb] flex items-center justify-center">
                          {coverPhotoPreview || selectedAlbumData?.coverPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverPhotoPreview || selectedAlbumData?.coverPhoto || ''} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] text-[#8d7d81] text-center px-2">No cover</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => coverPhotoInputRef.current?.click()}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-50"
                              title="Change Cover"
                            >
                              <Edit3 size={14} className="text-[#54474d]" />
                            </button>
                            <button
                              type="button"
                              onClick={clearCoverPhoto}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition hover:bg-red-50"
                              title="Remove Cover"
                            >
                              <Trash2 size={14} className="text-[#b10e6b]" />
                            </button>
                          </div>
                          <input
                            ref={(el) => {
                              coverPhotoInputRef.current = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverPhotoChange}
                          />
                          <p className="mt-1 text-[10px] text-[#7a6268]">Cover shown in book preview</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#e5c5d4] bg-[#fff8fb] flex items-center justify-center">
                          {endPhotoPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={endPhotoPreview} alt="End" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] text-[#8d7d81] text-center px-2">No end photo</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => endPhotoInputRef.current?.click()}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-50"
                              title="Change End"
                            >
                              <Edit3 size={14} className="text-[#54474d]" />
                            </button>
                            <button
                              type="button"
                              onClick={clearEndPhoto}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition hover:bg-red-50"
                              title="Remove End"
                            >
                              <Trash2 size={14} className="text-[#b10e6b]" />
                            </button>
                          </div>
                          <input
                            ref={(el) => {
                              endPhotoInputRef.current = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEndPhotoChange}
                          />
                          <p className="mt-1 text-[10px] text-[#7a6268]">Optional end page photo</p>
                        </div>
                      </div>

                      {/* Filled slots indicator */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#7a6268] mb-1">
                          <span>Slots filled</span>
                          <span className="text-sm text-[#211A1B] font-bold">{filledSlotCount} / {slotConfigs.length}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#fdeff4] overflow-hidden">
                          <div
                            className="h-full bg-[#b10e6b]"
                            style={{ width: `${Math.min(100, Math.round((filledSlotCount / Math.max(1, slotConfigs.length)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* BOOK PANEL - Right Side */}
            <div className="min-w-0 flex-1">
              {/* Template Book Preview (flip book with curate images in slots) */}
              {selectedTemplateData ? (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 xl:h-[760px]">
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
                      <div className="w-full h-72 md:h-[650px] rounded-xl overflow-hidden">
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
                    <div className="rounded-2xl border border-[#ebe7e8] bg-[#fffdfd] p-2 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#7f6f74]">Template</p>
                          <p className="text-[8px] text-[#a89094]">{selectedTemplateData?.name || 'Select template'}</p>
                        </div>
                        <p className="text-[11px] font-medium text-[#7a6d72]">
                          {filledSlotCount} / {slotConfigs.length} filled
                        </p>
                      </div>
                      <div
                        className="mx-auto w-full max-w-[130px] rounded-2xl border border-[#ece8e9] bg-white p-2 shadow-sm h-full"
                        style={{
                          background: `linear-gradient(180deg, ${templateAccent}29 0%, #fffdfd 24%, #fff8fb 72%, ${templateAccent}1a 100%)`,
                        }}
                      >
                        <div className="mb-2 text-xs text-[#7a6268]">
                          <p className="font-semibold text-[#211A1B]">{activePreviewPage?.pageLabel || 'Page'}</p>
                          <p className="text-[10px]">Slots: {activePreviewPage?.slots?.length || 0} available</p>
                        </div>
                        <div
                          className={`relative w-full rounded-[1.1rem] border border-[#f2e8ec] bg-white h-full ${pageSlotBounds.get(activePreviewPage?.pageIndex || 0)?.usesAbsoluteLayout
                            ? 'aspect-3/4 overflow-hidden'
                            : 'min-h-32 h-full grid auto-rows-[minmax(56px,1fr)] grid-cols-2 gap-1.5 p-1.5'
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
                            const slotSizeStr = width > 0 && height > 0 ? `${width}% × ${height}%` : 'Auto';

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
                                className={`group overflow-hidden rounded-2xl border bg-[#faf8f9] ${usesAbsolute ? 'absolute cursor-pointer' : 'relative min-h-20'
                                  }`}
                                title={`${slot.pageLabel} · ${slot.slotLabel} (${slotSizeStr})`}
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
                                    <div className="absolute top-1 left-1 text-[8px] font-bold uppercase tracking-wider text-[#8d7d81]">{slotSizeStr}</div>
                                    <ImagePlus size={22} className="text-[#c1aeb3]" />
                                    <button
                                      type="button"
                                      onClick={() => slotUploadInputRefs.current[slot.slotId]?.click()}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e1bec4] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b]"
                                    >
                                      <Upload size={14} />
                                      Upload
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPasteSlotIndex(slot.index);
                                        toast.info('Press Ctrl+V / Cmd+V to paste an image into this slot', toastStyle);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e1bec4] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b]"
                                    >
                                      <Clipboard size={14} />
                                      Paste
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
                                    className="absolute inset-0 overflow-hidden"
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
                                    {item.caption ? (
                                      <div className="absolute left-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white shadow-sm">
                                        {item.caption}
                                      </div>
                                    ) : null}
                                    {/* Hover overlay: click image area to open crop editor directly */}
                                    <div
                                      className="absolute inset-0 flex items-center justify-center gap-2.5 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                      onClick={(e) => {
                                        // clicking blank overlay area opens crop
                                        if ((e.target as HTMLElement) === e.currentTarget && item.mediaKind === 'image') {
                                          e.stopPropagation();
                                          openCropEditor(item);
                                        }
                                      }}
                                      style={{ cursor: item.mediaKind === 'image' ? 'pointer' : 'default' }}
                                    >
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
                                          title="Crop / Adjust"
                                        >
                                          <Edit3 size={16} className="text-[#b10e6b]" />
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

                    {/* Page templates selection below */}
                    <div className="rounded-2xl border border-[#f0e2e6] bg-white p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#8d7d81]">Page templates</p>
                          <p className="text-[8px] text-[#8d7d81]/70">Select a page to view slots</p>
                        </div>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#e0a7c0] scrollbar-track-transparent">
                        {pagePreviewConfigs.map((page) => {
                          const pageUsesAbsolute = pageSlotBounds.get(page.pageIndex)?.usesAbsoluteLayout;
                          const isActive = selectedPreviewPage === page.pageIndex;
                          return (
                            <button
                              key={`filmstrip-${page.pageIndex}`}
                              type="button"
                              onClick={() => setSelectedPreviewPage(page.pageIndex)}
                              className={`flex-shrink-0 rounded-xl border p-3 transition-all flex flex-col items-center gap-2 ${isActive
                                ? 'border-[#b10e6b] bg-[#fff0f4] shadow-sm'
                                : 'border-[#ecdbe2] bg-[#fff8f9] hover:border-[#b10e6b]/50'
                                }`}
                              style={{ width: '130px' }}
                            >
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-[#b10e6b]' : 'text-[#8d7d81]'}`}>
                                {page.pageLabel}
                              </span>
                              <div
                                className={`relative h-24 w-20 overflow-hidden rounded-lg border border-[#ecdbe2] bg-white shadow-xs ${pageUsesAbsolute ? '' : 'grid grid-cols-2 gap-0.5 p-0.5'
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
              <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#ead5dc] px-4 py-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-[#211A1B]">Adjust Crop</p>
                    <p className="max-w-[70vw] truncate text-xs text-[#7a6268]">{cropMedia.fileName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCropMedia(null);
                      setCropSlot(null);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e1bec4] text-[#7a6268] transition hover:border-[#b10e6b] hover:text-[#b10e6b]"
                    aria-label="Close crop editor"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_260px]">
                  {/* LEFT: Full image with slot frame cutout overlay */}
                  <div className="overflow-hidden rounded-xl border border-[#ead5dc] bg-[#111] relative" style={{ minHeight: '320px' }}>
                    {/* Drag area — full image is the background */}
                    <div
                      className={`absolute inset-0 overflow-hidden ${isCropPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onMouseDown={handleCropPointerDown}
                      onMouseMove={handleCropPointerMove}
                      onMouseUp={stopCropPanning}
                      onMouseLeave={stopCropPanning}
                    >
                      {/* Full image sits behind everything, panned/zoomed by user */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cropMedia.dataUrl}
                        alt={cropMedia.fileName}
                        className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                        draggable={false}
                        style={{
                          transform: `translate(${cropDraft.x}px, ${cropDraft.y}px) scale(${cropDraft.zoom})`,
                          transformOrigin: 'center center',
                        }}
                      />

                      {/* Dark overlay with a slot-shaped transparent cutout in the center */}
                      {(() => {
                        const slotW = activeCropSlotSpec?.width ? Number(activeCropSlotSpec.width) : 100;
                        const slotH = activeCropSlotSpec?.height ? Number(activeCropSlotSpec.height) : 100;

                        const bounds = cropSlot ? pageSlotBounds.get(cropSlot.pageIndex) : null;
                        const usesAbsolute = bounds?.usesAbsoluteLayout;

                        let aspectRatio = 1;
                        if (usesAbsolute) {
                          const pageAspectRatio = 3 / 4; // aspect-3/4
                          aspectRatio = (slotW / Math.max(1, slotH)) * pageAspectRatio;
                        } else {
                          const colSpan = Math.max(1, Math.min(2, slotW || 1));
                          const rowSpan = Math.max(1, Math.min(3, slotH || 1));
                          aspectRatio = colSpan / rowSpan;
                        }

                        // Compute frame dimensions based on container to maintain exact physical aspect ratio
                        const containerAspectRatio = 364 / 320; // known width/height of the left panel
                        const targetRatioPercentage = aspectRatio / containerAspectRatio;

                        let frameW = 75; // max 75% width
                        let frameH = frameW / targetRatioPercentage;

                        if (frameH > 80) { // max 80% height
                          frameH = 80;
                          frameW = frameH * targetRatioPercentage;
                        }
                        return (
                          <>
                            {/* SVG overlay: full rect fill minus the slot frame hole */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ zIndex: 10 }}
                            >
                              <defs>
                                <mask id="crop-frame-mask">
                                  <rect width="100%" height="100%" fill="white" />
                                  <rect
                                    x={`${(100 - frameW) / 2}%`}
                                    y={`${(100 - frameH) / 2}%`}
                                    width={`${frameW}%`}
                                    height={`${frameH}%`}
                                    rx="4"
                                    fill="black"
                                  />
                                </mask>
                              </defs>
                              {/* Dark overlay everywhere EXCEPT inside the frame hole */}
                              <rect width="100%" height="100%" fill="rgba(0,0,0,0.58)" mask="url(#crop-frame-mask)" />
                              {/* Frame border */}
                              <rect
                                x={`${(100 - frameW) / 2}%`}
                                y={`${(100 - frameH) / 2}%`}
                                width={`${frameW}%`}
                                height={`${frameH}%`}
                                rx="4"
                                fill="none"
                                stroke="#b10e6b"
                                strokeWidth="2.5"
                              />
                              {/* Rule-of-thirds grid inside frame */}
                              {[1 / 3, 2 / 3].map((t, i) => (
                                <line
                                  key={`vline-${i}`}
                                  x1={`${(100 - frameW) / 2 + frameW * t}%`}
                                  y1={`${(100 - frameH) / 2}%`}
                                  x2={`${(100 - frameW) / 2 + frameW * t}%`}
                                  y2={`${(100 + frameH) / 2}%`}
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="1"
                                />
                              ))}
                              {[1 / 3, 2 / 3].map((t, i) => (
                                <line
                                  key={`hline-${i}`}
                                  x1={`${(100 - frameW) / 2}%`}
                                  y1={`${(100 - frameH) / 2 + frameH * t}%`}
                                  x2={`${(100 + frameW) / 2}%`}
                                  y2={`${(100 - frameH) / 2 + frameH * t}%`}
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="1"
                                />
                              ))}
                              {/* Corner accent marks */}
                              {[
                                { cx: (100 - frameW) / 2, cy: (100 - frameH) / 2 },
                                { cx: (100 + frameW) / 2, cy: (100 - frameH) / 2 },
                                { cx: (100 - frameW) / 2, cy: (100 + frameH) / 2 },
                                { cx: (100 + frameW) / 2, cy: (100 + frameH) / 2 },
                              ].map(({ cx, cy }, i) => (
                                <circle key={`corner-${i}`} cx={`${cx}%`} cy={`${cy}%`} r="4" fill="#b10e6b" />
                              ))}
                            </svg>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* RIGHT: Controls */}
                  <div className="space-y-4">
                    {/* Slot info badge */}
                    <div className="rounded-xl border border-[#e1bec4] bg-[#fff8fb] px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#b10e6b] mb-1">Slot guidance</p>
                      {cropSlot && (
                        <p className="text-xs font-semibold text-[#211A1B]">
                          {cropSlot.pageLabel} &middot; {cropSlot.slotLabel}
                        </p>
                      )}
                      {activeCropSlotSpec && (
                        <p className="text-[10px] text-[#7a6268] mt-0.5">
                          Slot size: {activeCropSlotSpec.width || 'auto'} &times; {activeCropSlotSpec.height || 'auto'}%
                        </p>
                      )}
                      <p className="text-[10px] text-[#9a8a8f] mt-1 leading-snug">
                        Drag the image and use the slider to align the visible area with the slot frame.
                      </p>
                    </div>

                    <label className="block text-xs font-semibold text-[#54474d]">
                      Zoom
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.01"
                          value={cropDraft.zoom}
                          onChange={(e) => setCropDraft((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                          className="w-full accent-[#b10e6b]"
                        />
                        <span className="shrink-0 text-[10px] text-[#7a6268] w-10">{cropDraft.zoom.toFixed(2)}x</span>
                      </div>
                    </label>
                    <label className="block text-xs font-semibold text-[#54474d]">
                      Horizontal
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        step="1"
                        value={cropDraft.x}
                        onChange={(e) => setCropDraft((prev) => ({ ...prev, x: Number(e.target.value) }))}
                        className="mt-1 w-full accent-[#b10e6b]"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#54474d]">
                      Vertical
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        step="1"
                        value={cropDraft.y}
                        onChange={(e) => setCropDraft((prev) => ({ ...prev, y: Number(e.target.value) }))}
                        className="mt-1 w-full accent-[#b10e6b]"
                      />
                    </label>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCropDraft({ zoom: 1, x: 0, y: 0 })}
                        className="rounded-lg border border-[#e1bec4] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#7a6268] hover:border-[#b10e6b] hover:text-[#b10e6b] transition-all"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={applyCropChanges}
                        className="flex-1 rounded-lg bg-[#b10e6b] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#9a0b5c] transition-all"
                      >
                        ✓ Apply Crop
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

          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={handleDiscard}
              title="Clear designer (data stays in curate album)"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#54474d] border border-[#e1bec4] rounded-lg hover:border-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all whitespace-nowrap"
            >
              Discard
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
                'Draft Save'
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
      </div>
    </div >
  );
};

export default CreateAlbum;