import { useState, useEffect, useRef, useCallback } from 'react';
import Badge from '../components/Badge';
import { supabase } from '../lib/supabase';

const TODAY = new Date().toISOString().slice(0, 10);

// ── Nominatim location autocomplete (no API key needed) ──────────────────────
function LocationAutocomplete({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Sync external value resets (e.g. "Submit another")
  useEffect(() => { if (!value) { setQuery(''); setSuggestions([]); setOpen(false); } }, [value]);

  const search = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=en`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  const handleSelect = (item) => {
    const name = item.display_name;
    setQuery(name);
    setSuggestions([]);
    setOpen(false);
    onSelect(name, { lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="um-input"
          placeholder="e.g. Independence Square, Colombo 7"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--um-text-4)', fontSize: 11 }}>
            Searching…
          </span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="um-nominatim-dropdown">
          {suggestions.map((item, i) => {
            const parts = item.display_name.split(', ');
            const main = parts.slice(0, 2).join(', ');
            const sub = parts.slice(2).join(', ');
            return (
              <button
                key={i}
                className="um-nominatim-item"
                onMouseDown={e => { e.preventDefault(); handleSelect(item); }}
                onTouchEnd={e => { e.preventDefault(); handleSelect(item); }}
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--um-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>
                  <span style={{ display: 'block', fontWeight: 500, color: 'var(--um-text)' }}>{main}</span>
                  {sub && <span style={{ display: 'block', fontSize: 11, color: 'var(--um-text-4)', marginTop: 1 }}>{sub}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8.5" cy="8.5" r="3.2" />
      <line x1="8.5" y1="1"    x2="8.5" y2="2.8"  />
      <line x1="8.5" y1="14.2" x2="8.5" y2="16"   />
      <line x1="1"   y1="8.5"  x2="2.8" y2="8.5"  />
      <line x1="14.2" y1="8.5" x2="16"  y2="8.5"  />
      <line x1="3.4" y1="3.4"  x2="4.7" y2="4.7"  />
      <line x1="12.3" y1="12.3" x2="13.6" y2="13.6" />
      <line x1="3.4" y1="13.6" x2="4.7" y2="12.3" />
      <line x1="12.3" y1="4.7" x2="13.6" y2="3.4"  />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.8 10.5A6.5 6.5 0 0 1 5.5 2.2a6.5 6.5 0 1 0 8.3 8.3z" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

export default function SubmitScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, editEventId, onClearEdit }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Official event toggle
  const [isOfficialEvent, setIsOfficialEvent] = useState(false);
  const [flyerImageUrl, setFlyerImageUrl] = useState('');
  const [flyerUploading, setFlyerUploading] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [eventWebsite, setEventWebsite] = useState('');
  const flyerInputRef = useRef(null);

  // Step 1
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('Ride');
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState('06:00');
  const [city, setCity] = useState('Colombo');
  const [startLocation, setStartLocation] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [difficulty, setDifficulty] = useState('Social');

  // Step 2
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [routeLink, setRouteLink] = useState('');
  const [coffee, setCoffee] = useState(true);
  const [nodrop, setNodrop] = useState(true);
  const [beginner, setBeginner] = useState(false);
  const [tourist, setTourist] = useState(false);

  // Step 3
  const [organiserName, setOrganiserName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [stravaLink, setStravaLink] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [attendeeVis, setAttendeeVis] = useState('count_only');

  // Pre-fill when editing
  useEffect(() => {
    if (!editEventId || !supabase) return;
    supabase.from('events').select('*').eq('id', editEventId).single()
      .then(({ data }) => {
        if (!data) return;
        setIsOfficialEvent(!!data.is_official_event);
        setFlyerImageUrl(data.flyer_image_url || '');
        setRegistrationLink(data.registration_link || '');
        setRegistrationDeadline(data.registration_deadline || '');
        setEntryFee(data.entry_fee || '');
        setEventWebsite(data.event_website || '');
        setTitle(data.title || '');
        setActivityType(data.type === 'ride' ? 'Ride' : data.type === 'run' ? 'Run' : 'Triathlon');
        setDate(data.date || TODAY);
        setStartTime(data.time || '06:00');
        setCity(data.city || 'Colombo');
        setStartLocation(data.start_location_name || '');
        if (data.start_location_lat) setStartCoords({ lat: data.start_location_lat, lng: data.start_location_lng });
        setDifficulty(data.difficulty ? data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1) : 'Social');
        setDistance(data.distance_km?.toString() || '');
        setPace(data.pace || '');
        setRouteLink(data.strava_link || '');
        setOrganiserName(data.organiser_name || '');
        setWhatsapp(data.whatsapp_contact || '');
        setVisibility(data.visibility || 'public');
        const tags = data.tags || [];
        setCoffee(tags.some(t => t.type === 'coffee'));
        setNodrop(tags.some(t => t.type === 'nodrop'));
        setBeginner(tags.some(t => t.type === 'beginner'));
        setTourist(tags.some(t => t.type === 'tourist'));
      });
  }, [editEventId]);


  const handleFlyerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    e.target.value = '';
    setFlyerUploading(true);
    const ext = file.name.split('.').pop();
    const path = `flyers/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('event-photos').upload(path, file, { contentType: file.type });
    if (error) { setSubmitError('Flyer upload failed: ' + error.message); setFlyerUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(path);
    setFlyerImageUrl(publicUrl);
    setFlyerUploading(false);
  };

  function validate() {
    if (!title.trim()) return 'Please enter a title.';
    if (date < TODAY) return 'Date must be today or in the future.';
    if (!startLocation.trim()) return 'Please enter a start location.';
    if (isOfficialEvent && registrationLink && !/^https?:\/\/.+/.test(registrationLink))
      return 'Registration link must be a valid URL (https://…).';
    return null;
  }

  async function checkRateLimit(userId) {
    if (!supabase) return false;
    const dayStart = new Date(new Date().toDateString()).toISOString();
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('organiser_id', userId)
      .gte('created_at', dayStart);
    return (count || 0) >= 3;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setSubmitError(err); return; }
    if (!supabase || !user) { setSubmitted(true); return; }

    setSubmitting(true);
    setSubmitError('');

    const limited = await checkRateLimit(user.id);
    if (limited) {
      setSubmitError('You can submit a maximum of 3 sessions per day. Try again tomorrow.');
      setSubmitting(false);
      return;
    }

    const tags = [
      coffee   && { type: 'coffee',   label: 'Coffee stop' },
      nodrop   && { type: 'nodrop',   label: 'No drop' },
      beginner && { type: 'beginner', label: 'Beginner friendly' },
      tourist  && { type: 'tourist',  label: 'Tourist friendly' },
    ].filter(Boolean);

    const payload = {
      title:               title.trim(),
      type:                activityType.toLowerCase(),
      date,
      time:                startTime,
      city,
      start_location_name: startLocation.trim(),
      start_location_lat:  startCoords?.lat || null,
      start_location_lng:  startCoords?.lng || null,
      distance_km:         distance ? parseFloat(distance) : null,
      pace:                isOfficialEvent ? null : (pace.trim() || null),
      strava_link:         routeLink.trim() || null,
      difficulty:          isOfficialEvent ? null : difficulty.toLowerCase(),
      tags,
      organiser_id:        user.id,
      organiser_name:      organiserName.trim() || user.email,
      whatsapp_contact:    whatsapp.trim() || null,
      visibility,
      attendee_visibility: attendeeVis,
      status:              'upcoming',
      // Official event fields
      is_official_event:    isOfficialEvent,
      flyer_image_url:      flyerImageUrl || null,
      registration_link:    registrationLink.trim() || null,
      registration_deadline:registrationDeadline || null,
      entry_fee:            entryFee.trim() || null,
      event_website:        eventWebsite.trim() || null,
    };

    let error;
    if (editEventId) {
      ({ error } = await supabase.from('events').update(payload).eq('id', editEventId).eq('organiser_id', user.id));
    } else {
      ({ error } = await supabase.from('events').insert(payload));
    }

    setSubmitting(false);
    if (error) { setSubmitError(error.message); return; }
    if (onClearEdit) onClearEdit();
    setSubmitted(true);
  }

  function handleSubmitAnother() {
    setStep(1); setIsOfficialEvent(false); setFlyerImageUrl('');
    setRegistrationLink(''); setRegistrationDeadline(''); setEntryFee(''); setEventWebsite('');
    setTitle(''); setActivityType('Ride'); setDate(TODAY); setStartTime('06:00');
    setCity('Colombo'); setStartLocation(''); setStartCoords(null); setDifficulty('Social');
    setDistance(''); setPace(''); setRouteLink('');
    setCoffee(true); setNodrop(true); setBeginner(false); setTourist(false);
    setOrganiserName(''); setWhatsapp(''); setStravaLink('');
    setVisibility('public'); setAttendeeVis('count_only');
    setSubmitted(false); setSubmitError('');
    if (onClearEdit) onClearEdit();
  }

  const typeKey = activityType === 'Ride' ? 'ride' : activityType === 'Run' ? 'run' : 'tri';

  if (submitted) {
    const tagList = [coffee && 'Coffee stop', nodrop && 'No drop', beginner && 'Beginner friendly', tourist && 'Tourist friendly'].filter(Boolean);
    return (
      <div className="um-screen">
        <div className="um-nav">
          <div className="um-nav-left">
            <button className="um-logo-btn" onClick={() => onNavigate('home')}>Unknown Movement</button>
          </div>
          <div className="um-nav-right">
            <button className="um-dark-toggle" onClick={onToggleDark} aria-label="Toggle theme">
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
        <div className="um-confirm">
          <div className="um-confirm-icon">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path d="M6 15l7 7 11-13" stroke="#FC4C02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="um-confirm-title">{editEventId ? 'Session updated' : isOfficialEvent ? 'Event submitted' : 'Session submitted'}</div>
            <div className="um-confirm-sub">
              {isOfficialEvent
                ? 'Your event is live. Athletes can now find and register.'
                : 'Your session is live. Riders can now find and join it.'}
            </div>
          </div>
          <div className="um-confirm-card">
            <div className="um-confirm-card-hd">
              {isOfficialEvent ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <VerifiedIcon /> Official event
                </span>
              ) : 'Session details'}
            </div>
            <div className="um-confirm-card-title">{title || 'Untitled'}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge type={typeKey}>{activityType}</Badge>
              {isOfficialEvent && (
                <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(68% 0.14 148)', background: 'oklch(68% 0.14 148 / 0.15)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>OFFICIAL</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--um-border-lt)', paddingTop: 14 }}>
              {[
                { key: 'Date', val: date },
                { key: 'Time', val: startTime },
                { key: 'City', val: city },
                { key: 'Location', val: startLocation || 'Not specified' },
                ...(isOfficialEvent ? [
                  ...(entryFee ? [{ key: 'Entry fee', val: entryFee }] : []),
                  ...(registrationDeadline ? [{ key: 'Reg. deadline', val: registrationDeadline }] : []),
                ] : [
                  { key: 'Difficulty', val: difficulty },
                  ...(tagList.length ? [{ key: 'Tags', val: tagList.join(', ') }] : []),
                ]),
              ].map(row => (
                <div key={row.key} className="um-confirm-row">
                  <span className="um-confirm-key">{row.key}</span>
                  <span className="um-confirm-val">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="um-confirm-btns">
            <button className="um-btn um-btn-accent um-btn-full" onClick={() => onNavigate('home')}>Back to homepage</button>
            {!editEventId && (
              <button className="um-btn um-btn-outline um-btn-full" onClick={handleSubmitAnother}>Submit another</button>
            )}
            {user && (
              <button className="um-btn um-btn-ghost um-btn-full" onClick={() => onNavigate('myevents')}>View My Events</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="um-screen">
      <div className="um-nav">
        <div className="um-nav-left">
          <button
            className="um-nav-back-btn"
            onClick={() => goBack ? goBack() : onNavigate('home')}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
          <button className="um-logo-btn" onClick={() => onNavigate('home')}>
            {editEventId ? 'Edit session' : 'Submit a session'}
          </button>
        </div>
        <div className="um-nav-right">
          <button className="um-dark-toggle" onClick={onToggleDark} aria-label="Toggle theme">
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      <div className="um-stepper">
        <div className={`um-step-seg${step >= 1 ? ' active' : ''}`} />
        <div className={`um-step-seg${step >= 2 ? ' active' : ''}`} />
        <div className={`um-step-seg${step >= 3 ? ' active' : ''}`} />
      </div>
      <div className="um-step-label">
        <strong>Step {step} of 3</strong> — {step === 1 ? 'Core details' : step === 2 ? 'Session details' : 'Organiser & visibility'}
      </div>

      {/* ── Step 1 ─────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="um-form-body">

          {/* Official event toggle */}
          <div style={{ background: isOfficialEvent ? 'var(--um-accent-lt)' : 'var(--um-bg2)', border: `1px solid ${isOfficialEvent ? 'oklch(42% 0.14 30 / 0.5)' : 'var(--um-border-lt)'}`, borderRadius: 10, padding: '14px 16px' }}>
            <div className="um-toggle-row" style={{ padding: 0, border: 'none', minHeight: 'auto' }}>
              <div>
                <div className="um-toggle-name" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <VerifiedIcon />
                  Official race or registered event?
                </div>
                <div className="um-toggle-desc" style={{ marginTop: 4 }}>
                  Enable for marathons, sportives, registered races with external sign-up.
                </div>
              </div>
              <button
                className={`um-toggle ${isOfficialEvent ? 'on' : 'off'}`}
                onClick={() => setIsOfficialEvent(v => !v)}
                aria-label="Toggle official event"
              />
            </div>

            {isOfficialEvent && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, borderTop: '1px solid oklch(42% 0.14 30 / 0.3)' }}>
                {/* Flyer upload */}
                <div className="um-field">
                  <label className="um-field-label">Event flyer image</label>
                  {flyerImageUrl ? (
                    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', maxHeight: 180 }}>
                      <img src={flyerImageUrl} alt="Event flyer" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                      <button
                        onClick={() => setFlyerImageUrl('')}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <input ref={flyerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFlyerUpload} />
                      <button
                        className="um-btn um-btn-outline um-btn-full"
                        onClick={() => { if (!user) { alert('Sign in to upload a flyer.'); return; } flyerInputRef.current?.click(); }}
                        disabled={flyerUploading}
                      >
                        {flyerUploading ? 'Uploading…' : 'Upload flyer image'}
                      </button>
                    </>
                  )}
                </div>

                {/* Registration link */}
                <div className="um-field">
                  <label className="um-field-label">Registration link <span style={{ color: 'var(--um-text-4)', fontWeight: 400 }}>(required for official events)</span></label>
                  <input
                    className="um-input"
                    type="url"
                    placeholder="https://register.example.com"
                    value={registrationLink}
                    onChange={e => setRegistrationLink(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="um-field">
                    <label className="um-field-label">Reg. deadline</label>
                    <input className="um-input" type="date" value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} min={TODAY} />
                  </div>
                  <div className="um-field">
                    <label className="um-field-label">Entry fee</label>
                    <input className="um-input" placeholder="e.g. LKR 2500 or Free" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
                  </div>
                </div>

                <div className="um-field">
                  <label className="um-field-label">Event website <span style={{ color: 'var(--um-text-4)', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    className="um-input"
                    type="url"
                    placeholder="https://eventhome.com (optional)"
                    value={eventWebsite}
                    onChange={e => setEventWebsite(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="um-field">
            <label className="um-field-label">
              {isOfficialEvent ? 'Event name' : 'Session title'}
            </label>
            <input
              className="um-input"
              placeholder={isOfficialEvent ? 'e.g. Colombo Marathon 2026' : 'e.g. Colombo Coffee Loop'}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
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
              <input className="um-input" type="date" value={date} onChange={e => setDate(e.target.value)} min={TODAY} />
            </div>
            <div className="um-field">
              <label className="um-field-label">Start time</label>
              <input className="um-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="um-field">
            <label className="um-field-label">City / area</label>
            <select className="um-select" value={city} onChange={e => setCity(e.target.value)}>
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
              <option>Negombo</option>
              <option>Other</option>
            </select>
          </div>

          <div className="um-field">
            <label className="um-field-label">Start location</label>
            <LocationAutocomplete
              value={startLocation}
              onChange={v => { setStartLocation(v); if (startCoords) setStartCoords(null); }}
              onSelect={(name, coords) => { setStartLocation(name); setStartCoords(coords); }}
            />
            {startCoords && (
              <div style={{ fontSize: 11, color: 'var(--um-accent)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="#FC4C02" strokeWidth="1.2" />
                  <circle cx="5" cy="5" r="1.5" fill="#FC4C02" />
                </svg>
                Location pinned · {startCoords.lat.toFixed(4)}, {startCoords.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* Hide difficulty for official events */}
          {!isOfficialEvent && (
            <div className="um-field">
              <label className="um-field-label">Difficulty</label>
              <div className="um-diff-grid">
                {['Easy', 'Social', 'Moderate', 'Hard'].map(d => (
                  <button key={d} className={`um-diff-btn${difficulty === d ? ' sel' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>
                ))}
              </div>
            </div>
          )}
          {submitError && <div className="um-form-error">{submitError}</div>}
        </div>
      )}

      {/* ── Step 2 ─────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="um-form-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="um-field">
              <label className="um-field-label">Distance (km)</label>
              <input className="um-input" placeholder="42" value={distance} onChange={e => setDistance(e.target.value)} />
            </div>
            {/* Hide pace for official events */}
            {!isOfficialEvent && (
              <div className="um-field">
                <label className="um-field-label">Pace or avg speed</label>
                <input className="um-input" placeholder="5:30/km or 28 km/h" value={pace} onChange={e => setPace(e.target.value)} />
              </div>
            )}
          </div>
          <div className="um-field">
            <label className="um-field-label">Route link</label>
            <input className="um-input" placeholder="Strava, Komoot, or Google Maps (optional)" value={routeLink} onChange={e => setRouteLink(e.target.value)} />
          </div>
          {submitError && <div className="um-form-error">{submitError}</div>}
          <div style={{ borderTop: '1px solid var(--um-border-lt)', paddingTop: 6 }}>
            <div className="um-field-label" style={{ marginBottom: 4 }}>Tags</div>
            <p style={{ fontSize: 12, color: 'var(--um-text-4)', marginBottom: 14 }}>Helps athletes find and assess your {isOfficialEvent ? 'event' : 'session'}.</p>
            {[
              { label: 'Coffee stop',      sub: 'Ends at a café',          val: coffee,  set: setCoffee  },
              { label: 'No drop',          sub: 'No one gets left behind', val: nodrop,  set: setNodrop  },
              { label: 'Beginner friendly',sub: null,                       val: beginner,set: setBeginner},
              { label: 'Tourist friendly', sub: 'Open to visitors',        val: tourist, set: setTourist },
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

      {/* ── Step 3 ─────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="um-form-body">
          <div className="um-field">
            <label className="um-field-label">Organiser name or club</label>
            <input className="um-input" placeholder="e.g. Colombo Cycling Club" value={organiserName} onChange={e => setOrganiserName(e.target.value)} />
          </div>
          <div className="um-field">
            <label className="um-field-label">WhatsApp contact</label>
            <input className="um-input" placeholder="+94 77 000 0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>
          <div className="um-field">
            <label className="um-field-label">Strava club link</label>
            <input className="um-input" placeholder="strava.com/clubs/… (optional)" value={stravaLink} onChange={e => setStravaLink(e.target.value)} />
          </div>
          <div style={{ borderTop: '1px solid var(--um-border-lt)', paddingTop: 6 }}>
            <div className="um-field-label" style={{ marginBottom: 14 }}>Visibility</div>
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
            <select className="um-select" value={attendeeVis} onChange={e => setAttendeeVis(e.target.value)}>
              <option value="count_only">Show count only (recommended)</option>
              <option value="names">Show names</option>
              <option value="hidden">Hide attendee info</option>
            </select>
          </div>
          {submitError && <div className="um-form-error" style={{ marginTop: 8 }}>{submitError}</div>}
        </div>
      )}

      <div className="um-form-nav">
        {step > 1 && (
          <button className="um-btn um-btn-outline" style={{ flex: 1 }} onClick={() => { setStep(s => s - 1); setSubmitError(''); }}>Back</button>
        )}
        {step < 3 ? (
          <button
            className="um-btn um-btn-primary"
            style={{ flex: 2 }}
            onClick={() => {
              if (step === 1) {
                const err = !title.trim()
                  ? 'Please enter a title.'
                  : date < TODAY
                  ? 'Date must be today or in the future.'
                  : !startLocation.trim()
                  ? 'Please enter a start location.'
                  : null;
                if (err) { setSubmitError(err); return; }
                setSubmitError('');
              }
              setStep(s => s + 1);
            }}
          >
            Continue
          </button>
        ) : (
          <button
            className="um-btn um-btn-accent"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : editEventId ? 'Save changes' : isOfficialEvent ? 'Submit event' : 'Submit session'}
          </button>
        )}
      </div>
    </div>
  );
}
