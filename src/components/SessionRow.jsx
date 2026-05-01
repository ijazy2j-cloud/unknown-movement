import Badge from './Badge';

export default function SessionRow({ title, type, day, dow, time, location, km, pace, difficulty, joining, tags = [], onClick }) {
  const diffColor =
    difficulty === 'Hard'   ? 'oklch(38% 0.10 20)'  :
    difficulty === 'Social' ? 'oklch(36% 0.09 148)' :
    'var(--um-text-2)';

  const typeKey = type === 'Ride' ? 'ride' : type === 'Run' ? 'run' : 'tri';

  return (
    <div className="um-session-row" onClick={onClick}>
      <div className="um-session-date-col">
        <span className="um-session-day">{day}</span>
        <span className="um-session-dow">{dow}</span>
      </div>
      <div className="um-session-bar" />
      <div className="um-session-body">
        <div className="um-session-title">{title}</div>
        <div className="um-session-meta">{time} · {location}</div>
        <div className="um-session-stats">
          <span className="um-session-stat-val">
            {km}<span className="um-session-stat-lbl"> km</span>
          </span>
          <span className="um-session-dot" />
          <span className="um-session-stat-val">{pace}</span>
          <span className="um-session-dot" />
          <span className="um-session-stat-val" style={{ color: diffColor }}>{difficulty}</span>
        </div>
        {tags.length > 0 && (
          <div className="um-session-badges">
            <Badge type={typeKey}>{type}</Badge>
            {tags.map(t => <Badge key={t.label} type={t.type}>{t.label}</Badge>)}
          </div>
        )}
      </div>
      <div className="um-session-tail">
        <span className="um-session-time">{time}</span>
        <span className="um-session-joining"><strong>{joining}</strong> joining</span>
      </div>
    </div>
  );
}
