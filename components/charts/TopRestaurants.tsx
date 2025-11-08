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
  genre: string;
  url: string;
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
        // Update genre if available
        if (t.subcategory && t.subcategory.length > existing.genre.length) {
          existing.genre = t.subcategory;
        }
        // Update URL if available
        if (t.url && !existing.url) {
          existing.url = t.url;
        }
      } else {
        restaurantMap.set(restaurantName, {
          name: restaurantName,
          address: t.location || '住所不明',
          genre: t.subcategory || '',
          url: t.url || '',
          totalAmount: t.amount,
          count: 1,
        });
      }
    });

  // Convert to array
  const allRestaurants = Array.from(restaurantMap.values());

  // Get top 10 by spending
  const topBySpending = [...allRestaurants]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  if (allRestaurants.length === 0) {
    return null;
  }

  // Calculate total count and amount for all restaurant transactions
  const totalTransactions = transactions.filter((t) => t.type === 'expense' && t.category === '高級レストラン').length;
  const totalAmount = transactions
    .filter((t) => t.type === 'expense' && t.category === '高級レストラン')
    .reduce((sum, t) => sum + t.amount, 0);

  const RestaurantRow = ({ restaurant, index, isSpending }: { restaurant: RestaurantData; index: number; isSpending: boolean }) => {
    const isTop1 = index === 0;

    const content = (
      <div className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
        isTop1
          ? 'bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm border border-red-200/50 shadow-lg'
          : 'bg-gradient-to-br from-white/60 to-neutral-50/60 backdrop-blur-sm border border-neutral-200/50 hover:shadow-md'
      }`}>
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <div
            className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 text-white rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
          >
            {index + 1}
          </div>
          <p className={`font-medium text-[10px] md:text-sm min-w-0 ${isTop1 ? 'font-bold text-text-primary' : 'text-text-primary'}`}>
            {restaurant.name}
            <span className="text-text-secondary font-normal">（{restaurant.genre || '高級料理'}）</span>
          </p>
        </div>
        <div className="flex flex-col items-end ml-1 md:ml-2">
          <p className={`font-bold text-[10px] md:text-sm whitespace-nowrap ${isTop1 ? 'text-red-700' : 'text-red-600'}`}>
            {formatJapaneseCurrency(restaurant.totalAmount)}
          </p>
          <p className="text-[8px] md:text-xs text-text-secondary whitespace-nowrap">
            {restaurant.count}回
          </p>
        </div>
      </div>
    );

    if (restaurant.url) {
      return (
        <a
          key={restaurant.name}
          href={restaurant.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }

    return <div key={restaurant.name}>{content}</div>;
  };

  return (
    <Card>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 className="text-sm md:text-xl lg:text-2xl font-bold text-text-primary whitespace-nowrap">✨ 御用達レストラン</h2>
          <div className="flex items-center gap-3 md:gap-4 text-sm md:text-xl lg:text-2xl">
            <span className="text-text-secondary whitespace-nowrap">件数: <span className="font-bold text-text-primary">{totalTransactions}件</span></span>
            <span className="text-text-secondary whitespace-nowrap">合計金額: <span className="font-bold text-red-600">{formatJapaneseCurrency(totalAmount)}</span></span>
          </div>
        </div>
      </div>

      {/* Total Spending Ranking */}
      <div className="space-y-2 max-h-[165px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100 hover:scrollbar-thumb-neutral-400">
        {topBySpending.map((restaurant, index) => (
          <RestaurantRow key={restaurant.name} restaurant={restaurant} index={index} isSpending={true} />
        ))}
      </div>
    </Card>
  );
}
