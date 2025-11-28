import apiClient from './api';

export interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  interest_rate: number;
  effective_date: string;
  user: string;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  name: string;
  debt_type: string;
  balance: number;
  amount: number;
  interest_rate: number;
  effective_date: string;
  payoff_date: string | null;
  user: string;
  created_at: string;
  updated_at: string;
}

export interface AccountsDebtsSummary {
  accounts: Account[];
  debts: Debt[];
  total_account_balance: number;
  total_debt_balance: number;
  net_worth: number;
}

export interface CreateAccountData {
  name: string;
  accountType: string;
  balance: number;
  interestRate: number;
  effectiveDate: string;
}

export interface CreateDebtData {
  name: string;
  debtType: string;
  balance: number;
  interestRate: number;
  effectiveDate: string;
  payoffDate?: string;
}

class AccountsDebtsService {
  // Get all accounts and debts with summary
  async getAccountsDebtsSummary(): Promise<AccountsDebtsSummary> {
    try {
      const [accountsResponse, debtsResponse] = await Promise.all([
        apiClient.get('/api/mongodb/accounts/'),
        apiClient.get('/api/mongodb/debts/'),
      ]);

      const accountsData = accountsResponse.data as any;
      const debtsData = debtsResponse.data as any;

      const accounts = Array.isArray(accountsData?.accounts)
        ? accountsData.accounts
        : [];
      const debts = Array.isArray(debtsData?.debts) ? debtsData.debts : [];

      const totalAccountBalance = accounts.reduce(
        (sum: number, acc: any) => sum + (parseFloat(acc.balance) || 0),
        0
      );
      const totalDebtBalance = debts.reduce(
        (sum: number, debt: any) =>
          sum + (parseFloat(debt.balance || debt.amount) || 0),
        0
      );

      return {
        accounts: accounts.map((account: any) => ({
          id: account._id || account.id,
          name: account.name || 'Unnamed Account',
          account_type: account.account_type || 'checking',
          balance: parseFloat(account.balance) || 0,
          interest_rate: parseFloat(account.interest_rate) || 0,
          effective_date:
            account.effective_date || new Date().toISOString().split('T')[0],
          user: account.user,
          created_at: account.created_at,
          updated_at: account.updated_at,
        })),
        debts: debts.map((debt: any) => ({
          id: debt._id || debt.id,
          name: debt.name || 'Unnamed Debt',
          debt_type: debt.debt_type || 'other',
          balance: parseFloat(debt.amount || debt.balance) || 0,
          amount: parseFloat(debt.amount || debt.balance) || 0,
          interest_rate: parseFloat(debt.interest_rate) || 0,
          effective_date:
            debt.effective_date || new Date().toISOString().split('T')[0],
          payoff_date: debt.payoff_date || null,
          user: debt.user,
          created_at: debt.created_at,
          updated_at: debt.updated_at,
        })),
        total_account_balance: totalAccountBalance,
        total_debt_balance: totalDebtBalance,
        net_worth: totalAccountBalance - totalDebtBalance,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all accounts
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await apiClient.get('/api/mongodb/accounts/');
      const responseData = response.data as any;
      const accounts = Array.isArray(responseData?.accounts)
        ? responseData.accounts
        : [];

      // Process each account to ensure proper field mapping and number conversion
      const processedAccounts = accounts.map((account: any) => ({
        id: account._id || account.id,
        name: account.name || 'Unnamed Account',
        account_type: account.account_type || 'checking',
        balance: parseFloat(account.balance) || 0,
        interest_rate: parseFloat(account.interest_rate) || 0,
        effective_date:
          account.effective_date || new Date().toISOString().split('T')[0],
        user: account.user,
        created_at: account.created_at,
        updated_at: account.updated_at,
      }));

      return processedAccounts;
    } catch (error) {
      throw new Error(
        `Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get all debts
  async getDebts(): Promise<Debt[]> {
    try {
      const response = await apiClient.get('/api/mongodb/debts/');
      const responseData = response.data as any;
      const debts = Array.isArray(responseData?.debts)
        ? responseData.debts
        : [];

      // Process each debt to ensure proper field mapping and number conversion
      const processedDebts = debts.map((debt: any) => ({
        id: debt._id || debt.id,
        name: debt.name || 'Unnamed Debt',
        debt_type: debt.debt_type || 'other',
        balance: parseFloat(debt.amount || debt.balance) || 0,
        amount: parseFloat(debt.amount || debt.balance) || 0,
        interest_rate: parseFloat(debt.interest_rate) || 0,
        effective_date:
          debt.effective_date || new Date().toISOString().split('T')[0],
        payoff_date: debt.payoff_date || null,
        user: debt.user,
        created_at: debt.created_at,
        updated_at: debt.updated_at,
      }));

      return processedDebts;
    } catch (error) {
      throw new Error(
        `Failed to fetch debts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Create a new account
  async createAccount(accountData: CreateAccountData): Promise<Account> {
    try {
      const formattedData = {
        name: accountData.name,
        account_type: accountData.accountType,
        balance: accountData.balance,
        interest_rate: accountData.interestRate,
        effective_date: accountData.effectiveDate,
      };

      const response = await apiClient.post(
        '/api/mongodb/accounts/create/',
        formattedData
      );
      const responseData = response.data as any;

      return {
        id: responseData._id || responseData.id,
        name: responseData.name || accountData.name,
        account_type: responseData.account_type || accountData.accountType,
        balance: parseFloat(responseData.balance) || accountData.balance,
        interest_rate:
          parseFloat(responseData.interest_rate) || accountData.interestRate,
        effective_date:
          responseData.effective_date || accountData.effectiveDate,
        user: responseData.user,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Create a new debt
  async createDebt(debtData: CreateDebtData): Promise<Debt> {
    try {
      const formattedData = {
        name: debtData.name,
        debt_type: debtData.debtType,
        amount: debtData.balance,
        balance: debtData.balance,
        interest_rate: debtData.interestRate,
        effective_date: debtData.effectiveDate,
        payoff_date: debtData.payoffDate || null,
      };

      const response = await apiClient.post(
        '/api/mongodb/debts/create/',
        formattedData
      );
      const responseData = response.data as any;

      // Handle both response formats: { debt: {...} } or direct debt object
      const debt = responseData.debt || responseData;

      return {
        id: debt._id || debt.id,
        name: debt.name || debtData.name,
        debt_type: debt.debt_type || debtData.debtType,
        balance: parseFloat(debt.balance || debt.amount) || debtData.balance,
        amount: parseFloat(debt.amount || debt.balance) || debtData.balance,
        interest_rate: parseFloat(debt.interest_rate) || debtData.interestRate,
        effective_date: debt.effective_date || debtData.effectiveDate,
        payoff_date: debt.payoff_date || debtData.payoffDate || null,
        user: debt.user,
        created_at: debt.created_at,
        updated_at: debt.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to create debt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update an account
  async updateAccount(
    accountId: string,
    accountData: CreateAccountData
  ): Promise<Account> {
    try {
      const formattedData = {
        name: accountData.name,
        account_type: accountData.accountType,
        balance: accountData.balance,
        interest_rate: accountData.interestRate,
        effective_date: accountData.effectiveDate,
      };

      const response = await apiClient.put(
        `/api/mongodb/accounts/${accountId}/update/`,
        formattedData
      );
      const responseData = response.data as any;

      return {
        id: responseData._id || responseData.id || accountId,
        name: responseData.name || accountData.name,
        account_type: responseData.account_type || accountData.accountType,
        balance: parseFloat(responseData.balance) || accountData.balance,
        interest_rate:
          parseFloat(responseData.interest_rate) || accountData.interestRate,
        effective_date:
          responseData.effective_date || accountData.effectiveDate,
        user: responseData.user,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update a debt
  async updateDebt(debtId: string, debtData: CreateDebtData): Promise<Debt> {
    try {
      const formattedData = {
        name: debtData.name,
        debt_type: debtData.debtType,
        amount: debtData.balance,
        balance: debtData.balance,
        interest_rate: debtData.interestRate,
        effective_date: debtData.effectiveDate,
        payoff_date: debtData.payoffDate || null,
      };

      const response = await apiClient.put(
        `/api/mongodb/debts/${debtId}/update/`,
        formattedData
      );
      const responseData = response.data as any;

      return {
        id: responseData._id || responseData.id || debtId,
        name: responseData.name || debtData.name,
        debt_type: responseData.debt_type || debtData.debtType,
        balance:
          parseFloat(responseData.balance || responseData.amount) ||
          debtData.balance,
        amount:
          parseFloat(responseData.amount || responseData.balance) ||
          debtData.balance,
        interest_rate:
          parseFloat(responseData.interest_rate) || debtData.interestRate,
        effective_date: responseData.effective_date || debtData.effectiveDate,
        payoff_date: responseData.payoff_date || debtData.payoffDate || null,
        user: responseData.user,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to update debt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Delete an account
  async deleteAccount(accountId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/mongodb/accounts/${accountId}/delete/`);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Delete a debt
  async deleteDebt(debtId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/mongodb/debts/${debtId}/delete/`);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete debt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default new AccountsDebtsService();
