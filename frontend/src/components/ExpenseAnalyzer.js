import React, { useState, useRef, useEffect } from 'react';
import axios from '../utils/axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import '../styles/ExpenseAnalyzer.css';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const fileInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
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

  const renderChart = () => {
    if (!analysis) return null;

    try {
      const data = JSON.parse(analysis);
      const categories = Object.keys(data);
      const values = Object.values(data);

      const chartData = {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0'
          ],
          borderWidth: 1,
        }]
      };

      const options = {
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 12
              }
            }
          }
        }
      };

      return <Pie data={chartData} options={options} />;
    } catch (err) {
      return <div className="error">Error parsing chart data</div>;
    }
  };

  return (
    <div className="expense-analyzer">
      <div className="upload-section">
        <input
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          className="upload-button"
          onClick={() => fileInputRef.current.click()}
        >
          Select File
        </button>
        {file && <span className="file-name">{file.name}</span>}
        <button 
          className="analyze-button"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Expenses'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {analysis && (
        <div className="analysis-container">
          <div className="chat-section">
            <div className="chat-messages">
              {chatHistory.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  {message.content}
                </div>
              ))}
              <div ref={chatMessagesEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about your expenses..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !chatMessage.trim()}>
                Send
              </button>
            </form>
          </div>
          <div className="chart-section">
            {renderChart()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseAnalyzer; 