'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import PoliticianSummaryTable from '@/components/landing/PoliticianSummaryTable';
import { ExpenseReport } from '@/lib/types';
import { asoStaticReport, asoSummaryData } from '@/lib/data/aso-static-data';
import { hayashiStaticReport, hayashiSummaryData } from '@/lib/data/hayashi-static-data';
import { ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { calculateOverallScore, calculatePoliticianMBTIDetails } from '@/lib/calculations/scores';

export default function Home() {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  // Calculate scores and MBTI for politicians
  const enrichedSummaryData = useMemo(() => {
    const asoScore = calculateOverallScore(asoStaticReport.transactions, asoStaticReport.summary, asoStaticReport.politician);
    const asoMBTI = calculatePoliticianMBTIDetails(asoStaticReport.transactions, asoStaticReport.summary, asoStaticReport.politician);

    const hayashiScore = calculateOverallScore(hayashiStaticReport.transactions, hayashiStaticReport.summary, hayashiStaticReport.politician);
    const hayashiMBTI = calculatePoliticianMBTIDetails(hayashiStaticReport.transactions, hayashiStaticReport.summary, hayashiStaticReport.politician);

    return [
      { ...asoSummaryData, overallScore: asoScore, mbtiType: asoMBTI.typeName, mbtiTypeCode: asoMBTI.typeCode },
      { ...hayashiSummaryData, overallScore: hayashiScore, mbtiType: hayashiMBTI.typeName, mbtiTypeCode: hayashiMBTI.typeCode },
    ];
  }, []);

  const handleReportLoaded = (report: ExpenseReport) => {
    try {
      // Store report in sessionStorage
      sessionStorage.setItem('currentReport', JSON.stringify(report));

      // Navigate to custom report page
      router.push('/report/custom');
    } catch (error) {
      console.error('Error storing report:', error);
      alert('レポートデータの保存に失敗しました。');
    }
  };

  const handleViewDetails = (index: number) => {
    try {
      // Map index to politician slug
      const politicianSlugs = ['aso', 'hayashi'];
      const slug = politicianSlugs[index];

      if (slug) {
        // Open report page with unique URL in new tab
        window.open(`/report/${slug}`, '_blank');
      }
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
          data={enrichedSummaryData}
          onViewDetails={handleViewDetails}
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
              <ChevronUp className="w-6 h-6 text-text-secondary" />
            ) : (
              <ChevronDown className="w-6 h-6 text-text-secondary" />
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
