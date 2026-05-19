import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sun, Moon, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: Zap,        label: 'AI Mock Interviews',   desc: 'Practice with adaptive AI interviewers'  },
  { icon: TrendingUp, label: 'Aptitude & SQL Tests',  desc: 'Timed tests with instant feedback'       },
  { icon: Shield,     label: 'ATS Resume Scanner',   desc: 'Score your resume against job postings'  },
  { icon: Users,      label: 'Group Discussions',    desc: 'Simulate real GD rounds with AI peers'   },
];

export default function Login() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>

      {/* Background orbs */}
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

        {/* Hero text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="badge badge-indigo" style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
              <Zap size={10} />
              AI-Powered Placement Prep
            </div>

            {/* App name */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              marginBottom: '0.4rem',
              lineHeight: 1.1,
            }}>
              AceIt
            </h1>

            {/* Tagline with gradient */}
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
              The complete AI-powered platform for placement preparation — mock interviews, aptitude tests, ATS scanner, and group discussions.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col gap-4"
            style={{ marginTop: '2.5rem' }}
          >
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  background: 'var(--accent-indigo-dim)',
                  border: '1px solid var(--border-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color="var(--accent-indigo)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
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
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Sign in to continue your prep journey
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
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: '0.5rem' }}
              whileTap={{ scale: 0.97 }}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</>
                : 'Sign in →'
              }
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3" style={{ margin: '0.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Register link */}
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{ color: 'var(--accent-indigo)', fontWeight: 600, textDecoration: 'none' }}
              >
                Create one free →
              </Link>
            </p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}