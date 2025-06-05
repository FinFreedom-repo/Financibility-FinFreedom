import React, { useState } from 'react';
import axios from '../utils/axios';
import '../styles/ExpenseAnalyzer.css';

function ExpenseAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
      setAnalysis(null); // Clear previous analysis
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
      setIsAnalyzing(true);
      setUploadStatus('Analyzing...');
      console.log('Uploading file:', selectedFile.name);
      const response = await axios.post('/api/expense-analyzer/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      setUploadStatus('Analysis complete!');
      setAnalysis(response.data.analysis);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error.response?.data || error);
      setUploadStatus(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
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
              disabled={!selectedFile || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Upload Statement'}
            </button>
          </div>
          
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('complete') ? 'success' : 'error'}`}>
              {uploadStatus}
            </div>
          )}

          {analysis && (
            <div className="analysis-section">
              <h3>Analysis Results</h3>
              <div className="analysis-content">
                {analysis.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseAnalyzer; 