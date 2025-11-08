'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [spendingExpanded, setSpendingExpanded] = useState(true);
  const [visitsExpanded, setVisitsExpanded] = useState(true);

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

  // Get top 10 by visits
  const topByVisits = [...allRestaurants]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (allRestaurants.length === 0) {
    return null;
  }

  // Calculate total count and amount for all restaurant transactions
  const totalTransactions = transactions.filter((t) => t.type === 'expense' && t.category === '高級レストラン').length;
  const totalAmount = transactions
    .filter((t) => t.type === 'expense' && t.category === '高級レストラン')
    .reduce((sum, t) => sum + t.amount, 0);

  const RestaurantCard = ({ restaurant, index, isSpending }: { restaurant: RestaurantData; index: number; isSpending: boolean }) => {
    const cardContent = (
      <>
        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
          <div
            className="flex-shrink-0 w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-sm text-white shadow-md"
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
            }}
          >
            {index + 1}
          </div>
          <span className="font-extrabold text-red-600 text-xs sm:text-base md:text-2xl tracking-tight leading-none">
            {isSpending ? formatJapaneseCurrency(restaurant.totalAmount) : `${restaurant.count}回`}
          </span>
        </div>
        <div className="mb-1 sm:mb-2 flex-1 flex flex-col justify-center overflow-hidden">
          <p className="font-bold text-text-primary text-[10px] sm:text-xs md:text-base leading-tight mb-0.5 truncate">{restaurant.name}</p>
          <p className="text-[8px] sm:text-[10px] md:text-xs text-text-secondary font-medium leading-tight break-words">
            {restaurant.genre || '高級料理'}
          </p>
        </div>
        <div className="mt-auto">
          <div className="pt-1 border-t border-neutral-200/50">
            <span className="text-[8px] sm:text-[9px] md:text-xs text-text-secondary font-medium block">
              {isSpending ? (
                <>利用回数: <span className="font-bold text-text-primary">{restaurant.count}回</span></>
              ) : (
                <>総額: <span className="font-bold text-text-primary">{formatJapaneseCurrency(restaurant.totalAmount)}</span></>
              )}
            </span>
          </div>
        </div>
      </>
    );

    const baseClassName = "relative flex flex-col p-2 sm:p-3 md:p-5 rounded-2xl bg-gradient-to-br from-white to-neutral-50 backdrop-blur-sm shadow-md flex-shrink-0 w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] md:w-[190px] md:h-[190px]";
    const withUrlClassName = `${baseClassName} hover:shadow-lg hover:scale-105 transition-all duration-300 border border-white/50 hover:border-red-300`;
    const withoutUrlClassName = `${baseClassName} border border-white/50`;
    const style = { boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)' };

    if (restaurant.url) {
      return (
        <a
          key={restaurant.name}
          href={restaurant.url}
          target="_blank"
          rel="noopener noreferrer"
          className={withUrlClassName}
          style={style}
        >
          {cardContent}
        </a>
      );
    }

    return (
      <div
        key={restaurant.name}
        className={withoutUrlClassName}
        style={style}
      >
        {cardContent}
      </div>
    );
  };

  return (
    <Card>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 className="text-sm md:text-xl lg:text-2xl font-bold text-text-primary whitespace-nowrap">✨ お気に入りの高級レストラン</h2>
          <div className="flex items-center gap-3 md:gap-4 text-sm md:text-xl lg:text-2xl">
            <span className="text-text-secondary whitespace-nowrap">件数: <span className="font-bold text-text-primary">{totalTransactions}件</span></span>
            <span className="text-text-secondary whitespace-nowrap">合計金額: <span className="font-bold text-red-600">{formatJapaneseCurrency(totalAmount)}</span></span>
          </div>
        </div>
      </div>

      {/* Total Spending Ranking */}
      <div className="mb-8">
        <button
          onClick={() => setSpendingExpanded(!spendingExpanded)}
          className="w-full flex items-center justify-between py-4 border-b-2 border-neutral-200 hover:border-red-300 transition-all mb-6 group"
        >
          <span className="text-sm md:text-base lg:text-lg text-text-primary group-hover:text-red-600 transition-colors">→ 支払額トップ10</span>
          {spendingExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary group-hover:text-red-600 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary group-hover:text-red-600 transition-colors" />
          )}
        </button>

        {spendingExpanded && (
          <div className="overflow-x-auto pb-4 -mx-1 px-1">
            <div className="flex gap-4 min-w-min py-2">
              {topBySpending.map((restaurant, index) => (
                <RestaurantCard key={restaurant.name} restaurant={restaurant} index={index} isSpending={true} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total Visits Ranking */}
      <div>
        <button
          onClick={() => setVisitsExpanded(!visitsExpanded)}
          className="w-full flex items-center justify-between py-4 border-b-2 border-neutral-200 hover:border-red-300 transition-all mb-6 group"
        >
          <span className="text-sm md:text-base lg:text-lg text-text-primary group-hover:text-red-600 transition-colors">→ 来店数トップ10</span>
          {visitsExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary group-hover:text-red-600 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary group-hover:text-red-600 transition-colors" />
          )}
        </button>

        {visitsExpanded && (
          <div className="overflow-x-auto pb-4 -mx-1 px-1">
            <div className="flex gap-4 min-w-min py-2">
              {topByVisits.map((restaurant, index) => (
                <RestaurantCard key={restaurant.name} restaurant={restaurant} index={index} isSpending={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
