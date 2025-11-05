'use client';

import { Summary } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IncomeExpenseBarProps {
  summary: Summary;
}

export default function IncomeExpenseBar({ summary }: IncomeExpenseBarProps) {
  const data = [
    {
      name: '収支比較',
      収入: summary.incomeTotal,
      支出: summary.expenseTotal,
    },
  ];

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">収支比較</h2>
        <p className="text-text-secondary mt-1">総収入と総支出の比較</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} />
          <YAxis type="category" dataKey="name" hide={true} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="収入" fill="#64D8C6" radius={[0, 8, 8, 0]} />
          <Bar dataKey="支出" fill="#EF4444" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm text-text-secondary">収入合計</p>
          <p className="text-lg font-bold text-primary-600">{formatCurrency(summary.incomeTotal)}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">支出合計</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(summary.expenseTotal)}</p>
        </div>
      </div>
    </Card>
  );
}
