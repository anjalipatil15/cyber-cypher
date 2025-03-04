import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SpeechRecognition from './components/SpeechRecognition';
import ChatAssistant from './components/ChatAssistant';
import ClientManagement from './components/ClientManagement';
import PropertyList from './components/PropertyList';
import { checkServerConnection, API_BASE_URL } from './utils/api';
import './App.css';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [serverStatus, setServerStatus] = useState({ checked: false, running: false });
  
  useEffect(() => {
    // Check if server is running
    const checkServer = async () => {
      const isRunning = await checkServerConnection();
      setServerStatus({ checked: true, running: isRunning });
    };
    
    checkServer();
    
    // Periodically check server status
    const interval = setInterval(checkServer, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Router>
      <div className="app-container">
        {serverStatus.checked && !serverStatus.running && (
          <div className="server-status-alert">
            <p>
              <strong>Warning:</strong> Backend server is not running or not accessible at {API_BASE_URL}.
              Chat and translation features will not work.
            </p>
          </div>
        )}
        
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
            <Link to="/properties" className="nav-link">Property Listings</Link> {/* Added Link */}
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
            <Route path="/properties" element={<PropertyList />} /> {/* Added Route */}
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
