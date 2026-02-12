import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  Avatar,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PieChart as PieChartIcon,
  AttachMoney as MoneyIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import VoiceBudgetInput from './VoiceBudgetInput';

/**
 * EXAMPLE: Accordion-based Budget with Voice Input
 * 
 * This shows the structure for the accordion-based Monthly Budget page.
 * Copy this pattern into your MonthlyBudget.js file.
 */
function AccordionBudgetExample() {
  // Form data state
  const [formData, setFormData] = useState({
    income: '',
    housing: '',
    food: '',
    transportation: '',
    utilities: '',
    emergency_fund: '',
    retirement: '',
  });

  // Accordion expansion state
  const [expandedAccordions, setExpandedAccordions] = useState({
    overview: true,
    income: false,
    expenses: false,
    savings: false,
    stats: false,
  });

  // Handle accordion expand/collapse
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [panel]: isExpanded,
    }));
  };

  // Calculate summary
  const summary = {
    totalIncome: parseFloat(formData.income) || 0,
    totalExpenses: (parseFloat(formData.housing) || 0) + 
                   (parseFloat(formData.food) || 0) + 
                   (parseFloat(formData.transportation) || 0) + 
                   (parseFloat(formData.utilities) || 0),
    totalSavings: (parseFloat(formData.emergency_fund) || 0) + 
                  (parseFloat(formData.retirement) || 0),
  };
  summary.netBalance = summary.totalIncome - summary.totalExpenses - summary.totalSavings;

  // Handle voice input data
  const handleVoiceData = (parsedData) => {
    console.log('Voice data:', parsedData);
    
    // Apply income
    if (parsedData.income) {
      setFormData(prev => ({ ...prev, income: parsedData.income }));
      setExpandedAccordions(prev => ({ ...prev, income: true }));
    }
    
    // Apply expenses
    if (parsedData.expenses) {
      const updates = {};
      Object.entries(parsedData.expenses).forEach(([key, value]) => {
        if (value > 0) updates[key] = value;
      });
      setFormData(prev => ({ ...prev, ...updates }));
      if (Object.keys(updates).length > 0) {
        setExpandedAccordions(prev => ({ ...prev, expenses: true }));
      }
    }
    
    // Apply savings
    if (parsedData.savings) {
      const updates = {};
      Object.entries(parsedData.savings).forEach(([key, value]) => {
        if (value > 0) updates[key] = value;
      });
      setFormData(prev => ({ ...prev, ...updates }));
      if (Object.keys(updates).length > 0) {
        setExpandedAccordions(prev => ({ ...prev, savings: true }));
      }
    }
  };

  // Helper to check if field is filled
  const isFilled = (value) => value && parseFloat(value) > 0;

  // Field component with visual indicators
  const BudgetField = ({ label, value, onChange, ...props }) => (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      size="small"
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: isFilled(value) ? 'success.main' : 'warning.main',
            borderWidth: 2,
          }
        }
      }}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        endAdornment: isFilled(value) && (
          <InputAdornment position="end">
            <CheckIcon color="success" fontSize="small" />
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🎤 Voice-Powered Budget (Accordion Example)
      </Typography>
      
      {/* Voice Input - Always at top */}
      <VoiceBudgetInput 
        currentBudgetData={formData}
        onDataParsed={handleVoiceData}
      />

      {/* Accordion Sections */}
      <Stack spacing={3} sx={{ mt: 3 }}>
        
        {/* Overview Accordion */}
        <Accordion 
          expanded={expandedAccordions.overview}
          onChange={handleAccordionChange('overview')}
          sx={{ borderRadius: 2, '&:before': { display: 'none' }, boxShadow: 3 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: expandedAccordions.overview ? '8px 8px 0 0' : 2,
              minHeight: 64,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PieChartIcon />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  📊 Overview & Summary
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Quick snapshot of your finances
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)', borderRadius: 2, textAlign: 'center', color: 'white' }}>
                  <Typography variant="h6" fontWeight="bold">${summary.totalIncome.toLocaleString()}</Typography>
                  <Typography variant="caption">Income</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)', borderRadius: 2, textAlign: 'center', color: 'white' }}>
                  <Typography variant="h6" fontWeight="bold">${summary.totalExpenses.toLocaleString()}</Typography>
                  <Typography variant="caption">Expenses</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)', borderRadius: 2, textAlign: 'center', color: 'white' }}>
                  <Typography variant="h6" fontWeight="bold">${summary.totalSavings.toLocaleString()}</Typography>
                  <Typography variant="caption">Savings</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)', borderRadius: 2, textAlign: 'center', color: 'white' }}>
                  <Typography variant="h6" fontWeight="bold">${summary.netBalance.toLocaleString()}</Typography>
                  <Typography variant="caption">Net Balance</Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Income Accordion */}
        <Accordion 
          expanded={expandedAccordions.income}
          onChange={handleAccordionChange('income')}
          sx={{ borderRadius: 2, '&:before': { display: 'none' }, boxShadow: 3 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              color: 'white',
              borderRadius: expandedAccordions.income ? '8px 8px 0 0' : 2,
              minHeight: 64,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <MoneyIcon />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  💰 Income
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Monthly income sources
                </Typography>
              </Box>
              {isFilled(formData.income) ? (
                <Chip label={`$${parseFloat(formData.income).toLocaleString()}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }} />
              ) : (
                <Chip label="⚠️ Empty" size="small" color="warning" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <BudgetField
              label="Monthly Income"
              value={formData.income}
              onChange={(e) => setFormData({ ...formData, income: e.target.value })}
            />
          </AccordionDetails>
        </Accordion>

        {/* Expenses Accordion */}
        <Accordion 
          expanded={expandedAccordions.expenses}
          onChange={handleAccordionChange('expenses')}
          sx={{ borderRadius: 2, '&:before': { display: 'none' }, boxShadow: 3 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)',
              color: 'white',
              borderRadius: expandedAccordions.expenses ? '8px 8px 0 0' : 2,
              minHeight: 64,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <TrendingDownIcon />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  💳 Expenses
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Monthly expenses
                </Typography>
              </Box>
              <Chip label={`Total: $${summary.totalExpenses.toLocaleString()}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <BudgetField label="Housing/Rent" value={formData.housing} onChange={(e) => setFormData({ ...formData, housing: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <BudgetField label="Food/Groceries" value={formData.food} onChange={(e) => setFormData({ ...formData, food: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <BudgetField label="Transportation" value={formData.transportation} onChange={(e) => setFormData({ ...formData, transportation: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <BudgetField label="Utilities" value={formData.utilities} onChange={(e) => setFormData({ ...formData, utilities: e.target.value })} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Savings Accordion */}
        <Accordion 
          expanded={expandedAccordions.savings}
          onChange={handleAccordionChange('savings')}
          sx={{ borderRadius: 2, '&:before': { display: 'none' }, boxShadow: 3 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
              color: 'white',
              borderRadius: expandedAccordions.savings ? '8px 8px 0 0' : 2,
              minHeight: 64,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <SavingsIcon />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  💎 Savings
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Savings goals
                </Typography>
              </Box>
              <Chip label={`Total: $${summary.totalSavings.toLocaleString()}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <BudgetField label="Emergency Fund" value={formData.emergency_fund} onChange={(e) => setFormData({ ...formData, emergency_fund: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <BudgetField label="Retirement" value={formData.retirement} onChange={(e) => setFormData({ ...formData, retirement: e.target.value })} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

      </Stack>
    </Box>
  );
}

export default AccordionBudgetExample;
