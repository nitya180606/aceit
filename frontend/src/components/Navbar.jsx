import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Mic, ClipboardList, Users,
  MessageSquare, User, FileText, Sun, Moon,
  LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'       },
  { to: '/interview', icon: Mic,             label: 'Mock Interview'   },
  { to: '/tests',     icon: ClipboardList,   label: 'Tests'            },
  { to: '/gd',        icon: MessageSquare,   label: 'Group Discussion' },
  { to: '/community', icon: Users,           label: 'Community'        },
  { to: '/ats',       icon: FileText,        label: 'ATS Scanner'      },
  { to: '/profile',   icon: User,            label: 'Profile'          },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const NavLinks = () => (
    <>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      {/* ══════════════════════════════
          DESKTOP SIDEBAR (lg and above)
      ══════════════════════════════ */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sidebar"
        style={{ display: 'flex' }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic' }}>A</span>
          </div>
          <div>
            <div className="logo-text">AceIt</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              Practice smarter. Get hired.
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          <NavLinks />
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            onClick={toggleTheme}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', marginBottom: '8px' }}
          >
            {isDark
              ? <><Sun size={15} color="var(--accent-amber)" /><span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Light mode</span></>
              : <><Moon size={15} color="var(--accent-indigo)" /><span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dark mode</span></>
            }
          </button>

          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name truncate">{user?.name || 'User'}</div>
              <div className="user-role truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ══════════════════════════════
          MOBILE TOP BAR
      ══════════════════════════════ */}
      <div
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
          padding: '0.875rem 1.25rem',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        className="mobile-topbar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-mark" style={{ width: 30, height: 30 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontStyle: 'italic' }}>A</span>
          </div>
          <div>
            <div className="logo-text" style={{ fontSize: '1rem' }}>AceIt</div>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ══════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 65,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: '260px', zIndex: 70,
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Drawer logo */}
              <div className="sidebar-logo">
                <div className="logo-mark">
                  <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic' }}>A</span>
                </div>
                <div>
                  <div className="logo-text">AceIt</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    Practice smarter. Get hired.
                  </div>
                </div>
                {/* Close button inside drawer */}
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="sidebar-nav">
                <div className="nav-section-label">Menu</div>
                <NavLinks />
              </nav>

              {/* Drawer footer */}
              <div className="sidebar-footer">
                <button
                  onClick={toggleTheme}
                  className="nav-item"
                  style={{ width: '100%', background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', marginBottom: '8px' }}
                >
                  {isDark
                    ? <><Sun size={15} color="var(--accent-amber)" /><span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Light mode</span></>
                    : <><Moon size={15} color="var(--accent-indigo)" /><span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dark mode</span></>
                  }
                </button>

                <div className="user-chip">
                  <div className="user-avatar">{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="user-name truncate">{user?.name || 'User'}</div>
                    <div className="user-role truncate">{user?.email || ''}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}