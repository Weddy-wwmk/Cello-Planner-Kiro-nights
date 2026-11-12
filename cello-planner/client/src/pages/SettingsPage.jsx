import React, { useState } from 'react';
import { Settings, User, Lock, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileLoading(true); setProfileMsg(null);
    try {
      await api.put('/auth/profile', profile);
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally { setProfileLoading(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { setPasswordMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setPasswordLoading(true); setPasswordMsg(null);
    try {
      await api.put('/auth/password', { current: passwords.current, next: passwords.next });
      setPasswordMsg({ type: 'success', text: 'Password changed.' });
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally { setPasswordLoading(false); }
  }

  function Msg({ msg }) {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 mt-1 ${msg.type === 'success' ? 'bg-sage-50 border border-sage-200 text-sage-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
        {msg.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
        {msg.text}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Profile */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-sage-800 text-lg flex items-center gap-2 mb-5">
          <User size={18} className="text-sage-500" /> Profile
        </h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1">Full Name</label>
            <input className="input-field" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} disabled={profileLoading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1">Email</label>
            <input type="email" className="input-field" value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} disabled={profileLoading} />
          </div>
          <Msg msg={profileMsg} />
          <button type="submit" disabled={profileLoading} className="btn-primary flex items-center gap-2">
            {profileLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Profile
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-sage-800 text-lg flex items-center gap-2 mb-5">
          <Lock size={18} className="text-sage-500" /> Change Password
        </h3>
        <form onSubmit={changePassword} className="space-y-4">
          {['current','next','confirm'].map(k => (
            <div key={k}>
              <label className="block text-sm font-semibold text-sage-700 mb-1 capitalize">
                {k === 'next' ? 'New Password' : k === 'confirm' ? 'Confirm New Password' : 'Current Password'}
              </label>
              <input type="password" className="input-field" value={passwords[k]} onChange={e => setPasswords(p => ({...p, [k]: e.target.value}))} disabled={passwordLoading} />
            </div>
          ))}
          <Msg msg={passwordMsg} />
          <button type="submit" disabled={passwordLoading} className="btn-primary flex items-center gap-2">
            {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Update Password
          </button>
        </form>
      </div>

      {/* Danger */}
      <div className="glass-card rounded-2xl p-6 border border-red-100">
        <h3 className="font-display font-semibold text-red-700 text-lg mb-3">Danger Zone</h3>
        <p className="text-sage-500 text-sm mb-4">Sign out from all devices.</p>
        <button onClick={logout} className="border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 text-sm">
          Sign Out
        </button>
      </div>
    </div>
  );
}
