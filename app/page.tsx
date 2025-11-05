'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import FileUpload from '@/components/upload/FileUpload';
import { ExpenseReport } from '@/lib/types';
import { encodeReportToURL } from '@/lib/utils/urlState';

// Dynamically import PdfPromptGenerator to avoid SSR issues
const PdfPromptGenerator = dynamic(
  () => import('@/components/upload/PdfPromptGenerator').then((mod) => ({ default: mod.PdfPromptGenerator })),
  { ssr: false }
);

export default function Home() {
  const router = useRouter();
  const [failedPdfFile, setFailedPdfFile] = useState<File | null>(null);

  const handleReportLoaded = (report: ExpenseReport) => {
    try {
      // Store report in sessionStorage to avoid URL length limits (HTTP 431 errors)
      // This allows large CSV files to be processed without hitting URL size limits
      sessionStorage.setItem('currentReport', JSON.stringify(report));

      // Navigate to report page without data in URL
      // The report page will check sessionStorage first
      router.push('/report');
    } catch (error) {
      console.error('Error storing report:', error);
      // Fallback: try URL encoding for smaller reports
      try {
        const encoded = encodeReportToURL(report);
        router.push(`/report?data=${encoded}`);
      } catch (urlError) {
        alert('レポートデータが大きすぎます。CSVファイルのサイズを減らしてください。');
      }
    }
  };

  const handlePdfError = (file: File) => {
    // Pass the file to OCR tool
    setFailedPdfFile(file);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-6 px-4 md:py-12 md:px-8">
      <div className="max-w-[1032px] mx-auto space-y-6 md:space-y-12">
        <FileUpload onReportLoaded={handleReportLoaded} onPdfError={handlePdfError} />
        <PdfPromptGenerator autoStartFile={failedPdfFile} />
      </div>
    </div>
  );
}
