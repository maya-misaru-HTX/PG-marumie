import {
  Transaction,
  CategoryBreakdown,
  MonthlyData,
  ExpenseReport,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../types';
import { format, parse } from 'date-fns';

export function calculateCategoryBreakdowns(
  transactions: Transaction[],
  type: 'income' | 'expense'
): CategoryBreakdown[] {
  const filtered = transactions.filter((t) => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryMap = new Map<string, { amount: number; count: number }>();

  filtered.forEach((t) => {
    const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
    categoryMap.set(t.category, {
      amount: existing.amount + t.amount,
      count: existing.count + 1,
    });
  });

  // Convert to array with percentages
  const categories = Array.from(categoryMap.entries()).map(([category, data]) => {
    const percentage = total > 0 ? (data.amount / total) * 100 : 0;
    const color = getCategoryColor(category, type);

    return {
      category,
      amount: data.amount,
      percentage: Math.round(percentage),
      color,
      count: data.count,
    };
  });

  // Sort by amount descending
  return categories.sort((a, b) => b.amount - a.amount);
}

export function calculateMonthlyData(transactions: Transaction[]): MonthlyData[] {
  const monthlyMap = new Map<
    string,
    { income: number; expense: number; month: string; monthNumber: number }
  >();

  transactions.forEach((t) => {
    try {
      const date = parse(t.date, 'yyyy-MM-dd', new Date());
      const monthKey = format(date, 'yyyy-MM');
      const monthNumber = date.getMonth() + 1;
      const monthName = format(date, 'yyyy年M月');

      const existing = monthlyMap.get(monthKey) || {
        income: 0,
        expense: 0,
        month: monthName,
        monthNumber,
      };

      if (t.type === 'income') {
        existing.income += t.amount;
      } else {
        existing.expense += t.amount;
      }

      monthlyMap.set(monthKey, existing);
    } catch (error) {
      console.error('Date parsing error:', t.date, error);
    }
  });

  // Convert to array and calculate balance
  const monthlyData: MonthlyData[] = Array.from(monthlyMap.values())
    .map((data) => ({
      ...data,
      balance: data.income - data.expense,
    }))
    .sort((a, b) => a.monthNumber - b.monthNumber);

  return monthlyData;
}

export function enrichReportWithCalculations(report: ExpenseReport): ExpenseReport {
  // Calculate category breakdowns
  const incomeCategories = calculateCategoryBreakdowns(report.transactions, 'income');
  const expenseCategories = calculateCategoryBreakdowns(report.transactions, 'expense');

  // Calculate monthly data
  const monthlyData = calculateMonthlyData(report.transactions);

  return {
    ...report,
    income: {
      categories: incomeCategories,
      total: incomeCategories.reduce((sum, cat) => sum + cat.amount, 0),
    },
    expenses: {
      categories: expenseCategories,
      total: expenseCategories.reduce((sum, cat) => sum + cat.amount, 0),
    },
    monthlyData,
  };
}

function getCategoryColor(category: string, type: 'income' | 'expense'): string {
  if (type === 'income') {
    const categoryKey = Object.keys(INCOME_CATEGORIES).find((key) =>
      category.includes(key)
    );
    if (categoryKey) {
      return INCOME_CATEGORIES[categoryKey as keyof typeof INCOME_CATEGORIES].color;
    }
    return '#64D8C6'; // Default primary color
  } else {
    const categoryKey = Object.keys(EXPENSE_CATEGORIES).find((key) =>
      category.includes(key)
    );
    if (categoryKey) {
      return EXPENSE_CATEGORIES[categoryKey as keyof typeof EXPENSE_CATEGORIES].color;
    }
    return '#EF4444'; // Default red color
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}
