import apiClient from './api';

export interface BudgetItem {
  name: string;
  amount: number;
}

export interface BudgetExpenses {
  housing: number;
  transportation: number;
  food: number;
  healthcare: number;
  entertainment: number;
  shopping: number;
  travel: number;
  education: number;
  utilities: number;
  childcare: number;
  debt_payments: number;
  others: number;
}

export interface Budget {
  _id?: string;
  user_id: string;
  month: number;
  year: number;
  income: number;
  additional_income: number;
  additional_income_items: BudgetItem[];
  expenses: BudgetExpenses;
  additional_items: BudgetItem[];
  savings_items: BudgetItem[];
  manually_edited_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetData {
  month: number;
  year: number;
  income: number;
  additional_income: number;
  additional_income_items: BudgetItem[];
  expenses: BudgetExpenses;
  additional_items: BudgetItem[];
  savings_items: BudgetItem[];
  manually_edited_categories: string[];
}

export interface BudgetSummary {
  totalIncome: number;
  totalFixedExpenses: number;
  totalAdditionalExpenses: number;
  totalExpenses: number;
  totalSavings: number;
  netBalance: number;
}

class BudgetService {
  // Get all budgets for the current user
  async getBudgets(): Promise<Budget[]> {
    try {
      console.log('📊 Fetching all budgets...');
      const response = await apiClient.get('/api/mongodb/budgets/');
      console.log('📊 Budgets response:', response.data);
      const responseData = response.data as any;
      const budgets = Array.isArray(responseData?.budgets)
        ? responseData.budgets
        : [];

      return budgets.map((budget: any) => ({
        _id: budget._id || budget.id,
        user_id: budget.user_id,
        month: Number(budget.month) || 1,
        year: Number(budget.year) || new Date().getFullYear(),
        income: Number(budget.income) || 0,
        additional_income: Number(budget.additional_income) || 0,
        additional_income_items: Array.isArray(budget.additional_income_items)
          ? budget.additional_income_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : [],
        expenses: {
          housing: Number(budget.expenses?.housing) || 0,
          transportation: Number(budget.expenses?.transportation) || 0,
          food: Number(budget.expenses?.food) || 0,
          healthcare: Number(budget.expenses?.healthcare) || 0,
          entertainment: Number(budget.expenses?.entertainment) || 0,
          shopping: Number(budget.expenses?.shopping) || 0,
          travel: Number(budget.expenses?.travel) || 0,
          education: Number(budget.expenses?.education) || 0,
          utilities: Number(budget.expenses?.utilities) || 0,
          childcare: Number(budget.expenses?.childcare) || 0,
          debt_payments: Number(budget.expenses?.debt_payments) || 0,
          others: Number(budget.expenses?.others) || 0,
        },
        additional_items: Array.isArray(budget.additional_items)
          ? budget.additional_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : [],
        savings_items: Array.isArray(budget.savings_items)
          ? budget.savings_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : [],
        manually_edited_categories: Array.isArray(
          budget.manually_edited_categories
        )
          ? budget.manually_edited_categories
          : [],
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch budgets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get budget for a specific month and year
  async getMonthBudget(month: number, year: number): Promise<Budget | null> {
    try {
      console.log(`📅 Fetching budget for ${month}/${year}...`);
      const response = await apiClient.get(
        `/api/mongodb/budgets/get-month/?month=${month}&year=${year}`
      );
      console.log(`📅 Month budget response:`, response.data);
      const responseData = response.data as any;

      // Handle both response formats: direct budget object or wrapped in 'budget' field
      let budget;
      if (responseData && responseData.budget) {
        // Response wrapped in 'budget' field (from save_month_budget)
        budget = responseData.budget;
      } else if (responseData && responseData._id) {
        // Direct budget object (from get_month_budget)
        budget = responseData;
      } else {
        console.log('📅 No budget found for this month/year');
        return null;
      }
      console.log('📅 Parsed budget data:', budget);
      return {
        _id: budget._id || budget.id,
        user_id: budget.user_id,
        month: Number(budget.month) || month,
        year: Number(budget.year) || year,
        income: Number(budget.income) || 0,
        additional_income: Number(budget.additional_income) || 0,
        additional_income_items: Array.isArray(budget.additional_income_items)
          ? budget.additional_income_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : [],
        expenses: {
          housing: Number(budget.expenses?.housing) || 0,
          transportation: Number(budget.expenses?.transportation) || 0,
          food: Number(budget.expenses?.food) || 0,
          healthcare: Number(budget.expenses?.healthcare) || 0,
          entertainment: Number(budget.expenses?.entertainment) || 0,
          shopping: Number(budget.expenses?.shopping) || 0,
          travel: Number(budget.expenses?.travel) || 0,
          education: Number(budget.expenses?.education) || 0,
          utilities: Number(budget.expenses?.utilities) || 0,
          childcare: Number(budget.expenses?.childcare) || 0,
          debt_payments: Number(budget.expenses?.debt_payments) || 0,
          others: Number(budget.expenses?.others) || 0,
        },
        additional_items: Array.isArray(budget.additional_items)
          ? budget.additional_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : [],
        savings_items: Array.isArray(budget.savings_items)
          ? budget.savings_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : [],
        manually_edited_categories: Array.isArray(
          budget.manually_edited_categories
        )
          ? budget.manually_edited_categories
          : [],
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch month budget: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Create a new budget
  async createBudget(budgetData: CreateBudgetData): Promise<Budget> {
    try {
      console.log('💾 Creating new budget...');
      console.log('💾 Budget data:', budgetData);
      const response = await apiClient.post(
        '/api/mongodb/budgets/create/',
        budgetData
      );
      console.log('💾 Create budget response:', response.data);
      const responseData = response.data as any;

      return {
        _id: responseData._id || responseData.id,
        user_id: responseData.user_id,
        month: Number(responseData.month) || budgetData.month,
        year: Number(responseData.year) || budgetData.year,
        income: Number(responseData.income) || budgetData.income,
        additional_income:
          Number(responseData.additional_income) ||
          budgetData.additional_income,
        additional_income_items: Array.isArray(
          responseData.additional_income_items
        )
          ? responseData.additional_income_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_income_items,
        expenses: {
          housing:
            Number(responseData.expenses?.housing) ||
            budgetData.expenses.housing,
          transportation:
            Number(responseData.expenses?.transportation) ||
            budgetData.expenses.transportation,
          food: Number(responseData.expenses?.food) || budgetData.expenses.food,
          healthcare:
            Number(responseData.expenses?.healthcare) ||
            budgetData.expenses.healthcare,
          entertainment:
            Number(responseData.expenses?.entertainment) ||
            budgetData.expenses.entertainment,
          shopping:
            Number(responseData.expenses?.shopping) ||
            budgetData.expenses.shopping,
          travel:
            Number(responseData.expenses?.travel) || budgetData.expenses.travel,
          education:
            Number(responseData.expenses?.education) ||
            budgetData.expenses.education,
          utilities:
            Number(responseData.expenses?.utilities) ||
            budgetData.expenses.utilities,
          childcare:
            Number(responseData.expenses?.childcare) ||
            budgetData.expenses.childcare,
          debt_payments:
            Number(responseData.expenses?.debt_payments) ||
            budgetData.expenses.debt_payments,
          others:
            Number(responseData.expenses?.others) || budgetData.expenses.others,
        },
        additional_items: Array.isArray(responseData.additional_items)
          ? responseData.additional_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_items,
        savings_items: Array.isArray(responseData.savings_items)
          ? responseData.savings_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.savings_items,
        manually_edited_categories: Array.isArray(
          responseData.manually_edited_categories
        )
          ? responseData.manually_edited_categories
          : budgetData.manually_edited_categories,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update an existing budget
  async updateBudget(
    budgetId: string,
    budgetData: CreateBudgetData
  ): Promise<Budget> {
    try {
      const response = await apiClient.put(
        `/api/mongodb/budgets/${budgetId}/update/`,
        budgetData
      );
      const responseData = response.data as any;

      return {
        _id: responseData._id || responseData.id || budgetId,
        user_id: responseData.user_id,
        month: Number(responseData.month) || budgetData.month,
        year: Number(responseData.year) || budgetData.year,
        income: Number(responseData.income) || budgetData.income,
        additional_income:
          Number(responseData.additional_income) ||
          budgetData.additional_income,
        additional_income_items: Array.isArray(
          responseData.additional_income_items
        )
          ? responseData.additional_income_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_income_items,
        expenses: {
          housing:
            Number(responseData.expenses?.housing) ||
            budgetData.expenses.housing,
          transportation:
            Number(responseData.expenses?.transportation) ||
            budgetData.expenses.transportation,
          food: Number(responseData.expenses?.food) || budgetData.expenses.food,
          healthcare:
            Number(responseData.expenses?.healthcare) ||
            budgetData.expenses.healthcare,
          entertainment:
            Number(responseData.expenses?.entertainment) ||
            budgetData.expenses.entertainment,
          shopping:
            Number(responseData.expenses?.shopping) ||
            budgetData.expenses.shopping,
          travel:
            Number(responseData.expenses?.travel) || budgetData.expenses.travel,
          education:
            Number(responseData.expenses?.education) ||
            budgetData.expenses.education,
          utilities:
            Number(responseData.expenses?.utilities) ||
            budgetData.expenses.utilities,
          childcare:
            Number(responseData.expenses?.childcare) ||
            budgetData.expenses.childcare,
          debt_payments:
            Number(responseData.expenses?.debt_payments) ||
            budgetData.expenses.debt_payments,
          others:
            Number(responseData.expenses?.others) || budgetData.expenses.others,
        },
        additional_items: Array.isArray(responseData.additional_items)
          ? responseData.additional_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_items,
        savings_items: Array.isArray(responseData.savings_items)
          ? responseData.savings_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.savings_items,
        manually_edited_categories: Array.isArray(
          responseData.manually_edited_categories
        )
          ? responseData.manually_edited_categories
          : budgetData.manually_edited_categories,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to update budget: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Save month budget (used for saving current month's budget)
  async saveMonthBudget(budgetData: CreateBudgetData): Promise<Budget> {
    try {
      console.log('💾 Saving month budget...');
      console.log('💾 Save budget data:', budgetData);
      const response = await apiClient.post(
        '/api/mongodb/budgets/save-month/',
        budgetData
      );
      console.log('💾 Save month budget response:', response.data);
      const responseData = response.data as any;

      // The backend returns budget data wrapped in a 'budget' field
      const budget = responseData.budget || responseData;
      console.log('💾 Extracted budget from response:', budget);

      return {
        _id: budget._id || budget.id,
        user_id: budget.user_id,
        month: Number(budget.month) || budgetData.month,
        year: Number(budget.year) || budgetData.year,
        income: Number(budget.income) || budgetData.income,
        additional_income:
          Number(budget.additional_income) || budgetData.additional_income,
        additional_income_items: Array.isArray(budget.additional_income_items)
          ? budget.additional_income_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_income_items,
        expenses: {
          housing:
            Number(budget.expenses?.housing) || budgetData.expenses.housing,
          transportation:
            Number(budget.expenses?.transportation) ||
            budgetData.expenses.transportation,
          food: Number(budget.expenses?.food) || budgetData.expenses.food,
          healthcare:
            Number(budget.expenses?.healthcare) ||
            budgetData.expenses.healthcare,
          entertainment:
            Number(budget.expenses?.entertainment) ||
            budgetData.expenses.entertainment,
          shopping:
            Number(budget.expenses?.shopping) || budgetData.expenses.shopping,
          travel: Number(budget.expenses?.travel) || budgetData.expenses.travel,
          education:
            Number(budget.expenses?.education) || budgetData.expenses.education,
          utilities:
            Number(budget.expenses?.utilities) || budgetData.expenses.utilities,
          childcare:
            Number(budget.expenses?.childcare) || budgetData.expenses.childcare,
          debt_payments:
            Number(budget.expenses?.debt_payments) ||
            budgetData.expenses.debt_payments,
          others: Number(budget.expenses?.others) || budgetData.expenses.others,
        },
        additional_items: Array.isArray(budget.additional_items)
          ? budget.additional_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_items,
        savings_items: Array.isArray(budget.savings_items)
          ? budget.savings_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
              type: item.type || 'custom',
            }))
          : budgetData.savings_items,
        manually_edited_categories: Array.isArray(
          budget.manually_edited_categories
        )
          ? budget.manually_edited_categories
          : budgetData.manually_edited_categories,
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      };
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Unknown error';
      const status = error?.response?.status;

      if (status === 403) {
        throw new Error(
          'Access forbidden. Your session may have expired. Please log out and log back in.'
        );
      } else if (status === 401) {
        throw new Error(
          'Authentication failed. Please log out and log back in.'
        );
      }

      throw new Error(`Failed to save month budget: ${errorMessage}`);
    }
  }

  // Delete a budget
  async deleteBudget(budgetId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/mongodb/budgets/${budgetId}/delete/`);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete budget: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Calculate budget summary
  calculateBudgetSummary(budget: Budget): BudgetSummary {
    const primaryIncome = budget.income || 0;
    const totalAdditionalIncome = budget.additional_income_items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalIncome = primaryIncome + totalAdditionalIncome;

    const totalFixedExpenses = Object.values(budget.expenses).reduce(
      (sum, value) => sum + (value || 0),
      0
    );
    const totalAdditionalExpenses = budget.additional_items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalExpenses = totalFixedExpenses + totalAdditionalExpenses;

    const totalSavings = budget.savings_items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const netBalance = totalIncome - totalExpenses - totalSavings;

    return {
      totalIncome,
      totalFixedExpenses,
      totalAdditionalExpenses,
      totalExpenses,
      totalSavings,
      netBalance,
    };
  }

  // Test endpoint to save budget without authentication (for debugging)
  async testSaveMonthBudget(budgetData: CreateBudgetData): Promise<Budget> {
    try {
      console.log('🧪 Testing budget save without authentication...');
      console.log('🧪 Test budget data:', budgetData);
      const response = await apiClient.post(
        '/api/mongodb/budgets/save-month-test/',
        budgetData
      );
      console.log('🧪 Test save response:', response.data);
      const responseData = response.data as any;

      const budget = responseData.budget || responseData;
      console.log('🧪 Extracted test budget:', budget);

      return {
        _id: budget._id || budget.id,
        user_id: budget.user_id,
        month: Number(budget.month) || budgetData.month,
        year: Number(budget.year) || budgetData.year,
        income: Number(budget.income) || budgetData.income,
        additional_income:
          Number(budget.additional_income) || budgetData.additional_income,
        additional_income_items: Array.isArray(budget.additional_income_items)
          ? budget.additional_income_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_income_items,
        expenses: {
          housing:
            Number(budget.expenses?.housing) || budgetData.expenses.housing,
          transportation:
            Number(budget.expenses?.transportation) ||
            budgetData.expenses.transportation,
          food: Number(budget.expenses?.food) || budgetData.expenses.food,
          healthcare:
            Number(budget.expenses?.healthcare) ||
            budgetData.expenses.healthcare,
          entertainment:
            Number(budget.expenses?.entertainment) ||
            budgetData.expenses.entertainment,
          shopping:
            Number(budget.expenses?.shopping) || budgetData.expenses.shopping,
          travel: Number(budget.expenses?.travel) || budgetData.expenses.travel,
          education:
            Number(budget.expenses?.education) || budgetData.expenses.education,
          utilities:
            Number(budget.expenses?.utilities) || budgetData.expenses.utilities,
          childcare:
            Number(budget.expenses?.childcare) || budgetData.expenses.childcare,
          debt_payments:
            Number(budget.expenses?.debt_payments) ||
            budgetData.expenses.debt_payments,
          others: Number(budget.expenses?.others) || budgetData.expenses.others,
        },
        additional_items: Array.isArray(budget.additional_items)
          ? budget.additional_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
            }))
          : budgetData.additional_items,
        savings_items: Array.isArray(budget.savings_items)
          ? budget.savings_items.map((item: any) => ({
              name: item.name || '',
              amount: Number(item.amount) || 0,
              type: item.type || 'custom',
            }))
          : budgetData.savings_items,
        manually_edited_categories: Array.isArray(
          budget.manually_edited_categories
        )
          ? budget.manually_edited_categories
          : budgetData.manually_edited_categories,
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to test save month budget: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get current month and year
  getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return {
      month: now.getMonth() + 1, // 1-based month
      year: now.getFullYear(),
    };
  }

  // Get month name from number
  getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || 'Unknown';
  }

  // Get expense categories with icons and colors
  getExpenseCategories() {
    return {
      housing: { label: 'Housing', icon: 'home', color: '#FF6B6B' },
      transportation: {
        label: 'Transportation',
        icon: 'car',
        color: '#4ECDC4',
      },
      food: { label: 'Food', icon: 'restaurant', color: '#45B7D1' },
      healthcare: { label: 'Healthcare', icon: 'medical', color: '#96CEB4' },
      entertainment: { label: 'Entertainment', icon: 'film', color: '#FFEAA7' },
      shopping: { label: 'Shopping', icon: 'bag', color: '#DDA0DD' },
      travel: { label: 'Travel', icon: 'airplane', color: '#98D8C8' },
      education: { label: 'Education', icon: 'school', color: '#F7DC6F' },
      utilities: { label: 'Utilities', icon: 'build', color: '#BB8FCE' },
      childcare: { label: 'Childcare', icon: 'people', color: '#85C1E9' },
      debt_payments: { label: 'Debt Payments', icon: 'card', color: '#F8C471' },
      others: {
        label: 'Miscellaneous',
        icon: 'ellipsis-horizontal',
        color: '#82E0AA',
      },
    };
  }

  // Get predefined savings options
  getSavingsOptions() {
    return [
      {
        name: 'Emergency Fund',
        amount: 0,
        icon: 'shield-checkmark',
        color: '#FF6B6B',
      },
      { name: 'Retirement (401k)', amount: 0, icon: 'time', color: '#4ECDC4' },
      { name: 'Retirement (IRA)', amount: 0, icon: 'time', color: '#45B7D1' },
      {
        name: 'Investment Account',
        amount: 0,
        icon: 'trending-up',
        color: '#96CEB4',
      },
      { name: 'Vacation Fund', amount: 0, icon: 'airplane', color: '#FFEAA7' },
      { name: 'Home Down Payment', amount: 0, icon: 'home', color: '#DDA0DD' },
      { name: 'Car Fund', amount: 0, icon: 'car', color: '#98D8C8' },
      {
        name: 'Children Education Fund',
        amount: 0,
        icon: 'school',
        color: '#F7DC6F',
      },
      { name: 'Wedding Fund', amount: 0, icon: 'heart', color: '#BB8FCE' },
      { name: 'Business Fund', amount: 0, icon: 'business', color: '#85C1E9' },
      { name: 'Health Fund', amount: 0, icon: 'medical', color: '#F8C471' },
      {
        name: 'Others',
        amount: 0,
        icon: 'ellipsis-horizontal',
        color: '#82E0AA',
      },
    ];
  }
}

export default new BudgetService();
