import { useState, useEffect } from 'react';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import DetailScreen from './screens/DetailScreen';
import SubmitScreen from './screens/SubmitScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [navHistory, setNavHistory] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('colombo-coffee-loop');

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('um-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('um-saved', JSON.stringify(savedEvents));
  }, [savedEvents]);

  useEffect(() => {
    localStorage.setItem('um-following', JSON.stringify(followedClubs));
  }, [followedClubs]);

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

  const toggleDark = () => setDarkMode(d => !d);

  const toggleSave = (eventId) => {
    setSavedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleFollow = (clubName) => {
    setFollowedClubs(prev =>
      prev.includes(clubName) ? prev.filter(n => n !== clubName) : [...prev, clubName]
    );
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
  };

  return (
    <>
      {screen === 'home'    && <HomeScreen    {...sharedProps} />}
      {screen === 'explore' && <ExploreScreen {...sharedProps} />}
      {screen === 'detail'  && <DetailScreen  {...sharedProps} />}
      {screen === 'submit'  && <SubmitScreen  {...sharedProps} />}
    </>
  );
}
