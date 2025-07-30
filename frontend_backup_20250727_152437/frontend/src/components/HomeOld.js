import React from 'react';
import { Link } from 'react-router-dom';
import USAFlag from './USAFlag';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home">
      <div className="home-header">
        <div className="home-header-content">
          <h1 className="home-title">FinFreedom <USAFlag /></h1>
          <p className="home-subtitle">Your Path to Financial Freedom</p>
        </div>
        <div className="home-auth-buttons">
          <Link to="/login" className="login-button">Login</Link>
          <Link to="/register" className="register-button">Get Started</Link>
        </div>
      </div>

      <div className="home-hero">
        <div className="hero-content">
          <h2>Take Control of Your Financial Future</h2>
          <p>
            FinFreedom 🇺🇸 provides a comprehensive suite of tools to help you build wealth, 
            eliminate debt, and achieve true financial independence. Start your journey today
            with our proven strategies and personalized insights.
          </p>
          <Link to="/register" className="cta-button">Start Your Journey</Link>
        </div>
        <div className="hero-visual">
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Wealth Projection</h3>
              <p>See your financial future with AI-powered wealth projections</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Debt Planning</h3>
              <p>Optimize debt payoff with snowball or avalanche strategies</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Budget Management</h3>
              <p>Track income, expenses, and savings goals in one place</p>
            </div>
          </div>
        </div>
      </div>

      <div className="home-features">
        <h2>Everything You Need for Financial Success</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">🎯</div>
            <h3>Goal Setting</h3>
            <p>Set and track financial goals with personalized roadmaps</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📈</div>
            <h3>Investment Planning</h3>
            <p>Plan your investment strategy with historical market data</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔍</div>
            <h3>Expense Analysis</h3>
            <p>AI-powered expense categorization and insights</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📱</div>
            <h3>Real-time Tracking</h3>
            <p>Monitor your progress with live financial data</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🛡️</div>
            <h3>Secure & Private</h3>
            <p>Bank-level security to protect your financial information</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎓</div>
            <h3>Financial Education</h3>
            <p>Learn financial concepts with built-in educational resources</p>
          </div>
        </div>
      </div>

      <div className="home-how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect Your Accounts</h3>
            <p>Securely link your bank accounts, credit cards, and investment accounts</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Set Your Goals</h3>
            <p>Define your financial objectives and timeline for achieving them</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Your Roadmap</h3>
            <p>Receive a personalized step-by-step plan to financial freedom</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Track & Optimize</h3>
            <p>Monitor your progress and adjust your strategy as needed</p>
          </div>
        </div>
      </div>

      <div className="home-cta">
        <div className="cta-content">
          <h2>Ready to Start Your Financial Journey?</h2>
          <p>Join thousands of users who are taking control of their financial future</p>
          <Link to="/register" className="cta-button-large">Get Started Free</Link>
        </div>
      </div>

      <div className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>FinFreedom 🇺🇸</h4>
            <p>Your roadmap to financial freedom</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Wealth Projection</li>
              <li>Debt Planning</li>
              <li>Budget Management</li>
              <li>Expense Analysis</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 FinFreedom 🇺🇸. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Home; 