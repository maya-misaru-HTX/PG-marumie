'use client';

import { Transaction, CategoryBreakdown } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';

interface TopDonorsProps {
  transactions: Transaction[];
  incomeCategories: CategoryBreakdown[];
}

interface DonorData {
  name: string;
  amount: number;
  category: string;
  color: string;
}

export default function TopDonors({ transactions, incomeCategories }: TopDonorsProps) {
  // Create a map of category names to colors
  const categoryColorMap = new Map<string, string>();
  incomeCategories.forEach((cat) => {
    categoryColorMap.set(cat.category, cat.color);
  });

  // Filter for income transactions and aggregate by organization (description field)
  // Exclude individual donations (個人からの寄付)
  const donorMap = new Map<string, { amount: number; category: string; color: string }>();

  transactions
    .filter((t) => t.type === 'income' && t.description && t.category !== '個人からの寄付' && t.category !== '個人からの寄附')
    .forEach((t) => {
      // Use description as the organization name (支出先/寄附者)
      const organization = t.description.trim();
      if (!organization) return;

      const existing = donorMap.get(organization);
      if (existing) {
        existing.amount += t.amount;
      } else {
        const color = categoryColorMap.get(t.category) || '#64B5A6'; // Use category color or default
        donorMap.set(organization, {
          amount: t.amount,
          category: t.category,
          color: color,
        });
      }
    });

  // Convert to array and sort by amount
  const allDonors = Array.from(donorMap.entries())
    .map(([name, data]) => ({ name, amount: data.amount, category: data.category, color: data.color }))
    .sort((a, b) => b.amount - a.amount);

  // Get top 30, but include all donors with the same amount as the 30th donor
  let topDonors = allDonors.slice(0, 30);

  if (allDonors.length > 30) {
    const thirtiethAmount = allDonors[29].amount;
    // Find all donors with the same amount as the 30th donor
    const additionalDonors = allDonors.slice(30).filter(d => d.amount === thirtiethAmount);
    topDonors = [...topDonors, ...additionalDonors];
  }

  if (topDonors.length === 0) {
    return null;
  }

  // Calculate ranking labels (handle ties)
  const getRanking = (index: number, amount: number): number => {
    if (index < 29) return index + 1;
    // For 30th place and beyond, check if tied with 30th
    const thirtiethAmount = allDonors[29].amount;
    return amount === thirtiethAmount ? 30 : index + 1;
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm md:text-xl lg:text-2xl font-bold text-text-primary whitespace-nowrap">💰 収入トップ30</h2>
        <a
          href="https://political-finance-database.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] sm:text-xs md:text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap flex-shrink-0"
        >
          🔍 正体を詳しく調べる！
        </a>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100 hover:scrollbar-thumb-neutral-400">
        {topDonors.map((donor, index) => (
          <div
            key={donor.name}
            className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 text-white rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs"
                style={{ backgroundColor: donor.color }}
              >
                {getRanking(index, donor.amount)}
              </div>
              <p className="font-medium text-text-primary text-xs md:text-sm line-clamp-2">{donor.name}</p>
            </div>
            <p className="font-bold text-primary-600 text-xs md:text-sm whitespace-nowrap ml-2">{formatJapaneseCurrency(donor.amount)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
