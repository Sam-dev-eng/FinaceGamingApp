import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { LobbyPage } from './pages/LobbyPage';
import { GameScreen } from './pages/GameScreen';
import { SummaryPage } from './components/summary/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { JoinPage } from './pages/JoinPage';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/summary" element={<SummaryPage />} />

      </Routes>
    </Router>
  );
}

export default App;

