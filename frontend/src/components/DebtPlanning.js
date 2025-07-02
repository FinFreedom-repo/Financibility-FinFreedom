import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import '../styles/DebtPlanning.css';
import ReactDOM from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

const DebtPlanning = () => {
  console.log('DebtPlanning component mounting...');
  
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

  // Add state for edited budget data
  const [editedBudgetData, setEditedBudgetData] = useState(null);

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

  // When budgetData loads, initialize editedBudgetData
  useEffect(() => {
    if (budgetData) {
      setEditedBudgetData({
        ...budgetData,
        additional_items: budgetData.additional_items ? [...budgetData.additional_items] : [],
      });
    }
  }, [budgetData]);

  // Helper to update income/expense in editedBudgetData
  const handleBudgetCellChange = (type, idx, value) => {
    setEditedBudgetData(prev => {
      if (!prev) return prev;
      let updated = { ...prev };
      if (type === 'income') {
        if (idx === 0) {
          updated.income = value;
        } else {
          updated.additional_items = updated.additional_items.map((item, i) =>
            item.type === 'income' && i === idx - 1 ? { ...item, amount: value } : item
          );
        }
      } else if (type === 'expense') {
        if (idx < 11) {
          // base expenses
          const keys = ['housing','transportation','food','healthcare','entertainment','shopping','travel','education','utilities','childcare','other'];
          updated[keys[idx]] = value;
        } else {
          updated.additional_items = updated.additional_items.map((item, i) =>
            item.type === 'expense' && i === idx - 11 ? { ...item, amount: value } : item
          );
        }
      }
      return updated;
    });
  };

  // When editedBudgetData changes, recalc net savings and trigger payoff plan
  useEffect(() => {
    if (!editedBudgetData) return;
    // Recalculate categories
    // ... (reuse your category logic from useEffect for budgetData)
    // Optionally, trigger debt payoff plan update here if needed
  }, [editedBudgetData]);

  // Restore renderGrid with dynamic logic
  const renderGrid = () => {
    if (!editedBudgetData) return null;
    const months = generateMonths();
    const debtFreeCol = findDebtFreeColIdx(payoffPlan, months);
    const debtFreeColIdx = debtFreeCol ? debtFreeCol.idx : null;
    const debtFreeCols = Array(months.length).fill(false);
    if (debtFreeColIdx !== null) debtFreeCols[debtFreeColIdx] = true;

    // Calculate categories from editedBudgetData
    const baseIncome = [{ name: 'Income', value: editedBudgetData.income, type: 'income' }];
    const baseExpenses = [
      { name: 'Housing', value: editedBudgetData.housing, type: 'expense' },
      { name: 'Transportation', value: editedBudgetData.transportation, type: 'expense' },
      { name: 'Food', value: editedBudgetData.food, type: 'expense' },
      { name: 'Healthcare', value: editedBudgetData.healthcare, type: 'expense' },
      { name: 'Entertainment', value: editedBudgetData.entertainment, type: 'expense' },
      { name: 'Shopping', value: editedBudgetData.shopping, type: 'expense' },
      { name: 'Travel', value: editedBudgetData.travel, type: 'expense' },
      { name: 'Education', value: editedBudgetData.education, type: 'expense' },
      { name: 'Utilities', value: editedBudgetData.utilities, type: 'expense' },
      { name: 'Childcare', value: editedBudgetData.childcare, type: 'expense' },
      { name: 'Other', value: editedBudgetData.other, type: 'expense' }
    ];
    let additionalIncome = [];
    let additionalExpenses = [];
    if (editedBudgetData.additional_items) {
      additionalIncome = editedBudgetData.additional_items
        .filter(item => item.type === 'income')
        .map(item => ({
          name: item.name,
          value: item.amount,
          type: 'income'
        }));
      additionalExpenses = editedBudgetData.additional_items
        .filter(item => item.type === 'expense')
        .map(item => ({
          name: item.name,
          value: item.amount,
          type: 'expense'
        }));
    }
    const incomeCategories = [...baseIncome, ...additionalIncome];
    const expenseCategories = [...baseExpenses, ...additionalExpenses];

    // Build AG Grid columns
    const columnDefs = [
      {
        headerName: 'Category',
        field: 'category',
        pinned: 'left',
        editable: false,
        cellClass: params => {
          if (params.value === 'Net Savings') return 'net-savings-category-cell';
          if (incomeCategories.some(cat => cat.name === params.value)) return 'income-category-cell';
          if (expenseCategories.some(cat => cat.name === params.value)) return 'expense-category-cell';
          return 'ag-category-cell';
        }
      },
      ...months.map((month, idx) => ({
        headerName: month.label,
        field: `month_${idx}`,
        editable: month.type === 'current' || month.type === 'future',
        cellClass: params => {
          let classes = '';
          if (month.type === 'historical') classes += ' ag-historical-cell';
          if (month.type === 'current') classes += ' ag-current-cell';
          if (month.type === 'future') classes += ' ag-projected-cell';
          if (debtFreeCols[idx]) classes += ' debt-free-col';
          return classes;
        },
        valueFormatter: params => typeof params.value === 'number' ? params.value.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) : params.value,
      }))
    ];

    // Build AG Grid row data
    const rowData = [];
    // Net Savings row (read-only)
    const incomeTotal = incomeCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
    const expenseTotal = expenseCategories.reduce((sum, cat) => sum + (cat.value || 0), 0);
    const totalSavings = editedBudgetData.savings ? editedBudgetData.savings.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
    const netSavingsValue = incomeTotal - expenseTotal - totalSavings;
    const netSavingsRow = { category: 'Net Savings' };
    months.forEach((month, idx) => {
      netSavingsRow[`month_${idx}`] = netSavingsValue;
    });
    rowData.push(netSavingsRow);
    // Income rows
    incomeCategories.forEach((cat, i) => {
      const row = { category: cat.name };
      months.forEach((month, idx) => {
        row[`month_${idx}`] = cat.value;
      });
      rowData.push(row);
    });
    // Expense rows
    expenseCategories.forEach((cat, i) => {
      const row = { category: cat.name };
      months.forEach((month, idx) => {
        row[`month_${idx}`] = cat.value;
      });
      rowData.push(row);
    });

    // Handle cell edit
    const onCellValueChanged = params => {
      const { data, colDef, newValue } = params;
      const colIdx = parseInt(colDef.field.replace('month_', ''));
      const month = months[colIdx];
      if (!month || month.type === 'historical') return;
      // Find and update the correct category in editedBudgetData
      setEditedBudgetData(prev => {
        let updated = { ...prev };
        // Income
        if (data.category === 'Income') {
          updated.income = parseFloat(newValue) || 0;
        } else if (incomeCategories.some(cat => cat.name === data.category)) {
          updated.additional_items = updated.additional_items.map(item =>
            item.type === 'income' && item.name === data.category ? { ...item, amount: parseFloat(newValue) || 0 } : item
          );
        } else if (expenseCategories.some(cat => cat.name === data.category)) {
          // Expense
          const baseExpenseNames = ['Housing','Transportation','Food','Healthcare','Entertainment','Shopping','Travel','Education','Utilities','Childcare','Other'];
          const baseIdx = baseExpenseNames.indexOf(data.category);
          if (baseIdx !== -1) {
            updated[baseExpenseNames[baseIdx].toLowerCase()] = parseFloat(newValue) || 0;
          } else {
            updated.additional_items = updated.additional_items.map(item =>
              item.type === 'expense' && item.name === data.category ? { ...item, amount: parseFloat(newValue) || 0 } : item
            );
          }
        }
        return updated;
      });
    };

    if (!editedBudgetData) {
      return <div style={{padding: '2rem', color: 'red'}}>No budget data loaded.</div>;
    }
    if (!months || months.length === 0) {
      return <div style={{padding: '2rem', color: 'red'}}>No months generated.</div>;
    }
    if (!incomeCategories || incomeCategories.length === 0) {
      return <div style={{padding: '2rem', color: 'red'}}>No income categories.</div>;
    }
    if (!expenseCategories || expenseCategories.length === 0) {
      return <div style={{padding: '2rem', color: 'red'}}>No expense categories.</div>;
    }
    if (!rowData || !columnDefs || rowData.length === 0 || columnDefs.length === 0) {
      return <div style={{padding: '2rem', color: 'red'}}>No data to display in the table.</div>;
    }

    return (
      <div className="ag-theme-alpine custom-budget-grid" style={{ width: '100%', minHeight: 400 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          onCellValueChanged={onCellValueChanged}
          suppressMovableColumns={true}
          suppressMenuHide={true}
          stopEditingWhenCellsLoseFocus={true}
          singleClickEdit={true}
          defaultColDef={{ resizable: true }}
        />
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
        <div className="debt-table-legend legend-margin">
          <span className="legend-historical">🕰️ <span className="legend-label">Historical</span></span>
          <span className="legend-sep">|</span>
          <span className="legend-current">📅 <span className="legend-label">Current</span></span>
          <span className="legend-sep">|</span>
          <span className="legend-projected">🔮 <span className="legend-label">Projected</span></span>
        </div>
        {renderGrid()}
      </div>
    </div>
  );
};

export default DebtPlanning;