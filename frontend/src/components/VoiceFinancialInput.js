import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  Divider,
  Fade,
  Zoom,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Send as SendIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  FlashOn as FlashIcon,
} from '@mui/icons-material';
import { Button } from './common/Button';
import axios from '../utils/axios';

const VoiceFinancialInput = ({ onDataParsed, onSubmit }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldUpdates, setFieldUpdates] = useState({}); // Track which fields were auto-filled
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const parseTimeoutRef = useRef(null);
  const lastParsedLengthRef = useRef(0);

  // Form data for the parsed financial info
  const [financialData, setFinancialData] = useState({
    type: 'account', // 'account' or 'debt'
    name: '',
    amount: '',
    category: '',
    interestRate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    payoffDate: '',
    notes: '',
  });

  const accountCategories = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'retirement', label: 'Retirement Account' },
    { value: 'other', label: 'Other Account' },
  ];

  const debtCategories = [
    { value: 'credit-card', label: 'Credit Card' },
    { value: 'personal-loan', label: 'Personal Loan' },
    { value: 'student-loan', label: 'Student Loan' },
    { value: 'auto-loan', label: 'Auto Loan' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'other', label: 'Other Debt' },
  ];

  // Streaming parse function with debounce
  const streamingParse = useCallback(async (text) => {
    if (!text.trim() || !streamingEnabled) return;
    
    // Only parse if we have significant new content (at least 10 characters more)
    if (text.length - lastParsedLengthRef.current < 10) return;
    
    lastParsedLengthRef.current = text.length;
    
    try {
      const response = await axios.post('/api/mongodb/parse-financial-voice/', {
        transcript: text,
        streaming: true, // Tell backend this is a partial transcript
      });

      const parsed = response.data;
      setParsedData(parsed);

      // Track which fields are being updated
      const updates = {};
      
      // Update form with parsed data, tracking changes
      setFinancialData(prevData => {
        const newData = {
          type: parsed.type || prevData.type,
          name: parsed.name || prevData.name,
          amount: parsed.amount || prevData.amount,
          category: parsed.category || prevData.category,
          interestRate: parsed.interest_rate || prevData.interestRate,
          effectiveDate: parsed.effective_date || prevData.effectiveDate,
          payoffDate: parsed.payoff_date || prevData.payoffDate,
          notes: parsed.notes || prevData.notes,
        };

        // Track which fields changed
        Object.keys(newData).forEach(key => {
          if (newData[key] !== prevData[key] && newData[key]) {
            updates[key] = true;
          }
        });

        return newData;
      });

      // Show visual feedback for updated fields
      setFieldUpdates(updates);
      setTimeout(() => setFieldUpdates({}), 2000);

      if (onDataParsed) {
        onDataParsed(parsed);
      }
    } catch (err) {
      console.error('Streaming parse error:', err);
      // Don't show errors during streaming, only on manual parse
    }
  }, [streamingEnabled, onDataParsed]);

  // Debounced streaming parse effect
  useEffect(() => {
    if (isListening && streamingEnabled && transcript) {
      // Clear existing timeout
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }

      // Set new timeout for parsing (wait 2 seconds after user stops talking)
      parseTimeoutRef.current = setTimeout(() => {
        streamingParse(transcript);
      }, 2000);
    }

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [transcript, isListening, streamingEnabled, streamingParse]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        // Update display with final + interim
        const fullTranscript = finalTranscriptRef.current + interimTranscript;
        console.log('Transcript update:', fullTranscript); // Debug log
        setTranscript(fullTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      console.log('Stopping recognition, final transcript:', finalTranscriptRef.current);
      recognitionRef.current.stop();
      setIsListening(false);
      // Just stop - don't auto-parse
    } else {
      setError('');
      setSuccess('');
      setTranscript('');
      finalTranscriptRef.current = ''; // Reset accumulator
      console.log('Starting speech recognition...');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start speech recognition: ' + err.message);
      }
    }
  };

  const handleParseTranscript = async (text) => {
    if (!text.trim()) {
      setError('No speech detected. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Call backend AI to parse the transcript (NOT streaming mode for manual parse)
      const response = await axios.post('/api/mongodb/parse-financial-voice/', {
        transcript: text,
        streaming: false,
      });

      const parsed = response.data;
      setParsedData(parsed);

      // Track which fields are being updated
      const updates = {};

      // Update form with parsed data
      setFinancialData(prevData => {
        const newData = {
          type: parsed.type || prevData.type,
          name: parsed.name || prevData.name,
          amount: parsed.amount || prevData.amount,
          category: parsed.category || prevData.category,
          interestRate: parsed.interest_rate || prevData.interestRate,
          effectiveDate: parsed.effective_date || prevData.effectiveDate,
          payoffDate: parsed.payoff_date || prevData.payoffDate,
          notes: parsed.notes || text,
        };

        // Track which fields changed
        Object.keys(newData).forEach(key => {
          if (newData[key] !== prevData[key] && newData[key]) {
            updates[key] = true;
          }
        });

        return newData;
      });

      // Show visual feedback for updated fields
      setFieldUpdates(updates);
      setTimeout(() => setFieldUpdates({}), 2000);

      setSuccess('✅ Successfully parsed your financial information!');
      
      if (onDataParsed) {
        onDataParsed(parsed);
      }
    } catch (err) {
      console.error('Error parsing transcript:', err);
      setError('Failed to parse financial information. Please try manual entry or rephrase.');
      
      // Fallback: Just populate notes with the transcript
      setFinancialData({
        ...financialData,
        notes: text,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualParse = () => {
    if (transcript) {
      handleParseTranscript(transcript);
    }
  };

  // Helper to render field with auto-fill indicator
  const renderFieldWithIndicator = (field, fieldName) => {
    const isAutoFilled = fieldUpdates[fieldName];
    return (
      <Box position="relative">
        {field}
        <Zoom in={isAutoFilled}>
          <Chip
            icon={<CheckIcon />}
            label="Auto-filled"
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              right: 8,
              top: -8,
              height: 20,
              fontSize: '0.7rem',
              animation: 'pulse 0.5s ease-in-out',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          />
        </Zoom>
      </Box>
    );
  };

  const handleSubmit = async () => {
    if (!financialData.name || !financialData.amount) {
      setError('Please provide at least a name and amount.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const dataToSubmit = {
        name: financialData.name,
        balance: parseFloat(financialData.amount),
        interestRate: parseFloat(financialData.interestRate) || 0,
        effectiveDate: financialData.effectiveDate,
      };

      if (financialData.type === 'account') {
        dataToSubmit.accountType = financialData.category || 'checking';
        await axios.post('/api/mongodb/accounts/create/', dataToSubmit);
        setSuccess('✅ Account added successfully!');
      } else {
        dataToSubmit.debtType = financialData.category || 'credit-card';
        dataToSubmit.payoffDate = financialData.payoffDate || null;
        await axios.post('/api/mongodb/debts/create/', dataToSubmit);
        setSuccess('✅ Debt added successfully!');
      }

      // Clear form
      setTranscript('');
      finalTranscriptRef.current = '';
      lastParsedLengthRef.current = 0;
      setFinancialData({
        type: 'account',
        name: '',
        amount: '',
        category: '',
        interestRate: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        payoffDate: '',
        notes: '',
      });
      setParsedData(null);
      setFieldUpdates({});

      // Notify parent
      if (onSubmit) {
        onSubmit();
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting financial data:', err);
      setError('Failed to save financial data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Accordion
      sx={{
        mb: 3,
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
          '&.Mui-expanded': {
            borderRadius: '8px 8px 0 0',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <AIIcon />
          <Typography variant="h6" fontWeight="bold">
            🎤 Voice Input Financials
          </Typography>
          <Chip
            label="AI Powered"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Simply speak your financial information, and AI will automatically fill in
            the details for you. Try saying something like: "I have a Chase checking
            account with $5,000" or "I owe $3,000 on my Visa credit card at 18% interest"
          </Typography>
          <Tooltip title="Real-time field filling while you speak">
            <Chip
              icon={<FlashIcon />}
              label={streamingEnabled ? 'Live Mode' : 'Manual Mode'}
              color={streamingEnabled ? 'success' : 'default'}
              onClick={() => setStreamingEnabled(!streamingEnabled)}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        </Stack>

        {/* Voice Input Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: isListening ? '#e3f2fd' : '#f5f5f5',
            border: '2px dashed',
            borderColor: isListening ? '#2196f3' : '#e0e0e0',
            borderRadius: 2,
            transition: 'all 0.3s ease',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title={isListening ? 'Stop Recording' : 'Start Recording'}>
              <IconButton
                onClick={toggleListening}
                disabled={isProcessing}
                sx={{
                  bgcolor: isListening ? '#f44336' : '#4caf50',
                  color: 'white',
                  width: 56,
                  height: 56,
                  '&:hover': {
                    bgcolor: isListening ? '#d32f2f' : '#388e3c',
                  },
                  animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                    },
                    '70%': {
                      boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                    },
                    '100%': {
                      boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                    },
                  },
                }}
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>

            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {isListening ? '🎙️ Listening...' : '💬 Transcript'}
                </Typography>
                {streamingEnabled && isListening && (
                  <Fade in={true}>
                    <Chip
                      icon={<AIIcon sx={{ animation: 'spin 2s linear infinite' }} />}
                      label="Auto-filling fields..."
                      size="small"
                      color="secondary"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </Fade>
                )}
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  minHeight: 40,
                  p: 1.5,
                  bgcolor: 'white',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  color: '#000000',
                }}
              >
                {transcript || 'Click the microphone to start speaking...'}
              </Typography>
            </Box>

            {transcript && !isListening && (
              <Tooltip title="Parse with AI">
                <IconButton
                  onClick={handleManualParse}
                  disabled={isProcessing}
                  sx={{
                    bgcolor: '#9c27b0',
                    color: 'white',
                    '&:hover': { bgcolor: '#7b1fa2' },
                  }}
                >
                  {isProcessing ? <CircularProgress size={24} /> : <AIIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Paper>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Parsed Data Display */}
        {parsedData && (
          <Alert
            severity="info"
            icon={<CheckIcon />}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              AI Detected:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {parsedData.type && (
                <Chip
                  label={`Type: ${parsedData.type}`}
                  size="small"
                  color="primary"
                />
              )}
              {parsedData.name && (
                <Chip label={`Name: ${parsedData.name}`} size="small" />
              )}
              {parsedData.amount && (
                <Chip label={`Amount: $${parsedData.amount}`} size="small" />
              )}
              {parsedData.category && (
                <Chip label={`Category: ${parsedData.category}`} size="small" />
              )}
            </Stack>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Manual Input Form */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Financial Details
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {renderFieldWithIndicator(
              <TextField
                fullWidth
                select
                label="Type"
                value={financialData.type}
                onChange={(e) =>
                  setFinancialData({ ...financialData, type: e.target.value })
                }
                size="small"
              >
                <MenuItem value="account">Account (Asset)</MenuItem>
                <MenuItem value="debt">Debt (Liability)</MenuItem>
              </TextField>,
              'type'
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            {renderFieldWithIndicator(
              <TextField
                fullWidth
                select
                label="Category"
                value={financialData.category}
                onChange={(e) =>
                  setFinancialData({ ...financialData, category: e.target.value })
                }
                size="small"
              >
                {(financialData.type === 'account'
                  ? accountCategories
                  : debtCategories
                ).map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>,
              'category'
            )}
          </Grid>

          <Grid item xs={12}>
            {renderFieldWithIndicator(
              <TextField
                fullWidth
                label="Name"
                placeholder="e.g., Chase Checking, Visa Credit Card"
                value={financialData.name}
                onChange={(e) =>
                  setFinancialData({ ...financialData, name: e.target.value })
                }
                size="small"
              />,
              'name'
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            {renderFieldWithIndicator(
              <TextField
                fullWidth
                label="Amount"
                type="number"
                placeholder="0.00"
                value={financialData.amount}
                onChange={(e) =>
                  setFinancialData({ ...financialData, amount: e.target.value })
                }
                size="small"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />,
              'amount'
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            {renderFieldWithIndicator(
              <TextField
                fullWidth
                label="Interest Rate (%)"
                type="number"
                placeholder="0.00"
                value={financialData.interestRate}
                onChange={(e) =>
                  setFinancialData({
                    ...financialData,
                    interestRate: e.target.value,
                  })
                }
                size="small"
                inputProps={{ step: 0.01 }}
              />,
              'interestRate'
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Effective Date"
              type="date"
              value={financialData.effectiveDate}
              onChange={(e) =>
                setFinancialData({
                  ...financialData,
                  effectiveDate: e.target.value,
                })
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {financialData.type === 'debt' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Payoff Date (Optional)"
                type="date"
                value={financialData.payoffDate}
                onChange={(e) =>
                  setFinancialData({
                    ...financialData,
                    payoffDate: e.target.value,
                  })
                }
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            {renderFieldWithIndicator(
              <TextField
                fullWidth
                label="Notes"
                placeholder="Any additional information..."
                value={financialData.notes}
                onChange={(e) =>
                  setFinancialData({ ...financialData, notes: e.target.value })
                }
                size="small"
                multiline
                rows={2}
              />,
              'notes'
            )}
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setFinancialData({
                type: 'account',
                name: '',
                amount: '',
                category: '',
                interestRate: '',
                effectiveDate: new Date().toISOString().split('T')[0],
                payoffDate: '',
                notes: '',
              });
              setTranscript('');
              setParsedData(null);
            }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isProcessing || !financialData.name || !financialData.amount}
            startIcon={
              isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
          >
            {isProcessing
              ? 'Saving...'
              : `Add ${financialData.type === 'account' ? 'Account' : 'Debt'}`}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default VoiceFinancialInput;
