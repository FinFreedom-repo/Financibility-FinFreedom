import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import '../styles/DebtPlanning.css';

const DebtPlanning = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      const response = await axios.get('/api/budgets/');
      const budgetData = response.data[0];
      setBudgetData(budgetData);
      setError(null);
    } catch (err) {
      console.error('Error loading budget data:', err);
      setError('Failed to load budget data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push(date.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }
    
    return months;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const renderGrid = () => {
    if (!budgetData) return null;

    const months = generateMonths();
    
    // Separate income and expenses
    const incomeCategories = [
      { name: 'Income', value: budgetData.income, type: 'income' }
    ];
    
    const expenseCategories = [
      { name: 'Housing', value: budgetData.housing, type: 'expense' },
      { name: 'Debt Payments', value: budgetData.debt_payments, type: 'expense' },
      { name: 'Transportation', value: budgetData.transportation, type: 'expense' },
      { name: 'Food', value: budgetData.food, type: 'expense' },
      { name: 'Healthcare', value: budgetData.healthcare, type: 'expense' },
      { name: 'Entertainment', value: budgetData.entertainment, type: 'expense' },
      { name: 'Shopping', value: budgetData.shopping, type: 'expense' },
      { name: 'Travel', value: budgetData.travel, type: 'expense' },
      { name: 'Education', value: budgetData.education, type: 'expense' },
      { name: 'Utilities', value: budgetData.utilities, type: 'expense' },
      { name: 'Childcare', value: budgetData.childcare, type: 'expense' },
      { name: 'Other', value: budgetData.other, type: 'expense' }
    ];

    // Add additional items from the budget
    if (budgetData.additional_items) {
      budgetData.additional_items.forEach(item => {
        if (item.type === 'income') {
          incomeCategories.push({
            name: item.name,
            value: item.amount,
            type: 'income'
          });
        } else {
          expenseCategories.push({
            name: item.name,
            value: item.amount,
            type: 'expense'
          });
        }
      });
    }

    // Combine all categories with income first, then expenses
    const allCategories = [...incomeCategories, ...expenseCategories];

    return (
      <div className="grid-container">
        <div className="grid-header">
          <div className="grid-cell header-cell category-cell">Category</div>
          {months.map((month, index) => (
            <div key={index} className="grid-cell header-cell">
              {month}
            </div>
          ))}
        </div>
        <div className="grid-body">
          {allCategories.map((category, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              <div className={`grid-cell category-cell ${category.type}`}>
                {category.name}
              </div>
              {months.map((_, colIndex) => (
                <div key={colIndex} className="grid-cell">
                  {formatCurrency(category.value)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="debt-planning">
        <div className="loading">Loading budget data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="debt-planning">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="debt-planning">
      <div className="debt-header">
        <h2>Debt Planning</h2>
        <p className="debt-subtitle">Plan and track your debt repayment strategy</p>
      </div>
      <div className="debt-container">
        {renderGrid()}
      </div>
    </div>
  );
};

export default DebtPlanning; 