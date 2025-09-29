import apiClient from './api';

export interface Debt {
  _id: string;
  name: string;
  debt_type: string;
  balance: number;
  amount: number;
  interest_rate: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetData {
  month: number;
  year: number;
  category: string;
  type: string;
  amount: number;
  _id?: string;
  income?: number;
  additional_income?: number;
  expenses?: Record<string, number>;
}

export interface DebtPlannerRequest {
  debts: Debt[];
  strategy: 'snowball' | 'avalanche';
  monthly_budget_data: BudgetData[];
}

export interface DebtPlannerResponse {
  success: boolean;
  message: string;
  payoff_plan: {
    total_months: number;
    total_interest_paid: number;
    total_payments: number;
    monthly_payments: Array<{
      month: number;
      year: number;
      total_payment: number;
      debts: Array<{
        debt_id: string;
        debt_name: string;
        payment: number;
        remaining_balance: number;
        interest_paid: number;
      }>;
    }>;
  };
}

export interface DebtStrategy {
  id: 'snowball' | 'avalanche';
  name: string;
  description: string;
  icon: string;
}

class DebtPlanningService {
  /**
   * Get all debts for the authenticated user
   */
  async getDebts(): Promise<Debt[]> {
    try {
      console.log('💳 Fetching debts...');
      const response = await apiClient.get('/api/mongodb/debts/');
      console.log('💳 Debts response:', response.data);
      return (response.data as any)?.debts || [];
    } catch (error) {
      console.error('💳 Error fetching debts:', error);
      throw new Error(`Failed to fetch debts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get budget data for debt planning
   */
  async getBudgetData(): Promise<BudgetData[]> {
    try {
      console.log('💰 Fetching budget data...');
      const response = await apiClient.get('/api/mongodb/budgets/');
      console.log('💰 Budget response:', response.data);
      return (response.data as any)?.budgets || [];
    } catch (error) {
      console.error('💰 Error fetching budget data:', error);
      throw new Error(`Failed to fetch budget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate debt payoff plan
   */
  async calculateDebtPlan(request: DebtPlannerRequest): Promise<DebtPlannerResponse> {
    try {
      console.log('📊 Calculating debt plan with strategy:', request.strategy);
      
      // Transform debt data to match backend expectations
      const transformedRequest = {
        ...request,
        debts: request.debts.map(debt => ({
          _id: debt._id,
          name: debt.name,
          balance: debt.balance,
          rate: debt.interest_rate / 100, // Convert percentage to decimal (2.3% -> 0.023)
          debt_type: debt.debt_type,
          amount: debt.amount,
          effective_date: debt.effective_date,
          created_at: debt.created_at,
          updated_at: debt.updated_at
        }))
      };
      
      console.log('📊 Transformed request:', transformedRequest);
      const response = await apiClient.post('/api/mongodb/debt-planner/', transformedRequest);
      console.log('📊 Debt plan response:', response.data);
      
      // Transform backend response to match mobile app expectations
      const backendData = response.data as any;
      console.log('📊 Backend response structure:', backendData);
      
      // Calculate total payments from the plan
      const totalPayments = backendData.plan?.reduce((sum: number, month: any) => {
        const monthTotal = month.debts?.reduce((debtSum: number, debt: any) => debtSum + (debt.paid || 0), 0) || 0;
        return sum + monthTotal;
      }, 0) || 0;
      
      const transformedResponse: DebtPlannerResponse = {
        success: true,
        message: 'Debt plan calculated successfully',
        payoff_plan: {
          total_months: backendData.months || 0,
          total_interest_paid: backendData.total_interest || 0,
          total_payments: totalPayments,
          monthly_payments: (backendData.plan || []).map((month: any, index: number) => {
            const monthTotal = month.debts?.reduce((sum: number, debt: any) => sum + (debt.paid || 0), 0) || 0;
            return {
              month: month.month || index,
              year: new Date().getFullYear() + Math.floor((month.month || index) / 12),
              total_payment: monthTotal,
              debts: (month.debts || []).map((debt: any) => ({
                debt_id: debt.name || '',
                debt_name: debt.name || '',
                payment: debt.paid || 0,
                remaining_balance: debt.balance || 0,
                interest_paid: debt.interest_payment || 0
              }))
            };
          })
        }
      };
      
      console.log('📊 Transformed response:', transformedResponse);
      return transformedResponse;
    } catch (error) {
      console.error('📊 Error calculating debt plan:', error);
      throw new Error(`Failed to calculate debt plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new debt
   */
  async createDebt(debtData: Partial<Debt>): Promise<Debt> {
    try {
      console.log('➕ Creating debt:', debtData);
      const response = await apiClient.post('/api/mongodb/debts/create/', debtData);
      console.log('➕ Debt created:', response.data);
      return response.data as Debt;
    } catch (error) {
      console.error('➕ Error creating debt:', error);
      throw new Error(`Failed to create debt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing debt
   */
  async updateDebt(debtId: string, debtData: Partial<Debt>): Promise<Debt> {
    try {
      console.log('✏️ Updating debt:', debtId, debtData);
      const response = await apiClient.put(`/api/mongodb/debts/${debtId}/update/`, debtData);
      console.log('✏️ Debt updated:', response.data);
      return response.data as Debt;
    } catch (error) {
      console.error('✏️ Error updating debt:', error);
      throw new Error(`Failed to update debt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a debt
   */
  async deleteDebt(debtId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting debt:', debtId);
      const response = await apiClient.delete(`/api/mongodb/debts/${debtId}/delete/`);
      console.log('🗑️ Debt deleted:', response.data);
      return response.status === 200;
    } catch (error) {
      console.error('🗑️ Error deleting debt:', error);
      throw new Error(`Failed to delete debt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available debt strategies
   */
  getDebtStrategies(): DebtStrategy[] {
    return [
      {
        id: 'snowball',
        name: 'Snowball Method',
        description: 'Pay off smallest debts first to build momentum',
        icon: 'snow'
      },
      {
        id: 'avalanche',
        name: 'Avalanche Method',
        description: 'Pay off highest interest debts first to save money',
        icon: 'trending-down'
      }
    ];
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
  formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }

  /**
   * Calculate total debt amount
   */
  calculateTotalDebt(debts: Debt[]): number {
    return debts.reduce((total, debt) => total + (debt.balance || 0), 0);
  }

  /**
   * Calculate weighted average interest rate
   */
  calculateWeightedAverageRate(debts: Debt[]): number {
    if (debts.length === 0) return 0;
    
    const totalDebt = this.calculateTotalDebt(debts);
    if (totalDebt === 0) return 0;
    
    const weightedSum = debts.reduce((sum, debt) => {
      const weight = (debt.balance || 0) / totalDebt;
      return sum + (debt.interest_rate || 0) * weight;
    }, 0);
    
    return weightedSum;
  }
}

export default new DebtPlanningService();
