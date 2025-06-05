import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import CalendarView from './components/CalendarView';
import CalendarView_Embed from './components/CalendarView_Embed';
import Equipment_Wrapper from './components/equipment/Equipment_Wrapper';
import Equipment_Wrapper_Embed from './components/equipment/Equipment_Wrapper_Embed';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/classroom" element={<CalendarView />} />
        <Route path="/classroom_embed" element={<CalendarView_Embed />} />
        <Route path="/equipment" element={<Equipment_Wrapper />} />
        <Route path="/equipment_embed" element={<Equipment_Wrapper_Embed />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;