'use client';

import { CategoryBreakdown } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryPiesProps {
  income: { categories: CategoryBreakdown[]; total: number };
  expenses: { categories: CategoryBreakdown[]; total: number };
}

export default function CategoryPies({ income, expenses }: CategoryPiesProps) {
  const RADIAN = Math.PI / 180;

  // Combine categories below 5% into "Other"
  const combineSmallCategories = (categories: CategoryBreakdown[], total: number) => {
    const threshold = 0.05; // 5%
    const large: CategoryBreakdown[] = [];
    let otherAmount = 0;

    categories.forEach((cat) => {
      const percentage = cat.amount / total;
      if (percentage >= threshold) {
        large.push(cat);
      } else {
        otherAmount += cat.amount;
      }
    });

    // Add "Other" category if there are small categories
    if (otherAmount > 0) {
      large.push({
        category: 'その他',
        amount: otherAmount,
        percentage: Number(((otherAmount / total) * 100).toFixed(1)),
        color: '#9CA3AF', // Gray color for "Other"
      });
    }

    return large;
  };

  const incomeData = combineSmallCategories(income.categories, income.total);
  const expenseData = combineSmallCategories(expenses.categories, expenses.total);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income Pie */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary">収入内訳</h2>
          <p className="text-text-secondary mt-1">カテゴリー別の収入割合</p>
        </div>

        {income.categories.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  startAngle={90}
                  endAngle={-270}
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-2">
              {incomeData.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-text-primary">{cat.category}</span>
                  </div>
                  <span className="font-medium text-text-secondary">
                    {cat.percentage}% ({formatCurrency(cat.amount)})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-text-secondary py-12">収入データがありません</p>
        )}
      </Card>

      {/* Expense Pie */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary">支出内訳</h2>
          <p className="text-text-secondary mt-1">カテゴリー別の支出割合</p>
        </div>

        {expenses.categories.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  startAngle={90}
                  endAngle={-270}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-2">
              {expenseData.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-text-primary">{cat.category}</span>
                  </div>
                  <span className="font-medium text-text-secondary">
                    {cat.percentage}% ({formatCurrency(cat.amount)})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-text-secondary py-12">支出データがありません</p>
        )}
      </Card>
    </div>
  );
}
