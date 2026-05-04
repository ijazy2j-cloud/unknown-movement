import { useState, useEffect, useRef } from 'react';

const SLIDES = [
  { src: '/8370b6d97ee89c13247896b6b0583c65.jpg', alt: 'Runners at golden hour',        kb: 'kb1' },
  { src: '/8b5b13d59c2c3457b490a7aceaa16a71.jpg', alt: 'Cyclists overlooking Colombo',  kb: 'kb2' },
  { src: '/9b0d5ccabc8b74722e5e92dd0f84a746.jpg', alt: 'Group at sunrise ride',          kb: 'kb3' },
  { src: '/6af0dd154e73264b3e2302e0b86867d1.jpg', alt: 'Trail run through the hills',    kb: 'kb4' },
  { src: '/49fab97914717dd5757d45ba98e97a2c.jpg', alt: 'Community ride gathering',       kb: 'kb2' },
];

export default function HeroSlideshow({ onNavigate }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      setCurrent(c => delta < 0
        ? (c + 1) % SLIDES.length
        : (c - 1 + SLIDES.length) % SLIDES.length
      );
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="um-hero"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {SLIDES.map((slide, i) => (
        <div key={i} className={`um-hero-slide${i === current ? ' active' : ''}`}>
          <img
            src={slide.src}
            alt={slide.alt}
            className={`um-hero-slide-img um-${slide.kb}`}
          />
        </div>
      ))}

      <div className="um-hero-gradient" />
      <div className="um-hero-vignette" />

      <div className="um-hero-content">
        <div className="um-hero-glass">
          <div className="um-hero-eyebrow">
            <span className="um-hero-eyebrow-line" aria-hidden="true" />
            Sri Lanka · May 2026
            <span className="um-hero-eyebrow-line" aria-hidden="true" />
          </div>
          <h1 className="um-hero-title">
            Find your<br />next<br /><em>ride or run.</em>
          </h1>
          <p className="um-hero-sub">
            Rides, runs, coffee sessions, training groups and endurance events across the island.
          </p>
          <div className="um-hero-btns">
            <button className="um-hero-btn-primary" onClick={() => onNavigate('explore')}>
              Explore sessions
            </button>
            <button className="um-hero-btn-secondary" onClick={() => onNavigate('submit')}>
              Submit one
            </button>
          </div>
        </div>
      </div>

      <div className="um-hero-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`um-hero-dot${i === current ? ' active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
