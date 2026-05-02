import { useState, useEffect, useRef } from 'react';
import Nav from '../components/Nav';
import Badge from '../components/Badge';
import ShareSheet from '../components/ShareSheet';
import WeatherWidget from '../components/WeatherWidget';
import { getEvent, isPast } from '../data/events';

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

const DIFF_COLORS = {
  Hard:     'var(--um-accent)',
  Moderate: 'oklch(68% 0.10 72)',
  Social:   'oklch(68% 0.10 148)',
  Easy:     'oklch(68% 0.12 220)',
};

export default function DetailScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, savedEvents, onToggleSave, selectedEventId, followedClubs, onToggleFollow }) {
  const event = getEvent(selectedEventId) || getEvent('colombo-coffee-loop');
  const past = isPast(event.date);
  const isSaved = savedEvents.includes(event.id);
  const isFollowing = followedClubs && followedClubs.includes(event.organizer.name);

  const [shareOpen, setShareOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [photos, setPhotos] = useState([]);
  const photoInputRef = useRef(null);

  useEffect(() => {
    try { setPhotos(JSON.parse(localStorage.getItem(`um-photos-${event.id}`) || '[]')); }
    catch { setPhotos([]); }
  }, [event.id]);

  const handlePhotoAdd = e => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    resizePhoto(file, dataUrl => {
      const updated = [...photos, dataUrl].slice(-4);
      setPhotos(updated);
      try { localStorage.setItem(`um-photos-${event.id}`, JSON.stringify(updated)); } catch {}
    });
  };

  const typeKey = event.type === 'Ride' ? 'ride' : event.type === 'Run' ? 'run' : 'tri';
  const diffColor = DIFF_COLORS[event.difficulty] || 'var(--um-text-3)';

  const dateLabel = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const waHref = `https://wa.me/94770000000?text=${encodeURIComponent(`Hi, I'm interested in the ${event.title} on ${event.date}`)}`;

  return (
    <div className="um-screen">
      <Nav showBack={true} goBack={goBack} onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} />

      {/* Hero */}
      <div className="um-detail-hero">
        <div className="um-detail-hero-img" style={{ filter: past ? 'saturate(0.45)' : 'none', transition: 'filter 0.3s' }}>
          <img src={event.image} alt={event.title} />
          <div className="um-detail-hero-overlay" />
        </div>
        <div className="um-detail-hero-content">
          <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge type={typeKey}>{event.type}</Badge>
            {event.tags.filter(t => t.type !== 'run' && t.type !== 'ride').slice(0, 2).map(t => (
              <Badge key={t.type} type={t.type}>{t.label}</Badge>
            ))}
            {past && <span className="um-completed-badge">Completed</span>}
          </div>
          <div className="um-detail-title">{event.title}</div>
          <div className="um-detail-meta">{dateLabel} · {event.time} · {event.location}</div>
        </div>
      </div>

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

      {/* Route */}
      <div className="um-section">
        <div className="um-section-hd">Route</div>
        <div style={{ height: 140, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
          <img
            src="/b2df6b431f8adf438c1c8e7d62d58f7c.jpg"
            alt="Route overview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,12,0.18)', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          {[
            { label: 'Start',    val: event.location },
            { label: 'Distance', val: `${event.km} km · ${event.elevation}m gain` },
          ].map(p => (
            <div key={p.label} style={{ background: 'var(--um-bg2)', borderRadius: 7, padding: '9px 12px' }}>
              <div style={{ fontSize: 9, color: 'var(--um-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 12, color: 'var(--um-text)', fontWeight: 500 }}>{p.val}</div>
            </div>
          ))}
        </div>
        <button style={{ marginTop: 12, fontSize: 11, color: 'var(--um-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0, fontFamily: 'inherit', fontWeight: 500 }}>
          Open in Strava →
        </button>
      </div>

      {/* Suitability + difficulty */}
      <div className="um-section">
        <div className="um-section-hd">Suitability</div>
        <div className="um-suit-grid">
          {event.tags.map(t => <Badge key={t.type} type={t.type}>{t.label}</Badge>)}
          <Badge type="tag">Helmet recommended</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14 }}>
          <DiffBars difficulty={event.difficulty} color={diffColor} />
          <span style={{ fontSize: 12, color: diffColor, fontWeight: 600 }}>{event.difficulty}</span>
          <span style={{ fontSize: 12, color: 'var(--um-text-4)' }}>difficulty</span>
        </div>
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
          {event.safety.map(n => (
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
            onClick={() => photoInputRef.current?.click()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Add photo
          </button>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="um-cta-strip">
        {past ? (
          <button className="um-btn um-btn-ghost" style={{ flex: 1 }} onClick={() => setShareOpen(true)}>
            Share this session
          </button>
        ) : (
          <>
            <button className="um-btn um-btn-accent" style={{ flex: 2 }} onClick={() => onNavigate('submit')}>
              I'm interested
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
