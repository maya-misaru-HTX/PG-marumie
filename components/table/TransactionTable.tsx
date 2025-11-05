'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortField = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState<string[]>([]);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string[]>([]);
  const [isIncomeDropdownOpen, setIsIncomeDropdownOpen] = useState(false);
  const [isExpenseDropdownOpen, setIsExpenseDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const incomeDropdownRef = useRef<HTMLDivElement>(null);
  const expenseDropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 50;

  // Get unique categories by type
  const { incomeCategories, expenseCategories } = useMemo(() => {
    const incomeCats = new Set(
      transactions.filter((t) => t.type === 'income').map((t) => t.category)
    );
    const expenseCats = new Set(
      transactions.filter((t) => t.type === 'expense').map((t) => t.category)
    );

    // Priority order for expense categories
    const expensePriority = [
      '寄附・交付金',
      '機関紙誌の発行',
      '組織活動費',
      '調査研究費',
      '選挙関係費',
    ];
    const bottomCategories = ['その他の経費'];

    const sortedExpenseCats = Array.from(expenseCats).sort((a, b) => {
      // Check if either is in bottom categories
      const aIsBottom = bottomCategories.includes(a);
      const bIsBottom = bottomCategories.includes(b);

      // If both are bottom categories, maintain order
      if (aIsBottom && bIsBottom) return 0;
      // If only a is bottom, b comes first
      if (aIsBottom) return 1;
      // If only b is bottom, a comes first
      if (bIsBottom) return -1;

      const aIndex = expensePriority.indexOf(a);
      const bIndex = expensePriority.indexOf(b);

      // If both are in priority list, sort by priority order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is in priority list, a comes first
      if (aIndex !== -1) return -1;
      // If only b is in priority list, b comes first
      if (bIndex !== -1) return 1;
      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    });

    return {
      incomeCategories: Array.from(incomeCats).sort(),
      expenseCategories: sortedExpenseCats,
    };
  }, [transactions]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        incomeDropdownRef.current &&
        !incomeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsIncomeDropdownOpen(false);
      }
      if (
        expenseDropdownRef.current &&
        !expenseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExpenseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.recipient?.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Category filter - check both income and expense filters
    if (incomeCategoryFilter.length > 0 || expenseCategoryFilter.length > 0) {
      filtered = filtered.filter((t) => {
        if (t.type === 'income') {
          // If income filter is set, check if category is included
          // If income filter is NOT set but expense filter IS set, exclude all income
          return incomeCategoryFilter.length > 0
            ? incomeCategoryFilter.includes(t.category)
            : false;
        }
        if (t.type === 'expense') {
          // If expense filter is set, check if category is included
          // If expense filter is NOT set but income filter IS set, exclude all expenses
          return expenseCategoryFilter.length > 0
            ? expenseCategoryFilter.includes(t.category)
            : false;
        }
        return false;
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    transactions,
    searchQuery,
    incomeCategoryFilter,
    expenseCategoryFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleIncomeCategory = (category: string) => {
    setIncomeCategoryFilter((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
    setCurrentPage(1);
  };

  const toggleExpenseCategory = (category: string) => {
    setExpenseCategoryFilter((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
    setCurrentPage(1);
  };

  const clearIncomeCategoryFilter = () => {
    setIncomeCategoryFilter([]);
    setCurrentPage(1);
  };

  const clearExpenseCategoryFilter = () => {
    setExpenseCategoryFilter([]);
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between">
      <p className="text-sm text-text-secondary">
        {(currentPage - 1) * itemsPerPage + 1}-
        {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} / {filteredTransactions.length}件
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border-2 border-neutral-200 rounded-[24px] disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500"
        >
          前へ
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border-2 border-neutral-200 rounded-[24px] disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500"
        >
          次へ
        </button>
      </div>
    </div>
  );

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
          すべての出入金
        </h2>
        <p className="text-text-secondary">
          これまでにデータ連携された出入金の明細（全{filteredTransactions.length}件）
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="項目、支出先で検索..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Income Category Filter - Multi-select */}
        <div ref={incomeDropdownRef} className="relative">
          <button
            onClick={() => setIsIncomeDropdownOpen(!isIncomeDropdownOpen)}
            className="w-[200px] px-4 py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none bg-white flex items-center gap-2"
          >
            <span className="flex-1 text-left truncate">
              {incomeCategoryFilter.length === 0
                ? '収入カテゴリー'
                : incomeCategoryFilter.length === 1
                ? incomeCategoryFilter[0]
                : `収入 ${incomeCategoryFilter.length}件選択中`}
            </span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {isIncomeDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full max-w-sm bg-white border-2 border-neutral-200 rounded-[16px] shadow-lg">
              <div className="max-h-[400px] overflow-y-auto">
                {/* Clear All */}
                <div className="px-4 py-3 border-b border-neutral-200">
                  <button
                    onClick={clearIncomeCategoryFilter}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    すべて解除
                  </button>
                </div>

                {/* Category options */}
                {incomeCategories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 cursor-pointer"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={incomeCategoryFilter.includes(cat)}
                      onChange={() => toggleIncomeCategory(cat)}
                      className="w-5 h-5 rounded border-2 border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    />
                    {incomeCategoryFilter.includes(cat) && (
                      <Check className="w-4 h-4 text-white absolute left-0.5 top-0.5 pointer-events-none" />
                    )}
                  </div>
                  <span className="text-sm text-text-primary">{cat}</span>
                </label>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Expense Category Filter - Multi-select */}
        <div ref={expenseDropdownRef} className="relative">
          <button
            onClick={() => setIsExpenseDropdownOpen(!isExpenseDropdownOpen)}
            className="w-[200px] px-4 py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none bg-white flex items-center gap-2"
          >
            <span className="flex-1 text-left truncate">
              {expenseCategoryFilter.length === 0
                ? '支出カテゴリー'
                : expenseCategoryFilter.length === 1
                ? expenseCategoryFilter[0]
                : `支出 ${expenseCategoryFilter.length}件選択中`}
            </span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {isExpenseDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full max-w-sm bg-white border-2 border-neutral-200 rounded-[16px] shadow-lg">
              <div className="max-h-[400px] overflow-y-auto">
                {/* Clear All */}
                <div className="px-4 py-3 border-b border-neutral-200">
                  <button
                    onClick={clearExpenseCategoryFilter}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    すべて解除
                  </button>
                </div>

                {/* Category options */}
                {expenseCategories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 cursor-pointer"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={expenseCategoryFilter.includes(cat)}
                      onChange={() => toggleExpenseCategory(cat)}
                      className="w-5 h-5 rounded border-2 border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    />
                    {expenseCategoryFilter.includes(cat) && (
                      <Check className="w-4 h-4 text-white absolute left-0.5 top-0.5 pointer-events-none" />
                    )}
                  </div>
                  <span className="text-sm text-text-primary">{cat}</span>
                </label>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Top */}
      {totalPages > 1 && (
        <div className="mb-4">
          <PaginationControls />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b-2 border-neutral-200">
            <tr>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-neutral-50"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">日付</span>
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-neutral-50"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">カテゴリー</span>
                  <SortIcon field="category" />
                </div>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-sm font-bold text-text-primary">項目</span>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-neutral-50"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-text-primary">金額</span>
                  <SortIcon field="amount" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-neutral-100 hover:bg-neutral-50"
              >
                <td className="py-3 px-4 text-sm text-text-secondary">
                  {transaction.date}
                </td>
                <td className="py-3 px-4">
                  <Badge
                    color={transaction.type === 'income' ? '#64D8C6' : '#EF4444'}
                  >
                    {transaction.category}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-text-primary">
                    {transaction.description}
                  </p>
                  {transaction.recipient && (
                    <p className="text-xs text-text-secondary mt-1">
                      {transaction.recipient}
                    </p>
                  )}
                </td>
                <td
                  className={`py-3 px-4 text-right font-medium ${
                    transaction.type === 'income'
                      ? 'text-primary-600'
                      : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Bottom */}
      {totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls />
        </div>
      )}
    </Card>
  );
}
