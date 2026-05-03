import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Nav from '../components/Nav';
import Badge from '../components/Badge';
import ShareSheet from '../components/ShareSheet';
import WeatherWidget from '../components/WeatherWidget';
import { supabase } from '../lib/supabase';
import { useEventById } from '../lib/useEvents';

const EventMap = lazy(() => import('../components/EventMap'));

const TODAY = new Date().toISOString().slice(0, 10);
function isEventPast(d) { return d < TODAY; }

const EMPTY_EVENT = {
  id: '', title: '', date: TODAY, time: '06:00', location: '', city: '',
  km: '0', elevation: '0', pace: '—', paceUnit: '/km',
  difficulty: 'Social', joining: 0,
  organizer: { name: '', initials: '', sub: '', bg: 'oklch(36% 0.08 42)' },
  tags: [], lat: null, lng: null,
  image: '/9cfe853c44722834d35684daba4c955b.jpg',
  attendees: [], description: '', safety: [],
};

function DiffBars({ difficulty, color }) {
  const bars = difficulty === 'Hard' ? 3 : difficulty === 'Moderate' ? 2 : 1;
  return (
    <span className="um-diff-bars-lg" aria-label={difficulty}>
      {[1, 2, 3].map(n => (
        <span key={n} className="um-diff-bar-lg" style={{
          height: `${6 + n * 4}px`,
          background: n <= bars ? color : 'var(--um-border)',
        }} />
      ))}
    </span>
  );
}

function AttendeeAvatars({ attendees = [], total }) {
  const show = attendees.slice(0, 4);
  const extra = total - show.length;
  return (
    <div className="um-avatars">
      {show.map((a, i) => (
        <div key={i} className="um-avatar" style={{ background: a.bg, zIndex: show.length - i }}>
          {a.initials}
        </div>
      ))}
      {extra > 0 && (
        <div className="um-avatar um-avatar-more">+{extra}</div>
      )}
      <span className="um-avatars-label"><strong style={{ color: 'var(--um-accent)' }}>{total}</strong> joining</span>
    </div>
  );
}

