import { Debt, BudgetData } from '../../services/debtPlanningService';

// Frontend debt calculation with corrected timing logic - matching website exactly
export const calculateDebtPayoffPlanFrontend = (
  netSavingsData: any, 
  debts: Debt[], 
  strategyType: 'snowball' | 'avalanche', 
  months: any[]
) => {
  console.log('🔄 Calculating debt payoff plan on frontend with corrected timing...');
  
  if (!debts || debts.length === 0 || !netSavingsData) {
    return null;
  }

    // Initialize debt balances
    const debtBalances = debts.map(debt => ({
      name: debt.name,
      balance: parseFloat(debt.balance.toString()) || 0,
      rate: (parseFloat(debt.interest_rate.toString()) || 0) / 100,
      minimumPayment: 0, // Default minimum payment
      debt_type: debt.debt_type || 'other'
    }));

  const currentMonthIdx = months.findIndex(m => m.type === 'current');
  const getNetSavingsForMonth = (idx: number) => {
    // Historical months do not contribute to payoff
    if (months[idx]?.type === 'historical') return 0;
    const raw = netSavingsData ? netSavingsData[`month_${idx}`] : undefined;
    const num = parseFloat(raw);
    if (Number.isFinite(num)) return num;
    // Fallback: for generated months without DB data, inherit current month's net
    const currentNet = parseFloat(netSavingsData?.[`month_${currentMonthIdx}`]) || 0;
    return currentNet;
  };
  const plan = [];

  // Calculate for each month starting from current month
  for (let monthIdx = currentMonthIdx; monthIdx < months.length; monthIdx++) {
    const netSavings = getNetSavingsForMonth(monthIdx);
    const monthPlan = {
      month: monthIdx,
      net_savings: netSavings,
      debts: [],
      totalPaid: 0,
      totalInterest: 0
    };

    // Calculate interest for this month
    let totalInterest = 0;
    debtBalances.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyInterest = debt.balance * (debt.rate / 12);
        debt.balance += monthlyInterest;
        totalInterest += monthlyInterest;
      }
    });

    // Apply net savings to debt payment in the SAME month
    let availableForDebt = Math.max(0, netSavings);
    let totalPaidToDebt = 0;

    if (availableForDebt > 0 && debtBalances.some(d => d.balance > 0)) {
      // Sort debts by strategy (Snowball: lowest to highest balance, Avalanche: highest to lowest interest rate)
      const sortedDebts = [...debtBalances].sort((a, b) => {
        if (strategyType === 'snowball') {
          return a.balance - b.balance; // Smallest balance first
        } else {
          return b.rate - a.rate; // Highest rate first
        }
      });

      // Pay minimum payments first
      sortedDebts.forEach(debt => {
        if (debt.balance > 0 && availableForDebt > 0) {
          const payment = Math.min(debt.minimumPayment, debt.balance, availableForDebt);
          debt.balance -= payment;
          availableForDebt -= payment;
          totalPaidToDebt += payment;
        }
      });

      // Apply remaining amount to debts according to strategy
      for (const debt of sortedDebts) {
        if (availableForDebt <= 0 || debt.balance <= 0) continue;
        
        const payment = Math.min(availableForDebt, debt.balance);
        debt.balance -= payment;
        availableForDebt -= payment;
        totalPaidToDebt += payment;
      }
    }

    // Record debt states for this month
    const paidPerDebt = totalPaidToDebt > 0
      ? (() => {
          const count = debtBalances.filter(d => d.balance >= 0).length || debtBalances.length || 1;
          return totalPaidToDebt / count;
        })()
      : 0;
    const interestPerDebt = totalInterest > 0
      ? (() => {
          const count = debtBalances.filter(d => d.balance >= 0).length || debtBalances.length || 1;
          return totalInterest / count;
        })()
      : 0;

      debtBalances.forEach(debt => {
        (monthPlan.debts as any[]).push({
          name: debt.name,
          balance: Math.max(0, debt.balance),
          paid: paidPerDebt,
          interest: interestPerDebt
        });
      });

    // Store monthly totals for robust timeline rows
    monthPlan.totalPaid = totalPaidToDebt;
    monthPlan.totalInterest = totalInterest;
    
      // Calculate total remaining debt for this month
      (monthPlan as any).remainingDebt = debtBalances.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0);

    plan.push(monthPlan);
  }

  console.log('✅ Frontend debt payoff plan calculated with same-month timing');
  return { plan };
};

// Recalculate net savings - matching website logic exactly
export const recalculateNetSavings = (gridData: Record<string, any>[], months: any[]) => {
  if (!months || months.length === 0) return gridData;
  
  const updatedData = [...gridData];
  
  months.forEach((_, idx) => {
    // Calculate total income
    const incomeRows = updatedData.filter(row => row.type === 'income' || row.type === 'additional_income');
    const totalIncome = incomeRows.reduce((sum, row) => sum + (parseFloat(row[`month_${idx}`]) || 0), 0);
    
    // Calculate total expenses
    const expenseRows = updatedData.filter(row => row.type === 'expense');
    const totalExpenses = expenseRows.reduce((sum, row) => sum + (parseFloat(row[`month_${idx}`]) || 0), 0);
    
    // Calculate net savings: income - expenses + savings
    const savingsRow = updatedData.find(row => row.category === 'Savings');
    const savings = savingsRow ? (parseFloat(savingsRow[`month_${idx}`]) || 0) : 0;
    const netSavings = totalIncome - totalExpenses + savings;
    
    // Update Net Savings row
    const netSavingsRow = updatedData.find(row => row.category === 'Net Savings');
    if (netSavingsRow) {
      netSavingsRow[`month_${idx}`] = netSavings;
    }
  });
  
  return updatedData;
};

// Update total debt from payoff plan
export const updateTotalDebtFromPayoffPlan = (gridData: Record<string, any>[], payoffPlan: any, months: any[]) => {
  const currentMonthIdx = months.findIndex(m => m.type === 'current');
  
  const updatedData = [...gridData];
  const remainingDebtRow = updatedData.find(row => row.category === 'Remaining Debt');
  
  if (remainingDebtRow && payoffPlan.plan) {
    months.forEach((_, idx) => {
      if (idx >= currentMonthIdx) {
        const planIdx = idx - currentMonthIdx;
        const monthPlan = payoffPlan.plan[planIdx];
        if (monthPlan) {
          remainingDebtRow[`month_${idx}`] = monthPlan.remainingDebt || 0;
        }
      }
    });
  }
  
  return updatedData;
};

// Calculate net savings from a single budget
export const calculateNetSavingsFromBudget = (budget: BudgetData) => {
  const primaryIncome = budget.income || 0;
  const additionalIncome = budget.additional_income || 0;
  const totalIncome = primaryIncome + additionalIncome;
  const expenses = Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0);
  return totalIncome - expenses;
};
