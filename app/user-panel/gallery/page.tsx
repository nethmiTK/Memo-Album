"use client";

import React, { useEffect, useRef, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface MediaItem {
  id: string;
  url: string;
  type: "photo" | "video";
  uploadedAt: string;
  isFavorite: boolean;
}

export default function GalleryPage() {
  const router = useRouter();
  const [mediaFilter, setMediaFilter] = useState<"all" | "photos" | "videos">(
    "all",
  );
  const [galleryFolders, setGalleryFolders] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    { name: string; type: "photo" | "video"; previewUrl: string }[]
  >([]);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  };

  const getMediaTypeFromFile = (file: File) =>
    file.type.startsWith("video") ? "video" : "photo";

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getSelectedFilesSize = () =>
    selectedFiles.reduce((total, file) => total + file.size, 0);

  const uploadRecentMedia = async (files: File[]) => {
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const items = await Promise.all(
        files.map(async (file) => ({
          title: file.name,
          mediaType: getMediaTypeFromFile(file),
          dataUrl: await fileToDataUrl(file),
          fileType: file.type,
          fileName: file.name,
        })),
      );

      setUploadProgress(40);
      const response = await fetch(`${API_BASE}/api/gallery/media`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Upload failed");
      }

      setUploadProgress(90);
      const uploadedItems = Array.isArray(result.data)
        ? result.data
        : [result.data];
      setMediaItems((prev) => [
        ...uploadedItems.map((item: any) => ({
          id: String(item.id || Date.now()),
          url: item.url || "/images/media1.jpg",
          type: item.mediaType === "video" ? "video" : "photo",
          uploadedAt: item.uploadedAt
            ? new Date(item.uploadedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          isFavorite: item.isFavorite ?? false,
        })),
        ...prev,
      ]);
      setUploadProgress(100);

      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (uploadErr) {
      console.warn("Upload failed:", uploadErr);
      setError((uploadErr as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      uploadRecentMedia(files);
    }
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const dragActive = event.type === "dragenter" || event.type === "dragover";
    setIsDragging(dragActive);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files || []).filter(
      (file) =>
        /image|video|raw/.test(file.type) ||
        file.name.toLowerCase().endsWith(".raw"),
    );

    if (!files.length) return;
    setSelectedFiles(files);
    setFilePreviews(
      files.map((file) => ({
        name: file.name,
        type: getMediaTypeFromFile(file),
        previewUrl: URL.createObjectURL(file),
      })),
    );
  };

  const handleUploadFormFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setSelectedFiles(files);
    setFilePreviews(
      files.map((file) => ({
        name: file.name,
        type: getMediaTypeFromFile(file),
        previewUrl: URL.createObjectURL(file),
      })),
    );
  };

  const openUploadForm = () => {
    setShowUploadForm(true);
    setUploadError(null);
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadProgress(0);
  };

  const handleUploadFormSubmit = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Please add at least one photo or video to upload.");
      return;
    }

    await uploadRecentMedia(selectedFiles);
    setShowUploadForm(false);
    setUploadProgress(0);
  };

  const openFolderPage = (folder: any) => {
    // If this folder looks like an album, send user to albums route
    if (/album/i.test(String(folder.name || folder.category || ""))) {
      // Prefer direct album route if id exists
      try {
        router.push(`/user-panel/albums/${encodeURIComponent(folder.id)}`);
        return;
      } catch (e) {
        // fallback to gallery folder view
      }
    }

    router.push(
      `/user-panel/gallery/folder?folderId=${encodeURIComponent(folder.id)}`,
    );
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFolder(null);
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadError(null);
  };

  const handleUploadModalFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setFilePreviews(
      files.map((file) => ({
        name: file.name,
        type: getMediaTypeFromFile(file),
        previewUrl: URL.createObjectURL(file),
      })),
    );
  };

  const uploadFolderMedia = async () => {
    if (!selectedFolder || selectedFiles.length === 0) {
      setUploadError("Please choose at least one file to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const items = await Promise.all(
        selectedFiles.map(async (file) => ({
          folderId: selectedFolder.id,
          title: file.name,
          mediaType: getMediaTypeFromFile(file),
          dataUrl: await fileToDataUrl(file),
          fileType: file.type,
          fileName: file.name,
        })),
      );

      /*const response = await fetch(`${API_BASE}/api/gallery/media`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });*/

      const response = await fetch(`${API_BASE}/api/gallery/media`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ folderId: selectedFolder.id, items }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Upload failed");
      }

      const uploadedItems = Array.isArray(result.data)
        ? result.data
        : [result.data];
      setMediaItems((prev) => [
        ...uploadedItems.map((item: any) => ({
          id: String(item._id || item.id || Date.now()),
          url: item.url || "/images/media1.jpg",
          type: item.mediaType === "video" ? "video" : "photo",
          uploadedAt: item.createdAt
            ? new Date(item.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          isFavorite: item.isFavorite ?? false,
        })),
        ...prev,
      ]);

      closeUploadModal();
    } catch (uploadErr) {
      console.warn("Upload failed:", uploadErr);
      setUploadError((uploadErr as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.previewUrl),
      );
    };
  }, [filePreviews]);

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      const [folderResponse, mediaResponse] = await Promise.all([
        fetch(`${API_BASE}/api/gallery/folders`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE}/api/gallery/media`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (folderResponse.ok) {
        const folderData = await folderResponse.json();
        if (folderData?.data) {
          setGalleryFolders(
            folderData.data.map((folder: any) => ({
              id: String(folder.id ?? folder._id ?? Date.now()),
              name: folder.name,
              category: folder.category || "Custom",
              imageCount: folder.images?.length ?? 0,
              coverImages:
                folder.images
                  ?.filter((image: any) => image.url)
                  .map((image: any) => image.url) ?? [],
            })),
          );
        }
      }

      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        if (mediaData?.data) {
          setMediaItems(
            mediaData.data.map((item: any) => ({
              //id: String(item._id),
              id: String(item.id || item._id),
              url: item.url || "/images/media1.jpg",
              type: item.mediaType === "video" ? "video" : "photo",
              uploadedAt: item.createdAt
                ? new Date(item.createdAt).toISOString().split("T")[0]
                : item.uploadedAt || "2024-01-01",
              isFavorite: item.isFavorite ?? false,
            })),
          );
        }
      }
    } catch (fetchError) {
      console.warn("Gallery load failed:", fetchError);
      setError("Could not load gallery data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();
  }, []);

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    let previousItems: MediaItem[] = [];
    setMediaItems((prev) => {
      previousItems = prev;
      return prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item,
      );
    });

    try {
      const response = await fetch(
        `${API_BASE}/api/gallery/media/${id}/favorite`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update favorite.");
      }
    } catch (toggleError) {
      console.warn("Failed to sync favorite:", toggleError);
      setMediaItems(previousItems);
    }
  };

  const openPreview = (item: MediaItem, idx: number) => {
    setPreviewMedia(item);
    setPreviewIndex(idx);
    setZoomed(false);
  };

  const closePreview = () => {
    setPreviewMedia(null);
    setPreviewIndex(null);
    setZoomed(false);
  };

  const showPrev = () => {
    if (previewIndex === null) return;
    const len = mediaItems.length;
    if (len === 0) return;
    const nextIndex = (previewIndex - 1 + len) % len;
    setPreviewIndex(nextIndex);
    setPreviewMedia(mediaItems[nextIndex]);
    setZoomed(false);
  };

  const showNext = () => {
    if (previewIndex === null) return;
    const len = mediaItems.length;
    if (len === 0) return;
    const nextIndex = (previewIndex + 1) % len;
    setPreviewIndex(nextIndex);
    setPreviewMedia(mediaItems[nextIndex]);
    setZoomed(false);
  };

  const toggleZoom = () => setZoomed((z) => !z);

  const deleteMediaItem = async (id: string) => {
    const confirmed = window.confirm("Delete this media item?");
    if (!confirmed) return;

    setMediaItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch(`${API_BASE}/api/gallery/media/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to delete media item.");
      }
    } catch (deleteError) {
      console.warn("Failed to delete media item:", deleteError);
      await fetchGalleryData();
    }
  };

  // Create folder handler - posts to backend or falls back to local state
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const payload = { name: newFolderName.trim(), category: "Custom" };

    try {
      const response = await fetch(`${API_BASE}/api/gallery/folders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const folderResult = await response.json();
        const folder = folderResult?.data;
        setGalleryFolders((prev) => [
          {
            id: String(folder?.id || Date.now()),
            name: folder?.name || payload.name,
            category: folder?.category || payload.category,
            imageCount: folder?.images?.length ?? 0,
            coverImages:
              folder?.images
                ?.filter((image: any) => image.url)
                .map((image: any) => image.url) ?? [],
          },
          ...prev,
        ]);
      } else {
        setGalleryFolders((prev) => [
          {
            id: String(Date.now()),
            name: payload.name,
            category: payload.category,
            imageCount: 0,
            coverImages: [],
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.warn("Failed to save folder:", error);
      setGalleryFolders((prev) => [
        {
          id: String(Date.now()),
          name: payload.name,
          category: payload.category,
          imageCount: 0,
          coverImages: [],
        },
        ...prev,
      ]);
    }

    setNewFolderName("");
    setShowCreateModal(false);
  };

  const filteredMedia =
    mediaFilter === "all"
      ? mediaItems
      : mediaItems.filter((item) => item.type === mediaFilter.slice(0, -1));

  const allPhotosCard: any = {
    id: "all-photos",
    name: "All Photos",
    category: "All Media",
    imageCount: mediaItems.length,
    coverImages: mediaItems.slice(0, 2).map((item) => item.url),
  };

  const guestFolderCard: any = {
    id: "guest-folder",
    name: "Guest Contributions",
    category: "Interactive",
    imageCount: 0,
    coverImages: [],
  };

  const visibleFolders = [
    allPhotosCard,
    guestFolderCard,
    ...galleryFolders.filter(
      (folder) =>
        !/guest|interactive/i.test(folder.name) &&
        !/guest|interactive/i.test(folder.category),
    ),
  ];

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#FFE8EE" }}>
      {/* Header */}
      <div className="px-8 py-12" style={{ backgroundColor: "#fff8f7" }}>
        <h1
          className="text-5xl font-normal mb-2"
          style={{
            fontFamily: "Newsreader",
            color: "#211a1b",
          }}
        >
          The Living Archive
        </h1>
      </div>

      {/* Gallery Folders Section */}
      <section className="px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl font-normal"
            style={{
              fontFamily: "Newsreader",
              color: "#211a1b",
            }}
          >
            Gallery Folders
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.replace("/user-panel/albums")}
              className="px-6 py-2 rounded-full font-semibold transition-all flex items-center gap-2"
              style={{
                backgroundColor: "#FFE8EE",
                border: "1px solid #C82B7D",
                color: "#C82B7D",
              }}
            >
              <span className="material-symbols-outlined text-base"> </span>
              Wedding Album
            </button>
            <button
              onClick={openUploadForm}
              className="px-6 py-2 rounded-full font-semibold text-white transition-all"
              style={{
                backgroundColor: "#890051",
                background: "linear-gradient(135deg, #890051 0%, #d23284 100%)",
              }}
            >
              Upload Media
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 rounded-full font-semibold text-white transition-all"
              style={{
                backgroundColor: "#890051",
                background: "linear-gradient(135deg, #890051 0%, #d23284 100%)",
              }}
            >
              Create New Folder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {visibleFolders.map((folder, fIdx) => (
            <div
              key={folder.id ?? folder.name ?? `folder-${fIdx}`}
              onClick={() => openFolderPage(folder)}
              className="cursor-pointer rounded-4xl overflow-hidden transition-all duration-300 hover:shadow-2xl h-full min-h-[18rem]"
              style={{
                backgroundColor: "#fff1f4",
              }}
            >
              {/* Folder Preview */}
              <div
                className="h-56 bg-gray-200 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: "#ffe8ee",
                }}
              >
                {folder.coverImages.length > 0 ? (
                  /*<img
                    src={folder.coverImages[0]}
                    alt={folder.name}
                    className="w-full h-full object-cover"
                  />*/
                  <img
  src={folder.coverImages[0]}
  alt={folder.name}
  crossOrigin="anonymous"
  className="w-full h-full object-cover object-center"
  style={{ imageRendering: 'auto' }}
/>
                ) : (
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto"
                      style={{ color: "#d23284" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Folder Info */}
              <div className="p-4">
                <h3
                  className="font-semibold mb-1"
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    color: "#211a1b",
                    fontSize: "16px",
                  }}
                >
                  {folder.name}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    color: "#534345",
                    fontSize: "12px",
                  }}
                >
                  {folder.category}
                </p>
                {folder.imageCount > 0 && (
                  <p
                    className="text-xs mt-2"
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      color: "#8b7079",
                    }}
                  >
                    {folder.imageCount} items
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: "#2C1E26" }}
            >
              Create New Folder
            </h3>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-3 rounded border mb-4"
              style={{ borderColor: "#E5CCD4" }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 rounded text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #890051 0%, #d23284 100%)",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && selectedFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#2C1E26" }}
                >
                  Upload media to {selectedFolder.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Select images or videos to add to this folder.
                </p>
              </div>
              <button
                onClick={closeUploadModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d3d8] text-[#4b4b4b] transition hover:bg-[#f7f1f3]"
                aria-label="Close upload modal"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>

            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUploadModalFileSelection}
              className="w-full mb-4"
            />

            {filePreviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {filePreviews.map((preview, pIdx) => (
                  <div
                    key={
                      preview.previewUrl ?? preview.name ?? `preview-${pIdx}`
                    }
                    className="border rounded p-2"
                  >
                    <div
                      className="text-xs font-semibold mb-1"
                      style={{ color: "#211a1b" }}
                    >
                      {preview.name}
                    </div>
                    {preview.type === "photo" ? (
                      <img
                        src={preview.previewUrl}
                        alt={preview.name}
                        className="h-32 w-full object-cover rounded"
                      />
                    ) : (
                      <video
                        src={preview.previewUrl}
                        controls
                        className="h-32 w-full rounded object-cover bg-black"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <div className="text-sm text-red-600 mb-4">{uploadError}</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={uploadFolderMedia}
                disabled={uploading}
                className="px-4 py-2 rounded text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #890051 0%, #d23284 100%)",
                }}
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadForm && (
        <div className="mb-8 mx-auto w-full max-w-[1000px] rounded-[32px] border border-[#e7d5db] bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 p-6 border-b sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#211a1b]">
                Media Repository
              </h3>
              <p className="text-sm text-[#7f5a67] mt-1">
                Drag images or videos here to upload into your gallery.
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d3d8] text-[#4b4b4b] transition hover:bg-[#f7f1f3]"
              aria-label="Close upload form"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="p-6 max-h-[72vh] overflow-y-auto">
            <div className="rounded-3xl border border-[#b10e6b]/10 bg-[#fff6f7] p-6">
              <div
                className={`p-6 border border-[#f1d7e1] rounded-3xl flex flex-col items-center justify-center text-center gap-4 min-h-[14rem] cursor-pointer transition-colors ${isDragging ? "bg-[#fcf1f6]" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleUploadFormFileSelection}
                  className="hidden"
                  accept="image/*,video/*,.raw"
                />

                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: "#f7ecef" }}
                >
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ color: "#b10e6b" }}
                  >
                    cloud_upload
                  </span>
                </div>
                <p className="serif text-2xl text-[#211a1b]">
                  Drag your memories here
                </p>
                <p className="text-sm text-[#9a8a8e]">
                  or{" "}
                  <span className="text-[#b10e6b] underline">browse files</span>{" "}
                  from your workstation
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6 w-full max-w-2xl rounded-2xl bg-[#FEF5F6] p-4">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="truncate">{selectedFiles[0]?.name}</span>
                    <span className="text-[#b10e6b] font-bold">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#b10e6b] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {filePreviews.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filePreviews.map((preview, pIdx) => (
                  <div
                    key={`${preview.previewUrl}-${pIdx}`}
                    className="rounded-3xl border border-[#f1d7e1] bg-[#fff5f7] p-3"
                  >
                    <div className="text-xs font-semibold mb-2 text-[#211a1b] truncate">
                      {preview.name}
                    </div>
                    {preview.type === "photo" ? (
                      <img
                        src={preview.previewUrl}
                        alt={preview.name}
                        className="h-32 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <video
                        src={preview.previewUrl}
                        controls
                        className="h-32 w-full rounded-2xl object-cover bg-black"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
              {uploadError && (
                <div className="text-sm text-red-600">{uploadError}</div>
              )}
              <button
                onClick={() => setShowUploadForm(false)}
                className="rounded-full border border-[#e0d3d8] px-4 py-2 text-sm font-semibold text-[#4b4b4b] hover:bg-[#f7f1f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFormSubmit}
                disabled={uploading}
                className="rounded-full bg-[#890051] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Save Media"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Media Section */}
      <section className="px-8 py-16" style={{ backgroundColor: "#fff8f7" }}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className="text-3xl font-normal"
            style={{
              fontFamily: "Newsreader",
              color: "#211a1b",
            }}
          >
            Recent Media
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={openUploadForm}
              className="inline-flex items-center gap-2 rounded-full bg-[#890051] px-6 py-2 font-semibold text-white transition-all hover:opacity-95"
            >
              <span className="material-symbols-outlined text-xl">
                cloud_upload
              </span>
              Upload Media
            </button>
          </div>
        </div>

        {showUploadForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl rounded-4xl overflow-hidden bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[#211a1b]">
                    Media Repository
                  </h3>
                  <p className="text-sm text-[#7f5a67] mt-1">
                    Drag images or videos here to upload into your gallery.
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d3d8] text-[#4b4b4b] transition hover:bg-[#f7f1f3]"
                  aria-label="Close upload form"
                >
                  <span className="material-symbols-outlined text-base">
                    close
                  </span>
                </button>
              </div>

              <div className="bg-white min-h-96 rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#b10e6b]/5 p-6">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="label-sm tracking-widest uppercase text-[10px] text-[#9a8a8e] font-bold">
                      MEDIA REPOSITORY
                    </h3>
                    <p className="text-xs text-[#9a8a8e] mt-1">
                      Accepting RAW, JPG, and 4K MOV
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#b10e6b] uppercase">
                      STORAGE USED
                    </p>
                    <p className="text-xs">
                      {formatStorage(getSelectedFilesSize())} / 5.0 GB
                    </p>
                  </div>
                </div>

                <div
                  className={`flex-1 p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? "bg-[#fcf1f6]" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleUploadFormFileSelection}
                    className="hidden"
                    accept="image/*,video/*,.raw"
                  />

                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "#f7ecef" }}
                  >
                    <span
                      className="material-symbols-outlined text-5xl"
                      style={{ color: "#b10e6b" }}
                    >
                      cloud_upload
                    </span>
                  </div>
                  <p className="serif text-3xl text-[#211a1b]">
                    Drag your memories here
                  </p>
                  <p className="text-sm text-[#9a8a8e]">
                    or{" "}
                    <span className="text-[#b10e6b] underline">
                      browse files
                    </span>{" "}
                    from your workstation
                  </p>

                  {selectedFiles.length > 0 && (
                    <div className="mt-6 w-full max-w-3xl p-4 rounded-lg bg-[#FEF5F6]">
                      <div className="flex justify-between mb-2">
                        <span className="truncate">
                          {selectedFiles[0]?.name}
                        </span>
                        <span className="text-[#b10e6b] font-bold">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-[#b10e6b] rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {filePreviews.length > 0 && (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t">
                  {filePreviews.map((preview, pIdx) => (
                    <div
                      key={`${preview.previewUrl}-${pIdx}`}
                      className="rounded-3xl border p-3 bg-[#fff5f7]"
                    >
                      <div className="text-xs font-semibold mb-2 text-[#211a1b]">
                        {preview.name}
                      </div>
                      {preview.type === "photo" ? (
                        <img
                          src={preview.previewUrl}
                          alt={preview.name}
                          className="h-40 w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <video
                          src={preview.previewUrl}
                          controls
                          className="h-40 w-full rounded-2xl object-cover bg-black"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-6 flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center border-t">
                {uploadError && (
                  <div className="text-sm text-red-600">{uploadError}</div>
                )}
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="rounded-full border border-[#e0d3d8] px-5 py-3 text-sm font-semibold text-[#4b4b4b] hover:bg-[#f7f1f3]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadFormSubmit}
                  disabled={uploading}
                  className="rounded-full bg-[#890051] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Save Media"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center text-sm mb-6">
            Loading gallery data...
          </div>
        )}
        {error && (
          <div className="text-center text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* Filter Tabs */}
        <div
          className="flex gap-6 mb-8 border-b"
          style={{ borderColor: "#ecd4db" }}
        >
          {["all", "photos", "videos"].map((filter) => (
            <button
              key={filter}
              onClick={() => setMediaFilter(filter as typeof mediaFilter)}
              className="pb-4 font-medium text-sm capitalize transition-all"
              style={{
                color: mediaFilter === filter ? "#890051" : "#8b7079",
                fontFamily: "Plus Jakarta Sans",
                borderBottom:
                  mediaFilter === filter ? "2px solid #890051" : "none",
              }}
            >
              {filter === "all" ? "All" : filter} ({filteredMedia.length})
            </button>
          ))}
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item, mIdx) => (
            <div
              key={item.id ?? item.url ?? `media-${mIdx}`}
              onClick={() => openPreview(item, mIdx)}
              className="group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer hover:shadow-xl"
              style={{
                backgroundColor: "#ffe8ee",
                borderColor: "#e7d5db",
                aspectRatio: "1",
              }}
            >
              <div className="w-full h-full relative bg-gray-300 overflow-hidden">
                {item.type === "photo" ? (
                  item.url ? (
                    /*<img
                      src={item.url}
                      alt="Gallery item"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.onerror = null;
                        t.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23e2e8f0" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239f7a88" font-size="20">No preview</text></svg>';
                      }}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />*/

                    <img
                      src={item.url}
                      alt="Gallery item"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.onerror = null;
                        t.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23e2e8f0" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239f7a88" font-size="20">No preview</text></svg>';
                      }}
                      className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      style={{ imageRendering: "auto" }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#e9e5e7] text-[#9f7a88]">
                      <svg
                        className="w-12 h-12 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="24" height="24" rx="4" fill="#e2e8f0" />
                        <path
                          d="M8 12l2 2 4-4"
                          stroke="#9f7a88"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm">No preview</span>
                    </div>
                  )
                ) : (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    muted
                    loop
                    playsInline
                  />
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                {/* top-right action buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#E91E63] shadow-lg transition hover:bg-white ${item.isFavorite ? "bg-[#E91E63] text-white" : ""}`}
                    aria-label="Toggle favorite"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteMediaItem(item.id);
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#4b4b4b] shadow-lg transition hover:bg-white"
                    aria-label="Delete media"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {/* center hover actions (favorite / play) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 gap-4 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className={`pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors ${item.isFavorite ? "bg-[#E91E63] text-white" : "bg-white text-[#E91E63]"}`}
                    aria-label="Toggle favorite"
                  >
                    ♥
                  </button>
                  {item.type === "video" && (
                    <div className="pointer-events-auto flex items-center justify-center rounded-full bg-white/15 p-3 text-white shadow-lg">
                      <svg
                        className="w-14 h-14"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs font-semibold">
                    {item.uploadedAt}
                  </p>
                  <p className="text-white/80 text-xs truncate">
                    {item.type === "video" ? "Video" : "Photo"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Upload placeholder */}
          {filteredMedia.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 py-16 text-center">
              <div className="space-y-4">
                <svg
                  className="w-16 h-16 mx-auto opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm" style={{ color: "#8b7079" }}>
                  No media found. Upload photos or videos to get started.
                </p>
              </div>
            </div>
          )}
        </div>

        {previewMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="relative w-full max-w-4xl rounded-3xl bg-[#fff5f7] shadow-2xl overflow-hidden">
              <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                <button
                  onClick={showPrev}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#7f1940] shadow-lg"
                >
                  ◀
                </button>
                <button
                  onClick={showNext}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#7f1940] shadow-lg"
                >
                  ▶
                </button>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#7f1940] shadow-lg hover:bg-white"
                aria-label="Close preview"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <a
                href={previewMedia.url}
                download
                className="absolute right-16 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#7f1940] shadow-lg"
              >
                ⬇️
              </a>
              <button
                onClick={toggleZoom}
                className="absolute right-28 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#7f1940] shadow-lg"
              >
                🔍
              </button>
              <div className="h-[80vh] w-full overflow-hidden bg-[#fde9f1] flex items-center justify-center">
                {previewMedia.url ? (
                  previewMedia.type === "photo" ? (
                    /*<img
                      src={previewMedia.url}
                      alt="Preview"
                      className={`h-full max-h-[80vh] object-contain bg-[#fde9f1] transition-transform ${zoomed ? "scale-125" : "scale-100"}`}
                    />*/
                    <img
  src={previewMedia.url}
  alt="Preview"
  crossOrigin="anonymous"
  className={`max-h-[80vh] max-w-full w-auto h-auto object-contain transition-transform ${zoomed ? 'scale-125' : 'scale-100'}`}
/>
                  ) : (
                    <video
                      src={previewMedia.url}
                      controls
                      className={`h-full max-h-[80vh] object-contain bg-[#fde9f1] transition-transform ${zoomed ? "scale-125" : "scale-100"}`}
                    />
                  )
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[#9f7a88]">
                    <svg
                      className="w-20 h-20 mr-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="24" height="24" rx="4" fill="#e2e8f0" />
                      <path
                        d="M8 12l2 2 4-4"
                        stroke="#9f7a88"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-lg">No preview available</div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 border-t border-[#e7d5db] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[#211a1b]">
                    {previewMedia.type === "video"
                      ? "Video Preview"
                      : "Photo Preview"}
                  </p>
                  <p className="text-sm text-[#7f5a67]">
                    {previewMedia.uploadedAt}
                  </p>
                </div>
                {previewMedia.url ? (
                  <a
                    href={previewMedia.url}
                    download
                    className="inline-flex items-center justify-center rounded-full bg-[#890051] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
                  >
                    Download
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center rounded-full bg-[#f0eef0] px-5 py-3 text-sm font-semibold text-[#7f5a67]">
                    No file
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
