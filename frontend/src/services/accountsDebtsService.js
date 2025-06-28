import axios from '../utils/axios';

class AccountsDebtsService {
  // Get all accounts and debts with summary
  async getAccountsDebtsSummary() {
    try {
      const response = await axios.get('/api/accounts-debts/summary/');
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts and debts summary:', error);
      throw error;
    }
  }

  // Get all accounts
  async getAccounts() {
    try {
      const response = await axios.get('/api/accounts/');
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  // Get all debts
  async getDebts() {
    try {
      const response = await axios.get('/api/debts/');
      return response.data;
    } catch (error) {
      console.error('Error fetching debts:', error);
      throw error;
    }
  }

  // Create a new account
  async createAccount(accountData) {
    try {
      const response = await axios.post('/api/accounts/', accountData);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Create a new debt
  async createDebt(debtData) {
    try {
      const response = await axios.post('/api/debts/', debtData);
      return response.data;
    } catch (error) {
      console.error('Error creating debt:', error);
      throw error;
    }
  }

  // Update an account
  async updateAccount(accountId, accountData) {
    try {
      const response = await axios.put(`/api/accounts/${accountId}/`, accountData);
      return response.data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Update a debt
  async updateDebt(debtId, debtData) {
    try {
      const response = await axios.put(`/api/debts/${debtId}/`, debtData);
      return response.data;
    } catch (error) {
      console.error('Error updating debt:', error);
      throw error;
    }
  }

  // Delete an account
  async deleteAccount(accountId) {
    try {
      await axios.delete(`/api/accounts/${accountId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Delete a debt
  async deleteDebt(debtId) {
    try {
      await axios.delete(`/api/debts/${debtId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting debt:', error);
      throw error;
    }
  }

  // Bulk save accounts and debts
  async bulkSaveAccountsDebts(accounts, debts) {
    try {
      const response = await axios.post('/api/accounts-debts/bulk-save/', {
        accounts: accounts,
        debts: debts
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk saving accounts and debts:', error);
      throw error;
    }
  }

  // Get history for a specific account or debt
  async getHistory(type, name) {
    try {
      const endpoint = type === 'account' ? '/api/accounts/' : '/api/debts/';
      const response = await axios.get(`${endpoint}?history=true`);
      
      // Filter the response to only include records for the specific name
      const filteredData = response.data.filter(item => item.name === name);
      return filteredData;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }
}

export default new AccountsDebtsService(); 