import { useState } from 'react';
import Nav from '../components/Nav';
import { supabase } from '../lib/supabase';
import { makeToast } from '../components/Toast';
import { ToastContainer } from '../components/Toast';

const PLATFORMS = ['instagram','strava','whatsapp','facebook','website','email','phone'];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

export default function CreateClubScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, isAdmin }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('Colombo');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [socials, setSocials] = useState([{ platform:'instagram', handle_or_url:'' }]);
  const [keyMembers, setKeyMembers] = useState([{ name:'', role_title:'', contact:'' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type='success') => setToasts(t => [...t, makeToast(msg, type)]);
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  function handleNameChange(v) {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  }

  async function handleImageUpload(e, kind) {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    e.target.value = '';
    kind === 'logo' ? setLogoUploading(true) : setCoverUploading(true);
    const ext = file.name.split('.').pop();
    const path = `clubs/${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('event-photos').upload(path, file, { contentType: file.type });
    if (error) { addToast('Upload failed: ' + error.message, 'error'); }
    else {
      const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(path);
      kind === 'logo' ? setLogoUrl(publicUrl) : setCoverUrl(publicUrl);
    }
    kind === 'logo' ? setLogoUploading(false) : setCoverUploading(false);
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Club name is required.'); return; }
    if (!slug.trim()) { setError('Slug is required.'); return; }
    if (!user) { onSignIn?.(); return; }
    if (!supabase) { setError('Database not configured.'); return; }

    setSubmitting(true); setError('');

    // Check slug uniqueness
    const { data: existing } = await supabase.from('clubs').select('id').eq('slug', slug).single();
    if (existing) { setError('That URL slug is already taken. Please choose another.'); setSubmitting(false); return; }

    // Insert club
    const { data: club, error: clubErr } = await supabase.from('clubs').insert({
      name: name.trim(),
      slug: slug.trim(),
      city,
      description: description.trim() || null,
      history: history.trim() || null,
      founded_year: foundedYear ? parseInt(foundedYear) : null,
      logo_url: logoUrl || null,
      cover_image_url: coverUrl || null,
      owner_id: user.id,
      is_verified: false,
    }).select().single();

    if (clubErr) { setError(clubErr.message); setSubmitting(false); return; }

    // Insert founder membership
    await supabase.from('club_members').insert({ club_id: club.id, user_id: user.id, role: 'founder' });

    // Insert social links
    const validSocials = socials.filter(s => s.handle_or_url.trim());
    if (validSocials.length) {
      await supabase.from('club_socials').insert(validSocials.map(s => ({ club_id: club.id, platform: s.platform, handle_or_url: s.handle_or_url.trim() })));
    }

    // Insert key members
    const validKms = keyMembers.filter(km => km.name.trim());
    if (validKms.length) {
      await supabase.from('club_key_members').insert(validKms.map((km, i) => ({ club_id: club.id, name: km.name.trim(), role_title: km.role_title.trim() || null, contact: km.contact.trim() || null, display_order: i })));
    }

    addToast('Club created! It will appear once a site admin verifies it.', 'success');
    setSubmitting(false);
    setTimeout(() => onNavigate('clubdetail', null, slug.trim()), 1200);
  }

  return (
    <div className="um-screen">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="um-nav">
        <div className="um-nav-left">
          <button className="um-nav-back-btn" onClick={goBack || (() => onNavigate('clubs'))} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="um-logo-btn">Start a club</span>
        </div>
      </div>

      <div style={{ padding:'20px 16px', maxWidth:560 }}>
        <p style={{ fontSize:13, color:'var(--um-text-4)', marginBottom:24, lineHeight:1.6 }}>
          Your club will be reviewed and verified by a site admin before appearing in the directory. You'll be set as the founder and can manage it from the club page.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Name + slug */}
          <div className="um-field">
            <label className="um-field-label">Club name *</label>
            <input className="um-input" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Colombo Cycling Club" />
          </div>
          <div className="um-field">
            <label className="um-field-label">URL slug * <span style={{ color:'var(--um-text-4)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>unknownmovement.app/clubs/<strong>{slug || 'your-slug'}</strong></span></label>
            <input className="um-input" value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="colombo-cycling-club" />
          </div>

          <div className="um-field">
            <label className="um-field-label">City</label>
            <select className="um-select" value={city} onChange={e => setCity(e.target.value)}>
              {['Colombo','Kandy','Galle','Negombo','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="um-field">
            <label className="um-field-label">Founded year</label>
            <input className="um-input" type="number" min="1900" max={new Date().getFullYear()} value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="e.g. 2018" />
          </div>

          <div className="um-field">
            <label className="um-field-label">Description</label>
            <textarea className="um-input" rows={3} style={{ resize:'vertical', minHeight:80 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description shown in the club directory…" />
          </div>

          <div className="um-field">
            <label className="um-field-label">Our story <span style={{ color:'var(--um-text-4)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
            <textarea className="um-input" rows={4} style={{ resize:'vertical', minHeight:96 }} value={history} onChange={e => setHistory(e.target.value)} placeholder="The longer story of your club — history, mission, what drives you…" />
          </div>

          {/* Images */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="um-field">
              <label className="um-field-label">Logo</label>
              {logoUrl
                ? <div style={{ position:'relative', borderRadius:8, overflow:'hidden', height:80 }}>
                    <img src={logoUrl} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setLogoUrl('')} style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:4, padding:'2px 6px', fontSize:11, cursor:'pointer' }}>×</button>
                  </div>
                : <label className="um-btn um-btn-outline um-btn-full" style={{ cursor:'pointer', fontSize:12 }}>
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageUpload(e,'logo')} />
                    {logoUploading ? 'Uploading…' : 'Upload logo'}
                  </label>
              }
            </div>
            <div className="um-field">
              <label className="um-field-label">Cover image</label>
              {coverUrl
                ? <div style={{ position:'relative', borderRadius:8, overflow:'hidden', height:80 }}>
                    <img src={coverUrl} alt="Cover" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => setCoverUrl('')} style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:4, padding:'2px 6px', fontSize:11, cursor:'pointer' }}>×</button>
                  </div>
                : <label className="um-btn um-btn-outline um-btn-full" style={{ cursor:'pointer', fontSize:12 }}>
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageUpload(e,'cover')} />
                    {coverUploading ? 'Uploading…' : 'Upload cover'}
                  </label>
              }
            </div>
          </div>

          {/* Social links */}
          <div>
            <div className="um-field-label" style={{ marginBottom:10 }}>Social links</div>
            {socials.map((s, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr 32px', gap:8, marginBottom:8, alignItems:'center' }}>
                <select className="um-select" style={{ padding:'10px 12px' }} value={s.platform} onChange={e => setSocials(arr => arr.map((x,j) => j===i ? {...x, platform: e.target.value} : x))}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
                <input className="um-input" placeholder="URL or handle" value={s.handle_or_url} onChange={e => setSocials(arr => arr.map((x,j) => j===i ? {...x, handle_or_url: e.target.value} : x))} />
                <button style={{ background:'none', border:'none', color:'var(--um-text-4)', cursor:'pointer', fontSize:18, lineHeight:1 }} onClick={() => setSocials(arr => arr.filter((_,j) => j!==i))}>×</button>
              </div>
            ))}
            <button className="um-btn um-btn-ghost um-btn-sm" onClick={() => setSocials(arr => [...arr, { platform:'instagram', handle_or_url:'' }])}>+ Add link</button>
          </div>

          {/* Key members */}
          <div>
            <div className="um-field-label" style={{ marginBottom:10 }}>Key contacts / members</div>
            {keyMembers.map((km, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12, padding:12, background:'var(--um-bg2)', borderRadius:8, border:'1px solid var(--um-border-lt)', position:'relative' }}>
                <button style={{ position:'absolute', top:8, right:8, background:'none', border:'none', color:'var(--um-text-4)', cursor:'pointer', fontSize:16 }} onClick={() => setKeyMembers(arr => arr.filter((_,j) => j!==i))}>×</button>
                <div className="um-field" style={{ gridColumn:'1/-1' }}>
                  <label className="um-field-label">Name</label>
                  <input className="um-input" value={km.name} onChange={e => setKeyMembers(arr => arr.map((x,j) => j===i ? {...x, name: e.target.value} : x))} placeholder="Full name" />
                </div>
                <div className="um-field">
                  <label className="um-field-label">Role title</label>
                  <input className="um-input" value={km.role_title} onChange={e => setKeyMembers(arr => arr.map((x,j) => j===i ? {...x, role_title: e.target.value} : x))} placeholder="e.g. Ride Leader" />
                </div>
                <div className="um-field">
                  <label className="um-field-label">Contact</label>
                  <input className="um-input" value={km.contact} onChange={e => setKeyMembers(arr => arr.map((x,j) => j===i ? {...x, contact: e.target.value} : x))} placeholder="WhatsApp or email" />
                </div>
              </div>
            ))}
            <button className="um-btn um-btn-ghost um-btn-sm" onClick={() => setKeyMembers(arr => [...arr, { name:'', role_title:'', contact:'' }])}>+ Add member</button>
          </div>

          {error && <div className="um-form-error">{error}</div>}

          <button className="um-btn um-btn-accent um-btn-full" onClick={handleSubmit} disabled={submitting || !user}>
            {!user ? 'Sign in to create a club' : submitting ? 'Creating…' : 'Create club'}
          </button>
        </div>
      </div>
    </div>
  );
}
