export type TemplateSlot = {
  id: string;
  label: string;
  kind: string;
  shape?: 'square' | 'circle' | 'triangle' | 'text';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  emphasis?: string;
};

export type TemplatePage = {
  pageNumber: number;
  pageLabel?: string;
  slots: TemplateSlot[];
  pageColor?: string;
};

export type TemplateRecord = {
  _id: string;
  name: string;
  description?: string;
  accent?: string;
  coverImage?: string;
  coverUrl?: string;
  slots?: TemplateSlot[];
  pages?: TemplatePage[];
};

export type CurateMediaInput = {
  id?: string;
  order?: number;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mediaKind?: string;
  dataUrl?: string;
};

export type TemplateMediaAsset = {
  id: string;
  sourceId: string;
  src: string;
  label: string;
  order: number;
  mediaKind: 'image' | 'video' | 'other';
  fileType?: string;
};

export const getTemplatePages = (template: TemplateRecord | null): TemplatePage[] => {
  if (!template) return [];
  if (Array.isArray(template.pages) && template.pages.length > 0) return template.pages;
  if (Array.isArray(template.slots) && template.slots.length > 0) {
    return [{ pageNumber: 1, pageLabel: 'Page 1', slots: template.slots }];
  }
  return [];
};

export const toTemplateMedia = (
  items: CurateMediaInput[] | undefined,
  coverPhoto?: string,
  coverPhotoName?: string
): TemplateMediaAsset[] => {
  // Normalize items, preserve DB order if provided, filter out any item
  // that is the same as the coverPhoto so cover remains a separate page.
  const normalized = (items || [])
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: item.id || `media-${index + 1}`,
      sourceId: item.id || `media-${index + 1}`,
      src: item.dataUrl || '',
      label: item.fileName || `Media ${index + 1}`,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
      // Detect video by mediaKind OR fileType as fallback
      mediaKind: (item.mediaKind === 'video' || (item.fileType && item.fileType.startsWith('video'))) 
        ? 'video' 
        : (item.mediaKind === 'other' ? 'other' : 'image') as TemplateMediaAsset['mediaKind'],
      fileType: item.fileType || '',
    }))
    .filter((item) => item.src)
    // Exclude any item whose src matches the coverPhoto to avoid placing
    // the cover inside template slots.
    .filter((item) => (coverPhoto ? item.src !== coverPhoto : true))
    .sort((a, b) => a.order - b.order);

  return normalized;
};

/** Map curate media sequentially into each template slot (all pages). */
export const buildSlotMediaMap = (pages: TemplatePage[], mediaItems: TemplateMediaAsset[]) => {
  const orderedSlots = pages.flatMap((page, pageIndex) =>
    (page.slots || []).map((slot) => ({
      slot,
      pageNumber: page.pageNumber || pageIndex + 1,
    }))
  );

  return orderedSlots.reduce<Record<string, TemplateMediaAsset>>((accumulator, entry, index) => {
    const media = mediaItems[index];
    if (media?.src) {
      accumulator[entry.slot.id] = media;
    }
    return accumulator;
  }, {});
};

export const isVideoMedia = (fileType?: string, mediaKind?: string) =>
  mediaKind === 'video' || Boolean(fileType && fileType.startsWith('video'));
