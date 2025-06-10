import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/MonthlyBudget.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function MonthlyBudget() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    income: '',
    housing: '',
    debt_payments: '',
    transportation: '',
    food: '',
    healthcare: '',
    entertainment: '',
    shopping: '',
    travel: '',
    education: '',
    utilities: '',
    childcare: '',
    other: ''
  });

  const [additionalItems, setAdditionalItems] = useState([]);
  const [savingsItems, setSavingsItems] = useState([]);
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [incomeChartData, setIncomeChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadBudgetData();
  }, []);

  useEffect(() => {
    updateChartData();
  }, [formData, additionalItems, savingsItems]);

  const loadBudgetData = async () => {
    try {
      console.log('Starting to load budget data...');
      setIsLoading(true);
      console.log('Making API call to /api/budgets/...');
      const response = await axios.get('/api/budgets/');
      console.log('API Response:', response);
      
      // The backend already filters by user, so we should get an array with at most one budget
      const budgetData = response.data[0]; // Get the first (and should be only) budget
      
      if (budgetData) {
        console.log('Budget data received:', budgetData);
        setFormData({
          income: budgetData.income || '',
          housing: budgetData.housing || '',
          debt_payments: budgetData.debt_payments || '',
          transportation: budgetData.transportation || '',
          food: budgetData.food || '',
          healthcare: budgetData.healthcare || '',
          entertainment: budgetData.entertainment || '',
          shopping: budgetData.shopping || '',
          travel: budgetData.travel || '',
          education: budgetData.education || '',
          utilities: budgetData.utilities || '',
          childcare: budgetData.childcare || '',
          other: budgetData.other || ''
        });

        // Update additional items
        setAdditionalItems(budgetData.additional_items || []);
        setSavingsItems(budgetData.savings || []);
        setError(null);
      } else {
        console.log('No budget found for user');
        // Initialize with empty values if no budget exists
        setFormData({
          income: '',
          housing: '',
          debt_payments: '',
          transportation: '',
          food: '',
          healthcare: '',
          entertainment: '',
          shopping: '',
          travel: '',
          education: '',
          utilities: '',
          childcare: '',
          other: ''
        });
        setAdditionalItems([]);
        setSavingsItems([]);
      }
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
        housing: parseFloat(formData.housing) || 0,
        debt_payments: parseFloat(formData.debt_payments) || 0,
        transportation: parseFloat(formData.transportation) || 0,
        food: parseFloat(formData.food) || 0,
        healthcare: parseFloat(formData.healthcare) || 0,
        entertainment: parseFloat(formData.entertainment) || 0,
        shopping: parseFloat(formData.shopping) || 0,
        travel: parseFloat(formData.travel) || 0,
        education: parseFloat(formData.education) || 0,
        utilities: parseFloat(formData.utilities) || 0,
        childcare: parseFloat(formData.childcare) || 0,
        other: parseFloat(formData.other) || 0,
        additional_items: additionalItems.map(item => ({
          type: item.type,
          name: item.name,
          amount: parseFloat(item.amount) || 0
        })),
        savings: savingsItems.map(item => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0
        })),
        user: user.id
      };

      // First get the existing budget to get its ID
      const response = await axios.get('/api/budgets/');
      const existingBudget = response.data[0]; // Get the first budget

      if (existingBudget) {
        // If budget exists, update it
        await axios.put(`/api/budgets/${existingBudget.id}/`, budgetData);
      } else {
        // If no budget exists, create a new one
        await axios.post('/api/budgets/', budgetData);
      }
      setError(null);
      setSuccessMessage('Budget saved successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Failed to save budget data. Please try again later.');
      console.error('Error saving budget:', err);
    }
  };

  const updateChartData = () => {
    // Expense chart data
    const expenses = {
      'Housing': parseFloat(formData.housing) || 0,
      'Debt Payments': parseFloat(formData.debt_payments) || 0,
      'Transportation': parseFloat(formData.transportation) || 0,
      'Food': parseFloat(formData.food) || 0,
      'Healthcare': parseFloat(formData.healthcare) || 0,
      'Entertainment': parseFloat(formData.entertainment) || 0,
      'Shopping': parseFloat(formData.shopping) || 0,
      'Travel': parseFloat(formData.travel) || 0,
      'Education': parseFloat(formData.education) || 0,
      'Utilities': parseFloat(formData.utilities) || 0,
      'Childcare': parseFloat(formData.childcare) || 0,
      'Other': parseFloat(formData.other) || 0
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
    // Convert empty string to 0 for number inputs
    const processedValue = value === '' ? '' : value;
    setFormData(prevState => ({
      ...prevState,
      [name]: processedValue
    }));
  };

  const handleAdditionalItemChange = (index, field, value) => {
    const newItems = [...additionalItems];
    // Convert empty string to 0 for amount field
    const processedValue = field === 'amount' && value === '' ? '' : value;
    newItems[index] = {
      ...newItems[index],
      [field]: processedValue
    };
    setAdditionalItems(newItems);
  };

  const handleSavingsItemChange = (index, field, value) => {
    const newItems = [...savingsItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setSavingsItems(newItems);
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

  const addNewSavingsItem = () => {
    setSavingsItems([
      ...savingsItems,
      { name: '', amount: '' }
    ]);
  };

  const removeItem = (index) => {
    const newItems = [...additionalItems];
    newItems.splice(index, 1);
    setAdditionalItems(newItems);
  };

  const removeSavingsItem = (index) => {
    const newItems = [...savingsItems];
    newItems.splice(index, 1);
    setSavingsItems(newItems);
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

  const calculateTotalSavings = () => {
    return savingsItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const calculateRemaining = () => {
    return calculateTotalIncome() - calculateTotalExpenses() - calculateTotalSavings();
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
          <form className="budget-form" onSubmit={(e) => { e.preventDefault(); saveBudgetData(); }}>
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
                />
              </div>
              
              {additionalItems
                .filter(item => item.type === 'income')
                .map((item, index) => (
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
                <label htmlFor="housing">Housing</label>
                <input
                  type="number"
                  id="housing"
                  name="housing"
                  value={formData.housing}
                  onChange={handleChange}
                  placeholder="Enter your monthly housing payment"
                />
              </div>
              <div className="form-group">
                <label htmlFor="debt_payments">Debt Payments</label>
                <input
                  type="number"
                  id="debt_payments"
                  name="debt_payments"
                  value={formData.debt_payments}
                  onChange={handleChange}
                  placeholder="Enter your monthly debt payments"
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
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Living Expenses</h3>
              <div className="form-group">
                <label htmlFor="food">Food</label>
                <input
                  type="number"
                  id="food"
                  name="food"
                  value={formData.food}
                  onChange={handleChange}
                  placeholder="Include all food and household items"
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
                />
              </div>
              <div className="form-group">
                <label htmlFor="entertainment">Entertainment</label>
                <input
                  type="number"
                  id="entertainment"
                  name="entertainment"
                  value={formData.entertainment}
                  onChange={handleChange}
                  placeholder="Include streaming services, hobbies, etc."
                />
              </div>
              <div className="form-group">
                <label htmlFor="shopping">Shopping</label>
                <input
                  type="number"
                  id="shopping"
                  name="shopping"
                  value={formData.shopping}
                  onChange={handleChange}
                  placeholder="Include clothing, personal items, etc."
                />
              </div>
              <div className="form-group">
                <label htmlFor="travel">Travel</label>
                <input
                  type="number"
                  id="travel"
                  name="travel"
                  value={formData.travel}
                  onChange={handleChange}
                  placeholder="Include vacations, business trips, etc."
                />
              </div>
              <div className="form-group">
                <label htmlFor="education">Education</label>
                <input
                  type="number"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="Include tuition, books, courses, etc."
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
                />
              </div>
              <div className="form-group">
                <label htmlFor="other">Other</label>
                <input
                  type="number"
                  id="other"
                  name="other"
                  value={formData.other}
                  onChange={handleChange}
                  placeholder="Include any other expenses"
                />
              </div>
              
              {additionalItems
                .filter(item => item.type === 'expense')
                .map((item, index) => (
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

            <div className="form-section">
              <h3>Savings</h3>
              {savingsItems.map((item, index) => (
                <div key={index} className="additional-item">
                  <div className="form-group">
                    <label>Savings Item</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleSavingsItemChange(index, 'name', e.target.value)}
                      placeholder="e.g., 401K, 529"
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleSavingsItemChange(index, 'amount', e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeSavingsItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={addNewSavingsItem}
              >
                + Add Savings
              </button>
            </div>

            <button
              type="submit"
              className="save-button"
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Save Budget
            </button>
            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
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
                <span>Total Savings:</span>
                <span className="positive">
                  {formatCurrency(calculateTotalSavings())}
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