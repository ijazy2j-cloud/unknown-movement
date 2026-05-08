function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="13" height="13" rx="3.5"/>
      <circle cx="8.5" cy="8.5" r="3"/>
      <circle cx="13" cy="4" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function StravaIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 14.5L8.5 5.5l4 9M6.5 10.5h4"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 10c0 .8-.2 1.6-.56 2.3A4.38 4.38 0 019.5 14.5a4.4 4.4 0 01-2.22-.6L3.5 15l1.1-3.78A4.4 4.4 0 014 8.82a4.5 4.5 0 014.5-4.32A4.5 4.5 0 0113 6.5c.97.85 1.5 2 1.5 3.5z"/>
    </svg>
  );
}

// ── REPLACE WITH YOUR WHATSAPP NUMBER ──
const WA_NUMBER = '94770000000';

export default function Footer({ onNavigate }) {
  return (
    <footer className="um-footer">
      <div className="um-footer-inner">

        <div className="um-footer-brand">
          <button className="um-footer-logo" onClick={() => onNavigate('home')}>
            Unknown Movement
          </button>
          <p className="um-footer-tagline">
            Discover rides &amp; runs across Sri Lanka.
          </p>
        </div>

        <div className="um-footer-mid">
          <div className="um-footer-social">
            <a href="#" className="um-footer-social-link">
              <InstagramIcon /> Instagram
            </a>
            <a href="#" className="um-footer-social-link">
              <StravaIcon /> Strava
            </a>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="um-footer-social-link"
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>

          <nav className="um-footer-nav">
            <button className="um-footer-nav-link" onClick={() => onNavigate('explore')}>
              Explore sessions
            </button>
            <button className="um-footer-nav-link" onClick={() => onNavigate('submit')}>
              Submit a ride
            </button>
          </nav>
        </div>

        <div className="um-footer-rule" />

        <p className="um-footer-credit">
          Crafted by{' '}
          <a
            href="https://corecraft.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="um-footer-credit-brand"
            style={{ textDecoration: 'none' }}
          >
            Core Craft Agency
          </a>
        </p>

      </div>
    </footer>
  );
}
