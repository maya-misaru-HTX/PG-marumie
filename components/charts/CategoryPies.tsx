'use client';

import { CategoryBreakdown } from '@/lib/types';
import { formatJapaneseCurrency, formatPercentage } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryPiesProps {
  income: { categories: CategoryBreakdown[]; total: number };
  expenses: { categories: CategoryBreakdown[]; total: number };
}

export default function CategoryPies({ income, expenses }: CategoryPiesProps) {
  const RADIAN = Math.PI / 180;

  // Calculate luminance to determine if text should be white or black
  const getTextColor = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Use white text for dark backgrounds, black for light backgrounds
    // Threshold of 0.7 to ensure gray (#9CA3AF with luminance 0.636) uses white text
    return luminance > 0.7 ? '#000000' : '#FFFFFF';
  };

  // Combine categories below 5% into "その他", merging with existing gap "その他"
  const combineSmallCategories = (categories: CategoryBreakdown[], total: number, isIncome: boolean = false) => {
    const threshold = 0.05; // 5%
    const large: CategoryBreakdown[] = [];
    let otherAmount = 0;
    let otherCount = 0;

    // Find existing "その他" from gap calculation
    const existingOther = categories.find(cat => cat.category === 'その他');
    if (existingOther) {
      otherAmount = existingOther.amount;
      otherCount = existingOther.count;
    }

    categories.forEach((cat) => {
      // Skip existing "その他" - we'll recreate it with combined small categories
      if (cat.category === 'その他') {
        return;
      }

      const percentage = cat.amount / total;
      // Always keep "個人からの寄付" visible in income chart, regardless of percentage
      if (percentage >= threshold || (isIncome && cat.category === '個人からの寄付')) {
        large.push(cat);
      } else {
        otherAmount += cat.amount;
        otherCount += cat.count;
      }
    });

    // Add combined "その他" category if there's any amount
    if (otherAmount > 0) {
      large.push({
        category: 'その他',
        amount: otherAmount,
        percentage: Math.round((otherAmount / total) * 100),
        color: '#9CA3AF',
        count: otherCount,
      });
    }

    return large;
  };

  const incomeData = combineSmallCategories(income.categories, income.total, true);

  const renderCustomizedLabel = (data: CategoryBreakdown[]) => ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Get the color for this slice
    const sliceColor = data[index]?.color || '#000000';
    const textColor = getTextColor(sliceColor);

    return (
      <text
        x={x}
        y={y}
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-base font-bold"
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <div>
      {/* Income Pie */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">🚪 お金の入り口</h2>
        </div>

        {income.categories.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel(incomeData)}
                  outerRadius={120}
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
                  formatter={(value: number) => formatJapaneseCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-[34px] space-y-3 pb-4">
              {incomeData.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-text-primary">{cat.category}</span>
                  </div>
                  <span className="font-medium text-text-secondary">
                    {formatPercentage(cat.percentage)} ({formatJapaneseCurrency(cat.amount)})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-text-secondary py-12">収入データがありません</p>
        )}
      </Card>
    </div>
  );
}
