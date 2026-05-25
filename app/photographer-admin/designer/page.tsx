'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, handleAuthError } from '@/lib/api';
import { Upload, X, Eye, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { BookViewInteractive } from '@/app/Components/photographer-admin/bookview-interactive';

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
}

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
  const [showFullPreview, setShowFullPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const result = await response.json();
        if (result.success && Array.isArray(result.curates)) {
          setAlbums(result.curates);
        }
      } catch (error) {
        console.error('Failed to fetch albums:', error);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await apiFetch('/curate/template');
        if (response.status === 401) {
          handleAuthError(response);
          return;
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.templates)) {
          setTemplates(result.templates);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };

    fetchAlbums();
    fetchTemplates();
  }, []);

  const handleAlbumSearch = (value: string) => {
    setAlbumSearch(value);
    if (value.trim()) {
      const filtered = albums.filter(album =>
        album.albumName.toLowerCase().includes(value.toLowerCase())
      );
      setAlbumSuggestions(filtered);
    } else {
      setAlbumSuggestions([]);
    }
  };

  const handleTemplateSearch = (value: string) => {
    setTemplateSearch(value);
    if (value.trim()) {
      const filtered = templates.filter(template =>
        template.name.toLowerCase().includes(value.toLowerCase())
      );
      setTemplateSuggestions(filtered);
    } else {
      setTemplateSuggestions([]);
    }
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album._id);
    setAlbumSearch(album.albumName);
    setAlbumSuggestions([]);
    // Fetch media from this album
    fetchCurateMedia(album._id);
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template._id);
    setTemplateSearch(template.name);
    setTemplateSuggestions([]);
    setSelectedTemplateData(template);
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

  const fetchCurateMedia = async (curateId: string) => {
    try {
      const response = await apiFetch(`/curate`);
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.curates)) {
        const album = result.curates.find((c: any) => c._id === curateId);
        if (album && album.mediaItems) {
          const normalizedMedia = album.mediaItems.map((item: any, index: number) => ({
            id: item.id || `media-${index + 1}`,
            fileName: item.fileName || '',
            fileType: item.fileType || '',
            fileSize: item.fileSize || 0,
            mediaKind: item.mediaKind || 'image',
            dataUrl: item.dataUrl || '',
          }));
          setMediaItems(normalizedMedia);
          toast.success('Media loaded from album', toastStyle);
        }
      }
    } catch (error) {
      console.error('Failed to fetch curate media:', error);
      toast.error('Failed to load media', toastStyle);
    }
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
    setShowFullPreview(false);
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Design saved successfully!', toastStyle);
        // Store the bookAlbumId for later use
        sessionStorage.setItem('bookAlbumId', result.bookAlbum._id);
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
        placeholder="Search album..."
        value={albumSearch}
        onChange={(e) => handleAlbumSearch(e.target.value)}
        className="w-full bg-[#fff0f4] border border-[#f3d6df] rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#b10e6b]/40"
      />

      {albumSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#f3d6df] rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
          {albumSuggestions.map((album) => (
            <button
              key={album._id}
              onClick={() => handleSelectAlbum(album)}
              className="w-full text-left px-4 py-3 hover:bg-[#fff0f4] text-sm"
            >
              📁 {album.albumName}
            </button>
          ))}
        </div>
      )}
    </div>

    {selectedAlbum && (
      <p className="mt-2 text-xs text-[#b10e6b]">
        ✓ {albumSearch}
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
        placeholder="Search template..."
        value={templateSearch}
        onChange={(e) => handleTemplateSearch(e.target.value)}
        className="w-full bg-[#fff0f4] border border-[#f3d6df] rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#b10e6b]/40"
      />

      {templateSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#f3d6df] rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
          {templateSuggestions.map((template) => (
            <button
              key={template._id}
              onClick={() => handleSelectTemplate(template)}
              className="w-full text-left px-4 py-3 hover:bg-[#fff0f4] text-sm"
            >
              🎨 {template.name}
              {template.description && (
                <p className="text-xs text-gray-400">
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
    <div className="p-4 border-b flex justify-between items-center">
      <div>
        <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#211A1B] font-bold">NARRATIVE FLOW</h3>
        <p className="text-xs text-[#211A1B] mt-0.5">Upload images to fill your template</p>
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
          <p className="text-sm text-[#211A1B] font-medium" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>Drag your memories here</p>
          <p className="text-xs text-[#211A1B]/70" style={{ fontFamily: 'Manrope, "Segoe UI", sans-serif' }}>
            or <span className="text-[#b10e6b] underline font-semibold">browse files</span>
          </p>
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

  {/* Template Preview Section */}
  {selectedTemplateData && (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#211A1B] mb-2">TEMPLATE PREVIEW</h3>
        <p className="text-xs text-[#211A1B]/70">{selectedTemplateData.description || 'Template book preview'}</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Template Cover */}
        {selectedTemplateData.coverImage || selectedTemplateData.coverUrl ? (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <img 
              src={selectedTemplateData.coverImage || selectedTemplateData.coverUrl} 
              alt={selectedTemplateData.name}
              className="w-full h-32 object-cover"
            />
          </div>
        ) : null}

        {/* Template Info */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#211A1B]/70 mb-1">Name</p>
            <p className="text-sm font-semibold text-[#211A1B]">{selectedTemplateData.name}</p>
          </div>

          {/* Pages & Slots Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">Pages</p>
              <p className="text-lg font-bold text-blue-700">
                {selectedTemplateData.pages?.length || 1}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-50 p-3 rounded-lg border border-purple-100">
              <p className="text-[10px] font-bold uppercase text-purple-600 mb-1">Slots</p>
              <p className="text-lg font-bold text-purple-700">
                {(selectedTemplateData.pages?.reduce((sum, p) => sum + (p.slots?.length || 0), 0) || 0) + (selectedTemplateData.slots?.length || 0)}
              </p>
            </div>
          </div>

          {/* Template Slots Preview */}
          {selectedTemplateData.pages && selectedTemplateData.pages.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase text-[#211A1B]/70 mb-2">Slots Preview</p>
              <div className="grid grid-cols-3 gap-2">
                {selectedTemplateData.pages[0]?.slots?.slice(0, 6).map((slot) => (
                  <div
                    key={slot.id}
                    className="aspect-square rounded-lg border border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-2"
                  >
                    <p className="text-[9px] font-semibold text-[#211A1B] text-center truncate">{slot.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Open in Full View Button */}
        <a
          href={`/photographer-admin/designer/book/${selectedTemplateData._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center px-4 py-2 text-xs font-bold uppercase tracking-wider border border-[#b10e6b] text-[#b10e6b] rounded-lg hover:bg-[#fff0f4] transition"
        >
          Open Full Preview
        </a>
      </div>
    </div>
  )}
</div>
        </div>
      </div>

	  {/* Always Visible Book View */}
<div className="px-4 md:px-12 pb-6">
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-6">
    <h3 className="text-sm font-bold uppercase tracking-widest text-[#211A1B] mb-4">
      INTERACTIVE TEMPLATE PREVIEW
    </h3>

    {selectedTemplateData ? (
      <BookViewInteractive 
        template={selectedTemplateData} 
        mediaItems={mediaItems}
        isEditable={true}
      />
    ) : (
      <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">
            Select a Template
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Book preview will appear here
          </p>
        </div>
      </div>
    )}
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