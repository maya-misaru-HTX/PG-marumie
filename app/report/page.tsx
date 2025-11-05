'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ExpenseReport } from '@/lib/types';
import { decodeReportFromURL, generateShareURL, copyToClipboard } from '@/lib/utils/urlState';
import SummaryCards from '@/components/summary/SummaryCards';
import IncomeExpenseBar from '@/components/charts/IncomeExpenseBar';
import CategoryPies from '@/components/charts/CategoryPies';
import MonthlyTrend from '@/components/charts/MonthlyTrend';
import TopDonors from '@/components/charts/TopDonors';
import TransactionTable from '@/components/table/TransactionTable';
import SectionNav from '@/components/navigation/SectionNav';
import Button from '@/components/ui/Button';
import { Share2, ArrowLeft } from 'lucide-react';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('レポートデータが見つかりません');
      return;
    }

    try {
      const decoded = decodeReportFromURL(dataParam);
      if (!decoded) {
        setError('レポートデータの読み込みに失敗しました');
        return;
      }
      setReport(decoded);
    } catch (err) {
      console.error('Decode error:', err);
      setError('レポートデータの解析に失敗しました');
    }
  }, [searchParams]);

  const handleShare = async () => {
    if (!report) return;

    try {
      const shareUrl = generateShareURL(report, window.location.origin);
      await copyToClipboard(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('Share error:', err);
      alert('URLのコピーに失敗しました');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-[1032px] mx-auto text-center">
          <div className="bg-white rounded-[22px] border border-black p-12">
            <h1 className="text-2xl font-bold text-text-primary mb-4">エラー</h1>
            <p className="text-text-secondary mb-8">{error}</p>
            <Button variant="primary" onClick={() => router.push('/')}>
              トップページに戻る
            </Button>
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
        <div className="max-w-[1032px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {/* Back Button + Politician Info */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-text-primary whitespace-nowrap">
                  {report.politician.name}
                </h1>
                <p className="text-xs text-text-secondary whitespace-nowrap">
                  {report.politician.fiscalYear}年度
                </p>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="flex-1 min-w-0">
              <SectionNav />
            </div>

            {/* Share Button */}
            <Button
              variant={shareSuccess ? 'primary' : 'outline'}
              onClick={handleShare}
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Share2 className="w-4 h-4" />
              {shareSuccess ? 'コピーしました！' : 'URLをシェア'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-4 md:px-8 py-8">
        <div className="max-w-[1032px] mx-auto space-y-8">
          {/* Summary Cards */}
          <SummaryCards summary={report.summary} />

          {/* Income & Expense Section */}
          <div id="income-expense" className="scroll-mt-24 space-y-8">
            <IncomeExpenseBar summary={report.summary} />
            <CategoryPies income={report.income} expenses={report.expenses} />
          </div>

          {/* Monthly Trend Section */}
          {report.monthlyData && report.monthlyData.length > 0 && (
            <div id="monthly-trend" className="scroll-mt-24">
              <MonthlyTrend monthlyData={report.monthlyData} />
            </div>
          )}

          {/* Top Donors Section */}
          <div id="top-donors" className="scroll-mt-24">
            <TopDonors transactions={report.transactions} />
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
