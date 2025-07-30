import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Snackbar,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import DataTable from './common/DataTable';
import Chart from './common/Chart';
import Loading from './common/Loading';
import { Button as CustomButton } from './common/Button';
import CustomCard from './common/Card';

const DebtPlanning = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outstandingDebts, setOutstandingDebts] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [debtsError, setDebtsError] = useState(null);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [historicalMonthsShown, setHistoricalMonthsShown] = useState(3);
  const [maxHistoricalMonths, setMaxHistoricalMonths] = useState(0);
  const [editedBudgetData, setEditedBudgetData] = useState(null);
  const [localGridData, setLocalGridData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);

  useEffect(() => {
    loadBudgetData();
    loadDebtsData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/budgets/');
      
      if (response.data && response.data.length > 0) {
        const budget = response.data[0];
        setBudgetData(budget);
        setEditedBudgetData(budget);
        generateGridData(budget);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      setError('Failed to load budget data');
      setShowErrorSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const loadDebtsData = async () => {
    try {
      setDebtsLoading(true);
      const response = await accountsDebtsService.getDebts();
      setOutstandingDebts(response || []);
    } catch (error) {
      console.error('Error loading debts:', error);
      setDebtsError('Failed to load debt data');
    } finally {
      setDebtsLoading(false);
    }
  };

  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    // Historical months
    for (let i = historicalMonthsShown; i > 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'historical',
        date: date
      });
    }
    
    // Current month
    months.push({
      label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      type: 'current',
      date: currentDate
    });
    
    // Future months
    for (let i = 1; i <= projectionMonths; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'future',
        date: date
      });
    }
    
    return months;
  };

  const generateGridData = (budget) => {
    const months = generateMonths();
    const data = [];
    
    // Net savings row (first row)
    const netRow = { category: 'Net Savings', type: 'net', editable: false };
    months.forEach((month, idx) => {
      netRow[`month_${idx}`] = 0; // Will be calculated
    });
    data.push(netRow);
    
    // Income row
    const incomeRow = { category: 'Income', type: 'income', editable: true };
    months.forEach((month, idx) => {
      incomeRow[`month_${idx}`] = budget.income || 0;
    });
    data.push(incomeRow);
    
    // Expense rows
    const baseExpenses = [
      { name: 'Housing', field: 'housing' },
      { name: 'Transportation', field: 'transportation' },
      { name: 'Food', field: 'food' },
      { name: 'Healthcare', field: 'healthcare' },
      { name: 'Entertainment', field: 'entertainment' },
      { name: 'Shopping', field: 'shopping' },
      { name: 'Travel', field: 'travel' },
      { name: 'Education', field: 'education' },
      { name: 'Utilities', field: 'utilities' },
      { name: 'Childcare', field: 'childcare' },
      { name: 'Other', field: 'other' }
    ];
    
    baseExpenses.forEach(expense => {
      const row = { category: expense.name, type: 'expense', editable: true };
      months.forEach((month, idx) => {
        row[`month_${idx}`] = budget[expense.field] || 0;
      });
      data.push(row);
    });
    
    // Calculate net savings
    const netSavingsRow = data[0];
    months.forEach((month, idx) => {
      let income = 0;
      let expenses = 0;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.type === 'income') {
          income += parseFloat(row[`month_${idx}`]) || 0;
        } else if (row.type === 'expense') {
          expenses += parseFloat(row[`month_${idx}`]) || 0;
        }
      }
      
      netSavingsRow[`month_${idx}`] = income - expenses;
    });
    
    setLocalGridData(data);
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDebtPayoffTime = (debt) => {
    if (!debt.balance || !debt.minimum_payment || debt.minimum_payment <= 0) return 'N/A';
    
    const balance = parseFloat(debt.balance);
    const payment = parseFloat(debt.minimum_payment);
    const rate = parseFloat(debt.interest_rate) / 100 / 12;
    
    if (rate === 0) {
      return Math.ceil(balance / payment);
    }
    
    const months = Math.ceil(Math.log(1 + (balance * rate) / payment) / Math.log(1 + rate));
    return months;
  };

  const calculateTotalInterest = (debt) => {
    const payoffTime = calculateDebtPayoffTime(debt);
    if (payoffTime === 'N/A') return 0;
    
    const totalPaid = parseFloat(debt.minimum_payment) * payoffTime;
    return totalPaid - parseFloat(debt.balance);
  };

  const columns = useMemo(() => {
    const months = generateMonths();
    const cols = [
      {
        headerName: 'Category',
        field: 'category',
        pinned: 'left',
        width: 150,
        cellRenderer: ({ data }) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {data.type === 'net' && <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />}
            {data.type === 'income' && <MoneyIcon sx={{ mr: 1, color: theme.palette.success.main }} />}
            {data.type === 'expense' && <TrendingDownIcon sx={{ mr: 1, color: theme.palette.error.main }} />}
            <Typography variant="body2" sx={{ fontWeight: data.type === 'net' ? 'bold' : 'normal' }}>
              {data.category}
            </Typography>
          </Box>
        )
      }
    ];
    
    months.forEach((month, idx) => {
      cols.push({
        headerName: month.label,
        field: `month_${idx}`,
        width: 120,
        cellRenderer: ({ data, value }) => (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: data.type === 'net' ? (value >= 0 ? theme.palette.success.main : theme.palette.error.main) : 'inherit'
          }}>
            {formatCurrency(value)}
          </Box>
        )
      });
    });
    
    return cols;
  }, [theme, historicalMonthsShown, projectionMonths]);

  const debtColumns = [
    {
      headerName: 'Debt',
      field: 'name',
      width: 200,
      cellRenderer: ({ data }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: theme.palette.error.main }}>
            <AccountBalanceIcon />
          </Avatar>
          <Typography variant="body2">{data.name}</Typography>
        </Box>
      )
    },
    {
      headerName: 'Balance',
      field: 'balance',
      width: 120,
      cellRenderer: ({ value }) => formatCurrency(value)
    },
    {
      headerName: 'Interest Rate',
      field: 'interest_rate',
      width: 120,
      cellRenderer: ({ value }) => `${value}%`
    },
    {
      headerName: 'Min Payment',
      field: 'minimum_payment',
      width: 120,
      cellRenderer: ({ value }) => formatCurrency(value)
    },
    {
      headerName: 'Payoff Time',
      field: 'payoff_time',
      width: 120,
      cellRenderer: ({ data }) => {
        const months = calculateDebtPayoffTime(data);
        if (months === 'N/A') return 'N/A';
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return `${years}y ${remainingMonths}m`;
      }
    },
    {
      headerName: 'Total Interest',
      field: 'total_interest',
      width: 120,
      cellRenderer: ({ data }) => formatCurrency(calculateTotalInterest(data))
    }
  ];

  if (loading || debtsLoading) {
    return <Loading.PageLoader />;
  }

  const totalDebtBalance = outstandingDebts?.reduce((sum, debt) => sum + parseFloat(debt.balance || 0), 0) || 0;
  const totalMinPayments = outstandingDebts?.reduce((sum, debt) => sum + parseFloat(debt.minimum_payment || 0), 0) || 0;
  const totalInterest = outstandingDebts?.reduce((sum, debt) => sum + calculateTotalInterest(debt), 0) || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.text.primary,
            mb: 3
          }}>
            Debt Planning & Projection
          </Typography>

          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
                          <AccountBalanceIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(totalDebtBalance)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Debt
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CustomCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                          <MoneyIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(totalMinPayments)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Min Payments
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CustomCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                          <TrendingUpIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(totalInterest)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Interest
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CustomCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                          <ScheduleIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {outstandingDebts.length}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Active Debts
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CustomCard>
                </Grid>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Grid item xs={12}>
              <Paper elevation={1}>
                <Tabs
                  value={selectedTabIndex}
                  onChange={(e, newValue) => setSelectedTabIndex(newValue)}
                  indicatorColor="primary"
                  textColor="primary"
                  variant={isMobile ? "scrollable" : "standard"}
                  scrollButtons="auto"
                >
                  <Tab label="Budget Projection" icon={<TimelineIcon />} />
                  <Tab label="Debt Overview" icon={<AccountBalanceIcon />} />
                  <Tab label="Payoff Strategies" icon={<AssessmentIcon />} />
                </Tabs>
              </Paper>
            </Grid>

            {/* Tab Content */}
            <Grid item xs={12}>
              {selectedTabIndex === 0 && (
                <CustomCard elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Monthly Budget Projection
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Historical Months"
                          type="number"
                          value={historicalMonthsShown}
                          onChange={(e) => setHistoricalMonthsShown(parseInt(e.target.value))}
                          size="small"
                          sx={{ width: 140 }}
                        />
                        <TextField
                          label="Projection Months"
                          type="number"
                          value={projectionMonths}
                          onChange={(e) => setProjectionMonths(parseInt(e.target.value))}
                          size="small"
                          sx={{ width: 140 }}
                        />
                      </Box>
                    </Box>
                    
                    <DataTable
                      columns={columns}
                      rows={localGridData}
                      height={400}
                      pagination={false}
                    />
                  </CardContent>
                </CustomCard>
              )}

              {selectedTabIndex === 1 && (
                <CustomCard elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Outstanding Debts
                      </Typography>
                      <CustomButton
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => setEditDialogOpen(true)}
                      >
                        Add Debt
                      </CustomButton>
                    </Box>
                    
                    <DataTable
                      columns={debtColumns}
                      rows={outstandingDebts}
                      height={400}
                    />
                  </CardContent>
                </CustomCard>
              )}

              {selectedTabIndex === 2 && (
                <CustomCard elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Debt Payoff Strategies
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Coming soon: Debt avalanche and snowball strategies with interactive projections.
                    </Typography>
                  </CardContent>
                </CustomCard>
              )}
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowErrorSnackbar(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DebtPlanning;
