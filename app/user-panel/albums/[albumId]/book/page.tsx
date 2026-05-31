'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FullscreenBook } from '@/app/Components/photographer-admin/FullscreenBook';
import { TemplatePage, TemplateRecord, CurateMediaInput } from '@/lib/template-book-media';
import { apiFetch, handleAuthError } from '@/lib/api';

interface PublicBookAlbum {
  _id: string;
  albumName?: string;
  pageLayouts?: Array<{
    pageNumber: number;
    slotAssignments: Array<{
      slotId: string;
      slotLabel?: string;
      mediaId?: string | null;
      mediaOrder?: number | null;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      dataUrl?: string;
      mediaKind?: string;
    }>;
  }>;
  curateId?: {
    _id?: string;
    albumName?: string;
    coverPhoto?: string;
    coverPhotoName?: string;
    weddingDate?: string | Date;
    mediaItems?: CurateMediaInput[];
  };
  templateId?: {
    _id?: string;
    name?: string;
    description?: string;
    accent?: string;
    coverImage?: string;
    pages?: TemplatePage[];
    slots?: TemplatePage['slots'];
  };
}

export default function AlbumBookPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params?.albumId || '';
  const [loading, setLoading] = useState(true);
  const [bookAlbum, setBookAlbum] = useState<PublicBookAlbum | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/book-albums/public', { cache: 'no-store' } as RequestInit);
        if (res.status === 401) {
          handleAuthError(res);
          return;
        }

        const result = await res.json();
        if (res.ok && result.success && Array.isArray(result.bookAlbums)) {
          const found = result.bookAlbums.find((item: PublicBookAlbum) => String(item.curateId?._id || item.curateId?.toString?.() || item.curateId) === String(albumId));
          if (found) {
            setBookAlbum(found);
            return;
          }
        }

        const fallback = await apiFetch('/client-invites/assigned-albums');
        if (fallback.status === 401) {
          handleAuthError(fallback);
          return;
        }

        const fallbackResult = await fallback.json();
        if (!fallback.ok || !fallbackResult.success || !Array.isArray(fallbackResult.albums)) {
          setBookAlbum(null);
          return;
        }

        const foundFallback = fallbackResult.albums.find((item: any) => String(item.id) === String(albumId));
        if (foundFallback) {
          setBookAlbum({
            _id: String(foundFallback.id),
            albumName: foundFallback.name || 'Album Book',
            curateId: {
              _id: String(foundFallback.id),
              albumName: foundFallback.name || 'Album Book',
              coverPhoto: foundFallback.coverImage || '',
              coverPhotoName: foundFallback.coverPhotoName || foundFallback.name || '',
              weddingDate: foundFallback.date || undefined,
              mediaItems: Array.isArray(foundFallback.mediaItems)
                ? foundFallback.mediaItems
                : [],
            },
            templateId: {
              _id: String(foundFallback.id),
              name: foundFallback.name || 'Album Book',
              pages: [],
              slots: [],
            },
            pageLayouts: [],
          });
          return;
        }

        setBookAlbum(null);
      } catch (error) {
        console.error('Failed to load album book:', error);
        setBookAlbum(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [albumId]);

  const bookData = useMemo(() => {
    if (!bookAlbum) return null;

    const templateId = bookAlbum.templateId;
    const pageLayouts = Array.isArray(bookAlbum.pageLayouts) ? bookAlbum.pageLayouts : [];
    const mediaItems = Array.isArray(bookAlbum.curateId?.mediaItems) ? bookAlbum.curateId.mediaItems : [];

    const template: TemplateRecord = {
      _id: String(templateId?._id || bookAlbum._id),
      name: templateId?.name || bookAlbum.curateId?.albumName || bookAlbum.albumName || 'Album Book',
      description: templateId?.description || '',
      accent: templateId?.accent || '#b10e6b',
      coverImage: templateId?.coverImage || bookAlbum.curateId?.coverPhoto || '',
      pages: Array.isArray(templateId?.pages) && templateId.pages.length > 0 ? templateId.pages : [],
      slots: Array.isArray(templateId?.slots) && templateId.slots.length > 0 ? templateId.slots : undefined,
    };

    return {
      template,
      mediaItems,
      pageLayouts,
      coverPhoto: bookAlbum.curateId?.coverPhoto || template.coverImage,
      coverPhotoName: bookAlbum.curateId?.coverPhotoName || bookAlbum.curateId?.albumName || template.name,
      coverWeddingDate: bookAlbum.curateId?.weddingDate,
    };
  }, [bookAlbum]);

  return (
    <div className="min-h-screen bg-black text-white">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">Loading...</div>
      ) : bookData ? (
        <FullscreenBook
          template={bookData.template}
          mediaItems={bookData.mediaItems}
          pageLayouts={bookData.pageLayouts}
          coverPhoto={bookData.coverPhoto}
          coverPhotoName={bookData.coverPhotoName}
          coverWeddingDate={bookData.coverWeddingDate}
          onClose={() => router.push(`/user-panel/albums/${albumId}`)}
        />
      ) : (
        <div className="flex min-h-screen items-center justify-center">No media</div>
      )}
    </div>
  );
}
