import { useState, useEffect, useRef } from 'react';

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8.5" cy="8.5" r="3.2" />
      <line x1="8.5" y1="1"    x2="8.5" y2="2.8"  />
      <line x1="8.5" y1="14.2" x2="8.5" y2="16"   />
      <line x1="1"   y1="8.5"  x2="2.8" y2="8.5"  />
      <line x1="14.2" y1="8.5" x2="16"  y2="8.5"  />
      <line x1="3.4" y1="3.4"  x2="4.7" y2="4.7"  />
      <line x1="12.3" y1="12.3" x2="13.6" y2="13.6" />
      <line x1="3.4" y1="13.6" x2="4.7" y2="12.3" />
      <line x1="12.3" y1="4.7" x2="13.6" y2="3.4"  />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.8 10.5A6.5 6.5 0 0 1 5.5 2.2a6.5 6.5 0 1 0 8.3 8.3z" />
    </svg>
  );
}

export default function Nav({ showBack, goBack, onNavigate, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, isAdmin }) {
  const [menuOpen,   setMenuOpen]   = useState(false); // user avatar dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // hamburger menu
  const userMenuRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const go = (screen) => {
    onNavigate(screen);
    setMobileOpen(false);
    setMenuOpen(false);
  };

  // Google OAuth users have avatar_url and full_name in user_metadata
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const initials = (
    user?.user_metadata?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) ||
    user?.email?.slice(0, 2) ||
    '?'
  ).toUpperCase();

  return (
    <>
      <nav className="um-nav">
        <div className="um-nav-left">
          {showBack && (
            <button className="um-nav-back-btn" onClick={goBack} aria-label="Go back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <button className="um-logo-btn" onClick={() => go('home')}>
            Unknown Movement
          </button>
        </div>

        <div className="um-nav-right">
          {/* Desktop-only nav links — hidden on mobile via CSS */}
          <div className="um-nav-desktop-links">
            <button
              className={`um-nav-link${currentScreen === 'explore' ? ' active' : ''}`}
              onClick={() => onNavigate('explore')}
            >
              Explore
            </button>
            <button
              className={`um-nav-link${currentScreen === 'clubs' ? ' active' : ''}`}
              onClick={() => onNavigate('clubs')}
            >
              Clubs
            </button>
            <button
              className={`um-nav-cta${currentScreen === 'submit' ? ' active' : ''}`}
              onClick={() => onNavigate('submit')}
            >
              Submit
            </button>
          </div>

          {/* Dark mode toggle — always visible */}
          <button
            className="um-dark-toggle"
            onClick={onToggleDark}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User auth — always visible */}
          {user ? (
            <div className="um-user-menu-wrap" ref={userMenuRef}>
              <button
                className={`um-user-avatar${menuOpen ? ' open' : ''}`}
                onClick={() => setMenuOpen(o => !o)}
                aria-label="User menu"
                style={{ padding: avatarUrl ? 0 : undefined, overflow: avatarUrl ? 'hidden' : undefined }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                  />
                ) : (
                  initials
                )}
              </button>
              {menuOpen && (
                <div className="um-user-menu">
                  <div className="um-user-menu-email">{user.email}</div>
                  <button className="um-user-menu-item" onClick={() => go('myevents')}>My Events</button>
                  <button className="um-user-menu-item" onClick={() => go('explore')}>Saved</button>
                  {isAdmin && (
                    <>
                      <div className="um-user-menu-sep" />
                      <button className="um-user-menu-item um-user-menu-admin" onClick={() => go('admin')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7, flexShrink: 0 }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        Admin Panel
                      </button>
                    </>
                  )}
                  <div className="um-user-menu-sep" />
                  <button
                    className="um-user-menu-item um-user-menu-signout"
                    onClick={() => { onSignOut(); setMenuOpen(false); }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="um-nav-signin" onClick={onSignIn}>Sign in</button>
          )}

          {/* Hamburger — mobile only, hidden on desktop via CSS */}
          <button
            className={`um-hamburger${mobileOpen ? ' open' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className="um-hamburger-line" />
            <span className="um-hamburger-line" />
            <span className="um-hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu panel */}
      {mobileOpen && (
        <>
          <div className="um-mobile-menu-panel" role="navigation" aria-label="Mobile navigation">
            <button
              className={`um-mobile-menu-item${currentScreen === 'explore' ? ' active' : ''}`}
              onClick={() => go('explore')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              Explore
            </button>
            <button
              className={`um-mobile-menu-item${currentScreen === 'clubs' ? ' active' : ''}`}
              onClick={() => go('clubs')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              </svg>
              Clubs
            </button>
            <button
              className={`um-mobile-menu-item${currentScreen === 'submit' ? ' active' : ''}`}
              onClick={() => go('submit')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Submit a session
            </button>
            {user && (
              <>
                <div className="um-mobile-menu-sep" />
                <button className="um-mobile-menu-item" onClick={() => go('myevents')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  My Events
                </button>
                <button className="um-mobile-menu-item" onClick={() => go('explore')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Saved sessions
                </button>
              </>
            )}
          </div>

          {/* Backdrop — tap outside to close */}
          <div
            className="um-mobile-menu-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        </>
      )}
    </>
  );
}
