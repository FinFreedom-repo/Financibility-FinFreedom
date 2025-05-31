import React, { useState } from 'react';
import axios from '../utils/axios';
import '../styles/ExpenseAnalyzer.css';

function ExpenseAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is a PDF or CSV
      if (file.type === 'application/pdf' || file.type === 'text/csv') {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('Please select a PDF or CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus('Uploading...');
      console.log('Uploading file:', selectedFile.name);
      const response = await axios.post('/api/budgets/upload_statement/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      setUploadStatus('Upload successful!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error.response?.data || error);
      setUploadStatus(error.response?.data?.error || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="expense-analyzer">
      <div className="analyzer-header">
        <div className="header-content">
          <div>
            <h2>Expense Analyzer</h2>
            <p className="analyzer-subtitle">Track and analyze your expenses</p>
          </div>
        </div>
      </div>

      <div className="upload-section">
        <div className="upload-container">
          <h3>Upload Bank Statement</h3>
          <p className="upload-subtitle">Upload your bank statement (PDF or CSV) to analyze your expenses</p>
          
          <div className="upload-controls">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.csv"
              onChange={handleFileSelect}
              className="file-input"
            />
            <label htmlFor="file-upload" className="file-label">
              Choose File
            </label>
            {selectedFile && (
              <span className="file-name">{selectedFile.name}</span>
            )}
            <button 
              className="upload-button"
              onClick={handleUpload}
              disabled={!selectedFile}
            >
              Upload Statement
            </button>
          </div>
          
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('successful') ? 'success' : 'error'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseAnalyzer; 