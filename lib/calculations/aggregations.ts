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
  type: 'income' | 'expense',
  declaredTotal?: number
): CategoryBreakdown[] {
  const filtered = transactions.filter((t) => t.type === type);
  const transactionTotal = filtered.reduce((sum, t) => sum + t.amount, 0);

  // Use declared total if provided, otherwise use transaction total
  const total = declaredTotal ?? transactionTotal;

  // Group by category
  const categoryMap = new Map<string, { amount: number; count: number }>();

  filtered.forEach((t) => {
    const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
    categoryMap.set(t.category, {
      amount: existing.amount + t.amount,
      count: existing.count + 1,
    });
  });

  // Convert to array with percentages (based on declared total, not transaction total)
  const categories = Array.from(categoryMap.entries()).map(([category, data]) => {
    const percentage = total > 0 ? (data.amount / total) * 100 : 0;

    return {
      category,
      amount: data.amount,
      percentage: Math.round(percentage), // Round to whole number
      color: '', // Will assign after sorting
      count: data.count,
    };
  });

  // Sort by amount descending
  const sorted = categories.sort((a, b) => b.amount - a.amount);

  // Assign colors based on rank (largest = darkest, smallest = lightest)
  const gradationPalette = type === 'income'
    ? ['#1A5E56', '#238778', '#2FA897', '#4BC4B0', '#64D8C6', '#8FE5D6', '#BCECD3', '#E6F7F4']
    : ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'];

  return sorted.map((cat, index) => {
    // Special case for "その他" - always gray
    if (cat.category === 'その他' || cat.category === 'その他の収入' || cat.category === 'その他の経費') {
      return { ...cat, color: '#9CA3AF' };
    }

    // Assign color from gradation palette based on index
    const colorIndex = Math.min(index, gradationPalette.length - 1);
    return { ...cat, color: gradationPalette[colorIndex] };
  });
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
  // For pie charts, use "今年の収入" and "今年の支出" as the totals (excluding carryovers)
  const thisYearIncome = report.summary.incomeTotal - report.summary.carriedFromPrevYear;
  const thisYearExpense = report.summary.thisYearExpense ?? (report.summary.expenseTotal - report.summary.carriedToNextYear);

  // Calculate category breakdowns with this year's totals for correct percentages
  const incomeCategories = calculateCategoryBreakdowns(
    report.transactions,
    'income',
    thisYearIncome
  );
  const expenseCategories = calculateCategoryBreakdowns(
    report.transactions,
    'expense',
    thisYearExpense
  );

  // Calculate actual totals from transactions
  const incomeFromTransactions = incomeCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const expenseFromTransactions = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Add "その他" category for gaps between declared totals and transaction sums
  const incomeGap = thisYearIncome - incomeFromTransactions;
  const expenseGap = thisYearExpense - expenseFromTransactions;

  // Process income categories - merge any existing "その他" with gap
  let finalIncomeCategories = incomeCategories.filter(cat => cat.category !== 'その他');
  const existingIncomeOther = incomeCategories.find(cat => cat.category === 'その他');

  if (Math.abs(incomeGap) > 1 || existingIncomeOther) {
    const totalOtherAmount = (existingIncomeOther?.amount || 0) + incomeGap;
    if (Math.abs(totalOtherAmount) > 1) {
      const percentage = thisYearIncome > 0 ? (totalOtherAmount / thisYearIncome) * 100 : 0;
      finalIncomeCategories.push({
        category: 'その他',
        amount: totalOtherAmount,
        percentage: Math.round(percentage),
        color: '#9CA3AF',
        count: existingIncomeOther?.count || 0,
      });
    }
  }

  // Process expense categories - merge any existing "その他" with gap
  let finalExpenseCategories = expenseCategories.filter(cat => cat.category !== 'その他');
  const existingExpenseOther = expenseCategories.find(cat => cat.category === 'その他');

  if (Math.abs(expenseGap) > 1 || existingExpenseOther) {
    const totalOtherAmount = (existingExpenseOther?.amount || 0) + expenseGap;
    if (Math.abs(totalOtherAmount) > 1) {
      const percentage = thisYearExpense > 0 ? (totalOtherAmount / thisYearExpense) * 100 : 0;
      finalExpenseCategories.push({
        category: 'その他',
        amount: totalOtherAmount,
        percentage: Math.round(percentage),
        color: '#9CA3AF',
        count: existingExpenseOther?.count || 0,
      });
    }
  }

  // Calculate monthly data
  const monthlyData = calculateMonthlyData(report.transactions);

  return {
    ...report,
    income: {
      categories: finalIncomeCategories,
      total: thisYearIncome, // Use this year's income (excluding carryover)
    },
    expenses: {
      categories: finalExpenseCategories,
      total: thisYearExpense, // Use this year's expense (excluding carryover to next year)
    },
    monthlyData,
  };
}

