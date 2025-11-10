'use client';

import { CategoryBreakdown } from '@/lib/types';
import { formatJapaneseCurrency, formatPercentage } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

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
    // Calculate dynamic font size based on outer radius (about 17.7% of radius)
    let fontSize = outerRadius * 0.177;

    // Make font 10% smaller for slices 5% or below
    if (percent <= 0.05) {
      fontSize = fontSize * 0.9;
    }

    // Show all labels, but position smaller ones outside
    const isSmallSlice = percent <= 0.04; // Slices 4% or less go outside

    // For small slices, position outside the pie; for larger ones, position inside
    const radius = isSmallSlice
      ? outerRadius + 25 // Outside the pie
      : innerRadius + (outerRadius - innerRadius) * 0.75; // Inside the pie, closer to outer border

    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Get the color for this slice
    const sliceColor = data[index]?.color || '#000000';
    // For labels outside the pie, use the slice color; inside use contrasting color
    const textColor = isSmallSlice ? sliceColor : getTextColor(sliceColor);

    const percentValue = Math.round(percent * 100);

    return (
      <text
        x={x}
        y={y}
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight="bold"
      >
        <tspan fontSize={fontSize}>{percentValue}</tspan>
        <tspan fontSize={fontSize * 0.75}>%</tspan>
      </text>
    );
  };

  return (
    <div>
      {/* Income Pie */}
      <Card>
        <div className="mb-3 md:mb-4">
          <h2 className="text-base md:text-2xl lg:text-3xl font-bold text-text-primary whitespace-nowrap">🚪 お金の入り口</h2>
        </div>

        {income.categories.length > 0 ? (
          <>
            {/* Mobile version */}
            <div className="flex flex-col items-center justify-center gap-4 md:hidden">
              {/* Pie Chart */}
              <div className="flex-shrink-0">
                <PieChart width={220} height={220}>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel(incomeData)}
                    outerRadius={95}
                    fill="#8884d8"
                    dataKey="amount"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              {/* Legend below */}
              <div className="flex justify-center w-full">
                <div className="space-y-2 flex flex-col w-full max-w-[227px]">
                  {incomeData.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-text-primary whitespace-nowrap">{cat.category}</span>
                      </div>
                      <span className="font-medium text-text-primary whitespace-nowrap">
                        {formatJapaneseCurrency(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop version */}
            <div className="hidden md:flex flex-row items-center justify-center">
              {/* Pie Chart */}
              <div className="flex-shrink-0">
                <PieChart width={308} height={308}>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel(incomeData)}
                    outerRadius={132}
                    fill="#8884d8"
                    dataKey="amount"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              {/* Legend on the right */}
              <div className="space-y-3 pl-[20px] w-full max-w-[275px]">
                {incomeData.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-text-primary whitespace-nowrap">{cat.category}</span>
                    </div>
                    <span className="font-medium text-text-primary whitespace-nowrap">
                      {formatJapaneseCurrency(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-text-secondary py-8 md:py-12 text-sm md:text-base">収入データがありません</p>
        )}
      </Card>
    </div>
  );
}
