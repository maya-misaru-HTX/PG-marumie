'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Search, ChevronDown, ChevronUp, Check, Filter } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortField = 'date' | 'amount' | 'category' | 'description';
type SortDirection = 'asc' | 'desc';

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState<string[]>(['セルフ寄付（隠蔽型‼️）']);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string[]>(['セルフ寄付（隠蔽型‼️）']);
  const [isIncomeDropdownOpen, setIsIncomeDropdownOpen] = useState(false);
  const [isExpenseDropdownOpen, setIsExpenseDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const incomeDropdownRef = useRef<HTMLDivElement>(null);
  const expenseDropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 50;
  const initialDisplayCount = 8;

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
      } else if (sortField === 'description') {
        comparison = a.description.localeCompare(b.description);
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

  // Determine if filters are active
  const hasActiveFilters = searchQuery || incomeCategoryFilter.length > 0 || expenseCategoryFilter.length > 0;

  // Calculate totals for filtered transactions
  const filteredTotals = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      count: filteredTransactions.length,
      totalAmount: total,
    };
  }, [filteredTransactions]);

  // Display logic: show initial 8 items if no filters and not showing all, otherwise use pagination
  const displayTransactions = useMemo(() => {
    if (!hasActiveFilters && !showAll) {
      // Show only first 8 items when no filters and not expanded
      return filteredTransactions.slice(0, initialDisplayCount);
    } else {
      // Use pagination when filters are active or showing all
      return filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    }
  }, [filteredTransactions, hasActiveFilters, showAll, currentPage, itemsPerPage, initialDisplayCount]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const shouldShowPagination = hasActiveFilters || showAll;

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
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="w-4 h-4 text-primary-600" />
      ) : (
        <ChevronDown className="w-4 h-4 text-primary-600" />
      );
    }
    // Show a neutral icon for sortable columns
    return (
      <div className="flex flex-col gap-0">
        <ChevronUp className="w-3 h-3 text-neutral-300 -mb-1" />
        <ChevronDown className="w-3 h-3 text-neutral-300" />
      </div>
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
      {/* Summary Line */}
      {hasActiveFilters && (
        <div className="mb-4 md:mb-6 pb-2 md:pb-[10px] overflow-hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="flex-shrink-0 min-w-0">
              <span className="text-sm md:text-2xl font-bold text-text-primary block break-words leading-tight">
                {Array.from(new Set([...expenseCategoryFilter, ...incomeCategoryFilter])).join(', ') || 'なし'}
              </span>
            </div>
            <div className="hidden md:block h-6 w-px bg-neutral-300 flex-shrink-0"></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-6 flex-shrink min-w-0">
              <div className="whitespace-nowrap flex-shrink-0">
                <span className="text-xs sm:text-sm md:text-2xl text-text-secondary">件数: </span>
                <span className="text-xs sm:text-sm md:text-2xl font-bold text-text-primary">{filteredTotals.count}件</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-neutral-300 flex-shrink-0"></div>
              <div className="whitespace-nowrap flex-shrink-0">
                <span className="text-xs sm:text-sm md:text-2xl text-text-secondary">合計金額: </span>
                <span className="text-xs sm:text-sm md:text-2xl font-bold text-red-600">{formatJapaneseCurrency(filteredTotals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Toggle */}
      <div className="mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between py-4 border-b-2 border-neutral-200 hover:border-red-300 transition-all mb-6 group"
        >
          <span className="text-sm md:text-base lg:text-lg text-text-primary group-hover:text-red-600 transition-colors">→ 他のカテゴリーもチェック</span>
          {showFilters ? (
            <ChevronUp className="w-5 h-5 text-text-secondary group-hover:text-red-600 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary group-hover:text-red-600 transition-colors" />
          )}
        </button>

        {showFilters && (
          <div>
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-4">
                {/* Filters Row */}
                <div className="flex flex-row gap-2 md:gap-4">
                  {/* Expense Category Filter - Multi-select */}
                  <div ref={expenseDropdownRef} className="relative w-auto flex-shrink-0">
                  <button
                    onClick={() => setIsExpenseDropdownOpen(!isExpenseDropdownOpen)}
                    className="w-auto min-w-[120px] md:w-[200px] px-3 md:px-4 py-2.5 md:py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none bg-white flex items-center gap-1 md:gap-2"
                  >
                    <span className="flex-1 text-left truncate text-xs md:text-base">
                      支出カテゴリー
                    </span>
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  </button>

          {isExpenseDropdownOpen && (
            <div className="absolute z-50 mt-2 w-[200px] md:min-w-[280px] bg-white border-2 border-neutral-200 rounded-[16px] shadow-lg left-0">
              <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
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
                  <div className="relative flex items-center flex-shrink-0">
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
                  <span className="text-xs md:text-sm text-text-primary leading-tight break-words min-w-0">{cat}</span>
                </label>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Income Category Filter - Multi-select */}
        <div ref={incomeDropdownRef} className="relative w-auto flex-shrink-0">
          <button
            onClick={() => setIsIncomeDropdownOpen(!isIncomeDropdownOpen)}
            className="w-auto min-w-[120px] md:w-[200px] px-3 md:px-4 py-2.5 md:py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none bg-white flex items-center gap-1 md:gap-2"
          >
            <span className="flex-1 text-left truncate text-xs md:text-base">
              収入カテゴリー
            </span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          </button>

          {isIncomeDropdownOpen && (
            <div className="absolute z-50 mt-2 w-[200px] md:min-w-[280px] bg-white border-2 border-neutral-200 rounded-[16px] shadow-lg left-0">
              <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
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
                  <div className="relative flex items-center flex-shrink-0">
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
                  <span className="text-xs md:text-sm text-text-primary leading-tight break-words min-w-0">{cat}</span>
                </label>
              ))}
              </div>
            </div>
          )}
        </div>
        </div>

                {/* Search */}
                <div className="flex-1 relative min-w-0 md:flex-1">
                  <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="項目、支出先で検索..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none text-xs md:text-base placeholder:text-xs md:placeholder:text-base"
                  />
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Table - with scrollable container */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px] max-h-[720px] overflow-y-auto border-2 border-transparent rounded-[16px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b-2 border-neutral-200 z-10">
              <tr>
                <th
                  className="text-left py-2 px-2 md:py-3 md:px-4 cursor-pointer hover:bg-neutral-50 w-[30%] md:w-auto"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-xs md:text-sm font-bold text-text-primary">項目</span>
                    <SortIcon field="description" />
                  </div>
                </th>
                <th
                  className="text-right py-2 px-2 md:py-3 md:px-4 cursor-pointer hover:bg-neutral-50 w-[20%] md:w-auto"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <span className="text-xs md:text-sm font-bold text-text-primary">金額</span>
                    <SortIcon field="amount" />
                  </div>
                </th>
                <th className="w-[5%] md:w-0"></th>
                <th
                  className="text-left py-2 px-2 md:py-3 md:px-4 cursor-pointer hover:bg-neutral-50 w-[30%] md:w-auto"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-xs md:text-sm font-bold text-text-primary">カテゴリー</span>
                    <SortIcon field="category" />
                  </div>
                </th>
                <th
                  className="text-left py-2 px-2 md:py-3 md:px-4 cursor-pointer hover:bg-neutral-50 w-[15%] md:w-auto"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-xs md:text-sm font-bold text-text-primary">日付</span>
                    <SortIcon field="date" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="py-2 px-2 md:py-3 md:px-4">
                    <p className="text-xs md:text-sm font-medium text-text-primary">
                      {transaction.description}
                    </p>
                    {transaction.recipient && (
                      <p className="text-[10px] md:text-xs text-text-secondary mt-0.5 md:mt-1">
                        {transaction.recipient}
                      </p>
                    )}
                  </td>
                  <td
                    className={`py-2 px-2 md:py-3 md:px-4 text-right text-xs md:text-sm font-medium ${
                      transaction.type === 'income'
                        ? 'text-primary-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatJapaneseCurrency(transaction.amount)}
                  </td>
                  <td className="w-[5%] md:w-0"></td>
                  <td className="py-2 px-2 md:py-3 md:px-4">
                    <Badge
                      color={transaction.type === 'income' ? '#64D8C6' : '#EF4444'}
                    >
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 md:py-3 md:px-4 text-xs md:text-sm text-text-secondary">
                    {transaction.date.slice(5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
