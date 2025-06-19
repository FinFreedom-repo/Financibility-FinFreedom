import React, { useState, useEffect } from 'react';
import accountsDebtsService from '../services/accountsDebtsService';
import '../styles/AccountsAndDebts.css';

function AccountsAndDebts() {
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Default interest rates based on market averages
  const defaultAccountRates = {
    checking: 0.01, // 0.01% - typical checking account rate
    savings: 4.25,  // 4.25% - high-yield savings average
    investment: 7.0, // 7.0% - average market return
    other: 0.0      // 0% - no interest
  };

  const defaultDebtRates = {
    'credit-card': 24.99,    // 24.99% - average credit card rate
    'personal-loan': 12.0,   // 12.0% - average personal loan rate
    'student-loan': 5.5,     // 5.5% - average student loan rate
    'auto-loan': 7.5,        // 7.5% - average auto loan rate
    'mortgage': 6.5,         // 6.5% - average mortgage rate
    'other': 15.0            // 15.0% - other debt average
  };
  
  // Form states for accounts
  const [accountForm, setAccountForm] = useState({
    name: '',
    balance: '',
    accountType: 'checking',
    interestRate: '0.01'
  });
  
  // Form states for debts
  const [debtForm, setDebtForm] = useState({
    name: '',
    balance: '',
    debtType: 'credit-card',
    interestRate: '24.99'
  });

  // Load data on component mount
  useEffect(() => {
    loadAccountsDebts();
  }, []);

  const loadAccountsDebts = async () => {
    try {
      setLoading(true);
      const data = await accountsDebtsService.getAccountsDebtsSummary();
      
      // Map backend data to frontend format
      const mappedAccounts = (data.accounts || []).map(account => ({
        id: account.id,
        name: account.name,
        accountType: account.account_type,
        balance: parseFloat(account.balance),
        interestRate: parseFloat(account.interest_rate)
      }));
      
      const mappedDebts = (data.debts || []).map(debt => ({
        id: debt.id,
        name: debt.name,
        debtType: debt.debt_type,
        balance: parseFloat(debt.balance),
        interestRate: parseFloat(debt.interest_rate)
      }));
      
      setAccounts(mappedAccounts);
      setDebts(mappedDebts);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading accounts and debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeChange = (accountType) => {
    setAccountForm({
      ...accountForm,
      accountType,
      interestRate: defaultAccountRates[accountType].toString()
    });
  };

  const handleDebtTypeChange = (debtType) => {
    setDebtForm({
      ...debtForm,
      debtType,
      interestRate: defaultDebtRates[debtType].toString()
    });
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    const newAccount = {
      id: Date.now(),
      ...accountForm,
      balance: parseFloat(accountForm.balance) || 0,
      interestRate: parseFloat(accountForm.interestRate) || 0
    };
    setAccounts([...accounts, newAccount]);
    setAccountForm({ 
      name: '', 
      balance: '', 
      accountType: 'checking',
      interestRate: '0.01'
    });
    setShowAccountForm(false);
    setHasChanges(true);
  };

  const handleDebtSubmit = (e) => {
    e.preventDefault();
    const newDebt = {
      id: Date.now(),
      ...debtForm,
      balance: parseFloat(debtForm.balance) || 0,
      interestRate: parseFloat(debtForm.interestRate) || 0
    };
    setDebts([...debts, newDebt]);
    setDebtForm({ 
      name: '', 
      balance: '', 
      debtType: 'credit-card',
      interestRate: '24.99'
    });
    setShowDebtForm(false);
    setHasChanges(true);
  };

  const deleteAccount = (id) => {
    setAccounts(accounts.filter(account => account.id !== id));
    setHasChanges(true);
  };

  const deleteDebt = (id) => {
    setDebts(debts.filter(debt => debt.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage('');
      
      // Prepare data for backend (remove frontend-generated IDs)
      const accountsForBackend = accounts.map(account => ({
        name: account.name,
        account_type: account.accountType,
        balance: account.balance,
        interest_rate: account.interestRate
      }));

      const debtsForBackend = debts.map(debt => ({
        name: debt.name,
        debt_type: debt.debtType,
        balance: debt.balance,
        interest_rate: debt.interestRate
      }));

      await accountsDebtsService.bulkSaveAccountsDebts(accountsForBackend, debtsForBackend);
      
      // Reload data to get proper IDs from backend
      await loadAccountsDebts();
      
      setSaveMessage('Changes saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving accounts and debts:', error);
      setSaveMessage('Error saving changes. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);

  if (loading) {
    return (
      <div className="accounts-and-debts">
        <div className="accounts-and-debts-content">
          <div className="loading-message">Loading accounts and debts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-and-debts">
      <div className="accounts-and-debts-content">
        <div className="page-header">
          <h1>Accounts and Debts</h1>
          <div className="header-actions">
            {hasChanges && (
              <button 
                className="save-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            {saveMessage && (
              <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
        
        <p className="welcome-message">
          Manage your financial accounts and track your debt progress. Add your accounts, 
          monitor balances, and track your debt payoff journey.
        </p>
        
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Account Balance</h3>
            <p className="balance-amount positive">${totalAccountBalance.toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <h3>Total Debt Balance</h3>
            <p className="balance-amount negative">${totalDebtBalance.toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <h3>Net Worth</h3>
            <p className={`balance-amount ${totalAccountBalance - totalDebtBalance >= 0 ? 'positive' : 'negative'}`}>
              ${(totalAccountBalance - totalDebtBalance).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="accounts-section">
          <div className="section-header">
            <h2>Your Accounts</h2>
            <button 
              className="add-button"
              onClick={() => setShowAccountForm(!showAccountForm)}
            >
              {showAccountForm ? 'Cancel' : 'Add Account'}
            </button>
          </div>
          
          {showAccountForm && (
            <form className="form-card" onSubmit={handleAccountSubmit}>
              <h3>Add New Account</h3>
              <div className="form-group">
                <label>Account Name:</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                  placeholder="e.g., Chase Checking"
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Type:</label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => handleAccountTypeChange(e.target.value)}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Current Balance:</label>
                <input
                  type="number"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({...accountForm, balance: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={accountForm.interestRate}
                  onChange={(e) => setAccountForm({...accountForm, interestRate: e.target.value})}
                  placeholder="0.00"
                  required
                />
                <small className="form-hint">
                  Suggested: {defaultAccountRates[accountForm.accountType]}% for {accountForm.accountType} accounts
                </small>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">Add Account</button>
              </div>
            </form>
          )}
          
          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>No accounts added yet. Click "Add Account" to get started.</p>
            </div>
          ) : (
            <div className="items-list">
              {accounts.map(account => (
                <div key={account.id} className="item-card">
                  <div className="item-info">
                    <h4>{account.name}</h4>
                    <p className="item-type">{account.accountType}</p>
                    <p className="item-balance positive">${account.balance.toLocaleString()}</p>
                    <p className="item-details">
                      {account.interestRate}% APY
                    </p>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => deleteAccount(account.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="debts-section">
          <div className="section-header">
            <h2>Your Debts</h2>
            <button 
              className="add-button"
              onClick={() => setShowDebtForm(!showDebtForm)}
            >
              {showDebtForm ? 'Cancel' : 'Add Debt'}
            </button>
          </div>
          
          {showDebtForm && (
            <form className="form-card" onSubmit={handleDebtSubmit}>
              <h3>Add New Debt</h3>
              <div className="form-group">
                <label>Debt Name:</label>
                <input
                  type="text"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
                  placeholder="e.g., Chase Credit Card"
                  required
                />
              </div>
              <div className="form-group">
                <label>Debt Type:</label>
                <select
                  value={debtForm.debtType}
                  onChange={(e) => handleDebtTypeChange(e.target.value)}
                >
                  <option value="credit-card">Credit Card</option>
                  <option value="personal-loan">Personal Loan</option>
                  <option value="student-loan">Student Loan</option>
                  <option value="auto-loan">Auto Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Current Balance:</label>
                <input
                  type="number"
                  step="0.01"
                  value={debtForm.balance}
                  onChange={(e) => setDebtForm({...debtForm, balance: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={debtForm.interestRate}
                  onChange={(e) => setDebtForm({...debtForm, interestRate: e.target.value})}
                  placeholder="0.00"
                  required
                />
                <small className="form-hint">
                  Suggested: {defaultDebtRates[debtForm.debtType]}% for {debtForm.debtType.replace('-', ' ')}s
                </small>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">Add Debt</button>
              </div>
            </form>
          )}
          
          {debts.length === 0 ? (
            <div className="empty-state">
              <p>No debts added yet. Click "Add Debt" to get started.</p>
            </div>
          ) : (
            <div className="items-list">
              {debts.map(debt => (
                <div key={debt.id} className="item-card">
                  <div className="item-info">
                    <h4>{debt.name}</h4>
                    <p className="item-type">{debt.debtType.replace('-', ' ')}</p>
                    <p className="item-balance negative">${debt.balance.toLocaleString()}</p>
                    <p className="item-details">
                      {debt.interestRate}% APR
                    </p>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => deleteDebt(debt.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountsAndDebts; 