function resizePhoto(file, onDone) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 360 / img.width);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      onDone(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function downloadICS(event) {
  const [yr, mo, dy] = event.date.split('-');
  const [hr, mn] = event.time.split(':');
  const pad = n => String(parseInt(n, 10)).padStart(2, '0');
  const dtStart = `${yr}${mo}${dy}T${hr}${mn}00`;
  const dtEnd   = `${yr}${mo}${dy}T${pad(parseInt(hr, 10) + 2)}${mn}00`;
  const stamp   = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Unknown Movement//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${event.id}@unknownmovement`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Colombo:${dtStart}`,
    `DTEND;TZID=Asia/Colombo:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${(event.description || '').replace(/[\r\n]+/g, '\\n')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${event.id}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const DIFF_COLORS = {
  Hard:     'var(--um-accent)',
  Moderate: 'oklch(68% 0.10 72)',
  Social:   'oklch(68% 0.10 148)',
  Easy:     'oklch(68% 0.12 220)',
};

export default function DetailScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, savedEvents, onToggleSave, selectedEventId, followedClubs, onToggleFollow, user, onRequireAuth, enrolments, onToggleEnrol, onSignIn, onSignOut }) {
  const { event: fetchedEvent, loading: eventLoading } = useEventById(selectedEventId);
  const event = fetchedEvent ?? EMPTY_EVENT;
  const past = isEventPast(event.date);
  const isSaved = savedEvents.includes(event.id);
  const isFollowing = followedClubs && followedClubs.includes(event.organizer.name);
  const isEnrolled = enrolments && enrolments.includes(event.id);

  const [shareOpen, setShareOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [enrolConfirm, setEnrolConfirm] = useState(false);
  const [enrolLoading, setEnrolLoading] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    setEnrolConfirm(false);
  }, [event.id]);

  useEffect(() => {
    if (!past) return;
    if (supabase) {
      supabase.from('event_photos').select('photo_url').eq('event_id', event.id)
        .then(({ data }) => {
          if (data?.length) setPhotos(data.map(r => r.photo_url));
          else {
            try { setPhotos(JSON.parse(localStorage.getItem(`um-photos-${event.id}`) || '[]')); }
            catch { setPhotos([]); }
          }
        });
    } else {
      try { setPhotos(JSON.parse(localStorage.getItem(`um-photos-${event.id}`) || '[]')); }
      catch { setPhotos([]); }
    }
  }, [event.id, past]);

  const handlePhotoAdd = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (supabase && user) {
      resizePhoto(file, async (dataUrl) => {
        const blob = await fetch(dataUrl).then(r => r.blob());
        const path = `${event.id}/${user.id}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('event-photos').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) { console.error(error); return; }
        const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(path);
        await supabase.from('event_photos').insert({ event_id: event.id, photo_url: publicUrl, uploaded_by: user.id });
        setPhotos(prev => [...prev, publicUrl].slice(-4));
      });
    } else {
      resizePhoto(file, dataUrl => {
        const updated = [...photos, dataUrl].slice(-4);
        setPhotos(updated);
        try { localStorage.setItem(`um-photos-${event.id}`, JSON.stringify(updated)); } catch {}
      });
    }
  };

  const handleEnrol = async () => {
    if (!user) { onSignIn && onSignIn(); return; }
    setEnrolLoading(true);
    const didEnrol = await onToggleEnrol(event.id);
    setEnrolLoading(false);
    if (didEnrol) setEnrolConfirm(true);
  };

  if (eventLoading) {
    return (
      <div className="um-screen">
        <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
        <div className="um-skeleton" style={{ height: 220, width: '100%', borderRadius: 0 }} />
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="um-skeleton" style={{ height: 28, width: '72%', borderRadius: 4 }} />
          <div className="um-skeleton" style={{ height: 14, width: '52%', borderRadius: 4 }} />
          <div className="um-skeleton" style={{ height: 14, width: '40%', borderRadius: 4, marginTop: 4 }} />
        </div>
      </div>
    );
  }

  const typeKey = event.type === 'Ride' ? 'ride' : event.type === 'Run' ? 'run' : 'tri';
  const diffColor = DIFF_COLORS[event.difficulty] || 'var(--um-text-3)';

  const dateLabel = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const waHref = `https://wa.me/94770000000?text=${encodeURIComponent(`Hi, I'm interested in the ${event.title} on ${event.date}`)}`;

  return (
    <div className="um-screen">
      <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />

      {/* Hero */}
      <div className="um-detail-hero">
        <div className="um-detail-hero-img" style={{ filter: past ? 'saturate(0.45)' : 'none', transition: 'filter 0.3s' }}>
          <img src={event.is_official_event && event.flyer_image_url ? event.flyer_image_url : event.image} alt={event.title} loading="lazy" />
          <div className="um-detail-hero-overlay" />
        </div>
        <div className="um-detail-hero-content">
          <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge type={typeKey}>{event.type}</Badge>
            {event.is_official_event && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'oklch(72% 0.14 148)', background: 'oklch(72% 0.14 148 / 0.2)', border: '1px solid oklch(72% 0.14 148 / 0.4)', borderRadius: 4, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Official event
              </span>
            )}
            {(event.tags || []).filter(t => t.type !== 'run' && t.type !== 'ride').slice(0, 2).map(t => (
              <Badge key={t.type} type={t.type}>{t.label}</Badge>
            ))}
            {past && <span className="um-completed-badge">Completed</span>}
            {isEnrolled && !past && <span className="um-going-badge">You're going</span>}
          </div>
          <div className="um-detail-title">{event.title}</div>
          <div className="um-detail-meta">{dateLabel} · {event.time} · {event.location}</div>
        </div>
      </div>

      {/* Official event registration info */}
      {event.is_official_event && !past && (event.registration_link || event.entry_fee || event.registration_deadline || event.event_website) && (
        <div className="um-section" style={{ background: 'var(--um-accent-lt)', borderColor: 'oklch(42% 0.14 30 / 0.35)' }}>
          <div className="um-section-hd" style={{ color: 'var(--um-accent)' }}>Registration info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {event.entry_fee && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, color: 'var(--um-text-3)' }}>Entry fee</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--um-text)' }}>{event.entry_fee}</span>
              </div>
            )}
            {event.registration_deadline && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, color: 'var(--um-text-3)' }}>Registration closes</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--um-text)' }}>{event.registration_deadline}</span>
              </div>
            )}
            {event.event_website && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, color: 'var(--um-text-3)' }}>Website</span>
                <a href={event.event_website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--um-accent)', fontWeight: 500 }}>
                  {event.event_website.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              </div>
            )}
            {event.registration_link && (
              <a
                href={event.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="um-btn um-btn-accent um-btn-full"
                style={{ textDecoration: 'none', marginTop: 6 }}
              >
                Register Now →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="um-quick-stat-row">
        <div className="um-qs">
          <span className="um-qs-num">
            <span className="um-qs-km">{event.km}</span>
            <span className="um-qs-unit"> km</span>
          </span>
          <span className="um-qs-lbl">Distance</span>
        </div>
        <div className="um-qs">
          <span className="um-qs-num um-qs-pace">{event.pace}</span>
          <span className="um-qs-lbl">{event.paceUnit === '/km' ? 'Pace' : 'Avg speed'}</span>
        </div>
        <div className="um-qs">
          <span className="um-qs-num">{event.elevation} <span className="um-qs-unit">m</span></span>
          <span className="um-qs-lbl">Elevation</span>
        </div>
        <div className="um-qs">
          <span className="um-qs-num" style={{ color: 'var(--um-accent)' }}>{event.joining}</span>
          <span className="um-qs-lbl">Joining</span>
        </div>
      </div>

      {/* Attendees */}
      <div className="um-section" style={{ paddingTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--um-border-lt)' }}>
        <AttendeeAvatars attendees={event.attendees} total={event.joining} />
      </div>

      {/* Weather (upcoming only) */}
      {!past && (
        <div className="um-section" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className="um-section-hd">Weather forecast</div>
          <WeatherWidget lat={event.lat} lng={event.lng} date={event.date} />
        </div>
      )}

      {/* Route map */}
      <div className="um-section">
        <div className="um-section-hd">Route map</div>
        <Suspense fallback={<div className="um-skeleton" style={{ height: 280, borderRadius: 10 }} />}>
          <EventMap event={event} />
        </Suspense>
      </div>

      {/* Suitability + difficulty */}
      <div className="um-section">
        <div className="um-section-hd">Suitability</div>
        <div className="um-suit-grid">
          {(event.tags || []).map(t => <Badge key={t.type} type={t.type}>{t.label}</Badge>)}
          <Badge type="tag">Helmet recommended</Badge>
        </div>
        {event.difficulty && !event.is_official_event && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14 }}>
            <DiffBars difficulty={event.difficulty} color={diffColor} />
            <span style={{ fontSize: 12, color: diffColor, fontWeight: 600 }}>{event.difficulty}</span>
            <span style={{ fontSize: 12, color: 'var(--um-text-4)' }}>difficulty</span>
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--um-text-2)', lineHeight: 1.72 }}>
          {event.description}
        </div>
      </div>

      {/* Organiser */}
      <div className="um-section">
        <div className="um-section-hd">Organiser</div>
        <div className="um-org-row">
          <div className="um-org-mark" style={{ background: event.organizer.bg, color: 'white', border: 'none' }}>
            {event.organizer.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="um-org-name">{event.organizer.name}</div>
            <div className="um-org-sub">{event.organizer.sub}</div>
            <div className="um-org-btns">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="um-btn um-btn-ghost um-btn-sm">
                WhatsApp
              </a>
              <button className="um-btn um-btn-outline um-btn-sm">Strava</button>
              {onToggleFollow && (
                <button
                  className={`um-btn um-btn-sm${isFollowing ? ' um-btn-accent' : ' um-btn-outline'}`}
                  onClick={() => onToggleFollow(event.organizer.name)}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Safety */}
      <div className="um-section" style={{ borderBottom: past ? '1px solid var(--um-border-lt)' : 'none' }}>
        <div className="um-section-hd">Safety</div>
        <div className="um-notes">
          {(event.safety || []).map(n => (
            <div key={n} className="um-note">
              <span className="um-note-dash">—</span>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos (past events only) */}
      {past && (
        <div className="um-section" style={{ borderBottom: 'none' }}>
          <div className="um-section-hd">Photos from this session</div>
          {photos.length > 0 && (
            <div className="um-photos-grid">
              {photos.map((src, i) => (
                <div key={i} className="um-photo-thumb" onClick={() => setLightboxSrc(src)}>
                  <img src={src} alt={`Photo ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
          {photos.length < 4 && (
            <>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoAdd}
              />
              <button
                className="um-btn um-btn-outline um-btn-full"
                style={{ marginTop: photos.length > 0 ? 12 : 0 }}
                onClick={() => {
                  if (!user && onSignIn) { onSignIn(); return; }
                  photoInputRef.current?.click();
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {user ? 'Add photo' : 'Sign in to add photo'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Sticky CTA */}
      <div className="um-cta-strip">
        {past ? (
          <button className="um-btn um-btn-ghost" style={{ flex: 1 }} onClick={() => setShareOpen(true)}>
            Share this session
          </button>
        ) : event.is_official_event && event.registration_link ? (
          /* Official event: show Register Now button */
          <a
            href={event.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className="um-btn um-btn-accent"
            style={{ flex: 1, textDecoration: 'none' }}
          >
            Register Now →
          </a>
        ) : isEnrolled ? (
          <>
            <button
              className="um-btn um-btn-going"
              style={{ flex: 2 }}
              onClick={handleEnrol}
              disabled={enrolLoading}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              You're going · Undo
            </button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="um-btn um-btn-outline" style={{ flex: 1 }}>
              WhatsApp
            </a>
          </>
        ) : (
          <>
            <button
              className="um-btn um-btn-accent"
              style={{ flex: 2 }}
              onClick={handleEnrol}
              disabled={enrolLoading}
            >
              {enrolLoading ? 'Joining…' : 'Enrol'}
            </button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="um-btn um-btn-outline" style={{ flex: 1 }}>
              WhatsApp
            </a>
          </>
        )}
        <button
          className={`um-cta-save-btn${isSaved ? ' saved' : ''}`}
          onClick={() => onToggleSave(event.id)}
          aria-label={isSaved ? 'Unsave' : 'Save'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'var(--um-accent)' : 'none'} stroke={isSaved ? 'var(--um-accent)' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button className="um-btn um-btn-ghost" style={{ padding: '12px 14px' }} onClick={() => setShareOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      </div>

      {/* Enrolment confirmation */}
      {enrolConfirm && (
        <div className="um-enrol-confirm">
          <div className="um-enrol-confirm-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="um-enrol-confirm-title">You're going!</div>
            <div className="um-enrol-confirm-meta">{event.title} · {dateLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="um-btn um-btn-outline um-btn-sm" onClick={() => downloadICS(event)}>
              + Calendar
            </button>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--um-text-4)', fontSize: 20, padding: '0 4px', lineHeight: 1 }}
              onClick={() => setEnrolConfirm(false)}
            >×</button>
          </div>
        </div>
      )}

      {shareOpen && <ShareSheet event={event} onClose={() => setShareOpen(false)} />}

      {lightboxSrc && (
        <div className="um-lightbox" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Full size" />
          <button className="um-lightbox-close" onClick={() => setLightboxSrc(null)}>×</button>
        </div>
      )}
    </div>
  );
}
