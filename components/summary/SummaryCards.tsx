import { Summary } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface SummaryCardsProps {
  summary: Summary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Income Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">総収入</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-600">
              {formatCurrency(summary.incomeTotal)}
            </p>
          </div>
          <div className="p-3 bg-primary-50 rounded-full">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-text-secondary">
            前年繰越: {formatCurrency(summary.carriedFromPrevYear)}
          </p>
        </div>
      </Card>

      {/* Expense Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">総支出</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">
              {formatCurrency(summary.expenseTotal)}
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-text-secondary">
            翌年繰越: {formatCurrency(summary.carriedToNextYear)}
          </p>
        </div>
      </Card>

      {/* Balance Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">収支</p>
            <p
              className={`text-2xl md:text-3xl font-bold ${
                summary.balance >= 0 ? 'text-primary-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              summary.balance >= 0 ? 'bg-primary-50' : 'bg-red-50'
            }`}
          >
            <DollarSign
              className={`w-6 h-6 ${
                summary.balance >= 0 ? 'text-primary-600' : 'text-red-600'
              }`}
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-text-secondary">
            {summary.balance >= 0 ? '黒字' : '赤字'}
          </p>
        </div>
      </Card>
    </div>
  );
}
