import { useEffect, useRef, useState } from 'react';
import Nav from '../components/Nav';
import Badge from '../components/Badge';
import SessionRow from '../components/SessionRow';
import HeroSlideshow from '../components/HeroSlideshow';
import Footer from '../components/Footer';
import PhotoReel from '../components/PhotoReel';
import { useAllEvents } from '../lib/useEvents';
import { useStats } from '../lib/useStats';

const TODAY = new Date().toISOString().slice(0, 10);
function isEventPast(d) { return d < TODAY; }

function getWeekendDates() {
  const d = new Date();
  const day = d.getDay();
  const sat = new Date(d);
  if (day === 0) sat.setDate(d.getDate() - 1);
  else if (day < 6) sat.setDate(d.getDate() + (6 - day));
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return [sat.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatCardDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function formatCardTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const [WEEKEND_SAT, WEEKEND_SUN] = getWeekendDates();
const weekLabel = (() => {
  const d1 = parseInt(WEEKEND_SAT.split('-')[2], 10);
  const d2 = parseInt(WEEKEND_SUN.split('-')[2], 10);
  return `Sat–Sun ${d1}–${d2} ${MONTHS[parseInt(WEEKEND_SAT.split('-')[1], 10) - 1]}`;
})();

// STAT_TARGETS replaced by live useStats hook — see HomeScreen component

// ── FAQ data (also used for JSON-LD schema) ───────────────────────────────────
const FAQS = [
  {
    q: 'What is Unknown Movement?',
    a: 'Unknown Movement is a free platform for discovering and joining group rides, runs, and cycling events across Sri Lanka. Athletes and clubs post sessions, and anyone can browse and enrol.',
  },
  {
    q: 'How do I join a group ride or run in Sri Lanka?',
    a: 'Browse upcoming sessions on the Explore page, click on one you like, and tap Enrol. You\'ll receive the WhatsApp group link and meeting details directly.',
  },
  {
    q: 'Are the sessions free to join?',
    a: 'Community sessions submitted by clubs and individuals are free. Official registered races may have an entry fee listed on their event page.',
  },
  {
    q: 'Can I submit my own ride or run?',
    a: 'Yes! Tap "Submit a session" on the homepage. It takes under two minutes and your session will be live immediately for the community to discover.',
  },
  {
    q: 'What cities does Unknown Movement cover?',
    a: 'Sessions are available across Sri Lanka including Colombo, Kandy, Galle, Negombo, and beyond. Use the city filter on Explore to find sessions near you.',
  },
];

// ── JSON-LD helpers ───────────────────────────────────────────────────────────
function JsonLd({ data }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);
  return null;
}

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Unknown Movement',
  url: 'https://unknownmovement.netlify.app/',
  logo: 'https://unknownmovement.netlify.app/favicon.svg',
  description: 'Group rides, runs, and cycling events across Sri Lanka.',
  areaServed: { '@type': 'Country', name: 'Sri Lanka' },
  sameAs: [],
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// ── Official event card ───────────────────────────────────────────────────────
function OfficialEventCard({ ev, onNavigate, i, revealed }) {
  const imgSrc = ev.flyer_image_url || ev.image;
  return (
    <div
      className={`um-featured-card${revealed ? ' revealed' : ''}`}
      style={{ transitionDelay: revealed ? `${i * 0.1}s` : '0s', width: '72vw', maxWidth: 280, height: 300 }}
      onClick={() => onNavigate('detail', ev.id)}
    >
      <img src={imgSrc} alt={`${ev.title} flyer`} className="um-featured-card-img" style={{ objectPosition: 'center top' }} />
      <div className="um-featured-card-overlay" />
      <div className="um-featured-card-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'white', background: 'rgba(252,76,2,0.85)', padding: '2px 6px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Official event
          </span>
        </div>
        <div className="um-featured-card-title">{ev.title}</div>
        <div className="um-featured-card-meta">
          {formatCardDate(ev.date)} · {formatCardTime(ev.time)}<br />{ev.location || ev.city}
          {ev.entry_fee && <><br /><span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{ev.entry_fee}</span></>}
        </div>
        <div className="um-featured-card-foot">
          <span className="um-featured-card-joining" style={{ fontSize: 10 }}>
            {ev.registration_deadline ? `Reg. by ${ev.registration_deadline}` : ev.city}
          </span>
          {ev.registration_link ? (
            <a
              href={ev.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="um-featured-card-enrol"
              onClick={e => e.stopPropagation()}
              style={{ textDecoration: 'none' }}
            >
              Register
            </a>
          ) : (
            <button className="um-featured-card-enrol" onClick={e => { e.stopPropagation(); onNavigate('detail', ev.id); }}>
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section aria-label="Frequently asked questions" style={{ padding: '0 0 4px' }}>
      {FAQS.map((f, i) => (
        <div
          key={i}
          style={{ borderBottom: '1px solid var(--um-border-lt)', padding: '0 16px' }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0', gap: 12, textAlign: 'left',
              fontFamily: 'var(--um-font-body)', minHeight: 52,
            }}
            aria-expanded={open === i}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--um-text)', letterSpacing: '-0.01em', lineHeight: 1.4 }}>{f.q}</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--um-text-3)' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {open === i && (
            <p style={{ fontSize: 13, color: 'var(--um-text-3)', lineHeight: 1.7, paddingBottom: 16, margin: 0 }}>{f.a}</p>
          )}
        </div>
      ))}
    </section>
  );
}

// ── Active clubs preview (fetches top 3 verified clubs) ──────────────────────
function ActiveClubsPreview({ onNavigate }) {
  const [clubs, setClubs] = useState([]);
  useEffect(() => {
    if (!window._supabaseClubs) {
      import('../lib/supabase').then(({ supabase }) => {
        if (!supabase) return;
        supabase.from('clubs').select('id,name,slug,city,logo_url,club_members(count)').eq('is_verified', true).order('name').limit(3).then(({ data }) => {
          setClubs((data || []).map(c => ({ ...c, memberCount: c.club_members?.[0]?.count ?? 0 })));
        });
      });
    }
  }, []);

  if (clubs.length === 0) return (
    <>
      {[{initials:'CC',name:'Colombo Cycling Club',meta:'Colombo · cycling',type:'ride'},{initials:'SR',name:'Sri Lanka Runners',meta:'Island-wide · running',type:'run'}].map(c => (
        <div key={c.name} className="um-club-row" onClick={() => onNavigate('clubs')}>
          <div className="um-club-mark">{c.initials}</div>
          <div style={{ flex:1 }}><div className="um-club-name">{c.name}</div><div className="um-club-meta">{c.meta}</div></div>
          <Badge type={c.type}>{c.type.charAt(0).toUpperCase()+c.type.slice(1)}</Badge>
        </div>
      ))}
    </>
  );

  return (
    <>
      {clubs.map(c => (
        <div key={c.id} className="um-club-row" onClick={() => onNavigate('clubdetail', null, c.slug || c.id)}>
          <div className="um-club-mark" style={{ overflow:'hidden', padding: c.logo_url ? 0 : undefined }}>
            {c.logo_url ? <img src={c.logo_url} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : c.name?.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div className="um-club-name">{c.name}</div>
            <div className="um-club-meta">{[c.city, `${c.memberCount} members`].filter(Boolean).join(' · ')}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--um-text-4)" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      ))}
    </>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, savedEvents, onToggleSave, user, enrolments, onSignIn, onSignOut, isAdmin }) {
  const { events } = useAllEvents();
  const { stats, loaded: statsLoaded } = useStats();
  const featuredRef   = useRef(null);
  const officialRef   = useRef(null);
  const statsRef      = useRef(null);
  const [featuredIn, setFeaturedIn]   = useState(false);
  const [officialIn, setOfficialIn]   = useState(false);
  const [counts, setCounts] = useState({ week: 0, weekend: 0, clubs: 0, cities: 0 });
  const statsAnimated = useRef(false);

  useEffect(() => {
    const el = featuredRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFeaturedIn(true); }, { threshold: 0.08 });
    io.observe(el); return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = officialRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOfficialIn(true); }, { threshold: 0.08 });
    io.observe(el); return () => io.disconnect();
  }, []);

  // Animate stats once both the element is visible AND data is loaded
  useEffect(() => {
    if (!statsLoaded || statsAnimated.current) return;
    const el = statsRef.current;
    if (!el) return;
    const targets = { week: stats.weekEvents, weekend: stats.weekendEvents, clubs: stats.clubs, cities: stats.cities };
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      statsAnimated.current = true;
      let step = 0;
      const steps = 28;
      const timer = setInterval(() => {
        step++;
        const p = 1 - Math.pow(1 - step / steps, 2);
        setCounts({
          week:    Math.round(targets.week    * p),
          weekend: Math.round(targets.weekend * p),
          clubs:   Math.round(targets.clubs   * p),
          cities:  Math.round(targets.cities  * p),
        });
        if (step >= steps) { clearInterval(timer); setCounts(targets); }
      }, 40);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [statsLoaded, stats]);

  const upcomingAll      = events.filter(e => !isEventPast(e.date));
  const officialEvents   = upcomingAll.filter(e => e.is_official_event);
  const communityEvents  = upcomingAll.filter(e => !e.is_official_event);

  const upcomingEnrolled = (enrolments || [])
    .map(id => events.find(e => e.id === id))
    .filter(e => e && !isEventPast(e.date));

  const featured     = communityEvents.slice(0, 3);
  const weekendEvents = communityEvents.filter(e => e.date === WEEKEND_SAT || e.date === WEEKEND_SUN);

  return (
    <div className="um-screen">
      {/* JSON-LD structured data */}
      <JsonLd data={ORG_SCHEMA} />
      <JsonLd data={FAQ_SCHEMA} />

      <Nav onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />

      <HeroSlideshow onNavigate={onNavigate} />

      {/* Community photo reel */}
      <PhotoReel onNavigate={onNavigate} />

      {/* Your upcoming sessions */}
      {user && upcomingEnrolled.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--um-border-lt)', paddingBottom: 4 }}>
          <div className="um-divider-label" style={{ marginTop: 16 }}>
            <span className="um-divider-label-text">Your upcoming sessions</span>
            <span className="um-divider-line" />
            <button
              style={{ fontSize: 10, color: 'var(--um-accent)', fontWeight: 600, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              onClick={() => onNavigate('myevents')}
            >My events →</button>
          </div>
          {upcomingEnrolled.map(ev => {
            const day = ev.date.split('-')[2];
            const dow = DAYS[new Date(ev.date + 'T00:00:00').getDay()];
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
                enrolled={true}
                saved={savedEvents.includes(ev.id)}
                onSave={() => onToggleSave(ev.id)}
                onClick={() => onNavigate('detail', ev.id)}
              />
            );
          })}
        </div>
      )}

      {/* Stats strip — live counts from DB with 5-min cache */}
      <div className="um-stats-strip" ref={statsRef}>
        <div className="um-stat">
          <span className="um-stat-num">{counts.week}</span>
          <span className="um-stat-lbl">This week</span>
        </div>
        <div className="um-stat">
          <span className="um-stat-num">{counts.weekend}</span>
          <span className="um-stat-lbl">Weekend</span>
        </div>
        <div className="um-stat">
          <span className="um-stat-num">{counts.clubs}</span>
          <span className="um-stat-lbl">Clubs</span>
        </div>
        <div className="um-stat" style={{ borderRight: 'none' }}>
          <span className="um-stat-num">{counts.cities}</span>
          <span className="um-stat-lbl">Cities</span>
        </div>
        <div className="um-live-dot-wrap">
          <span className="um-live-dot" aria-hidden="true" />
          <span className="um-live-label">Live</span>
        </div>
      </div>

      {/* ── Official Events & Races carousel ────────────────────────────────── */}
      {officialEvents.length > 0 && (
        <section aria-label="Upcoming races and official events" className="um-featured-section" ref={officialRef}>
          <div className="um-featured-section-hd">
            <span className="um-featured-section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--um-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Races &amp; Official Events
            </span>
            <button className="um-featured-section-link" onClick={() => onNavigate('explore')}>
              See all →
            </button>
          </div>
          <div className="um-featured-scroll">
            {officialEvents.slice(0, 5).map((ev, i) => (
              <OfficialEventCard key={ev.id} ev={ev} onNavigate={onNavigate} i={i} revealed={officialIn} />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured community rides/runs cards ─────────────────────────────── */}
      {featured.length > 0 && (
        <section aria-label="Featured sessions this weekend" className="um-featured-section" ref={featuredRef}>
          <div className="um-featured-section-hd">
            <span className="um-featured-section-title">Featured this weekend</span>
            <button className="um-featured-section-link" onClick={() => onNavigate('explore')}>
              View all →
            </button>
          </div>
          <div className="um-featured-scroll">
            {featured.map((ev, i) => {
              const isSaved = savedEvents.includes(ev.id);
              return (
                <div
                  key={ev.id}
                  className={`um-featured-card${featuredIn ? ' revealed' : ''}`}
                  style={{ transitionDelay: featuredIn ? `${i * 0.12}s` : '0s' }}
                  onClick={() => onNavigate('detail', ev.id)}
                >
                  <img src={ev.image} alt={`${ev.type === 'ride' ? 'Cycling group ride' : 'Running group'} — ${ev.title} in Sri Lanka`} className="um-featured-card-img" loading="lazy" />
                  <div className="um-featured-card-overlay" />
                  <button
                    className={`um-featured-card-save${isSaved ? ' saved' : ''}`}
                    onClick={e => { e.stopPropagation(); onToggleSave(ev.id); }}
                    aria-label={isSaved ? 'Unsave' : 'Save'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? 'white' : 'none'} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <div className="um-featured-card-content">
                    <div className="um-featured-card-type">{ev.type}</div>
                    <div className="um-featured-card-title">{ev.title}</div>
                    <div className="um-featured-card-meta">
                      {formatCardDate(ev.date)} · {formatCardTime(ev.time)}<br />{ev.location}
                    </div>
                    <div className="um-featured-card-foot">
                      <span className="um-featured-card-joining">
                        <strong>{ev.joining}</strong> joining
                      </span>
                      <button
                        className="um-featured-card-enrol"
                        onClick={e => { e.stopPropagation(); onNavigate('detail', ev.id); }}
                      >
                        Enrol
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* This weekend session list */}
      {weekendEvents.length > 0 && (
        <>
          <div className="um-divider-label">
            <span className="um-divider-label-text">Sessions this weekend</span>
            <span className="um-divider-line" />
            <span style={{ fontSize: 10, color: 'var(--um-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>{weekLabel}</span>
          </div>
          {weekendEvents.map(ev => {
            const day = ev.date.split('-')[2];
            const dow = DAYS[new Date(ev.date + 'T00:00:00').getDay()];
            const isSaved = savedEvents.includes(ev.id);
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
                enrolled={(enrolments || []).includes(ev.id)}
                saved={isSaved}
                onSave={() => onToggleSave(ev.id)}
                onClick={() => onNavigate('detail', ev.id)}
              />
            );
          })}
        </>
      )}

      {/* Upcoming events */}
      <div className="um-section-label" style={{ marginBottom: 14 }}>
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
          <div className="um-event-meta">Beira Lake · Triathlon · 750m / 20 km / 5 km</div>
          <div style={{ marginTop: 7 }}><Badge type="tri">Triathlon</Badge></div>
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
          <div className="um-event-meta">Kandy · Road Ride · 120 km · Gran Fondo</div>
          <div style={{ marginTop: 7 }}><Badge type="ride">Endurance ride</Badge></div>
        </div>
      </div>

      {/* Active clubs — links to real club directory */}
      <div className="um-section-label" style={{ margin: '22px 0 0' }}>
        <span className="um-section-title">Active clubs</span>
        <button className="um-section-link" onClick={() => onNavigate('clubs')}>See all →</button>
      </div>
      <ActiveClubsPreview onNavigate={onNavigate} />

      {/* Submit CTA */}
      <div className="um-submit-cta-block">
        <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
          <img
            src="/49fab97914717dd5757d45ba98e97a2c.jpg"
            alt="Group of cyclists and runners gathering for a community session in Sri Lanka"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
            loading="lazy"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,12,0.45)' }} />
        </div>
        <div style={{ padding: '20px 20px 22px', background: 'var(--um-surface)' }}>
          <div className="um-submit-cta-title">Organising a session?</div>
          <div className="um-submit-cta-sub">Share it with the community — free, and done in under two minutes.</div>
          <button className="um-btn um-btn-accent um-btn-full" onClick={() => onNavigate('submit')}>
            Submit a ride or run
          </button>
        </div>
      </div>

      {/* ── Sri Lanka's home section (SEO editorial content) ─────────────────── */}
      <section aria-label="About Unknown Movement" style={{ padding: '32px 16px 24px', borderTop: '1px solid var(--um-border-lt)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--um-text)', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.2 }}>
          Sri Lanka's home for group rides and runs
        </h2>
        <p style={{ fontSize: 14, color: 'var(--um-text-3)', lineHeight: 1.75, marginBottom: 14 }}>
          Unknown Movement is the central hub for cyclists and runners across Sri Lanka.
          Whether you're looking for a morning group ride in Colombo, a weekend trail run in the hills
          above Kandy, or a coffee-stop loop through Galle, you'll find your community here.
          Athletes from Negombo to Matara use this platform to discover training partners, join local
          clubs, and stay connected with the island's growing endurance scene.
        </p>
        <p style={{ fontSize: 14, color: 'var(--um-text-3)', lineHeight: 1.75, marginBottom: 14 }}>
          From beginner-friendly running groups in Colombo to competitive cycling sportives and
          marathon training programmes, the island's athletic calendar is more active than ever.
          Sri Lanka's roads and trails offer incredible variety — coastal routes in Negombo and
          Galle, mountain passes near Kandy and Nuwara Eliya, and the vibrant urban cycling scene
          growing out of Colombo 3, 5, and 7.
        </p>
        <p style={{ fontSize: 14, color: 'var(--um-text-3)', lineHeight: 1.75 }}>
          Submit your own session in under two minutes, or{' '}
          <button
            onClick={() => onNavigate('explore')}
            style={{ color: 'var(--um-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
          >
            explore all upcoming events
          </button>
          {' '}to find a ride or run that fits your level. All sessions are free to join and open to
          everyone — from first-time joggers to seasoned triathletes.
        </p>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <div className="um-section-label" style={{ margin: '4px 0 4px' }}>
        <h2 className="um-section-title">Common questions</h2>
      </div>
      <FAQ />

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
