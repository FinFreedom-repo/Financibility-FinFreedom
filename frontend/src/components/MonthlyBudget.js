import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from '../utils/axios';
import '../styles/MonthlyBudget.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function MonthlyBudget() {
  const [formData, setFormData] = useState({
    income: '',
    rent: '',
    creditCardDebt: '',
    transportation: '',
    utilities: '',
    internet: '',
    groceries: '',
    healthcare: '',
    childcare: ''
  });

  const [additionalItems, setAdditionalItems] = useState([]);
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [incomeChartData, setIncomeChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBudgetData();
  }, []);

  useEffect(() => {
    updateChartData();
  }, [formData, additionalItems]);

  const loadBudgetData = async () => {
    try {
      console.log('Starting to load budget data...');
      setIsLoading(true);
      console.log('Making API call to /api/budget/...');
      const response = await axios.get('/api/budget/');
      console.log('API Response:', response);
      const budgetData = response.data;
      console.log('Budget data received:', budgetData);

      // Update form data
      setFormData({
        income: budgetData.income || '',
        rent: budgetData.rent || '',
        creditCardDebt: budgetData.credit_card_debt || '',
        transportation: budgetData.transportation || '',
        utilities: budgetData.utilities || '',
        internet: budgetData.internet || '',
        groceries: budgetData.groceries || '',
        healthcare: budgetData.healthcare || '',
        childcare: budgetData.childcare || ''
      });

      // Update additional items
      setAdditionalItems(budgetData.additional_items || []);
      setError(null);
    } catch (err) {
      console.error('Detailed error:', err);
      console.error('Error response:', err.response);
      setError('Failed to load budget data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgetData = async () => {
    try {
      const budgetData = {
        income: parseFloat(formData.income) || 0,
        rent: parseFloat(formData.rent) || 0,
        credit_card_debt: parseFloat(formData.creditCardDebt) || 0,
        transportation: parseFloat(formData.transportation) || 0,
        utilities: parseFloat(formData.utilities) || 0,
        internet: parseFloat(formData.internet) || 0,
        groceries: parseFloat(formData.groceries) || 0,
        healthcare: parseFloat(formData.healthcare) || 0,
        childcare: parseFloat(formData.childcare) || 0,
        additional_items: additionalItems.map(item => ({
          type: item.type,
          name: item.name,
          amount: parseFloat(item.amount) || 0
        }))
      };

      await axios.put('/api/budget', budgetData);
      setError(null);
    } catch (err) {
      setError('Failed to save budget data. Please try again later.');
      console.error('Error saving budget:', err);
    }
  };

  const updateChartData = () => {
    // Expense chart data
    const expenses = {
      'Housing': parseFloat(formData.rent) || 0,
      'Credit Card Interest': parseFloat(formData.creditCardDebt) || 0,
      'Transportation': parseFloat(formData.transportation) || 0,
      'Utilities': parseFloat(formData.utilities) || 0,
      'Internet & Streaming': parseFloat(formData.internet) || 0,
      'Food & Groceries': parseFloat(formData.groceries) || 0,
      'Healthcare': parseFloat(formData.healthcare) || 0,
      'Childcare': parseFloat(formData.childcare) || 0
    };

    // Add additional expenses
    additionalItems
      .filter(item => item.type === 'expense')
      .forEach(item => {
        expenses[item.name || 'Additional Expense'] = parseFloat(item.amount) || 0;
      });

    // Filter out zero values and sort by amount
    const sortedExpenses = Object.entries(expenses)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a);

    // Income chart data
    const incomes = {
      'Primary Income': parseFloat(formData.income) || 0
    };

    // Add additional incomes
    additionalItems
      .filter(item => item.type === 'income')
      .forEach(item => {
        incomes[item.name || 'Additional Income'] = parseFloat(item.amount) || 0;
      });

    // Filter out zero values and sort by amount
    const sortedIncomes = Object.entries(incomes)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a);

    // Color schemes
    const expenseColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
      '#E74C3C', '#1ABC9C', '#F1C40F', '#34495E', '#16A085'
    ];

    const incomeColors = [
      '#2ECC71', '#27AE60', '#1ABC9C', '#16A085', '#2980B9',
      '#3498DB', '#8E44AD', '#9B59B6', '#F1C40F', '#F39C12'
    ];

    setExpenseChartData({
      labels: sortedExpenses.map(([label]) => label),
      datasets: [{
        data: sortedExpenses.map(([_, value]) => value),
        backgroundColor: expenseColors,
        borderColor: expenseColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }]
    });

    setIncomeChartData({
      labels: sortedIncomes.map(([label]) => label),
      datasets: [{
        data: sortedIncomes.map(([_, value]) => value),
        backgroundColor: incomeColors,
        borderColor: incomeColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }]
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAdditionalItemChange = (index, field, value) => {
    const newItems = [...additionalItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setAdditionalItems(newItems);
  };

  const addNewItem = (type) => {
    setAdditionalItems([
      ...additionalItems,
      {
        type,
        name: '',
        amount: ''
      }
    ]);
  };

  const removeItem = (index) => {
    const newItems = [...additionalItems];
    newItems.splice(index, 1);
    setAdditionalItems(newItems);
  };

  const calculateTotalExpenses = () => {
    const baseExpenses = Object.entries(formData)
      .filter(([key]) => key !== 'income')
      .reduce((sum, [_, value]) => {
        return sum + (parseFloat(value) || 0);
      }, 0);

    const additionalExpenses = additionalItems
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => {
        return sum + (parseFloat(item.amount) || 0);
      }, 0);

    return baseExpenses + additionalExpenses;
  };

  const calculateTotalIncome = () => {
    const baseIncome = parseFloat(formData.income) || 0;
    const additionalIncome = additionalItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => {
        return sum + (parseFloat(item.amount) || 0);
      }, 0);

    return baseIncome + additionalIncome;
  };

  const calculateRemaining = () => {
    return calculateTotalIncome() - calculateTotalExpenses();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="monthly-budget">
        <div className="loading">Loading budget data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monthly-budget">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="monthly-budget">
      <div className="budget-header">
        <h2>Monthly Budget</h2>
        <p className="budget-subtitle">Track your monthly income and expenses</p>
      </div>
      
      <div className="budget-container">
        <div className="budget-form-container">
          <form className="budget-form">
            <div className="form-section">
              <h3>Income</h3>
              <div className="form-group">
                <label htmlFor="income">Monthly Income</label>
                <input
                  type="number"
                  id="income"
                  name="income"
                  value={formData.income}
                  onChange={handleChange}
                  placeholder="Enter your total monthly income"
                  required
                />
              </div>
              {additionalItems.filter(item => item.type === 'income').map((item, index) => (
                <div key={index} className="additional-item">
                  <div className="form-group">
                    <label>Additional Income Source</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleAdditionalItemChange(index, 'name', e.target.value)}
                      placeholder="e.g., Side job, Rental income"
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleAdditionalItemChange(index, 'amount', e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={() => addNewItem('income')}
              >
                + Add Income Source
              </button>
            </div>

            <div className="form-section">
              <h3>Fixed Expenses</h3>
              <div className="form-group">
                <label htmlFor="rent">Rent/Mortgage</label>
                <input
                  type="number"
                  id="rent"
                  name="rent"
                  value={formData.rent}
                  onChange={handleChange}
                  placeholder="Enter your monthly housing payment"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="creditCardDebt">Credit Card Interest</label>
                <input
                  type="number"
                  id="creditCardDebt"
                  name="creditCardDebt"
                  value={formData.creditCardDebt}
                  onChange={handleChange}
                  placeholder="Enter your monthly credit card interest payments"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="transportation">Transportation</label>
                <input
                  type="number"
                  id="transportation"
                  name="transportation"
                  value={formData.transportation}
                  onChange={handleChange}
                  placeholder="Include car payment, insurance, fuel, metro, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="utilities">Utilities</label>
                <input
                  type="number"
                  id="utilities"
                  name="utilities"
                  value={formData.utilities}
                  onChange={handleChange}
                  placeholder="Include electricity, water, gas, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="internet">Internet & Streaming</label>
                <input
                  type="number"
                  id="internet"
                  name="internet"
                  value={formData.internet}
                  onChange={handleChange}
                  placeholder="Include all subscription services"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Living Expenses</h3>
              <div className="form-group">
                <label htmlFor="groceries">Food & Groceries</label>
                <input
                  type="number"
                  id="groceries"
                  name="groceries"
                  value={formData.groceries}
                  onChange={handleChange}
                  placeholder="Include all food and household items"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="healthcare">Healthcare</label>
                <input
                  type="number"
                  id="healthcare"
                  name="healthcare"
                  value={formData.healthcare}
                  onChange={handleChange}
                  placeholder="Include insurance, medications, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="childcare">Childcare</label>
                <input
                  type="number"
                  id="childcare"
                  name="childcare"
                  value={formData.childcare}
                  onChange={handleChange}
                  placeholder="Include daycare, after-school care, etc."
                  required
                />
              </div>
              {additionalItems.filter(item => item.type === 'expense').map((item, index) => (
                <div key={index} className="additional-item">
                  <div className="form-group">
                    <label>Additional Expense</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleAdditionalItemChange(index, 'name', e.target.value)}
                      placeholder="e.g., Gym membership, Pet care"
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleAdditionalItemChange(index, 'amount', e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={() => addNewItem('expense')}
              >
                + Add Expense
              </button>
            </div>
            <button
              type="button"
              className="save-button"
              onClick={saveBudgetData}
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Save
            </button>
          </form>
        </div>

        <div className="budget-summary">
          <div className="summary-card">
            <h3>Financial Overview</h3>
            
            <div className="summary-section">
              <h4>Income Breakdown</h4>
              {incomeChartData && (
                <div className="chart-container">
                  <Pie data={incomeChartData} options={{
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          boxWidth: 15,
                          padding: 15
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} />
                </div>
              )}
            </div>

            <div className="summary-section">
              <h4>Expense Breakdown</h4>
              {expenseChartData && (
                <div className="chart-container">
                  <Pie data={expenseChartData} options={{
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          boxWidth: 15,
                          padding: 15
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} />
                </div>
              )}
            </div>

            <div className="summary-section">
              <h4>Monthly Summary</h4>
              <div className="summary-item total">
                <span>Total Income:</span>
                <span className="positive">
                  {formatCurrency(calculateTotalIncome())}
                </span>
              </div>
              <div className="summary-item total">
                <span>Total Expenses:</span>
                <span className="negative">
                  {formatCurrency(calculateTotalExpenses())}
                </span>
              </div>
              <div className="summary-item total">
                <span>Monthly Remaining:</span>
                <span className={calculateRemaining() >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(calculateRemaining())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyBudget; 