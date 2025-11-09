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
import { ArrowLeft } from 'lucide-react';
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
                      <span className="px-3 py-1 text-xs md:text-sm font-medium bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                        {report.politician.party}
                      </span>
                    )}
                    {report.politician.hereditary && (
                      <span className="px-3 py-1 text-xs md:text-sm font-medium bg-purple-100 text-purple-700 rounded-full whitespace-nowrap">
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
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">
                      戦闘力 <span style={{ color: '#14b8a6' }}>{formatJapaneseCurrency(report.summary.incomeTotal)}</span>
                    </p>
                  </div>
                  <div className="w-full -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} />
                  </div>
                </div>

                {/* Desktop Layout - Side by Side (with headshot) */}
                <div className="hidden md:flex md:flex-row md:items-start md:gap-8 md:justify-center">
                  <div className="flex flex-col items-center gap-4 flex-shrink-0">
                    <div className="w-64 h-64">
                      <img
                        src={report.politician.headshotUrl}
                        alt={report.politician.name}
                        className="w-full h-full rounded-full object-cover border-4 border-neutral-200 shadow-lg"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-text-primary">
                        戦闘力 <span style={{ color: '#14b8a6' }}>{formatJapaneseCurrency(report.summary.incomeTotal)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-full max-w-md flex-shrink-0 -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Mobile Layout - Without headshot */}
                <div className="flex flex-col items-center gap-4 md:hidden">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">
                      戦闘力 <span style={{ color: '#14b8a6' }}>{formatJapaneseCurrency(report.summary.incomeTotal)}</span>
                    </p>
                  </div>
                  <div className="w-full -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} />
                  </div>
                </div>

                {/* Desktop Layout - Without headshot */}
                <div className="hidden md:flex md:flex-col md:items-center md:gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-text-primary">
                      戦闘力 <span style={{ color: '#14b8a6' }}>{formatJapaneseCurrency(report.summary.incomeTotal)}</span>
                    </p>
                  </div>
                  <div className="w-full max-w-md -my-4 mb-5">
                    <PoliticianRadarChart transactions={report.transactions} summary={report.summary} />
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
