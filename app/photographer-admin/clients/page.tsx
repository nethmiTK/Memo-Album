"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
} from "lucide-react";
import { apiFetch, handleAuthError } from "@/lib/api";
import { FullscreenBook } from "@/app/Components/photographer-admin/FullscreenBook";
import { toast } from "react-toastify";

type AlbumItem = {
  _id: string;
  albumName: string;
  weddingDate?: string;
  status?: string;
  coverPhoto?: string;
};

type ClientInviteItem = {
  _id: string;
  albumId: AlbumItem | string;
  clientEmails: string[];
  inviteStatus: "draft" | "sent" | "opened" | "accepted";
  emailStatus: "queued" | "sent" | "partial" | "failed";
  sentAt?: string | null;
  createdAt?: string;
};

type BookAlbumPreview = {
  _id: string;
  albumName?: string;
  coverPhoto?: string;
  coverPhotoName?: string;
  weddingDate?: string | Date;
  templateId?: {
    _id?: string;
    name?: string;
    description?: string;
    accent?: string;
    coverImage?: string;
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
    }>;
    slots?: Array<{
      id: string;
      label: string;
      kind: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }>;
  };
  curateId?: {
    _id?: string;
    albumName?: string;
    coverPhoto?: string;
    coverPhotoName?: string;
    weddingDate?: string | Date;
    mediaItems?: Array<{
      id?: string;
      order?: number;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      mediaKind?: string;
      dataUrl?: string;
    }>;
  };
};

const StatCard = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <p className="text-[9px] uppercase tracking-widest font-semibold mb-2 text-gray-400">
      {title}
    </p>
    <p
      className="text-4xl font-bold"
      style={{ color: "#b10e6b", fontFamily: "'Newsreader', serif" }}
    >
      {value}
    </p>
  </div>
);

const getAlbumTitle = (album: ClientInviteItem["albumId"]) =>
  typeof album === "string" ? album : album?.albumName || "Unknown Album";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return (
        <span className="bg-red-100 text-red-700 text-[9px] font-bold uppercase px-2 py-1 rounded">
          NEW EDIT
        </span>
      );
    case "finalized":
      return (
        <span className="bg-green-100 text-green-700 text-[9px] font-bold uppercase px-2 py-1 rounded">
          FINALIZED
        </span>
      );
    case "draft":
      return (
        <span className="bg-gray-200 text-gray-600 text-[9px] font-bold uppercase px-2 py-1 rounded">
          DRAFT
        </span>
      );
    default:
      return (
        <span className="bg-gray-200 text-gray-600 text-[9px] font-bold uppercase px-2 py-1 rounded">
          {status}
        </span>
      );
  }
};

