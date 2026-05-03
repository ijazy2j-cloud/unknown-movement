import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import { supabase } from '../lib/supabase';
import { getEvent } from '../data/events';

function exportCSV(attendees, eventTitle) {
  const rows = [['Name', 'Email', 'Sport preference', 'Joined']];
  attendees.forEach(a => rows.push([
    a.user_name  || '',
    a.user_email || '',
    a.sport_preference || '',
    a.joined_at ? a.joined_at.slice(0, 10) : '',
  ]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(eventTitle || 'event').replace(/\s+/g, '-').toLowerCase()}-attendees.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AttendeesScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, attendeesEventId }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const staticEvent = getEvent(attendeesEventId);
  const eventTitle = staticEvent?.title || attendeesEventId || 'Event';

  useEffect(() => {
    if (!supabase || !attendeesEventId) { setLoading(false); return; }
    supabase.from('enrolments')
      .select('*')
      .eq('event_id', attendeesEventId)
      .order('joined_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); }
        else setAttendees(data || []);
        setLoading(false);
      });
  }, [attendeesEventId]);

  return (
    <div className="um-screen">
      <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />

      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--um-text)', letterSpacing: '-0.03em' }}>Attendees</div>
          <div style={{ fontSize: 12, color: 'var(--um-text-3)', marginTop: 3 }}>{eventTitle}</div>
        </div>
        {attendees.length > 0 && (
          <button
            className="um-btn um-btn-outline um-btn-sm"
            onClick={() => exportCSV(attendees, eventTitle)}
          >
            Export CSV
          </button>
        )}
      </div>

      <div style={{ padding: '16px 20px 4px', fontSize: 11, color: 'var(--um-text-4)' }}>
        {loading ? 'Loading…' : `${attendees.length} enrolled`}
      </div>

      {error && (
        <div style={{ margin: '8px 20px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {!loading && !error && attendees.length === 0 && (
        <div className="um-empty">
          <div className="um-empty-title">No attendees yet</div>
          <div className="um-empty-sub">People who enrol will appear here.</div>
        </div>
      )}

      {attendees.map((a, i) => (
        <div key={a.id} className="um-attendee-row">
          <div className="um-attendee-avatar">
            {(a.user_name || a.user_email || '?').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="um-attendee-name">{a.user_name || a.user_email || `Attendee ${i + 1}`}</div>
            {a.user_email && a.user_name && (
              <div className="um-attendee-email">{a.user_email}</div>
            )}
            {a.sport_preference && (
              <div className="um-attendee-sport">{a.sport_preference}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {a.joined_at && (
              <div style={{ fontSize: 11, color: 'var(--um-text-4)' }}>
                {new Date(a.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            )}
            {a.user_email && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hi! This is about the event: ${eventTitle}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: 'var(--um-accent)', textDecoration: 'none', fontWeight: 500 }}
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      ))}

      <div style={{ height: 32 }} />
    </div>
  );
}
