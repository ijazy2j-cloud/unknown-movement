import { useEffect, useRef, useState } from 'react';
import Nav from '../components/Nav';
import Badge from '../components/Badge';
import SessionRow from '../components/SessionRow';
import HeroSlideshow from '../components/HeroSlideshow';
import Footer from '../components/Footer';
import { useAllEvents } from '../lib/useEvents';

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
  const mon = MONTHS[parseInt(WEEKEND_SAT.split('-')[1], 10) - 1];
  return `Sat–Sun ${d1}–${d2} ${mon}`;
})();

const STAT_TARGETS = { week: 24, weekend: 8, clubs: 6, cities: 3 };

export default function HomeScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, savedEvents, onToggleSave, user, enrolments, onSignIn, onSignOut }) {
  const { events } = useAllEvents();
  const featuredRef = useRef(null);
  const statsRef    = useRef(null);
  const [featuredIn, setFeaturedIn] = useState(false);
  const [counts, setCounts] = useState({ week: 0, weekend: 0, clubs: 0, cities: 0 });

  useEffect(() => {
    const el = featuredRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFeaturedIn(true); },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      let step = 0;
      const steps = 28;
      const timer = setInterval(() => {
        step++;
        const p = 1 - Math.pow(1 - step / steps, 2);
        setCounts({
          week:    Math.round(STAT_TARGETS.week    * p),
          weekend: Math.round(STAT_TARGETS.weekend * p),
          clubs:   Math.round(STAT_TARGETS.clubs   * p),
          cities:  Math.round(STAT_TARGETS.cities  * p),
        });
        if (step >= steps) { clearInterval(timer); setCounts(STAT_TARGETS); }
      }, 40);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const upcomingAll = events.filter(e => !isEventPast(e.date));

  const upcomingEnrolled = (enrolments || [])
    .map(id => events.find(e => e.id === id))
    .filter(e => e && !isEventPast(e.date));

  const featured = upcomingAll.slice(0, 3);
  const weekendEvents = upcomingAll.filter(e => e.date === WEEKEND_SAT || e.date === WEEKEND_SUN);

  return (
    <div className="um-screen">
      <Nav onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} />

      <HeroSlideshow onNavigate={onNavigate} />

      {/* Your upcoming sessions (logged-in users with enrolments) */}
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

      {/* Stats strip */}
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
        <div className="um-stat">
          <span className="um-stat-num">{counts.cities}</span>
          <span className="um-stat-lbl">Cities</span>
        </div>
        <div className="um-live-dot-wrap">
          <span className="um-live-dot" />
        </div>
      </div>

      {/* Featured cards */}
      {featured.length > 0 && (
        <div className="um-featured-section" ref={featuredRef}>
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
                  <img src={ev.image} alt={ev.title} className="um-featured-card-img" />
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
        </div>
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

      {/* Active clubs */}
      <div className="um-section-label" style={{ margin: '22px 0 0' }}>
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
        <div className="um-club-mark" style={{ background: 'oklch(36% 0.09 220)', color: 'white' }}>SR</div>
        <div style={{ flex: 1 }}>
          <div className="um-club-name">Sri Lanka Runners</div>
          <div className="um-club-meta">Island-wide · 220 members · 5× weekly</div>
        </div>
        <Badge type="run">Run</Badge>
      </div>

      {/* Submit CTA */}
      <div className="um-submit-cta-block">
        <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
          <img
            src="/49fab97914717dd5757d45ba98e97a2c.jpg"
            alt="Community group"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
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

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
