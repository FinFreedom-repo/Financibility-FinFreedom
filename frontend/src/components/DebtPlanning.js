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

    // Calculate net savings for each month
    const netSavings = months.map(() => {
      const income = incomeCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
      const expenses = expenseCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
      const totalSavings = budgetData.savings ? budgetData.savings.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
      return income - expenses - totalSavings;
    });

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
          {/* Net Savings row */}
          <div className="grid-row net-savings-row">
            <div className="grid-cell category-cell net-savings-label">Net Savings</div>
            {netSavings.map((value, idx) => (
              <div key={idx} className="grid-cell net-savings-cell">{formatCurrency(value)}</div>
            ))}
          </div>
          {/* Savings items rows */}
          {budgetData.savings && budgetData.savings.map((savingsItem, savingsIdx) => (
            <div key={savingsIdx} className="grid-row personal-savings-row">
              <div className="grid-cell category-cell personal-savings-label">{savingsItem.name}</div>
              {netSavings.map((_, idx) => (
                <div key={idx} className="grid-cell personal-savings-cell">{formatCurrency(savingsItem.amount)}</div>
              ))}
            </div>
          ))}
          {allCategories.map((category, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Add a border between income and expenses */}
              {rowIndex === incomeCategories.length && (
                <div className="income-expense-separator" />
              )}
              <div className="grid-row">
                <div className={`grid-cell category-cell ${category.type}`}>{category.name}</div>
                {months.map((_, colIndex) => (
                  <div key={colIndex} className="grid-cell">{formatCurrency(category.value)}</div>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Hardcoded debts for display and API
  const outstandingDebts = [
    { name: 'Credit Card', balance: 10000, rate: 25, min_payment: 250 },
    { name: 'Student Loan', balance: 5000, rate: 6, min_payment: 75 }
  ];

  // Calculate available savings (income - expenses)
  const availableSavings = budgetData
    ? budgetData.income - (
        budgetData.housing + budgetData.debt_payments + budgetData.transportation + budgetData.food +
        budgetData.healthcare + budgetData.entertainment + budgetData.shopping + budgetData.travel +
        budgetData.education + budgetData.utilities + budgetData.childcare + budgetData.other
      )
    : 0;

  // Debt payoff plan state
  const [payoffPlan, setPayoffPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);

  useEffect(() => {
    if (budgetData) {
      setPlanLoading(true);
      axios.post('/api/debt-planner/', {
        debts: outstandingDebts,
        strategy: 'snowball', // default, can add slider later
        extra_payment: availableSavings > 0 ? availableSavings : 0
      })
        .then(res => {
          setPayoffPlan(res.data);
          setPlanError(null);
        })
        .catch(err => {
          setPlanError('Failed to calculate debt payoff plan.');
        })
        .finally(() => setPlanLoading(false));
    }
  }, [budgetData]);

  // Render payoff plan table (debts as rows, months as columns, styled like the grid table)
  const renderPayoffTable = () => {
    if (planLoading) return <div className="loading">Calculating payoff plan...</div>;
    if (planError) return <div className="error">{planError}</div>;
    if (!payoffPlan) return null;
    const months = generateMonths();
    return (
      <div className="grid-container payoff-plan-table-container">
        <div className="grid-header">
          <div className="grid-cell header-cell category-cell" style={{ minWidth: 105, width: 105, maxWidth: 105, display: 'inline-block' }}>Debt</div>
          <div className="grid-cell header-cell category-cell" style={{ minWidth: 51, width: 51, maxWidth: 51, display: 'inline-block' }}>Interest Rate</div>
          <div className="grid-cell header-cell">Start</div>
          {months.map((month, idx) => (
            <div key={idx} className="grid-cell header-cell">{month}</div>
          ))}
        </div>
        <div className="grid-body">
          {outstandingDebts.map((debt, debtIdx) => (
            <div key={debtIdx} className="grid-row">
              <div className="grid-cell category-cell" style={{ minWidth: 105, width: 105, maxWidth: 105, display: 'inline-block' }}>{debt.name}</div>
              <div className="grid-cell category-cell" style={{ minWidth: 51, width: 51, maxWidth: 51, display: 'inline-block' }}>{debt.rate}%</div>
              {/* Start: Starting balance */}
              <div className="grid-cell">${debt.balance.toLocaleString()}</div>
              {/* Months: from payoff plan */}
              {months.map((_, monthIdx) => {
                const payoffRow = payoffPlan.plan[monthIdx];
                const balance = payoffRow && payoffRow.debts[debtIdx] ? payoffRow.debts[debtIdx].balance : debt.balance;
                return (
                  <div key={monthIdx} className="grid-cell">${balance.toLocaleString()}</div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="payoff-summary" style={{marginTop: '1rem', textAlign: 'center'}}>
          <strong>Total Months:</strong> {payoffPlan.months} &nbsp;|&nbsp; <strong>Total Interest Paid:</strong> ${payoffPlan.total_interest.toLocaleString()}
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
      <div className="outstanding-debts-table-container">
        <h3>Outstanding Debts</h3>
        <table className="outstanding-debts-table">
          <thead>
            <tr>
              <th>Debt Name</th>
              <th>Balance</th>
              <th>Interest Rate</th>
            </tr>
          </thead>
          <tbody>
            {outstandingDebts.map((debt, idx) => (
              <tr key={idx}>
                <td>{debt.name}</td>
                <td>${debt.balance.toLocaleString()}</td>
                <td>{debt.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPayoffTable()}
      <div className="debt-container">
        {renderGrid()}
      </div>
    </div>
  );
};

export default DebtPlanning; 