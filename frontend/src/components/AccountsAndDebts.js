import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  alpha,
  Tabs,                                                                           
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  PersonalVideo as PersonalVideoIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import accountsDebtsService from '../services/accountsDebtsService';
import Card from './common/Card';
import { Button } from './common/Button';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AccountsAndDebts() {
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingDebt, setEditingDebt] = useState(null);
  
  // Delete confirmation dialog states
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteDebtDialogOpen, setDeleteDebtDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [debtToDelete, setDebtToDelete] = useState(null);
  
  // Loading states for CRUD operations
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [debtDeleting, setDebtDeleting] = useState(false);
  
  // Default interest rates
  const defaultAccountRates = {
    checking: 0.01,
    savings: 4.25,
    investment: 7.0,
    other: 0.0
  };

  const defaultDebtRates = {
    'credit-card': 24.99,
    'personal-loan': 12.0,
    'student-loan': 5.5,
    'auto-loan': 7.5,
    'mortgage': 6.5,
    'other': 15.0
  };
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    name: '',
    balance: '',
    accountType: 'checking',
    interestRate: '0.01',
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  
  const [debtForm, setDebtForm] = useState({
    name: '',
    balance: '',
    debtType: 'credit-card',
    interestRate: '24.99',
    effectiveDate: new Date().toISOString().split('T')[0],
    payoffDate: ''
  });

  const accountTypes = [
    { value: 'checking', label: 'Checking Account', icon: <AccountBalanceIcon />, color: '#1976d2' },
    { value: 'savings', label: 'Savings Account', icon: <SavingsIcon />, color: '#2e7d32' },
    { value: 'investment', label: 'Investment Account', icon: <TrendingUpIcon />, color: '#7b1fa2' },
    { value: 'other', label: 'Other', icon: <ReceiptIcon />, color: '#ed6c02' }
  ];

  const debtTypes = [
    { value: 'credit-card', label: 'Credit Card', icon: <CreditCardIcon />, color: '#d32f2f' },
    { value: 'personal-loan', label: 'Personal Loan', icon: <PersonalVideoIcon />, color: '#f57c00' },
    { value: 'student-loan', label: 'Student Loan', icon: <SchoolIcon />, color: '#1976d2' },
    { value: 'auto-loan', label: 'Auto Loan', icon: <CarIcon />, color: '#388e3c' },
    { value: 'mortgage', label: 'Mortgage', icon: <HomeIcon />, color: '#7b1fa2' },
    { value: 'other', label: 'Other', icon: <ReceiptIcon />, color: '#616161' }
  ];

  useEffect(() => {
    fetchAccountsAndDebts();
  }, []);

  const fetchAccountsAndDebts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching fresh accounts and debts data...');
      const [accountsRes, debtsRes] = await Promise.all([
        accountsDebtsService.getAccounts(),
        accountsDebtsService.getDebts()
      ]);
      console.log('✅ Fetched accounts:', accountsRes?.length || 0, 'debts:', debtsRes?.length || 0);
      setAccounts(accountsRes || []);
      setDebts(debtsRes || []);
      console.log('✅ Data updated successfully');
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setSaveMessage('Error loading data. Please try again.');
      setAccounts([]);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function


  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    
    // Set loading state immediately when user clicks Add/Update button
    setAccountSubmitting(true);
    
    try {
      const data = {
        ...accountForm,
        balance: parseFloat(accountForm.balance),
        interestRate: parseFloat(accountForm.interestRate),
        effectiveDate: accountForm.effectiveDate
      };

      if (editingAccount) {
        console.log('✏️ Updating account:', editingAccount.id, editingAccount.name);
        const updatedAccount = await accountsDebtsService.updateAccount(editingAccount.id, data);
        console.log('✅ Account updated successfully:', updatedAccount);
        setSaveMessage('✅ Account updated successfully!');
      } else {
        console.log('➕ Creating new account:', data.name);
        const newAccount = await accountsDebtsService.createAccount(data);
        console.log('✅ Account created successfully:', newAccount);
        setSaveMessage('✅ Account added successfully!');
      }

      setAccountDialogOpen(false);
      setEditingAccount(null);
      resetAccountForm();
      
      // Add a small delay to ensure the backend has processed the request
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchAccountsAndDebts();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error saving account:', error);
      if (error.response && error.response.status === 404) {
        setSaveMessage('⚠️ Account not found. It may have been deleted. Refreshing data...');
        await fetchAccountsAndDebts();
      } else {
        setSaveMessage('❌ Error saving account. Please try again.');
      }
    } finally {
      // Always clear loading state whether success or failure
      setAccountSubmitting(false);
    }
  };

  const handleDebtSubmit = async (e) => {
    e.preventDefault();
    
    // Set loading state immediately when user clicks Add/Update button
    setDebtSubmitting(true);
    
    try {
      const data = {
        ...debtForm,
        balance: parseFloat(debtForm.balance),
        interestRate: parseFloat(debtForm.interestRate),
        effectiveDate: debtForm.effectiveDate,
        payoffDate: debtForm.payoffDate || null
      };

      if (editingDebt) {
        console.log('✏️ Updating debt:', editingDebt.id, editingDebt.name);
        const updatedDebt = await accountsDebtsService.updateDebt(editingDebt.id, data);
        console.log('✅ Debt updated successfully:', updatedDebt);
        setSaveMessage('✅ Debt updated successfully!');
      } else {
        console.log('➕ Creating new debt:', data.name);
        const newDebt = await accountsDebtsService.createDebt(data);
        console.log('✅ Debt created successfully:', newDebt);
        setSaveMessage('✅ Debt added successfully!');
      }

      setDebtDialogOpen(false);
      setEditingDebt(null);
      resetDebtForm();
      
      // Add a small delay to ensure the backend has processed the request
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchAccountsAndDebts();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error saving debt:', error);
      if (error.response && error.response.status === 404) {
        setSaveMessage('⚠️ Debt not found. It may have been deleted. Refreshing data...');
        await fetchAccountsAndDebts();
      } else {
        setSaveMessage('❌ Error saving debt. Please try again.');
      }
    } finally {
      // Always clear loading state whether success or failure
      setDebtSubmitting(false);
    }
  };

  const handleDeleteAccount = (account) => {
    console.log('🗑️ Delete account requested:', account);
    setAccountToDelete(account);
    setDeleteAccountDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (accountToDelete) {
      // Set loading state for delete operation
      setAccountDeleting(true);
      
      try {
        console.log('🗑️ Attempting to delete account:', accountToDelete.id, accountToDelete.name);
        await accountsDebtsService.deleteAccount(accountToDelete.id);
        setSaveMessage('✅ Account deleted successfully!');
        // Force refresh the data
        await fetchAccountsAndDebts();
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('❌ Error deleting account:', error);
        if (error.response && error.response.status === 404) {
          setSaveMessage('⚠️ Account not found. It may have been already deleted. Refreshing data...');
          // Refresh data if item not found
          await fetchAccountsAndDebts();
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          setSaveMessage('❌ Error deleting account. Please try again or refresh the data.');
        }
      }
    }
    setDeleteAccountDialogOpen(false);
    setAccountToDelete(null);
    setAccountDeleting(false);
  };

  const cancelDeleteAccount = () => {
    setDeleteAccountDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleDeleteDebt = (debt) => {
    console.log('🗑️ Delete debt requested:', debt);
    setDebtToDelete(debt);
    setDeleteDebtDialogOpen(true);
  };

  const confirmDeleteDebt = async () => {
    if (debtToDelete) {
      // Set loading state for delete operation
      setDebtDeleting(true);
      
      try {
        console.log('🗑️ Attempting to delete debt:', debtToDelete.id, debtToDelete.name);
        await accountsDebtsService.deleteDebt(debtToDelete.id);
        setSaveMessage('✅ Debt deleted successfully!');
        // Force refresh the data
        await fetchAccountsAndDebts();
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('❌ Error deleting debt:', error);
        if (error.response && error.response.status === 404) {
          setSaveMessage('⚠️ Debt not found. It may have been already deleted. Refreshing data...');
          // Refresh data if item not found
          await fetchAccountsAndDebts();
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          setSaveMessage('❌ Error deleting debt. Please try again or refresh the data.');
        }
      }
    }
    setDeleteDebtDialogOpen(false);
    setDebtToDelete(null);
    setDebtDeleting(false);
  };

  const cancelDeleteDebt = () => {
    setDeleteDebtDialogOpen(false);
    setDebtToDelete(null);
  };

  const resetAccountForm = () => {
    setAccountForm({
      name: '',
      balance: '',
      accountType: 'checking',
      interestRate: '0.01',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
  };

  const resetDebtForm = () => {
    setDebtForm({
      name: '',
      balance: '',
      debtType: 'credit-card',
      interestRate: '24.99',
      effectiveDate: new Date().toISOString().split('T')[0],
      payoffDate: ''
    });
  };

  const openAccountDialog = (account = null) => {
    if (account) {
      console.log('✏️ Opening account for editing:', account);
      setEditingAccount(account);
      setAccountForm({
        name: account.name,
        balance: account.balance.toString(),
        accountType: account.account_type,
        interestRate: account.interest_rate.toString(),
        effectiveDate: account.effective_date
      });
    } else {
      console.log('➕ Opening dialog for new account');
      setEditingAccount(null);
      resetAccountForm();
    }
    setAccountDialogOpen(true);
  };

  const openDebtDialog = (debt = null) => {
    if (debt) {
      console.log('✏️ Opening debt for editing:', debt);
      setEditingDebt(debt);
      setDebtForm({
        name: debt.name,
        balance: debt.balance.toString(),
        debtType: debt.debt_type,
        interestRate: debt.interest_rate.toString(),
        effectiveDate: debt.effective_date,
        payoffDate: debt.payoff_date || ''
      });
    } else {
      console.log('➕ Opening dialog for new debt');
      setEditingDebt(null);
      resetDebtForm();
    }
    setDebtDialogOpen(true);
  };

  const getTypeIcon = (type, isDebt = false) => {
    const types = isDebt ? debtTypes : accountTypes;
    const typeInfo = types.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : <ReceiptIcon />;
  };

  const getTypeColor = (type, isDebt = false) => {
    const types = isDebt ? debtTypes : accountTypes;
    const typeInfo = types.find(t => t.value === type);
    return typeInfo ? typeInfo.color : '#616161';
  };

  const getTypeLabel = (type, isDebt = false) => {
    const types = isDebt ? debtTypes : accountTypes;
    const typeInfo = types.find(t => t.value === type);
    return typeInfo ? typeInfo.label : type;
  };

  const calculateDebtPayoffTime = (debt) => {
    if (!debt.balance) return 'N/A';
    
    // If payoff date is provided, calculate exact time from today
    if (debt.payoff_date) {
      const today = new Date();
      const payoffDate = new Date(debt.payoff_date);
      
      // Calculate the difference in milliseconds
      const timeDiff = payoffDate.getTime() - today.getTime();
      
      // If the date is in the past, return 0
      if (timeDiff <= 0) return 0;
      
      // Calculate years, months, and days
      const years = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 365.25));
      const remainingMs = timeDiff % (1000 * 60 * 60 * 24 * 365.25);
      const months = Math.floor(remainingMs / (1000 * 60 * 60 * 24 * 30.44));
      const remainingDaysMs = remainingMs % (1000 * 60 * 60 * 24 * 30.44);
      const days = Math.floor(remainingDaysMs / (1000 * 60 * 60 * 24));
      
      return { years, months, days, totalMonths: years * 12 + months };
    }
    
    // Fallback to current calculation if no payoff date
    const balance = parseFloat(debt.balance);
    const rate = parseFloat(debt.interest_rate) / 100 / 12;
    
    // Calculate estimated minimum payment (2% of balance or interest-only payment)
    const estimatedPayment = Math.max(balance * 0.02, balance * rate);
    
    if (rate === 0) {
      const months = Math.ceil(balance / estimatedPayment);
      return { years: Math.floor(months / 12), months: months % 12, days: 0, totalMonths: months };
    }
    
    const totalMonths = Math.ceil(Math.log(1 + (balance * rate) / estimatedPayment) / Math.log(1 + rate));
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days: 0, totalMonths };
  };

  const totalAccountBalance = accounts?.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0) || 0;
  const totalDebtBalance = debts?.reduce((sum, debt) => sum + parseFloat(debt.balance || 0), 0) || 0;
  const netWorth = totalAccountBalance - totalDebtBalance;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Loading accounts and debts...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Accounts and Debts
      </Typography>

      {saveMessage && (
        <Alert 
          severity={saveMessage.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 3 }}
          onClose={() => setSaveMessage('')}
        >
          {saveMessage}
        </Alert>
      )}

      <Typography variant="body1" paragraph sx={{ mb: 3, color: 'text.secondary' }}>
        Manage your financial accounts and track your debt progress. Add your accounts, 
        monitor balances, and track your debt payoff journey.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Avatar sx={{ 
              bgcolor: alpha('#2e7d32', 0.1), 
              color: '#2e7d32',
              width: 60, 
              height: 60, 
              mx: 'auto', 
              mb: 2 
            }}>
              <AccountBalanceIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              ${totalAccountBalance.toLocaleString()}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Total Assets
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Avatar sx={{ 
              bgcolor: alpha('#d32f2f', 0.1), 
              color: '#d32f2f',
              width: 60, 
              height: 60, 
              mx: 'auto', 
              mb: 2 
            }}>
              <CreditCardIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              ${totalDebtBalance.toLocaleString()}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Total Debts
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Avatar sx={{ 
              bgcolor: alpha(netWorth >= 0 ? '#2e7d32' : '#d32f2f', 0.1), 
              color: netWorth >= 0 ? '#2e7d32' : '#d32f2f',
              width: 60, 
              height: 60, 
              mx: 'auto', 
              mb: 2 
            }}>
              {netWorth >= 0 ? <CheckCircleIcon sx={{ fontSize: 30 }} /> : <WarningIcon sx={{ fontSize: 30 }} />}
            </Avatar>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              color: netWorth >= 0 ? '#2e7d32' : '#d32f2f' 
            }}>
              ${netWorth.toLocaleString()}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Net Worth
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Accounts (${accounts?.length || 0})`} />
          <Tab label={`Debts (${debts?.length || 0})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Your Accounts
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openAccountDialog()}
              >
                Add Account
              </Button>
            </Box>
          </Box>

          {(accounts || []).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No accounts added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add your first account to get started tracking your finances.
              </Typography>
            </Box>
          ) : (
            <List>
              {(accounts || []).map((account) => (
                <ListItem key={account.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: alpha(getTypeColor(account.account_type), 0.1),
                      color: getTypeColor(account.account_type)
                    }}>
                      {getTypeIcon(account.account_type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {account.name}
                        </Typography>
                        <Chip 
                          label={getTypeLabel(account.account_type)}
                          size="small"
                          sx={{ 
                            bgcolor: alpha(getTypeColor(account.account_type), 0.1),
                            color: getTypeColor(account.account_type)
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                          ${account.balance.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.interest_rate}% interest rate
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => openAccountDialog(account)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteAccount(account)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Your Debts
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openDebtDialog()}
              >
                Add Debt
              </Button>
            </Box>
          </Box>

          {(debts || []).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No debts added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add your debts to track your payoff progress.
              </Typography>
            </Box>
          ) : (
            <List>
              {(debts || []).map((debt) => (
                <ListItem key={debt.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: alpha(getTypeColor(debt.debt_type, true), 0.1),
                      color: getTypeColor(debt.debt_type, true)
                    }}>
                      {getTypeIcon(debt.debt_type, true)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {debt.name}
                        </Typography>
                        <Chip 
                          label={getTypeLabel(debt.debt_type, true)}
                          size="small"
                          sx={{ 
                            bgcolor: alpha(getTypeColor(debt.debt_type, true), 0.1),
                            color: getTypeColor(debt.debt_type, true)
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                          ${debt.balance.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {debt.interest_rate}% interest rate
                        </Typography>
                        {(() => {
                          const payoffTime = calculateDebtPayoffTime(debt);
                          if (payoffTime === 'N/A') return null;
                          
                          if (payoffTime === 0) {
                            return (
                              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600, mt: 0.5 }}>
                                Paid Off!
                              </Typography>
                            );
                          }
                          
                          const { years, months, days, totalMonths } = payoffTime;
                          return (
                            <Box component="span" sx={{ mt: 0.5 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: debt.payoff_date ? '#4caf50' : (totalMonths > 60 ? '#f44336' : totalMonths > 24 ? '#ff9800' : '#4caf50')
                              }}>
                                {debt.payoff_date ? 'Target: ' : 'Payoff: '}
                                {years > 0 
                                  ? `${years}Y ${months}m` 
                                  : months > 0 
                                    ? `${months}M ${days}d`
                                    : `${days}D`
                                }
                              </Typography>
                              {debt.payoff_date && (
                                <Typography variant="caption" sx={{ 
                                  color: '#888',
                                  fontSize: '0.75rem',
                                  fontStyle: 'italic'
                                }}>
                                  {new Date(debt.payoff_date).getDate()}{new Date(debt.payoff_date).toLocaleDateString('en-US', { month: 'short' })}, {new Date(debt.payoff_date).getFullYear()}
                                </Typography>
                              )}
                            </Box>
                          );
                        })()}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => openDebtDialog(debt)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteDebt(debt)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit Account' : 'Add New Account'}
        </DialogTitle>
        <form onSubmit={handleAccountSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account Name"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Account Type"
                  value={accountForm.accountType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setAccountForm({
                      ...accountForm, 
                      accountType: newType,
                      interestRate: defaultAccountRates[newType].toString()
                    });
                  }}
                >
                  {accountTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Balance"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({...accountForm, balance: e.target.value})}
                  required
                  InputProps={{
                    startAdornment: <Typography>$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Interest Rate (%)"
                  value={accountForm.interestRate}
                  onChange={(e) => setAccountForm({...accountForm, interestRate: e.target.value})}
                  required
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Effective Date"
                  value={accountForm.effectiveDate}
                  onChange={(e) => setAccountForm({...accountForm, effectiveDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={accountSubmitting}
              startIcon={accountSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                minWidth: 140,
                '&:disabled': {
                  background: '#666',
                  color: '#ccc'
                }
              }}
            >
              {accountSubmitting 
                ? (editingAccount ? 'Updating...' : 'Adding...') 
                : (editingAccount ? 'Update Account' : 'Add Account')
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog open={debtDialogOpen} onClose={() => setDebtDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDebt ? 'Edit Debt' : 'Add New Debt'}
        </DialogTitle>
        <form onSubmit={handleDebtSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Debt Name"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Debt Type"
                  value={debtForm.debtType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setDebtForm({
                      ...debtForm, 
                      debtType: newType,
                      interestRate: defaultDebtRates[newType].toString()
                    });
                  }}
                >
                  {debtTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Balance"
                  value={debtForm.balance}
                  onChange={(e) => setDebtForm({...debtForm, balance: e.target.value})}
                  required
                  InputProps={{
                    startAdornment: <Typography>$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Interest Rate (%)"
                  value={debtForm.interestRate}
                  onChange={(e) => setDebtForm({...debtForm, interestRate: e.target.value})}
                  required
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Balance Effective Date"
                  value={debtForm.effectiveDate}
                  onChange={(e) => setDebtForm({...debtForm, effectiveDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                  helperText="When this balance was recorded"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Target Payoff Date (Optional)"
                  value={debtForm.payoffDate}
                  onChange={(e) => setDebtForm({...debtForm, payoffDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  helperText="When you plan to pay this off"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDebtDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={debtSubmitting}
              startIcon={debtSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                minWidth: 140,
                '&:disabled': {
                  background: '#666',
                  color: '#ccc'
                }
              }}
            >
              {debtSubmitting 
                ? (editingDebt ? 'Updating...' : 'Adding...') 
                : (editingDebt ? 'Update Debt' : 'Add Debt')
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteAccountDialogOpen}
        onClose={cancelDeleteAccount}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the account "{accountToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteAccount} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteAccount} 
            color="error" 
            variant="contained" 
            disabled={accountDeleting}
            startIcon={accountDeleting ? <CircularProgress size={20} color="inherit" /> : null}
            endIcon={!accountDeleting ? <DeleteIcon /> : null}
            sx={{ 
              minWidth: 140,
              '&:disabled': {
                background: '#666',
                color: '#ccc'
              }
            }}
          >
            {accountDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Debt Confirmation Dialog */}
      <Dialog
        open={deleteDebtDialogOpen}
        onClose={cancelDeleteDebt}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the debt "{debtToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteDebt} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteDebt} 
            color="error" 
            variant="contained" 
            disabled={debtDeleting}
            startIcon={debtDeleting ? <CircularProgress size={20} color="inherit" /> : null}
            endIcon={!debtDeleting ? <DeleteIcon /> : null}
            sx={{ 
              minWidth: 140,
              '&:disabled': {
                background: '#666',
                color: '#ccc'
              }
            }}
          >
            {debtDeleting ? 'Deleting...' : 'Delete Debt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountsAndDebts;
