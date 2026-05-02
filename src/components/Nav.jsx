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

export default function Nav({ showBack, goBack, onNavigate, currentScreen, darkMode, onToggleDark }) {
  return (
    <nav className="um-nav">
      <div className="um-nav-left">
        {showBack && (
          <button className="um-nav-back-btn" onClick={goBack} aria-label="Go back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button className="um-logo-btn" onClick={() => onNavigate('home')}>
          Unknown Movement
        </button>
      </div>
      <div className="um-nav-right">
        <button
          className={`um-nav-link${currentScreen === 'explore' ? ' active' : ''}`}
          onClick={() => onNavigate('explore')}
        >
          Explore
        </button>
        <button
          className={`um-nav-cta${currentScreen === 'submit' ? ' active' : ''}`}
          onClick={() => onNavigate('submit')}
        >
          Submit
        </button>
        <button
          className="um-dark-toggle"
          onClick={onToggleDark}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
