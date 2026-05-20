'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    businessName: '',
    whatsappNo: '',
    contactNo: '',
    address: '',
    bio: ''
  });

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
    setUser(mergedUser);
    setProfilePreview(mergedUser.profileImage || mergedUser.profilePic || '');
    setFormData({
      username: mergedUser.username || 'Photographer',
      email: mergedUser.email || 'demo@memoalbum.com',
      businessName: mergedUser.businessName || 'MemoAlbum Studio',
      whatsappNo: mergedUser.whatsappNo || '',
      contactNo: mergedUser.contactNo || '',
      address: mergedUser.address || '',
      bio: mergedUser.bio || ''
    });
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "vendorNextRoute=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/login';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('adminToken');
      
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setSaving(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

      const response = await fetch(`${API_URL}/photographer/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          businessName: formData.businessName,
          whatsappNo: formData.whatsappNo,
          contactNo: formData.contactNo,
          address: formData.address,
          bio: formData.bio,
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
        setSaving(false);
        return;
      }

      if (!data) {
        alert('Invalid server response while updating profile.');
        setSaving(false);
        return;
      }

      // Update local storage with the response data
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
        profileImage: profilePreview,
        profilePic: profilePreview,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('profile-updated'));
      setUser(updatedUser);
      setProfileFile(null);
      alert('Profile updated successfully!');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      alert('Error updating profile: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Settings...</div>;

  const resolveProfileImage = () => {
    const value = profilePreview || user?.profileImage || user?.profilePic || '';
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value;
    if (value.startsWith('/')) return value;
    return value;
  };

  const imageSrc = resolveProfileImage() || "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KLFCK9wqKiWSOk5TSLyUg02B0K0CEenwg6Rv_90EVvNDbQoemOaUU_MJ4kxRYyVf15xRJ2OaAM4lE5SGp5Bk9IKU9fiwmYwJ7HyoKBBYzkFokru3bqt7T8Rd_VtpACeJTq24TiZj9aGDiAcDfBmkS5ghKfD3J_GpZWslnEGivWp0V4VuWHCwAkKYS_fX5UJWM-hFGZTs5J73Cr-nv2IB2jgG-mC6YirLA0REw440DDoxnXeBkyacaC1yIXQe7ZeNklXTXu3FqVw";

  return (
    <section className="px-6 md:px-12 py-10" style={{ backgroundColor: '#FFF8F7' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: '#B10E6B' }}>
              Account Atelier
            </p>
            <h1 className="text-3xl md:text-5xl font-serif mt-2" style={{ color: '#211A1B' }}>
              Personal Details
            </h1>
            <p className="mt-3 max-w-xl text-sm md:text-base" style={{ color: '#5E4D53' }}>
              Keep your profile and account preferences up to date so clients always see the right details.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-[#B10E6B] text-[#B10E6B] text-[10px] tracking-[0.1em] uppercase font-bold w-fit transition-all hover:bg-[#B10E6B] hover:text-white"
            >
              Log Out
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white text-[10px] tracking-[0.1em] uppercase font-bold w-fit transition-transform hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #B10E6B, #D23284)',
                boxShadow: '0 8px 16px rgba(177,14,107,0.2)',
              }}
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <article
            className="xl:col-span-1 rounded-2xl p-6"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 16px 32px rgba(33,26,27,0.06)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 3px rgba(177,14,107,0.18)' }}>
                <img
                  src={imageSrc}
                  alt="Photographer profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: '#8D7980' }}>
                  Profile Preview
                </p>
                <h2 className="text-2xl font-serif" style={{ color: '#211A1B' }}>
                  {formData.username}
                </h2>
                <p className="text-sm" style={{ color: '#6B5A60' }}>
                  {user?.vendorTypes?.join(' & ') || 'Vendor'}
                </p>
                <label className="mt-3 inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em] font-bold border border-[#B10E6B] text-[#B10E6B] hover:bg-[#B10E6B] hover:text-white transition-colors">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setProfileFile(file);
                      setProfilePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-sm" style={{ color: '#5E4D53' }}>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FDF1F4' }}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: '#8D7980' }}>
                  Email
                </p>
                <p className="mt-1">{formData.email}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FDF1F4' }}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: '#8D7980' }}>
                  WhatsApp No
                </p>
                <p className="mt-1">{formData.whatsappNo}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FDF1F4' }}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: '#8D7980' }}>
                  Contact No
                </p>
                <p className="mt-1">{formData.contactNo || 'N/A'}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FDF1F4' }}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: '#8D7980' }}>
                  Location / Address
                </p>
                <p className="mt-1">{formData.address}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FDF1F4' }}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: '#8D7980' }}>
                  Bio
                </p>
                <p className="mt-1 italic">{formData.bio || 'No bio added yet'}</p>
              </div>
            </div>
          </article>

          <article
            className="xl:col-span-2 rounded-2xl p-6 md:p-8 space-y-7"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 16px 32px rgba(33,26,27,0.06)' }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: '#8D7980' }}>
                Personal Information
              </p>
              <h3 className="text-2xl font-serif mt-2" style={{ color: '#211A1B' }}>
                Update your details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm" style={{ color: '#5E4D53' }}>
                <span>Username</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
              <label className="space-y-2 text-sm" style={{ color: '#5E4D53' }}>
                <span>Business / Studio Name</span>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
              <label className="space-y-2 text-sm md:col-span-2" style={{ color: '#5E4D53' }}>
                <span>Email Address (Read-only)</span>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full rounded-xl px-4 py-3 outline-none opacity-70"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
              <label className="space-y-2 text-sm" style={{ color: '#5E4D53' }}>
                <span>WhatsApp Number</span>
                <input
                  type="text"
                  value={formData.whatsappNo}
                  onChange={(e) => setFormData({...formData, whatsappNo: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
              <label className="space-y-2 text-sm" style={{ color: '#5E4D53' }}>
                <span>Contact Number</span>
                <input
                  type="text"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({...formData, contactNo: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
              <label className="space-y-2 text-sm md:col-span-2" style={{ color: '#5E4D53' }}>
                <span>Location / Address</span>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-[#B10E6B]/40"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
              <label className="space-y-2 text-sm md:col-span-2" style={{ color: '#5E4D53' }}>
                <span>Bio</span>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-[#B10E6B]/40"
                  style={{ backgroundColor: '#FDF3F2', color: '#211A1B' }}
                />
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg text-[10px] uppercase tracking-[0.1em] font-bold"
                style={{ backgroundColor: '#F3E5E6', color: '#7A656D' }}
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-white text-[10px] uppercase tracking-[0.1em] font-bold transition-transform hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #B10E6B, #D23284)',
                  boxShadow: '0 8px 16px rgba(177,14,107,0.2)',
                }}
              >
                {saving ? 'Saving...' : 'Save Account Settings'}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

