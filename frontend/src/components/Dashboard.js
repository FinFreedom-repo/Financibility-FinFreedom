import React from 'react';
import '../styles/Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome to Financability</h1>
        <p className="welcome-message">
          Your personal financial management dashboard. Here you'll find tools and insights to help you achieve your financial goals.
        </p>
        <div className="notice-box">
          <h2>Ramsey Checklist</h2>
          <p>Coming soon! We're developing a comprehensive financial checklist based on Dave Ramsey's principles to help guide your financial journey.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 