/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing.js';
import Dashboard from './pages/Dashboard.js';
import ProfilePage from './pages/Profile.js';
import ShowcasePage from './pages/Showcase.js';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/u/:username" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}
