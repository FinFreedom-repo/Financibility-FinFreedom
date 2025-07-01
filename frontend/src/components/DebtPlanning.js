import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import '../styles/DebtPlanning.css';
import ReactDOM from 'react-dom';

const DebtPlanning = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [outstandingDebts, setOutstandingDebts] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [debtsError, setDebtsError] = useState(null);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [historicalMonthsShown, setHistoricalMonthsShown] = useState(3);
  const [maxHistoricalMonths, setMaxHistoricalMonths] = useState(0);

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
      // Only include latest record for each debt name, balance > 0, and not mortgage
      const filteredDebts = debts.filter(
        debt => debt.balance > 0 && debt.debt_type !== 'mortgage'
      );
      // Transform debts to match the format expected by the debt planner
      const transformedDebts = filteredDebts.map(debt => ({
        name: debt.name,
        balance: parseFloat(debt.balance),
        rate: parseFloat(debt.interest_rate),
        min_payment: parseFloat(debt.balance) * (parseFloat(debt.interest_rate) / 100 / 12),
        debt_type: debt.debt_type
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

  // Helper to get the earliest effective_date from debts, accounts, or budgets
  const getEarliestHistoricalDate = () => {
    let earliest = new Date();
    if (outstandingDebts.length > 0) {
      outstandingDebts.forEach(debt => {
        if (debt.effective_date) {
          const d = new Date(debt.effective_date);
          if (d < earliest) earliest = d;
        }
      });
    }
    // You can add similar logic for accounts/budgets if needed
    return earliest;
  };

  // Calculate the max number of historical months available
  useEffect(() => {
    const earliest = getEarliestHistoricalDate();
    const today = new Date();
    let months = 0;
    let d = new Date(today.getFullYear(), today.getMonth(), 1);
    while (d > earliest) {
      months++;
      d.setMonth(d.getMonth() - 1);
    }
    setMaxHistoricalMonths(months);
  }, [outstandingDebts]);

  // Generate months, including historicals
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Add historical months first
    for (let i = historicalMonthsShown; i > 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        date: date,
        type: 'historical'
      });
    }
    // Then add projection months
    for (let i = 0; i < projectionMonths; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      months.push({
        label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        date: date,
        type: isCurrentMonth ? 'current' : 'future'
      });
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

  const payoffHeaderRefs = useRef([]);
  const payoffContainerRef = useRef(null);
  const gridHeaderRefs = useRef([]);
  const gridContainerRef = useRef(null);

  // Helper to get historical balances for each debt for each historical month
  const getHistoricalBalance = (debtName, monthIdx, months, outstandingDebts) => {
    // Try to find a matching debt record for the historical month
    // This assumes outstandingDebts contains historical records with effective_date
    const month = months[monthIdx];
    if (!month || !month.date) return '';
    // Find the closest record for this debt before or at this month
    let closest = null;
    let closestDiff = Infinity;
    outstandingDebts.forEach(debt => {
      if (debt.name === debtName && debt.effective_date) {
        const debtDate = new Date(debt.effective_date);
        const diff = Math.abs(debtDate - month.date);
        if (debtDate <= month.date && diff < closestDiff) {
          closest = debt;
          closestDiff = diff;
        }
      }
    });
    return closest ? `$${parseFloat(closest.balance).toLocaleString()}` : '';
  };

  const findDebtFreeColIdx = (payoffPlan, months) => {
    if (!payoffPlan || !payoffPlan.plan || !months) return null;
    // Find the first payoff plan month where all debts are paid off
    let debtFreePlanIdx = null;
    for (let i = 0; i < payoffPlan.plan.length; i++) {
      if (payoffPlan.plan[i].debts.every(d => d.balance === 0)) {
        debtFreePlanIdx = i;
        break;
      }
    }
    if (debtFreePlanIdx === null) return null;
    // Find the date of the first current month in months array
    const currentMonthObj = months.find(m => m.type === 'current');
    if (!currentMonthObj) return null;
    const debtFreeDate = new Date(currentMonthObj.date.getFullYear(), currentMonthObj.date.getMonth() + debtFreePlanIdx, 1);
    // Find the index in months array where the date matches
    const idx = months.findIndex(m => m.date.getFullYear() === debtFreeDate.getFullYear() && m.date.getMonth() === debtFreeDate.getMonth());
    // Debug logging
    console.log('--- Debt Free Debug ---');
    console.log('Debt Free Plan Index:', debtFreePlanIdx);
    console.log('Debt Free Date:', debtFreeDate);
    console.log('Months Array:', months.map(m => m.date));
    console.log('Debt Free Col Index:', idx);
    return idx !== -1 ? { idx, debtFreeDate } : null;
  };

  const renderPayoffTable = () => {
    if (planLoading) return <div className="loading">Calculating payoff plan...</div>;
    if (planError) return <div className="error">{planError}</div>;
    if (!payoffPlan) return null;
    const months = generateMonths();
    const debtFreeCol = findDebtFreeColIdx(payoffPlan, months);
    const debtFreeColIdx = debtFreeCol ? debtFreeCol.idx : null;
    const debtFreeDate = debtFreeCol ? debtFreeCol.debtFreeDate : null;
    const debtFreeCols = Array(months.length).fill(false);
    if (debtFreeColIdx !== null) debtFreeCols[debtFreeColIdx] = true;

    return (
      <div className="payoff-plan-table-container">
        {debtFreeDate && (
          <div className="debt-free-convo-bubble">
            <span style={{whiteSpace: 'pre'}}><span role="img" aria-label="party">🎉</span> You will be debt-free by{' '}<span className="debt-free-date">{debtFreeDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>!</span>
          </div>
        )}
        <div className="grid-container">
          <div className="debt-table-legend legend-margin">
            <span className="legend-historical">🕰️ <span className="legend-label">Historical</span></span>
            <span className="legend-sep">|</span>
            <span className="legend-current">📅 <span className="legend-label">Current</span></span>
            <span className="legend-sep">|</span>
            <span className="legend-projected">🔮 <span className="legend-label">Projected</span></span>
          </div>
          <div className="grid-header">
            <div className="grid-cell header-cell category-cell" style={{ minWidth: 180, width: 180, maxWidth: 180, display: 'inline-block' }}>Debt</div>
            {months.map((month, idx) => (
              <div
                key={idx}
                className={`grid-cell header-cell ${month.type}-month${debtFreeCols[idx] ? ' debt-free col' : ''}`}
                style={{ position: 'relative' }}
              >
                <div>{month.label}</div>
              </div>
            ))}
          </div>
          <div className="grid-body">
            {payoffPlan.debts.map((debt, debtIdx) => (
              <div key={debtIdx} className="grid-row">
                <div className="grid-cell category-cell" style={{ minWidth: 180, width: 180, maxWidth: 180, display: 'inline-block' }}>{debt.name}</div>
                {months.map((month, monthIdx) => {
                  const isDebtFreeCol = debtFreeCols[monthIdx];
                  if (month.type === 'historical') {
                    return (
                      <div key={monthIdx} className={`grid-cell ${month.type}-month${isDebtFreeCol ? ' debt-free-col' : ''}`}>
                        {getHistoricalBalance(debt.name, monthIdx, months, outstandingDebts)}
                      </div>
                    );
                  } else {
                    const payoffRow = payoffPlan.plan[monthIdx - months.findIndex(m => m.type === 'current')];
                    const balance = payoffRow && payoffRow.debts[debtIdx] ? payoffRow.debts[debtIdx].balance : debt.balance;
                    return (
                      <div key={monthIdx} className={`grid-cell ${month.type}-month${isDebtFreeCol ? ' debt-free-col' : ''}`} style={{ position: 'relative' }}>
                        {balance.toLocaleString && `$${balance.toLocaleString()}`}
                      </div>
                    );
                  }
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render payoff summary table
  const renderPayoffSummaryTable = () => {
    const summary = getPayoffSummary();
    if (!summary) return null;
    return (
      <div className="payoff-summary-table-container debts-table-style">
        <div className="payoff-summary-title">Total Payments</div>
        <table className="payoff-summary-table debts-table-style">
          <tbody>
            <tr>
              <th>Total Months</th>
              <td>{summary.months}</td>
            </tr>
            <tr>
              <th>Total Principal Paid</th>
              <td>${summary.totalPrincipal.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <th>Total Interest Paid</th>
              <td>${summary.totalInterest.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <th>Total Paid</th>
              <td><strong>${summary.totalPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Highlight the debt free column in the outstanding debts table
  const renderOutstandingDebtsTable = () => {
    // Find the last payoff month for each debt (where balance goes to 0)
    if (!payoffPlan) return null;
    const months = generateMonths();
    const historicalMonths = months.filter(m => m.type === 'historical');
    const lastPayoffMonthIdx = payoffPlan.debts.map((debt, debtIdx) => {
      let idx = null;
      for (let i = payoffPlan.plan.length - 1; i >= 0; i--) {
        if (payoffPlan.plan[i].debts && payoffPlan.plan[i].debts[debtIdx] && payoffPlan.plan[i].debts[debtIdx].balance === 0) {
          idx = i;
        }
      }
      return idx !== null ? idx + historicalMonths.length : null;
    });

    // ... existing code for rendering the outstanding debts table ...
  };

  const renderGrid = () => {
    if (!budgetData) return null;
    const months = generateMonths();
    const debtFreeCol = findDebtFreeColIdx(payoffPlan, months);
    const debtFreeColIdx = debtFreeCol ? debtFreeCol.idx : null;
    const debtFreeCols = Array(months.length).fill(false);
    if (debtFreeColIdx !== null) debtFreeCols[debtFreeColIdx] = true;
    const netSavings = months.map(() => {
      const income = incomeCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
      const expenses = expenseCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
      const totalSavings = budgetData.savings ? budgetData.savings.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
      return income - expenses - totalSavings;
    });
    return (
      <div className="grid-container">
        <div className="debt-table-legend legend-margin">
          <span className="legend-historical">🕰️ <span className="legend-label">Historical</span></span>
          <span className="legend-sep">|</span>
          <span className="legend-current">📅 <span className="legend-label">Current</span></span>
          <span className="legend-sep">|</span>
          <span className="legend-projected">🔮 <span className="legend-label">Projected</span></span>
        </div>
        <div className="grid-header">
          <div className="grid-cell header-cell category-cell">Category</div>
          {months.map((month, idx) => (
            <div
              key={idx}
              className={`grid-cell header-cell ${month.type}-month${debtFreeCols[idx] ? ' debt-free-col' : ''}`}
              style={{ position: 'relative' }}
            >
              <div>{month.label}</div>
            </div>
          ))}
        </div>
        <div className="grid-body">
          {/* Net Savings row */}
          <div className="grid-row net-savings-row">
            <div className="grid-cell category-cell net-savings-label">Net Savings</div>
            {netSavings.map((value, idx) => (
              <div key={idx} className={`grid-cell net-savings-cell ${months[idx].type}-month${debtFreeCols[idx] ? ' debt-free-col' : ''}`}>{formatCurrency(value)}</div>
            ))}
          </div>
          {/* Savings items rows */}
          {budgetData.savings && budgetData.savings.map((savingsItem, savingsIdx) => (
            <div key={savingsIdx} className="grid-row personal-savings-row">
              <div className="grid-cell category-cell personal-savings-label">{savingsItem.name}</div>
              {months.map((month, idx) => (
                <div key={idx} className={`grid-cell personal-savings-cell ${month.type}-month${debtFreeCols[idx] ? ' debt-free-col' : ''}`}>
                  {formatCurrency(savingsItem.amount)}
                </div>
              ))}
            </div>
          ))}
          {/* Income categories */}
          {incomeCategories.map((category, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              <div className={`grid-cell category-cell ${category.type}`}>{category.name}</div>
              {months.map((month, colIndex) => (
                <div key={colIndex} className={`grid-cell ${month.type}-month${debtFreeCols[colIndex] ? ' debt-free-col' : ''}`}>
                  {formatCurrency(category.value)}
                </div>
              ))}
            </div>
          ))}
          {/* Expense categories */}
          {expenseCategories.map((category, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              <div className={`grid-cell category-cell ${category.type}`}>{category.name}</div>
              {months.map((month, colIndex) => (
                <div key={colIndex} className={`grid-cell ${month.type}-month${debtFreeCols[colIndex] ? ' debt-free-col' : ''}`}>
                  {formatCurrency(category.value)}
                </div>
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

  // Always recalculate payoff plan when data is loaded and valid
  useEffect(() => {
    console.log('Debt payoff effect running', {
      loading, debtsLoading, budgetData, outstandingDebts, strategy, availableSavings
    });
    if (!loading && !debtsLoading && budgetData && outstandingDebts && outstandingDebts.length > 0) {
      setPlanLoading(true);
      axios.post('/api/debt-planner/', {
        debts: outstandingDebts,
        strategy: strategy || 'snowball',
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
  }, [budgetData, outstandingDebts, strategy, loading, debtsLoading, availableSavings]);

  // Helper to calculate payoff summary
  const getPayoffSummary = () => {
    if (!payoffPlan) return null;
    // Total principal is just the sum of the loaded debts
    const totalPrincipal = outstandingDebts.reduce((sum, d) => sum + (d.balance || 0), 0);
    const totalInterest = payoffPlan.total_interest || 0;
    const totalPaid = totalInterest + totalPrincipal;
    return {
      months: payoffPlan.months,
      totalInterest,
      totalPrincipal,
      totalPaid
    };
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
      <div className="outstanding-debts-and-summary" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
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
        {renderPayoffSummaryTable()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '1rem' }}>
        {/* Show more historicals button */}
        {historicalMonthsShown < maxHistoricalMonths && (
          <button
            className="add-months-button"
            onClick={() => setHistoricalMonthsShown(historicalMonthsShown + 3)}
            style={{
              background: 'linear-gradient(90deg, #ff5858 0%, #6a8dff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.2rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #ff585866',
              transition: 'all 0.2s',
            }}
          >
            Show 3 more months
          </button>
        )}
        {/* Add months to projection button */}
        <button
          className="add-months-button"
          onClick={() => setProjectionMonths(projectionMonths + 6)}
          style={{
            background: 'linear-gradient(90deg, #6a8dff 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1.2rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(106,141,255,0.13)',
            transition: 'all 0.2s',
          }}
        >
          + 6 Months
        </button>
      </div>
      {outstandingDebts.length > 0 && renderPayoffTable()}
      <div className="debt-container">
        {renderGrid()}
      </div>
    </div>
  );
};

export default DebtPlanning; 