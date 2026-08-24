import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { LobbyPage } from './pages/LobbyPage';
import { GameScreen } from './pages/GameScreen';
import { SummaryPage } from './components/summary/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { HostPage } from './pages/HostPage';
import { JoinPage } from './pages/JoinPage';
import { WatchPage } from './pages/WatchPage';
import { CaseStudyPage } from './pages/CaseStudyPage';
import { GameRoomSync } from './components/GameRoomSync';
function App() {
  return (
    <Router>
      <GameRoomSync />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/watch" element={<WatchPage />} />
        <Route path="/case-study" element={<CaseStudyPage />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/summary" element={<SummaryPage />} />

      </Routes>
    </Router>
  );
}

export default App;

