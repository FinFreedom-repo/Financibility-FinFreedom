import apiClient from './api';

export interface WealthProjectionData {
  age: number;
  maxAge: number;
  startWealth: number;
  debt: number;
  debtInterest: number;
  assetInterest: number;
  inflation: number;
  taxRate: number;
  annualContributions: number;
  checkingInterest: number;
}

export interface WealthProjectionPoint {
  year: number;
  age: number;
  scenario_1: number; // Investment Growth After Tax
  scenario_2: number; // Investment Growth After Tax & Inflation
  scenario_3: number; // Checking Account Growth (No Taxes)
  scenario_4: number; // Checking Account Growth After Tax
  debt_line: number; // Debt Over Time
  net_worth: number;
  wealth: number;
  debt: number;
  adjusted_wealth: number;
  adjusted_debt: number;
  adjusted_net_worth: number;
  checking_wealth: number;
  adjusted_checking_wealth: number;
}

export interface WealthProjectionResponse {
  success: boolean;
  projections: WealthProjectionPoint[];
  user_id: string;
  calculation_date: string;
  total_years: number;
}

class WealthProjectionService {
  /**
   * Calculate wealth projection with enhanced debt repayment simulation
   */
  async calculateWealthProjection(data: WealthProjectionData): Promise<WealthProjectionResponse> {
    try {
      console.log('💰 Calculating wealth projection with data:', data);
      
      const response = await apiClient.post('/api/mongodb/project-wealth-enhanced/', data);
      
      console.log('💰 Wealth projection calculated successfully');
      
      if (response.data && (response.data as any).projections) {
        return response.data as WealthProjectionResponse;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('💰 Error calculating wealth projection:', error);
      throw new Error(`Failed to calculate wealth projection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get saved wealth projection settings
   */
  async getSavedSettings(): Promise<WealthProjectionData | null> {
    try {
      console.log('💰 Getting saved wealth projection settings...');
      
      const response = await apiClient.get('/api/mongodb/wealth-projection-settings/');
      
      console.log('💰 Saved settings response:', response.data);
      
      if (response.data && (response.data as any).settings) {
        const settings = (response.data as any).settings;
        // Convert snake_case to camelCase for frontend compatibility
        return {
          age: settings.age,
          startWealth: settings.start_wealth,
          debt: settings.debt,
          debtInterest: settings.debt_interest,
          assetInterest: settings.asset_interest,
          inflation: settings.inflation,
          taxRate: settings.tax_rate,
          annualContributions: settings.annual_contributions,
          checkingInterest: settings.checking_interest,
          maxAge: settings.max_age
        };
      }
      
      return null;
    } catch (error) {
      console.error('💰 Error getting saved settings:', error);
      return null;
    }
  }

  /**
   * Save wealth projection settings
   */
  async saveSettings(data: WealthProjectionData): Promise<boolean> {
    try {
      console.log('💰 Saving wealth projection settings:', data);
      
      // Convert camelCase to snake_case for backend compatibility
      const backendData = {
        age: data.age,
        start_wealth: data.startWealth,
        debt: data.debt,
        debt_interest: data.debtInterest,
        asset_interest: data.assetInterest,
        inflation: data.inflation,
        tax_rate: data.taxRate,
        annual_contributions: data.annualContributions,
        checking_interest: data.checkingInterest,
        max_age: data.maxAge
      };
      
      console.log('💰 Converted data for backend:', backendData);
      
      const response = await apiClient.post('/api/mongodb/wealth-projection-settings/save/', backendData);
      
      console.log('💰 Save settings response:', response.data);
      
      return response.status === 200;
    } catch (error) {
      console.error('💰 Error saving settings:', error);
      return false;
    }
  }

  /**
   * Import financial data from accounts and debts
   */
  async importFinancialData(): Promise<Partial<WealthProjectionData> | null> {
    try {
      console.log('💰 Importing financial data...');
      
      // Get accounts and debts separately
      const [accountsResponse, debtsResponse] = await Promise.all([
        apiClient.get('/api/mongodb/accounts/'),
        apiClient.get('/api/mongodb/debts/')
      ]);
      
      console.log('💰 Accounts response:', accountsResponse.data);
      console.log('💰 Debts response:', debtsResponse.data);
      
      const accounts = (accountsResponse.data as any)?.accounts || [];
      const debts = (debtsResponse.data as any)?.debts || [];
      
      console.log('💰 Extracted accounts:', accounts.length, 'items');
      console.log('💰 Extracted debts:', debts.length, 'items');
      
      // Calculate total assets
      const totalAssets = accounts.reduce((sum: number, account: any) => {
        return sum + (account.balance || 0);
      }, 0);
      
      // Calculate total debt
      const totalDebt = debts.reduce((sum: number, debt: any) => {
        return sum + (debt.balance || 0);
      }, 0);
      
      console.log('💰 Calculated totals - Assets:', totalAssets, 'Debts:', totalDebt);
      
      return {
        startWealth: totalAssets,
        debt: totalDebt,
      };
    } catch (error) {
      console.error('💰 Error importing financial data:', error);
      return null;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Get default projection data
   */
  getDefaultData(): WealthProjectionData {
    return {
      age: 25,
      maxAge: 100,
      startWealth: 10000,
      debt: 0,
      debtInterest: 6.0,
      assetInterest: 10.5,
      inflation: 2.5,
      taxRate: 25.0,
      annualContributions: 5000,
      checkingInterest: 4.0,
    };
  }

  /**
   * Ensure all fields have default values
   */
  sanitizeData(data: Partial<WealthProjectionData>): WealthProjectionData {
    const defaults = this.getDefaultData();
    return {
      age: data.age ?? defaults.age,
      maxAge: data.maxAge ?? defaults.maxAge,
      startWealth: data.startWealth ?? defaults.startWealth,
      debt: data.debt ?? defaults.debt,
      debtInterest: data.debtInterest ?? defaults.debtInterest,
      assetInterest: data.assetInterest ?? defaults.assetInterest,
      inflation: data.inflation ?? defaults.inflation,
      taxRate: data.taxRate ?? defaults.taxRate,
      annualContributions: data.annualContributions ?? defaults.annualContributions,
      checkingInterest: data.checkingInterest ?? defaults.checkingInterest,
    };
  }
}

export default new WealthProjectionService();
