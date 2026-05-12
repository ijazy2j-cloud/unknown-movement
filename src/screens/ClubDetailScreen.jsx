import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useClub, joinClub, leaveClub } from '../lib/useClubs';
import { supabase } from '../lib/supabase';

const PLATFORM_ICONS = {
  instagram: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>,
  strava:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 21L9 10l4.5 10M7 15h5"/></svg>,
  whatsapp:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5A9 9 0 0 1 5.5 19.5L2 22l2.5-3.5A9 9 0 1 1 21 11.5z"/></svg>,
  facebook:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  website:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  email:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.61 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.74a16 16 0 0 0 5.35 5.35l.89-.89a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>,
};

function socialHref(platform, value) {
  if (!value) return '#';
  if (value.startsWith('http')) return value;
  if (platform === 'email') return `mailto:${value}`;
  if (platform === 'phone' || platform === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`;
  return value;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MemberChip({ member }) {
  const name = member.profiles?.full_name || member.profiles?.email?.split('@')[0] || 'Member';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'var(--um-bg2)', border:'1px solid var(--um-border-lt)', borderRadius:8 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--um-accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10, fontWeight:700, flexShrink:0 }}>
        {name.slice(0,2).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--um-text)' }}>{name}</div>
        <div style={{ fontSize:10, color:'var(--um-text-4)', textTransform:'capitalize' }}>{member.role}</div>
      </div>
    </div>
  );
}

export default function ClubDetailScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, isAdmin, selectedClubSlug }) {
  const { club, loading, reload } = useClub(selectedClubSlug);
  const [joining, setJoining] = useState(false);
  const [myMembership, setMyMembership] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);

  // Check user membership
  useEffect(() => {
    if (!user || !club || !supabase) return;
    supabase.from('club_members')
      .select('role, joined_at')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setMyMembership(data));
  }, [user, club]);

  // Fetch club's upcoming events
  useEffect(() => {
    if (!club?.id || !supabase) return;
    supabase.from('events')
      .select('id, title, date, time, city, type, status')
      .eq('hosting_club_id', club.id)
      .gte('date', new Date().toISOString().slice(0, 10))
      .neq('status', 'cancelled')
      .order('date')
      .limit(5)
      .then(({ data }) => setClubEvents(data || []));
  }, [club]);

  async function handleJoin() {
    if (!user) { onSignIn?.(); return; }
    setJoining(true);
    const { error } = await joinClub(club.id, user.id);
    if (!error) { await reload(); setMyMembership({ role: 'member', joined_at: new Date().toISOString() }); }
    setJoining(false);
  }

  async function handleLeave() {
    setJoining(true);
    await leaveClub(club.id, user.id);
    setMyMembership(null);
    await reload();
    setJoining(false);
  }

  const isClubAdmin = myMembership?.role === 'admin' || myMembership?.role === 'founder' || isAdmin;
  const memberCount = club?.club_members?.length ?? 0;

  if (loading) {
    return (
      <div className="um-screen">
        <Nav onNavigate={onNavigate} goBack={goBack} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} isAdmin={isAdmin} showBack goBack={goBack} />
        <div className="um-admin-empty" style={{ padding: '60px 24px' }}>Loading club…</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="um-screen">
        <Nav onNavigate={onNavigate} goBack={goBack} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} isAdmin={isAdmin} showBack />
        <div className="um-empty" style={{ paddingTop: 60 }}>
          <div className="um-empty-title">Club not found</div>
          <button className="um-btn um-btn-accent" style={{ marginTop: 16 }} onClick={() => onNavigate('clubs')}>Browse clubs</button>
        </div>
      </div>
    );
  }

  return (
    <div className="um-screen">
      <Nav onNavigate={onNavigate} goBack={goBack} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} isAdmin={isAdmin} showBack />

      {/* Cover hero */}
      <div className="um-club-cover">
        {club.cover_image_url
          ? <img src={club.cover_image_url} alt={`${club.name} cover`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg, var(--um-bg2) 0%, var(--um-border) 100%)' }} />
        }
        <div className="um-club-cover-overlay" />
      </div>

      {/* Club header */}
      <div className="um-club-header">
        <div className="um-club-logo-lg">
          {club.logo_url
            ? <img src={club.logo_url} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12 }} />
            : <span style={{ fontFamily:'var(--um-font-display)', fontSize:28, color:'white', letterSpacing:'0.05em' }}>{club.name?.slice(0,2).toUpperCase()}</span>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <h1 className="um-club-name">{club.name}</h1>
            {club.is_verified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:'oklch(70% 0.14 148)', background:'oklch(70% 0.14 148 / 0.14)', border:'1px solid oklch(70% 0.14 148 / 0.3)', borderRadius:4, padding:'2px 7px' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Verified
              </span>
            )}
          </div>
          <div style={{ fontSize:12, color:'var(--um-text-4)', marginTop:3 }}>
            {[club.city, club.founded_year && `Est. ${club.founded_year}`, `${memberCount} member${memberCount !== 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          {isClubAdmin && (
            <button className="um-btn um-btn-ghost um-btn-sm" onClick={() => onNavigate('clubmanage', null, selectedClubSlug)}>Manage</button>
          )}
          {myMembership ? (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'oklch(70% 0.14 148)', fontWeight:600 }}>✓ Member</div>
              <div style={{ fontSize:10, color:'var(--um-text-4)' }}>since {fmtDate(myMembership.joined_at)}</div>
              <button className="um-btn um-btn-ghost um-btn-sm" style={{ marginTop:4 }} onClick={handleLeave} disabled={joining}>
                {joining ? '…' : 'Leave club'}
              </button>
            </div>
          ) : (
            <button className="um-btn um-btn-accent" onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining…' : 'Join club'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {club.description && (
        <div className="um-section">
          <div className="um-section-hd">About</div>
          <p style={{ fontSize:14, color:'var(--um-text-2)', lineHeight:1.75 }}>{club.description}</p>
        </div>
      )}

      {/* History */}
      {club.history && (
        <div className="um-section">
          <div className="um-section-hd">Our story</div>
          <p style={{ fontSize:14, color:'var(--um-text-2)', lineHeight:1.75 }}>{club.history}</p>
        </div>
      )}

      {/* Key members */}
      {club.club_key_members?.length > 0 && (
        <div className="um-section">
          <div className="um-section-hd">Key contacts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
            {[...club.club_key_members].sort((a,b) => (a.display_order||0) - (b.display_order||0)).map(km => (
              <div key={km.id} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--um-bg2)', border:'1px solid var(--um-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--um-text-2)', flexShrink:0 }}>
                  {km.name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--um-text)' }}>{km.name}</div>
                  {km.role_title && <div style={{ fontSize:11, color:'var(--um-text-4)' }}>{km.role_title}</div>}
                  {km.contact && <div style={{ fontSize:11, color:'var(--um-accent)', marginTop:2 }}>{km.contact}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social links */}
      {club.club_socials?.length > 0 && (
        <div className="um-section">
          <div className="um-section-hd">Follow us</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
            {club.club_socials.map(s => (
              <a
                key={s.id}
                href={socialHref(s.platform, s.handle_or_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="um-footer-social-link"
                style={{ textTransform:'capitalize' }}
              >
                {PLATFORM_ICONS[s.platform] || null}
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {clubEvents.length > 0 && (
        <div className="um-section">
          <div className="um-section-hd">Upcoming sessions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
            {clubEvents.map(ev => (
              <div
                key={ev.id}
                style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--um-border-lt)', cursor:'pointer' }}
                onClick={() => onNavigate('detail', ev.id)}
              >
                <div style={{ minWidth:40, textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--um-font-display)', fontSize:24, color:'var(--um-text)', lineHeight:1 }}>{ev.date?.split('-')[2]}</div>
                  <div style={{ fontSize:9, color:'var(--um-text-4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(ev.date?.split('-')[1],10)-1]}</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--um-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:'var(--um-text-4)', marginTop:2 }}>{ev.city} · {ev.time}</div>
                </div>
                <span style={{ fontSize:10, color:'var(--um-accent)', fontWeight:600, textTransform:'capitalize' }}>{ev.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {club.club_members?.length > 0 && (
        <div className="um-section">
          <div className="um-section-hd">{memberCount} Member{memberCount !== 1 ? 's' : ''}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:8, marginTop:4 }}>
            {club.club_members.slice(0, 12).map(m => <MemberChip key={m.id} member={m} />)}
          </div>
          {memberCount > 12 && (
            <div style={{ fontSize:12, color:'var(--um-text-4)', marginTop:8 }}>+{memberCount - 12} more members</div>
          )}
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
