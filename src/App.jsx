import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import DetailScreen from './screens/DetailScreen';
import SubmitScreen from './screens/SubmitScreen';
import MyEventsScreen from './screens/MyEventsScreen';
import AttendeesScreen from './screens/AttendeesScreen';
import AuthModal from './components/AuthModal';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [navHistory, setNavHistory] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('colombo-coffee-loop');
  const [attendeesEventId, setAttendeesEventId] = useState(null);
  const [editEventId, setEditEventId] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('um-theme');
    return saved ? saved === 'dark' : true;
  });

  const [savedEvents, setSavedEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('um-saved') || '[]'); }
    catch { return []; }
  });

  const [followedClubs, setFollowedClubs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('um-following') || '[]'); }
    catch { return []; }
  });

  const [enrolments, setEnrolments] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) { setEnrolments([]); return; }
    loadUserData(user.id);
  }, [user]);

  async function loadUserData(userId) {
    try {
      const [savesRes, followsRes, enrolRes] = await Promise.all([
        supabase.from('saves').select('event_id').eq('user_id', userId),
        supabase.from('follows').select('following_club_id').eq('follower_id', userId),
        supabase.from('enrolments').select('event_id').eq('user_id', userId),
      ]);
      if (savesRes.data?.length) setSavedEvents(savesRes.data.map(r => r.event_id));
      if (followsRes.data?.length) setFollowedClubs(followsRes.data.map(r => r.following_club_id).filter(Boolean));
      if (enrolRes.data) setEnrolments(enrolRes.data.map(r => r.event_id));
    } catch {}
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('um-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!user) localStorage.setItem('um-saved', JSON.stringify(savedEvents));
  }, [savedEvents, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('um-following', JSON.stringify(followedClubs));
  }, [followedClubs, user]);

  const navigate = (to, eventId = null) => {
    if (to === screen) return;
    setNavHistory(h => [...h, screen]);
    setScreen(to);
    if (eventId) setSelectedEventId(eventId);
  };

  const goBack = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory(h => h.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen('home');
    }
  };

  const requireAuth = (action) => {
    if (user) { action(); }
    else { setAuthOpen(true); }
  };

  const toggleDark = () => setDarkMode(d => !d);

  const toggleSave = async (eventId) => {
    const isSaved = savedEvents.includes(eventId);
    setSavedEvents(prev => isSaved ? prev.filter(id => id !== eventId) : [...prev, eventId]);
    if (supabase && user) {
      if (isSaved) {
        await supabase.from('saves').delete().eq('user_id', user.id).eq('event_id', eventId);
      } else {
        await supabase.from('saves').insert({ user_id: user.id, event_id: eventId }).select();
      }
    }
  };

  const toggleFollow = async (clubName) => {
    const isFollowing = followedClubs.includes(clubName);
    setFollowedClubs(prev => isFollowing ? prev.filter(n => n !== clubName) : [...prev, clubName]);
    if (supabase && user) {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_club_id', clubName);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_club_id: clubName });
      }
    }
  };

  const toggleEnrol = async (eventId) => {
    if (!user) { setAuthOpen(true); return false; }
    const isEnrolled = enrolments.includes(eventId);
    setEnrolments(prev => isEnrolled ? prev.filter(id => id !== eventId) : [...prev, eventId]);
    if (supabase) {
      if (isEnrolled) {
        await supabase.from('enrolments').delete().eq('user_id', user.id).eq('event_id', eventId);
      } else {
        await supabase.from('enrolments').insert({ event_id: eventId, user_id: user.id, user_email: user.email });
      }
    }
    return !isEnrolled;
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setEnrolments([]);
    setSavedEvents([]);
    setFollowedClubs([]);
  };

  const openAttendees = (eventId) => {
    setAttendeesEventId(eventId);
    setNavHistory(h => [...h, screen]);
    setScreen('attendees');
  };

  const openEditEvent = (eventId) => {
    setEditEventId(eventId);
    setNavHistory(h => [...h, screen]);
    setScreen('submit');
  };

  const sharedProps = {
    onNavigate: navigate,
    goBack,
    currentScreen: screen,
    darkMode,
    onToggleDark: toggleDark,
    savedEvents,
    onToggleSave: toggleSave,
    followedClubs,
    onToggleFollow: toggleFollow,
    selectedEventId,
    user,
    onRequireAuth: requireAuth,
    onSignIn: () => setAuthOpen(true),
    onSignOut: handleSignOut,
    enrolments,
    onToggleEnrol: toggleEnrol,
  };

  return (
    <>
      {screen === 'home'       && <HomeScreen     {...sharedProps} />}
      {screen === 'explore'    && <ExploreScreen  {...sharedProps} />}
      {screen === 'detail'     && <DetailScreen   {...sharedProps} />}
      {screen === 'submit'     && <SubmitScreen   {...sharedProps} editEventId={editEventId} onClearEdit={() => setEditEventId(null)} />}
      {screen === 'myevents'   && <MyEventsScreen {...sharedProps} onOpenAttendees={openAttendees} onEditEvent={openEditEvent} />}
      {screen === 'attendees'  && <AttendeesScreen {...sharedProps} attendeesEventId={attendeesEventId} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}
    </>
  );
}
