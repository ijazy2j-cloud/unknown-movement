import Badge from './Badge';

const DIFF_COLORS = {
  Hard:     'var(--um-accent)',
  Moderate: 'oklch(68% 0.10 72)',
  Social:   'oklch(68% 0.10 148)',
  Easy:     'oklch(68% 0.12 220)',
};

function DiffBars({ difficulty }) {
  const bars = difficulty === 'Hard' ? 3 : difficulty === 'Moderate' ? 2 : 1;
  const color = DIFF_COLORS[difficulty] || 'var(--um-text-3)';
  return (
    <span className="um-diff-bars" aria-label={difficulty}>
      {[1, 2, 3].map(n => (
        <span
          key={n}
          className="um-diff-bar"
          style={{
            height: `${4 + n * 3}px`,
            background: n <= bars ? color : 'var(--um-border)',
          }}
        />
      ))}
    </span>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'var(--um-accent)' : 'none'} stroke={filled ? 'var(--um-accent)' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

export default function SessionRow({ title, type, day, dow, time, location, km, pace, difficulty, joining, tags = [], completed, enrolled, saved, onSave, onClick }) {
  const diffColor = DIFF_COLORS[difficulty] || 'var(--um-text-3)';
  const typeKey = type === 'Ride' ? 'ride' : type === 'Run' ? 'run' : 'tri';

  return (
    <div className={`um-session-row${completed ? ' um-session-past' : ''}`} onClick={onClick}>
      <div className="um-session-date-col">
        <span className="um-session-day">{day}</span>
        <span className="um-session-dow">{dow}</span>
      </div>
      <div className="um-session-bar" />
      <div className="um-session-body">
        <div className="um-session-title">{title}</div>
        <div className="um-session-meta">{time} · {location}</div>
        <div className="um-session-stats">
          <span className="um-session-stat-val um-session-km">
            {km}<span className="um-session-stat-lbl"> km</span>
          </span>
          <span className="um-session-dot" />
          <span className="um-session-stat-val um-session-pace">{pace}</span>
          <span className="um-session-dot" />
          <DiffBars difficulty={difficulty} />
          <span className="um-session-stat-val" style={{ color: diffColor, marginLeft: 3 }}>{difficulty}</span>
        </div>
        {tags.length > 0 && (
          <div className="um-session-badges">
            <Badge type={typeKey}>{type}</Badge>
            {tags.filter(t => t.type !== 'run' && t.type !== 'ride').map(t => (
              <Badge key={t.label} type={t.type}>{t.label}</Badge>
            ))}
            {completed && <span className="um-completed-badge">Completed</span>}
            {enrolled && !completed && <span className="um-going-badge">Going</span>}
          </div>
        )}
      </div>
      <div className="um-session-tail">
        <span className="um-session-time">{time}</span>
        <span className="um-session-joining"><strong>{joining}</strong> joining</span>
        {onSave !== undefined && (
          <button
            className={`um-row-save-btn${saved ? ' saved' : ''}`}
            onClick={e => { e.stopPropagation(); onSave(); }}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            <HeartIcon filled={saved} />
          </button>
        )}
      </div>
    </div>
  );
}
