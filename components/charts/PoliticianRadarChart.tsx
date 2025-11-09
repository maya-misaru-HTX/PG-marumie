'use client';

import { useState } from 'react';
import { Transaction, Summary } from '@/lib/types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import { Info } from 'lucide-react';

interface PoliticianRadarChartProps {
  transactions: Transaction[];
  summary: Summary;
}

const metricDefinitions = [
  {
    title: '戦闘力の平均比',
    description: '議員の平均収入3594万円との比較'
  },
  {
    title: '防御力',
    description: '自分の団体への寄付（多いほど政治資金の透明性が低い）'
  },
  {
    title: '仲間への支援',
    description: '他の政治団体への寄付（多いほど派閥や集票のパワーが高い）'
  },
  {
    title: '社会への影響力',
    description: '企業団体献金・政治資金パーティー・イベント等の事業収入'
  },
  {
    title: '社交力',
    description: '高級レストラン、ホテルでの会食・懇親会の出費'
  }
];

export default function PoliticianRadarChart({ transactions, summary }: PoliticianRadarChartProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Close explanation when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-explanation]') && !target.closest('button')) {
      setShowExplanation(false);
    }
  };

  // Custom tick component to render multi-line labels
  const CustomTick = ({ payload, x, y, textAnchor, fontSize, index, isMobile }: any) => {
    const lines = payload.value.split('\n');

    // Calculate radial offset to push labels further from chart center
    // Index 0 is the top label (戦闘力の平均比) - needs more offset to prevent overlap
    // Reduce offset on mobile to prevent overflow
    const radialOffset = index === 0 ? (isMobile ? 20 : 30) : (isMobile ? 4 : 8);

    // Increase font size for top label by 50%
    const adjustedFontSize = index === 0 ? fontSize * 1.5 : fontSize;

    // Calculate the angle for this label
    const metrics = ['戦闘力の平均比', '防御力', '仲間への支援', '社会への影響力', '社交力'];
    const angle = (90 - (360 / metrics.length) * index) * (Math.PI / 180);

    // Push label away from center along its radial line
    const offsetX = Math.cos(angle) * radialOffset;
    const offsetY = -Math.sin(angle) * radialOffset;

    return (
      <text
        x={x + offsetX}
        y={y + offsetY}
        textAnchor={textAnchor}
        fill="#374151"
        fontSize={adjustedFontSize}
      >
        <tspan x={x + offsetX} dy="0" fontWeight="bold">{lines[0]}</tspan>
        <tspan x={x + offsetX} dy="1.2em" fontWeight={500}>{lines[1]}</tspan>
      </text>
    );
  };

  // Calculate metrics
  const calculateMetrics = () => {
    // 1. 戦闘力の平均比: (今年の収入 / 35,940,000) × 100%
    const thisYearIncome = summary.incomeTotal - summary.carriedFromPrevYear;
    const combatPowerRatio = Math.round((thisYearIncome / 35940000) * 100);

    // 2. 防御力: (セルフ寄付合計 / (50% of 今年の収入)) × 100%
    const selfDonationTotal = transactions
      .filter(t => t.category === 'セルフ寄付')
      .reduce((sum, t) => sum + t.amount, 0);
    const defensePower = Math.round((selfDonationTotal / (thisYearIncome * 0.5)) * 100);

    // 3. 仲間への支援: (仲間への寄付合計 / 10,000,000) × 100%
    const teamDonationTotal = transactions
      .filter(t => t.category === '仲間への寄付')
      .reduce((sum, t) => sum + t.amount, 0);
    const teamInfluence = Math.round((teamDonationTotal / 10000000) * 100);

    // 4. 社会への影響力: ((イベント・グッズ売上 + 企業・団体献金 + 政治資金パーティー) / 今年の収入) × 100%
    const socialIncomeCategories = ['イベント・グッズ売上', '企業・団体献金', '政治資金パーティー'];
    const socialIncomeTotal = transactions
      .filter(t => t.type === 'income' && socialIncomeCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    const socialInfluence = Math.round((socialIncomeTotal / thisYearIncome) * 100);

    // 5. 社交力: ((高級レストラン + 懇親会) / 15,000,000) × 100%
    const socialExpenseCategories = ['高級レストラン', '懇親会'];
    const socialExpenseTotal = transactions
      .filter(t => socialExpenseCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    const socialPower = Math.round((socialExpenseTotal / 15000000) * 100);

    return {
      combatPowerRatio,
      combatPowerSum: thisYearIncome,
      defensePower,
      defensePowerSum: selfDonationTotal,
      teamInfluence,
      teamInfluenceSum: teamDonationTotal,
      socialInfluence,
      socialInfluenceSum: socialIncomeTotal,
      socialPower,
      socialPowerSum: socialExpenseTotal,
    };
  };

  const metrics = calculateMetrics();

  // Prepare data for radar chart (cap display values at 100%)
  const radarData = [
    {
      metric: `戦闘力の平均比\n${(metrics.combatPowerRatio / 100).toFixed(1)}倍`,
      value: Math.min(metrics.combatPowerRatio, 100),
      fullValue: metrics.combatPowerRatio,
    },
    {
      metric: `防御力\n${formatJapaneseCurrency(metrics.defensePowerSum)}`,
      value: Math.min(metrics.defensePower, 100),
      fullValue: metrics.defensePower,
    },
    {
      metric: `仲間への支援\n${formatJapaneseCurrency(metrics.teamInfluenceSum)}`,
      value: Math.min(metrics.teamInfluence, 100),
      fullValue: metrics.teamInfluence,
    },
    {
      metric: `社会への影響力\n${formatJapaneseCurrency(metrics.socialInfluenceSum)}`,
      value: Math.min(metrics.socialInfluence, 100),
      fullValue: metrics.socialInfluence,
    },
    {
      metric: `社交力\n${formatJapaneseCurrency(metrics.socialPowerSum)}`,
      value: Math.min(metrics.socialPower, 100),
      fullValue: metrics.socialPower,
    },
  ];

  return (
    <div className="w-full" onClick={handleClickOutside}>
      {/* Radar Chart */}
      <div className="flex justify-center items-center">
        {/* Mobile - match headshot size (192x192) with extra padding for labels */}
        <div className="md:hidden relative mx-auto" style={{ width: '100%', maxWidth: '340px', height: '340px' }}>
          <RadarChart width={340} height={340} data={radarData} cx="50%" cy="50%" margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="metric"
              tick={(props) => <CustomTick {...props} fontSize={10} isMobile={true} />}
              stroke="#9CA3AF"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              stroke="#9CA3AF"
            />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="#5eead4"
              fill="#5eead4"
              fillOpacity={0.6}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </RadarChart>
        </div>

        {/* Desktop - match headshot size (256x256) with extra padding for labels */}
        <div className="hidden md:block relative" style={{ width: '100%', maxWidth: '378px', height: '378px' }}>
          <RadarChart width={378} height={378} data={radarData} cx="50%" cy="50%" margin={{ top: 32, right: 45, bottom: 45, left: 45 }}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="metric"
              tick={(props) => <CustomTick {...props} fontSize={13} isMobile={false} />}
              stroke="#9CA3AF"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              stroke="#9CA3AF"
            />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="#5eead4"
              fill="#5eead4"
              fillOpacity={0.6}
              strokeWidth={2}
              dot={{ r: 5 }}
            />
          </RadarChart>
        </div>
      </div>

      {/* Chart Guide Button */}
      <div className="flex justify-center -mt-16 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowExplanation(!showExplanation);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          チャートの見方
        </button>
      </div>

      {/* Explanation Panel */}
      {showExplanation && (
        <div data-explanation className="mt-3 md:mt-4 p-3 md:p-4 bg-white border-2 border-teal-400 rounded-lg shadow-lg">
          <div className="space-y-1.5 md:space-y-2">
            {metricDefinitions.map((metric, index) => (
              <div key={index} className="flex gap-2 md:gap-3">
                <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full text-[10px] md:text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs md:text-sm font-bold text-text-primary mb-0.5">{metric.title}</h4>
                  <p className="text-[11px] md:text-sm text-text-secondary whitespace-nowrap">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
