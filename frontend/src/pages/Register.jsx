import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sun, Moon, Zap, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const perks = [
  'AI mock interviews in 4 modes',
  'Aptitude, SQL & coding tests',
  'ATS resume scanner with scoring',
  'Group discussion simulator',
  'Performance dashboard & insights',
];

export default function Register() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showP,    setShowP]    = useState(false);
  const [showC,    setShowC]    = useState(false);
  const [loading,  setLoading]  = useState(false);

  const strength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : 3;

  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--accent-rose)', 'var(--accent-amber)', 'var(--accent-emerald)'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to AceIt 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>

      {/* Background */}
      <div className="bg-canvas">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-grid" />
      </div>

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col justify-between relative z-10"
        style={{
          width: '52%',
          padding: '3rem',
          borderRight: '1px solid var(--border-subtle)',
          background: 'linear-gradient(135deg, rgba(91,108,255,0.08) 0%, transparent 60%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="logo-mark">
            <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic' }}>A</span>
          </div>
          <span className="logo-text" style={{ fontSize: '1.3rem' }}>AceIt</span>
        </div>

        {/* Hero */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="badge badge-emerald" style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
              <Zap size={10} />
              Free to get started
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.1 }}>
              AceIt
            </h1>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Practice smarter. Interview better. Get hired.
            </p>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.7 }}>
              Join thousands of students who cracked their dream placements using AceIt's AI-powered prep system.
            </p>
          </motion.div>

          {/* Perks list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col gap-3"
            style={{ marginTop: '2.5rem' }}
          >
            {perks.map((perk, i) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <CheckCircle size={16} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{perk}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          © 2025 AceIt · Practice smarter. Interview better. Get hired.
        </p>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col justify-center items-center relative z-10"
        style={{ flex: 1, padding: '2rem' }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
        >
          {isDark
            ? <Sun size={16} color="var(--accent-amber)" />
            : <Moon size={16} color="var(--accent-indigo)" />}
        </button>

        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden" style={{ marginBottom: '2rem' }}>
            <div className="logo-mark">
              <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>A</span>
            </div>
            <div>
              <span className="logo-text">AceIt</span>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Practice smarter. Interview better. Get hired.
              </p>
            </div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ marginBottom: '2rem' }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Create your account
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Start your placement prep journey today — it's free
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            {/* Full name */}
            <div className="form-group">
              <label className="form-label">Full name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Arjun Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  style={{ paddingLeft: '40px' }}
                />
                <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  style={{ paddingLeft: '40px' }}
                />
                <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showP ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                />
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowP(s => !s)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showP ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: '8px' }}
                >
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3].map(level => (
                      <div key={level} style={{
                        flex: 1, height: '3px', borderRadius: '100px',
                        background: strength >= level ? strengthColor[strength] : 'var(--bg-overlay)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strengthColor[strength], fontWeight: 600 }}>
                    {strengthLabel[strength]} password
                  </span>
                </motion.div>
              )}
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showC ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    paddingLeft: '40px', paddingRight: '44px',
                    borderColor: confirm.length > 0
                      ? confirm === password ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      : undefined,
                  }}
                />
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowC(s => !s)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showC ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirm.length > 0 && confirm !== password && (
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                  Passwords don't match
                </span>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: '0.25rem' }}
              whileTap={{ scale: 0.97 }}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</>
                : 'Create account →'
              }
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Login link */}
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ color: 'var(--accent-indigo)', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign in →
              </Link>
            </p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}