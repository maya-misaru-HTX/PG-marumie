'use client';

import { Transaction } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';

interface TopDonorsProps {
  transactions: Transaction[];
}

export default function TopDonors({ transactions }: TopDonorsProps) {
  // Filter for income transactions and aggregate by organization (description field)
  // Exclude individual donations (個人からの寄付)
  const donorMap = new Map<string, number>();

  transactions
    .filter((t) => t.type === 'income' && t.description && t.category !== '個人からの寄付' && t.category !== '個人からの寄附')
    .forEach((t) => {
      // Use description as the organization name (支出先/寄附者)
      const organization = t.description.trim();
      if (!organization) return;

      const currentAmount = donorMap.get(organization) || 0;
      donorMap.set(organization, currentAmount + t.amount);
    });

  // Convert to array and sort by amount
  const allDonors = Array.from(donorMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Get top 10, but include all donors with the same amount as the 10th donor
  let topDonors = allDonors.slice(0, 10);

  if (allDonors.length > 10) {
    const tenthAmount = allDonors[9].amount;
    // Find all donors with the same amount as the 10th donor
    const additionalDonors = allDonors.slice(10).filter(d => d.amount === tenthAmount);
    topDonors = [...topDonors, ...additionalDonors];
  }

  if (topDonors.length === 0) {
    return null;
  }

  // Calculate ranking labels (handle ties)
  const getRanking = (index: number, amount: number): number => {
    if (index < 9) return index + 1;
    // For 10th place and beyond, check if tied with 10th
    const tenthAmount = allDonors[9].amount;
    return amount === tenthAmount ? 10 : index + 1;
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">💰 寄付団体トップ10</h2>
        <a
          href="https://political-finance-database.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap"
        >
          🔍 正体を詳しく調べる！
        </a>
      </div>

      <div className="space-y-2">
        {topDonors.map((donor, index) => (
          <div
            key={donor.name}
            className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                {getRanking(index, donor.amount)}
              </div>
              <p className="font-medium text-text-primary text-sm line-clamp-2">{donor.name}</p>
            </div>
            <p className="font-bold text-primary-600 text-sm whitespace-nowrap ml-2">{formatJapaneseCurrency(donor.amount)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
