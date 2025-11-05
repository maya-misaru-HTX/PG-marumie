'use client';

import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';

interface TopDonorsProps {
  transactions: Transaction[];
}

export default function TopDonors({ transactions }: TopDonorsProps) {
  // Filter for income transactions and aggregate by donor
  const donorMap = new Map<string, number>();

  transactions
    .filter((t) => t.type === 'income' && t.recipient)
    .forEach((t) => {
      const donor = t.recipient || t.description;
      const currentAmount = donorMap.get(donor) || 0;
      donorMap.set(donor, currentAmount + t.amount);
    });

  // Convert to array and sort by amount
  const topDonors = Array.from(donorMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  if (topDonors.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">高額寄附者 トップ10</h2>
        <p className="text-text-secondary mt-1">最も多く寄附をした個人・団体</p>
      </div>

      <div className="space-y-3">
        {topDonors.map((donor, index) => (
          <div
            key={donor.name}
            className="flex items-center justify-between p-4 bg-neutral-50 rounded-[16px] hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <p className="font-medium text-text-primary">{donor.name}</p>
            </div>
            <p className="font-bold text-primary-600">{formatCurrency(donor.amount)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
