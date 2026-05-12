import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import { useClub } from '../lib/useClubs';
import { supabase } from '../lib/supabase';
import { ToastContainer, makeToast } from '../components/Toast';

const PLATFORMS = ['instagram','strava','whatsapp','facebook','website','email','phone'];

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

export default function ClubManageScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, isAdmin, selectedClubSlug }) {
  const { club, loading, reload } = useClub(selectedClubSlug);
  const [tab, setTab] = useState('edit');
  const [toasts, setToasts] = useState([]);

  // Edit state
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [saving, setSaving] = useState(false);

  const addToast = (msg, type='success') => setToasts(t => [...t, makeToast(msg, type)]);
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    if (!club) return;
    setName(club.name || '');
    setCity(club.city || 'Colombo');
    setDescription(club.description || '');
    setHistory(club.history || '');
    setFoundedYear(club.founded_year ? String(club.founded_year) : '');
  }, [club]);

  // Access check
  const myMembership = club?.club_members?.find(m => m.user_id === user?.id);
  const isClubAdmin = myMembership?.role === 'admin' || myMembership?.role === 'founder' || isAdmin;

  if (loading) return <div className="um-screen"><div className="um-admin-empty" style={{ padding:'60px 24px' }}>Loading…</div></div>;

  if (!club || !isClubAdmin) {
    return (
      <div className="um-screen">
        <div className="um-empty" style={{ paddingTop:60 }}>
          <div className="um-empty-title">Access denied</div>
          <div className="um-empty-sub">Only club admins can manage this club.</div>
          <button className="um-btn um-btn-accent" style={{ marginTop:16 }} onClick={() => onNavigate('clubs')}>Back to clubs</button>
        </div>
      </div>
    );
  }

  async function saveProfile() {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from('clubs').update({
      name: name.trim(),
      city,
      description: description.trim() || null,
      history: history.trim() || null,
      founded_year: foundedYear ? parseInt(foundedYear) : null,
    }).eq('id', club.id);
    setSaving(false);
    if (error) addToast('Save failed: ' + error.message, 'error');
    else { addToast('Club updated.', 'success'); reload(); }
  }

  async function removeMember(memberId, displayName) {
    if (!supabase) return;
    if (!window.confirm(`Remove ${displayName} from the club?`)) return;
    await supabase.from('club_members').delete().eq('id', memberId);
    addToast('Member removed.', 'success');
    reload();
  }

  async function promoteToAdmin(memberId, currentRole) {
    if (!supabase) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    await supabase.from('club_members').update({ role: newRole }).eq('id', memberId);
    addToast(newRole === 'admin' ? 'Promoted to admin.' : 'Demoted to member.', 'success');
    reload();
  }

  async function addSocial(platform, value) {
    if (!supabase || !value.trim()) return;
    await supabase.from('club_socials').insert({ club_id: club.id, platform, handle_or_url: value.trim() });
    addToast('Social link added.', 'success');
    reload();
  }

  async function removeSocial(id) {
    if (!supabase) return;
    await supabase.from('club_socials').delete().eq('id', id);
    addToast('Removed.', 'success');
    reload();
  }

  const TABS = [
    { id: 'edit', label: 'Profile' },
    { id: 'members', label: `Members (${club.club_members?.length ?? 0})` },
    { id: 'socials', label: 'Social links' },
  ];

  return (
    <div className="um-screen">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="um-nav">
        <div className="um-nav-left">
          <button className="um-nav-back-btn" onClick={() => onNavigate('clubdetail', null, selectedClubSlug)} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="um-logo-btn">Manage: {club.name}</span>
        </div>
      </div>

      <div className="um-tabs" style={{ padding:'0 16px' }}>
        {TABS.map(t => (
          <button key={t.id} className={`um-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:'20px 16px 48px', maxWidth:560 }}>
        {/* Edit profile */}
        {tab === 'edit' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="um-field">
              <label className="um-field-label">Club name</label>
              <input className="um-input" value={name} onChange={e => setName(e.target.value)} />
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
              <textarea className="um-input" rows={3} style={{ resize:'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="um-field">
              <label className="um-field-label">Our story</label>
              <textarea className="um-input" rows={5} style={{ resize:'vertical' }} value={history} onChange={e => setHistory(e.target.value)} />
            </div>
            <button className="um-btn um-btn-accent um-btn-full" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <div>
            {club.club_members?.length === 0 && <div className="um-admin-empty">No members yet.</div>}
            {club.club_members?.map(m => {
              const displayName = m.profiles?.full_name || m.profiles?.email || m.user_id?.slice(0,8);
              const canModify = m.role !== 'founder' && (isAdmin || myMembership?.role === 'founder' || myMembership?.role === 'admin');
              return (
                <div key={m.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--um-border-lt)' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--um-accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700, flexShrink:0 }}>
                    {displayName?.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--um-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</div>
                    <div style={{ fontSize:11, color:'var(--um-text-4)', textTransform:'capitalize' }}>{m.role} · joined {fmtDate(m.joined_at)}</div>
                  </div>
                  {canModify && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="um-admin-btn" onClick={() => promoteToAdmin(m.id, m.role)} title={m.role === 'admin' ? 'Demote to member' : 'Make admin'}>
                        {m.role === 'admin' ? '↓ Demote' : '↑ Admin'}
                      </button>
                      <button className="um-admin-btn um-admin-btn-danger" onClick={() => removeMember(m.id, displayName)}>Remove</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Social links tab */}
        {tab === 'socials' && (
          <SocialsManager club={club} onAdd={addSocial} onRemove={removeSocial} />
        )}
      </div>
    </div>
  );
}

function SocialsManager({ club, onAdd, onRemove }) {
  const [platform, setPlatform] = useState('instagram');
  const [value, setValue] = useState('');

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div className="um-field-label" style={{ marginBottom:10 }}>Existing links</div>
        {club.club_socials?.length === 0 && <div style={{ fontSize:13, color:'var(--um-text-4)', marginBottom:16 }}>No social links yet.</div>}
        {club.club_socials?.map(s => (
          <div key={s.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--um-border-lt)' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--um-text-2)', textTransform:'capitalize', minWidth:80 }}>{s.platform}</span>
            <span style={{ flex:1, fontSize:12, color:'var(--um-text-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.handle_or_url}</span>
            <button className="um-admin-btn um-admin-btn-danger" onClick={() => onRemove(s.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="um-field-label" style={{ marginBottom:10 }}>Add link</div>
      <div style={{ display:'grid', gridTemplateColumns:'120px 1fr auto', gap:8, alignItems:'center' }}>
        <select className="um-select" style={{ padding:'10px 12px' }} value={platform} onChange={e => setPlatform(e.target.value)}>
          {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <input className="um-input" value={value} onChange={e => setValue(e.target.value)} placeholder="URL or handle" />
        <button className="um-btn um-btn-accent um-btn-sm" onClick={() => { onAdd(platform, value); setValue(''); }}>Add</button>
      </div>
    </div>
  );
}
