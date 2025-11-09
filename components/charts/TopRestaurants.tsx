'use client';

import { Transaction } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';

interface TopRestaurantsProps {
  transactions: Transaction[];
  showImages?: boolean;
}

interface RestaurantData {
  name: string;
  address: string;
  genre: string;
  url: string;
  totalAmount: number;
  count: number;
}

export default function TopRestaurants({ transactions, showImages = false }: TopRestaurantsProps) {
  // Predefined images for specific restaurants
  const predefinedImages: { [key: string]: string } = {
    '東京重よし': '/images/Shigeyoshi.png',
    '波むら': '/images/Hamura.png',
    '銀座ヒラヤマ': '/images/hirayama.png',
    '一宝東京店': '/images/Ippou.png',
    'たいや': '/images/taiya.png',
    'たい家': '/images/taiya.png',
    'キャンティ': '/images/chianti.png',
    'チェント': '/images/chianti.png',
    '永田町天竹': '/images/fugu.png',
    '割烹味岡': '/images/ajioka.png',
    '西洋料理東洋軒': '/images/toyo.png',
    '東洋軒': '/images/toyo.png',
    '東京吉兆銀座店': '/images/kicho.png',
    '古仙': '/images/kosen.png',
  };

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

  // Calculate total count and amount for all restaurant transactions
  const totalTransactions = transactions.filter((t) => t.type === 'expense' && t.category === '高級レストラン').length;
  const totalAmount = transactions
    .filter((t) => t.type === 'expense' && t.category === '高級レストラン')
    .reduce((sum, t) => sum + t.amount, 0);

  const RestaurantRow = ({ restaurant, index, isSpending }: { restaurant: RestaurantData; index: number; isSpending: boolean }) => {
    const isTop1 = index === 0;
    const restaurantImage = showImages ? predefinedImages[restaurant.name] : undefined;

    const content = (
      <div className={`p-3 ${restaurantImage ? 'pb-0' : ''} rounded-lg transition-all h-full bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm border border-red-200/50 hover:shadow-lg hover:border-red-300/60 flex flex-col`}>
        {/* Top section: Ranking badge + Restaurant info */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className="flex-shrink-0 w-7 h-7 text-white rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
          >
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-[0.825rem] leading-tight mb-1 text-text-primary truncate">
              {restaurant.name}
            </p>
            <p className="text-[10px] text-text-secondary mb-2 truncate">
              {restaurant.genre || '高級料理'}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs text-red-600">
                {formatJapaneseCurrency(restaurant.totalAmount)}
              </p>
              <p className="text-[10px] text-text-primary">
                {restaurant.count}回
              </p>
            </div>
          </div>
        </div>

        {/* Image display - only show if showImages prop is true and image exists */}
        {showImages && restaurantImage && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
            <img src={restaurantImage} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    );

    if (restaurant.url) {
      return (
        <div key={restaurant.name} onClick={() => window.open(restaurant.url, '_blank')} className="cursor-pointer h-full">
          {content}
        </div>
      );
    }

    return <div key={restaurant.name} className="h-full">{content}</div>;
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

      {/* Total Spending Ranking - Horizontal Gallery */}
      {topBySpending.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p className="text-sm md:text-base">レストランデータがありません</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100 hover:scrollbar-thumb-neutral-400">
          {topBySpending.map((restaurant, index) => {
            const hasImage = showImages && predefinedImages[restaurant.name];
            return (
              <div
                key={restaurant.name}
                className={`flex-shrink-0 w-[160px] md:w-[180px] ${showImages && hasImage ? 'h-[230px] md:h-[250px]' : 'h-auto'}`}
              >
                <RestaurantRow restaurant={restaurant} index={index} isSpending={true} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
