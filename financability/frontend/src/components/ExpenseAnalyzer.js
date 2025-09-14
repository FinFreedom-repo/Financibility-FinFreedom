import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade,
  Zoom,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
  Analytics as AnalyticsIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  InsertChart as InsertChartIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from '../utils/axios';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useTheme } from '../contexts/ThemeContext';
import { chartTheme } from '../theme/theme';
import Card from './common/Card';
import { Button } from './common/Button';
import Input from './common/Input';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend);

// Styled components
const UploadArea = styled(Paper)(({ theme, isDragOver }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: 16,
  backgroundColor: isDragOver ? theme.palette.primary.main + '0A' : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.main + '0A',
  },
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  backgroundColor: theme.palette.background.default,
  
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.paper,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: 3,
  },
}));

const MessageBubble = styled(Box)(({ theme, type }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1.5),
  justifyContent: type === 'user' ? 'flex-end' : 'flex-start',
  
  '& .message-content': {
    maxWidth: '80%',
    padding: theme.spacing(1.5, 2),
    borderRadius: 16,
    fontSize: '0.875rem',
    lineHeight: 1.4,
    
    ...(type === 'user' && {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderBottomRightRadius: 4,
    }),
    
    ...(type === 'assistant' && {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      borderBottomLeftRadius: 4,
    }),
    
    ...(type === 'system' && {
      backgroundColor: theme.palette.secondary.main + '20',
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.secondary.main}`,
      borderRadius: 8,
      textAlign: 'center',
    }),
    
    ...(type === 'error' && {
      backgroundColor: theme.palette.error.main + '20',
      color: theme.palette.error.main,
      border: `1px solid ${theme.palette.error.main}`,
      borderRadius: 8,
    }),
  },
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'flex-end',
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  height: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  borderRadius: 16,
  padding: theme.spacing(2),
}));

const ExpenseAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);
  const { isDarkMode } = useTheme();

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    console.log('=== Starting file upload ===');
    console.log('File:', file);
    
    if (!file) {
      console.log('No file selected');
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setChatHistory([]);

    const formData = new FormData();
    formData.append('file', file);
    console.log('FormData created with file:', file.name);

    try {
      const token = localStorage.getItem('access_token');
      console.log('Token from localStorage:', token);
      
      // Check if token exists and is not empty
      if (!token || token === 'null' || token === 'undefined') {
        console.log('No valid token found');
        setError('Please log in to analyze expenses');
        return;
      }

      console.log('Making request to /api/expense-analyzer/upload/');
      
      const response = await axios.post('/api/expense-analyzer/upload/', formData, {
        transformRequest: [(data) => data] // Prevent axios from transforming FormData
      });

      console.log('Response received:', response.data);
      setAnalysis(response.data.analysis);
      setChatHistory([{
        type: 'system',
        content: 'I\'ve analyzed your expenses. You can ask me questions about your spending patterns, categories, or any other insights you\'d like to know.'
      }]);
    } catch (err) {
      console.error('Error uploading file:', err);
      console.error('Error message:', err.message);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      setError(err.response?.data?.error || err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !analysis) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await axios.post('/api/expense-analyzer/chat/', {
        message: userMessage,
        analysis: analysis
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setChatHistory(prev => [...prev, { type: 'assistant', content: response.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        type: 'error', 
        content: 'Sorry, I encountered an error while processing your question. Please try again.' 
      }]);
    }
  };

  const renderMessage = (message, index) => (
    <Fade in timeout={300} key={index}>
      <MessageBubble type={message.type}>
        <Box className="message-content">
          {message.content}
        </Box>
      </MessageBubble>
    </Fade>
  );

  const renderChart = () => {
    if (!analysis) return null;

    try {
      const data = JSON.parse(analysis);
      const categories = Object.keys(data);
      const values = Object.values(data);
      const currentChartTheme = isDarkMode ? chartTheme.dark : chartTheme.light;

      const chartData = {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: currentChartTheme.colors,
          borderColor: currentChartTheme.colors.map(color => color + '80'),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverBackgroundColor: currentChartTheme.colors.map(color => color + 'CC'),
        }]
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12,
                family: 'inherit',
              },
              color: currentChartTheme.textColor,
              padding: 20,
              usePointStyle: true,
            }
          },
          tooltip: {
            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: currentChartTheme.textColor,
            bodyColor: currentChartTheme.textColor,
            borderColor: currentChartTheme.borderColor,
            borderWidth: 1,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
        },
        elements: {
          arc: {
            borderWidth: 2,
          }
        }
      };

      return <Pie data={chartData} options={options} />;
    } catch (err) {
      return (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            Error parsing chart data. Please try uploading your file again.
          </Typography>
        </Alert>
      );
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 700, 
          background: 'linear-gradient(135deg, #4CAF50 0%, #FF9800 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: 2,
        }}>
          <AnalyticsIcon sx={{ fontSize: '2rem', mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          Expense Analyzer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Upload your expense data and get AI-powered insights about your spending patterns
        </Typography>
      </Box>

      {/* File Upload Section */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <input
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv,.xlsx,.xls,.txt"
        />
        
        <UploadArea
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          elevation={0}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {file ? 'File Selected' : 'Drop your file here or click to browse'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supported formats: CSV, Excel (.xlsx, .xls), Text files
          </Typography>
          
          {file && (
            <Fade in>
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={<AttachFileIcon />}
                  label={file.name}
                  color="primary"
                  variant="outlined"
                  onDelete={handleRemoveFile}
                  deleteIcon={<DeleteIcon />}
                  sx={{ mx: 1 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleUpload}
                    loading={loading}
                    disabled={!file}
                    startIcon={<InsertChartIcon />}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Expenses'}
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}
        </UploadArea>
        
        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress sx={{ borderRadius: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Processing your file... This may take a moment.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Fade in>
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            <Typography variant="body1">{error}</Typography>
          </Alert>
        </Fade>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Zoom in timeout={500}>
          <Grid container spacing={3}>
            {/* Chat Section */}
            <Grid item xs={12} md={7}>
              <Card elevation={2}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SendIcon color="primary" />
                    AI Assistant
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask questions about your expenses and get personalized insights
                  </Typography>
                </Box>
                
                <ChatContainer>
                  <MessagesArea>
                    {chatHistory.map((message, index) => renderMessage(message, index))}
                    <div ref={chatMessagesEndRef} />
                  </MessagesArea>
                  
                  <ChatInputContainer>
                    <Input
                      placeholder="Ask about your spending patterns..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit(e)}
                      disabled={loading}
                      fullWidth
                      size="small"
                    />
                    <Tooltip title="Send message">
                      <IconButton
                        onClick={handleChatSubmit}
                        disabled={loading || !chatMessage.trim()}
                        color="primary"
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          '&:disabled': {
                            backgroundColor: 'action.disabled',
                          },
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    </Tooltip>
                  </ChatInputContainer>
                </ChatContainer>
              </Card>
            </Grid>

            {/* Chart Section */}
            <Grid item xs={12} md={5}>
              <Card elevation={2}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InsertChartIcon color="primary" />
                    Expense Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visual representation of your spending categories
                  </Typography>
                </Box>
                
                <ChartContainer>
                  {renderChart()}
                </ChartContainer>
              </Card>
            </Grid>
          </Grid>
        </Zoom>
      )}
    </Box>
  );
};

export default ExpenseAnalyzer; 