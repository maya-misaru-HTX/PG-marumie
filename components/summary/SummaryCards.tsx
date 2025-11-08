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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
      {/* Income Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs md:text-sm text-text-secondary mb-1 whitespace-nowrap">もらったお金</p>
            <p className="text-sm md:text-2xl lg:text-3xl font-bold text-primary-600 whitespace-nowrap">
              {formatJapaneseCurrency(summary.incomeTotal)}
            </p>
          </div>
          <div className="p-2 md:p-2 lg:p-3 bg-primary-50 rounded-full flex-shrink-0 ml-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-primary-600" />
          </div>
        </div>
      </Card>

      {/* This Year's Expense Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs md:text-sm text-text-secondary mb-1 whitespace-nowrap">使ったお金</p>
            <p className="text-sm md:text-2xl lg:text-3xl font-bold text-red-600 whitespace-nowrap">
              {formatJapaneseCurrency(thisYearExpense)}
            </p>
          </div>
          <div className="p-2 md:p-2 lg:p-3 bg-red-50 rounded-full flex-shrink-0 ml-2">
            <TrendingDown className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-red-600" />
          </div>
        </div>
      </Card>

      {/* Carryover to Next Year Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs md:text-sm text-text-secondary mb-1 whitespace-nowrap">翌年に流した残金</p>
            <p className="text-sm md:text-2xl lg:text-3xl font-bold text-primary-600 whitespace-nowrap">
              {formatJapaneseCurrency(summary.carriedToNextYear)}
            </p>
          </div>
          <div className="p-2 md:p-2 lg:p-3 bg-primary-50 rounded-full flex-shrink-0 ml-2">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-primary-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
