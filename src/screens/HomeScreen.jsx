import { useEffect, useRef, useState } from 'react';
import Nav from '../components/Nav';
import Badge from '../components/Badge';
import SessionRow from '../components/SessionRow';
import HeroSlideshow from '../components/HeroSlideshow';
import Footer from '../components/Footer';
import { EVENTS, isPast } from '../data/events';

const FEATURED = [
  { id: 'colombo-coffee-loop', img: '/9cfe853c44722834d35684daba4c955b.jpg', title: 'Colombo Coffee Loop', date: 'Sat 3 May', time: '6:00 AM', location: 'Colombo 7', type: 'Ride', joining: 12 },
  { id: 'negombo-beach-run',   img: '/9b0d5ccabc8b74722e5e92dd0f84a746.jpg', title: 'Negombo Beach Run',   date: 'Sat 3 May', time: '6:30 AM', location: 'Negombo',   type: 'Run',  joining: 18 },
  { id: 'kandy-hills-interval',img: '/1e48dae1ccc168f035e9f8c0a25b4fbb.jpg', title: 'Kandy Hills Interval',date: 'Sun 4 May', time: '5:30 AM', location: 'Kandy',      type: 'Run',  joining: 9  },
];

const STAT_TARGETS = { week: 24, weekend: 8, clubs: 6, cities: 3 };

const WEEKEND_EVENTS = EVENTS.filter(e => e.date === '2026-05-03' || e.date === '2026-05-04');

export default function HomeScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, savedEvents, onToggleSave }) {
  const featuredRef = useRef(null);
  const statsRef = useRef(null);
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

  return (
    <div className="um-screen">
      <Nav onNavigate={onNavigate} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} />

      <HeroSlideshow onNavigate={onNavigate} />

      {/* Stats strip with count-up */}
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
      <div className="um-featured-section" ref={featuredRef}>
        <div className="um-featured-section-hd">
          <span className="um-featured-section-title">Featured this weekend</span>
          <button className="um-featured-section-link" onClick={() => onNavigate('explore')}>
            View all →
          </button>
        </div>
        <div className="um-featured-scroll">
          {FEATURED.map((ev, i) => {
            const isSaved = savedEvents.includes(ev.id);
            return (
              <div
                key={ev.id}
                className={`um-featured-card${featuredIn ? ' revealed' : ''}`}
                style={{ transitionDelay: featuredIn ? `${i * 0.12}s` : '0s' }}
                onClick={() => onNavigate('detail', ev.id)}
              >
                <img src={ev.img} alt={ev.title} className="um-featured-card-img" />
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
                    {ev.date} · {ev.time}<br />{ev.location}
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

      {/* This weekend session list */}
      <div className="um-divider-label">
        <span className="um-divider-label-text">Sessions this weekend</span>
        <span className="um-divider-line" />
        <span style={{ fontSize: 10, color: 'var(--um-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sat–Sun 3–4 May</span>
      </div>

      {WEEKEND_EVENTS.map(ev => {
        const day = ev.date.split('-')[2];
        const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(ev.date + 'T00:00:00').getDay()];
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
            saved={isSaved}
            onSave={() => onToggleSave(ev.id)}
            onClick={() => onNavigate('detail', ev.id)}
          />
        );
      })}

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
