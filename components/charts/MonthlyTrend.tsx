'use client';

import { MonthlyData } from '@/lib/types';
import { formatJapaneseCurrency, formatJapaneseNumber } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyTrendProps {
  monthlyData: MonthlyData[];
}

export default function MonthlyTrend({ monthlyData }: MonthlyTrendProps) {
  // Transform data to show expenses as negative values
  const chartData = monthlyData.map((data) => ({
    ...data,
    expense: -data.expense, // Make expense negative for downward bars
  }));

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">月ごとの収支の推移</h2>
        <p className="text-text-secondary mt-1">今年の月ごとの収入と支出</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tickFormatter={(value) => `¥${formatJapaneseNumber(value)}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              // Show absolute value for expense in tooltip
              const displayValue = name === '支出' ? Math.abs(value) : value;
              return formatJapaneseCurrency(displayValue);
            }}
            labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          <Bar dataKey="income" fill="#64D8C6" name="収入" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expense" fill="#EF4444" name="支出" radius={[8, 8, 0, 0]} />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#374151"
            strokeWidth={2}
            name="収支"
            dot={{ fill: '#374151', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
