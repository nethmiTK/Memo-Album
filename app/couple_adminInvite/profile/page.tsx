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
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

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
      <div className="mb-12 pb-8 border-b-4" style={{ borderColor: '#D23284' }}>
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2" style={{ color: '#2C1E26' }}>
          The Profile
        </h1>
        <p className="text-lg text-gray-600" style={{ color: '#6B7387' }}>
          Manage your digital identity and preferences. Curated settings for a more intentional experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
              <div className="relative flex-shrink-0">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-28 h-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF0F1' }}>
                    <UserIcon size={56} style={{ color: '#D23284' }} />
                  </div>
                )}
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: '#D23284' }}>
                    <Camera size={16} style={{ color: '#FFFFFF' }} />
                  </button>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B9095' }}>
                  Curator Identity
                </p>
                <h2 className="text-3xl font-serif font-bold mb-1" style={{ color: '#2C1E26' }}>
                  {profile.name || 'Your Name'}
                </h2>
                <p className="text-gray-600" style={{ color: '#6B7387' }}>
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="space-y-6 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B9095' }}>
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                      style={{ borderColor: '#E5CCD4', backgroundColor: '#FEF0F1' }}
                    />
                  ) : (
                    <p className="text-gray-700 font-medium" style={{ color: '#2C1E26' }}>{profile.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B9095' }}>
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                      style={{ borderColor: '#E5CCD4', backgroundColor: '#FEF0F1' }}
                    />
                  ) : (
                    <p className="text-gray-700 font-medium" style={{ color: '#2C1E26' }}>{profile.email || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B9095' }}>
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                    style={{ borderColor: '#E5CCD4', backgroundColor: '#FEF0F1' }}
                  />
                ) : (
                  <p className="text-gray-700 font-medium" style={{ color: '#2C1E26' }}>{profile.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B9095' }}>
                  Short Biography
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors resize-none"
                    style={{ borderColor: '#E5CCD4', backgroundColor: '#FEF0F1' }}
                  />
                ) : (
                  <p className="text-gray-700 font-medium" style={{ color: '#2C1E26' }}>{profile.bio || 'Not provided'}</p>
                )}
              </div>
            </div>

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

          <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#9B9095' }}>
              Privacy & Security
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold" style={{ color: '#2C1E26' }}>
                    Profile Visibility
                  </p>
                  <p className="text-sm text-gray-600 mt-1" style={{ color: '#6B7387' }}>
                    Make your album visible to other users
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileVisibility((current) => !current)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                    profileVisibility ? 'bg-[#D23284]' : 'bg-[#E5CCD4]'
                  }`}
                  aria-pressed={profileVisibility}
                  aria-label="Toggle profile visibility"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                      profileVisibility ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                  <span className="absolute -right-10 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9B9095' }}>
                    {profileVisibility ? 'On' : 'Off'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
                <div>
                  <p className="font-semibold" style={{ color: '#2C1E26' }}>
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-gray-600 mt-1" style={{ color: '#6B7387' }}>
                    Add an extra layer of security
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorAuth((current) => !current)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                    twoFactorAuth ? 'bg-[#D23284]' : 'bg-[#E5CCD4]'
                  }`}
                  aria-pressed={twoFactorAuth}
                  aria-label="Toggle two factor authentication"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                      twoFactorAuth ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                  <span className="absolute -right-10 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9B9095' }}>
                    {twoFactorAuth ? 'On' : 'Off'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#9B9095' }}>
              Communication
            </h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 rounded accent-[#D23284]" style={{ accentColor: '#D23284' }} />
                <span className="text-sm" style={{ color: '#2C1E26' }}>New Collection Alerts</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 rounded accent-[#D23284]" style={{ accentColor: '#D23284' }} />
                <span className="text-sm" style={{ color: '#2C1E26' }}>Editorial Monthly</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 rounded accent-[#D23284]" style={{ accentColor: '#D23284' }} />
                <span className="text-sm" style={{ color: '#2C1E26' }}>Partner Collaborations</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: '#FEF0F1' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#9B9095' }}>
              Account Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#9B9095' }}>Plan</span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full" style={{ backgroundColor: '#D23284', color: '#FFFFFF' }}>
                  Premium
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#9B9095' }}>Storage</span>
                <span style={{ color: '#2C1E26' }}>2.5GB / 50GB</span>
              </div>
              <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ backgroundColor: '#D23284', width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
