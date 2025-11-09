'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ExpenseReport } from '@/lib/types';
import SummaryCards from '@/components/summary/SummaryCards';
import IncomeExpenseBar from '@/components/charts/IncomeExpenseBar';
import CategoryPies from '@/components/charts/CategoryPies';
import TopDonors from '@/components/charts/TopDonors';
import TopRestaurants from '@/components/charts/TopRestaurants';
import TransactionTable from '@/components/table/TransactionTable';
import PoliticianRadarChart from '@/components/charts/PoliticianRadarChart';
import SectionNav from '@/components/navigation/SectionNav';
import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import { calculateOverallScore, calculatePoliticianMBTI, calculatePoliticianMBTIDetails } from '@/lib/calculations/scores';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { asoStaticReport } from '@/lib/data/aso-static-data';
import { hayashiStaticReport } from '@/lib/data/hayashi-static-data';

// Map politician slugs to their data
const politicianDataMap: { [key: string]: Omit<ExpenseReport, 'monthlyData' | 'metadata'> } = {
  'aso': asoStaticReport,
  'hayashi': hayashiStaticReport,
};

function ReportContent() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMBTIDetails, setShowMBTIDetails] = useState(false);

  // Get hereditary color based on generation number (higher = darker red)
  const getHereditaryColor = (hereditary?: string) => {
    if (!hereditary) return { bg: '#FEE2E2', text: '#991B1B' }; // red-100/red-800 default

    const match = hereditary.match(/(\d+)/);
    const generation = match ? parseInt(match[1]) : 1;

    // Gradation from light to dark red (generation 1-5+)
    // Use dark text for light backgrounds, white text for dark backgrounds
    const colors = [
      { bg: '#FEE2E2', text: '#991B1B' }, // 1代目: red-100/red-800 (light bg, dark text)
      { bg: '#FECACA', text: '#991B1B' }, // 2代目: red-200/red-800 (light bg, dark text)
      { bg: '#FCA5A5', text: '#7F1D1D' }, // 3代目: red-300/red-900 (medium bg, dark text)
      { bg: '#F87171', text: '#FFFFFF' }, // 4代目: red-400/white (dark bg, white text)
      { bg: '#EF4444', text: '#FFFFFF' }, // 5代目+: red-500/white (dark bg, white text)
    ];

    const index = Math.min(generation - 1, colors.length - 1);
    return colors[index];
  };

  // Helper to render description with highlighted type name
  const renderDescriptionWithHighlight = (description: string, typeName: string) => {
    const parts = description.split(new RegExp(`(「${typeName}」|${typeName})`, 'g'));
    return parts.map((part, index) => {
      if (part === typeName || part === `「${typeName}」`) {
        return (
          <span key={index} className="font-bold bg-yellow-200 px-1">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    const loadReport = async () => {
      try {
        const politician = params.politician as string;

        // First, try to load from URL parameter
        if (politician && politicianDataMap[politician]) {
          const staticData = politicianDataMap[politician];

          // Import enrichReportWithCalculations dynamically
          const { enrichReportWithCalculations } = await import('@/lib/calculations/aggregations');
          const enrichedReport = enrichReportWithCalculations(staticData);
          setReport(enrichedReport);
          return;
        }

        // Fallback to sessionStorage for custom uploads
        const sessionData = sessionStorage.getItem('currentReport');
        if (sessionData) {
          const report = JSON.parse(sessionData) as ExpenseReport;
          setReport(report);
          return;
        }

        // No data source found
        setError('レポートデータが見つかりません');
      } catch (err) {
        console.error('Report loading error:', err);
        setError('レポートデータの解析に失敗しました');
      }
    };

    loadReport();
  }, [params.politician]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-[826px] mx-auto text-center">
          <div className="bg-white rounded-[22px] border border-black p-12">
            <h1 className="text-2xl font-bold text-text-primary mb-4">エラー</h1>
            <p className="text-text-secondary mb-8">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary-500 text-white rounded-[24px] hover:bg-primary-600 transition-colors font-medium"
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-neutral-200 shadow-sm">
        <div className="max-w-[826px] mx-auto px-[30px] py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Back Button and Politician Info */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 min-w-0">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm text-text-primary hover:text-primary-600 transition-colors whitespace-nowrap -ml-[9px] md:-ml-[18px] font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">戻る</span>
              </button>

              <div className="flex flex-col gap-1 min-w-0 ml-2 md:ml-5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-text-primary truncate">
                    {report.politician.name}
                  </h1>
                  {/* Organization and Hereditary Labels */}
                  <div className="flex gap-1.5">
                    {report.politician.party && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs md:text-sm font-medium rounded-full whitespace-nowrap">
                        {report.politician.party}
                      </span>
                    )}
                    {report.politician.hereditary && (
                      <span
                        className="px-3 py-1 text-xs md:text-sm font-medium rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: getHereditaryColor(report.politician.hereditary).bg,
                          color: getHereditaryColor(report.politician.hereditary).text,
                        }}
                      >
                        世襲{report.politician.hereditary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-[30px] py-4 md:py-8">
        <div className="max-w-[826px] mx-auto space-y-4 md:space-y-8">

          {/* Politician Headshot and Radar Chart */}
          <div style={{ marginTop: '0px' }}>
            {report.politician.headshotUrl ? (
              <>
                {/* Mobile Layout - Stacked (with headshot) */}
                <div className="flex flex-col items-center gap-4 md:hidden">
                  <div className="w-48 h-48">
                    <img
                      src={report.politician.headshotUrl}
                      alt={report.politician.name}
                      className="w-full h-full rounded-full object-cover border-4 border-neutral-200 shadow-lg"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-text-primary" style={{ fontSize: '1.35rem' }}>
                      総合スコア：<span style={{ color: '#14b8a6' }}>{calculateOverallScore(report.transactions, report.summary, report.politician)}</span>
                    </p>
                    {(() => {
                      const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                      const hereditaryLabel = mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民';

                      // Color scheme based on type characteristics
                      const getTypeColor = (typeCode: string) => {
                        const [r, x, l, e] = typeCode.split('-');
                        // Rich + Leader types: Gold/Yellow
                        if (r === 'R' && l === 'L') return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(180, 83, 9)' };
                        // Rich types: Blue
                        if (r === 'R') return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(30, 64, 175)' };
                        // Leader types: Green
                        if (l === 'L') return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: 'rgb(22, 101, 52)' };
                        // Poor + Follower: Purple
                        return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(107, 33, 168)' };
                      };

                      const colors = getTypeColor(mbtiDetails.typeCode);

                      return (
                        <button
                          onClick={() => setShowMBTIDetails(!showMBTIDetails)}
                          className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-full backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-1.5 md:gap-2 cursor-pointer font-semibold text-xs md:text-sm"
                          style={{
                            backgroundColor: colors.bg,
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        >
                          <span>{mbtiDetails.typeName}（{hereditaryLabel}）</span>
                          {showMBTIDetails ? <ChevronUp className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <ChevronDown className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                        </button>
                      );
                    })()}
                  </div>

                  {/* MBTI Details Panel */}
                  {showMBTIDetails && (() => {
                    const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                    return (
                      <div className="mt-2 p-4 bg-white border-2 border-teal-400 rounded-lg shadow-lg mx-auto" style={{ maxWidth: '80%' }}>
                        {/* Classifications List */}
                        <div className="mb-4 flex flex-wrap gap-2 justify-center">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.R_P.value === 'R' ? '潤沢な資金' : '乏しい資金'}
                          </span>
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.X_M.value === 'X' ? '美食家' : '税金で食事しない'}
                          </span>
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.L_F.value === 'L' ? '派閥リーダー' : '派閥フォロワー'}
                          </span>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.E_N.value === 'E' ? 'ベテラン' : '新人'}
                          </span>
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民'}
                          </span>
                        </div>

                        {/* Dimensions */}
                        <div className="space-y-3 mb-4">
                          {/* R/P Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>乏しい資金</span>
                                <span>潤沢な資金</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.R_P.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* X/M Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>税金で食事しない</span>
                                <span>美食家</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.X_M.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* L/F Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>派閥フォロワー</span>
                                <span>派閥リーダー</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.L_F.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* E/N Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>新人</span>
                                <span>ベテラン</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.E_N.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* S/T Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>庶民</span>
                                <span>貴族</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.S_T.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="pt-3 border-t-2 border-teal-200">
                          <p className="text-xs text-text-primary leading-relaxed">
                            {renderDescriptionWithHighlight(mbtiDetails.description, mbtiDetails.typeName)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="w-full -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} politician={report.politician} />
                  </div>
                </div>

                {/* Desktop Layout - Side by Side (with headshot) */}
                <div className="hidden md:flex md:flex-col md:items-center md:gap-4">
                  <div className="flex flex-row items-start gap-8 justify-center">
                    <div className="flex flex-col items-center gap-4 flex-shrink-0">
                      <div className="w-64 h-64">
                        <img
                          src={report.politician.headshotUrl}
                          alt={report.politician.name}
                          className="w-full h-full rounded-full object-cover border-4 border-neutral-200 shadow-lg"
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-bold text-text-primary" style={{ fontSize: '2.025rem' }}>
                          総合スコア：<span style={{ color: '#14b8a6' }}>{calculateOverallScore(report.transactions, report.summary, report.politician)}</span>
                        </p>
                        {(() => {
                          const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                          const hereditaryLabel = mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民';

                          // Color scheme based on type characteristics
                          const getTypeColor = (typeCode: string) => {
                            const [r, x, l, e] = typeCode.split('-');
                            // Rich + Leader types: Gold/Yellow
                            if (r === 'R' && l === 'L') return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(180, 83, 9)' };
                            // Rich types: Blue
                            if (r === 'R') return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(30, 64, 175)' };
                            // Leader types: Green
                            if (l === 'L') return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: 'rgb(22, 101, 52)' };
                            // Poor + Follower: Purple
                            return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(107, 33, 168)' };
                          };

                          const colors = getTypeColor(mbtiDetails.typeCode);

                          return (
                            <button
                              onClick={() => setShowMBTIDetails(!showMBTIDetails)}
                              className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-full backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-1.5 md:gap-2 cursor-pointer font-semibold text-xs md:text-sm"
                              style={{
                                backgroundColor: colors.bg,
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: colors.border,
                                color: colors.text
                              }}
                            >
                              <span>{mbtiDetails.typeName}</span>
                              {showMBTIDetails ? <ChevronUp className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <ChevronDown className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="w-full max-w-md flex-shrink-0 -my-4 mb-5">
                      <PoliticianRadarChart transactions={report.transactions} summary={report.summary} politician={report.politician} />
                    </div>
                  </div>

                  {/* MBTI Details Panel */}
                  {showMBTIDetails && (() => {
                    const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                    return (
                      <div className="mt-2 p-4 bg-white border-2 border-teal-400 rounded-lg shadow-lg mx-auto" style={{ maxWidth: '80%' }}>
                        {/* Classifications List */}
                        <div className="mb-4 flex flex-wrap gap-2 justify-center">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.R_P.value === 'R' ? '潤沢な資金' : '乏しい資金'}
                          </span>
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.X_M.value === 'X' ? '美食家' : '税金で食事しない'}
                          </span>
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.L_F.value === 'L' ? '派閥リーダー' : '派閥フォロワー'}
                          </span>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.E_N.value === 'E' ? 'ベテラン' : '新人'}
                          </span>
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民'}
                          </span>
                        </div>

                        {/* Dimensions */}
                        <div className="space-y-3 mb-4">
                          {/* R/P Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>乏しい資金</span>
                                <span>潤沢な資金</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.R_P.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* X/M Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>税金で食事しない</span>
                                <span>美食家</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.X_M.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* L/F Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>派閥フォロワー</span>
                                <span>派閥リーダー</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.L_F.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* E/N Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>新人</span>
                                <span>ベテラン</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.E_N.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* S/T Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>庶民</span>
                                <span>貴族</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.S_T.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="pt-3 border-t-2 border-teal-200">
                          <p className="text-xs text-text-primary leading-relaxed">
                            {renderDescriptionWithHighlight(mbtiDetails.description, mbtiDetails.typeName)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                {/* Mobile Layout - Without headshot */}
                <div className="flex flex-col items-center gap-4 md:hidden">
                  <div className="text-center space-y-1">
                    <p className="font-bold text-text-primary" style={{ fontSize: '1.35rem' }}>
                      総合スコア：<span style={{ color: '#14b8a6' }}>{calculateOverallScore(report.transactions, report.summary, report.politician)}</span>
                    </p>
                    {(() => {
                      const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                      const hereditaryLabel = mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民';

                      // Color scheme based on type characteristics
                      const getTypeColor = (typeCode: string) => {
                        const [r, x, l, e] = typeCode.split('-');
                        // Rich + Leader types: Gold/Yellow
                        if (r === 'R' && l === 'L') return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(180, 83, 9)' };
                        // Rich types: Blue
                        if (r === 'R') return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(30, 64, 175)' };
                        // Leader types: Green
                        if (l === 'L') return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: 'rgb(22, 101, 52)' };
                        // Poor + Follower: Purple
                        return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(107, 33, 168)' };
                      };

                      const colors = getTypeColor(mbtiDetails.typeCode);

                      return (
                        <button
                          onClick={() => setShowMBTIDetails(!showMBTIDetails)}
                          className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-full backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-1.5 md:gap-2 cursor-pointer font-semibold text-xs md:text-sm"
                          style={{
                            backgroundColor: colors.bg,
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        >
                          <span>{mbtiDetails.typeName}（{hereditaryLabel}）</span>
                          {showMBTIDetails ? <ChevronUp className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <ChevronDown className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                        </button>
                      );
                    })()}
                  </div>

                  {/* MBTI Details Panel */}
                  {showMBTIDetails && (() => {
                    const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                    return (
                      <div className="mt-2 p-4 bg-white border-2 border-teal-400 rounded-lg shadow-lg mx-auto" style={{ maxWidth: '80%' }}>
                        {/* Classifications List */}
                        <div className="mb-4 flex flex-wrap gap-2 justify-center">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.R_P.value === 'R' ? '潤沢な資金' : '乏しい資金'}
                          </span>
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.X_M.value === 'X' ? '美食家' : '税金で食事しない'}
                          </span>
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.L_F.value === 'L' ? '派閥リーダー' : '派閥フォロワー'}
                          </span>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.E_N.value === 'E' ? 'ベテラン' : '新人'}
                          </span>
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民'}
                          </span>
                        </div>

                        {/* Dimensions */}
                        <div className="space-y-3 mb-4">
                          {/* R/P Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>乏しい資金</span>
                                <span>潤沢な資金</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.R_P.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* X/M Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>税金で食事しない</span>
                                <span>美食家</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.X_M.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* L/F Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>派閥フォロワー</span>
                                <span>派閥リーダー</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.L_F.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* E/N Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>新人</span>
                                <span>ベテラン</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.E_N.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* S/T Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>庶民</span>
                                <span>貴族</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.S_T.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="pt-3 border-t-2 border-teal-200">
                          <p className="text-xs text-text-primary leading-relaxed">
                            {renderDescriptionWithHighlight(mbtiDetails.description, mbtiDetails.typeName)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="w-full -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} politician={report.politician} />
                  </div>
                </div>

                {/* Desktop Layout - Without headshot */}
                <div className="hidden md:flex md:flex-col md:items-center md:gap-4">
                  <div className="text-center space-y-2">
                    <p className="font-bold text-text-primary" style={{ fontSize: '2.025rem' }}>
                      総合スコア：<span style={{ color: '#14b8a6' }}>{calculateOverallScore(report.transactions, report.summary, report.politician)}</span>
                    </p>
                    {(() => {
                      const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                      const hereditaryLabel = mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民';

                      // Color scheme based on type characteristics
                      const getTypeColor = (typeCode: string) => {
                        const [r, x, l, e] = typeCode.split('-');
                        // Rich + Leader types: Gold/Yellow
                        if (r === 'R' && l === 'L') return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(180, 83, 9)' };
                        // Rich types: Blue
                        if (r === 'R') return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(30, 64, 175)' };
                        // Leader types: Green
                        if (l === 'L') return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: 'rgb(22, 101, 52)' };
                        // Poor + Follower: Purple
                        return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(107, 33, 168)' };
                      };

                      const colors = getTypeColor(mbtiDetails.typeCode);

                      return (
                        <button
                          onClick={() => setShowMBTIDetails(!showMBTIDetails)}
                          className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-full backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-1.5 md:gap-2 cursor-pointer font-semibold text-xs md:text-sm"
                          style={{
                            backgroundColor: colors.bg,
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        >
                          <span>{mbtiDetails.typeName}</span>
                          {showMBTIDetails ? <ChevronUp className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <ChevronDown className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                        </button>
                      );
                    })()}
                  </div>

                  {/* MBTI Details Panel */}
                  {showMBTIDetails && (() => {
                    const mbtiDetails = calculatePoliticianMBTIDetails(report.transactions, report.summary, report.politician);
                    return (
                      <div className="mt-2 p-4 bg-white border-2 border-teal-400 rounded-lg shadow-lg mx-auto" style={{ maxWidth: '80%' }}>
                        {/* Classifications List */}
                        <div className="mb-4 flex flex-wrap gap-2 justify-center">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.R_P.value === 'R' ? '潤沢な資金' : '乏しい資金'}
                          </span>
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.X_M.value === 'X' ? '美食家' : '税金で食事しない'}
                          </span>
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.L_F.value === 'L' ? '派閥リーダー' : '派閥フォロワー'}
                          </span>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.E_N.value === 'E' ? 'ベテラン' : '新人'}
                          </span>
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            {mbtiDetails.dimensions.S_T.value === 'S' ? '貴族' : '庶民'}
                          </span>
                        </div>

                        {/* Dimensions */}
                        <div className="space-y-3 mb-4">
                          {/* R/P Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>乏しい資金</span>
                                <span>潤沢な資金</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.R_P.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* X/M Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>税金で食事しない</span>
                                <span>美食家</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.X_M.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* L/F Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>派閥フォロワー</span>
                                <span>派閥リーダー</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.L_F.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* E/N Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>新人</span>
                                <span>ベテラン</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.E_N.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* S/T Dimension */}
                          <div>
                            <div className="relative">
                              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                                <span>庶民</span>
                                <span>貴族</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-400 transition-all"
                                  style={{ width: `${mbtiDetails.dimensions.S_T.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="pt-3 border-t-2 border-teal-200">
                          <p className="text-xs text-text-primary leading-relaxed">
                            {renderDescriptionWithHighlight(mbtiDetails.description, mbtiDetails.typeName)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="w-full max-w-md -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} politician={report.politician} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Income Pie Section */}
          <div className="scroll-mt-24">
            <CategoryPies income={report.income} expenses={report.expenses} />
          </div>

          {/* Top Donors Section */}
          <div id="top-donors" className="scroll-mt-24">
            <TopDonors transactions={report.transactions} incomeCategories={report.income.categories} />
          </div>

          {/* Top Restaurants Section */}
          <div id="top-restaurants" className="scroll-mt-24">
            <TopRestaurants
              transactions={report.transactions}
              showImages={!!report.politician.headshotUrl}
              politicianName={report.politician.name}
            />
          </div>

          {/* Transaction Table Section */}
          <div id="transactions" className="scroll-mt-24">
            <TransactionTable transactions={report.transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
