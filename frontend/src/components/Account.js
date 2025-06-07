import React from 'react';
import '../styles/Account.css';

function Account({ username, age = '', sex = '', maritalStatus = '' }) {
  return (
    <div className="account-view">
      <h2>Account Information</h2>
      <form className="account-form">
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} readOnly />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input type="text" value={age} placeholder="Enter age" readOnly />
        </div>
        <div className="form-group">
          <label>Sex</label>
          <input type="text" value={sex} placeholder="Enter sex" readOnly />
        </div>
        <div className="form-group">
          <label>Marital Status</label>
          <input type="text" value={maritalStatus} placeholder="Enter marital status" readOnly />
        </div>
      </form>
    </div>
  );
}

export default Account; 