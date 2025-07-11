import React, { useState, useEffect } from 'react';
import accountsDebtsService from '../services/accountsDebtsService';
import '../styles/AccountsAndDebts.css';

function AccountsAndDebts() {
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Editing states
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingDebt, setEditingDebt] = useState(null);
  
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
    interestRate: '0.01',
    effectiveDate: new Date().toISOString().split('T')[0] // Default to today
  });
  
  // Form states for debts
  const [debtForm, setDebtForm] = useState({
    name: '',
    balance: '',
    debtType: 'credit-card',
    interestRate: '24.99',
    effectiveDate: new Date().toISOString().split('T')[0] // Default to today
  });

  // History viewing states
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyType, setHistoryType] = useState(''); // 'account' or 'debt'
  const [historyName, setHistoryName] = useState('');

  // Add state for collapsible sections
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [debtsOpen, setDebtsOpen] = useState(true);
  const [paidOffOpen, setPaidOffOpen] = useState(false);

  // Filter debts into active and paid-off
  const activeDebts = debts.filter(debt => debt.balance > 0);
  const paidOffDebts = debts.filter(debt => debt.balance === 0);

  // Load data on component mount
  useEffect(() => {
    loadAccountsDebts();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingAccount) {
      setAccountForm({
        name: editingAccount.name,
        balance: editingAccount.balance.toString(),
        accountType: editingAccount.accountType,
        interestRate: editingAccount.interestRate.toString(),
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingAccount]);

  useEffect(() => {
    if (editingDebt) {
      setDebtForm({
        name: editingDebt.name,
        balance: editingDebt.balance.toString(),
        debtType: editingDebt.debtType,
        interestRate: editingDebt.interestRate.toString(),
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingDebt]);

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

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      const accountData = {
        name: accountForm.name,
        account_type: accountForm.accountType,
        balance: parseFloat(accountForm.balance) || 0,
        interest_rate: parseFloat(accountForm.interestRate) || 0,
        effective_date: accountForm.effectiveDate || new Date().toISOString().split('T')[0]
      };
      
      console.log('Sending account data:', accountData);
      await accountsDebtsService.createAccount(accountData);
      
      // Reset form and editing state
      setAccountForm({ 
        name: '', 
        balance: '', 
        accountType: 'checking',
        interestRate: '0.01',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setShowAccountForm(false);
      setEditingAccount(null);
      
      // Reload data
      await loadAccountsDebts();
      
      setSaveMessage(editingAccount ? 'Account updated successfully!' : 'Account added successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error adding account:', error);
      console.error('Error response:', error.response?.data);
      setSaveMessage('Error adding account. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleDebtSubmit = async (e) => {
    e.preventDefault();
    try {
      const debtData = {
        name: debtForm.name,
        debt_type: debtForm.debtType,
        balance: parseFloat(debtForm.balance) || 0,
        interest_rate: parseFloat(debtForm.interestRate) || 0,
        effective_date: debtForm.effectiveDate || new Date().toISOString().split('T')[0]
      };
      
      console.log('Sending debt data:', debtData);
      await accountsDebtsService.createDebt(debtData);
      
      // Reset form and editing state
      setDebtForm({ 
        name: '', 
        balance: '', 
        debtType: 'credit-card',
        interestRate: '24.99',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setShowDebtForm(false);
      setEditingDebt(null);
      
      // Reload data
      await loadAccountsDebts();
      
      setSaveMessage(editingDebt ? 'Debt updated successfully!' : 'Debt added successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error adding debt:', error);
      console.error('Error response:', error.response?.data);
      setSaveMessage('Error adding debt. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const deleteAccount = async (id) => {
    try {
      await accountsDebtsService.deleteAccount(id);
      await loadAccountsDebts();
      setSaveMessage('Account deleted successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setSaveMessage('Error deleting account. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const deleteDebt = async (id) => {
    try {
      await accountsDebtsService.deleteDebt(id);
      await loadAccountsDebts();
      setSaveMessage('Debt deleted successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting debt:', error);
      setSaveMessage('Error deleting debt. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const viewHistory = async (type, name) => {
    try {
      setHistoryType(type);
      setHistoryName(name);
      
      // Fetch history from backend
      const response = await accountsDebtsService.getHistory(type, name);
      setHistoryData(response);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      setSaveMessage('Error loading history. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const closeHistory = () => {
    setShowHistory(false);
    setHistoryData([]);
    setHistoryType('');
    setHistoryName('');
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
          {saveMessage && (
            <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </span>
          )}
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
          <div className="section-header" style={{cursor: 'pointer'}} onClick={() => setAccountsOpen(!accountsOpen)}>
            <h2>Your Accounts</h2>
            <button 
              className="add-button"
              onClick={e => { e.stopPropagation(); setShowAccountForm(!showAccountForm); }}
            >
              {showAccountForm ? 'Cancel' : 'Add Account'}
            </button>
            <span style={{marginLeft: '1rem'}}>{accountsOpen ? '▼' : '►'}</span>
          </div>
          {accountsOpen && (
            <>
            {showAccountForm && (
              <form className="form-card" onSubmit={handleAccountSubmit}>
                <h3>{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
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
                <div className="form-group">
                  <label>Effective Date:</label>
                  <input
                    type="date"
                    value={accountForm.effectiveDate}
                    onChange={(e) => setAccountForm({...accountForm, effectiveDate: e.target.value})}
                    required
                  />
                  <small className="form-hint">
                    Date this balance is effective for (defaults to today)
                  </small>
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowAccountForm(false);
                      setEditingAccount(null);
                      setAccountForm({
                        name: '',
                        balance: '',
                        accountType: 'checking',
                        interestRate: '0.01',
                        effectiveDate: new Date().toISOString().split('T')[0]
                      });
                    }}
                  >
                    Cancel
                  </button>
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
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingAccount(account);
                          setShowAccountForm(true);
                        }}
                      >
                        Update
                      </button>
                      <button 
                        className="history-button"
                        onClick={() => viewHistory('account', account.name)}
                      >
                        View History
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => deleteAccount(account.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}
        </div>

        <div className="debts-section">
          <div className="section-header" style={{cursor: 'pointer'}} onClick={() => setDebtsOpen(!debtsOpen)}>
            <h2>Your Debts</h2>
            <button 
              className="add-button"
              onClick={e => { e.stopPropagation(); setShowDebtForm(!showDebtForm); }}
            >
              {showDebtForm ? 'Cancel' : 'Add Debt'}
            </button>
            <span style={{marginLeft: '1rem'}}>{debtsOpen ? '▼' : '►'}</span>
          </div>
          {debtsOpen && (
            <>
            {showDebtForm && (
              <form className="form-card" onSubmit={handleDebtSubmit}>
                <h3>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h3>
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
                <div className="form-group">
                  <label>Effective Date:</label>
                  <input
                    type="date"
                    value={debtForm.effectiveDate}
                    onChange={(e) => setDebtForm({...debtForm, effectiveDate: e.target.value})}
                    required
                  />
                  <small className="form-hint">
                    Date this balance is effective for (defaults to today)
                  </small>
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    {editingDebt ? 'Update Debt' : 'Add Debt'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowDebtForm(false);
                      setEditingDebt(null);
                      setDebtForm({
                        name: '',
                        balance: '',
                        debtType: 'credit-card',
                        interestRate: '24.99',
                        effectiveDate: new Date().toISOString().split('T')[0]
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {activeDebts.length === 0 ? (
              <div className="empty-state">
                <p>No debts added yet. Click "Add Debt" to get started.</p>
              </div>
            ) : (
              <div className="items-list">
                {activeDebts.map(debt => (
                  <div key={debt.id} className="item-card">
                    <div className="item-info">
                      <h4>{debt.name}</h4>
                      <p className="item-type">{debt.debtType.replace('-', ' ')}</p>
                      <p className="item-balance negative">${debt.balance.toLocaleString()}</p>
                      <p className="item-details">
                        {debt.interestRate}% APR
                      </p>
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingDebt(debt);
                          setShowDebtForm(true);
                        }}
                      >
                        Update
                      </button>
                      <button 
                        className="history-button"
                        onClick={() => viewHistory('debt', debt.name)}
                      >
                        View History
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => deleteDebt(debt.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}
        </div>

        {/* Paid Off Debts Section */}
        <div className="debts-section">
          <div className="section-header" style={{cursor: 'pointer'}} onClick={() => setPaidOffOpen(!paidOffOpen)}>
            <h2>Paid Off Debts</h2>
            <span style={{marginLeft: '1rem'}}>{paidOffOpen ? '▼' : '►'}</span>
          </div>
          {paidOffOpen && (
            paidOffDebts.length === 0 ? (
              <div className="empty-state">
                <p>No debts have been paid off yet.</p>
              </div>
            ) : (
              <div className="items-list">
                {paidOffDebts.map(debt => (
                  <div key={debt.id} className="item-card">
                    <div className="item-info">
                      <h4>{debt.name}</h4>
                      <p className="item-type">{debt.debtType.replace('-', ' ')}</p>
                      <p className="item-balance positive">$0.00</p>
                      <p className="item-details">
                        {debt.interestRate}% APR
                      </p>
                    </div>
                    <div className="item-actions">
                      <button 
                        className="history-button"
                        onClick={() => viewHistory('debt', debt.name)}
                      >
                        View History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="history-modal-overlay" onClick={closeHistory}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>{historyType === 'account' ? 'Account' : 'Debt'} History: {historyName}</h3>
              <button className="close-button" onClick={closeHistory}>×</button>
            </div>
            <div className="history-modal-content">
              {historyData.length === 0 ? (
                <p>No history found for this {historyType}.</p>
              ) : (
                <div className="history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Effective Date</th>
                        <th>Balance</th>
                        <th>Interest Rate</th>
                        <th>Updated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, index) => (
                        <tr key={index}>
                          <td>{new Date(item.effective_date).toLocaleDateString()}</td>
                          <td className={historyType === 'account' ? 'positive' : 'negative'}>
                            ${parseFloat(item.balance).toLocaleString()}
                          </td>
                          <td>{item.interest_rate}%</td>
                          <td>{new Date(item.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsAndDebts; 