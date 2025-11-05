'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ExpenseReport } from '@/lib/types';
import { decodeReportFromURL, generateShareURL, copyToClipboard } from '@/lib/utils/urlState';
import SummaryCards from '@/components/summary/SummaryCards';
import IncomeExpenseBar from '@/components/charts/IncomeExpenseBar';
import CategoryPies from '@/components/charts/CategoryPies';
import MonthlyTrend from '@/components/charts/MonthlyTrend';
import TransactionTable from '@/components/table/TransactionTable';
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
    <div className="min-h-screen bg-neutral-50 py-12 px-4 md:px-8">
      <div className="max-w-[1032px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
              {report.politician.organization}
            </h1>
            <p className="text-text-secondary mt-2">
              {report.politician.name} | {report.politician.fiscalYear}年度
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={shareSuccess ? 'primary' : 'outline'}
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {shareSuccess ? 'コピーしました！' : 'URLをシェア'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={report.summary} />

        {/* Income vs Expense Bar Chart */}
        <IncomeExpenseBar summary={report.summary} />

        {/* Category Pie Charts */}
        <CategoryPies income={report.income} expenses={report.expenses} />

        {/* Monthly Trend */}
        {report.monthlyData && report.monthlyData.length > 0 && (
          <MonthlyTrend monthlyData={report.monthlyData} />
        )}

        {/* Transaction Table */}
        <TransactionTable transactions={report.transactions} />
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
