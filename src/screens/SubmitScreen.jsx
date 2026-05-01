import { useState } from 'react';

export default function SubmitScreen({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [activityType, setActivityType] = useState('Ride');
  const [difficulty, setDifficulty] = useState('Social');
  const [coffee, setCoffee] = useState(true);
  const [nodrop, setNodrop] = useState(true);
  const [beginner, setBeginner] = useState(false);
  const [tourist, setTourist] = useState(false);
  const [visibility, setVisibility] = useState('public');

  return (
    <div className="um-screen">
      <div className="um-nav">
        <button className="um-nav-back" onClick={() => onNavigate('home')}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span>Submit a session</span>
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--um-text-3)', fontFamily: 'inherit' }} onClick={() => onNavigate('home')}>
          ✕
        </button>
      </div>

      {/* Stepper */}
      <div className="um-stepper">
        <div className={`um-step-seg${step >= 1 ? ' active' : ''}`} />
        <div className={`um-step-seg${step >= 2 ? ' active' : ''}`} />
        <div className={`um-step-seg${step >= 3 ? ' active' : ''}`} />
      </div>
      <div className="um-step-label">
        <strong>Step {step} of 3</strong> — {step === 1 ? 'Core details' : step === 2 ? 'Session details' : 'Organiser & visibility'}
      </div>

      {step === 1 && (
        <div className="um-form-body">
          <div className="um-field">
            <label className="um-field-label">Session title</label>
            <input className="um-input" placeholder="e.g. Colombo Coffee Loop" />
          </div>
          <div className="um-field">
            <label className="um-field-label">Activity type</label>
            <div className="um-type-grid">
              {['Ride', 'Run', 'Triathlon'].map(t => (
                <button key={t} className={`um-type-btn${activityType === t ? ' sel' : ''}`} onClick={() => setActivityType(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="um-field">
              <label className="um-field-label">Date</label>
              <input className="um-input" type="date" defaultValue="2026-05-03" />
            </div>
            <div className="um-field">
              <label className="um-field-label">Start time</label>
              <input className="um-input" type="time" defaultValue="06:00" />
            </div>
          </div>
          <div className="um-field">
            <label className="um-field-label">City / area</label>
            <select className="um-select">
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
              <option>Negombo</option>
              <option>Other</option>
            </select>
          </div>
          <div className="um-field">
            <label className="um-field-label">Start location</label>
            <input className="um-input" placeholder="e.g. Independence Square, Colombo 7" />
          </div>
          <div className="um-field">
            <label className="um-field-label">Difficulty</label>
            <div className="um-diff-grid">
              {['Easy', 'Social', 'Moderate', 'Hard'].map(d => (
                <button key={d} className={`um-diff-btn${difficulty === d ? ' sel' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="um-form-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="um-field">
              <label className="um-field-label">Distance (km)</label>
              <input className="um-input" placeholder="42" />
            </div>
            <div className="um-field">
              <label className="um-field-label">Duration</label>
              <input className="um-input" placeholder="e.g. 2 hr" />
            </div>
          </div>
          <div className="um-field">
            <label className="um-field-label">Pace or average speed</label>
            <input className="um-input" placeholder="e.g. 25–28 km/h or 5:30/km" />
          </div>
          <div className="um-field">
            <label className="um-field-label">Route link</label>
            <input className="um-input" placeholder="Strava, Komoot, or Google Maps (optional)" />
          </div>
          <div style={{ borderTop: '1px solid var(--um-border-lt)', paddingTop: 6 }}>
            <div className="um-field-label" style={{ marginBottom: 4 }}>Session tags</div>
            <p style={{ fontSize: 12, color: 'var(--um-text-4)', marginBottom: 14 }}>Helps riders find and assess your session.</p>
            {[
              { label: 'Coffee stop', sub: 'Ends at a café', val: coffee, set: setCoffee },
              { label: 'No drop', sub: 'No one gets left behind', val: nodrop, set: setNodrop },
              { label: 'Beginner friendly', sub: null, val: beginner, set: setBeginner },
              { label: 'Tourist friendly', sub: 'Open to visitors', val: tourist, set: setTourist },
            ].map(t => (
              <div key={t.label} className="um-toggle-row">
                <div>
                  <div className="um-toggle-name">{t.label}</div>
                  {t.sub && <div className="um-toggle-desc">{t.sub}</div>}
                </div>
                <button className={`um-toggle ${t.val ? 'on' : 'off'}`} onClick={() => t.set(v => !v)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="um-form-body">
          <div className="um-field">
            <label className="um-field-label">Organiser name or club</label>
            <input className="um-input" placeholder="e.g. Colombo Cycling Club" />
          </div>
          <div className="um-field">
            <label className="um-field-label">WhatsApp contact</label>
            <input className="um-input" placeholder="+94 77 000 0000" />
          </div>
          <div className="um-field">
            <label className="um-field-label">Strava club link</label>
            <input className="um-input" placeholder="strava.com/clubs/… (optional)" />
          </div>
          <div style={{ borderTop: '1px solid var(--um-border-lt)', paddingTop: 6 }}>
            <div className="um-field-label" style={{ marginBottom: 12 }}>Activity visibility</div>
            <div className="um-radio-col">
              {[
                { val: 'public',   label: 'Public',   sub: 'Visible to everyone on Unknown Movement' },
                { val: 'unlisted', label: 'Unlisted', sub: 'Only via direct link' },
                { val: 'private',  label: 'Private',  sub: 'Invite only' },
              ].map(opt => (
                <div key={opt.val} className="um-radio-row" onClick={() => setVisibility(opt.val)}>
                  <div className={`um-radio-dot${visibility === opt.val ? ' sel' : ''}`} />
                  <div>
                    <div className="um-radio-label">{opt.label}</div>
                    <div className="um-radio-sub">{opt.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="um-field">
            <label className="um-field-label">Attendee visibility</label>
            <select className="um-select">
              <option>Show count only (recommended)</option>
              <option>Show names</option>
              <option>Hide attendee info</option>
            </select>
          </div>
        </div>
      )}

      {/* Form nav */}
      <div className="um-form-nav">
        {step > 1 && (
          <button className="um-btn um-btn-outline" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>Back</button>
        )}
        {step < 3 ? (
          <button className="um-btn um-btn-primary" style={{ flex: 2 }} onClick={() => setStep(s => s + 1)}>Continue</button>
        ) : (
          <button className="um-btn um-btn-primary" style={{ flex: 2 }}>Submit session</button>
        )}
      </div>
    </div>
  );
}
