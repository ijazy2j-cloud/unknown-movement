import Nav from '../components/Nav';
import Badge from '../components/Badge';
import SessionRow from '../components/SessionRow';

export default function HomeScreen({ onNavigate }) {
  return (
    <div className="um-screen">
      <Nav onSubmit={() => onNavigate('submit')} />

      {/* Hero */}
      <div className="um-hero">
        <div className="um-hero-img">
          <img src="/8370b6d97ee89c13247896b6b0583c65.jpg" alt="Runners at golden hour" />
          <div className="um-hero-img-overlay" />
        </div>
        <div className="um-hero-content">
          <div className="um-hero-eyebrow">Sri Lanka · May 2026</div>
          <div className="um-hero-title">
            Find your next<br />
            <em>ride or run.</em>
          </div>
          <div className="um-hero-sub">
            Rides, runs, coffee sessions, training groups and endurance events across the island.
          </div>
          <div className="um-hero-btns">
            <button className="um-hero-btn-primary" onClick={() => onNavigate('explore')}>Explore sessions</button>
            <button className="um-hero-btn-secondary" onClick={() => onNavigate('submit')}>Submit one</button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="um-stats-strip">
        <div className="um-stat">
          <span className="um-stat-num">24</span>
          <span className="um-stat-lbl">This week</span>
        </div>
        <div className="um-stat">
          <span className="um-stat-num">8</span>
          <span className="um-stat-lbl">Weekend</span>
        </div>
        <div className="um-stat">
          <span className="um-stat-num">6</span>
          <span className="um-stat-lbl">Clubs</span>
        </div>
        <div className="um-stat">
          <span className="um-stat-num">3</span>
          <span className="um-stat-lbl">Cities</span>
        </div>
      </div>

      {/* This weekend */}
      <div className="um-divider-label">
        <span className="um-divider-label-text">This weekend</span>
        <span className="um-divider-line" />
        <span style={{ fontSize: 10, color: 'var(--um-accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>Sat–Sun 3–4 May</span>
      </div>

      <SessionRow title="Colombo Coffee Loop" type="Ride" day="3" dow="Sat" time="6:00" location="Colombo 7" km="42" pace="25–28 km/h" difficulty="Social" joining="12" tags={[{ type: 'nodrop', label: 'No drop' }, { type: 'coffee', label: 'Coffee stop' }]} onClick={() => onNavigate('detail')} />
      <SessionRow title="Negombo Beach Run" type="Run" day="3" dow="Sat" time="6:30" location="Negombo" km="10" pace="6:00/km" difficulty="Social" joining="18" tags={[{ type: 'beginner', label: 'Beginner OK' }]} onClick={() => onNavigate('detail')} />
      <SessionRow title="Galle Face Sunrise Roll" type="Ride" day="4" dow="Sun" time="5:45" location="Fort, Colombo" km="28" pace="22–25 km/h" difficulty="Social" joining="7" tags={[{ type: 'coffee', label: 'Coffee stop' }, { type: 'tourist', label: 'Tourist OK' }]} onClick={() => onNavigate('detail')} />
      <SessionRow title="Kandy Hills Interval" type="Run" day="4" dow="Sun" time="5:30" location="Kandy" km="12" pace="5:00/km" difficulty="Hard" joining="9" tags={[{ type: 'hard', label: 'Hard' }]} onClick={() => onNavigate('detail')} />

      {/* Upcoming events */}
      <div className="um-section-label" style={{ marginBottom: 12 }}>
        <span className="um-section-title">Upcoming events</span>
        <button className="um-section-link">View calendar</button>
      </div>

      <div className="um-event-row">
        <div className="um-event-date">
          <span className="um-event-d">17</span>
          <span className="um-event-m">May</span>
        </div>
        <div style={{ width: 1, background: 'var(--um-border-lt)', flexShrink: 0 }} />
        <div className="um-event-body">
          <div className="um-event-title">Colombo Tri Series</div>
          <div className="um-event-meta">Beira Lake · Triathlon · 750m swim / 20 km bike / 5 km run</div>
          <div style={{ marginTop: 6 }}><Badge type="tri">Triathlon</Badge></div>
        </div>
      </div>
      <div className="um-event-row">
        <div className="um-event-date">
          <span className="um-event-d">1</span>
          <span className="um-event-m">Jun</span>
        </div>
        <div style={{ width: 1, background: 'var(--um-border-lt)', flexShrink: 0 }} />
        <div className="um-event-body">
          <div className="um-event-title">Kandy Mountain Challenge</div>
          <div className="um-event-meta">Kandy · Road Ride · 120 km · Gran Fondo format</div>
          <div style={{ marginTop: 6 }}><Badge type="ride">Endurance ride</Badge></div>
        </div>
      </div>

      {/* Active clubs */}
      <div className="um-section-label" style={{ margin: '20px 0 0' }}>
        <span className="um-section-title">Active clubs</span>
        <button className="um-section-link">See all</button>
      </div>
      <div className="um-club-row">
        <div className="um-club-mark">CC</div>
        <div style={{ flex: 1 }}>
          <div className="um-club-name">Colombo Cycling Club</div>
          <div className="um-club-meta">Colombo · 140 members · 3× weekly</div>
        </div>
        <Badge type="ride">Ride</Badge>
      </div>
      <div className="um-club-row">
        <div className="um-club-mark" style={{ background: 'oklch(36% 0.09 220)' }}>SR</div>
        <div style={{ flex: 1 }}>
          <div className="um-club-name">Sri Lanka Runners</div>
          <div className="um-club-meta">Island-wide · 220 members · 5× weekly</div>
        </div>
        <Badge type="run">Run</Badge>
      </div>

      {/* Submit CTA */}
      <div style={{ margin: '20px 22px 36px', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--um-border)' }}>
        <div style={{ height: 140, position: 'relative', overflow: 'hidden' }}>
          <img src="/49fab97914717dd5757d45ba98e97a2c.jpg" alt="Community group" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'oklch(11% 0.008 250 / 0.45)' }} />
        </div>
        <div style={{ padding: '18px 20px 20px', background: 'var(--um-surface)' }}>
          <div className="um-submit-cta-title">Organising a session?</div>
          <div className="um-submit-cta-sub">Share it with the community — free, and done in under two minutes.</div>
          <button className="um-btn um-btn-primary um-btn-full" onClick={() => onNavigate('submit')}>
            Submit a ride or run
          </button>
        </div>
      </div>
    </div>
  );
}
