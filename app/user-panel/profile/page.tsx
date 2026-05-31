'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, ImagePlus, Trash2, User as UserIcon } from 'lucide-react';
import { useProtectedRoute } from '@/lib/useAuth';
import { apiFetch, handleAuthError } from '@/lib/api';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useProtectedRoute(['client', 'couple']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const loadProfile = async () => {
        try {
          const response = await apiFetch('/auth/me');

          if (response.status === 401) {
            handleAuthError(response);
            return;
          }

          if (response.ok) {
            const data = await response.json();
            setProfile({
              name: data.user?.name || user?.name || '',
              email: data.user?.email || user?.email || '',
              phone: data.user?.phone || '',
              profileImage: data.user?.profilePic || '',
              bio: data.user?.bio || '',
            });
          } else {
            // Fallback to localStorage if API fails
            const userRaw = localStorage.getItem('user');
            const userData = userRaw ? JSON.parse(userRaw) : {};
            setProfile({
              name: userData.name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              profileImage: userData.profilePic || '',
              bio: userData.bio || '',
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          const userRaw = localStorage.getItem('user');
          const userData = userRaw ? JSON.parse(userRaw) : {};
          setProfile({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            profileImage: userData.profilePic || '',
            bio: userData.bio || '',
          });
        }
        setLoading(false);
      };

      loadProfile();
    }
  }, [authLoading, user?.id]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setSaveError('');
      setSaveMessage('');

      const response = await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          profilePic: profile.profileImage,
        }),
      });

      if (response.status === 401) {
        handleAuthError(response);
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save profile');
      }

      const storedUserRaw = localStorage.getItem('user');
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : {};
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        name: data.user?.name || profile.name,
        email: data.user?.email || profile.email,
        profilePic: data.user?.profilePic || profile.profileImage || '',
      }));

      setSaveMessage('Profile saved successfully.');
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handlePickProfileImage = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile((current) => ({ ...current, profileImage: reader.result as string }));
        setIsEditing(true);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#fff8f8] px-4 py-8 pb-24 md:px-8 md:pb-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-4xl border border-[#E5CCD4] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#F6D6E0] bg-[#FEF0F1] shadow-sm md:h-36 md:w-36">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.name || 'Profile photo'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon size={64} style={{ color: '#D23284' }} />
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handlePickProfileImage}
                    className="absolute bottom-1 right-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#D23284] text-white shadow-lg transition hover:scale-105"
                    aria-label="Upload profile photo"
                  >
                    <ImagePlus size={18} />
                  </button>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />

              <div>
                <h1 className="text-3xl font-serif font-bold text-[#2C1E26]">My Profile</h1>
                <p className="mt-2 text-sm text-[#6B7387]">Update your profile photo and details in one place.</p>
              </div>

              <div className="w-full space-y-5 text-left">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: '#9B9095' }}>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full rounded-xl border border-[#E5CCD4] px-4 py-3 focus:border-[#D23284] focus:outline-none"
                    />
                  ) : (
                    <p className="rounded-xl border border-[#F1E0E6] bg-[#FFF9FB] px-4 py-3 text-[#2C1E26]">{profile.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: '#9B9095' }}>Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full rounded-xl border border-[#E5CCD4] px-4 py-3 focus:border-[#D23284] focus:outline-none"
                    />
                  ) : (
                    <p className="rounded-xl border border-[#F1E0E6] bg-[#FFF9FB] px-4 py-3 text-[#2C1E26]">{profile.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: '#9B9095' }}>Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full rounded-xl border border-[#E5CCD4] px-4 py-3 focus:border-[#D23284] focus:outline-none"
                    />
                  ) : (
                    <p className="rounded-xl border border-[#F1E0E6] bg-[#FFF9FB] px-4 py-3 text-[#2C1E26]">{profile.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: '#9B9095' }}>Biography</label>
                  {isEditing ? (
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-[#E5CCD4] px-4 py-3 focus:border-[#D23284] focus:outline-none"
                    />
                  ) : (
                    <p className="rounded-xl border border-[#F1E0E6] bg-[#FFF9FB] px-4 py-3 leading-7 text-[#2C1E26]">{profile.bio || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex w-full gap-3 pt-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 rounded-xl bg-[#D23284] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSaveError('');
                        setSaveMessage('');
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5CCD4] px-4 py-3 font-semibold text-[#6B7387] transition hover:bg-[#FEF0F1]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile((current) => ({ ...current, profileImage: '' }))}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5CCD4] px-4 py-3 font-semibold text-[#6B7387] transition hover:bg-[#FEF0F1]"
                    >
                      <Trash2 size={16} />
                      Remove Photo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 rounded-xl bg-[#D23284] px-6 py-3 font-semibold text-white transition hover:opacity-90"
                  >
                    Edit
                  </button>
                )}
              </div>

              {saveMessage ? (
                <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{saveMessage}</p>
              ) : null}
              {saveError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
