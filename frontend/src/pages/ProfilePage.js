import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Lock, Save, ArrowLeft, Camera } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    API.get('/profile').then(r => {
      setProfile(r.data);
      setForm({ name: r.data.name || '', phone: r.data.phone || '', bio: r.data.bio || '' });
      if (r.data.profilePhoto) setPhotoPreview(`http://localhost:5000${r.data.profilePhoto}`);
    }).catch(() => toast.error('Failed to load profile'));
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('bio', form.bio);
      if (photoFile) fd.append('profilePhoto', photoFile);
      const res = await API.put('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Update auth context
      login({ ...user, name: res.data.name }, token);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await API.put('/profile/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  if (!profile) return <div className="profile-loading"><div className="profile-spinner" /></div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="profile-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="profile-title">My Profile</h1>

        {/* Avatar */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap">
            {photoPreview
              ? <img src={photoPreview} alt="Profile" className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{profile.name?.charAt(0).toUpperCase()}</div>
            }
            <label className="profile-avatar-edit" title="Change photo">
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="profile-avatar-info">
            <h2>{profile.name}</h2>
            <span className="profile-role-badge">{profile.role === 'owner' ? '🏠 Owner' : '🎓 Student'}</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="profile-card">
          <h3><User size={18} /> Personal Information</h3>
          <div className="profile-form">
            <div className="profile-field">
              <label>Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div className="profile-field">
              <label><Mail size={14} /> Email (cannot be changed)</label>
              <input type="email" value={profile.email} disabled className="profile-input-disabled" />
            </div>
            <div className="profile-field">
              <label><Phone size={14} /> Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <div className="profile-field">
              <label>Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell something about yourself..." />
            </div>
          </div>
          <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="profile-card">
          <h3><Lock size={18} /> Change Password</h3>
          <div className="profile-form">
            <div className="profile-field">
              <label>Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Enter current password" />
            </div>
            <div className="profile-field">
              <label>New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" />
            </div>
            <div className="profile-field">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" />
            </div>
          </div>
          <button className="profile-save-btn profile-pw-btn" onClick={handlePasswordChange} disabled={pwSaving}>
            <Lock size={16} /> {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
