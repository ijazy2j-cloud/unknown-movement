import { useState } from 'react';
import Nav from '../components/Nav';
import SessionRow from '../components/SessionRow';

export default function ExploreScreen({ onNavigate }) {
  const [active, setActive] = useState('All');
  const filters = ['All', 'Ride', 'Run', 'This weekend', 'Coffee stop', 'No drop', 'Beginner'];

  return (
    <div className="um-screen">
      <Nav onBack={() => onNavigate('home')} />

      {/* Search */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ position: 'relative' }}>
          <input
            className="um-input"
            placeholder="Search sessions, locations, clubs"
            style={{ paddingLeft: 36, fontSize: 13 }}
          />
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Filter chips */}
      <div className="um-chips">
        {filters.map(f => (
          <button key={f} className={`um-chip${active === f ? ' active' : ''}`} onClick={() => setActive(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Result count + sort */}
      <div style={{ padding: '12px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--um-text-4)' }}>24 sessions</span>
        <button style={{ fontSize: 11, color: 'var(--um-text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Sort by date
        </button>
      </div>

      {/* Saturday */}
      <div className="um-divider-label">
        <span className="um-divider-label-text">Saturday 3 May</span>
        <span className="um-divider-line" />
        <span style={{ fontSize: 10, color: 'var(--um-accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>this weekend</span>
      </div>

      <SessionRow title="Colombo Coffee Loop" type="Ride" day="3" dow="Sat" time="6:00" location="Colombo 7" km="42" pace="25–28 km/h" difficulty="Social" joining="12" tags={[{ type: 'nodrop', label: 'No drop' }, { type: 'coffee', label: 'Coffee stop' }]} onClick={() => onNavigate('detail')} />
      <SessionRow title="Negombo Beach Run" type="Run" day="3" dow="Sat" time="6:30" location="Negombo" km="10" pace="6:00/km" difficulty="Social" joining="18" tags={[{ type: 'beginner', label: 'Beginner OK' }, { type: 'tourist', label: 'Tourist OK' }]} onClick={() => onNavigate('detail')} />
      <SessionRow title="Kandy Hills Interval" type="Run" day="3" dow="Sat" time="5:30" location="Kandy" km="12" pace="5:00/km" difficulty="Hard" joining="9" tags={[{ type: 'hard', label: 'Hard' }]} onClick={() => onNavigate('detail')} />

      {/* Sunday */}
      <div className="um-divider-label">
        <span className="um-divider-label-text">Sunday 4 May</span>
        <span className="um-divider-line" />
      </div>

      <SessionRow title="Galle Face Sunrise Roll" type="Ride" day="4" dow="Sun" time="5:45" location="Fort, Colombo" km="28" pace="22–25 km/h" difficulty="Social" joining="7" tags={[{ type: 'coffee', label: 'Coffee stop' }]} onClick={() => onNavigate('detail')} />
      <SessionRow title="Peradeniya Loop" type="Ride" day="4" dow="Sun" time="6:00" location="Kandy" km="55" pace="28–32 km/h" difficulty="Moderate" joining="5" tags={[{ type: 'ride', label: 'Ride' }]} onClick={() => onNavigate('detail')} />

      {/* Load more */}
      <div style={{ padding: '16px 22px 32px' }}>
        <button className="um-btn um-btn-outline um-btn-full">Load more</button>
      </div>
    </div>
  );
}
