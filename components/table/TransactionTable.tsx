'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortField = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

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

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
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
  }, [transactions, searchQuery, categoryFilter, sortField, sortDirection]);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

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

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border-2 border-neutral-200 rounded-[24px] focus:border-primary-500 focus:outline-none bg-white"
        >
          <option value="all">すべてのカテゴリー</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
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
      )}
    </Card>
  );
}
