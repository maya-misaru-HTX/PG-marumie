'use client';

import { Transaction } from '@/lib/types';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { ExternalLink } from 'lucide-react';

interface TopRestaurantsProps {
  transactions: Transaction[];
  showImages?: boolean;
  politicianName?: string;
}

interface RestaurantData {
  name: string;
  address: string;
  genre: string;
  url: string;
  totalAmount: number;
  count: number;
}

export default function TopRestaurants({ transactions, showImages = false, politicianName }: TopRestaurantsProps) {
  // Predefined images for specific restaurants
  const predefinedImages: { [key: string]: string } = {
    '東京重よし': '/images/Aso/Shigeyoshi.png',
    '波むら': '/images/Aso/Hamura.png',
    '銀座ヒラヤマ': '/images/Aso/hirayama.png',
    '一宝東京店': '/images/Aso/Ippou.png',
    'たいや': '/images/Aso/taiya.png',
    'たい家': '/images/Aso/taiya.png',
    'キャンティ': '/images/Aso/chianti.png',
    'チェント': '/images/Aso/chianti.png',
    '永田町天竹': '/images/Aso/fugu.png',
    '割烹味岡': '/images/Aso/ajioka.png',
    '西洋料理東洋軒': '/images/Aso/toyo.png',
    '東洋軒': '/images/Aso/toyo.png',
    '東京吉兆銀座店': '/images/Aso/kicho.png',
    '古仙': '/images/Aso/kosen.png',
    '春帆楼本店': '/images/Hayashi/shunpanro.png',
    '蕪庵': '/images/Hayashi/buan.png',
    '金田中': '/images/Hayashi/kanetanaka.png',
    '重箱': '/images/Hayashi/jubako.png',
    'フェルミンチョ': '/images/Hayashi/フェルミンチョ.jpg',
    '焼肉ジャンボ篠崎本店': '/images/Hayashi/jumbo.png',
    '白金高輪ぶち': '/images/Hayashi/白金高輪ぶち.png',
    '山の茶屋': '/images/Hayashi/chaya.png',
    '龍泉華': '/images/Hayashi/ryusenka.png',
  };

  // Custom display names for restaurants
  const customDisplayNames: { [key: string]: string } = {
    '焼肉ジャンボ篠崎本店': '焼肉ジャンボ',
    '下関唐戸魚市場株式会社': '下関唐戸魚市場',
  };

  // Custom genres for restaurants
  const customGenres: { [key: string]: string } = {
    '焼肉ジャンボ篠崎本店': '焼肉',
  };

  // Filter for restaurant expenses and aggregate by restaurant name
  // Exclude all 懇親会 transactions
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

  // Filter out restaurants with visit count = 1 AND total spending < 30,000
  let allRestaurants = Array.from(restaurantMap.values()).filter(
    (r) => !(r.count === 1 && r.totalAmount < 30000)
  );

  // Apply additional filters based on politician
  const isHayashi = politicianName === '林芳正';

  if (isHayashi) {
    // For Hayashi: exclude specific restaurants and single-visit restaurants
    const restaurantsToExclude = ['キャピトルホテル東急', '焼肉 頂楽 八丁堀本店', '金田中', '重箱', 'フェルミンチョ', '下関唐戸魚市場株式会社', 'ザ・キャピトルホテル東急'];
    allRestaurants = allRestaurants.filter(r => !restaurantsToExclude.includes(r.name) && r.count > 1);
  }

  // Get top restaurants by spending (6 for Hayashi, 10 for others)
  const topCount = isHayashi ? 6 : 10;
  const topBySpending = [...allRestaurants]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, topCount);

  // Calculate total count and amount for all restaurant transactions
  const totalTransactions = transactions.filter((t) => t.type === 'expense' && t.category === '高級レストラン').length;
  const totalAmount = transactions
    .filter((t) => t.type === 'expense' && t.category === '高級レストラン')
    .reduce((sum, t) => sum + t.amount, 0);

  const RestaurantRow = ({ restaurant, index, isSpending }: { restaurant: RestaurantData; index: number; isSpending: boolean }) => {
    const isTop1 = index === 0;
    const restaurantImage = showImages ? predefinedImages[restaurant.name] : undefined;

    const content = (
      <div className={`relative p-3 ${restaurantImage ? 'pb-0' : 'pb-2'} rounded-lg transition-all h-full bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm border border-red-200/50 hover:shadow-lg hover:border-red-300/60 flex flex-col`}>
        {/* External link icon - only show if URL exists */}
        {restaurant.url && (
          <div className="absolute top-2 right-2">
            <ExternalLink className="w-4 h-4 text-neutral-300 scale-95" />
          </div>
        )}

        {/* Top section: Ranking badge + Restaurant info */}
        <div className="flex items-start gap-2">
          <div
            className="flex-shrink-0 w-7 h-7 text-white rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
          >
            {index + 1}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <p className="font-bold text-[0.825rem] leading-tight mb-1 text-text-primary break-words">
              {customDisplayNames[restaurant.name] || restaurant.name}
            </p>
            <p className="text-xs text-text-secondary mb-1 break-words">
              {customGenres[restaurant.name] || restaurant.genre || '高級料理'}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs text-red-600">
                {formatJapaneseCurrency(restaurant.totalAmount)}
              </p>
              <p className="text-xs text-text-primary">
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