// Color palettes for dynamic category assignment
const INCOME_COLOR_PALETTE = [
  '#64D8C6', // Teal
  '#4DB8A8', // Darker teal
  '#3A9D8F', // Even darker teal
  '#2A8276', // Dark teal
  '#7CE3D3', // Light teal
  '#A0EBE0', // Very light teal
  '#5CC9B8', // Medium teal
  '#8FE5D6', // Pale teal
];

const EXPENSE_COLOR_PALETTE = [
  '#EF4444', // Red
  '#DC2626', // Darker red
  '#B91C1C', // Even darker red
  '#F87171', // Light red
  '#FCA5A5', // Very light red
  '#FED7AA', // Orange-red
  '#FB923C', // Orange
  '#FDBA74', // Light orange
];

// Map to track assigned colors for consistency
const categoryColorMap = new Map<string, string>();

function getCategoryColor(category: string, type: 'income' | 'expense'): string {
  // Special case for "その他"
  if (category === 'その他') {
    return '#9CA3AF'; // Gray
  }

  // Check if we've already assigned a color to this category
  if (categoryColorMap.has(category)) {
    return categoryColorMap.get(category)!;
  }

  if (type === 'income') {
    const categoryKey = Object.keys(INCOME_CATEGORIES).find((key) =>
      category.includes(key)
    );
    if (categoryKey) {
      const color = INCOME_CATEGORIES[categoryKey as keyof typeof INCOME_CATEGORIES].color;
      categoryColorMap.set(category, color);
      return color;
    }

    // Assign next available color from palette
    const usedColors = Array.from(categoryColorMap.values());
    const availableColor = INCOME_COLOR_PALETTE.find(c => !usedColors.includes(c)) || INCOME_COLOR_PALETTE[0];
    categoryColorMap.set(category, availableColor);
    return availableColor;
  } else {
    const categoryKey = Object.keys(EXPENSE_CATEGORIES).find((key) =>
      category.includes(key)
    );
    if (categoryKey) {
      const color = EXPENSE_CATEGORIES[categoryKey as keyof typeof EXPENSE_CATEGORIES].color;
      categoryColorMap.set(category, color);
      return color;
    }

    // Assign next available color from palette
    const usedColors = Array.from(categoryColorMap.values());
    const availableColor = EXPENSE_COLOR_PALETTE.find(c => !usedColors.includes(c)) || EXPENSE_COLOR_PALETTE[0];
    categoryColorMap.set(category, availableColor);
    return availableColor;
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

// Format numbers in Japanese style with 万 (10,000) and 億 (100,000,000)
export function formatJapaneseNumber(amount: number): string {
  const absAmount = Math.abs(amount);

  // Less than 10,000 - show as is
  if (absAmount < 10000) {
    return new Intl.NumberFormat('ja-JP').format(amount);
  }

  // 億 (100,000,000) and above
  if (absAmount >= 100000000) {
    const oku = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);

    if (man === 0) {
      // Clean number of 億
      return `${new Intl.NumberFormat('ja-JP').format(oku)}億`;
    } else {
      // Has both 億 and 万
      return `${new Intl.NumberFormat('ja-JP').format(oku)}億${new Intl.NumberFormat('ja-JP').format(man)}万`;
    }
  }

  // 万 (10,000) and above but less than 億
  const man = Math.floor(amount / 10000);
  return `${new Intl.NumberFormat('ja-JP').format(man)}万`;
}

// Format currency with Japanese units (万/億)
export function formatJapaneseCurrency(amount: number): string {
  const formatted = formatJapaneseNumber(amount);
  return `¥${formatted}`;
}

// Format percentage as whole number
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}
