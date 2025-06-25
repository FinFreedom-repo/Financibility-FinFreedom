import React from 'react';
import '../styles/Dashboard.css';

function Dashboard() {
  const babySteps = [
    {
      id: 1,
      title: "Save $1,000 for your starter emergency fund",
      description: "This is your first step to financial security."
    },
    {
      id: 2,
      title: "Pay off all debt (except the house) using the debt snowball",
      description: "List your debts from smallest to largest and attack them one by one."
    },
    {
      id: 3,
      title: "Save 3-6 months of expenses in a fully funded emergency fund",
      description: "This is your complete emergency fund."
    },
    {
      id: 4,
      title: "Invest 15% of your household income in retirement",
      description: "Focus on tax-advantaged retirement accounts."
    },
    {
      id: 5,
      title: "Save for your children's college fund",
      description: "Start saving for your children's education."
    },
    {
      id: 6,
      title: "Pay off your home early",
      description: "Work on becoming completely debt-free."
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="baby-steps-section">
            <h2>Financial Planning Checklist</h2>
            <div className="baby-steps-list">
              {babySteps.map((step) => (
                <div key={step.id} className="baby-step-item">
                  <div className="step-header">
                    <span className="step-number">Step {step.id}</span>
                  </div>
                  <div className="step-title-row">
                    <h3>{step.title}</h3>
                    <span className="step-status">❌</span>
                  </div>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-main">
            <div className="welcome-section">
              <h1>Welcome to Financability! 👋</h1>
              <div className="welcome-content">
                <p className="welcome-message">
                  Your personal financial management dashboard is here to help you take control of your money and build a secure financial future. 
                  This is your command center for tracking accounts, managing debts, creating budgets, and planning your path to financial freedom.
                </p>
                
                <div className="dashboard-features">
                  <h3>What you can do here:</h3>
                  <ul>
                    <li>📊 <strong>Track Accounts & Debts:</strong> Get a complete picture of your financial situation</li>
                    <li>💰 <strong>Monthly Budgeting:</strong> Create and stick to realistic spending plans</li>
                    <li>📈 <strong>Expense Analysis:</strong> Understand where your money goes</li>
                    <li>🎯 <strong>Debt Planning:</strong> Create strategies to eliminate debt faster</li>
                    <li>🚀 <strong>Wealth Projection:</strong> See your financial future with different scenarios</li>
                  </ul>
                </div>

                <div className="first-steps-section">
                  <h3>🚀 Ready to get started?</h3>
                  <p>
                    The best way to begin your financial journey is to input your current accounts and debts. 
                    This gives us the foundation we need to provide personalized insights and recommendations.
                  </p>
                  <div className="cta-buttons">
                    <button className="cta-button primary">
                      📝 Add Your Accounts & Debts
                    </button>
                    <p className="cta-note">
                      This takes just a few minutes and will unlock all the dashboard features!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="notice-box">
              <h2>Financial Overview</h2>
              <p>Coming soon! We're developing a comprehensive financial overview to help you track your progress.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 