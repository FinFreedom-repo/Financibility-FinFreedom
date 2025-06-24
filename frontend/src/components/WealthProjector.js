import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import '../styles/WealthProjector.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function WealthProjector({ onNavigateToAccount }) {
  const [formData, setFormData] = useState({
    age: '25',
    startWealth: '0',
    debt: '0',
    debtInterest: '6',
    assetInterest: '10.5',
    inflation: '2.5',
    taxRate: '25',
    annualContributions: '1000',
    checkingInterest: '4',
    maxAge: '85'
  });

  const [showChart, setShowChart] = useState(false);
  const [projectionData, setProjectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [netSavingsData, setNetSavingsData] = useState(null);

  // Load all user data on component mount
  useEffect(() => {
    loadAllUserData();
  }, []);

  // Refresh data when component becomes visible again (e.g., after profile update)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && dataLoaded) {
        console.log('Component became visible, refreshing data...');
        loadAllUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dataLoaded]);

  // Log form data changes for debugging
  useEffect(() => {
    if (dataLoaded) {
      console.log('Form data updated:', formData);
    }
  }, [formData, dataLoaded]);

  // Monitor formData changes specifically
  useEffect(() => {
    console.log('formData state changed:', formData);
  }, [formData]);

  const loadAllUserData = async () => {
    try {
      setDataLoading(true);
      console.log('Loading user data...');
      
      // Load user profile data
      const profileResponse = await axios.get('/api/profile/me/');
      console.log('Profile data loaded:', profileResponse.data);
      setUserProfile(profileResponse.data);

      // Load budget data
      const budgetResponse = await axios.get('/api/budgets/');
      const budget = budgetResponse.data[0];
      console.log('Budget data loaded:', budget);
      setBudgetData(budget);

      // Load net savings calculation from backend
      const netSavingsResponse = await axios.get('/api/net-savings/');
      const netSavingsData = netSavingsResponse.data;
      console.log('Net savings data loaded:', netSavingsData);

      // Load accounts and debts data
      const accountsDebtsData = await accountsDebtsService.getAccountsDebtsSummary();
      console.log('Accounts and debts data loaded:', accountsDebtsData);
      
      // Calculate totals and weighted averages
      const totalAssets = (accountsDebtsData.accounts || []).reduce((sum, account) => sum + parseFloat(account.balance), 0);
      const totalDebts = (accountsDebtsData.debts || []).reduce((sum, debt) => sum + parseFloat(debt.balance), 0);
      
      console.log('Calculated totals - Assets:', totalAssets, 'Debts:', totalDebts);
      console.log('Accounts array:', accountsDebtsData.accounts);
      console.log('Debts array:', accountsDebtsData.debts);
      
      // Calculate weighted average asset interest rate (excluding checking accounts)
      let weightedAssetInterest = 0;
      let totalInvestmentAssets = 0;
      if (totalAssets > 0) {
        // Filter out checking accounts for the main asset interest calculation
        const investmentAccounts = (accountsDebtsData.accounts || []).filter(acc => acc.account_type !== 'checking');
        totalInvestmentAssets = investmentAccounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
        
        if (totalInvestmentAssets > 0) {
          const assetInterestSum = investmentAccounts.reduce((sum, account) => {
            return sum + (parseFloat(account.balance) * parseFloat(account.interest_rate));
          }, 0);
          weightedAssetInterest = assetInterestSum / totalInvestmentAssets;
        }
      }
      
      // Calculate weighted average debt interest rate
      let weightedDebtInterest = 0;
      if (totalDebts > 0) {
        const debtInterestSum = (accountsDebtsData.debts || []).reduce((sum, debt) => {
          return sum + (parseFloat(debt.balance) * parseFloat(debt.interest_rate));
        }, 0);
        weightedDebtInterest = debtInterestSum / totalDebts;
      }
      
      // Calculate net worth
      const netWorth = totalAssets - totalDebts;
      
      // Prepare new form data
      const newFormData = {
        age: profileResponse.data.age ? profileResponse.data.age.toString() : '25',
        startWealth: totalAssets.toString(),
        debt: totalDebts.toString(),
        debtInterest: weightedDebtInterest.toFixed(2),
        assetInterest: '10.5', // Historical market average
        annualContributions: netSavingsData.annual_contributions.toString(), // From backend calculation
        inflation: '2.5',
        taxRate: '25',
        maxAge: '85',
        // Use checking account rate if available, otherwise default
        checkingInterest: (accountsDebtsData.accounts || []).find(acc => acc.account_type === 'checking')?.interest_rate || '4'
      };
      
      console.log('Setting form data with:', newFormData);
      console.log('User profile data:', profileResponse.data);
      console.log('Age from profile:', profileResponse.data.age);
      console.log('Net worth calculation:', { totalAssets, totalDebts, netWorth });
      console.log('Net savings breakdown:', netSavingsData.breakdown);
      
      // Update form data with all calculated values
      setFormData(newFormData);
      
      setDataLoaded(true);
      setDataLoading(false);
      setNetSavingsData(netSavingsData);
      console.log('Data loading completed successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setDataLoaded(true); // Still mark as loaded so user can proceed
      setDataLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/project-wealth/', formData);
      setProjectionData(response.data);
      setShowChart(true);
    } catch (err) {
      setError('Failed to calculate projection. Please try again.');
      setShowChart(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getChartData = () => {
    if (!projectionData) return null;

    const ages = projectionData.projections.map(p => p.age);
    const wealth = projectionData.projections.map(p => p.wealth);
    const debt = projectionData.projections.map(p => p.debt);
    const adjustedNetWorth = projectionData.projections.map(p => p.adjusted_net_worth);
    const checkingWealth = projectionData.projections.map(p => p.checking_wealth);
    const adjustedCheckingWealth = projectionData.projections.map(p => p.adjusted_checking_wealth);

    return {
      labels: ages,
      datasets: [
        {
          label: 'Net Worth',
          data: wealth,
          borderColor: '#1a237e',
          backgroundColor: 'rgba(26, 35, 126, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#1a237e',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Checking Account',
          data: checkingWealth,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#2196f3',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Checking Account (Infl. Adj.)',
          data: adjustedCheckingWealth,
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(0, 188, 212, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#00bcd4',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Net Worth (Infl. Adj.)',
          data: adjustedNetWorth,
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ff9800',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Debt',
          data: debt,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#f44336',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1a237e',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 35, 126, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        callbacks: {
          title: function(context) {
            return `Age: ${context[0].label}`;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Age',
          color: '#666',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        min: parseInt(formData.age),
        max: parseInt(formData.maxAge)
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          callback: function(value) {
            return formatCurrency(value);
          }
        },
        title: {
          display: true,
          text: 'Amount ($)',
          color: '#666',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div className="wealth-projector">
      <div className="wealth-header">
        <h2>Wealth Projector</h2>
        <p className="default-values-note">Default values are automatically loaded from your profile, accounts, debts, and budget</p>
        {dataLoading ? (
          <div className="data-loading-indicator">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading your financial data...</span>
          </div>
        ) : dataLoaded && (
          <div className="data-loaded-indicator">
            <div className="data-summary">
              <span className="indicator-text">✓ Data loaded:</span>
              <ul className="data-details">
                {userProfile?.age ? (
                  <li>Age: {userProfile.age}</li>
                ) : (
                  <li>Age: Not set in profile (using default: 25)</li>
                )}
                {budgetData && <li>Budget: Income ${netSavingsData?.breakdown?.total_income?.toLocaleString() || 0}, Net Savings ${(parseFloat(formData.annualContributions) / 12).toLocaleString()}/month</li>}
                <li>Net Worth: ${parseFloat(formData.startWealth).toLocaleString()}</li>
                <li>Debts: ${parseFloat(formData.debt).toLocaleString()} at {formData.debtInterest}% avg</li>
                <li>Annual Contributions: ${parseFloat(formData.annualContributions).toLocaleString()}</li>
              </ul>
            </div>
            <button 
              className="refresh-data-button"
              onClick={loadAllUserData}
              disabled={isLoading}
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
      <div className="wealth-projector-container">
        <div className="wealth-form-container">
          <form onSubmit={handleSubmit} className="wealth-form">
            <div className="form-group">
              <label htmlFor="age">Current Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                required
              />
              {userProfile?.age ? (
                <small className="data-source">From your profile</small>
              ) : (
                <div className="age-warning">
                  <small className="data-source-warning">⚠️ Age not set in profile - please update your profile or enter manually</small>
                  {onNavigateToAccount && (
                    <button 
                      type="button" 
                      className="update-profile-button"
                      onClick={onNavigateToAccount}
                    >
                      Update Profile
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="maxAge">Max Age</label>
              <input
                type="number"
                id="maxAge"
                name="maxAge"
                value={formData.maxAge}
                onChange={handleChange}
                placeholder="Enter max age"
                min={parseInt(formData.age) + 1}
                max="120"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startWealth">Net Worth</label>
              <input
                type="number"
                id="startWealth"
                name="startWealth"
                value={formData.startWealth}
                onChange={handleChange}
                placeholder="Enter starting amount"
                required
              />
              <small className="data-source">Calculated from your accounts</small>
            </div>

            <div className="form-group">
              <label htmlFor="debt">Total Debt</label>
              <input
                type="number"
                id="debt"
                name="debt"
                value={formData.debt}
                onChange={handleChange}
                placeholder="Enter total debt"
                required
              />
              <small className="data-source">From your debt accounts</small>
            </div>

            <div className="form-group">
              <label htmlFor="debtInterest">Debt Interest Rate (Avg)</label>
              <input
                type="number"
                id="debtInterest"
                name="debtInterest"
                value={formData.debtInterest}
                onChange={handleChange}
                placeholder="Enter interest rate"
                step="0.01"
                required
              />
              <small className="data-source">Weighted average from your debts</small>
            </div>

            <div className="form-group">
              <label htmlFor="assetInterest">Investment Interest Rate (Historical Market Average)</label>
              <input
                type="number"
                id="assetInterest"
                name="assetInterest"
                value={formData.assetInterest}
                onChange={handleChange}
                placeholder="Enter interest rate"
                step="0.01"
                required
              />
              <small className="data-source">Historical S&P 500 average return (10.5%)</small>
            </div>

            <div className="form-group">
              <label htmlFor="inflation">Expected Inflation Rate (%)</label>
              <input
                type="number"
                id="inflation"
                name="inflation"
                value={formData.inflation}
                onChange={handleChange}
                placeholder="Enter inflation rate"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="taxRate">Tax Rate (%)</label>
              <input
                type="number"
                id="taxRate"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                placeholder="Enter tax rate"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="annualContributions">Annual Contributions</label>
              <input
                type="number"
                id="annualContributions"
                name="annualContributions"
                value={formData.annualContributions}
                onChange={handleChange}
                placeholder="Enter annual amount"
                required
              />
              <small className="data-source">Based on your budget net savings (monthly × 12)</small>
            </div>

            <div className="form-group">
              <label htmlFor="checkingInterest">Checking Account Interest Rate (%)</label>
              <input
                type="number"
                id="checkingInterest"
                name="checkingInterest"
                value={formData.checkingInterest}
                onChange={handleChange}
                placeholder="Enter interest rate"
                step="0.01"
                required
              />
              <small className="data-source">From your checking account (used for checking account projections)</small>
            </div>

            <button 
              type="submit" 
              className="simulate-button"
              disabled={isLoading}
            >
              {isLoading ? 'Calculating...' : 'Simulate'}
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
        <div className="wealth-chart-container">
          {isLoading ? (
            <div className="chart-placeholder">
              Calculating your wealth projection...
            </div>
          ) : showChart && projectionData ? (
            <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
              <Line options={chartOptions} data={getChartData()} />
            </div>
          ) : (
            <div className="chart-placeholder">
              Enter your financial data and click Simulate to see the projection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WealthProjector; 