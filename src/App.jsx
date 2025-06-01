import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import CalendarView from './components/CalendarView';
import CalendarView_Embed from './components/CalendarView_Embed';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/classroom" element={<CalendarView />} />
        <Route path="/classroom_embed" element={<CalendarView_Embed />} />
      </Routes>
    </Router>
  );
}

export default App;