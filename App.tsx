
import React from 'react';
// FIX: Replaced Switch with Routes for react-router-dom v6 compatibility.
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
// FIX: The Dashboard component is a named export, not a default export.
import { Dashboard } from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerProfilePage from './pages/PlayerProfilePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      {/* FIX: Replaced Switch with Routes and component prop with element prop for v6 compatibility. */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/player-dashboard" element={<PlayerDashboard />} />
        <Route path="/player/:playerId" element={<PlayerProfilePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  );
};

export default App;