export default function CuratePage() {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const secondEmailInputRef = useRef<HTMLInputElement>(null);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [invites, setInvites] = useState<ClientInviteItem[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [selectedBookPreview, setSelectedBookPreview] =
    useState<BookAlbumPreview | null>(null);
  const [isLoadingBookPreview, setIsLoadingBookPreview] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const showToast = (value: string) => {
    setToastMessage(value);
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  const selectedAlbum = useMemo(
    () => albums.find((album) => album._id === selectedAlbumId) || null,
    [albums, selectedAlbumId],
  );

  const loadAlbums = async () => {
    const response = await apiFetch("/curate");
    if (response.status === 401) {
      handleAuthError(response);
      return;
    }

    const result = await response.json();
    if (response.ok && result.success) {
      const curateAlbums = Array.isArray(result.curates)
        ? result.curates.map((item: any) => ({
            _id: item._id,
            albumName: item.albumName,
            weddingDate: item.weddingDate,
            status: item.status,
            coverPhoto: item.coverPhoto,
          }))
        : [];

      setAlbums(curateAlbums);
      if (!selectedAlbumId && curateAlbums.length) {
        setSelectedAlbumId(curateAlbums[0]._id);
      }
    }
  };

  const loadInvites = async () => {
    const response = await apiFetch("/client-invites");
    if (response.status === 401) {
      handleAuthError(response);
      return;
    }

    const result = await response.json();
    if (response.ok && result.success) {
      setInvites(Array.isArray(result.invites) ? result.invites : []);
    }
  };

  useEffect(() => {
    loadAlbums();
    loadInvites();

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");

    if (paymentStatus === "success") {
      toast("Payment successful — invitation sent!");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "failed") {
      showToast("Payment was not completed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "cancelled") {
      showToast("Payment cancelled.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const openBookPreview = async (inviteAlbumId: AlbumItem | string) => {
    const albumId =
      typeof inviteAlbumId === "string" ? inviteAlbumId : inviteAlbumId?._id;
    if (!albumId) return;

    setIsLoadingBookPreview(true);
    try {
      const response = await apiFetch("/book-albums");
      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load book view");
      }

      const bookAlbum = Array.isArray(result.bookAlbums)
        ? result.bookAlbums.find(
            (item: any) =>
              item.curateId?._id === albumId || item.curateId === albumId,
          )
        : null;

      if (!bookAlbum?._id) {
        throw new Error("Book view is not available yet for this invite");
      }

      const detailsResponse = await apiFetch(`/book-albums/${bookAlbum._id}`);
      if (detailsResponse.status === 401) {
        handleAuthError(detailsResponse);
        return;
      }

      const details = await detailsResponse.json();
      if (!detailsResponse.ok || !details.success || !details.bookAlbum) {
        throw new Error(details.message || "Failed to load book details");
      }

      setSelectedBookPreview(details.bookAlbum);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to open book view",
      );
    } finally {
      setIsLoadingBookPreview(false);
    }
  };

  const handleInviteCollaborator = () => {
    emailInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(() => emailInputRef.current?.focus(), 250);
  };

  /*const handleSendInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (!primaryEmail.trim() || !secondaryEmail.trim()) {
      setMessage('Please enter both email addresses.');
      showToast('Enter both email addresses');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch('/client-invites', {
        method: 'POST',
        body: JSON.stringify({
          albumId: selectedAlbumId,
          clientEmails: [primaryEmail, secondaryEmail],
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send invitation');
      }

      setPrimaryEmail('');
      setSecondaryEmail('');
      toast(result.generatedPassword
        ? `Invitation sent and saved. Generated password: ${result.generatedPassword}`
        : 'Invitation sent and saved to the invite table.');
      showToast('Invite sent');
      await loadInvites();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send invitation');
      showToast(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  }; */

  const handleSendInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!primaryEmail.trim() || !secondaryEmail.trim()) {
      showToast("Enter both email addresses");
      return;
    }
    if (!selectedAlbumId) {
      showToast("Please select an album");
      return;
    }
    setShowPaymentSummary(true);
  };

  const handleContinueToPayment = async () => {
    setIsPaymentProcessing(true);
    try {
      const response = await apiFetch("/payment/initiate", {
        method: "POST",
        body: JSON.stringify({
          albumId: selectedAlbumId,
          clientEmails: [primaryEmail, secondaryEmail],
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const result = await response.json();
      if (!result.success || !result.redirectUrl) {
        throw new Error(result.message || "Failed to initiate payment");
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Payment initiation failed",
      );
      setIsPaymentProcessing(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FFF8F7] p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      {toastMessage ? (
        <div className="fixed right-5 top-5 z-50 rounded-2xl bg-[#1f1a1b] px-4 py-3 text-sm text-white shadow-2xl">
          {toastMessage}
        </div>
      ) : null}
      <div className="max-w-7xl mx-auto">
        <header className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="max-w-xl">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-4 text-[#b10e6b]">
                ALBUM PERMISSION CONSOLE
              </p>
              <h1
                className="text-5xl md:text-6xl leading-tight text-[#211a1b]"
                style={{ fontFamily: "'Newsreader', serif", fontWeight: 500 }}
              >
                The Ethereal Vows Collection
              </h1>
              <p className="mt-6 text-gray-500 leading-relaxed">
                Invite two client emails, save the invite record with album and
                photographer ownership, and send the invitation mail
                immediately.
              </p>
            </div>
            <button
              onClick={handleInviteCollaborator}
              className="mt-6 md:mt-0 flex items-center gap-2 bg-white text-[#b10e6b] font-semibold py-2 pl-2 pr-4 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #b10e6b 0%, #d23284 100%)",
                }}
              >
                <Plus size={18} />
              </div>
              <span>Invite Collaborator</span>
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold text-[#211a1b] mb-2">
                New Access
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Invite up to two emails and save the invite to the database.
              </p>

              <form onSubmit={handleSendInvitation}>
                <div className="mb-4">
                  <label
                    className="text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                    htmlFor="email1"
                  >
                    Primary Email
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="email1"
                    value={primaryEmail}
                    onChange={(event) => setPrimaryEmail(event.target.value)}
                    placeholder="curator@example.com"
                    className="w-full mt-2 p-3 bg-[#F7F2F3] rounded-lg border border-transparent focus:ring-2 focus:ring-[#b10e6b] focus:border-[#b10e6b] transition text-sm"
                    style={{ color: "#211a1b" }}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                    htmlFor="email2"
                  >
                    Secondary Email
                  </label>
                  <input
                    ref={secondEmailInputRef}
                    type="email"
                    id="email2"
                    value={secondaryEmail}
                    onChange={(event) => setSecondaryEmail(event.target.value)}
                    placeholder="second@example.com"
                    className="w-full mt-2 p-3 bg-[#F7F2F3] rounded-lg border border-transparent focus:ring-2 focus:ring-[#b10e6b] focus:border-[#b10e6b] transition text-sm"
                    style={{ color: "#211a1b" }}
                  />
                </div>

                <div className="mb-6">
                  <label
                    className="text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                    htmlFor="collection"
                  >
                    Select Album
                  </label>
                  <select
                    id="collection"
                    value={selectedAlbumId}
                    onChange={(event) => setSelectedAlbumId(event.target.value)}
                    className="w-full mt-2 p-3 bg-[#F7F2F3] rounded-lg border border-transparent focus:ring-2 focus:ring-[#b10e6b] focus:border-[#b10e6b] transition text-sm appearance-none"
                    style={{ color: "#211a1b" }}
                  >
                    {albums.length === 0 ? (
                      <option value="">No albums found</option>
                    ) : null}
                    {albums.map((album) => (
                      <option key={album._id} value={album._id}>
                        {album.albumName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-bold py-3 rounded-lg hover:shadow-xl transition-shadow disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #b10e6b 0%, #d23284 100%)",
                  }}
                >
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </button>
              </form>

              {message ? (
                <p className="text-xs text-[#b10e6b] mt-4 text-center leading-relaxed">
                  {message}
                </p>
              ) : null}
              <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
                Collaborators receive an invite email and the invite is saved
                with album, photographer, and payment status.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#211a1b]">
                Saved Invite Records
              </h2>
              <button className="flex items-center gap-2 text-xs font-bold text-[#b10e6b] uppercase tracking-wider">
                <Calendar size={14} />
                <span>All Recent</span>
              </button>
            </div>

            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite._id}
                  className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={
                      typeof invite.albumId === "string"
                        ? "https://images.unsplash.com/photo-1522673607200-164d1b6ce8d2?w=400&q=80"
                        : invite.albumId.coverPhoto ||
                          "https://images.unsplash.com/photo-1522673607200-164d1b6ce8d2?w=400&q=80"
                    }
                    alt={getAlbumTitle(invite.albumId)}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div style={{ flexGrow: 1 }}>
                    <h3 className="font-semibold text-[#211a1b]">
                      {getAlbumTitle(invite.albumId)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Emails: {invite.clientEmails.join(", ")}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    {getStatusBadge(invite.inviteStatus)}
                    <button
                      type="button"
                      onClick={() => void openBookPreview(invite.albumId)}
                      className="mt-4 text-gray-400 transition-colors hover:text-[#b10e6b]"
                      title="Open book view"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end items-center mt-6">
              <p className="text-xs text-gray-400 mr-4">
                Viewing latest invite records
              </p>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-50">
                  <ChevronLeft size={18} />
                </button>
                <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-50">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* <footer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 pt-8">
          <StatCard title="Total Invites" value={String(invites.length).padStart(2, '0')} />
          <StatCard title="Active Now" value={String(invites.filter((invite) => invite.inviteStatus === 'sent').length).padStart(2, '0')} />
          <StatCard title="Pending Links" value={String(invites.length).padStart(2, '0')} />
          <StatCard title="Selected Album" value={selectedAlbum ? '01' : '00'} />
        </footer> */}
      </div>

      {showPaymentSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211a1b]/55 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div
              className="px-6 py-5"
              style={{
                background: "linear-gradient(135deg, #b10e6b 0%, #d23284 100%)",
              }}
            >
              <p className="text-[9px] tracking-[0.18em] font-bold uppercase text-white/70 mb-1">
                Album Permission Console
              </p>
              <h2
                className="text-2xl font-semibold text-white"
                style={{ fontFamily: "'Newsreader', serif" }}
              >
                Order Summary
              </h2>
            </div>

            <div className="px-6 py-5">
              <div className="inline-flex items-center gap-2 bg-[#FFF0F7] border border-[#f4c0d1] rounded-lg px-3 py-2 mb-5">
                <span className="text-xs font-bold text-[#b10e6b]">
                  {selectedAlbum?.albumName || "Selected Album"}
                </span>
              </div>

              <div className="flex justify-between py-2.5 border-b border-[#f0e8ec] text-sm">
                <span className="text-gray-400">Payable</span>
                <span className="font-medium text-[#211a1b]">
                  LKR 10,000.00
                </span>
              </div>

              <div
                className="flex justify-between px-6 py-3 -mx-6 mt-0"
                style={{
                  background:
                    "linear-gradient(135deg, #b10e6b 0%, #d23284 100%)",
                }}
              >
                <span className="text-sm font-bold text-white/85">
                  Sub total (1 invite)
                </span>
                <span className="text-base font-bold text-white">
                  LKR 10,000.00
                </span>
              </div>

              <button
                onClick={handleContinueToPayment}
                disabled={isPaymentProcessing}
                className="w-full mt-4 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-opacity"
                style={{
                  background:
                    "linear-gradient(135deg, #b10e6b 0%, #d23284 100%)",
                }}
              >
                {isPaymentProcessing
                  ? "Redirecting to payment..."
                  : "Continue to Payment →"}
              </button>

              <button
                onClick={() => setShowPaymentSummary(false)}
                className="w-full mt-2 py-2.5 rounded-xl text-[#b10e6b] font-semibold text-sm border border-[#b10e6b]"
              >
                Cancel
              </button>

              <p className="text-center text-[10px] text-gray-400 mt-3">
                🔒 Secured with AES-256 · 256 bit keys
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedBookPreview ? (
        <FullscreenBook
          template={selectedBookPreview.templateId as any}
          mediaItems={(selectedBookPreview.curateId?.mediaItems || []) as any}
          coverPhoto={
            selectedBookPreview.curateId?.coverPhoto ||
            selectedBookPreview.coverPhoto
          }
          coverPhotoName={
            selectedBookPreview.curateId?.coverPhotoName ||
            selectedBookPreview.coverPhotoName ||
            selectedBookPreview.albumName
          }
          coverWeddingDate={
            selectedBookPreview.curateId?.weddingDate ||
            selectedBookPreview.weddingDate
          }
          onClose={() => setSelectedBookPreview(null)}
        />
      ) : null}
    </div>
  );
}
