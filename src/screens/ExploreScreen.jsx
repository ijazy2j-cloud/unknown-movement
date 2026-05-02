import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import SessionRow from '../components/SessionRow';
import { EVENTS, isPast } from '../data/events';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDOW(dateStr) {
  return DAYS[new Date(dateStr + 'T00:00:00').getDay()];
}
function getDateLabel(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${getDOW(dateStr)} ${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]}`;
}

const FILTER_CHIPS = ['Ride', 'Run', 'This weekend', 'Coffee stop', 'No drop', 'Beginner'];

function matchesFilters(ev, filters) {
  if (filters.length === 0) return true;
  return filters.every(f => {
    if (f === 'Ride')         return ev.type === 'Ride';
    if (f === 'Run')          return ev.type === 'Run';
    if (f === 'This weekend') return ev.date === '2026-05-03' || ev.date === '2026-05-04';
    if (f === 'Coffee stop')  return ev.tags.some(t => t.type === 'coffee');
    if (f === 'No drop')      return ev.tags.some(t => t.type === 'nodrop');
    if (f === 'Beginner')     return ev.tags.some(t => t.type === 'beginner');
    return true;
  });
}

function matchesSearch(ev, query) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    ev.title.toLowerCase().includes(q) ||
    ev.location.toLowerCase().includes(q) ||
    ev.city.toLowerCase().includes(q) ||
    ev.organizer.name.toLowerCase().includes(q)
  );
}

function SkeletonRow() {
  return (
    <div className="um-session-row" style={{ pointerEvents: 'none' }}>
      <div className="um-session-date-col">
        <div className="um-skeleton" style={{ width: 28, height: 32, borderRadius: 4 }} />
        <div className="um-skeleton" style={{ width: 22, height: 9, borderRadius: 3, marginTop: 4 }} />
      </div>
      <div className="um-session-bar" />
      <div className="um-session-body" style={{ gap: 8 }}>
        <div className="um-skeleton" style={{ width: '70%', height: 18, borderRadius: 4 }} />
        <div className="um-skeleton" style={{ width: '48%', height: 12, borderRadius: 3 }} />
        <div className="um-skeleton" style={{ width: '60%', height: 12, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function EmptyState({ tab, hasFilters }) {
  return (
    <div className="um-empty">
      <svg className="um-empty-icon" width="38" height="38" viewBox="0 0 38 38" fill="none">
        <circle cx="19" cy="19" r="17" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M13 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="19" y1="25" x2="19" y2="25.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {tab === 'saved' ? (
        <>
          <div className="um-empty-title">No saved sessions</div>
          <div className="um-empty-sub">Heart sessions to save them here for quick access.</div>
        </>
      ) : hasFilters ? (
        <>
          <div className="um-empty-title">No sessions found</div>
          <div className="um-empty-sub">Try removing some filters or broadening your search.</div>
        </>
      ) : (
        <>
          <div className="um-empty-title">Nothing here yet</div>
          <div className="um-empty-sub">Check back soon — new sessions are added regularly.</div>
        </>
      )}
    </div>
  );
}

export default function ExploreScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, savedEvents, onToggleSave }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [activeFilters, setActiveFilters] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 320);
    return () => clearTimeout(t);
  }, []);

  const toggleFilter = (f) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const base = EVENTS.filter(e => {
    if (activeTab === 'upcoming') return !isPast(e.date);
    if (activeTab === 'past')     return isPast(e.date);
    if (activeTab === 'saved')    return savedEvents.includes(e.id);
    return true;
  });

  const filtered = base
    .filter(e => matchesFilters(e, activeFilters))
    .filter(e => matchesSearch(e, search));

  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  const hasFilters = activeFilters.length > 0 || search.trim().length > 0;

  return (
    <div className="um-screen">
      <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} />

      {/* Search */}
      <div className="um-explore-search">
        <div style={{ position: 'relative' }}>
          <input
            className="um-input"
            placeholder="Search sessions, locations, clubs"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38, paddingRight: search ? 34 : 14, fontSize: 13 }}
          />
          <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--um-text-4)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="um-tabs">
        {[['upcoming', 'Upcoming'], ['past', 'Past'], ['saved', 'Saved']].map(([val, label]) => (
          <button
            key={val}
            className={`um-tab${activeTab === val ? ' active' : ''}`}
            onClick={() => setActiveTab(val)}
          >
            {label}
            {val === 'saved' && savedEvents.length > 0 && (
              <span className="um-tab-count">{savedEvents.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="um-chips">
        {FILTER_CHIPS.map(f => (
          <button
            key={f}
            className={`um-chip${activeFilters.includes(f) ? ' active' : ''}`}
            onClick={() => toggleFilter(f)}
          >
            {f}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            className="um-chip"
            onClick={() => setActiveFilters([])}
            style={{ color: 'var(--um-accent)', borderColor: 'var(--um-accent)' }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="um-explore-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--um-text-4)' }}>
          {isLoading ? 'Loading...' : `${filtered.length} session${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <>
          <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
        </>
      ) : filtered.length === 0 ? (
        <EmptyState tab={activeTab} hasFilters={hasFilters} />
      ) : (
        dates.map(date => (
          <div key={date}>
            <div className="um-divider-label">
              <span className="um-divider-label-text">{getDateLabel(date)}</span>
              <span className="um-divider-line" />
              {(date === '2026-05-03' || date === '2026-05-04') && (
                <span style={{ fontSize: 10, color: 'var(--um-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>this weekend</span>
              )}
              {isPast(date) && (
                <span style={{ fontSize: 10, color: 'var(--um-text-4)', fontWeight: 600, whiteSpace: 'nowrap' }}>past</span>
              )}
            </div>
            {grouped[date].map(ev => {
              const day = String(parseInt(ev.date.split('-')[2], 10));
              const dow = getDOW(ev.date);
              const isSaved = savedEvents.includes(ev.id);
              return (
                <SessionRow
                  key={ev.id}
                  title={ev.title}
                  type={ev.type}
                  day={day}
                  dow={dow}
                  time={ev.time}
                  location={ev.location}
                  km={ev.km}
                  pace={ev.pace}
                  difficulty={ev.difficulty}
                  joining={ev.joining}
                  tags={ev.tags}
                  completed={isPast(ev.date)}
                  saved={isSaved}
                  onSave={() => onToggleSave(ev.id)}
                  onClick={() => onNavigate('detail', ev.id)}
                />
              );
            })}
          </div>
        ))
      )}

      <div style={{ height: 32 }} />
    </div>
  );
}
