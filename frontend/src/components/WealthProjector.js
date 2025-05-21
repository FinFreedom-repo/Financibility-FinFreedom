import React, { useState } from 'react';

function WealthProjector() {
  const [formData, setFormData] = useState({
    age: '25',
    startWealth: '0',
    debt: '0',
    debtInterest: '6',
    assetInterest: '10.5',
    inflation: '2.5',
    taxRate: '25',
    annualContributions: '1000'
  });

  const [showChart, setShowChart] = useState(false);
  const [projectionData, setProjectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/project-wealth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to calculate projection');
      }

      const data = await response.json();
      setProjectionData(data);
      setShowChart(true);
    } catch (err) {
      setError(err.message);
      setShowChart(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wealth-projector">
      <div className="wealth-header">
        <h2>Wealth Projector</h2>
        <p className="default-values-note">Default values are based on historical averages and typical scenarios</p>
      </div>
      <div className="wealth-projector-container">
        <div className="wealth-form-container">
          <form onSubmit={handleSubmit} className="wealth-form">
            <div className="form-group">
              <label htmlFor="age">Current Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startWealth">Starting Wealth ($)</label>
              <input
                type="number"
                id="startWealth"
                name="startWealth"
                value={formData.startWealth}
                onChange={handleChange}
                placeholder="Enter starting amount"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="debt">Total Debt ($)</label>
              <input
                type="number"
                id="debt"
                name="debt"
                value={formData.debt}
                onChange={handleChange}
                placeholder="Enter total debt"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="debtInterest">Debt Interest Rate (%)</label>
              <input
                type="number"
                id="debtInterest"
                name="debtInterest"
                value={formData.debtInterest}
                onChange={handleChange}
                placeholder="Enter interest rate"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="assetInterest">Asset Interest Rate (%)</label>
              <input
                type="number"
                id="assetInterest"
                name="assetInterest"
                value={formData.assetInterest}
                onChange={handleChange}
                placeholder="Enter interest rate"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="inflation">Expected Inflation Rate (%)</label>
              <input
                type="number"
                id="inflation"
                name="inflation"
                value={formData.inflation}
                onChange={handleChange}
                placeholder="Enter inflation rate"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="taxRate">Tax Rate (%)</label>
              <input
                type="number"
                id="taxRate"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                placeholder="Enter tax rate"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="annualContributions">Annual Contributions ($)</label>
              <input
                type="number"
                id="annualContributions"
                name="annualContributions"
                value={formData.annualContributions}
                onChange={handleChange}
                placeholder="Enter annual amount"
                required
              />
            </div>

            <button 
              type="submit" 
              className="simulate-button"
              disabled={isLoading}
            >
              {isLoading ? 'Calculating...' : 'Simulate'}
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
        <div className="wealth-chart-container">
          {isLoading ? (
            <div className="chart-placeholder">
              Calculating your wealth projection...
            </div>
          ) : showChart && projectionData ? (
            <div className="chart-placeholder">
              {/* We'll add the chart visualization here later */}
              Projection data received: {JSON.stringify(projectionData)}
            </div>
          ) : (
            <div className="chart-placeholder">
              Enter your financial data and click Simulate to see the projection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WealthProjector; 