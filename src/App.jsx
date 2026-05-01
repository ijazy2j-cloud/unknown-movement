import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import DetailScreen from './screens/DetailScreen';
import SubmitScreen from './screens/SubmitScreen';

export default function App() {
  const [screen, setScreen] = useState('home');

  const navigate = (to) => setScreen(to);

  return (
    <>
      {screen === 'home'    && <HomeScreen    onNavigate={navigate} />}
      {screen === 'explore' && <ExploreScreen onNavigate={navigate} />}
      {screen === 'detail'  && <DetailScreen  onNavigate={navigate} />}
      {screen === 'submit'  && <SubmitScreen  onNavigate={navigate} />}
    </>
  );
}
