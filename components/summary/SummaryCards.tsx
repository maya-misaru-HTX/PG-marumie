import { Summary } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface SummaryCardsProps {
  summary: Summary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  // 総収入 = 本年度の収入 + 前年度からの繰越
  const totalIncomeWithCarryover = summary.incomeTotal + summary.carriedFromPrevYear;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Income Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">総収入</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-600">
              {formatCurrency(totalIncomeWithCarryover)}
            </p>
          </div>
          <div className="p-3 bg-primary-50 rounded-full">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
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
      </Card>

      {/* Carryover to Next Year Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">翌年繰越</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-600">
              {formatCurrency(summary.carriedToNextYear)}
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
