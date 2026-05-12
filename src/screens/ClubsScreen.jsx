import { useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useClubs, joinClub, leaveClub } from '../lib/useClubs';

const CITIES = ['All cities', 'Colombo', 'Kandy', 'Galle', 'Negombo', 'Other'];

function VerifiedBadge() {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'oklch(70% 0.14 148)', background:'oklch(70% 0.14 148 / 0.14)', border:'1px solid oklch(70% 0.14 148 / 0.3)', borderRadius:4, padding:'1px 6px' }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Verified
    </span>
  );
}

function ClubCard({ club, userMembership, user, onNavigate, onJoin, onLeave, joining }) {
  const isMember = !!userMembership;
  const slug = club.slug || club.id;

  return (
    <div className="um-club-card" onClick={() => onNavigate('clubdetail', null, slug)}>
      <div className="um-club-card-logo">
        {club.logo_url
          ? <img src={club.logo_url} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} />
          : <span style={{ fontSize:16, fontWeight:700, color:'var(--um-accent)' }}>{club.name?.slice(0,2).toUpperCase()}</span>
        }
      </div>
      <div className="um-club-card-body">
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:4 }}>
          <span className="um-club-card-name">{club.name}</span>
          {club.is_verified && <VerifiedBadge />}
        </div>
        <div className="um-club-card-meta">
          {club.city && <span>{club.city}</span>}
          {club.city && <span style={{ color:'var(--um-border)' }}>·</span>}
          <span>{club.memberCount ?? 0} member{club.memberCount !== 1 ? 's' : ''}</span>
        </div>
        {club.description && (
          <p className="um-club-card-desc">{club.description}</p>
        )}
      </div>
      <div className="um-club-card-action" onClick={e => e.stopPropagation()}>
        {isMember ? (
          <button
            className="um-btn um-btn-ghost um-btn-sm"
            style={{ whiteSpace:'nowrap' }}
            onClick={() => onLeave(club.id)}
            disabled={joining === club.id}
          >
            {joining === club.id ? '…' : 'Leave'}
          </button>
        ) : (
          <button
            className="um-btn um-btn-accent um-btn-sm"
            style={{ whiteSpace:'nowrap' }}
            onClick={() => user ? onJoin(club.id) : onNavigate('home')}
            disabled={joining === club.id}
          >
            {joining === club.id ? '…' : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
}

function ClubSkeleton() {
  return (
    <div className="um-club-card" style={{ opacity: 0.5 }}>
      <div className="um-club-card-logo" style={{ background: 'var(--um-bg2)' }} />
      <div className="um-club-card-body" style={{ gap: 8 }}>
        <div className="um-skeleton" style={{ height: 16, width: 140, borderRadius: 4 }} />
        <div className="um-skeleton" style={{ height: 12, width: 100, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function ClubsScreen({ onNavigate, goBack, currentScreen, darkMode, onToggleDark, user, onSignIn, onSignOut, isAdmin }) {
  const { clubs, loading, reload } = useClubs();
  const [city, setCity] = useState('All cities');
  const [search, setSearch] = useState('');
  const [joining, setJoining] = useState(null);
  const [memberSet, setMemberSet] = useState(new Set());

  const filtered = clubs.filter(c => {
    if (city !== 'All cities' && c.city !== city) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleJoin(clubId) {
    if (!user) { onSignIn?.(); return; }
    setJoining(clubId);
    const { error } = await joinClub(clubId, user.id);
    if (!error) setMemberSet(s => new Set([...s, clubId]));
    setJoining(null);
    reload();
  }

  async function handleLeave(clubId) {
    setJoining(clubId);
    await leaveClub(clubId, user?.id);
    setMemberSet(s => { const n = new Set(s); n.delete(clubId); return n; });
    setJoining(null);
    reload();
  }

  return (
    <div className="um-screen">
      <Nav onNavigate={onNavigate} goBack={goBack} currentScreen={currentScreen} darkMode={darkMode} onToggleDark={onToggleDark} user={user} onSignIn={onSignIn} onSignOut={onSignOut} isAdmin={isAdmin} />

      <div style={{ padding: '20px 16px 8px', borderBottom: '1px solid var(--um-border-lt)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:14 }}>
          <div>
            <h1 style={{ fontFamily:'var(--um-font-display)', fontSize:36, fontWeight:400, color:'var(--um-text)', letterSpacing:'0.02em', textTransform:'uppercase', lineHeight:1 }}>Clubs</h1>
            <p style={{ fontSize:13, color:'var(--um-text-4)', marginTop:4 }}>Find your community in Sri Lanka</p>
          </div>
          <button className="um-btn um-btn-accent um-btn-sm" style={{ flexShrink:0, marginTop:4 }} onClick={() => onNavigate('createclub')}>
            + Start a club
          </button>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input
            className="um-admin-search"
            placeholder="Search clubs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex:1, minWidth:160 }}
          />
          <select
            className="um-admin-filter-select"
            value={city}
            onChange={e => setCity(e.target.value)}
          >
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ padding:'8px 0 0' }}>
        {loading ? (
          [0,1,2,3].map(i => <ClubSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="um-empty" style={{ padding:'48px 24px' }}>
            <div className="um-empty-title">No clubs found</div>
            <div className="um-empty-sub">Be the first to start a club in your city.</div>
            <button className="um-btn um-btn-accent" style={{ marginTop:16 }} onClick={() => onNavigate('createclub')}>Start a club</button>
          </div>
        ) : (
          filtered.map(club => (
            <ClubCard
              key={club.id}
              club={club}
              userMembership={memberSet.has(club.id)}
              user={user}
              onNavigate={onNavigate}
              onJoin={handleJoin}
              onLeave={handleLeave}
              joining={joining}
            />
          ))
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
