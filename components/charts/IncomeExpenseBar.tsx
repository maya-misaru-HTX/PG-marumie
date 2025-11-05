'use client';

import { Summary } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface IncomeExpenseBarProps {
  summary: Summary;
}

export default function IncomeExpenseBar({ summary }: IncomeExpenseBarProps) {
  const totalIncomeWithCarryover = summary.incomeTotal + summary.carriedFromPrevYear;
  const totalExpenseWithCarryover = summary.expenseTotal + summary.carriedToNextYear;

  const data = [
    {
      name: '収入',
      本年度の収入: summary.incomeTotal,
      前年繰越: summary.carriedFromPrevYear,
    },
    {
      name: '支出',
      本年度の支出: summary.expenseTotal,
      翌年繰越: summary.carriedToNextYear,
    },
  ];

  const formatLabel = (value: any) => {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue === 0) return '';
    return `¥${(numValue / 10000).toFixed(0)}万`;
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">収支比較</h2>
        <p className="text-text-secondary mt-1">総収入と総支出の比較</p>
      </div>

      {/* Legend above chart - responsive grid on mobile */}
      <div className="mb-4 flex justify-center">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#64D8C6' }}></div>
            <span className="whitespace-nowrap">本年度の収入</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#9FE2D5' }}></div>
            <span className="whitespace-nowrap">前年繰越</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#EF4444' }}></div>
            <span className="whitespace-nowrap">本年度の支出</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: '#FCA5A5' }}></div>
            <span className="whitespace-nowrap">翌年繰越</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200} className="hidden sm:block">
        <BarChart data={data} layout="vertical" barCategoryGap={25} barSize={60} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontalPoints={[50, 150]} />
          <XAxis type="number" tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} />
          <YAxis type="category" dataKey="name" width={60} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          {/* Income bars */}
          <Bar dataKey="本年度の収入" stackId="income" fill="#64D8C6" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="本年度の収入" position="inside" formatter={formatLabel} fill="#000" fontSize={16} />
          </Bar>
          <Bar dataKey="前年繰越" stackId="income" fill="#9FE2D5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="前年繰越" position="inside" formatter={formatLabel} fill="#000" fontSize={16} />
          </Bar>
          {/* Expense bars */}
          <Bar dataKey="本年度の支出" stackId="expense" fill="#EF4444" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="本年度の支出" position="inside" formatter={formatLabel} fill="#fff" fontSize={16} />
          </Bar>
          <Bar dataKey="翌年繰越" stackId="expense" fill="#FCA5A5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="翌年繰越" position="inside" formatter={formatLabel} fill="#000" fontSize={16} />
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
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          {/* Income bars - smaller font on mobile */}
          <Bar dataKey="本年度の収入" stackId="income" fill="#64D8C6" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="本年度の収入" position="inside" formatter={formatLabel} fill="#000" fontSize={13} />
          </Bar>
          <Bar dataKey="前年繰越" stackId="income" fill="#9FE2D5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="前年繰越" position="inside" formatter={formatLabel} fill="#000" fontSize={13} />
          </Bar>
          {/* Expense bars - smaller font on mobile */}
          <Bar dataKey="本年度の支出" stackId="expense" fill="#EF4444" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="本年度の支出" position="inside" formatter={formatLabel} fill="#fff" fontSize={13} />
          </Bar>
          <Bar dataKey="翌年繰越" stackId="expense" fill="#FCA5A5" radius={[0, 8, 8, 0]}>
            <LabelList dataKey="翌年繰越" position="inside" formatter={formatLabel} fill="#000" fontSize={13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
