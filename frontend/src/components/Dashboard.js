import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

// Sample data - in a real app, this would come from your API/database
const sampleConversations = [
  { 
    id: 1, 
    clientName: "Aditya Sharma", 
    date: "2025-03-01T10:30:00", 
    languages: ["en", "hi"],
    keyTopics: ["3BHK", "Bandra", "Sea View", "₹2.5 Cr budget"],
    followUpDate: "2025-03-10",
    status: "interested"
  },
  { 
    id: 2, 
    clientName: "Priya Desai", 
    date: "2025-03-02T14:15:00", 
    languages: ["mr", "en"],
    keyTopics: ["Villa", "Pune Suburbs", "Gated Community", "₹1.8 Cr budget"],
    followUpDate: "2025-03-15",
    status: "highly_interested"
  },
  { 
    id: 3, 
    clientName: "Ravi Krishnan", 
    date: "2025-03-03T11:45:00", 
    languages: ["te", "en"],
    keyTopics: ["2BHK", "Hitech City", "Close to Metro", "₹1.2 Cr budget"],
    followUpDate: "2025-03-12",
    status: "viewing_scheduled"
  },
  { 
    id: 4, 
    clientName: "Sanjay Patil", 
    date: "2025-03-03T16:00:00", 
    languages: ["mr"],
    keyTopics: ["1BHK", "Andheri", "Furnished", "₹80 Lakh budget"],
    followUpDate: "2025-03-20",
    status: "new_inquiry"
  }
];

const sampleStatistics = {
  totalClients: 28,
  activeConversations: 12,
  newInquiriesThisWeek: 8,
  scheduledViewings: 5,
  highPriorityFollowups: 3,
  languageDistribution: [
    { language: "en", count: 28 },
    { language: "hi", count: 16 },
    { language: "mr", count: 9 },
    { language: "te", count: 4 }
  ],
  topKeywords: [
    { keyword: "3BHK", count: 14 },
    { keyword: "Sea View", count: 8 },
    { keyword: "Gated Community", count: 7 },
    { keyword: "Close to Metro", count: 6 },
    { keyword: "Furnished", count: 5 }
  ]
};

