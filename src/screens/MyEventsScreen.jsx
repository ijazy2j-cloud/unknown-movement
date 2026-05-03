import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import Badge from '../components/Badge';
import SessionRow from '../components/SessionRow';
import { EVENTS, isPast } from '../data/events';
import { supabase } from '../lib/supabase';

function EmptyState({ message, sub }) {
  return (
    <div className="um-empty">
      <svg className="um-empty-icon" width="38" height="38" viewBox="0 0 38 38" fill="none">
        <circle cx="19" cy="19" r="17" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M13 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="19" y1="25" x2="19" y2="25.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div className="um-empty-title">{message}</div>
      <div className="um-empty-sub">{sub}</div>
    </div>
  );
}

export default function MyEventsScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, savedEvents, onToggleSave, enrolments, onToggleEnrol, onOpenAttendees, onEditEvent }) {
  const [activeTab, setActiveTab] = useState('going');
  const [submittedEvents, setSubmittedEvents] = useState([]);
  const [loadingSubmitted, setLoadingSubmitted] = useState(true);
  const [enrolCounts, setEnrolCounts] = useState({});
  const [cancellingId, setCancellingId] = useState(null);

  const goingEvents = (enrolments || [])
    .map(id => EVENTS.find(e => e.id === id))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    if (!supabase || !user) { setLoadingSubmitted(false); return; }
    setLoadingSubmitted(true);
    supabase.from('events')
      .select('*')
      .eq('organiser_id', user.id)
      .order('date', { ascending: true })
      .then(({ data }) => {
        setSubmittedEvents(data || []);
        setLoadingSubmitted(false);
        if (data?.length) {
          const ids = data.map(e => e.id);
          supabase.from('enrolments')
            .select('event_id')
            .in('event_id', ids)
            .then(({ data: enrolData }) => {
              const counts = {};
              (enrolData || []).forEach(r => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
              setEnrolCounts(counts);
            });
        }
      });
  }, [user]);

  const handleCancelEvent = async (eventId) => {
    if (!supabase || !user) return;
    if (!window.confirm('Cancel this session? Enrolled participants will not be automatically notified.')) return;
    setCancellingId(eventId);
    await supabase.from('events').update({ status: 'cancelled' }).eq('id', eventId).eq('organiser_id', user.id);
    setSubmittedEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e));
    setCancellingId(null);
  };

  const handleMarkComplete = async (eventId) => {
    if (!supabase || !user) return;
    await supabase.from('events').update({ status: 'completed' }).eq('id', eventId).eq('organiser_id', user.id);
    setSubmittedEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' } : e));
  };

  if (!user) {
    return (
      <div className="um-screen">
        <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 14 }}>👤</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--um-text)' }}>Sign in to see your events</div>
          <div style={{ fontSize: 13, color: 'var(--um-text-3)', marginBottom: 24, lineHeight: 1.6 }}>Track sessions you're enrolled in and manage the ones you've submitted.</div>
          <button className="um-btn um-btn-accent" style={{ minWidth: 160 }} onClick={onSignIn}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="um-screen">
      <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--um-text)', letterSpacing: '-0.03em' }}>My Events</div>
        <div style={{ fontSize: 12, color: 'var(--um-text-3)', marginTop: 3 }}>{user.email}</div>
      </div>

      <div className="um-tabs" style={{ marginTop: 16 }}>
        {[
          ['going',     `Going (${goingEvents.length})`],
          ['submitted', 'Submitted'],
        ].map(([val, label]) => (
          <button
            key={val}
            className={`um-tab${activeTab === val ? ' active' : ''}`}
            onClick={() => setActiveTab(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'going' && (
        <>
          {goingEvents.length === 0 ? (
            <EmptyState message="Not going to anything yet" sub="Browse upcoming sessions and tap Enrol to sign up." />
          ) : (
            goingEvents.map(ev => {
              const day = ev.date.split('-')[2];
              const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(ev.date + 'T00:00:00').getDay()];
              return (
                <SessionRow
                  key={ev.id}
                  title={ev.title}
                  type={ev.type}
                  day={String(parseInt(day, 10))}
                  dow={dow}
                  time={ev.time}
                  location={ev.location}
                  km={ev.km}
                  pace={ev.pace}
                  difficulty={ev.difficulty}
                  joining={ev.joining}
                  tags={ev.tags}
                  completed={isPast(ev.date)}
                  enrolled={true}
                  saved={savedEvents.includes(ev.id)}
                  onSave={() => onToggleSave(ev.id)}
                  onClick={() => onNavigate('detail', ev.id)}
                />
              );
            })
          )}
          {goingEvents.length > 0 && (
            <div style={{ padding: '4px 20px 24px', textAlign: 'center' }}>
              <button
                style={{ fontSize: 12, color: 'var(--um-text-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => onNavigate('explore')}
              >
                Browse more sessions →
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'submitted' && (
        <>
          {loadingSubmitted ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--um-text-4)', fontSize: 13 }}>Loading…</div>
          ) : submittedEvents.length === 0 ? (
            <>
              <EmptyState message="No submitted sessions" sub="Submit a ride or run and manage it here." />
              <div style={{ padding: '0 20px 24px', textAlign: 'center' }}>
                <button className="um-btn um-btn-accent" style={{ minWidth: 160 }} onClick={() => onNavigate('submit')}>
                  Submit a session
                </button>
              </div>
            </>
          ) : (
            submittedEvents.map(ev => (
              <div key={ev.id} className="um-myevent-card">
                <div className="um-myevent-card-hd">
                  <div style={{ flex: 1 }}>
                    <div className="um-myevent-card-title">{ev.title}</div>
                    <div className="um-myevent-card-meta">
                      {ev.date} · {ev.time} · {ev.city}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Badge type={ev.type === 'ride' ? 'ride' : ev.type === 'run' ? 'run' : 'tri'}>
                      {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                    </Badge>
                    {ev.status === 'cancelled' && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em' }}>
                        CANCELLED
                      </span>
                    )}
                    {ev.status === 'completed' && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(60% 0.14 148)', background: 'oklch(60% 0.14 148 / 0.15)', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em' }}>
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                <div className="um-myevent-stats">
                  <div className="um-myevent-stat">
                    <span className="um-myevent-stat-n" style={{ color: 'var(--um-accent)' }}>
                      {enrolCounts[ev.id] || 0}
                    </span>
                    <span className="um-myevent-stat-l">Enrolled</span>
                  </div>
                  <div className="um-myevent-stat">
                    <span className="um-myevent-stat-n">{ev.distance_km ? `${ev.distance_km} km` : '—'}</span>
                    <span className="um-myevent-stat-l">Distance</span>
                  </div>
                  <div className="um-myevent-stat">
                    <span className="um-myevent-stat-n" style={{ textTransform: 'capitalize' }}>{ev.difficulty || '—'}</span>
                    <span className="um-myevent-stat-l">Difficulty</span>
                  </div>
                </div>

                {ev.status !== 'cancelled' && (
                  <div className="um-myevent-actions">
                    <button
                      className="um-btn um-btn-outline um-btn-sm"
                      onClick={() => onEditEvent && onEditEvent(ev.id)}
                    >Edit</button>
                    {ev.status !== 'completed' && (
                      <button
                        className="um-btn um-btn-outline um-btn-sm"
                        onClick={() => handleMarkComplete(ev.id)}
                      >Mark complete</button>
                    )}
                    {(enrolCounts[ev.id] || 0) > 0 && (
                      <button
                        className="um-btn um-btn-outline um-btn-sm"
                        onClick={() => onOpenAttendees && onOpenAttendees(ev.id)}
                      >
                        View {enrolCounts[ev.id]} attendee{enrolCounts[ev.id] !== 1 ? 's' : ''}
                      </button>
                    )}
                    <button
                      className="um-btn um-btn-sm"
                      style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'none' }}
                      onClick={() => handleCancelEvent(ev.id)}
                      disabled={cancellingId === ev.id}
                    >
                      {cancellingId === ev.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      <div style={{ height: 32 }} />
    </div>
  );
}
