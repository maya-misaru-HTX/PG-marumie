'use client';

import { MonthlyData } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
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
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">月ごとの収支の推移</h2>
        <p className="text-text-secondary mt-1">今年の月ごとの収入と支出</p>
        <p className="text-sm text-text-secondary mt-2">
          更新日時: {new Date().toLocaleString('ja-JP')}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
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

      <div className="mt-6 p-4 bg-neutral-50 rounded-[22px]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-text-secondary mb-1">総収入（年間）</p>
            <p className="text-base font-bold text-primary-600">
              {formatCurrency(
                monthlyData.reduce((sum, month) => sum + month.income, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">総支出（年間）</p>
            <p className="text-base font-bold text-red-600">
              {formatCurrency(
                monthlyData.reduce((sum, month) => sum + month.expense, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">収支（年間）</p>
            <p
              className={`text-base font-bold ${
                monthlyData.reduce((sum, month) => sum + month.balance, 0) >= 0
                  ? 'text-primary-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(
                monthlyData.reduce((sum, month) => sum + month.balance, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
