// Core Data Types for Political Funds Tracking

export interface PoliticianInfo {
  name: string;
  organization: string;
  fiscalYear: string;
  address?: string;
  accountant?: string;
  representative?: string;
}

export interface Summary {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  carriedFromPrevYear: number;
  carriedToNextYear: number;
}

export interface Transaction {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  description: string;
  recipient?: string;
  location?: string;
  amount: number;
  type: 'income' | 'expense';
  notes?: string;
}

export interface CategoryBreakdown {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
  [key: string]: string | number | undefined;
}

export interface MonthlyData {
  month: string;
  monthNumber: number;
  income: number;
  expense: number;
  balance: number;
}

export interface ExpenseReport {
  politician: PoliticianInfo;
  summary: Summary;
  income: {
    categories: CategoryBreakdown[];
    total: number;
  };
  expenses: {
    categories: CategoryBreakdown[];
    total: number;
  };
  transactions: Transaction[];
  monthlyData: MonthlyData[];
  metadata: {
    uploadedAt: string;
    source: 'pdf' | 'csv';
    fiscalYear: string;
  };
}

// Category mapping for Japanese expense types
export const INCOME_CATEGORIES = {
  '個人からの寄附': { en: 'individual-donation', color: '#64D8C6' },
  '法人その他の団体からの寄附': { en: 'corporate-donation', color: '#4BC4B0' },
  '政治団体からの寄附': { en: 'political-donation', color: '#238778' },
  '機関紙誌の発行による収入': { en: 'publication-income', color: '#BCECD3' },
  '借入金': { en: 'loans', color: '#E6F7F4' },
  'その他の収入': { en: 'other-income', color: '#9CA3AF' },
} as const;

export const EXPENSE_CATEGORIES = {
  '経常経費': { en: 'regular-expenses', color: '#EF4444' },
  '人件費': { en: 'personnel-costs', color: '#DC2626' },
  '光熱水費': { en: 'utilities', color: '#B91C1C' },
  '備品・消耗品費': { en: 'supplies', color: '#991B1B' },
  '事務所費': { en: 'office-expenses', color: '#7F1D1D' },
  '政治活動費': { en: 'political-activity', color: '#F87171' },
  '組織活動費': { en: 'organization-costs', color: '#EF4444' },
  '選挙関係費': { en: 'election-costs', color: '#FEE2E2' },
  '機関紙誌の発行': { en: 'publication-expenses', color: '#F87171' },
  '調査研究費': { en: 'research-costs', color: '#FCA5A5' },
  '寄附・交付金': { en: 'donations-grants', color: '#FED7AA' },
  'その他の経費': { en: 'other-expenses', color: '#9CA3AF' },
} as const;

export type IncomeCategoryKey = keyof typeof INCOME_CATEGORIES;
export type ExpenseCategoryKey = keyof typeof EXPENSE_CATEGORIES;
