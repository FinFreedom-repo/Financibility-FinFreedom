import React, { useState, useEffect } from 'react';
import '../styles/Account.css';

const SEX_OPTIONS = [
  { value: '', label: 'Select sex' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' }
];

const MARITAL_STATUS_OPTIONS = [
  { value: '', label: 'Select status' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' }
];

function Account({ username, age: initialAge = '', sex: initialSex = '', maritalStatus: initialMaritalStatus = '', onSave }) {
  const [age, setAge] = useState(initialAge);
  const [sex, setSex] = useState(initialSex);
  const [maritalStatus, setMaritalStatus] = useState(initialMaritalStatus);

  // Update local state when props change
  useEffect(() => {
    console.log('Account component received props:', { initialAge, initialSex, initialMaritalStatus });
    setAge(initialAge);
    setSex(initialSex);
    setMaritalStatus(initialMaritalStatus);
  }, [initialAge, initialSex, initialMaritalStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting profile data:', { age, sex, marital_status: maritalStatus });
    if (onSave) {
      onSave({ age, sex, marital_status: maritalStatus });
    }
  };

  return (
    <div className="account-view">
      <h2>Account Information</h2>
      <form className="account-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} readOnly />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input 
            type="number" 
            value={age} 
            onChange={e => setAge(e.target.value)} 
            placeholder="Enter age"
            min="1"
            max="120"
          />
        </div>
        <div className="form-group">
          <label>Sex</label>
          <select value={sex} onChange={e => setSex(e.target.value)}>
            {SEX_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Marital Status</label>
          <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
            {MARITAL_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="save-button">Save</button>
      </form>
    </div>
  );
}

export default Account; 