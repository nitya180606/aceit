import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Mail, Tag, Upload, FileText,
  Edit3, Save, X, CheckCircle, AlertCircle,
  Briefcase, Star
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function Profile() {
  const { user, login } = useAuth();
  const fileRef = useRef();

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [skillInput,    setSkillInput]    = useState('');

  // editable fields
  const [name,   setName]   = useState('');
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    api.get('/user/profile')
      .then(res => {
        setProfile(res.data);
        setName(res.data.name || '');
        setSkills(res.data.skills || []);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  // ── Save profile ──
  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/user/profile', { name, skills });
      setProfile(data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(profile.name || '');
    setSkills(profile.skills || []);
    setEditing(false);
  };

  // ── Skills ──
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) { toast.error('Skill already added'); return; }
    setSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

  const handleSkillKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  };

  // ── Resume upload ──
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }

    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      await api.post('/user/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Resume uploaded successfully! ✅');
      // refresh profile
      const { data } = await api.get('/user/profile');
      setProfile(data);
    } catch {
      toast.error('Resume upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-body)', maxWidth: '800px' }}>

      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} className="page-header">
        <div className="page-header-glow" style={{ background: 'var(--accent-indigo)' }} />
        <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <User size={10} /> My Profile
        </div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account, skills and resume</p>
      </motion.div>

      {/* ── Profile card ── */}
      <motion.div {...fadeUp(0.1)} className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>

          {/* Avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: '#fff',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 0 0 4px var(--accent-indigo-dim)',
            }}>
              {initials}
            </div>
            <div>
              {editing ? (
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', maxWidth: '260px' }}
                  placeholder="Your full name"
                />
              ) : (
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {profile?.name}
                </h2>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Mail size={13} />
                {profile?.email}
              </div>
            </div>
          </div>

          {/* Edit / Save buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn btn-ghost btn-sm"
                  disabled={saving}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                >
                  {saving
                    ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Saving...</>
                    : <><Save size={14} /> Save</>
                  }
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Skills card ── */}
      <motion.div {...fadeUp(0.18)} className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Star size={16} color="var(--accent-amber)" />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Skills</h3>
        </div>

        {/* Skill tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: editing ? '1rem' : 0 }}>
          {skills.length === 0 && !editing && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No skills added yet. Click Edit Profile to add some.
            </p>
          )}
          {skills.map(skill => (
            <span
              key={skill}
              className="badge badge-indigo"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              {skill}
              {editing && (
                <button
                  onClick={() => removeSkill(skill)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--accent-indigo)' }}
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Add skill input */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              className="form-input"
              placeholder="e.g. React, Python, SQL..."
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKey}
              style={{ flex: 1 }}
            />
            <button onClick={addSkill} className="btn btn-secondary btn-sm">
              <Tag size={13} /> Add
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Resume card ── */}
      <motion.div {...fadeUp(0.26)} className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <FileText size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Resume</h3>
        </div>

        {/* Resume status */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: profile?.resume ? 'var(--accent-emerald-dim)' : 'var(--bg-overlay)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${profile?.resume ? 'rgba(0,229,160,0.3)' : 'var(--border-subtle)'}`,
            }}>
              {profile?.resume
                ? <CheckCircle size={18} color="var(--accent-emerald)" />
                : <AlertCircle size={18} color="var(--text-muted)" />
              }
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {profile?.resume ? 'Resume uploaded' : 'No resume uploaded'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {profile?.resume
                  ? `${profile.resumeText?.length?.toLocaleString() || 0} characters extracted · PDF`
                  : 'Upload a PDF to enable ATS scanning'
                }
              </div>
            </div>
          </div>

          {profile?.resume && (
            <span className="badge badge-emerald">Active</span>
          )}
        </div>

        {/* Upload area */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={handleResumeUpload}
          style={{ display: 'none' }}
        />
        <motion.button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            padding: '1.25rem',
            border: '2px dashed var(--border-default)',
            borderRadius: '12px',
            background: 'transparent',
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-indigo)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
        >
          {uploading ? (
            <>
              <div className="spinner" style={{ borderTopColor: 'var(--accent-indigo)', borderColor: 'var(--border-default)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={22} color="var(--accent-indigo)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.resume ? 'Replace resume' : 'Upload resume'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PDF only · Max 5MB
              </span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ── Performance summary ── */}
      {profile?.performanceHistory?.length > 0 && (
        <motion.div {...fadeUp(0.34)} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Briefcase size={16} color="var(--accent-indigo)" />
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Performance History
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profile.performanceHistory.slice(-5).reverse().map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '10px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${
                    entry.category === 'interview' ? 'badge-indigo' :
                    entry.category === 'gd'        ? 'badge-emerald' :
                    entry.category === 'ats'       ? 'badge-amber' : 'badge-cyan'
                  }`}>
                    {entry.category?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div style={{
                  fontSize: '1rem', fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: entry.score >= 70 ? 'var(--accent-emerald)' :
                         entry.score >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                }}>
                  {entry.score ?? '—'}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}