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

const VoiceBudgetInput = ({ onDataParsed, currentBudgetData = {} }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
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

  // Detect missing/empty fields
  useEffect(() => {
    const missing = [];
    
    // Check income
    if (!currentBudgetData.income || parseFloat(currentBudgetData.income) === 0) {
      missing.push({ category: 'Income', field: 'income', label: 'Monthly Income' });
    }
    
    // Check major expenses
    const expenseFields = [
      { field: 'housing', label: 'Housing/Rent' },
      { field: 'food', label: 'Food/Groceries' },
      { field: 'transportation', label: 'Transportation' },
      { field: 'utilities', label: 'Utilities' },
      { field: 'healthcare', label: 'Healthcare' },
    ];
    
    expenseFields.forEach(({ field, label }) => {
      if (!currentBudgetData[field] || parseFloat(currentBudgetData[field]) === 0) {
        missing.push({ category: 'Expenses', field, label });
      }
    });
    
    setMissingFields(missing);
  }, [currentBudgetData]);

  // Client-side parser for instant updates (no backend needed!)
  const parseTranscriptLocally = useCallback((text) => {
    const lower = text.toLowerCase();
    const result = {
      income: 0,
      expenses: {},
      savings: {},
      raw_transcript: text,
    };

    // Extract amounts (handles: $3700, 3700, thirty seven hundred, 3.7k, etc.)
    const extractAmount = (str) => {
      // Look for dollar amounts: $3700 or $3,700
      let match = str.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
      if (match) return parseFloat(match[1].replace(/,/g, ''));

      // Look for plain numbers: 3700 or 3,700
      match = str.match(/\b([0-9,]+(?:\.[0-9]{2})?)\b/);
      if (match) return parseFloat(match[1].replace(/,/g, ''));

      return null;
    };

    // Category keywords
    const categoryKeywords = {
      income: ['income', 'salary', 'paycheck', 'earn', 'make'],
      housing: ['housing', 'rent', 'mortgage', 'apartment'],
      food: ['food', 'groceries', 'grocery', 'dining', 'restaurant'],
      transportation: ['transportation', 'car', 'gas', 'transit', 'uber', 'vehicle'],
      utilities: ['utilities', 'electric', 'water', 'internet', 'phone', 'cable'],
      healthcare: ['healthcare', 'health', 'medical', 'doctor', 'insurance'],
      entertainment: ['entertainment', 'movies', 'streaming', 'netflix'],
      shopping: ['shopping', 'clothes', 'clothing', 'amazon'],
      travel: ['travel', 'vacation', 'trip'],
      education: ['education', 'tuition', 'school'],
      childcare: ['childcare', 'daycare', 'babysitter'],
      debt_payments: ['debt', 'loan payment', 'credit card payment'],
      emergency_fund: ['emergency', 'emergency fund'],
      retirement: ['retirement', '401k', 'ira'],
      vacation: ['vacation fund', 'vacation savings'],
    };

    // Parse income
    for (const keyword of categoryKeywords.income) {
      if (lower.includes(keyword)) {
        const amount = extractAmount(lower.substring(lower.indexOf(keyword)));
        if (amount) {
          result.income = amount;
          break;
        }
      }
    }

    // Parse expenses and savings
    Object.keys(categoryKeywords).forEach(category => {
      if (category === 'income') return; // Already handled
      
      const keywords = categoryKeywords[category];
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          // Use only the text AFTER the keyword so we get this category's amount,
          // not a number from a previous phrase (e.g. "income is 2000 housing is 3,000" -> housing must use 3000)
          const keywordIndex = lower.indexOf(keyword);
          const segmentAfterKeyword = lower.substring(keywordIndex + keyword.length, Math.min(lower.length, keywordIndex + keyword.length + 40));
          const amount = extractAmount(segmentAfterKeyword);
          if (amount) {
            // Determine if it's expense or savings
            if (['emergency_fund', 'retirement', 'vacation'].includes(category)) {
              result.savings[category] = amount;
            } else {
              result.expenses[category] = amount;
            }
            break;
          }
        }
      }
    });

    return result;
  }, []);

  // Streaming parse function - uses LOCAL parsing for instant updates!
  const streamingParse = useCallback((text) => {
    if (!text.trim() || !streamingEnabled) return;
    
    // Parse even small changes for real-time updates
    if (text.length - lastParsedLengthRef.current < 5) return;
    
    lastParsedLengthRef.current = text.length;
    
    try {
      // Use LOCAL parsing for instant results (no API call!)
      const parsed = parseTranscriptLocally(text);
      setParsedData(parsed);

      // Notify parent component immediately to fill fields in real-time
      if (onDataParsed) {
        onDataParsed(parsed);
      }
    } catch (err) {
      console.error('Local parsing error:', err);
    }
  }, [streamingEnabled, onDataParsed, parseTranscriptLocally]);

  // Real-time streaming parse effect - triggers frequently
  useEffect(() => {
    if (isListening && streamingEnabled && transcript) {
      // Clear existing timeout
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }

      // Set new timeout for parsing (wait only 500ms for real-time feel)
      parseTimeoutRef.current = setTimeout(() => {
        streamingParse(transcript);
      }, 500);
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

        {/* Missing Fields Indicator */}
        {missingFields.length > 0 && !isListening && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<AIIcon />}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              💡 Suggested: Fill these fields by speaking
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {missingFields.slice(0, 5).map((field, index) => (
                <Chip
                  key={index}
                  label={field.label}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ mb: 0.5 }}
                />
              ))}
              {missingFields.length > 5 && (
                <Chip
                  label={`+${missingFields.length - 5} more`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try saying: "My {missingFields[0]?.label.toLowerCase()} is [amount]"
            </Typography>
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
