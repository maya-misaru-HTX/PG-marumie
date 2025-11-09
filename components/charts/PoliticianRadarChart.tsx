'use client';

import { useState } from 'react';
import { Transaction, Summary, PoliticianInfo } from '@/lib/types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import { calculatePoliticianMetrics, calculateOverallScore } from '@/lib/calculations/scores';
import { Info } from 'lucide-react';

interface PoliticianRadarChartProps {
  transactions: Transaction[];
  summary: Summary;
  politician: PoliticianInfo;
}

const metricDefinitions = [
  {
    title: '集金力',
    description: '収入合計（昨年度からの繰越を含む）'
  },
  {
    title: '美食力',
    description: '高級レストランやホテルでの会食・懇親会費'
  },
  {
    title: '派閥力',
    description: '自分の直属の関連団体以外への寄付・交付金'
  },
  {
    title: '当選力',
    description: '党議院選挙の当選回数'
  },
  {
    title: '世襲力',
    description: '自分を含め、親系図の中で国政に携わった世代数'
  }
];

export default function PoliticianRadarChart({ transactions, summary, politician }: PoliticianRadarChartProps) {
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

    // Top 3 metrics (集金力, 美食力, 派閥力) get special styling regardless of position
    const metricName = lines[0];
    const topMetrics = ['集金力', '美食力', '派閥力'];
    const isTopMetric = topMetrics.includes(metricName);

    // Different radial offsets for different metrics
    // 集金力: original distance (top position)
    // 美食力 & 派閥力: much closer to chart
    // Others: standard distance
    let radialOffset;
    if (metricName === '集金力') {
      radialOffset = isMobile ? 20 : 30;
    } else if (metricName === '美食力' || metricName === '派閥力') {
      radialOffset = isMobile ? 4 : 6;
    } else {
      radialOffset = isMobile ? 4 : 8;
    }

    // Font size adjustments:
    // 集金力: 1.5x (same as before)
    // 美食力 & 派閥力: 1.35x (10% smaller than 集金力)
    // Others: 1x (normal)
    let adjustedFontSize;
    if (metricName === '集金力') {
      adjustedFontSize = fontSize * 1.5;
    } else if (metricName === '美食力' || metricName === '派閥力') {
      adjustedFontSize = fontSize * 1.35;
    } else {
      adjustedFontSize = fontSize;
    }

    // Green color for top 3 metrics, default gray for bottom 2
    const labelColor = isTopMetric ? '#14b8a6' : '#374151';

    // Calculate the angle for this label
    // New order: 集金力、派閥力、世襲力、当選力、美食力
    const metrics = ['集金力', '派閥力', '世襲力', '当選力', '美食力'];
    const angle = (90 - (360 / metrics.length) * index) * (Math.PI / 180);

    // Push label away from center along its radial line
    const offsetX = Math.cos(angle) * radialOffset;
    const offsetY = -Math.sin(angle) * radialOffset;

    return (
      <text
        x={x + offsetX}
        y={y + offsetY}
        textAnchor={textAnchor}
        fill={labelColor}
        fontSize={adjustedFontSize}
      >
        <tspan x={x + offsetX} dy="0" fontWeight="bold">{lines[0]}</tspan>
        <tspan x={x + offsetX} dy="1.2em" fontWeight={500}>{lines[1]}</tspan>
      </text>
    );
  };

  // Calculate metrics using shared utility function
  const metrics = calculatePoliticianMetrics(transactions, summary, politician);

  // Prepare data for radar chart with new metrics
  // Order: 集金力、派閥力、世襲力、当選力、美食力 (clockwise)
  const radarData = [
    {
      metric: `集金力\n${formatJapaneseCurrency(metrics.shukinryokuValue)}`,
      value: metrics.shukinryokuNormalized,
      rawValue: metrics.shukinryokuValue,
      displayScore: metrics.shukinryokuScoreRounded,
    },
    {
      metric: `派閥力\n${formatJapaneseCurrency(metrics.habatsuryokuValue)}`,
      value: metrics.habatsuryokuNormalized,
      rawValue: metrics.habatsuryokuValue,
      displayScore: metrics.habatsuryokuScoreRounded,
    },
    {
      metric: `世襲力\n${metrics.seshuuryokuValue}代目`,
      value: metrics.seshuuryokuNormalized,
      rawValue: metrics.seshuuryokuValue,
      displayScore: metrics.seshuuryokuValue,
    },
    {
      metric: `当選力\n${metrics.tousenryokuScore}回`,
      value: metrics.tousenryokuNormalized,
      rawValue: metrics.tousenryokuValue,
      displayScore: metrics.tousenryokuScore,
    },
    {
      metric: `美食力\n${formatJapaneseCurrency(metrics.bishokuryokuValue)}`,
      value: metrics.bishokuryokuNormalized,
      rawValue: metrics.bishokuryokuValue,
      displayScore: metrics.bishokuryokuScoreRounded,
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
        <div className="hidden md:block relative" style={{ width: '100%', maxWidth: '420px', height: '420px' }}>
          <RadarChart width={420} height={420} data={radarData} cx="50%" cy="50%" margin={{ top: 60, right: 60, bottom: 60, left: 60 }}>
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

          {/* Total Score Calculation Explanation */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-teal-200">
            <h4 className="text-xs md:text-sm font-bold text-text-primary mb-1 md:mb-1.5">総合スコアの計算方法</h4>
            <p className="text-[11px] md:text-sm text-text-secondary leading-relaxed">
              総合スコア = （集金力 + 美食力 + 派閥力 + 当選力）× 世襲力
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
