import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  Divider,
  Fade,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Send as SendIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CheckIcon,
  FlashOn as FlashIcon,
} from '@mui/icons-material';
import { Button } from './common/Button';
import axios from '../utils/axios';

const VoiceBudgetInput = ({ onDataParsed }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const parseTimeoutRef = useRef(null);
  const lastParsedLengthRef = useRef(0);

  // Budget categories matching MonthlyBudget.js
  const budgetCategories = {
    income: { label: 'Primary Income', type: 'income' },
    additional_income: { label: 'Additional Income', type: 'income' },
    housing: { label: 'Housing/Rent', type: 'expense' },
    transportation: { label: 'Transportation', type: 'expense' },
    food: { label: 'Food/Groceries', type: 'expense' },
    healthcare: { label: 'Healthcare', type: 'expense' },
    entertainment: { label: 'Entertainment', type: 'expense' },
    shopping: { label: 'Shopping', type: 'expense' },
    travel: { label: 'Travel', type: 'expense' },
    education: { label: 'Education', type: 'expense' },
    utilities: { label: 'Utilities', type: 'expense' },
    childcare: { label: 'Childcare', type: 'expense' },
    debt_payments: { label: 'Debt Payments', type: 'expense' },
    others: { label: 'Miscellaneous', type: 'expense' },
    emergency_fund: { label: 'Emergency Fund', type: 'savings' },
    retirement: { label: 'Retirement Savings', type: 'savings' },
    vacation: { label: 'Vacation Fund', type: 'savings' },
  };

  // Streaming parse function with debounce
  const streamingParse = useCallback(async (text) => {
    if (!text.trim() || !streamingEnabled) return;
    
    // Only parse if we have significant new content (at least 10 characters more)
    if (text.length - lastParsedLengthRef.current < 10) return;
    
    lastParsedLengthRef.current = text.length;
    
    try {
      const response = await axios.post('/api/mongodb/parse-budget-voice/', {
        transcript: text,
        streaming: true,
      });

      const parsed = response.data;
      setParsedData(parsed);

      // Notify parent component immediately to fill fields
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
        console.log('Budget transcript update:', fullTranscript); // Debug log
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
      // Call backend AI to parse the budget transcript (NOT streaming mode for manual parse)
      const response = await axios.post('/api/mongodb/parse-budget-voice/', {
        transcript: text,
        streaming: false,
      });

      const parsed = response.data;
      setParsedData(parsed);
      setSuccess('✅ Successfully parsed your budget information!');
      
      // Notify parent component with parsed data
      if (onDataParsed) {
        onDataParsed(parsed);
      }
    } catch (err) {
      console.error('Error parsing transcript:', err);
      setError('Failed to parse budget information. Please try manual entry or rephrase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualParse = () => {
    if (transcript) {
      handleParseTranscript(transcript);
    }
  };

  const handleApply = () => {
    if (parsedData && onDataParsed) {
      onDataParsed(parsedData);
      setSuccess('✅ Budget data applied! Check your budget fields below.');
      
      // Clear after 2 seconds
      setTimeout(() => {
        setTranscript('');
        finalTranscriptRef.current = '';
        lastParsedLengthRef.current = 0;
        setParsedData(null);
        setSuccess('');
      }, 2000);
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
            🎤 Voice Input Budget
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
            Simply speak your budget information, and AI will automatically fill in
            the budget fields for you. Try saying: "My monthly income is $5,000, I spend $1,500 on rent, $400 on food, and $300 on transportation"
          </Typography>
          <Tooltip title="Real-time field filling while you speak">
            <Chip
              icon={<FlashIcon />}
              label={streamingEnabled ? 'Live Mode' : 'Manual Mode'}
              color={streamingEnabled ? 'success' : 'default'}
              onClick={() => setStreamingEnabled(!streamingEnabled)}
              sx={{ cursor: 'pointer', ml: 2, flexShrink: 0 }}
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
                      label="Auto-filling budget..."
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
                  minHeight: 60,
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
          <>
            <Alert
              severity="info"
              icon={<CheckIcon />}
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                AI Detected Budget Items:
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {parsedData.income && parsedData.income > 0 && (
                  <Chip
                    label={`Income: $${parsedData.income.toLocaleString()}`}
                    size="small"
                    color="success"
                  />
                )}
                {parsedData.expenses && Object.entries(parsedData.expenses).map(([category, amount]) => (
                  amount > 0 && (
                    <Chip
                      key={category}
                      label={`${budgetCategories[category]?.label || category}: $${amount.toLocaleString()}`}
                      size="small"
                      color="primary"
                    />
                  )
                ))}
                {parsedData.savings && Object.entries(parsedData.savings).map(([category, amount]) => (
                  amount > 0 && (
                    <Chip
                      key={category}
                      label={`${budgetCategories[category]?.label || category}: $${amount.toLocaleString()}`}
                      size="small"
                      color="secondary"
                    />
                  )
                ))}
              </Stack>
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setTranscript('');
                  setParsedData(null);
                }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleApply}
                startIcon={<SendIcon />}
              >
                Apply to Budget
              </Button>
            </Box>
          </>
        )}

        {!parsedData && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              💡 Example Phrases:
            </Typography>
            <Stack spacing={0.5} sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • "My monthly income is $5,000"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • "I spend $1,500 on rent and $400 on food"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • "Transportation costs $300, utilities are $200"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • "I save $500 for emergencies and $300 for retirement"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • "Entertainment budget is $200, shopping is $150"
              </Typography>
            </Stack>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default VoiceBudgetInput;
