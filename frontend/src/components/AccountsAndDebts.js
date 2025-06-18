import React, { useState } from 'react';
import '../styles/AccountsAndDebts.css';

function AccountsAndDebts() {
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  
  // Form states for accounts
  const [accountForm, setAccountForm] = useState({
    name: '',
    balance: '',
    accountType: 'checking'
  });
  
  // Form states for debts
  const [debtForm, setDebtForm] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: ''
  });

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    const newAccount = {
      id: Date.now(),
      ...accountForm,
      balance: parseFloat(accountForm.balance) || 0
    };
    setAccounts([...accounts, newAccount]);
    setAccountForm({ name: '', balance: '', accountType: 'checking' });
    setShowAccountForm(false);
  };

  const handleDebtSubmit = (e) => {
    e.preventDefault();
    const newDebt = {
      id: Date.now(),
      ...debtForm,
      balance: parseFloat(debtForm.balance) || 0,
      interestRate: parseFloat(debtForm.interestRate) || 0,
      minimumPayment: parseFloat(debtForm.minimumPayment) || 0
    };
    setDebts([...debts, newDebt]);
    setDebtForm({ name: '', balance: '', interestRate: '', minimumPayment: '' });
    setShowDebtForm(false);
  };

  const deleteAccount = (id) => {
    setAccounts(accounts.filter(account => account.id !== id));
  };

  const deleteDebt = (id) => {
    setDebts(debts.filter(debt => debt.id !== id));
  };

  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);

  return (
    <div className="accounts-and-debts">
      <div className="accounts-and-debts-content">
        <h1>Accounts and Debts</h1>
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
                  onChange={(e) => setAccountForm({...accountForm, accountType: e.target.value})}
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
              </div>
              <div className="form-group">
                <label>Minimum Payment:</label>
                <input
                  type="number"
                  step="0.01"
                  value={debtForm.minimumPayment}
                  onChange={(e) => setDebtForm({...debtForm, minimumPayment: e.target.value})}
                  placeholder="0.00"
                  required
                />
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
                    <p className="item-balance negative">${debt.balance.toLocaleString()}</p>
                    <p className="item-details">
                      {debt.interestRate}% APR • Min Payment: ${debt.minimumPayment}
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