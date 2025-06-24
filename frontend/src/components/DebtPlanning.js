import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import '../styles/DebtPlanning.css';

const DebtPlanning = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [outstandingDebts, setOutstandingDebts] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [debtsError, setDebtsError] = useState(null);

  // Update categories when budgetData changes
  useEffect(() => {
    if (budgetData) {
      // Base income category
      const baseIncome = [{ name: 'Income', value: budgetData.income, type: 'income' }];
      
      // Base expense categories
      const baseExpenses = [
        { name: 'Housing', value: budgetData.housing, type: 'expense' },
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

      // Add additional items
      if (budgetData.additional_items) {
        const additionalIncome = budgetData.additional_items
          .filter(item => item.type === 'income')
          .map(item => ({
            name: item.name,
            value: item.amount,
            type: 'income'
          }));

        const additionalExpenses = budgetData.additional_items
          .filter(item => item.type === 'expense')
          .map(item => ({
            name: item.name,
            value: item.amount,
            type: 'expense'
          }));

        setIncomeCategories([...baseIncome, ...additionalIncome]);
        setExpenseCategories([...baseExpenses, ...additionalExpenses]);
      } else {
        setIncomeCategories(baseIncome);
        setExpenseCategories(baseExpenses);
      }
    }
  }, [budgetData]);

  useEffect(() => {
    loadBudgetData();
    loadDebts();
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

  const loadDebts = async () => {
    try {
      setDebtsLoading(true);
      const debts = await accountsDebtsService.getDebts();
      // Transform debts to match the format expected by the debt planner
      const transformedDebts = debts.map(debt => ({
        name: debt.name,
        balance: parseFloat(debt.balance),
        rate: parseFloat(debt.interest_rate),
        min_payment: parseFloat(debt.balance) * (parseFloat(debt.interest_rate) / 100 / 12) // Calculate minimum payment as monthly interest
      }));
      setOutstandingDebts(transformedDebts);
      setDebtsError(null);
    } catch (err) {
      console.error('Error loading debts:', err);
      setDebtsError('Failed to load debts. Please try again later.');
    } finally {
      setDebtsLoading(false);
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
              <div key={idx} className={`grid-cell net-savings-cell ${value < 0 ? 'negative-value' : ''}`}>
                {formatCurrency(value)}
              </div>
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
          {/* Income categories */}
          {incomeCategories.map((category, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              <div className={`grid-cell category-cell ${category.type}`}>{category.name}</div>
              {months.map((_, colIndex) => (
                <div key={colIndex} className="grid-cell">{formatCurrency(category.value)}</div>
              ))}
            </div>
          ))}
          {/* Expense categories */}
          {expenseCategories.map((category, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              <div className={`grid-cell category-cell ${category.type}`}>{category.name}</div>
              {months.map((_, colIndex) => (
                <div key={colIndex} className="grid-cell">{formatCurrency(category.value)}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate available savings (income - expenses)
  const availableSavings = budgetData
    ? (() => {
        const income = incomeCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
        const expenses = expenseCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
        const totalSavings = budgetData.savings ? budgetData.savings.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
        return income - expenses - totalSavings;
      })()
    : 0;

  // Debt payoff plan state
  const [payoffPlan, setPayoffPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [strategy, setStrategy] = useState('snowball');

  useEffect(() => {
    if (budgetData && outstandingDebts.length > 0) {
      setPlanLoading(true);
      axios.post('/api/debt-planner/', {
        debts: outstandingDebts,
        strategy: strategy,
        net_savings: availableSavings > 0 ? availableSavings : 0
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
  }, [budgetData, strategy, outstandingDebts]);

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
          {months.map((month, idx) => (
            <div key={idx} className="grid-cell header-cell">{month}</div>
          ))}
        </div>
        <div className="grid-body">
          {payoffPlan.debts.map((debt, debtIdx) => (
            <div key={debtIdx} className="grid-row">
              <div className="grid-cell category-cell" style={{ minWidth: 105, width: 105, maxWidth: 105, display: 'inline-block' }}>{debt.name}</div>
              <div className="grid-cell category-cell" style={{ minWidth: 51, width: 51, maxWidth: 51, display: 'inline-block' }}>{debt.rate}%</div>
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
      <div className="strategy-controls">
        <div className="strategy-toggle">
          <div className={`strategy-option ${strategy === 'snowball' ? 'active' : ''}`} onClick={() => setStrategy('snowball')}>
            Snowball
          </div>
          <div className={`strategy-option ${strategy === 'avalanche' ? 'active' : ''}`} onClick={() => setStrategy('avalanche')}>
            Avalanche
          </div>
          <div className={`slider ${strategy}`}></div>
        </div>
      </div>
      <div className="outstanding-debts-table-container">
        <h3>Outstanding Debts</h3>
        {debtsLoading ? (
          <div className="loading">Loading debts...</div>
        ) : debtsError ? (
          <div className="error">{debtsError}</div>
        ) : outstandingDebts.length === 0 ? (
          <div className="no-debts">No outstanding debts found. Add some debts in the Accounts & Debts section to see your debt payoff plan.</div>
        ) : (
          <div className="grid-container">
            <div className="grid-header">
              <div className="grid-cell header-cell category-cell" style={{ width: '120px' }}>Debt Name</div>
              <div className="grid-cell header-cell" style={{ width: '100px' }}>Balance</div>
              <div className="grid-cell header-cell" style={{ width: '100px' }}>Interest Rate</div>
              <div className="grid-cell header-cell" style={{ width: '100px' }}>Monthly Interest</div>
            </div>
            <div className="grid-body">
              {outstandingDebts.map((debt, idx) => (
                <div key={idx} className="grid-row">
                  <div className="grid-cell category-cell" style={{ width: '120px' }}>{debt.name}</div>
                  <div className="grid-cell" style={{ width: '100px' }}>${debt.balance.toLocaleString()}</div>
                  <div className="grid-cell" style={{ width: '100px' }}>{debt.rate}%</div>
                  <div className="grid-cell" style={{ width: '100px' }}>${(debt.balance * (debt.rate / 100 / 12)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {outstandingDebts.length > 0 && renderPayoffTable()}
      <div className="debt-container">
        {renderGrid()}
      </div>
    </div>
  );
};

export default DebtPlanning; 