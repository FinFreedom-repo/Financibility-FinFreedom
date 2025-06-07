import React, { useState } from 'react';
import '../styles/Account.css';

const SEX_OPTIONS = ['', 'Male', 'Female', 'Other'];
const MARITAL_STATUS_OPTIONS = ['', 'Single', 'Married', 'Divorced', 'Widowed', 'Other'];

function Account({ username, age: initialAge = '', sex: initialSex = '', maritalStatus: initialMaritalStatus = '', onSave }) {
  const [age, setAge] = useState(initialAge);
  const [sex, setSex] = useState(initialSex);
  const [maritalStatus, setMaritalStatus] = useState(initialMaritalStatus);

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Enter age" />
        </div>
        <div className="form-group">
          <label>Sex</label>
          <select value={sex} onChange={e => setSex(e.target.value)}>
            {SEX_OPTIONS.map(option => (
              <option key={option} value={option}>{option || 'Select sex'}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Marital Status</label>
          <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
            {MARITAL_STATUS_OPTIONS.map(option => (
              <option key={option} value={option}>{option || 'Select status'}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="save-button">Save</button>
      </form>
    </div>
  );
}

export default Account; 