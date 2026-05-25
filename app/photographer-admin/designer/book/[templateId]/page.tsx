'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch, handleAuthError } from '@/lib/api';
import { TemplateBookFlip } from '@/app/Components/photographer-admin/template-book-flip';
import type { TemplateRecord } from '@/lib/template-book-media';

const parseApiJson = async (response: Response) => {
  const rawText = await response.text();
  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error('Invalid API response');
  }
};

export default function DesignerTemplateBookPage() {
  const params = useParams<{ templateId: string }>();
  const searchParams = useSearchParams();
  const templateId = Array.isArray(params?.templateId) ? params.templateId[0] : params?.templateId;
  const curateId = searchParams.get('curateId') || '';

  const [template, setTemplate] = useState<TemplateRecord | null>(null);
  const [albumTitle, setAlbumTitle] = useState('Album Book');
  const [mediaItems, setMediaItems] = useState<Array<{ id?: string; order?: number; fileName?: string; fileType?: string; fileSize?: number; mediaKind?: string; dataUrl?: string }>>([]);
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!templateId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [templatesRes, curatesRes] = await Promise.all([
        apiFetch('/curate/templates'),
        apiFetch('/curate'),
      ]);

      if (templatesRes.status === 401 || curatesRes.status === 401) {
        handleAuthError(templatesRes.status === 401 ? templatesRes : curatesRes);
        return;
      }

      const templatesData = await parseApiJson(templatesRes);
      const curatesData = await parseApiJson(curatesRes);
      const templates = Array.isArray(templatesData.templates) ? templatesData.templates : [];
      const curates = Array.isArray(curatesData.curates) ? curatesData.curates : [];

      const foundTemplate = templates.find((item: TemplateRecord) => item._id === templateId);
      if (!foundTemplate) {
        throw new Error('Template not found');
      }

      setTemplate(foundTemplate);

      const curate =
        (curateId && curates.find((item: { _id?: string }) => item._id === curateId)) ||
        curates[0] ||
        null;

      if (curate) {
        setAlbumTitle(curate.albumName || foundTemplate.name);
        setMediaItems(curate.mediaItems || []);
        setCoverPhoto(curate.coverPhoto);
      } else {
        setAlbumTitle(foundTemplate.name);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load book';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [templateId, curateId]);

  const subtitle = useMemo(() => {
    if (!template) return '';
    const slots = (template.pages || []).reduce((sum, page) => sum + (page.slots?.length || 0), 0) + (template.slots?.length || 0);
    return `${slots} slots · fullscreen flip`;
  }, [template]);

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#FFF1F3] text-[#1a1c1d]">
      <header className="border-b border-[#ead5dc] bg-[#FFF1F3]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/photographer-admin/designer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e1bec4] text-[#7a6268] transition-colors hover:border-[#b10e6b] hover:text-[#b10e6b]"
              aria-label="Back to designer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="font-['Libre_Caslon_Text'] text-[22px] leading-none text-[#b10e6b] md:text-[26px]">{albumTitle}</p>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.24em] text-[#8d7d81]">{subtitle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-auto p-4">
        {isLoading ? (
          <p className="text-sm uppercase tracking-[0.2em] text-[#7a6268]">Loading book...</p>
        ) : !template ? (
          <p className="text-sm text-[#594045]">Template not found.</p>
        ) : (
          <TemplateBookFlip
            template={template}
            mediaItems={mediaItems}
            coverPhoto={coverPhoto}
            variant="fullscreen"
          />
        )}
      </main>
    </div>
  );
}
