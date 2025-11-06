import { Summary } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface SummaryCardsProps {
  summary: Summary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  // Use thisYearExpense from file if available, otherwise calculate
  const thisYearExpense = summary.thisYearExpense ?? (summary.expenseTotal - summary.carriedToNextYear);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Income Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">収入合計</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-600">
              {formatJapaneseCurrency(summary.incomeTotal)}
            </p>
          </div>
          <div className="p-3 bg-primary-50 rounded-full">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </Card>

      {/* This Year's Expense Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">今年の支出</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">
              {formatJapaneseCurrency(thisYearExpense)}
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </Card>

      {/* Carryover to Next Year Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">余ったお金の繰越</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-600">
              {formatJapaneseCurrency(summary.carriedToNextYear)}
            </p>
          </div>
          <div className="p-3 bg-primary-50 rounded-full">
            <DollarSign className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
