'use client';

import { useState, useEffect } from 'react';
import { Camera, User as UserIcon } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = () => {
      const userRaw = localStorage.getItem('user');
      const userDataRaw = localStorage.getItem('userData');
      let user: any = {};
      let userData: any = {};
      try {
        user = userRaw ? JSON.parse(userRaw) : {};
        userData = userDataRaw ? JSON.parse(userDataRaw) : {};
      } catch {
        user = {};
        userData = {};
      }

      setProfile({
        name: user.name || user.fullName || userData.name || userData.fullName || '',
        email: user.email || userData.email || '',
        phone: user.phone || userData.phone || '',
        profileImage: user.profileImage || user.profilePic || userData.profileImage || userData.profilePic || '',
        bio: user.bio || userData.bio || '',
      });
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    // TODO: Save profile changes to API
    setIsEditing(false);
  };

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#2C1E26' }}>
          My Profile
        </h1>
        <p className="text-gray-600 mt-2" style={{ color: '#6B7387' }}>
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <div
        className="max-w-2xl rounded-2xl p-8"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
      >
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8 pb-8 border-b" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
          <div className="relative mb-4">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FEF0F1' }}
              >
                <UserIcon size={48} style={{ color: '#D23284' }} />
              </div>
            )}
            {isEditing && (
              <button
                className="absolute bottom-0 right-0 p-2 rounded-full transition-all hover:shadow-md"
                style={{ backgroundColor: '#D23284' }}
              >
                <Camera size={16} style={{ color: '#FFFFFF' }} />
              </button>
            )}
          </div>
          <h2 className="text-2xl font-serif font-bold text-center" style={{ color: '#2C1E26' }}>
            {profile.name || 'Your Name'}
          </h2>
          <p className="text-gray-600 mt-1" style={{ color: '#6B7387' }}>
            {profile.email}
          </p>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2C1E26' }}>
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                style={{ borderColor: '#E5CCD4' }}
              />
            ) : (
              <p className="text-gray-700">{profile.name || 'Not provided'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2C1E26' }}>
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                style={{ borderColor: '#E5CCD4' }}
              />
            ) : (
              <p className="text-gray-700">{profile.email || 'Not provided'}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2C1E26' }}>
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                style={{ borderColor: '#E5CCD4' }}
              />
            ) : (
              <p className="text-gray-700">{profile.phone || 'Not provided'}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2C1E26' }}>
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors resize-none"
                style={{ borderColor: '#E5CCD4' }}
              />
            ) : (
              <p className="text-gray-700">{profile.bio || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 pt-8 border-t" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 px-6 text-white font-semibold rounded-lg transition-all hover:shadow-md"
                style={{ background: 'linear-gradient(180deg, #C41474 0%, #B50F69 100%)' }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 px-6 font-semibold rounded-lg transition-all hover:bg-gray-100"
                style={{ color: '#6B7387', borderColor: '#E5CCD4', border: '1px solid' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 px-6 text-white font-semibold rounded-lg transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(180deg, #C41474 0%, #B50F69 100%)' }}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
