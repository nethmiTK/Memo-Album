'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';


export default function SettingsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const initialStateRef = useRef({
    user: null as any,
    profilePreview: '',
    formData: {
      username: '',
      email: '',
      businessName: '',
      whatsappNo: '',
      contactNo: '',
      address: '',
      bio: '',
      socials: {
        instagram: '',
        facebook: '',
        tiktok: '',
        x: '',
        youtube: '',
        linkedin: '',
        website: '',
      },
    },
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    businessName: '',
    whatsappNo: '',
    contactNo: '',
    address: '',
    bio: '',
    socials: {
      instagram: '',
      facebook: '',
      tiktok: '',
      x: '',
      youtube: '',
      linkedin: '',
      website: '',
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedUserData = localStorage.getItem('userData');
    let parsedUser: any = {};
    let parsedUserData: any = {};

    try {
      parsedUser = storedUser ? JSON.parse(storedUser) : {};
      parsedUserData = storedUserData ? JSON.parse(storedUserData) : {};
    } catch {
      parsedUser = {};
      parsedUserData = {};
    }

    const mergedUser = { ...parsedUser, ...parsedUserData };

    // prefer photographer-specific token, fall back to general tokens
    const token =
      localStorage.getItem('photographerToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('adminToken');

    // If there's no auth token, clear any stale user data and redirect to login
    if (!token) {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        localStorage.removeItem('photographerUser');
        localStorage.removeItem('photographerToken');
      } catch (e) {
        /* ignore */
      }
      setUser(null);
      setProfilePreview('');
      setFormData({
        username: '',
        email: '',
        businessName: '',
        whatsappNo: '',
        contactNo: '',
        address: '',
        bio: '',
        socials: {
          instagram: '',
          facebook: '',
          tiktok: '',
          x: '',
          youtube: '',
          linkedin: '',
          website: '',
        },
      });
      setLoading(false);
      // redirect to login after a short tick to allow UI update
      setTimeout(() => {
        try {
          const { push } = require('next/navigation');
          // best-effort: use window fallback
          if (typeof window !== 'undefined') window.location.href = '/login';
        } catch (err) {
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }, 50);
      return;
    }

    setUser(mergedUser);
    setProfilePreview(mergedUser.profileImage || mergedUser.profilePic || '');
    const mergedFormData = {
      username: mergedUser.username || 'Photographer',
      email: mergedUser.email || 'demo@memoalbum.com',
      businessName: mergedUser.businessName || 'MemoAlbum Studio',
      whatsappNo: mergedUser.whatsappNo || '',
      contactNo: mergedUser.contactNo || '',
      address: mergedUser.address || '',
      bio: mergedUser.bio || '',
      socials: {
        instagram: mergedUser.socials?.instagram || '',
        facebook: mergedUser.socials?.facebook || '',
        tiktok: mergedUser.socials?.tiktok || '',
        x: mergedUser.socials?.x || '',
        youtube: mergedUser.socials?.youtube || '',
        linkedin: mergedUser.socials?.linkedin || '',
        website: mergedUser.socials?.website || '',
      },
    };

    setFormData(mergedFormData);
    initialStateRef.current = {
      user: mergedUser,
      profilePreview: mergedUser.profileImage || mergedUser.profilePic || '',
      formData: mergedFormData,
    };

    const hydrateProfile = async () => {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('adminToken');
      const userId = mergedUser.id || mergedUser._id;

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = await response.json();
        const apiUser = data?.user || {};
        const updatedFormData = {
          username: apiUser.name || mergedFormData.username,
          email: apiUser.email || mergedFormData.email,
          businessName: apiUser.businessName || mergedFormData.businessName,
          whatsappNo: apiUser.whatsappNo || mergedFormData.whatsappNo,
          contactNo: apiUser.contactNo || mergedFormData.contactNo,
          address: apiUser.address || mergedFormData.address,
          bio: apiUser.bio || mergedFormData.bio,
          socials: {
            instagram: apiUser.socials?.instagram || mergedFormData.socials.instagram,
            facebook: apiUser.socials?.facebook || mergedFormData.socials.facebook,
            tiktok: apiUser.socials?.tiktok || mergedFormData.socials.tiktok,
            x: apiUser.socials?.x || mergedFormData.socials.x,
            youtube: apiUser.socials?.youtube || mergedFormData.socials.youtube,
            linkedin: apiUser.socials?.linkedin || mergedFormData.socials.linkedin,
            website: apiUser.socials?.website || mergedFormData.socials.website,
          },
        };

        setUser((current: any) => ({ ...current, ...apiUser }));
        setProfilePreview(apiUser.profilePic || apiUser.profileImage || mergedUser.profileImage || mergedUser.profilePic || '');
        setFormData(updatedFormData);
        initialStateRef.current = {
          user: { ...mergedUser, ...apiUser },
          profilePreview: apiUser.profilePic || apiUser.profileImage || mergedUser.profileImage || mergedUser.profilePic || '',
          formData: updatedFormData,
        };
      } catch (error) {
        console.error('Failed to   photographer profile:', error);
      } finally {
        setLoading(false);
      }
    };

    hydrateProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('adminToken');

      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(`${API_URL}/photographer/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          businessName: formData.businessName,
          whatsappNo: formData.whatsappNo,
          contactNo: formData.contactNo,
          address: formData.address,
          bio: formData.bio,
          socials: formData.socials,
          profileImage: profilePreview,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        alert(`Error: ${data?.message || 'Failed to update profile'}`);
        return;
      }

      if (!data) {
        alert('Invalid server response while updating profile.');
        return;
      }

      const updatedUser = {
        ...(user || {}),
        ...data.user,
        username: formData.username,
        email: formData.email,
        businessName: formData.businessName,
        whatsappNo: formData.whatsappNo,
        contactNo: formData.contactNo,
        address: formData.address,
        bio: formData.bio,
        socials: formData.socials,
        profileImage: profilePreview,
        profilePic: profilePreview,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('profile-updated'));
      setUser(updatedUser);
      setProfilePreview(updatedUser.profileImage || updatedUser.profilePic || profilePreview);
      initialStateRef.current = {
        user: updatedUser,
        profilePreview: updatedUser.profileImage || updatedUser.profilePic || profilePreview,
        formData: {
          username: formData.username,
          email: formData.email,
          businessName: formData.businessName,
          whatsappNo: formData.whatsappNo,
          contactNo: formData.contactNo,
          address: formData.address,
          bio: formData.bio,
          socials: formData.socials,
        },
      };
toast.success('Profile updated successfully!', {
        style: {
          background: '#FDF3F2',
          color: '#000',
        },
      });
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      alert('Error updating profile: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.', { style: { background: '#FDF3F2', color: '#000' } });
      return;
    }

    const isStrong = passwordData.newPassword.length >= 8 && /[A-Z]/.test(passwordData.newPassword) && /[a-z]/.test(passwordData.newPassword) && /[0-9]/.test(passwordData.newPassword) && /[^A-Za-z0-9]/.test(passwordData.newPassword);
    
    if (!isStrong) {
      toast.error('Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.', { style: { background: '#FDF3F2', color: '#000' } });
      return;
    }

    setPasswordSaving(true);
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('adminToken');

      const response = await fetch(`${API_URL.replace(/\/admin$/, '')}/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to change password.', { style: { background: '#FDF3F2', color: '#000' } });
        return;
      }

      toast.success('Password changed successfully!', { style: { background: '#FDF3F2', color: '#000' } });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Error changing password', { style: { background: '#FDF3F2', color: '#000' } });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Settings...</div>;

  const handleDiscard = () => {
    const snapshot = initialStateRef.current;
    setUser(snapshot.user);
    setProfilePreview(snapshot.profilePreview);
    setFormData(snapshot.formData);
  };

  const resolveProfileImage = () => {
    const value = profilePreview || user?.profileImage || user?.profilePic || '';
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value;
    if (value.startsWith('/')) return value;
    return `${API_URL.replace(/\/api\/?$/, '')}/${value.replace(/^\/+/, '')}`;
  };

  const imageSrc =
    resolveProfileImage() ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC4KLFCK9wqKiWSOk5TSLyUg02B0K0CEenwg6Rv_90EVvNDbQoemOaUU_MJ4kxRYyVf15xRJ2OaAM4lE5SGp5Bk9IKU9fiwmYwJ7HyoKBBYzkFokru3bqt7T8Rd_VtpACeJTq24TiZj9aGDiAcDfBmkS5ghKfD3J_GpZWslnEGivWp0V4VuWHCwAkKYS_fX5UJWM-hFGZTs5J73Cr-nv2IB2jgG-mC6YirLA0REw440DDoxnXeBkyacaC1yIXQe7ZeNklXTXu3FqVw';

  return (
    <section className="px-4 py-8 pb-20 md:px-6 lg:px-12 md:py-10 md:pb-10" style={{ backgroundColor: '#FFF8F7' }}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#B10E6B' }}>
            Account Atelier
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-5xl" style={{ color: '#BF1270' }}>
            Personal Details
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#5E4D53] md:text-base">
            Update your profile picture and core details in one simple screen.
          </p>
        </div>

        <article className="space-y-7 rounded-2xl bg-white p-6 shadow-[0_16px_32px_rgba(33,26,27,0.06)] md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full" style={{ boxShadow: '0 0 0 3px rgba(177,14,107,0.18)' }}>
              <img src={imageSrc} alt="Photographer profile" className="h-full w-full object-cover" />
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: '#8D7980' }}>
                Profile Picture
              </p>
              <h2 className="mt-1 font-serif text-2xl text-[#211A1B]">{formData.username}</h2>
              <p className="text-sm text-[#6B5A60]">{user?.vendorTypes?.join(' & ') || 'Vendor'}</p>
            </div>

            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[#B10E6B] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#B10E6B] transition-colors hover:bg-[#B10E6B] hover:text-white">
              Change Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === 'string' ? reader.result : '';
                    if (result) {
                      setProfilePreview(result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#5E4D53]">
              <span>Username</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>

            <label className="space-y-2 text-sm text-[#5E4D53]">
              <span>Business / Studio Name</span>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>

            <label className="space-y-2 text-sm text-[#5E4D53] md:col-span-2">
              <span>Email Address (Read-only)</span>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full rounded-xl px-4 py-3 outline-none opacity-70"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>

            <label className="space-y-2 text-sm text-[#5E4D53]">
              <span>WhatsApp Number</span>
              <input
                type="text"
                value={formData.whatsappNo}
                onChange={(e) => setFormData({ ...formData, whatsappNo: e.target.value })}
                className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>

            <label className="space-y-2 text-sm text-[#5E4D53]">
              <span>Contact Number</span>
              <input
                type="text"
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>

            <label className="space-y-2 text-sm text-[#5E4D53] md:col-span-2">
              <span>Location / Address</span>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>

            <label className="space-y-2 text-sm text-[#5E4D53] md:col-span-2">
              <span>Bio</span>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full resize-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#B10E6B]/40"
                style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
              />
            </label>
          </div>

          <div className="pt-6 border-t border-[#F3E5E6]">
            <h3 className="font-serif text-xl text-[#211A1B] mb-4">Social Links</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {['instagram', 'facebook', 'tiktok', 'x', 'youtube', 'linkedin', 'website'].map((platform) => (
                <label key={platform} className="space-y-2 text-sm text-[#5E4D53]">
                  <span className="capitalize">{platform}</span>
                  <input
                    type="text"
                    value={(formData.socials as any)[platform]}
                    onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, [platform]: e.target.value } })}
                    placeholder={`https://${platform === 'website' ? 'yourdomain.com' : platform + '.com/yourprofile'}`}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                    style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: '#F3E5E6', color: '#7A656D' }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #B10E6B, #D23284)',
                boxShadow: '0 8px 16px rgba(177,14,107,0.2)',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </article>

        <article className="space-y-7 rounded-2xl bg-white p-6 shadow-[0_16px_32px_rgba(33,26,27,0.06)] md:p-8">
          <div>
            <h2 className="font-serif text-2xl text-[#211A1B]">Change Password</h2>
            <p className="mt-2 text-sm text-[#5E4D53]">Ensure your account is using a long, random password to stay secure.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-[#5E4D53] md:col-span-2 relative">
                <span>Current Password</span>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 pr-10 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                    style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E4D53] hover:text-[#B10E6B]"
                  >
                    {showPasswords.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </label>

              <label className="space-y-2 text-sm text-[#5E4D53] relative">
                <span>New Password</span>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 pr-10 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                    style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E4D53] hover:text-[#B10E6B]"
                  >
                    {showPasswords.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </label>

              <label className="space-y-2 text-sm text-[#5E4D53] relative">
                <span>Confirm New Password</span>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 pr-10 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                    style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E4D53] hover:text-[#B10E6B]"
                  >
                    {showPasswords.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #B10E6B, #D23284)',
                  boxShadow: '0 8px 16px rgba(177,14,107,0.2)',
                }}
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}
