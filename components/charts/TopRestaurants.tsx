'use client';

import { Transaction } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';

interface TopRestaurantsProps {
  transactions: Transaction[];
}

interface RestaurantData {
  name: string;
  address: string;
  totalAmount: number;
  count: number;
}

export default function TopRestaurants({ transactions }: TopRestaurantsProps) {
  // Filter for restaurant expenses and aggregate by restaurant name
  const restaurantMap = new Map<string, RestaurantData>();

  transactions
    .filter((t) => t.type === 'expense' && t.category === '高級レストラン')
    .forEach((t) => {
      const restaurantName = t.description.trim();
      if (!restaurantName) return;

      const existing = restaurantMap.get(restaurantName);
      if (existing) {
        existing.totalAmount += t.amount;
        existing.count += 1;
        // Update address if the new one is more detailed (longer)
        if (t.location && t.location.length > existing.address.length) {
          existing.address = t.location;
        }
      } else {
        restaurantMap.set(restaurantName, {
          name: restaurantName,
          address: t.location || '住所不明',
          totalAmount: t.amount,
          count: 1,
        });
      }
    });

  // Convert to array and sort by total amount
  const allRestaurants = Array.from(restaurantMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Get top 5
  const topRestaurants = allRestaurants.slice(0, 5);

  if (topRestaurants.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">✨ 御用達の高級レストラン</h2>
        <a
          href="https://tabelog.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline whitespace-nowrap"
        >
          🔍 食べログで調べる!
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {topRestaurants.map((restaurant, index) => (
          <div
            key={restaurant.name}
            className="flex flex-col p-4 bg-neutral-50 rounded-[16px] hover:bg-neutral-100 transition-colors border-2 border-neutral-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <span className="font-bold text-red-600 text-2xl">
                {formatJapaneseCurrency(restaurant.totalAmount)}
              </span>
            </div>
            <p className="font-bold text-text-primary mb-3">{restaurant.name}</p>
            <div className="mt-auto">
              <span className="text-xs text-text-secondary">
                利用回数: <span className="font-medium text-text-primary">{restaurant.count}回</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
