'use client';

import { Summary } from '@/lib/types';
import { formatJapaneseCurrency, formatJapaneseNumber } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface IncomeExpenseBarProps {
  summary: Summary;
}

export default function IncomeExpenseBar({ summary }: IncomeExpenseBarProps) {
  const thisYearIncome = summary.incomeTotal - summary.carriedFromPrevYear;
  // Use thisYearExpense from file if available, otherwise calculate
  const thisYearExpense = summary.thisYearExpense ?? (summary.expenseTotal - summary.carriedToNextYear);

  const data = [
    {
      name: '収入',
      今年の収入: thisYearIncome,
      昨年からの繰越: summary.carriedFromPrevYear,
      total: summary.incomeTotal,
    },
    {
      name: '支出',
      今年の出費: thisYearExpense,
      翌年に流した残金: summary.carriedToNextYear,
      total: summary.expenseTotal,
    },
  ];

  const formatLabel = (value: any) => {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue === 0) return '';
    return `¥${formatJapaneseNumber(numValue)}`;
  };

  // Custom label to show total at the end of each bar
  const renderTotalLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    // Find the corresponding data item to get the total
    const dataItem = data.find(d =>
      (d.今年の収入 && d.昨年からの繰越) || (d.今年の出費 && d.翌年に流した残金)
    );

    return (
      <text
        x={x + width + 10}
        y={y + height / 2}
        fill="#374151"
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={16}
        fontWeight="bold"
      >
        {formatLabel(value)}
      </text>
    );
  };

  return (
    <Card>
      <div className="mb-4 md:mb-6">
        <h2 className="text-sm md:text-xl lg:text-2xl font-bold text-text-primary">💸 お金の流れ</h2>
      </div>

      {/* Legend above chart - responsive grid on mobile */}
      <div className="mb-4 flex justify-center">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#64D8C6' }}></div>
            <span className="whitespace-nowrap">今年の収入</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#9FE2D5' }}></div>
            <span className="whitespace-nowrap">昨年からの繰越</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#EF4444' }}></div>
            <span className="whitespace-nowrap">今年の出費</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#FCA5A5' }}></div>
            <span className="whitespace-nowrap">翌年に流した残金</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200} className="hidden sm:block">
        <BarChart data={data} layout="vertical" barCategoryGap={25} barSize={60} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontalPoints={[50, 150]} />
          <XAxis type="number" tickFormatter={(value) => `¥${formatJapaneseNumber(value)}`} />
          <YAxis type="category" dataKey="name" width={60} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number) => formatJapaneseCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          {/* Income bars */}
          <Bar dataKey="今年の収入" stackId="income" fill="#64D8C6" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="今年の収入" position="inside" formatter={formatLabel} fill="#000" fontSize={16} />
          </Bar>
          <Bar dataKey="昨年からの繰越" stackId="income" fill="#9FE2D5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="昨年からの繰越" position="inside" formatter={formatLabel} fill="#000" fontSize={16} />
          </Bar>
          {/* Expense bars */}
          <Bar dataKey="今年の出費" stackId="expense" fill="#EF4444" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="今年の出費" position="inside" formatter={formatLabel} fill="#fff" fontSize={16} />
          </Bar>
          <Bar dataKey="翌年に流した残金" stackId="expense" fill="#FCA5A5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="翌年に流した残金" position="inside" formatter={formatLabel} fill="#000" fontSize={16} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Mobile version with smaller font sizes */}
      <ResponsiveContainer width="100%" height={180} className="sm:hidden">
        <BarChart data={data} layout="vertical" barCategoryGap={20} barSize={50} margin={{ top: 10, right: 10, bottom: 10, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontalPoints={[45, 135]} />
          <XAxis type="number" tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} style={{ fontSize: '11px' }} />
          <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number) => formatJapaneseCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          {/* Income bars - smaller font on mobile */}
          <Bar dataKey="今年の収入" stackId="income" fill="#64D8C6" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="今年の収入" position="inside" formatter={formatLabel} fill="#000" fontSize={12} />
          </Bar>
          <Bar dataKey="昨年からの繰越" stackId="income" fill="#9FE2D5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="昨年からの繰越" position="inside" formatter={formatLabel} fill="#000" fontSize={12} />
          </Bar>
          {/* Expense bars - smaller font on mobile */}
          <Bar dataKey="今年の出費" stackId="expense" fill="#EF4444" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="今年の出費" position="inside" formatter={formatLabel} fill="#fff" fontSize={12} />
          </Bar>
          <Bar dataKey="翌年に流した残金" stackId="expense" fill="#FCA5A5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="翌年に流した残金" position="inside" formatter={formatLabel} fill="#000" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
