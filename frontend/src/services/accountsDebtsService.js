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
      console.log('🔍 Fetching accounts from API...');
      const response = await axios.get('/api/accounts/');
      console.log('📊 Raw accounts response:', response.data);
      console.log('📊 Number of accounts:', response.data?.length || 0);
      
      // Ensure we return a properly formatted array
      const accounts = Array.isArray(response.data) ? response.data : [];
      
      // Process each account to ensure proper field mapping and number conversion
      const processedAccounts = accounts.map(account => {
        const balance = parseFloat(account.balance) || 0;
        const interestRate = parseFloat(account.interest_rate) || 0;
        
        return {
          id: account.id,
          name: account.name || 'Unnamed Account',
          account_type: account.account_type || 'checking',
          balance: balance,
          interest_rate: interestRate,
          effective_date: account.effective_date || new Date().toISOString().split('T')[0],
          user: account.user,
          created_at: account.created_at,
          updated_at: account.updated_at
        };
      });
      
      console.log('✅ Processed accounts:', processedAccounts);
      const totalBalance = processedAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      console.log('💰 Total account balances:', totalBalance);
      return processedAccounts;
    } catch (error) {
      console.error('❌ Error fetching accounts:', error);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. You do not have permission to view accounts.');
        } else if (error.response.status === 404) {
          throw new Error('Accounts endpoint not found. Please check the API configuration.');
        } else {
          const errorMessage = error.response.data?.detail || error.response.data?.message || 'Failed to fetch accounts';
          throw new Error(errorMessage);
        }
      } else if (error.request) {
        throw new Error('No response received from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  }

  // Get all debts
  async getDebts() {
    try {
      const response = await axios.get('/api/debts/');
      console.log('Raw debts response from API:', response.data);
      
      // Ensure we return a properly formatted array
      const debts = Array.isArray(response.data) ? response.data : [];
      
      // Process each debt to ensure proper field mapping and number conversion
      const processedDebts = debts.map(debt => {
        const balance = parseFloat(debt.balance) || 0;
        const interestRate = parseFloat(debt.interest_rate) || 0;
        
        return {
          id: debt.id,
          name: debt.name || 'Unnamed Debt',
          debt_type: debt.debt_type || 'other',
          balance: balance,
          interest_rate: interestRate,
          effective_date: debt.effective_date || new Date().toISOString().split('T')[0],
          payoff_date: debt.payoff_date || null,
          user: debt.user,
          created_at: debt.created_at,
          updated_at: debt.updated_at
        };
      });
      
      console.log('Processed debts:', processedDebts);
      const totalDebt = processedDebts.reduce((sum, debt) => sum + debt.balance, 0);
      console.log('💳 Total debt balance:', totalDebt);
      return processedDebts;
    } catch (error) {
      console.error('Error fetching debts:', error);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. You do not have permission to view debts.');
        } else if (error.response.status === 404) {
          throw new Error('Debts endpoint not found. Please check the API configuration.');
        } else {
          const errorMessage = error.response.data?.detail || error.response.data?.message || 'Failed to fetch debts';
          throw new Error(errorMessage);
        }
      } else if (error.request) {
        throw new Error('No response received from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  }

  // Create a new account
  async createAccount(accountData) {
    try {
      console.log('Creating account with data:', accountData);
      
      // Ensure proper data formatting
      const formattedData = {
        name: accountData.name,
        account_type: accountData.accountType || accountData.account_type || 'checking',
        balance: parseFloat(accountData.balance),
        interest_rate: parseFloat(accountData.interestRate || accountData.interest_rate),
        effective_date: accountData.effectiveDate || accountData.effective_date || new Date().toISOString().split('T')[0]
      };
      
      console.log('Formatted account data:', formattedData);
      const response = await axios.post('/api/accounts/', formattedData);
      console.log('Account creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Create a new debt
  async createDebt(debtData) {
    try {
      console.log('Creating debt with data:', debtData);
      
      // Ensure proper data formatting
      const formattedData = {
        name: debtData.name,
        debt_type: debtData.debtType || debtData.debt_type || 'other',
        balance: parseFloat(debtData.balance),
        interest_rate: parseFloat(debtData.interestRate || debtData.interest_rate),
        effective_date: debtData.effectiveDate || debtData.effective_date || new Date().toISOString().split('T')[0],
        payoff_date: debtData.payoffDate || debtData.payoff_date || null
      };
      
      console.log('Formatted debt data:', formattedData);
      const response = await axios.post('/api/debts/', formattedData);
      console.log('Debt creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating debt:', error);
      throw error;
    }
  }

  // Update an account
  async updateAccount(accountId, accountData) {
    try {
      console.log('Updating account with ID:', accountId, 'Data:', accountData);
      
      // Ensure proper data formatting
      const formattedData = {
        name: accountData.name,
        account_type: accountData.accountType || accountData.account_type || 'checking',
        balance: parseFloat(accountData.balance),
        interest_rate: parseFloat(accountData.interestRate || accountData.interest_rate),
        effective_date: accountData.effectiveDate || accountData.effective_date || new Date().toISOString().split('T')[0]
      };
      
      console.log('Formatted account update data:', formattedData);
      const response = await axios.put(`/api/accounts/${accountId}/`, formattedData);
      console.log('Account update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Update a debt
  async updateDebt(debtId, debtData) {
    try {
      console.log('Updating debt with ID:', debtId, 'Data:', debtData);
      
      // Ensure proper data formatting
      const formattedData = {
        name: debtData.name,
        debt_type: debtData.debtType || debtData.debt_type || 'other',
        balance: parseFloat(debtData.balance),
        interest_rate: parseFloat(debtData.interestRate || debtData.interest_rate),
        effective_date: debtData.effectiveDate || debtData.effective_date || new Date().toISOString().split('T')[0],
        payoff_date: debtData.payoffDate || debtData.payoff_date || null
      };
      
      console.log('Formatted debt update data:', formattedData);
      const response = await axios.put(`/api/debts/${debtId}/`, formattedData);
      console.log('Debt update response:', response.data);
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
      console.log('Deleting debt with ID:', debtId);
      await axios.delete(`/api/debts/${debtId}/`);
      console.log('Debt deleted successfully');
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

  // Calculate debt payoff plan
  async calculateDebtPayoffPlan(data) {
    try {
      console.log('Calculating debt payoff plan with data:', data);
      
      // Validate input data
      if (!data.debts || !Array.isArray(data.debts) || data.debts.length === 0) {
        throw new Error('Debts array is required and must not be empty');
      }
      
      if (!data.strategy || !['snowball', 'avalanche'].includes(data.strategy)) {
        throw new Error('Strategy must be either "snowball" or "avalanche"');
      }
      
      // Ensure debts have proper format
      const validatedDebts = data.debts.map(debt => {
        if (!debt.name) throw new Error('All debts must have a name');
        if (debt.balance === undefined || debt.balance === null) throw new Error(`Balance is required for debt: ${debt.name}`);
        if (debt.rate === undefined || debt.rate === null) throw new Error(`Interest rate is required for debt: ${debt.name}`);
        
        return {
          name: debt.name,
          balance: parseFloat(debt.balance),
          rate: parseFloat(debt.rate),
          debt_type: debt.debt_type || 'other'
        };
      });
      
      const requestData = {
        debts: validatedDebts,
        strategy: data.strategy,
        monthly_budget_data: data.monthly_budget_data || []
      };
      
      console.log('Sending debt payoff request:', requestData);
      const response = await axios.post('/api/debt-planner/', requestData);
      console.log('Debt payoff response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error calculating debt payoff plan:', error);
      
      // Provide more detailed error information
      if (error.response) {
        const errorData = error.response.data;
        console.error('Backend error details:', errorData);
        
        if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. You do not have permission to calculate debt payoff plans.');
        } else if (error.response.status === 404) {
          throw new Error('Debt planner endpoint not found. Please check the API configuration.');
        } else if (error.response.status === 400) {
          const errorMessage = errorData.error || errorData.detail || 'Invalid request data';
          throw new Error(errorMessage);
        } else {
          throw new Error(errorData.error || errorData.detail || 'Failed to calculate debt payoff plan');
        }
      } else if (error.request) {
        throw new Error('No response received from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  }
}

export default new AccountsDebtsService();