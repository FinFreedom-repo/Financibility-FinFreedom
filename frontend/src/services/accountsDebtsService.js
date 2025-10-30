import axios from '../utils/axios';

class AccountsDebtsService {
  // Get all accounts and debts with summary
  async getAccountsDebtsSummary() {
    try {
      const [accountsResponse, debtsResponse] = await Promise.all([
            axios.get('/api/mongodb/accounts/'),
    axios.get('/api/mongodb/debts/')
      ]);
      
      const accounts = accountsResponse.data.accounts || [];
      const debts = debtsResponse.data.debts || [];
      
      const totalAccountBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
      const totalDebtBalance = debts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
      
      return {
        accounts: accounts,
        debts: debts,
        total_account_balance: totalAccountBalance,
        total_debt_balance: totalDebtBalance,
        net_worth: totalAccountBalance - totalDebtBalance
      };
    } catch (error) {
      console.error('Error fetching accounts and debts summary:', error);
      throw error;
    }
  }

  // Get all accounts
  async getAccounts() {
    try {
      console.log('🔍 Fetching accounts from API...');
      const response = await axios.get('/api/mongodb/accounts/');
      console.log('📊 Raw accounts response:', response.data);
      console.log('📊 Number of accounts:', response.data?.accounts?.length || 0);
      
      // Ensure we return a properly formatted array
      const accounts = Array.isArray(response.data.accounts) ? response.data.accounts : [];
      
      // Process each account to ensure proper field mapping and number conversion
      const processedAccounts = accounts.map(account => {
        const balance = parseFloat(account.balance) || 0;
        const interestRate = parseFloat(account.interest_rate) || 0;
        
        return {
          id: account._id || account.id, // Handle both MongoDB _id and regular id
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
      // Try authenticated endpoint first
      console.log(`🔍 Fetching debts from: /api/mongodb/debts/`);
      const response = await axios.get('/api/mongodb/debts/');
      console.log('✅ Raw debts response from API:', response.data);
      
      // Ensure we return a properly formatted array
      const debts = Array.isArray(response.data.debts) ? response.data.debts : [];
      
      // Process each debt to ensure proper field mapping and number conversion
      const processedDebts = debts.map(debt => {
        // Handle both 'amount' and 'balance' fields for backward compatibility
        const balance = parseFloat(debt.amount || debt.balance) || 0;
        const interestRate = parseFloat(debt.interest_rate) || 0;
        
        return {
          id: debt._id || debt.id, // Handle both MongoDB _id and regular id
          name: debt.name || 'Unnamed Debt',
          debt_type: debt.debt_type || 'other',
          balance: balance, // Use balance for frontend consistency
          amount: balance,  // Also include amount for backend compatibility
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
      console.error('❌ Error fetching debts from authenticated endpoint:', error);
      
      // If authentication fails, try test endpoint in development
      if (error.response?.status === 401 && process.env.NODE_ENV === 'development') {
        console.log('🔄 Trying test endpoint due to auth failure...');
        try {
          const testResponse = await axios.get('/api/mongodb/debts/test/');
          console.log('✅ Test endpoint success:', testResponse.data);
          
          // Process test response same way
          const debts = Array.isArray(testResponse.data.debts) ? testResponse.data.debts : [];
          const processedDebts = debts.map(debt => {
            const balance = parseFloat(debt.amount || debt.balance) || 0;
            const interestRate = parseFloat(debt.interest_rate) || 0;
            
            return {
              id: debt._id || debt.id,
              name: debt.name || 'Unnamed Debt',
              debt_type: debt.debt_type || 'other',
              balance: balance,
              amount: balance,
              interest_rate: interestRate,
              effective_date: debt.effective_date || new Date().toISOString().split('T')[0],
              payoff_date: debt.payoff_date || null,
              user: debt.user,
              created_at: debt.created_at,
              updated_at: debt.updated_at
            };
          });
          
          console.log('✅ Processed test debts:', processedDebts);
          return processedDebts;
        } catch (testError) {
          console.error('❌ Test endpoint also failed:', testError);
        }
      }
      
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
      const response = await axios.post('/api/mongodb/accounts/create/', formattedData);
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
      
      // FIXED: Always use authenticated endpoint to ensure proper user isolation
      
      // Ensure proper data formatting
      const formattedData = {
        name: debtData.name,
        debt_type: debtData.debtType || debtData.debt_type || 'other',
        amount: parseFloat(debtData.balance), // Use amount for backend
        balance: parseFloat(debtData.balance), // Keep balance for frontend
        interest_rate: parseFloat(debtData.interestRate || debtData.interest_rate),
        effective_date: debtData.effectiveDate || debtData.effective_date || new Date().toISOString().split('T')[0],
        payoff_date: debtData.payoffDate || debtData.payoff_date || null
      };
      
      console.log(`📤 Creating debt via: /api/mongodb/debts/create/`);
      console.log('Formatted debt data:', formattedData);
      const response = await axios.post('/api/mongodb/debts/create/', formattedData);
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
      const response = await axios.put(`/api/mongodb/accounts/${accountId}/update/`, formattedData);
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
        amount: parseFloat(debtData.balance), // Use amount for backend
        balance: parseFloat(debtData.balance), // Keep balance for frontend
        interest_rate: parseFloat(debtData.interestRate || debtData.interest_rate),
        effective_date: debtData.effectiveDate || debtData.effective_date || new Date().toISOString().split('T')[0],
        payoff_date: debtData.payoffDate || debtData.payoff_date || null
      };
      
      console.log('Formatted debt update data:', formattedData);
      const response = await axios.put(`/api/mongodb/debts/${debtId}/update/`, formattedData);
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
      await axios.delete(`/api/mongodb/accounts/${accountId}/delete/`);
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
      await axios.delete(`/api/mongodb/debts/${debtId}/delete/`);
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
      const results = [];
      
      // Save accounts
      for (const account of accounts) {
        try {
          const response = await axios.post('/api/mongodb/accounts/create/', account);
          results.push({ type: 'account', success: true, data: response.data });
        } catch (error) {
          results.push({ type: 'account', success: false, error: error.message });
        }
      }
      
      // Save debts
      for (const debt of debts) {
        try {
          const response = await axios.post('/api/mongodb/debts/create/', debt);
          results.push({ type: 'debt', success: true, data: response.data });
        } catch (error) {
          results.push({ type: 'debt', success: false, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error bulk saving accounts and debts:', error);
      throw error;
    }
  }

  // Get history for a specific account or debt
  async getHistory(type, name) {
    try {
      const endpoint = type === 'account' ? '/api/mongodb/accounts/' : '/api/mongodb/debts/';
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
      
      // Use test endpoint for development, regular endpoint for production
      const endpoint = process.env.NODE_ENV === 'development' 
        ? '/api/mongodb/debt-planner-test/'
        : '/api/mongodb/debt-planner/';
      
      const response = await axios.post(endpoint, requestData);
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