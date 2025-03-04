import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SpeechRecognition from './components/SpeechRecognition';
import ChatAssistant from './components/ChatAssistant';
import ClientManagement from './components/ClientManagement';
import './App.css';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container">
            <img src="/logo192.png" alt="Real Estate Assistant Logo" className="app-logo" />
            <h1>Real Estate Communication Assistant</h1>
          </div>
          <nav className="main-nav">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/speech" className="nav-link">Speech Recognition</Link>
            <Link to="/chat" className="nav-link">Chat Assistant</Link>
            <Link to="/clients" className="nav-link">Client Management</Link>
          </nav>
          <div className="language-selector">
            <select 
              value={currentLanguage} 
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="language-dropdown"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="te">Telugu</option>
            </select>
          </div>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard currentLanguage={currentLanguage} />} />
            <Route path="/speech" element={<SpeechRecognition currentLanguage={currentLanguage} />} />
            <Route path="/chat" element={<ChatAssistant currentLanguage={currentLanguage} />} />
            <Route path="/clients" element={<ClientManagement currentLanguage={currentLanguage} />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; 2025 Real Estate Communication Assistant</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;