import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import '../styles/Dashboard.css';

function Dashboard() {
  const [financialSteps, setFinancialSteps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const babySteps = [
    {
      id: 1,
      title: "Save $2,000 for your starter emergency fund",
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

  useEffect(() => {
    fetchFinancialSteps();
  }, []);

  const fetchFinancialSteps = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/financial-steps/calculate/');
      setFinancialSteps(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial steps:', err);
      setError('Failed to load financial progress');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId) => {
    if (!financialSteps) return '❌';
    
    const currentStep = financialSteps.current_step;
    const stepProgress = financialSteps.step_progress;
    
    // If this step is completed (current step is higher)
    if (currentStep > stepId) {
      return '✅';
    }
    
    // If this is the current step and it's completed
    if (currentStep === stepId && stepProgress.completed) {
      return '✅';
    }
    
    // If this is the current step and it's in progress
    if (currentStep === stepId && !stepProgress.completed) {
      return '🔄';
    }
    
    // Future step
    return '❌';
  };

  const getStepProgress = (stepId) => {
    if (!financialSteps || financialSteps.current_step !== stepId) return null;
    
    const progress = financialSteps.step_progress;
    if (!progress || progress.completed) return null;
    
    return {
      progress: progress.progress || 0,
      current: progress.current_amount || progress.current_debt || progress.current_percent || 0,
      goal: progress.goal_amount || progress.goal_percent || progress.max_total_debt || 0,
      amount_paid_off: progress.amount_paid_off || 0,
      message: progress.message
    };
  };

  const renderStepProgress = (stepId) => {
    const progress = getStepProgress(stepId);
    if (!progress) return null;
    
    return (
      <div className="step-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {progress.message || `${Math.round(progress.progress)}% complete`}
          {stepId !== 2 && progress.current && progress.goal ? (
            <span> (${progress.current.toLocaleString()} / ${progress.goal.toLocaleString()})</span>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading your financial progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="baby-steps-section">
            <h2>Financial Planning Checklist</h2>
            {error && (
              <div className="error-message" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)', borderRadius: '4px', color: '#dc3545' }}>
                {error}
              </div>
            )}
            <div className="baby-steps-list">
              {babySteps.map((step) => (
                <div key={step.id} className="baby-step-item">
                  <div className="step-header">
                    <span className="step-number">Step {step.id}</span>
                  </div>
                  <div className="step-title-row">
                    <h3>{step.title}</h3>
                    <span className="step-status">{getStepStatus(step.id)}</span>
                  </div>
                  <p>{step.description}</p>
                  {renderStepProgress(step.id)}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 