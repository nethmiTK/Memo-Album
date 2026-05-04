'use client';

import { useState } from 'react';
import { Lock, Bell as BellIcon, Eye } from 'lucide-react';

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  shareActivity: boolean;
  twoFactorAuth: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    pushNotifications: false,
    shareActivity: true,
    twoFactorAuth: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState('notifications');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // TODO: Call API to change password
    setSettings({
      ...settings,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    alert('Password changed successfully');
  };

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#2C1E26' }}>
          Settings
        </h1>
        <p className="text-gray-600 mt-2" style={{ color: '#6B7387' }}>
          Manage your account preferences and security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-[#D23284] text-[#D23284]'
              : 'border-transparent text-gray-600 hover:text-gray-700'
          }`}
        >
          <BellIcon className="inline mr-2" size={18} />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-[#D23284] text-[#D23284]'
              : 'border-transparent text-gray-600 hover:text-gray-700'
          }`}
        >
          <Lock className="inline mr-2" size={18} />
          Security
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl">
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
          >
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2C1E26' }}>
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600 mt-1" style={{ color: '#6B7387' }}>
                  Receive email updates about your albums and photos
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                  className="sr-only"
                />
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`h-6 w-11 rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-[#D23284]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`absolute left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2C1E26' }}>
                  Push Notifications
                </h3>
                <p className="text-sm text-gray-600 mt-1" style={{ color: '#6B7387' }}>
                  Get push notifications on your device
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => handleToggle('pushNotifications')}
                  className="sr-only"
                />
                <button
                  onClick={() => handleToggle('pushNotifications')}
                  className={`h-6 w-11 rounded-full transition-colors ${
                    settings.pushNotifications ? 'bg-[#D23284]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`absolute left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>

            {/* Share Activity */}
            <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: 'rgba(229, 204, 212, 0.2)' }}>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2C1E26' }}>
                  Share Activity
                </h3>
                <p className="text-sm text-gray-600 mt-1" style={{ color: '#6B7387' }}>
                  Let others see when you view and favorite photos
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={settings.shareActivity}
                  onChange={() => handleToggle('shareActivity')}
                  className="sr-only"
                />
                <button
                  onClick={() => handleToggle('shareActivity')}
                  className={`h-6 w-11 rounded-full transition-colors ${
                    settings.shareActivity ? 'bg-[#D23284]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`absolute left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.shareActivity ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-2xl space-y-6">
          {/* Change Password */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
          >
            <h3 className="text-xl font-semibold mb-6" style={{ color: '#2C1E26' }}>
              Change Password
            </h3>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2C1E26' }}>
                  Current Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.currentPassword}
                  onChange={(e) =>
                    setSettings({ ...settings, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                  style={{ borderColor: '#E5CCD4' }}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2C1E26' }}>
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.newPassword}
                  onChange={(e) =>
                    setSettings({ ...settings, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                  style={{ borderColor: '#E5CCD4' }}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2C1E26' }}>
                  Confirm Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.confirmPassword}
                  onChange={(e) =>
                    setSettings({ ...settings, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-[#D23284] transition-colors"
                  style={{ borderColor: '#E5CCD4' }}
                />
              </div>

              {/* Show Password Toggle */}
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-2 text-sm mt-4 transition-colors hover:text-[#D23284]"
                style={{ color: '#6B7387' }}
              >
                <Eye size={16} />
                {showPasswords ? 'Hide' : 'Show'} passwords
              </button>

              {/* Save Button */}
              <button
                onClick={handlePasswordChange}
                className="w-full py-3 px-6 text-white font-semibold rounded-lg transition-all hover:shadow-md mt-6"
                style={{ background: 'linear-gradient(180deg, #C41474 0%, #B50F69 100%)' }}
              >
                Update Password
              </button>
            </div>
          </div>

          {/* Two Factor Authentication */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5CCD4' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2C1E26' }}>
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 mt-1" style={{ color: '#6B7387' }}>
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={() => handleToggle('twoFactorAuth')}
                  className="sr-only"
                />
                <button
                  onClick={() => handleToggle('twoFactorAuth')}
                  className={`h-6 w-11 rounded-full transition-colors ${
                    settings.twoFactorAuth ? 'bg-[#D23284]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`absolute left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.twoFactorAuth ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
