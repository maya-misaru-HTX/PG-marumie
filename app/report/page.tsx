'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseReport } from '@/lib/types';
import SummaryCards from '@/components/summary/SummaryCards';
import IncomeExpenseBar from '@/components/charts/IncomeExpenseBar';
import CategoryPies from '@/components/charts/CategoryPies';
import TopDonors from '@/components/charts/TopDonors';
import TopRestaurants from '@/components/charts/TopRestaurants';
import TransactionTable from '@/components/table/TransactionTable';
import SectionNav from '@/components/navigation/SectionNav';
import { ArrowLeft } from 'lucide-react';

function ReportContent() {
  const router = useRouter();
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check sessionStorage for report data
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
  }, []);

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
                className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm text-text-primary hover:text-primary-600 transition-colors whitespace-nowrap -ml-[9px] md:-ml-[18px] font-medium"
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">戻る</span>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-3 ml-2 md:ml-5 min-w-0">
                <h1 className="text-base md:text-xl lg:text-2xl font-bold text-text-primary truncate">
                  {report.politician.name}
                </h1>
                <p className="text-xs md:text-sm lg:text-base text-text-secondary truncate">
                  {report.politician.organization} ({report.politician.fiscalYear}年度)
                </p>
              </div>
            </div>

            {/* Right: Section Navigation */}
            <div className="flex-1 min-w-0 flex justify-end">
              <SectionNav />
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-[30px] py-4 md:py-8">
        <div className="max-w-[826px] mx-auto space-y-4 md:space-y-8">

          {/* Summary Cards */}
          <SummaryCards summary={report.summary} />

          {/* Income & Expense Section */}
          <div id="income-expense" className="scroll-mt-24 space-y-8">
            <IncomeExpenseBar summary={report.summary} />

            {/* Grid layout with Income Pie and Top Donors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <CategoryPies income={report.income} expenses={report.expenses} />
              </div>
              <div id="top-donors" className="scroll-mt-24">
                <TopDonors transactions={report.transactions} incomeCategories={report.income.categories} />
              </div>
            </div>
          </div>

          {/* Top Restaurants Section */}
          <div id="top-restaurants" className="scroll-mt-24">
            <TopRestaurants transactions={report.transactions} />
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
