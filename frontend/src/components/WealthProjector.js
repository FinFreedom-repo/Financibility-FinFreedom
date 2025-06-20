import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
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

function WealthProjector() {
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
    maxAge: '100'
  });

  const [showChart, setShowChart] = useState(false);
  const [projectionData, setProjectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load accounts and debts data on component mount
  useEffect(() => {
    loadAccountsDebtsData();
  }, []);

  const loadAccountsDebtsData = async () => {
    try {
      const data = await accountsDebtsService.getAccountsDebtsSummary();
      
      // Calculate totals and weighted averages
      const totalAssets = (data.accounts || []).reduce((sum, account) => sum + parseFloat(account.balance), 0);
      const totalDebts = (data.debts || []).reduce((sum, debt) => sum + parseFloat(debt.balance), 0);
      
      // Calculate weighted average asset interest rate
      let weightedAssetInterest = 0;
      if (totalAssets > 0) {
        const assetInterestSum = (data.accounts || []).reduce((sum, account) => {
          return sum + (parseFloat(account.balance) * parseFloat(account.interest_rate));
        }, 0);
        weightedAssetInterest = assetInterestSum / totalAssets;
      }
      
      // Calculate weighted average debt interest rate
      let weightedDebtInterest = 0;
      if (totalDebts > 0) {
        const debtInterestSum = (data.debts || []).reduce((sum, debt) => {
          return sum + (parseFloat(debt.balance) * parseFloat(debt.interest_rate));
        }, 0);
        weightedDebtInterest = debtInterestSum / totalDebts;
      }
      
      // Calculate net worth
      const netWorth = totalAssets - totalDebts;
      
      // Update form data with calculated values
      setFormData(prevData => ({
        ...prevData,
        startWealth: netWorth.toString(),
        debt: totalDebts.toString(),
        debtInterest: weightedDebtInterest.toFixed(2),
        assetInterest: weightedAssetInterest.toFixed(2),
        // Use checking account rate if available, otherwise default
        checkingInterest: (data.accounts || []).find(acc => acc.account_type === 'checking')?.interest_rate || '4'
      }));
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading accounts and debts data:', error);
      setDataLoaded(true); // Still mark as loaded so user can proceed
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
          label: 'Total Wealth',
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
        <p className="default-values-note">Default values are based on historical averages and typical scenarios</p>
        {dataLoaded && (
          <div className="data-loaded-indicator">
            <span className="indicator-text">✓ Data loaded from your accounts and debts</span>
            <button 
              className="refresh-data-button"
              onClick={loadAccountsDebtsData}
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
              <label htmlFor="startWealth">Starting Wealth ($)</label>
              <input
                type="number"
                id="startWealth"
                name="startWealth"
                value={formData.startWealth}
                onChange={handleChange}
                placeholder="Enter starting amount"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="debt">Total Debt ($)</label>
              <input
                type="number"
                id="debt"
                name="debt"
                value={formData.debt}
                onChange={handleChange}
                placeholder="Enter total debt"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="debtInterest">Debt Interest Rate (%)</label>
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
            </div>

            <div className="form-group">
              <label htmlFor="assetInterest">Asset Interest Rate (%)</label>
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
              <label htmlFor="annualContributions">Annual Contributions ($)</label>
              <input
                type="number"
                id="annualContributions"
                name="annualContributions"
                value={formData.annualContributions}
                onChange={handleChange}
                placeholder="Enter annual amount"
                required
              />
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