'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import PoliticianSummaryTable from '@/components/landing/PoliticianSummaryTable';
import { ExpenseReport } from '@/lib/types';
import { asoStaticReport, asoSummaryData } from '@/lib/data/aso-static-data';
import { ChevronDown, ChevronUp, Upload } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  const handleReportLoaded = (report: ExpenseReport) => {
    try {
      // Store report in sessionStorage
      sessionStorage.setItem('currentReport', JSON.stringify(report));

      // Navigate to report page
      router.push('/report');
    } catch (error) {
      console.error('Error storing report:', error);
      alert('レポートデータの保存に失敗しました。');
    }
  };

  const handleViewAsoDetails = () => {
    try {
      // Import enrichReportWithCalculations dynamically to avoid SSR issues
      import('@/lib/calculations/aggregations').then(({ enrichReportWithCalculations }) => {
        // Enrich the static report with calculated categories and monthly data
        const enrichedReport = enrichReportWithCalculations(asoStaticReport);

        // Store enriched report data in sessionStorage
        sessionStorage.setItem('currentReport', JSON.stringify(enrichedReport));

        // Open report page in new tab
        window.open('/report', '_blank');
      });
    } catch (error) {
      console.error('Error opening report:', error);
      alert('レポートを開けませんでした。');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-6 px-[30px] md:py-12">
      <div className="max-w-[826px] mx-auto space-y-6 md:space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            贅沢まる見え君 🔍
          </h1>
          <p className="text-text-secondary">
            政治家の収支報告書データを可視化します
          </p>
        </div>

        {/* Static Summary Table */}
        <PoliticianSummaryTable
          data={asoSummaryData}
          onViewDetails={handleViewAsoDetails}
        />

        {/* Upload Toggle Section */}
        <div className="border-2 border-transparent rounded-[22px] bg-white overflow-hidden">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-text-primary">
                他の政治家をチェック
              </span>
            </div>
            {showUpload ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </button>

          {showUpload && (
            <div className="px-6 pb-6 border-t border-neutral-200">
              <div className="pt-6">
                <FileUpload onReportLoaded={handleReportLoaded} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
