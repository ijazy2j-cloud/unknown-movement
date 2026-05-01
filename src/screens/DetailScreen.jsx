import Nav from '../components/Nav';
import Badge from '../components/Badge';

export default function DetailScreen({ onNavigate }) {
  return (
    <div className="um-screen">
      <Nav back title="Sessions" onBack={() => onNavigate('explore')} />

      {/* Hero with image */}
      <div className="um-detail-hero">
        <div className="um-detail-hero-img">
          <img src="/8b5b13d59c2c3457b490a7aceaa16a71.jpg" alt="Cyclists overlooking city" />
          <div className="um-detail-hero-overlay" />
        </div>
        <div className="um-detail-hero-content">
          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
            <Badge type="ride">Ride</Badge>
            <Badge type="social">Social</Badge>
            <Badge type="coffee">Coffee stop</Badge>
          </div>
          <div className="um-detail-title">Colombo Coffee Loop</div>
          <div className="um-detail-meta">Sat 3 May · 6:00 AM · Independence Square, Colombo 7</div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="um-quick-stat-row">
        <div className="um-qs">
          <span className="um-qs-num">42 <span className="um-qs-unit">km</span></span>
          <span className="um-qs-lbl">Distance</span>
        </div>
        <div className="um-qs">
          <span className="um-qs-num">25–28</span>
          <span className="um-qs-lbl">km/h avg</span>
        </div>
        <div className="um-qs">
          <span className="um-qs-num">~2 <span className="um-qs-unit">hr</span></span>
          <span className="um-qs-lbl">Duration</span>
        </div>
        <div className="um-qs">
          <span className="um-qs-num">12</span>
          <span className="um-qs-lbl">Joining</span>
        </div>
      </div>

      {/* Route */}
      <div className="um-section">
        <div className="um-section-hd">Route</div>
        <div style={{ height: 130, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <img src="/b2df6b431f8adf438c1c8e7d62d58f7c.jpg" alt="Coffee stop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'oklch(11% 0.008 250 / 0.18)', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { label: 'Start', val: 'Independence Square' },
            { label: 'End', val: 'Barista Café, Bambalapitiya' },
          ].map(p => (
            <div key={p.label} style={{ background: 'var(--um-bg2)', borderRadius: 5, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: 'var(--um-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 3 }}>{p.label}</div>
              <div style={{ fontSize: 12, color: 'var(--um-text)', fontWeight: 400 }}>{p.val}</div>
            </div>
          ))}
        </div>
        <button style={{ marginTop: 10, fontSize: 11, color: 'var(--um-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0, fontFamily: 'inherit' }}>
          Open in Strava
        </button>
      </div>

      {/* Suitability */}
      <div className="um-section">
        <div className="um-section-hd">Suitability</div>
        <div className="um-suit-grid">
          <Badge type="nodrop">No drop</Badge>
          <Badge type="beginner">Beginner OK</Badge>
          <Badge type="tourist">Tourist friendly</Badge>
          <Badge type="coffee">Coffee stop</Badge>
          <Badge type="tag">Helmet recommended</Badge>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--um-text-2)', lineHeight: 1.65, fontWeight: 400 }}>
          A social-paced ride — no one gets left behind. Comfortable for riders at 25–28 km/h on flat coastal roads.
        </div>
      </div>

      {/* Organiser */}
      <div className="um-section">
        <div className="um-section-hd">Organiser</div>
        <div className="um-org-row">
          <div className="um-org-mark">CC</div>
          <div>
            <div className="um-org-name">Colombo Cycling Club</div>
            <div className="um-org-sub">Active since 2019 · 140 members</div>
            <div className="um-org-btns">
              <button className="um-btn um-btn-ghost um-btn-sm">WhatsApp</button>
              <button className="um-btn um-btn-outline um-btn-sm">Strava</button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety */}
      <div className="um-section" style={{ borderBottom: 'none' }}>
        <div className="um-section-hd">Safety</div>
        <div className="um-notes">
          {[
            'Ride together at all times',
            'Helmet strongly recommended',
            'Bring water — no stops for first 20 km',
            'WhatsApp group link shared on confirmation',
          ].map(n => (
            <div key={n} className="um-note">
              <span className="um-note-dash">—</span>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="um-cta-strip">
        <button className="um-btn um-btn-primary" style={{ flex: 2 }}>I'm interested</button>
        <button className="um-btn um-btn-outline" style={{ flex: 1 }}>WhatsApp</button>
        <button className="um-btn um-btn-ghost" style={{ padding: '12px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v9M3 6l4-4 4 4M2 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
