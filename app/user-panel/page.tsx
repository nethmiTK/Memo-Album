'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProtectedRoute } from '@/lib/useAuth';
import { apiFetch, handleAuthError } from '@/lib/api';
import LoadingComponent from '@/app/Components/user-panel/loading';

 
export default function UserPanelPage() {
  const { user, loading: authLoading } = useProtectedRoute(['client', 'couple']);
  const [albumsPreview, setAlbumsPreview] = useState<any[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        const res = await apiFetch('/client-invites/assigned-albums');
        if (res.status === 401) return handleAuthError(res);
        const json = await res.json();
        if (!res.ok || !json.success || !Array.isArray(json.albums)) {
          setAlbumsPreview([]);
        } else {
          setAlbumsPreview(
            json.albums.slice(0, 4).map((a: any) => ({
              id: a.id,
              name: a.name || 'Album',
              coverImage: a.coverImage || '',
              photoCount: Number(a.photoCount || 0),
            }))
          );
        }
      } catch (e) {
        console.error('Failed to load preview albums', e);
        setAlbumsPreview([]);
      } finally {
        setAlbumsLoading(false);
      }
    };
    load();
  }, [authLoading]);

  if (authLoading || albumsLoading) {
    return <LoadingComponent />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF3F6] to-[#FFF8F7] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-0">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#fff8fb] to-[#fff1f4] p-8 shadow-[0_24px_60px_rgba(200,43,125,0.06)] md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#D23284]">User Dashboard</p>
          <h1 className="text-xs font-semibold uppercase tracking-[0.4em] text-[#211A1B] md:text-5xl">   wedding memories.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#534345]">
            Manage albums, review your favorite media, and keep your gallery organized in one place.
          </p>
        </section>

        {/* Albums preview section */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-4">
               
             </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {albumsLoading ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-6">Loading albums...</div>
              ) : albumsPreview.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-6 text-sm text-[#6B7387]">No albums assigned yet</div>
              ) : (
                albumsPreview.map((a) => (
                  <Link key={a.id} href={`/user-panel/albums/${a.id}/book?source=session`} className="group rounded-lg overflow-hidden p-3 bg-gradient-to-br from-[#fff6f8] to-[#fff1f3] shadow-sm">
                    {a.coverImage ? (
                      <img src={a.coverImage} alt={a.name} className="w-full h-28 object-cover rounded-md" />
                    ) : (
                      <div className="w-full h-28 bg-[#FEF0F1] rounded-md flex items-center justify-center text-[#D23284]">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <div className="mt-2">
                      <div className="font-medium text-sm text-[#2C1E26] truncate">{a.name}</div>
                      <div className="text-xs text-[#6B7387]">{a.photoCount} photos</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
 
      </div>
    </div>
  );
}
 