const Dashboard = ({ currentLanguage }) => {
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [statistics, setStatistics] = useState(sampleStatistics);
  
  useEffect(() => {
    // In a real app, you would fetch this data from your API/backend
    // For now, we'll use our sample data
    
    const today = new Date().toISOString().split('T')[0];
    
    // Set today's followups
    const todaysFollowups = sampleConversations.filter(
      conv => conv.followUpDate === today
    );
    setTodayFollowups(todaysFollowups);
    
    // Set upcoming followups
    const upcoming = sampleConversations.filter(
      conv => new Date(conv.followUpDate) > new Date(today)
    ).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
    setUpcomingFollowups(upcoming);
    
    // Set recent conversations
    const recent = [...sampleConversations].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ).slice(0, 5);
    setRecentConversations(recent);
    
  }, []);
  
  // Helper function to format date strings
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Helper to get language name
  const getLanguageName = (code) => {
    const languages = {
      en: "English",
      hi: "Hindi",
      mr: "Marathi",
      te: "Telugu"
    };
    return languages[code] || code;
  };
  
  // Helper for status labels and colors
  const getStatusInfo = (status) => {
    const statusInfo = {
      new_inquiry: { label: "New Inquiry", color: "blue" },
      interested: { label: "Interested", color: "purple" },
      highly_interested: { label: "Highly Interested", color: "green" },
      viewing_scheduled: { label: "Viewing Scheduled", color: "orange" },
      offer_made: { label: "Offer Made", color: "red" },
      closed: { label: "Closed", color: "gray" }
    };
    return statusInfo[status] || { label: status, color: "gray" };
  };
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Real Estate Communication Dashboard</h2>
        <div className="dashboard-actions">
          <Link to="/speech" className="action-button">
            New Conversation
          </Link>
          <Link to="/clients" className="action-button">
            Manage Clients
          </Link>
        </div>
      </div>
      
      {/* Quick stats section */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-value">{statistics.totalClients}</div>
          <div className="stat-label">Total Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{statistics.activeConversations}</div>
          <div className="stat-label">Active Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{statistics.newInquiriesThisWeek}</div>
          <div className="stat-label">New This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{statistics.scheduledViewings}</div>
          <div className="stat-label">Viewings Scheduled</div>
        </div>
        <div className="stat-card highlight-card">
          <div className="stat-value">{statistics.highPriorityFollowups}</div>
          <div className="stat-label">High Priority Followups</div>
        </div>
      </section>
      
      <div className="dashboard-grid">
        {/* Today's followups */}
        <section className="dashboard-section followups-today">
          <h3>Today's Follow-ups</h3>
          {todayFollowups.length === 0 ? (
            <p className="no-data-message">No follow-ups scheduled for today</p>
          ) : (
            <ul className="followup-list">
              {todayFollowups.map(followup => (
                <li key={followup.id} className="followup-item">
                  <div className="followup-client">{followup.clientName}</div>
                  <div className="followup-tags">
                    {followup.languages.map(lang => (
                      <span key={lang} className="language-tag">
                        {getLanguageName(lang)}
                      </span>
                    ))}
                    <span 
                      className="status-tag" 
                      style={{ backgroundColor: getStatusInfo(followup.status).color }}
                    >
                      {getStatusInfo(followup.status).label}
                    </span>
                  </div>
                  <div className="followup-topics">
                    {followup.keyTopics.join(" • ")}
                  </div>
                  <div className="followup-actions">
                    <button className="action-btn call-btn">Call</button>
                    <button className="action-btn message-btn">Message</button>
                    <button className="action-btn reschedule-btn">Reschedule</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        
        {/* Language distribution */}
        <section className="dashboard-section language-stats">
          <h3>Language Distribution</h3>
          <div className="language-chart">
            {statistics.languageDistribution.map(langStat => (
              <div key={langStat.language} className="chart-bar-container">
                <div className="chart-label">{getLanguageName(langStat.language)}</div>
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar"
                    style={{ 
                      width: `${(langStat.count / statistics.totalClients) * 100}%`,
                      backgroundColor: 
                        langStat.language === "en" ? "#4285F4" :
                        langStat.language === "hi" ? "#EA4335" :
                        langStat.language === "mr" ? "#FBBC05" : "#34A853"
                    }}
                  ></div>
                  <span className="chart-value">{langStat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Recent conversations */}
        <section className="dashboard-section recent-conversations">
          <h3>Recent Conversations</h3>
          <div className="conversation-list">
            {recentConversations.map(conv => (
              <div key={conv.id} className="conversation-card">
                <div className="conversation-header">
                  <div className="client-name">{conv.clientName}</div>
                  <div 
                    className="conversation-status"
                    style={{ color: getStatusInfo(conv.status).color }}
                  >
                    {getStatusInfo(conv.status).label}
                  </div>
                </div>
                <div className="conversation-date">
                  {new Date(conv.date).toLocaleString()}
                </div>
                <div className="conversation-languages">
                  {conv.languages.map(lang => (
                    <span key={lang} className="language-tag">
                      {getLanguageName(lang)}
                    </span>
                  ))}
                </div>
                <div className="conversation-topics">
                  {conv.keyTopics.map((topic, index) => (
                    <span key={index} className="topic-tag">{topic}</span>
                  ))}
                </div>
                <div className="conversation-footer">
                  <span className="followup-date">
                    Follow-up: {formatDate(conv.followUpDate)}
                  </span>
                  <div className="conversation-actions">
                    <button className="icon-btn view-btn" title="View Details">👁️</button>
                    <button className="icon-btn notes-btn" title="Add Notes">📝</button>
                    <button className="icon-btn share-btn" title="Share">🔗</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Top keywords */}
        <section className="dashboard-section top-keywords">
          <h3>Trending Keywords</h3>
          <div className="keywords-cloud">
            {statistics.topKeywords.map(keywordStat => (
              <div key={keywordStat.keyword} 
                className="keyword-tag"
                style={{ 
                  fontSize: `${Math.max(1, Math.min(2, 1 + (keywordStat.count / 10)))}rem`,
                  opacity: Math.max(0.6, Math.min(1, keywordStat.count / 15))
                }}
              >
                {keywordStat.keyword}
                <span className="keyword-count">{keywordStat.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;